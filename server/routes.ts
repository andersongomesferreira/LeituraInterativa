import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  generateStory, 
  generateAudioFromText, 
  generateImage, 
  generateCharacterImage, 
  generateChapterImage,
  extractChapters,
  getAIProvidersStatus
} from "./services/ai-service";
import { 
  aiProviderManager 
} from "./services/ai-providers/provider-manager";
import { 
  insertCharacterSchema, 
  insertThemeSchema,
  insertUserSchema, 
  insertChildProfileSchema, 
  insertStorySchema, 
  insertReadingSessionSchema  
} from "@shared/schema";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import config from "./config";
import { setupSessionStore } from "./services/session-service";

// Import API key routes
import apiKeysRoutes from './routes/api-keys';
import userApiKeysRoutes from './routes/user-api-keys';

// Import modular admin routes
import adminRouter from './routes/admin';

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
  textOnly?: boolean; // Opção para histórias apenas em texto, sem ilustrações
  provider?: string; // Provedor específico a ser usado (opcional)
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

declare module "express-session" {
  interface SessionData {
    userId?: number;
    isAuthenticated?: boolean;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Configure session
  await setupSessionStore(app);

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
  
  // Middleware to verify admin role
  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.user && (req.user as any).role === 'admin') {
      return next();
    }
    res.status(403).json({ message: "Acesso negado. Apenas administradores têm permissão." });
  };

  // Mount the admin router at /api/admin
  app.use('/api/admin', adminRouter);

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

  // Rota para verificar se o usuário é admin
  app.get("/api/auth/check-admin", isAuthenticated, (req, res) => {
    try {
      const user = req.user as any;
      // Verificar se o usuário tem username andersongomes86 ou role admin
      const isAdmin = user && (user.username === 'andersongomes86' || user.role === 'admin');
      
      console.log(`Check-admin: username=${user.username}, role=${user.role || 'não definido'}, isAdmin=${isAdmin}`);
      
      if (isAdmin) {
        return res.json({
          success: true,
          isAdmin: true,
          message: "Usuário é administrador",
          user: {
            id: user.id,
            username: user.username
          }
        });
      } else {
        return res.json({
          success: false,
          isAdmin: false,
          message: "Usuário não é administrador"
        });
      }
    } catch (error) {
      console.error('Erro ao verificar status de admin:', error);
      res.status(500).json({
        success: false,
        message: "Erro ao verificar status de administrador"
      });
    }
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
      const { characters, theme, ageGroup, childName, textOnly } = req.body;
      
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
        childName,
        textOnly: !!textOnly // Convert to boolean in case it's undefined
      });
      
      // Save story to database
      const story = await storage.createStory({
        title: generatedStory.title,
        content: generatedStory.content,
        ageGroup,
        imageUrl: "",
        characterIds: characters,
        themeId: theme,
        textOnly: !!textOnly // Convert to boolean in case it's undefined
      });
      
      // Criar uma versão limpa da resposta
      const responseData = {
        ...story,
        summary: generatedStory.summary,
        readingTime: generatedStory.readingTime,
        chapters: generatedStory.chapters.map(chapter => ({
          title: chapter.title,
          content: chapter.content,
          imagePrompt: textOnly ? undefined : chapter.imagePrompt,
          imageUrl: textOnly ? undefined : chapter.imageUrl
        }))
      };
      
      console.log("Enviando resposta de história gerada:", JSON.stringify({
        id: responseData.id,
        title: responseData.title,
        chaptersCount: responseData.chapters?.length || 0
      }));
      
      // Modo somente texto - pulando geração de ilustrações
      /* Comentando e removendo todo o código de geração de ilustrações
      // O código de geração de imagens foi removido, pois o cliente solicitou histórias somente texto
      */
      
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
      // Pular geração de imagens se a história estiver marcada como somente texto
      if (!story.textOnly && processedChapters.some(chapter => !chapter.imageUrl)) {
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
              
              // Verificar novamente se a história foi alterada para o modo somente texto
              const refreshedStory = await storage.getStory(story.id);
              if (refreshedStory?.textOnly) {
                console.log(`História ${story.id} foi alterada para modo somente texto. Interrompendo geração de ilustrações.`);
                break;
              }
              
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
                      style: "cartoon" as const,
                      mood: (imageOptions.mood || "adventure") as "happy" | "adventure" | "calm" | "exciting", 
                      ageGroup: story.ageGroup as "3-5" | "6-8" | "9-12",
                      storyId: story.id,
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
  
  // Rota antiga para manter compatibilidade com o cliente existente
  app.post("/api/stories/generateChapterImage", isAuthenticated, async (req, res) => {
    try {
      const { chapterTitle, chapterContent, characters, options } = req.body;
      
      console.log(`[SERVER] Recebida requisição para gerar imagem de capítulo "${chapterTitle}"`);
      console.log(`[SERVER] Usando rota antiga para compatibilidade`);
      
      // Obter o nível de assinatura do usuário
      const userTier = req.user?.subscription?.tier || 'free';
      
      // Forçar uso do Runware, já que é o único provedor com chave configurada
      console.log(`[SERVER] Forçando uso do provedor Runware`);
      
      // Gerar a imagem de forma direta usando generateImage
      // Esta função é mais simples e evita problemas de tipagem
      const generatedImage = await aiProviderManager.generateImage(
        `Ilustração para história infantil "${chapterTitle}: ${chapterContent.substring(0, 100)}..."`,
        {
          style: options?.style || "cartoon",
          ageGroup: options?.ageGroup || "6-8",
        },
        userTier
      );
      
      console.log(`[SERVER] Resposta da geração de imagem:`, {
        success: generatedImage.success,
        hasImageUrl: !!generatedImage.imageUrl
      });
      
      // Se não conseguiu gerar a imagem, use uma URL padrão
      if (!generatedImage.success || !generatedImage.imageUrl) {
        // URL padrão para casos de erro
        const fallbackUrl = "https://placehold.co/600x400/e6e6e6/999999?text=Imagem+indisponível";
        console.log(`[SERVER] Usando URL de fallback devido a falha na geração`);
        
        return res.json({
          success: false,
          imageUrl: fallbackUrl,
          message: "Não foi possível gerar a imagem: Erro no serviço de imagens"
        });
      }
      
      // Garantir que a imageUrl seja uma string válida
      let finalImageUrl = "";
      
      // Verificar o tipo da resposta
      if (typeof generatedImage.imageUrl === 'string') {
        finalImageUrl = generatedImage.imageUrl.trim();
      } else if (generatedImage.imageUrl && typeof generatedImage.imageUrl === 'object') {
        try {
          // @ts-ignore
          finalImageUrl = generatedImage.imageUrl.url || generatedImage.imageUrl.imageUrl || generatedImage.imageUrl.src || "";
          console.log(`[SERVER] Extraída URL do objeto: ${finalImageUrl}`);
        } catch (e) {
          console.error(`[SERVER] Erro ao extrair URL do objeto:`, e);
          finalImageUrl = "https://placehold.co/600x400/e6e6e6/999999?text=Erro+de+formato";
        }
      }
      
      // Se ainda não temos uma URL válida, usar fallback
      if (!finalImageUrl) {
        finalImageUrl = "https://placehold.co/600x400/e6e6e6/999999?text=URL+inválida";
      }
      
      // Retornar a URL da imagem gerada
      return res.json({
        success: true,
        imageUrl: finalImageUrl
      });
    } catch (error) {
      console.error("[SERVER] Erro crítico ao gerar imagem do capítulo:", error);
      return res.status(200).json({
        success: false,
        imageUrl: "https://placehold.co/600x400/e6e6e6/999999?text=Erro+ao+gerar+imagem",
        message: `Erro ao gerar imagem: ${error.message || 'Erro desconhecido'}`,
        error: error instanceof Error ? error.message : String(error)
      });
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
      
      // Verificar se a história está configurada para modo somente texto
      if (story.textOnly) {
        return res.status(400).json({ 
          message: "Esta história está configurada para modo somente texto. Não é possível gerar ilustrações.",
          textOnly: true
        });
      }
      
      // Extrair capítulos
      const chapters = extractChapters(story.content);
      if (chapters.length === 0) {
        return res.status(400).json({ message: "Não foi possível extrair capítulos da história" });
      }
      
      console.log(`Gerando ilustrações para ${chapters.length} capítulos da história "${story.title}"...`);
      
      // Buscar personagens para a geração de ilustrações
      const characterIds = story.characterIds as number[];
      const characters = await Promise.all(
        characterIds.map((id: number) => storage.getCharacter(id))
      );
      const characterNames = characters
        .filter(c => c !== undefined)
        .map(c => c!.name);
      
      // Importação do serviço de consistência de personagens
      const { characterConsistencyService } = await import('./services/character-consistency-service');
      
      // Obter descrições detalhadas dos personagens para manter consistência visual
      const characterDescriptions = await characterConsistencyService.getCharacterDescriptions(
        story.id, 
        characterNames
      );
      
      // Configurar opções padrão baseadas na faixa etária da história
      const imageOptions: GenerateImageOptions = {
        ...options,
        style: "cartoon",
        mood: options?.mood || "adventure",
        ageGroup: story.ageGroup as any,
        storyId: story.id,
        characterDescriptions
      };
      
      // Responder imediatamente ao cliente para não bloquear
      res.json({
        storyId,
        totalChapters: chapters.length,
        status: "processing",
        message: "Gerando todas as ilustrações em segundo plano. As imagens serão geradas em sequência para garantir consistência visual."
      });
      
      // Continuar processamento em segundo plano de forma sequencial para garantir consistência visual
      (async () => {
        try {
          const updatedChapters = [...chapters];
          let successCount = 0;
          
          // Processar capítulos em SEQUÊNCIA (não em paralelo) para garantir consistência visual
          for (let i = 0; i < chapters.length; i++) {
            try {
              console.log(`Gerando ilustração para o capítulo ${i + 1}/${chapters.length}: "${chapters[i].title}"`);
              
              // Verificar novamente se a história foi alterada para o modo somente texto
              // (caso o usuário tenha alterado a configuração em outro lugar durante o processamento)
              const refreshedStory = await storage.getStory(storyId);
              if (refreshedStory?.textOnly) {
                console.log(`História ${storyId} foi alterada para modo somente texto. Interrompendo geração de ilustrações.`);
                break;
              }
              
              // Obter descrições atualizadas dos personagens após ilustrações anteriores
              const updatedCharacterDescriptions = await characterConsistencyService.getCharacterDescriptions(
                story.id, 
                characterNames
              );
              
              // Adicionar o número do capítulo para sequenciamento visual
              const chapterOptions = {
                style: "cartoon" as const,
                mood: (options?.mood || "adventure") as "happy" | "adventure" | "calm" | "exciting", 
                ageGroup: story.ageGroup as "3-5" | "6-8" | "9-12",
                storyId: story.id,
                characterDescriptions: updatedCharacterDescriptions,
                chapterId: i + 1
              };
              
              // Gerar ilustração com todas as informações de contexto e consistência
              const generatedImage = await generateChapterImage(
                chapters[i].title,
                chapters[i].content,
                characterNames,
                chapterOptions
              );
              
              // Atualizar o capítulo com a URL da imagem
              // Verificar se a URL está vazia ou indefinida e usar imagem de backup se necessário
              let finalImageUrl;
              
              if (generatedImage.imageUrl) {
                if (typeof generatedImage.imageUrl === 'string') {
                  // Processar quando é uma string
                  finalImageUrl = generatedImage.imageUrl.trim().length > 0
                    ? generatedImage.imageUrl
                    : "https://placehold.co/600x400/FFDE59/333333?text=Sem+imagem+disponível";
                } else if (typeof generatedImage.imageUrl === 'object') {
                  // Extrair URL de um objeto
                  console.log(`[SERVER] imageUrl é um objeto em vez de string:`, generatedImage.imageUrl);
                  try {
                    // @ts-ignore
                    if (generatedImage.imageUrl.url) {
                      // @ts-ignore
                      finalImageUrl = generatedImage.imageUrl.url;
                    // @ts-ignore
                    } else if (generatedImage.imageUrl.imageUrl) {
                      // @ts-ignore
                      finalImageUrl = generatedImage.imageUrl.imageUrl;
                    // @ts-ignore
                    } else if (generatedImage.imageUrl.src) {
                      // @ts-ignore
                      finalImageUrl = generatedImage.imageUrl.src;
                    } else {
                      // Se não encontrar url conhecida
                      finalImageUrl = "https://placehold.co/600x400/FFDE59/333333?text=Formato+inválido";
                    }
                  } catch (e) {
                    console.error(`[SERVER] Erro ao extrair URL de objeto:`, e);
                    finalImageUrl = "https://placehold.co/600x400/FFDE59/333333?text=Erro+de+formato";
                  }
                } else {
                  // Não é string nem objeto
                  finalImageUrl = "https://placehold.co/600x400/FFDE59/333333?text=Formato+desconhecido";
                }
              } else {
                // imageUrl é null ou undefined
                finalImageUrl = "https://placehold.co/600x400/FFDE59/333333?text=Sem+imagem+disponível";
              }
                
              console.log(`Chapter ${i+1} image URL: ${typeof finalImageUrl === 'string' ? finalImageUrl.substring(0, 30) + '...' : 'não é uma string'}`);
              
              updatedChapters[i] = {
                ...updatedChapters[i],
                imageUrl: finalImageUrl
              };
              
              // Atualizar as descrições dos personagens após cada capítulo
              // para manter consistência visual nas próximas ilustrações
              characterConsistencyService.updateCharacterVisuals(story.id, 
                characterNames.map(name => ({
                  name,
                  description: chapters[i].content,
                  imageUrl: finalImageUrl
                }))
              );
              
              successCount++;
              console.log(`Ilustração ${i + 1}/${chapters.length} gerada com sucesso`);
              
              // Pequeno atraso entre solicitações (para evitar sobrecarga e permitir atualizações no serviço de consistência)
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
              console.error(`Erro ao gerar ilustração para o capítulo ${i + 1}:`, error);
            }
          }
          
          console.log(`Concluída geração de ilustrações para história ${storyId}: ${successCount}/${chapters.length} sucesso`);
          
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
  
  // Registrar rotas para gerenciamento de chaves API (admin)
  app.use('/api/admin/ai-keys', apiKeysRoutes);
  
  // Registrar rotas para gerenciamento de chaves API (usuário)
  app.use('/api/user/ai-keys', userApiKeysRoutes);
  
  // Admin routes
  app.get("/api/admin/dashboard", isAdmin, async (req, res) => {
    try {
      // Get counts of users, stories, and active sessions
      const users = await storage.getAllUsers();
      const stories = await storage.getAllStories();
      const subscriptions = await storage.getAllUserSubscriptions();
      
      // Get AI providers status
      const providersStatus = getAIProvidersStatus();
      
      res.json({
        counts: {
          users: users.length,
          stories: stories.length,
          subscriptions: subscriptions.length,
          activeSubscriptions: subscriptions.filter(s => s.status === 'active').length
        },
        aiProviders: providersStatus
      });
    } catch (error) {
      console.error('Admin dashboard error:', error);
      res.status(500).json({ message: 'Erro ao carregar o painel de administração' });
    }
  });

  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const safeUsers = users.map(user => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/admin/stories", isAdmin, async (req, res) => {
    try {
      const stories = await storage.getAllStories();
      res.json(stories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/admin/subscriptions", isAdmin, async (req, res) => {
    try {
      const subscriptions = await storage.getAllUserSubscriptions();
      const users = await storage.getAllUsers();
      
      // Map user data to subscriptions
      const subscriptionsWithUserData = await Promise.all(
        subscriptions.map(async (subscription) => {
          const user = users.find(u => u.id === subscription.userId);
          const plan = await storage.getSubscriptionPlan(subscription.planId);
          
          return {
            ...subscription,
            userName: user ? user.name : 'Unknown',
            userEmail: user ? user.email : 'Unknown',
            planName: plan ? plan.name : 'Unknown'
          };
        })
      );
      
      res.json(subscriptionsWithUserData);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Endpoint público para verificar quais provedores de IA estão disponíveis
  app.get("/api/ai-providers/public-status", async (req, res) => {
    try {
      const providers = getAIProvidersStatus();
      
      // Filtrar apenas informações públicas (sem detalhes sensíveis)
      const publicInfo = providers.map(provider => ({
        id: provider.id,
        name: provider.name,
        isAvailable: provider.isAvailable,
        // Versão simplificada sem requerer os detalhes de capabilities
        supportsImages: provider.id !== 'anthropic', // Todos exceto Anthropic suportam imagens
        supportsText: true // Todos suportam texto
      }));
      
      res.json(publicInfo);
    } catch (error) {
      console.error("Erro ao obter status público dos provedores de IA:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Endpoint for testing AI image generation with detailed debugging
  app.post("/api/test-image-generation", async (req, res) => {
    try {
      const { provider, prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ 
          success: false, 
          error: 'Prompt is required' 
        });
      }
      
      console.log(`Testing image generation with provider: ${provider || 'default'}, prompt: "${prompt.substring(0, 50)}..."`);
      
      const result = await generateImage(prompt, {
        style: req.body.style || 'cartoon',
        provider: provider,
        seed: req.body.seed || undefined,
        characterDescriptions: req.body.characterDescriptions || undefined
      });
      
      console.log(`Image generation test result:`, {
        success: result.success,
        imageUrl: result.imageUrl ? (result.imageUrl.substring(0, 30) + '...') : 'none',
        provider: result.provider,
        error: result.error,
        isBackup: result.isBackup
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error testing image generation:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      });
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

  // Admin routes
  // Admin Dashboard Overview
  app.get('/api/admin/dashboard', isAdmin, async (req, res) => {
    try {
      // Get counts of users, stories, and active sessions
      const users = await storage.getAllUsers();
      const stories = await storage.getAllStories();
      const subscriptions = await storage.getAllUserSubscriptions();
      
      // Get AI providers status
      const providersStatus = getAIProvidersStatus();
      
      res.json({
        counts: {
          users: users.length,
          stories: stories.length,
          subscriptions: subscriptions.length,
          activeSubscriptions: subscriptions.filter(s => s.status === 'active').length
        },
        aiProviders: providersStatus
      });
    } catch (error) {
      console.error('Admin dashboard error:', error);
      res.status(500).json({ message: 'Erro ao carregar o painel de administração' });
    }
  });
  
  // Admin AI Providers Status endpoint
  app.get('/api/admin/ai-providers/status', isAdmin, async (req, res) => {
    try {
      const aiProviderManager = req.app.get('aiProviderManager');
      
      if (!aiProviderManager) {
        return res.status(500).json({ 
          success: false, 
          message: 'AIProviderManager não inicializado' 
        });
      }

      // Obter o status de todos os provedores
      const providersStatus = aiProviderManager.getProvidersStatus();
      
      // Mapear para o formato esperado pela interface
      const providers = providersStatus.map((provider: any) => {
        // Verificar se o provedor tem capacidades relevantes
        const hasTextCapability = provider.capabilities.includes('text');
        const hasImageCapability = provider.capabilities.includes('image');
        
        // Ignorar provedores que não têm nem capacidade de texto nem de imagem
        if (!hasTextCapability && !hasImageCapability) {
          return null;
        }
        
        // Obter o provedor original para acessar informações adicionais
        const providerInstance = aiProviderManager.getProviders().find((p: any) => p.id === provider.id);
        const models = providerInstance?.getModels ? providerInstance.getModels() : [];
        
        // Verificar se o provedor tem uma API key configurada
        const hasApiKey = providerInstance?.hasApiKey ? providerInstance.hasApiKey() : undefined;
        
        // Determinar o status com base na disponibilidade e configuração
        let status: 'online' | 'offline' | 'unconfigured' | 'error' = 'offline';
        
        if (provider.isAvailable) {
          if (hasApiKey === false) {
            status = 'unconfigured';  // Provedor sem API key é marcado como não configurado
          } else if (hasApiKey === undefined) {
            // Se não sabemos se tem API key (método não existe), verificamos a disponibilidade geral
            status = 'online';
          } else {
            status = 'online';
          }
        } else if (hasApiKey === false) {
          status = 'unconfigured';
        }
        
        return {
          id: provider.id,
          name: provider.name,
          status: status,
          models: models.map((m: any) => {
            if (typeof m === 'string') return m;
            if (typeof m === 'object' && m !== null && 'id' in m) return m.id;
            return String(m);
          }),
          supportsStyles: !!providerInstance?.supportsStyles
        };
      }).filter(Boolean); // Remover provedores null

      res.json({
        success: true,
        providers
      });
    } catch (error) {
      console.error('Erro ao processar requisição de status dos provedores de IA:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter status dos provedores de IA',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Admin User Management
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao listar usuários' });
    }
  });
  
  app.get('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      // Get user's subscription and profiles
      const subscription = await storage.getUserSubscription(userId);
      const profiles = await storage.getChildProfilesByParentId(userId);
      const stories = await storage.getStoriesByUserId(userId);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        user: userWithoutPassword,
        subscription,
        profiles,
        storiesCount: stories.length
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
      res.status(500).json({ message: 'Erro ao buscar detalhes do usuário' });
    }
  });
  
  // Admin Subscription Management
  app.get('/api/admin/subscriptions', isAdmin, async (req, res) => {
    try {
      const subscriptions = await storage.getAllUserSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao listar assinaturas' });
    }
  });
  
  app.put('/api/admin/subscriptions/:id', isAdmin, async (req, res) => {
    try {
      const subscriptionId = parseInt(req.params.id);
      if (isNaN(subscriptionId)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      const updatedSubscription = await storage.updateUserSubscription(
        subscriptionId, 
        req.body
      );
      
      if (!updatedSubscription) {
        return res.status(404).json({ message: 'Assinatura não encontrada' });
      }
      
      res.json(updatedSubscription);
    } catch (error) {
      console.error('Error updating subscription:', error);
      res.status(500).json({ message: 'Erro ao atualizar assinatura' });
    }
  });
  
  // Admin Story Management
  app.get('/api/admin/stories', isAdmin, async (req, res) => {
    try {
      const stories = await storage.getAllStories();
      res.json(stories);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao listar histórias' });
    }
  });
  
  app.get('/api/admin/stories/:id', isAdmin, async (req, res) => {
    try {
      const storyId = parseInt(req.params.id);
      if (isNaN(storyId)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ message: 'História não encontrada' });
      }
      
      // Extract chapters
      const chapters = extractChapters(story.content);
      
      res.json({
        ...story,
        chapters
      });
    } catch (error) {
      console.error('Error fetching story details:', error);
      res.status(500).json({ message: 'Erro ao buscar detalhes da história' });
    }
  });
  
  // Admin AI System Management
  app.get('/api/admin/ai-providers', isAdmin, async (req, res) => {
    try {
      const providersStatus = getAIProvidersStatus();
      res.json(providersStatus);
    } catch (error) {
      console.error('Error fetching AI providers:', error);
      res.status(500).json({ message: 'Erro ao buscar status dos provedores de IA' });
    }
  });
  
  app.post('/api/admin/ai-providers/:providerId/test', isAdmin, async (req, res) => {
    try {
      const { providerId } = req.params;
      const { type, options } = req.body;
      
      if (!providerId) {
        return res.status(400).json({ message: 'ID do provedor é obrigatório' });
      }
      
      if (!type || !['text', 'image'].includes(type)) {
        return res.status(400).json({ message: 'Tipo de teste inválido. Use "text" ou "image"' });
      }
      
      let result;
      if (type === 'text') {
        const textParams = {
          prompt: options.prompt || "Gere um pequeno teste para verificar o funcionamento do serviço.",
          ...options
        };
        result = await aiProviderManager.generateText({...textParams, provider: providerId}, 'admin');
      } else {
        const imageParams = {
          prompt: options.prompt || "Uma imagem de teste simples, estilo cartoon, fundo colorido",
          ...options
        };
        result = await aiProviderManager.generateImage({...imageParams, provider: providerId}, 'admin');
      }
      
      res.json(result);
    } catch (error) {
      console.error(`Error testing AI provider:`, error);
      res.status(500).json({ 
        message: 'Erro ao testar provedor de IA',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Admin Character and Theme Management
  app.get('/api/admin/characters', isAdmin, async (req, res) => {
    try {
      const characters = await storage.getAllCharacters();
      res.json(characters);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao listar personagens' });
    }
  });
  
  app.post('/api/admin/characters', isAdmin, async (req, res) => {
    try {
      const validatedData = insertCharacterSchema.parse(req.body);
      const character = await storage.createCharacter(validatedData);
      res.status(201).json(character);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      res.status(500).json({ message: 'Erro ao criar personagem' });
    }
  });
  
  app.get('/api/admin/themes', isAdmin, async (req, res) => {
    try {
      const themes = await storage.getAllThemes();
      res.json(themes);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao listar temas' });
    }
  });
  
  app.post('/api/admin/themes', isAdmin, async (req, res) => {
    try {
      const validatedData = insertThemeSchema.parse(req.body);
      const theme = await storage.createTheme(validatedData);
      res.status(201).json(theme);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      res.status(500).json({ message: 'Erro ao criar tema' });
    }
  });
  
  // Admin AI Testing Utilities
  app.post('/api/admin/test/generate-text', isAdmin, async (req, res) => {
    try {
      const { prompt, options } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: 'Prompt é obrigatório' });
      }
      
      const textParams = {
        prompt,
        ...options
      };
      
      const result = await aiProviderManager.generateText(textParams, 'admin');
      res.json(result);
    } catch (error) {
      console.error('Error testing text generation:', error);
      res.status(500).json({ 
        message: 'Erro ao testar geração de texto',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.post('/api/admin/test/generate-image', isAdmin, async (req, res) => {
    try {
      const { prompt, options } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: 'Prompt é obrigatório' });
      }
      
      const result = await generateImage(prompt, options, 'admin');
      res.json(result);
    } catch (error) {
      console.error('Error testing image generation:', error);
      res.status(500).json({ 
        message: 'Erro ao testar geração de imagem',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Admin initialization endpoint - creates or updates the admin user
  app.post('/api/admin/initialize', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Check if this is the special admin initialization email
      if (email !== 'andersongomes86@gmail.com') {
        return res.status(403).json({ message: 'Email não autorizado para inicializar admin' });
      }
      
      const existingUser = await storage.getUserByEmail(email);
      
      if (existingUser) {
        // Update existing user to have admin role
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const updatedUser = await storage.updateUser(existingUser.id, { 
          role: 'admin',
          password: hashedPassword
        });
        
        if (!updatedUser) {
          return res.status(500).json({ message: 'Erro ao atualizar usuário admin' });
        }
        
        const { password: _, ...userWithoutPassword } = updatedUser;
        
        return res.json({ 
          message: 'Usuário admin atualizado com sucesso',
          user: userWithoutPassword
        });
      } else {
        // Create new admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const user = await storage.createUser({
          email,
          username: 'admin',
          password: hashedPassword,
          name: 'Administrador',
          role: 'admin'
        });
        
        const { password: _, ...userWithoutPassword } = user;
        
        res.status(201).json({
          message: 'Usuário admin criado com sucesso',
          user: userWithoutPassword
        });
      }
    } catch (error) {
      console.error('Admin initialization error:', error);
      res.status(500).json({ message: 'Erro ao inicializar usuário admin' });
    }
  });

  return httpServer;
}
