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
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  sessionStore: session.Store;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Child profile methods
  getChildProfile(id: number): Promise<ChildProfile | undefined>;
  getChildProfilesByParentId(parentId: number): Promise<ChildProfile[]>;
  createChildProfile(profile: InsertChildProfile): Promise<ChildProfile>;
  updateChildProfile(id: number, profile: Partial<InsertChildProfile>): Promise<ChildProfile | undefined>;
  
  // Character methods
  getCharacter(id: number): Promise<Character | undefined>;
  getAllCharacters(): Promise<Character[]>;
  getFreeCharacters(): Promise<Character[]>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  
  // Theme methods
  getTheme(id: number): Promise<Theme | undefined>;
  getAllThemes(): Promise<Theme[]>;
  getFreeThemes(): Promise<Theme[]>;
  getThemesByAgeGroup(ageGroup: string): Promise<Theme[]>;
  createTheme(theme: InsertTheme): Promise<Theme>;
  
  // Story methods
  getStory(id: number): Promise<Story | undefined>;
  getStoriesByChildId(childId: number): Promise<Story[]>;
  createStory(story: InsertStory): Promise<Story>;
  
  // Reading session methods
  getReadingSession(id: number): Promise<ReadingSession | undefined>;
  getReadingSessionsByChildId(childId: number): Promise<ReadingSession[]>;
  createReadingSession(session: InsertReadingSession): Promise<ReadingSession>;
  updateReadingSession(id: number, session: Partial<InsertReadingSession>): Promise<ReadingSession | undefined>;
  
  // Subscription methods
  getAllSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  getUserSubscription(userId: number): Promise<UserSubscription | undefined>;
  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: number, subscription: Partial<InsertUserSubscription>): Promise<UserSubscription | undefined>;
}

export class MemStorage implements IStorage {
  sessionStore: session.Store;
  private users: Map<number, User>;
  private childProfiles: Map<number, ChildProfile>;
  private characters: Map<number, Character>;
  private themes: Map<number, Theme>;
  private stories: Map<number, Story>;
  private readingSessions: Map<number, ReadingSession>;
  private subscriptionPlans: Map<number, SubscriptionPlan>;
  private userSubscriptions: Map<number, UserSubscription>;
  
  private currentUserId: number;
  private currentChildProfileId: number;
  private currentCharacterId: number;
  private currentThemeId: number;
  private currentStoryId: number;
  private currentReadingSessionId: number;
  private currentSubscriptionPlanId: number;
  private currentUserSubscriptionId: number;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    this.users = new Map();
    this.childProfiles = new Map();
    this.characters = new Map();
    this.themes = new Map();
    this.stories = new Map();
    this.readingSessions = new Map();
    this.subscriptionPlans = new Map();
    this.userSubscriptions = new Map();
    
    this.currentUserId = 1;
    this.currentChildProfileId = 1;
    this.currentCharacterId = 1;
    this.currentThemeId = 1;
    this.currentStoryId = 1;
    this.currentReadingSessionId = 1;
    this.currentSubscriptionPlanId = 1;
    this.currentUserSubscriptionId = 1;
    
    // Initialize with default data
    this.initializeDefaultData();
  }

  // Initialize default data for demo purposes
  private async initializeDefaultData() {
    // Create subscription plans
    const freePlan: InsertSubscriptionPlan = {
      name: "Plano Gratuito",
      price: 0,
      description: "Plano básico com funcionalidades limitadas",
      features: ["5 histórias por mês", "5 personagens básicos", "3 temas por faixa etária", "Interface básica de leitura"]
    };
    
    const plusPlan: InsertSubscriptionPlan = {
      name: "Plano Leiturinha Plus",
      price: 1490, // R$14,90
      description: "Plano intermediário com mais funcionalidades",
      features: ["Histórias ilimitadas", "Todos os personagens", "Todos os temas disponíveis", "Narração por voz de qualidade", "Sem anúncios", "Download em PDF"]
    };
    
    const familyPlan: InsertSubscriptionPlan = {
      name: "Plano Família",
      price: 2990, // R$29,90
      description: "Plano completo para toda a família",
      features: ["Todas as funcionalidades do Plus", "Até 4 perfis de crianças", "Histórias personalizadas com nome da criança", "Analytics avançados de leitura", "Suporte prioritário", "Recursos educacionais exclusivos"]
    };
    
    await this.createSubscriptionPlan(freePlan);
    await this.createSubscriptionPlan(plusPlan);
    await this.createSubscriptionPlan(familyPlan);
    
    // Create default characters
    const leoChar: InsertCharacter = {
      name: "Léo, o Leão",
      description: "Um leão explorador e corajoso",
      personality: "Corajoso, aventureiro e líder",
      imageUrl: "https://cdn3.iconfinder.com/data/icons/animal-flat-colors/64/lion-512.png",
      isPremium: false
    };
    
    const biaChar: InsertCharacter = {
      name: "Bia, a Borboleta",
      description: "Uma borboleta curiosa e gentil",
      personality: "Curiosa, gentil e artística",
      imageUrl: "https://cdn3.iconfinder.com/data/icons/spring-2-1/30/Butterfly-512.png",
      isPremium: false
    };
    
    const pedroChar: InsertCharacter = {
      name: "Pedro, o Polvo",
      description: "Um polvo inteligente e criativo",
      personality: "Inteligente, criativo e prestativo",
      imageUrl: "https://cdn3.iconfinder.com/data/icons/ocean-life/500/Octopus-512.png",
      isPremium: false
    };
    
    const lunaChar: InsertCharacter = {
      name: "Luna, a Loba",
      description: "Uma loba protetora e sábia",
      personality: "Protetora, sábia e leal",
      imageUrl: "https://cdn3.iconfinder.com/data/icons/animal-flat-colors/64/wolf-512.png",
      isPremium: false
    };
    
    const teoChar: InsertCharacter = {
      name: "Teo, o Tucano",
      description: "Um tucano músico e divertido",
      personality: "Músico, divertido e comunicativo",
      imageUrl: "https://cdn3.iconfinder.com/data/icons/bird-set-ii-1/512/toucan-512.png",
      isPremium: false
    };
    
    // Premium characters
    const ninaChar: InsertCharacter = {
      name: "Nina, a Naja",
      description: "Uma naja sábia e misteriosa",
      personality: "Sábia, misteriosa e calma",
      imageUrl: "https://cdn3.iconfinder.com/data/icons/animal-flat-colors/64/snake-512.png",
      isPremium: true
    };
    
    const maxChar: InsertCharacter = {
      name: "Max, o Macaco",
      description: "Um macaco ágil e brincalhão",
      personality: "Ágil, brincalhão e inteligente",
      imageUrl: "https://cdn3.iconfinder.com/data/icons/animal-flat-colors/64/monkey-512.png",
      isPremium: true
    };
    
    await this.createCharacter(leoChar);
    await this.createCharacter(biaChar);
    await this.createCharacter(pedroChar);
    await this.createCharacter(lunaChar);
    await this.createCharacter(teoChar);
    await this.createCharacter(ninaChar);
    await this.createCharacter(maxChar);
    
    // Create default themes
    const amizadeTheme: InsertTheme = {
      name: "Amizade",
      description: "Histórias sobre o valor da amizade e trabalho em equipe",
      ageGroups: ["3-5", "6-8", "9-12"],
      isPremium: false
    };
    
    const naturezaTheme: InsertTheme = {
      name: "Natureza e Meio Ambiente",
      description: "Histórias sobre a importância de cuidar da natureza",
      ageGroups: ["3-5", "6-8", "9-12"],
      isPremium: false
    };
    
    const aventuraTheme: InsertTheme = {
      name: "Aventuras Incríveis",
      description: "Histórias de aventuras emocionantes e descobertas",
      ageGroups: ["6-8", "9-12"],
      isPremium: false
    };
    
    // Premium themes
    const espacoTheme: InsertTheme = {
      name: "Explorando o Espaço",
      description: "Histórias sobre viagens espaciais e descobertas cósmicas",
      ageGroups: ["6-8", "9-12"],
      isPremium: true
    };
    
    const medoTheme: InsertTheme = {
      name: "Superando Medos",
      description: "Histórias sobre como enfrentar e superar medos",
      ageGroups: ["3-5", "6-8", "9-12"],
      isPremium: true
    };
    
    await this.createTheme(amizadeTheme);
    await this.createTheme(naturezaTheme);
    await this.createTheme(aventuraTheme);
    await this.createTheme(espacoTheme);
    await this.createTheme(medoTheme);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const timestamp = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: timestamp,
      role: insertUser.role || "parent"
    };
    this.users.set(id, user);
    
    // Automatically create a free subscription for new users
    await this.createUserSubscription({
      userId: id,
      planId: 1, // Free plan
      startDate: timestamp,
      endDate: null,
      status: "active"
    });
    
    return user;
  }

  // Child profile methods
  async getChildProfile(id: number): Promise<ChildProfile | undefined> {
    return this.childProfiles.get(id);
  }

  async getChildProfilesByParentId(parentId: number): Promise<ChildProfile[]> {
    return Array.from(this.childProfiles.values()).filter(
      (profile) => profile.parentId === parentId,
    );
  }

  async createChildProfile(profile: InsertChildProfile): Promise<ChildProfile> {
    const id = this.currentChildProfileId++;
    const childProfile: ChildProfile = { 
      ...profile, 
      id, 
      createdAt: new Date(),
      avatar: profile.avatar || null
    };
    this.childProfiles.set(id, childProfile);
    return childProfile;
  }

  async updateChildProfile(id: number, profile: Partial<InsertChildProfile>): Promise<ChildProfile | undefined> {
    const existingProfile = this.childProfiles.get(id);
    if (!existingProfile) return undefined;
    
    const updatedProfile: ChildProfile = { ...existingProfile, ...profile };
    this.childProfiles.set(id, updatedProfile);
    return updatedProfile;
  }

  // Character methods
  async getCharacter(id: number): Promise<Character | undefined> {
    return this.characters.get(id);
  }

  async getAllCharacters(): Promise<Character[]> {
    return Array.from(this.characters.values());
  }

  async getFreeCharacters(): Promise<Character[]> {
    return Array.from(this.characters.values()).filter(
      (character) => !character.isPremium,
    );
  }

  async createCharacter(character: InsertCharacter): Promise<Character> {
    const id = this.currentCharacterId++;
    const newCharacter: Character = { 
      ...character, 
      id,
      isPremium: character.isPremium || false
    };
    this.characters.set(id, newCharacter);
    return newCharacter;
  }

  // Theme methods
  async getTheme(id: number): Promise<Theme | undefined> {
    return this.themes.get(id);
  }

  async getAllThemes(): Promise<Theme[]> {
    return Array.from(this.themes.values());
  }

  async getFreeThemes(): Promise<Theme[]> {
    return Array.from(this.themes.values()).filter(
      (theme) => !theme.isPremium,
    );
  }

  async getThemesByAgeGroup(ageGroup: string): Promise<Theme[]> {
    return Array.from(this.themes.values()).filter(
      (theme) => theme.ageGroups?.includes(ageGroup),
    );
  }

  async createTheme(theme: InsertTheme): Promise<Theme> {
    const id = this.currentThemeId++;
    const newTheme: Theme = { 
      ...theme, 
      id,
      isPremium: theme.isPremium || false,
      ageGroups: theme.ageGroups || []
    };
    this.themes.set(id, newTheme);
    return newTheme;
  }

  // Story methods
  async getStory(id: number): Promise<Story | undefined> {
    return this.stories.get(id);
  }

  async getStoriesByChildId(childId: number): Promise<Story[]> {
    const childSessions = await this.getReadingSessionsByChildId(childId);
    const storyIds = new Set(childSessions.map(session => session.storyId));
    
    return Array.from(this.stories.values()).filter(
      (story) => storyIds.has(story.id),
    );
  }

  async createStory(story: InsertStory): Promise<Story> {
    const id = this.currentStoryId++;
    const newStory: Story = { 
      ...story, 
      id, 
      createdAt: new Date(),
      imageUrl: story.imageUrl || null,
      characterIds: story.characterIds || []
    };
    this.stories.set(id, newStory);
    return newStory;
  }

  // Reading session methods
  async getReadingSession(id: number): Promise<ReadingSession | undefined> {
    return this.readingSessions.get(id);
  }

  async getReadingSessionsByChildId(childId: number): Promise<ReadingSession[]> {
    return Array.from(this.readingSessions.values()).filter(
      (session) => session.childId === childId,
    );
  }

  async createReadingSession(session: InsertReadingSession): Promise<ReadingSession> {
    const id = this.currentReadingSessionId++;
    const newSession: ReadingSession = { 
      ...session, 
      id, 
      lastReadAt: new Date(),
      progress: session.progress || 0,
      completed: session.completed || false,
      duration: session.duration || 0
    };
    this.readingSessions.set(id, newSession);
    return newSession;
  }

  async updateReadingSession(id: number, session: Partial<InsertReadingSession>): Promise<ReadingSession | undefined> {
    const existingSession = this.readingSessions.get(id);
    if (!existingSession) return undefined;
    
    const updatedSession: ReadingSession = { 
      ...existingSession, 
      ...session, 
      lastReadAt: new Date() 
    };
    
    this.readingSessions.set(id, updatedSession);
    return updatedSession;
  }

  // Subscription methods
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlans.values());
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    return this.subscriptionPlans.get(id);
  }

  async getUserSubscription(userId: number): Promise<UserSubscription | undefined> {
    return Array.from(this.userSubscriptions.values()).find(
      (subscription) => subscription.userId === userId && subscription.status === "active",
    );
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const id = this.currentSubscriptionPlanId++;
    const newPlan: SubscriptionPlan = { 
      ...plan, 
      id,
      features: plan.features || []
    };
    this.subscriptionPlans.set(id, newPlan);
    return newPlan;
  }

  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    const id = this.currentUserSubscriptionId++;
    const newSubscription: UserSubscription = { 
      ...subscription, 
      id,
      status: subscription.status || "active",
      startDate: subscription.startDate || new Date(),
      endDate: subscription.endDate || null
    };
    this.userSubscriptions.set(id, newSubscription);
    return newSubscription;
  }

  async updateUserSubscription(id: number, subscription: Partial<InsertUserSubscription>): Promise<UserSubscription | undefined> {
    const existingSubscription = this.userSubscriptions.get(id);
    if (!existingSubscription) return undefined;
    
    const updatedSubscription: UserSubscription = { ...existingSubscription, ...subscription };
    this.userSubscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }
}

// Import DatabaseStorage
import { DatabaseStorage } from "./database-storage";

// Use PostgreSQL for storage in production
export const storage = new DatabaseStorage();