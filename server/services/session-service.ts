import session from 'express-session';
import MemoryStore from 'memorystore';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';
import config from '../config';
import { Express } from 'express';
import { log } from '../vite';

/**
 * Configura o armazenamento de sessão baseado no ambiente
 * Usa Redis em produção se disponível, caso contrário usa MemoryStore
 */
export async function setupSessionStore(app: Express): Promise<void> {
  const MemoryStoreInstance = MemoryStore(session);
  
  // Configuração básica da sessão
  const sessionConfig = {
    ...config.session,
    store: new MemoryStoreInstance({
      checkPeriod: 86400000, // 24 horas
    }),
  };
  
  // Se Redis estiver configurado e em produção, use-o em vez de MemoryStore
  if (config.redis.enabled && config.app.isProduction) {
    try {
      log('Configurando Redis para armazenamento de sessão');
      
      const redisClient = createClient({ 
        url: config.redis.url 
      });
      
      await redisClient.connect();
      
      redisClient.on('error', (err) => {
        console.error('Erro no cliente Redis:', err);
      });
      
      redisClient.on('connect', () => {
        log('Conectado ao Redis com sucesso');
      });
      
      // Use Redis para armazenamento de sessão
      sessionConfig.store = new RedisStore({ 
        client: redisClient,
        prefix: 'leiturinhabot:sess:',
      });
      
      log('Redis configurado com sucesso para armazenamento de sessão');
    } catch (error) {
      console.error('Erro ao configurar Redis, usando MemoryStore como fallback:', error);
    }
  } else {
    log('Usando MemoryStore para armazenamento de sessão');
  }
  
  // Configurar a sessão no Express
  app.use(session(sessionConfig));
  
  return;
} 