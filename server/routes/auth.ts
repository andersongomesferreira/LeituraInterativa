import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { authLimiter } from '../middleware/security';
import config from '../config';

const router = Router();

// Rota de registro
router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const validatedData = insertUserSchema.parse(req.body);
    
    const existingUser = await storage.getUserByUsername(validatedData.username);
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "Nome de usuário já existe" 
      });
    }

    const existingEmail = await storage.getUserByEmail(validatedData.email);
    if (existingEmail) {
      return res.status(400).json({ 
        success: false,
        message: "Email já está em uso" 
      });
    }

    // Validação adicional de senha
    if (validatedData.password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "A senha deve ter no mínimo 8 caracteres"
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(config.security.bcryptSaltRounds);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);

    const user = await storage.createUser({
      ...validatedData,
      password: hashedPassword
    });

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ 
          success: false,
          message: "Erro ao fazer login" 
        });
      }
      
      // Não enviar a senha para o cliente
      const { password, ...userWithoutPassword } = user;
      
      return res.status(201).json({
        success: true,
        user: userWithoutPassword,
        message: "Usuário registrado com sucesso"
      });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false,
        message: "Dados inválidos", 
        errors: error.errors 
      });
    }
    res.status(500).json({ 
      success: false,
      message: "Erro interno do servidor" 
    });
  }
});

// Rota de login
router.post('/login', authLimiter, (req: Request, res: Response) => {
  passport.authenticate("local", (err: any, user: any, info: any) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno", 
        error: err.message 
      });
    }
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: info?.message || "Credenciais inválidas" 
      });
    }
    
    req.login(user, (loginErr: any) => {
      if (loginErr) {
        return res.status(500).json({ 
          success: false, 
          message: "Erro ao fazer login", 
          error: loginErr.message 
        });
      }
      
      // Não enviar a senha para o cliente
      const { password, ...userWithoutPassword } = user;
      
      // Salvar sessão explicitamente para garantir que os cookies sejam enviados corretamente
      req.session.save((saveErr: any) => {
        if (saveErr) {
          return res.status(500).json({
            success: false,
            message: "Erro ao salvar sessão",
            error: saveErr.message
          });
        }
        
        return res.status(200).json({
          success: true,
          message: "Login realizado com sucesso",
          user: userWithoutPassword
        });
      });
    });
  })(req, res);
});

// Rota de logout
router.post('/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao fazer logout", 
        error: err.message 
      });
    }
    
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ 
          success: false,
          message: "Erro ao destruir sessão", 
          error: err.message 
        });
      }
      
      // Limpar o cookie de sessão
      res.clearCookie('connect.sid');
      
      return res.status(200).json({ 
        success: true,
        message: "Logout realizado com sucesso" 
      });
    });
  });
});

// Rota para verificar status de autenticação
router.get('/status', (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    // Não enviar a senha para o cliente
    const { password, ...userWithoutPassword } = req.user as any;
    
    return res.status(200).json({
      success: true,
      isAuthenticated: true,
      user: userWithoutPassword
    });
  }
  
  return res.status(200).json({
    success: true,
    isAuthenticated: false
  });
});

export default router; 