// Script para definir o role do usuário como 'admin'
// Uso: node server/scripts/set-admin-role.cjs andersongomes86

// Usar caminhos absolutos para os módulos
const path = require('path');
// Importar diretamente o arquivo sem resolver módulos
const { pool } = require(path.join(process.cwd(), 'server', 'db.js'));
const { sql } = require('drizzle-orm');

// Função simplificada que usa SQL direto em vez de ORM
async function setAdminRole(username) {
  try {
    console.log(`Procurando usuário com username: ${username}`);
    
    // Verificar se o usuário existe com SQL direto
    const result = await pool.query(
      'SELECT id, username, role FROM users WHERE username = $1',
      [username]
    );
    
    const existingUser = result.rows[0];
    
    if (!existingUser) {
      console.error(`Usuário '${username}' não encontrado.`);
      process.exit(1);
    }
    
    console.log('Usuário encontrado:', {
      id: existingUser.id,
      username: existingUser.username,
      role: existingUser.role
    });
    
    // Atualizar o role para 'admin' com SQL direto
    const updateResult = await pool.query(
      'UPDATE users SET role = $1 WHERE username = $2 RETURNING id, username, role',
      ['admin', username]
    );
    
    const updatedUser = updateResult.rows[0];
    
    if (updatedUser) {
      console.log('Usuário atualizado com sucesso!');
      console.log('Novo role:', updatedUser.role);
    } else {
      console.log('Nenhuma atualização foi realizada.');
    }
    
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
  console.error('Uso: node server/scripts/set-admin-role.cjs USERNAME');
  process.exit(1);
}

// Executar com erro de saída conectado
setAdminRole(username).catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
}); 