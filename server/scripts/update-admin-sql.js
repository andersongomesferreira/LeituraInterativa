// Script para gerar SQL para atualizar o usuário para admin
// Não precisa de conexão com o banco, apenas gera o SQL para ser executado manualmente

const username = process.argv[2] || 'andersongomes86';

console.log(`
========================================================================
SQL PARA ATUALIZAR O USUÁRIO '${username}' PARA ADMIN
========================================================================

-- Execute no seu cliente SQL (psql, pgAdmin, etc.) conectado ao banco:

UPDATE users SET role = 'admin' WHERE username = '${username}';

-- Para verificar se a atualização foi bem-sucedida:

SELECT id, username, name, email, role FROM users WHERE username = '${username}';

========================================================================
INSTRUÇÕES:
1. Copie o SQL acima
2. Execute no seu cliente SQL conectado ao banco de dados
3. Verifique se o usuário foi atualizado corretamente para role=admin
========================================================================
`); 