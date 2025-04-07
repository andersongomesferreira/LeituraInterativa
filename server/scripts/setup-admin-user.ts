import { storage } from '../storage';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { randomBytes } from 'crypto';
import fs from 'fs';
import logger from '../services/logger';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Constantes de configuração
const ADMIN_USERNAME = 'andersongomes86';
const ADMIN_EMAIL = 'admin@leiturinha.example.com'; // Substitua pelo email real
const ADMIN_NAME = 'Anderson Gomes';

/**
 * Script para configurar usuário administrador na inicialização
 * 
 * Este script verifica se o usuário administrador "andersongomes86" existe
 * Se não existir, cria o usuário com a role "admin"
 * Se existir, garante que a role seja "admin"
 * 
 * Para segurança, usa um token de criação que deve ser definido como variável de ambiente
 * ou gera uma senha aleatória e a salva em um arquivo seguro.
 */
async function setupAdminUser() {
  try {
    // 1. Verificar se o usuário admin já existe
    const existingUser = await storage.getUserByUsername(ADMIN_USERNAME);
    
    if (existingUser) {
      // Usuário existe, verificar se já é admin
      if (existingUser.role === 'admin') {
        logger.info('Usuário administrador já configurado', { username: ADMIN_USERNAME });
        return;
      }
      
      // Atualizar para admin se não for
      await storage.updateUser(existingUser.id, { role: 'admin' });
      logger.info('Usuário promovido para administrador', { username: ADMIN_USERNAME });
      return;
    }
    
    // 2. Usuário não existe, criar novo
    // Verificar se existe uma senha definida como variável de ambiente
    let adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
    let isGeneratedPassword = false;
    
    // Se não houver senha definida, gerar uma aleatória
    if (!adminPassword) {
      adminPassword = randomBytes(12).toString('hex');
      isGeneratedPassword = true;
      
      // Salvar a senha gerada em um arquivo seguro
      const passwordFile = path.resolve(__dirname, '../../admin-password.txt');
      fs.writeFileSync(passwordFile, `
========== CREDENCIAIS DE ADMINISTRADOR ==========
Usuário: ${ADMIN_USERNAME}
Senha: ${adminPassword}
Data de criação: ${new Date().toISOString()}
=========================================

IMPORTANTE: Guarde este arquivo em local seguro e depois delete-o!
      `);
      
      fs.chmodSync(passwordFile, 0o600); // Permissões somente para o usuário atual
    }
    
    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    // Criar usuário administrador
    await storage.createUser({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      name: ADMIN_NAME,
      role: 'admin'
    });
    
    if (isGeneratedPassword) {
      logger.info('Usuário administrador criado com senha gerada', { 
        username: ADMIN_USERNAME,
        passwordFile: 'admin-password.txt'
      });
    } else {
      logger.info('Usuário administrador criado com senha da variável de ambiente', { 
        username: ADMIN_USERNAME 
      });
    }
    
  } catch (error) {
    logger.error('Erro ao configurar usuário administrador', error);
    throw error;
  }
}

// Executar o script
setupAdminUser()
  .then(() => {
    console.log('Script de configuração de admin concluído com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro no script de configuração de admin:', error);
    process.exit(1);
  }); 