import dotenv from 'dotenv';
import crypto from 'crypto';

// Carregar variáveis de ambiente
dotenv.config();

const config = {
  app: {
    port: 5000,
    env: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },

  db: {
    url: process.env.DATABASE_URL,
  },

  session: {
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
    resave: false,
    saveUninitialized: false,
  },

  redis: {
    url: process.env.REDIS_URL,
    enabled: !!process.env.REDIS_URL,
  },

  security: {
    bcryptSaltRounds: 10,
    corsOrigin: process.env.CORS_ORIGIN || '*',
  },

  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION,
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
    stability: {
      apiKey: process.env.STABILITY_API_KEY,
    },
    replicate: {
      apiKey: process.env.REPLICATE_API_KEY,
    },
    getimg: {
      apiKey: process.env.GETIMG_AI_API_KEY,
    },
    runware: {
      apiKey: process.env.RUNWARE_API_KEY,
    },
    huggingface: {
      apiKey: process.env.HUGGINGFACE_API_KEY,
    },
  },
};

export default config;