import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from './logger';
import config from '../config';

// Classe de erro base da aplicação
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode?: string;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    errorCode?: string,
    context?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.context = context;
    this.name = this.constructor.name;

    // Captura do stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Constantes para códigos de erro
export const ErrorCodes = {
  // Erros de autenticação (401)
  AUTHENTICATION_FAILED: 'AUTH_001',
  INVALID_CREDENTIALS: 'AUTH_002',
  SESSION_EXPIRED: 'AUTH_003',
  
  // Erros de autorização (403)
  UNAUTHORIZED_ACCESS: 'ACCESS_001',
  INSUFFICIENT_PERMISSIONS: 'ACCESS_002',
  SUBSCRIPTION_REQUIRED: 'ACCESS_003',
  
  // Erros de validação (400)
  VALIDATION_ERROR: 'VAL_001',
  INVALID_INPUT: 'VAL_002',
  MISSING_PARAMETER: 'VAL_003',
  
  // Erros de recursos (404, 409)
  RESOURCE_NOT_FOUND: 'RES_001',
  RESOURCE_ALREADY_EXISTS: 'RES_002',
  RESOURCE_CONFLICT: 'RES_003',
  
  // Erros de integração (502, 503, 504)
  INTEGRATION_ERROR: 'INT_001',
  SERVICE_UNAVAILABLE: 'INT_002',
  TIMEOUT: 'INT_003',
  
  // Erros internos (500)
  INTERNAL_ERROR: 'SERVER_001',
  DATABASE_ERROR: 'SERVER_002',
  UNEXPECTED_ERROR: 'SERVER_003',
};

// Auxiliar para formatação de erros do Zod
function formatZodError(error: ZodError): { message: string; errors: Record<string, string> } {
  const formattedErrors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    formattedErrors[path] = err.message;
  });
  
  return {
    message: 'Erro de validação dos dados',
    errors: formattedErrors,
  };
}

// Gerenciador central de erros para middlewares
export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Erros já formatados pela aplicação
  if (err instanceof AppError) {
    // Se é um erro operacional (esperado), apenas registramos como aviso
    if (err.isOperational) {
      logger.warn(`Erro operacional: ${err.message}`, {
        statusCode: err.statusCode,
        errorCode: err.errorCode,
        path: req.path,
        method: req.method,
        ...(err.context || {})
      });
    } else {
      // Erros não operacionais são mais graves (bugs, etc)
      logger.error(`Erro não operacional: ${err.message}`, err, {
        statusCode: err.statusCode,
        errorCode: err.errorCode,
        path: req.path,
        method: req.method,
        ...(err.context || {})
      });
    }
    
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.errorCode || 'UNKNOWN',
        ...(config.app.isProduction ? {} : { stack: err.stack })
      }
    });
  }
  
  // Erros de validação do Zod
  if (err instanceof ZodError) {
    const { message, errors } = formatZodError(err);
    
    logger.warn(`Erro de validação: ${message}`, {
      path: req.path,
      method: req.method,
      errors
    });
    
    return res.status(400).json({
      success: false,
      error: {
        message,
        code: ErrorCodes.VALIDATION_ERROR,
        errors
      }
    });
  }
  
  // Erros não tratados
  logger.error(`Erro não tratado: ${err.message}`, err, {
    path: req.path,
    method: req.method
  });
  
  // Em produção, ocultar detalhes técnicos
  const response = {
    success: false,
    error: {
      message: config.app.isProduction ? 'Erro interno do servidor' : err.message,
      code: ErrorCodes.UNEXPECTED_ERROR,
      ...(config.app.isProduction ? {} : { stack: err.stack })
    }
  };
  
  res.status(500).json(response);
};

// Função auxiliar para erros de requisição assíncrona
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// Utilitários para criação fácil de erros comuns
export const ErrorUtils = {
  // Erros de autenticação
  authFailed: (message = 'Falha na autenticação', context?: Record<string, any>) => 
    new AppError(message, 401, true, ErrorCodes.AUTHENTICATION_FAILED, context),
    
  invalidCredentials: (message = 'Credenciais inválidas', context?: Record<string, any>) => 
    new AppError(message, 401, true, ErrorCodes.INVALID_CREDENTIALS, context),
    
  sessionExpired: (message = 'Sessão expirada', context?: Record<string, any>) => 
    new AppError(message, 401, true, ErrorCodes.SESSION_EXPIRED, context),
  
  // Erros de autorização
  unauthorized: (message = 'Acesso não autorizado', context?: Record<string, any>) => 
    new AppError(message, 403, true, ErrorCodes.UNAUTHORIZED_ACCESS, context),
    
  insufficientPermissions: (message = 'Permissões insuficientes', context?: Record<string, any>) => 
    new AppError(message, 403, true, ErrorCodes.INSUFFICIENT_PERMISSIONS, context),
    
  subscriptionRequired: (message = 'Assinatura necessária', context?: Record<string, any>) => 
    new AppError(message, 403, true, ErrorCodes.SUBSCRIPTION_REQUIRED, context),
  
  // Erros de validação
  validation: (message = 'Erro de validação', context?: Record<string, any>) => 
    new AppError(message, 400, true, ErrorCodes.VALIDATION_ERROR, context),
    
  invalidInput: (message = 'Entrada inválida', context?: Record<string, any>) => 
    new AppError(message, 400, true, ErrorCodes.INVALID_INPUT, context),
    
  missingParameter: (message = 'Parâmetro obrigatório não informado', context?: Record<string, any>) => 
    new AppError(message, 400, true, ErrorCodes.MISSING_PARAMETER, context),
  
  // Erros de recursos
  notFound: (message = 'Recurso não encontrado', context?: Record<string, any>) => 
    new AppError(message, 404, true, ErrorCodes.RESOURCE_NOT_FOUND, context),
    
  alreadyExists: (message = 'Recurso já existe', context?: Record<string, any>) => 
    new AppError(message, 409, true, ErrorCodes.RESOURCE_ALREADY_EXISTS, context),
    
  conflict: (message = 'Conflito de recursos', context?: Record<string, any>) => 
    new AppError(message, 409, true, ErrorCodes.RESOURCE_CONFLICT, context),
  
  // Erros de integração
  integration: (message = 'Erro de integração', context?: Record<string, any>) => 
    new AppError(message, 502, true, ErrorCodes.INTEGRATION_ERROR, context),
    
  serviceUnavailable: (message = 'Serviço indisponível', context?: Record<string, any>) => 
    new AppError(message, 503, true, ErrorCodes.SERVICE_UNAVAILABLE, context),
    
  timeout: (message = 'Tempo limite excedido', context?: Record<string, any>) => 
    new AppError(message, 504, true, ErrorCodes.TIMEOUT, context),
  
  // Erros internos
  internal: (message = 'Erro interno do servidor', context?: Record<string, any>) => 
    new AppError(message, 500, false, ErrorCodes.INTERNAL_ERROR, context),
    
  database: (message = 'Erro de banco de dados', context?: Record<string, any>) => 
    new AppError(message, 500, false, ErrorCodes.DATABASE_ERROR, context),
    
  unexpected: (message = 'Erro inesperado', context?: Record<string, any>) => 
    new AppError(message, 500, false, ErrorCodes.UNEXPECTED_ERROR, context),
}; 