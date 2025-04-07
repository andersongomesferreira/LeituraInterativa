// Script para definir o role do usuário como 'admin'
// Uso: node server/scripts/set-admin-role.js andersongomes86

import { db } from '../db.js';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function setAdminRole(username) {
  try {
    console.log(`Procurando usuário com username: ${username}`);
    
    // Verificar se o usuário existe
    const [existingUser] = await db.select().from(users).where(eq(users.username, username));
    
    if (!existingUser) {
      console.error(`Usuário '${username}' não encontrado.`);
      process.exit(1);
    }
    
    console.log('Usuário encontrado:', {
      id: existingUser.id,
      username: existingUser.username,
      role: existingUser.role
    });
    
    // Atualizar o role para 'admin'
    const [updatedUser] = await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.username, username))
      .returning();
    
    console.log('Usuário atualizado com sucesso!');
    console.log('Novo role:', updatedUser.role);
    
    process.exit(0);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    process.exit(1);
  }
}

// Obter o username da linha de comando
const username = process.argv[2];

if (!username) {
  console.error('Por favor, forneça um nome de usuário.');
  console.error('Uso: node server/scripts/set-admin-role.js USERNAME');
  process.exit(1);
}

setAdminRole(username); 