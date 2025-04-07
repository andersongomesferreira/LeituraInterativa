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

// Middleware para verificar usuário administrador - versão melhorada
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verificar se o usuário está autenticado
    if (!req.isAuthenticated()) {
      console.log('isAdmin: Usuário não autenticado');
      return res.status(401).json({ 
        success: false,
        message: "Não autorizado. Por favor, faça login para continuar." 
      });
    }
    
    // Verificar se o usuário existe
    if (!req.user) {
      console.log('isAdmin: Objeto user não encontrado na requisição');
      return res.status(401).json({ 
        success: false,
        message: "Dados de usuário não encontrados." 
      });
    }
    
    const user = req.user as any;
    console.log(`isAdmin check: username=${user.username}, role=${user.role || 'não definido'}`);
    
    // Verificar se o usuário é um administrador (por username ou role)
    // Verificando tanto o username específico quanto a role para compatibilidade
    if (user.username === 'andersongomes86' || user.role === 'admin') {
      return next();
    }
    
    console.log('isAdmin: Acesso negado - usuário não é administrador');
    return res.status(403).json({ 
      success: false,
      message: "Acesso negado. Apenas o administrador tem permissão." 
    });
  } catch (error) {
    console.error('Erro no middleware isAdmin:', error);
    return res.status(500).json({ 
      success: false,
      message: "Erro interno do servidor ao verificar permissões." 
    });
  }
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
      scriptSrc: ["'self'", "'unsafe-inline'", "*.replit.com", "replit.com", "http://gc.kis.v2.scr.kaspersky-labs.com", "ws://gc.kis.v2.scr.kaspersky-labs.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "*.googleapis.com", "fonts.googleapis.com", "http://gc.kis.v2.scr.kaspersky-labs.com", "ws://gc.kis.v2.scr.kaspersky-labs.com"],
      imgSrc: ["'self'", "data:", "*.cloudfront.net", "*.imgur.com", "*.iconfinder.com", "placehold.co", "cdn.jsdelivr.net", "*.jsdelivr.net", "http://gc.kis.v2.scr.kaspersky-labs.com", "ws://gc.kis.v2.scr.kaspersky-labs.com"],
      fontSrc: ["'self'", "*.gstatic.com", "fonts.gstatic.com"],
      connectSrc: ["'self'", "*.api.openai.com", "*.api.anthropic.com", "api.stability.ai", "localhost:3001", "http://localhost:3001", "ws://localhost:3001", "api-inference.huggingface.co", "*.huggingface.co", "localhost:5000", "http://localhost:5000", "ws://localhost:5000"]
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