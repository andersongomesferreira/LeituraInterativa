import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { setupSessionStore } from "./services/session-service";
import config from "./config";

// Importar rotas modulares
import authRoutes from './routes/auth';
import storiesRoutes from './routes/stories';
import apiKeysRoutes from './routes/api-keys';
import userApiKeysRoutes from './routes/user-api-keys';

// Importar middlewares de segurança
import { isAuthenticated, isAdmin } from './middleware/security';

export async function registerModularRoutes(app: Express): Promise<Server> {
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

  // Registrar rotas modulares
  app.use('/api/auth', authRoutes);
  app.use('/api/stories', storiesRoutes);
  app.use('/api/admin/api-keys', isAdmin, apiKeysRoutes);
  app.use('/api/user/api-keys', isAuthenticated, userApiKeysRoutes);

  // Outras rotas modulares (a serem implementadas posteriormente)
  // app.use('/api/characters', characterRoutes);
  // app.use('/api/themes', themeRoutes);
  // app.use('/api/child-profiles', childProfileRoutes);
  // app.use('/api/subscriptions', subscriptionRoutes);
  // app.use('/api/reading-sessions', readingSessionRoutes);

  // Rota API status e documentação
  app.get('/api/status', (_req: Request, res: Response) => {
    res.json({
      success: true,
      status: 'online',
      version: process.env.npm_package_version || '1.0.0',
      environment: config.app.env
    });
  });

  // Tratamento de erro para rotas não encontradas
  app.use('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint não encontrado'
    });
  });

  // Tratamento de erros global para APIs
  app.use('/api', (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Erro na API:', err);
    
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Erro interno do servidor';
    
    res.status(status).json({
      success: false,
      message,
      ...(config.app.env === 'development' && { 
        stack: err.stack,
        details: err 
      })
    });
  });

  return httpServer;
} 