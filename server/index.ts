import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupSecurityMiddleware } from "./middleware/security";
import { errorMiddleware } from "./services/error-handler";
import logger from "./services/logger";
import config from "./config";
import path from 'path';
import { fileURLToPath } from 'url';
import { configureDefaultProviders } from './services/provider-config';
import aiProviderManager from './services/ai-providers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedDatabase() {
  logger.info("Carregando dados iniciais no banco de dados...");
  try {
    // Usamos import dinâmico para que o script seja executado apenas quando necessário
    await import("./scripts/seed-database");
    logger.info("Dados iniciais carregados com sucesso!");
  } catch (error) {
    logger.error("Erro ao carregar dados iniciais", error);
  }
}

// Configurar OpenAI como provedor padrão para imagens e texto
function setupDefaultProviders() {
  logger.info("Configurando OpenAI como provedor padrão para imagens e texto...");
  try {
    configureDefaultProviders();
    logger.info("OpenAI configurado com sucesso como provedor padrão!");
  } catch (error) {
    logger.error("Erro ao configurar OpenAI como provedor padrão", error);
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Importar e registrar o aiProviderManager na aplicação Express
app.set('aiProviderManager', aiProviderManager);

// Aplicar middlewares de segurança
setupSecurityMiddleware(app);

// Middleware de logging de requisições HTTP
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Definir o tipo explicitamente para incluir a propriedade response
      type LogContext = {
        method: string;
        path: string;
        statusCode: number;
        duration: number;
        userAgent: string | undefined;
        contentLength: string | number | string[] | undefined;
        userId?: number;
        response?: Record<string, any>;
      };

      const context: LogContext = {
        method: req.method,
        path,
        statusCode: res.statusCode,
        duration,
        userAgent: req.headers['user-agent'],
        contentLength: res.getHeader('content-length'),
        ...(req.user ? { userId: (req.user as any).id } : {}),
      };

      if (capturedJsonResponse && !path.includes('/auth/')) {
        context.response = capturedJsonResponse;
      }

      // Log apropriado baseado no código de status
      if (res.statusCode >= 500) {
        logger.error(`${req.method} ${path} ${res.statusCode} em ${duration}ms`, context);
      } else if (res.statusCode >= 400) {
        logger.warn(`${req.method} ${path} ${res.statusCode} em ${duration}ms`, context);
      } else {
        logger.http(`${req.method} ${path} ${res.statusCode} em ${duration}ms`, context);
      }
    }
  });

  next();
});

(async () => {
  // Iniciar o servidor
  const PORT = config.app.port || 3001;

  // Configurar provedores padrão antes de iniciar o servidor
  setupDefaultProviders();

  // Inicializar o banco de dados com dados iniciais
  seedDatabase();

  const server = await registerRoutes(app);

  // Middleware de tratamento de erros centralizado
  app.use(errorMiddleware);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  server.listen(PORT, () => {
    logger.info(`Servidor inicializado na porta ${PORT}`, {
      port: PORT,
      environment: config.app.env,
      nodeVersion: process.version
    });
  });
})();