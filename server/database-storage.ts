import { 
  users, type User, type InsertUser,
  childProfiles, type ChildProfile, type InsertChildProfile,
  characters, type Character, type InsertCharacter,
  themes, type Theme, type InsertTheme,
  stories, type Story, type InsertStory,
  readingSessions, type ReadingSession, type InsertReadingSession,
  subscriptionPlans, type SubscriptionPlan, type InsertSubscriptionPlan,
  userSubscriptions, type UserSubscription, type InsertUserSubscription
} from "@shared/schema";
import { db } from "./db";
import { eq, inArray, and, desc, sql } from "drizzle-orm";
import createMemoryStore from "memorystore";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

import { IStorage } from "./storage";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool, 
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    
    // Automatically create a free subscription for new users
    await this.createUserSubscription({
      userId: user.id,
      planId: 1, // Free plan
      startDate: new Date(),
      endDate: null,
      status: "active"
    });
    
    return user;
  }

  // Child profile methods
  async getChildProfile(id: number): Promise<ChildProfile | undefined> {
    const [profile] = await db.select().from(childProfiles).where(eq(childProfiles.id, id));
    return profile;
  }

  async getChildProfilesByParentId(parentId: number): Promise<ChildProfile[]> {
    return await db.select().from(childProfiles).where(eq(childProfiles.parentId, parentId));
  }

  async createChildProfile(profile: InsertChildProfile): Promise<ChildProfile> {
    const [childProfile] = await db.insert(childProfiles).values(profile).returning();
    return childProfile;
  }

  async updateChildProfile(id: number, profile: Partial<InsertChildProfile>): Promise<ChildProfile | undefined> {
    const [updatedProfile] = await db
      .update(childProfiles)
      .set(profile)
      .where(eq(childProfiles.id, id))
      .returning();
    return updatedProfile;
  }

  // Character methods
  async getCharacter(id: number): Promise<Character | undefined> {
    const [character] = await db.select().from(characters).where(eq(characters.id, id));
    return character;
  }

  async getAllCharacters(): Promise<Character[]> {
    return await db.select().from(characters);
  }

  async getFreeCharacters(): Promise<Character[]> {
    return await db.select().from(characters).where(eq(characters.isPremium, false));
  }

  async createCharacter(character: InsertCharacter): Promise<Character> {
    const [newCharacter] = await db.insert(characters).values(character).returning();
    return newCharacter;
  }

  // Theme methods
  async getTheme(id: number): Promise<Theme | undefined> {
    const [theme] = await db.select().from(themes).where(eq(themes.id, id));
    return theme;
  }

  async getAllThemes(): Promise<Theme[]> {
    return await db.select().from(themes);
  }

  async getFreeThemes(): Promise<Theme[]> {
    return await db.select().from(themes).where(eq(themes.isPremium, false));
  }

  async getThemesByAgeGroup(ageGroup: string): Promise<Theme[]> {
    // Using SQL expression since array contains is challenging with Drizzle
    return await db.select().from(themes).where(
      sql`${ageGroup} = ANY(${themes.ageGroups})`
    );
  }

  async createTheme(theme: InsertTheme): Promise<Theme> {
    const [newTheme] = await db.insert(themes).values(theme).returning();
    return newTheme;
  }

  // Story methods
  async getStory(id: number): Promise<Story | undefined> {
    const [story] = await db.select().from(stories).where(eq(stories.id, id));
    return story;
  }

  async getStoriesByChildId(childId: number): Promise<Story[]> {
    // First get all reading sessions for this child
    const sessions = await db.select()
      .from(readingSessions)
      .where(eq(readingSessions.childId, childId));
    
    // Extract the story ids
    const storyIds = sessions.map(session => session.storyId);
    
    if (storyIds.length === 0) {
      return [];
    }
    
    // Then get all stories with those ids
    return await db.select()
      .from(stories)
      .where(inArray(stories.id, storyIds));
  }

  async createStory(story: InsertStory): Promise<Story> {
    const [newStory] = await db.insert(stories).values(story).returning();
    return newStory;
  }

  // Reading session methods
  async getReadingSession(id: number): Promise<ReadingSession | undefined> {
    const [session] = await db.select().from(readingSessions).where(eq(readingSessions.id, id));
    return session;
  }

  async getReadingSessionsByChildId(childId: number): Promise<ReadingSession[]> {
    return await db.select()
      .from(readingSessions)
      .where(eq(readingSessions.childId, childId))
      .orderBy(desc(readingSessions.lastReadAt));
  }

  async createReadingSession(session: InsertReadingSession): Promise<ReadingSession> {
    const [newSession] = await db.insert(readingSessions).values({
      ...session,
      lastReadAt: new Date()
    }).returning();
    return newSession;
  }

  async updateReadingSession(id: number, session: Partial<InsertReadingSession>): Promise<ReadingSession | undefined> {
    const [updatedSession] = await db
      .update(readingSessions)
      .set({
        ...session,
        lastReadAt: new Date()
      })
      .where(eq(readingSessions.id, id))
      .returning();
    return updatedSession;
  }

  // Subscription methods
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans);
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async getUserSubscription(userId: number): Promise<UserSubscription | undefined> {
    const [subscription] = await db.select()
      .from(userSubscriptions)
      .where(and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, "active")
      ));
    return subscription;
  }

  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    const [newSubscription] = await db.insert(userSubscriptions).values(subscription).returning();
    return newSubscription;
  }

  async updateUserSubscription(id: number, subscription: Partial<InsertUserSubscription>): Promise<UserSubscription | undefined> {
    const [updatedSubscription] = await db
      .update(userSubscriptions)
      .set(subscription)
      .where(eq(userSubscriptions.id, id))
      .returning();
    return updatedSubscription;
  }
}