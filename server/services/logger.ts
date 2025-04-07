import winston from 'winston';
import config from '../config';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Formato personalizado para desenvolvimento
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  // Adicionar metadados se existirem
  let meta = '';
  if (Object.keys(metadata).length > 0) {
    meta = JSON.stringify(metadata, null, 2);
  }
  
  return `${timestamp} [${level}]: ${message} ${meta}`;
});

// Configuração base
const logger = winston.createLogger({
  level: config.app.isProduction ? 'info' : 'debug',
  format: config.app.isProduction 
    ? combine(timestamp(), json())
    : combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), devFormat),
  defaultMeta: { service: 'leiturinhabot' },
  transports: [
    // Sempre registrar no console
    new winston.transports.Console({
      level: config.app.isProduction ? 'info' : 'debug',
    }),
    // Em produção, também registrar em arquivos
    ...(config.app.isProduction ? [
      new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      new winston.transports.File({ 
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    ] : [])
  ],
  // Evitar que a aplicação pare em caso de erro no logger
  exitOnError: false
});

// Interface para logs com contexto
interface LogContext {
  [key: string]: any;
}

// Funções seguras para facilitar o log com contexto
export default {
  // Logs de depuração (desenvolvimento)
  debug: (message: string, context: LogContext = {}): void => {
    logger.debug(message, context);
  },
  
  // Logs informativos (operação normal)
  info: (message: string, context: LogContext = {}): void => {
    logger.info(message, context);
  },
  
  // Logs de alerta (algo não está certo, mas a aplicação continua)
  warn: (message: string, context: LogContext = {}): void => {
    logger.warn(message, context);
  },
  
  // Logs de erro (algo deu errado, mas tratável)
  error: (message: string, error?: Error | any, context: LogContext = {}): void => {
    // Extrair informações do erro para contexto
    const errorContext = error ? {
      ...context,
      errorMessage: error.message || String(error),
      stack: error.stack,
      ...error
    } : context;
    
    logger.error(message, errorContext);
  },
  
  // Logs críticos (erros que podem comprometer a aplicação)
  critical: (message: string, error?: Error | any, context: LogContext = {}): void => {
    // Extrair informações do erro para contexto
    const errorContext = error ? {
      ...context,
      errorMessage: error.message || String(error),
      stack: error.stack,
      ...error
    } : context;
    
    logger.error(`CRITICAL: ${message}`, errorContext);
  },
  
  // Logs de requisição HTTP
  http: (message: string, context: LogContext = {}): void => {
    logger.http(message, context);
  },
  
  // Acessar o logger diretamente para casos especiais
  raw: logger
}; 