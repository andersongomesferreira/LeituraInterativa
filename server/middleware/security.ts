import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import config from '../config';

// Middleware para verificar autenticação
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ 
    success: false,
    message: "Não autorizado. Por favor, faça login para continuar." 
  });
};

// Middleware para verificar papel de administrador
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && (req.user as any).role === 'admin') {
    return next();
  }
  return res.status(403).json({ 
    success: false,
    message: "Acesso negado. Apenas administradores têm permissão." 
  });
};

// Rate limiter para proteção contra força bruta
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Muitas requisições, por favor tente novamente mais tarde.'
  }
});

// Rate limiter específico para autenticação
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // limite de 5 tentativas por hora
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Muitas tentativas de login. Por favor, tente novamente mais tarde.'
  }
});

// Configuração do CORS
export const corsMiddleware = cors({
  origin: config.security.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  maxAge: 86400 // 1 dia em segundos
});

// Configuração do Helmet (headers de segurança)
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "*.cloudfront.net", "*.imgur.com", "*.iconfinder.com", "placehold.co"],
      connectSrc: ["'self'", "*.api.openai.com", "*.api.anthropic.com", "api.stability.ai"]
    }
  },
  referrerPolicy: { policy: 'same-origin' }
});

// Configura todos os middlewares de segurança
export function setupSecurityMiddleware(app: any) {
  // Aplicar CORS
  app.use(corsMiddleware);
  
  // Aplicar headers de segurança
  app.use(securityHeaders);
  
  // Aplicar rate limiting global para APIs
  app.use('/api/', apiLimiter);
  
  // Aplicar rate limiting específico para autenticação
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  
  // Sanitização de dados
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.body) {
      // Sanitizar entrada removendo caracteres potencialmente perigosos
      const sanitizeObject = (obj: any) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string') {
            // Remover caracteres de controle e escape
            obj[key] = obj[key].replace(/[\u0000-\u001F\u007F-\u009F<>]/g, '');
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          }
        }
        return obj;
      };
      
      req.body = sanitizeObject(req.body);
    }
    next();
  });
} 