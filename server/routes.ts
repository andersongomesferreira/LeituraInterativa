import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  generateStory, 
  generateAudioFromText, 
  generateImage, 
  generateCharacterImage, 
  generateChapterImage,
  extractChapters
} from "./services/ai-service";

// Tipo para opções de geração de imagens
interface GenerateImageOptions {
  style?: "cartoon" | "watercolor" | "pencil" | "digital";
  mood?: "happy" | "adventure" | "calm" | "exciting";
  backgroundColor?: string;
  characterStyle?: "cute" | "funny" | "heroic";
  ageGroup?: "3-5" | "6-8" | "9-12";
  // Novos parâmetros para consistência de personagens
  storyId?: number;
  chapterId?: number;
  characterDescriptions?: Array<{
    name: string;
    appearance?: string;
    visualAttributes?: {
      colors: string[];
      clothing?: string;
      distinguishingFeatures?: string[];
    };
    previousImages?: string[];
  }>;
}
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

import { getAIProvidersStatus } from "./services/ai-service";

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
      
      // Iniciar geração automática de ilustrações em segundo plano
      if (responseData.chapters && responseData.chapters.length > 0) {
        // Não aguardamos a conclusão para não bloquear a resposta
        (async () => {
          try {
            console.log(`Iniciando geração automática de ilustrações para história "${story.title}" (ID: ${story.id})...`);
            
            // Importação dinâmica para evitar problemas de dependência circular
            const { characterConsistencyService } = await import('./services/character-consistency-service');
            
            // Buscar personagens para a geração de ilustrações
            const characterNames = charactersData
              .filter(c => c !== undefined)
              .map(c => c!.name);
            
            // Obter descrições detalhadas dos personagens para manter consistência visual
            const characterDescriptions = await characterConsistencyService.getCharacterDescriptions(
              story.id, 
              characterNames
            );
            
            // Configurar opções padrão baseadas na faixa etária da história
            const imageOptions: GenerateImageOptions = {
              style: "cartoon",
              mood: "adventure",
              ageGroup,
              storyId: story.id,
              characterDescriptions
            };
            
            // Extrair capítulos 
            const chapters = responseData.chapters;
            
            // Gerar primeiro capítulo imediatamente para feedback rápido
            if (chapters.length > 0) {
              console.log(`Priorizando ilustração para o primeiro capítulo: "${chapters[0].title}"`);
              
              try {
                const firstChapterImage = await generateChapterImage(
                  chapters[0].title,
                  chapters[0].content,
                  characterNames,
                  {
                    ...imageOptions,
                    chapterId: 1
                  }
                );
                
                chapters[0].imageUrl = firstChapterImage.imageUrl;
                
                // Atualizar as descrições dos personagens com base nessa primeira imagem
                characterConsistencyService.updateCharacterVisuals(story.id, 
                  characterNames.map(name => ({
                    name,
                    description: chapters[0].content,
                    imageUrl: firstChapterImage.imageUrl
                  }))
                );
              } catch (error) {
                console.error("Erro ao gerar ilustração para o primeiro capítulo:", error);
              }
            }
            
            // Gerar ilustrações para os capítulos restantes em paralelo com atraso escalonado
            // Isso permite que o usuário comece a ler enquanto as ilustrações são geradas
            const illustrationPromises = chapters.slice(1).map(async (chapter, index) => {
              try {
                // Pequeno atraso para evitar sobrecarregar a API e dar tempo para o usuário ler
                // Capítulos posteriores têm espera progressivamente maior
                await new Promise(resolve => setTimeout(resolve, (index + 1) * 3000));
                
                console.log(`Gerando ilustração automática para capítulo ${index + 2}/${chapters.length}: "${chapter.title}"`);
                
                // Obter descrições atualizadas dos personagens após ilustrações anteriores
                const updatedCharacterDescriptions = await characterConsistencyService.getCharacterDescriptions(
                  story.id, 
                  characterNames
                );
                
                const generatedImage = await generateChapterImage(
                  chapter.title,
                  chapter.content,
                  characterNames,
                  {
                    ...imageOptions,
                    characterDescriptions: updatedCharacterDescriptions,
                    chapterId: index + 2  // +2 porque começamos do capítulo 2 (capítulo 1 já foi gerado)
                  }
                );
                
                chapter.imageUrl = generatedImage.imageUrl;
                
                // Atualizar as descrições dos personagens após cada capítulo
                characterConsistencyService.updateCharacterVisuals(story.id, 
                  characterNames.map(name => ({
                    name,
                    description: chapter.content,
                    imageUrl: generatedImage.imageUrl
                  }))
                );
                
                return { success: true, chapter: index + 1, imageUrl: generatedImage.imageUrl };
              } catch (error) {
                console.error(`Erro ao gerar ilustração para o capítulo ${index + 2}:`, error);
                return { success: false, chapter: index + 1, error: (error as Error).message };
              }
            });
            
            // Aguardar todas as promessas de geração de imagens
            const results = await Promise.allSettled(illustrationPromises);
            const successCount = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
            const totalGenerated = successCount + (chapters[0].imageUrl ? 1 : 0);
            
            console.log(`Concluída geração automática de ilustrações: ${totalGenerated}/${chapters.length} imagens geradas com sucesso`);
            
          } catch (error) {
            console.error("Erro no processo em segundo plano de geração de ilustrações:", error);
          }
        })();
      }
      
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
      
      // Buscar personagens para a geração de ilustrações
      const characterIdsArray = story.characterIds || [];
      const characterPromises = characterIdsArray.map(async (id) => {
        try {
          const char = await storage.getCharacter(Number(id));
          return char ? char.name : "";
        } catch (error) {
          console.error(`Erro ao buscar personagem com ID ${id}:`, error);
          return "";
        }
      });
      
      const characterNames = (await Promise.all(characterPromises)).filter(name => name.length > 0);
      
      // Tratar geração de imagens em segundo plano (não bloquear a resposta)
      if (processedChapters.some(chapter => !chapter.imageUrl)) {
        // Iniciar processo de geração de imagens em segundo plano
        (async () => {
          try {
            // Importação dinâmica para evitar problemas de dependência circular
            const { characterConsistencyService } = await import('./services/character-consistency-service');
            
            // Obter descrições detalhadas dos personagens para manter consistência visual
            const characterDescriptions = await characterConsistencyService.getCharacterDescriptions(
              story.id, 
              characterNames
            );
            
            // Configurar opções padrão baseadas na faixa etária da história
            const imageOptions = {
              style: "cartoon",
              mood: "adventure",
              ageGroup: story.ageGroup as any,
              storyId: story.id,
              characterDescriptions
            };
            
            // Processar capítulos sem imagens
            for (let i = 0; i < processedChapters.length; i++) {
              const chapter = processedChapters[i];
              
              // Se o capítulo não tiver URL da imagem, gerar de forma assíncrona
              if (!chapter.imageUrl) {
                try {
                  console.log(`Gerando ilustração em segundo plano para capítulo ${i+1}: "${chapter.title}"`);
                  
                  // Obter descrições atualizadas dos personagens após ilustrações anteriores
                  const updatedCharacterDescriptions = await characterConsistencyService.getCharacterDescriptions(
                    story.id, 
                    characterNames
                  );
                  
                  const generatedImage = await generateChapterImage(
                    chapter.title,
                    chapter.content,
                    characterNames,
                    {
                      ...imageOptions,
                      characterDescriptions: updatedCharacterDescriptions,
                      chapterId: i + 1
                    }
                  );
                  
                  // Atualizar o capítulo no array
                  processedChapters[i] = {
                    ...chapter,
                    imageUrl: generatedImage.imageUrl
                  };
                  
                  // Atualizar as descrições dos personagens após cada capítulo
                  characterConsistencyService.updateCharacterVisuals(story.id, 
                    characterNames.map(name => ({
                      name,
                      description: chapter.content,
                      imageUrl: generatedImage.imageUrl
                    }))
                  );
                  
                  console.log(`Imagem gerada com sucesso para capítulo ${i+1}`);
                } catch (error) {
                  console.error(`Erro ao gerar imagem para capítulo ${i+1}:`, error);
                }
                
                // Pequeno atraso entre solicitações de geração de imagens
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
            
            console.log(`Processo de geração de imagens em segundo plano concluído para história ${story.id}`);
          } catch (error) {
            console.error("Erro no processo de geração de imagens em segundo plano:", error);
          }
        })();
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
      
      // Iniciar geração de imagens em segundo plano
      // Retornar imediatamente ao cliente para não bloquear
      res.json({
        storyId,
        totalChapters: chapters.length,
        status: "processing",
        message: "Gerando ilustrações em segundo plano. As imagens serão disponibilizadas à medida que forem geradas."
      });
      
      // Continuar processamento em segundo plano
      (async () => {
        try {
          const results = await Promise.allSettled(illustrationPromises);
          
          // Contar quantas ilustrações foram geradas com sucesso
          const successCount = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
          
          console.log(`Concluída geração de ilustrações para história ${storyId}: ${successCount}/${chapters.length} sucesso`);
          
          // Atualizar o conteúdo da história com os capítulos atualizados
          // (opcional - pode ser implementado mais tarde uma API para recuperar os capítulos atualizados)
        } catch (error) {
          console.error("Erro no processo em segundo plano de geração de ilustrações:", error);
        }
      })();
      
    } catch (error) {
      console.error("Erro ao iniciar geração de ilustrações para a história:", error);
      res.status(500).json({ message: "Erro ao iniciar geração de ilustrações para a história" });
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
  
  // Endpoint para verificar o status dos provedores de IA
  app.get("/api/ai-providers/status", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Verificar se o usuário é admin (somente admins podem ver o status detalhado)
      const isAdmin = user.role === "admin";
      
      if (!isAdmin) {
        return res.status(403).json({ message: "Acesso negado. Somente administradores podem acessar esta informação." });
      }
      
      const providersStatus = getAIProvidersStatus();
      res.json(providersStatus);
    } catch (error) {
      console.error("Erro ao obter status dos provedores de IA:", error);
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
