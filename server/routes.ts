import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  generateStory, 
  generateAudioFromText, 
  generateImage, 
  generateCharacterImage, 
  generateChapterImage,
  extractChapters, 
  GenerateImageOptions 
} from "./services/openai";
import { insertUserSchema, insertChildProfileSchema, insertStorySchema, insertReadingSessionSchema } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import MemoryStore from "memorystore";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    isAuthenticated?: boolean;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Configure session
  const MemoryStoreInstance = MemoryStore(session);
  app.use(
    session({
      secret: "leiturinhabot-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
      store: new MemoryStoreInstance({
        checkPeriod: 86400000, // 24 hours
      }),
    })
  );

  // Configure passport
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Usuário não encontrado" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Senha incorreta" });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Não autorizado" });
  };

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }

      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email já está em uso" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(validatedData.password, salt);

      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Erro ao fazer login" });
        }
        
        // Don't send password to client
        const { password, ...userWithoutPassword } = user;
        
        return res.status(201).json({
          user: userWithoutPassword,
          message: "Usuário registrado com sucesso"
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Erro interno", error: err.message });
      }
      
      if (!user) {
        return res.status(401).json({ success: false, message: info?.message || "Credenciais inválidas" });
      }
      
      req.login(user, (loginErr: any) => {
        if (loginErr) {
          return res.status(500).json({ success: false, message: "Erro ao fazer login", error: loginErr.message });
        }
        
        // Don't send password to client
        const { password, ...userWithoutPassword } = user;
        
        // Set cookie headers explicitly to ensure they're sent correctly
        req.session.save((saveErr: any) => {
          if (saveErr) {
            return res.status(500).json({ success: false, message: "Erro ao salvar sessão", error: saveErr.message });
          }
          
          return res.json({
            success: true,
            user: userWithoutPassword,
            message: "Login realizado com sucesso"
          });
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  app.get("/api/auth/status", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      
      return res.json({
        isAuthenticated: true,
        user: userWithoutPassword
      });
    }
    
    res.json({
      isAuthenticated: false
    });
  });

  // Child profile routes
  app.get("/api/child-profiles", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const profiles = await storage.getChildProfilesByParentId(user.id);
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/child-profiles", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const validatedData = insertChildProfileSchema.parse({
        ...req.body,
        parentId: user.id
      });
      
      const childProfile = await storage.createChildProfile(validatedData);
      res.status(201).json(childProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/child-profiles/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const childId = parseInt(req.params.id);
      
      if (isNaN(childId)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const childProfile = await storage.getChildProfile(childId);
      
      if (!childProfile) {
        return res.status(404).json({ message: "Perfil não encontrado" });
      }
      
      if (childProfile.parentId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      res.json(childProfile);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Characters routes
  app.get("/api/characters", async (req, res) => {
    try {
      const isPremiumUser = req.isAuthenticated() && req.user;
      
      if (isPremiumUser) {
        const characters = await storage.getAllCharacters();
        res.json(characters);
      } else {
        const characters = await storage.getFreeCharacters();
        res.json(characters);
      }
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Themes routes
  app.get("/api/themes", async (req, res) => {
    try {
      const isPremiumUser = req.isAuthenticated() && req.user;
      const ageGroup = req.query.ageGroup as string;
      
      let themes;
      if (ageGroup) {
        themes = await storage.getThemesByAgeGroup(ageGroup);
      } else {
        themes = await storage.getAllThemes();
      }
      
      if (!isPremiumUser) {
        themes = themes.filter(theme => !theme.isPremium);
      }
      
      res.json(themes);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Story generation route
  app.post("/api/stories/generate", isAuthenticated, async (req, res) => {
    try {
      const { characters, theme, ageGroup, childName } = req.body;
      
      if (!characters || !theme || !ageGroup) {
        return res.status(400).json({ message: "Dados insuficientes para gerar história" });
      }
      
      // Validate characters and theme availability for user plan
      const isPremiumUser = req.isAuthenticated() && req.user;
      const charactersData = await Promise.all(
        characters.map((id: number) => storage.getCharacter(id))
      );
      
      const themeData = await storage.getTheme(theme);
      
      if (!themeData) {
        return res.status(404).json({ message: "Tema não encontrado" });
      }
      
      if (!isPremiumUser) {
        // Check if user is trying to use premium content
        const hasPremiumCharacter = charactersData.some(c => c && c.isPremium);
        const isPremiumTheme = themeData.isPremium;
        
        if (hasPremiumCharacter || isPremiumTheme) {
          return res.status(403).json({ 
            message: "Conteúdo premium não disponível no plano gratuito" 
          });
        }
      }
      
      // Generate story
      const characterNames = charactersData
        .filter(c => c !== undefined)
        .map(c => c!.name);
      
      const generatedStory = await generateStory({
        characters: characterNames,
        theme: themeData.name,
        ageGroup,
        childName
      });
      
      // Save story to database
      const story = await storage.createStory({
        title: generatedStory.title,
        content: generatedStory.content,
        ageGroup,
        imageUrl: "",
        characterIds: characters,
        themeId: theme
      });
      
      const responseData = {
        ...story,
        summary: generatedStory.summary,
        readingTime: generatedStory.readingTime,
        chapters: generatedStory.chapters
      };
      
      console.log("Enviando resposta de história gerada:", JSON.stringify({
        id: responseData.id,
        title: responseData.title,
        chaptersCount: responseData.chapters?.length || 0
      }));
      
      res.json(responseData);
    } catch (error) {
      console.error("Error generating story:", error);
      res.status(500).json({ message: "Erro ao gerar história" });
    }
  });

  // Get story by ID
  app.get("/api/stories/:id", isAuthenticated, async (req, res) => {
    try {
      const storyId = parseInt(req.params.id);
      
      if (isNaN(storyId)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const story = await storage.getStory(storyId);
      
      if (!story) {
        return res.status(404).json({ message: "História não encontrada" });
      }
      
      // Extrair capítulos do conteúdo da história
      const chapters = extractChapters(story.content);
      
      // Verificar se os capítulos têm imagens, caso contrário, gerar sob demanda
      const processedChapters = [...chapters];
      
      // Tratar geração de imagens em segundo plano (não bloquear a resposta)
      for (let i = 0; i < processedChapters.length; i++) {
        const chapter = processedChapters[i];
        
        // Se o capítulo tiver um prompt de imagem mas não tiver URL da imagem, gerar em background
        if (chapter.imagePrompt && !chapter.imageUrl) {
          // Não usar await aqui, pois não queremos bloquear a resposta
          (async () => {
            try {
              const characters = (story.characterIds || []).map(async (id) => {
                const char = await storage.getCharacter(id);
                return char ? char.name : "";
              });
              
              const resolvedCharacters = await Promise.all(characters);
              const image = await generateImage(chapter.imagePrompt!, {
                ageGroup: story.ageGroup as any,
                mood: "adventure"
              });
              
              // Atualizar o capítulo no array
              processedChapters[i] = {
                ...chapter,
                imageUrl: image.imageUrl
              };
              
              // Aqui poderíamos atualizar o banco de dados com a imagem gerada
              // mas isso exigiria criar novos endpoints para atualizar capítulos ou histórias
            } catch (error) {
              console.error(`Erro ao gerar imagem para capítulo ${i+1}:`, error);
            }
          })();
        }
      }
      
      res.json({
        ...story,
        chapters: processedChapters
      });
    } catch (error) {
      console.error("Erro ao buscar história:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Text to speech for story narration
  app.post("/api/stories/narrate", isAuthenticated, async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Texto não fornecido" });
      }
      
      const audioBase64 = await generateAudioFromText(text);
      res.json({ audio: audioBase64 });
    } catch (error) {
      console.error("Error generating audio:", error);
      res.status(500).json({ message: "Erro ao gerar áudio" });
    }
  });
  
  // Gerar imagem para um capítulo da história
  app.post("/api/stories/generateImage", isAuthenticated, async (req, res) => {
    try {
      const { prompt, options } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt não fornecido" });
      }
      
      const imageOptions: GenerateImageOptions = options || {};
      const generatedImage = await generateImage(prompt, imageOptions);
      res.json(generatedImage);
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ message: "Erro ao gerar imagem" });
    }
  });
  
  // Gerar imagem para um personagem
  app.post("/api/characters/generateImage", isAuthenticated, async (req, res) => {
    try {
      const { character, options } = req.body;
      
      if (!character) {
        return res.status(400).json({ message: "Nome do personagem não fornecido" });
      }
      
      const imageOptions: GenerateImageOptions = options || {};
      const generatedImage = await generateCharacterImage(character, imageOptions);
      res.json(generatedImage);
    } catch (error) {
      console.error("Error generating character image:", error);
      res.status(500).json({ message: "Erro ao gerar imagem do personagem" });
    }
  });
  
  // Gerar imagem para um capítulo específico da história
  app.post("/api/stories/generateChapterImage", isAuthenticated, async (req, res) => {
    try {
      const { chapterTitle, chapterContent, characters, options } = req.body;
      
      if (!chapterTitle || !chapterContent) {
        return res.status(400).json({ message: "Título e conteúdo do capítulo são obrigatórios" });
      }
      
      const imageOptions: GenerateImageOptions = options || {};
      const generatedImage = await generateChapterImage(
        chapterTitle,
        chapterContent,
        characters || [],
        imageOptions
      );
      
      res.json(generatedImage);
    } catch (error) {
      console.error("Error generating chapter image:", error);
      res.status(500).json({ message: "Erro ao gerar imagem do capítulo" });
    }
  });
  
  // Gerar ilustrações para todos os capítulos de uma história
  app.post("/api/stories/:id/generateIllustrations", isAuthenticated, async (req, res) => {
    try {
      const storyId = parseInt(req.params.id);
      const { options } = req.body;
      
      if (isNaN(storyId)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      // Buscar história
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ message: "História não encontrada" });
      }
      
      // Extrair capítulos
      const chapters = extractChapters(story.content);
      if (chapters.length === 0) {
        return res.status(400).json({ message: "Não foi possível extrair capítulos da história" });
      }
      
      console.log(`Gerando ilustrações para ${chapters.length} capítulos da história "${story.title}"...`);
      
      // Buscar personagens
      const characterIds = story.characterIds as number[];
      const characters = await Promise.all(
        characterIds.map((id: number) => storage.getCharacter(id))
      );
      const characterNames = characters
        .filter(c => c !== undefined)
        .map(c => c!.name);
      
      // Configurar opções padrão baseadas na faixa etária da história
      const imageOptions: GenerateImageOptions = {
        ...options,
        ageGroup: story.ageGroup
      };
      
      // Gerar ilustrações para cada capítulo em paralelo
      const illustrationPromises = chapters.map(async (chapter, index) => {
        try {
          console.log(`Gerando ilustração para o capítulo ${index + 1}: ${chapter.title}`);
          
          const generatedImage = await generateChapterImage(
            chapter.title,
            chapter.content,
            characterNames,
            imageOptions
          );
          
          // Atualizar o capítulo com a URL da imagem
          chapters[index].imageUrl = generatedImage.imageUrl;
          return { success: true, chapter: index, imageUrl: generatedImage.imageUrl };
        } catch (error) {
          console.error(`Erro ao gerar ilustração para o capítulo ${index + 1}:`, error);
          return { success: false, chapter: index, error: (error as Error).message };
        }
      });
      
      // Aguardar todas as promessas de geração de imagens
      const results = await Promise.allSettled(illustrationPromises);
      
      // Contar quantas ilustrações foram geradas com sucesso
      const successCount = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
      
      // Mapear os resultados para um formato mais amigável
      const illustrationResults = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          const value = result.value as any;
          return {
            chapter: index,
            title: chapters[index].title,
            success: value.success,
            imageUrl: value.imageUrl || null,
            error: value.error || null
          };
        } else {
          return {
            chapter: index,
            title: chapters[index].title,
            success: false,
            imageUrl: null,
            error: result.reason || "Erro desconhecido"
          };
        }
      });
      
      res.json({
        storyId,
        totalChapters: chapters.length,
        successfulIllustrations: successCount,
        chapters: illustrationResults,
        chaptersWithImages: chapters
      });
    } catch (error) {
      console.error("Erro ao gerar ilustrações para a história:", error);
      res.status(500).json({ message: "Erro ao gerar ilustrações para a história" });
    }
  });

  // Reading session routes
  app.post("/api/reading-sessions", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertReadingSessionSchema.parse(req.body);
      
      // Validate child belongs to parent
      const user = req.user as any;
      const childProfile = await storage.getChildProfile(validatedData.childId);
      
      if (!childProfile || childProfile.parentId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const readingSession = await storage.createReadingSession(validatedData);
      res.status(201).json(readingSession);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.patch("/api/reading-sessions/:id", isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const session = await storage.getReadingSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Sessão não encontrada" });
      }
      
      // Validate child belongs to parent
      const user = req.user as any;
      const childProfile = await storage.getChildProfile(session.childId);
      
      if (!childProfile || childProfile.parentId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const updatedSession = await storage.updateReadingSession(sessionId, req.body);
      res.json(updatedSession);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/reading-sessions/child/:childId", isAuthenticated, async (req, res) => {
    try {
      const childId = parseInt(req.params.childId);
      
      if (isNaN(childId)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      // Validate child belongs to parent
      const user = req.user as any;
      const childProfile = await storage.getChildProfile(childId);
      
      if (!childProfile || childProfile.parentId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const sessions = await storage.getReadingSessionsByChildId(childId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Subscription routes
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getAllSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/user-subscription", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const subscription = await storage.getUserSubscription(user.id);
      
      if (!subscription) {
        return res.status(404).json({ message: "Assinatura não encontrada" });
      }
      
      const plan = await storage.getSubscriptionPlan(subscription.planId);
      
      res.json({
        subscription,
        plan
      });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Simulate subscription update (in a real app this would connect to a payment gateway)
  app.post("/api/subscribe", isAuthenticated, async (req, res) => {
    try {
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: "ID do plano não fornecido" });
      }
      
      const plan = await storage.getSubscriptionPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Plano não encontrado" });
      }
      
      const user = req.user as any;
      const currentSubscription = await storage.getUserSubscription(user.id);
      
      if (currentSubscription) {
        // Update existing subscription
        await storage.updateUserSubscription(currentSubscription.id, {
          planId,
          status: "active"
        });
      } else {
        // Create new subscription
        await storage.createUserSubscription({
          userId: user.id,
          planId,
          startDate: new Date(),
          endDate: undefined,
          status: "active"
        });
      }
      
      res.json({ 
        message: "Assinatura atualizada com sucesso",
        plan
      });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  return httpServer;
}
