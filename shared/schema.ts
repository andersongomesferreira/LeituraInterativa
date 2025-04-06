import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (for parents)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("parent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
  name: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Children profiles table
export const childProfiles = pgTable("child_profiles", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  ageGroup: text("age_group").notNull(), // "3-5", "6-8", "9-12"
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChildProfileSchema = createInsertSchema(childProfiles).pick({
  parentId: true,
  name: true,
  ageGroup: true,
  avatar: true,
});

export type InsertChildProfile = z.infer<typeof insertChildProfileSchema>;
export type ChildProfile = typeof childProfiles.$inferSelect;

// Characters table
export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  personality: text("personality").notNull(),
  imageUrl: text("image_url").notNull(),
  isPremium: boolean("is_premium").default(false),
});

export const insertCharacterSchema = createInsertSchema(characters).pick({
  name: true,
  description: true,
  personality: true,
  imageUrl: true,
  isPremium: true,
});

export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Character = typeof characters.$inferSelect;

// Themes table
export const themes = pgTable("themes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  ageGroups: text("age_groups").array(), // ["3-5", "6-8", "9-12"]
  isPremium: boolean("is_premium").default(false),
});

export const insertThemeSchema = createInsertSchema(themes).pick({
  name: true,
  description: true,
  ageGroups: true,
  isPremium: true,
});

export type InsertTheme = z.infer<typeof insertThemeSchema>;
export type Theme = typeof themes.$inferSelect;

// Stories table
export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  ageGroup: text("age_group").notNull(), // "3-5", "6-8", "9-12"
  imageUrl: text("image_url"),
  characterIds: integer("character_ids").array(),
  themeId: integer("theme_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStorySchema = createInsertSchema(stories).pick({
  title: true,
  content: true,
  ageGroup: true,
  imageUrl: true,
  characterIds: true,
  themeId: true,
});

export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;

// Reading sessions table
export const readingSessions = pgTable("reading_sessions", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => childProfiles.id),
  storyId: integer("story_id").notNull().references(() => stories.id),
  progress: integer("progress").default(0), // 0-100 percentage
  completed: boolean("completed").default(false),
  duration: integer("duration").default(0), // in seconds
  lastReadAt: timestamp("last_read_at").defaultNow(),
});

export const insertReadingSessionSchema = createInsertSchema(readingSessions).pick({
  childId: true,
  storyId: true,
  progress: true,
  completed: true,
  duration: true,
});

export type InsertReadingSession = z.infer<typeof insertReadingSessionSchema>;
export type ReadingSession = typeof readingSessions.$inferSelect;

// Subscription plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "free", "plus", "family"
  price: integer("price").notNull(), // in cents
  description: text("description").notNull(),
  features: text("features").array(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).pick({
  name: true,
  price: true,
  description: true,
  features: true,
});

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// User subscriptions
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default("active"), // "active", "canceled", "expired"
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).pick({
  userId: true,
  planId: true,
  startDate: true,
  endDate: true,
  status: true,
});

export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
