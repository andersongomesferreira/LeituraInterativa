#!/usr/bin/env node

// Script CommonJS para configuração do usuário administrador
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const { randomBytes } = require('crypto');
const fs = require('fs');

// Carregar variáveis de ambiente
dotenv.config();

// Constantes de configuração
const ADMIN_USERNAME = 'andersongomes86';
const ADMIN_EMAIL = 'admin@leiturinha.example.com';
const ADMIN_NAME = 'Anderson Gomes';

async function setupAdminUser() {
  try {
    console.log('=== CONFIGURAÇÃO DO USUÁRIO ADMINISTRADOR ===\n');
    
    // Importar storage dinamicamente (não podemos fazer isso no topo com CommonJS facilmente)
    const { storage } = require('../storage');
    
    console.log(`Verificando se usuário "${ADMIN_USERNAME}" existe...`);
    // 1. Verificar se o usuário admin já existe
    const existingUser = await storage.getUserByUsername(ADMIN_USERNAME);
    
    if (existingUser) {
      console.log(`\nUsuário "${ADMIN_USERNAME}" já existe.`);
      if (existingUser.role === 'admin') {
        console.log(`O usuário já possui privilégios de administrador.`);
      } else {
        console.log(`Atualizando o usuário para administrador...`);
        await storage.updateUser(existingUser.id, { role: 'admin' });
        console.log(`Usuário promovido para administrador com sucesso!`);
      }
      return;
    }
    
    // 2. Usuário não existe, criar novo
    console.log(`\nUsuário "${ADMIN_USERNAME}" não encontrado. Criando novo usuário administrador...`);
    
    // Verificar se existe uma senha definida como variável de ambiente
    let adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
    let isGeneratedPassword = false;
    
    // Se não houver senha definida, gerar uma aleatória
    if (!adminPassword) {
      adminPassword = randomBytes(12).toString('hex');
      isGeneratedPassword = true;
      
      // Salvar a senha gerada em um arquivo
      const passwordFile = path.resolve(process.cwd(), 'admin-password.txt');
      fs.writeFileSync(passwordFile, `
========== CREDENCIAIS DE ADMINISTRADOR ==========
Usuário: ${ADMIN_USERNAME}
Senha: ${adminPassword}
Data de criação: ${new Date().toISOString()}
=========================================

IMPORTANTE: Guarde este arquivo em local seguro e depois delete-o!
      `);
      
      try {
        fs.chmodSync(passwordFile, 0o600); // Permissões somente para o usuário atual
      } catch (e) {
        console.warn('Aviso: Não foi possível definir permissões restritas para o arquivo de senha.');
      }
      
      console.log(`\nSenha gerada aleatoriamente e salva em: ${passwordFile}`);
    } else {
      console.log('\nUsando senha definida na variável de ambiente ADMIN_INITIAL_PASSWORD');
    }
    
    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    // Criar usuário administrador
    console.log('\nCriando usuário administrador...');
    const user = await storage.createUser({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      name: ADMIN_NAME,
      role: 'admin'
    });
    
    console.log(`\nUsuário administrador criado com sucesso! ID: ${user.id}`);
    
    if (isGeneratedPassword) {
      console.log(`\nCredenciais de acesso:`);
      console.log(`- Usuário: ${ADMIN_USERNAME}`);
      console.log(`- Senha: ${adminPassword}`);
      console.log(`\nEsta informação também foi salva em: admin-password.txt`);
    } else {
      console.log(`\nUse a senha definida na variável de ambiente para acessar.`);
    }
    
  } catch (error) {
    console.error('\nErro ao configurar usuário administrador:', error);
    throw error;
  }
}

// Executar o script
setupAdminUser()
  .then(() => {
    console.log('\n=== CONFIGURAÇÃO CONCLUÍDA COM SUCESSO ===');
    console.log('\nPara acessar a área administrativa:');
    console.log('1. Faça login no sistema com o usuário "andersongomes86"');
    console.log('2. Acesse a URL "/admin" no navegador\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n=== ERRO NA CONFIGURAÇÃO ===');
    console.error('Detalhes do erro:', error);
    process.exit(1);
  }); 