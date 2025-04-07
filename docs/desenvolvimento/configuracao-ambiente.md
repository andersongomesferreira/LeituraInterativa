# Configuração do Ambiente de Desenvolvimento

Este documento detalha como configurar um ambiente de desenvolvimento completo para o LeiturinhaBot, tanto local quanto no Replit.

## Ambiente Local

### Pré-requisitos

- Node.js v20.x
- PostgreSQL v16.x
- Git

### Passo a Passo

1. **Clonar o repositório**
   ```bash
   git clone [url-do-repositorio]
   cd LeituraInterativa
   ```

2. **Instalar dependências**
   ```bash
   npm install
   ```

3. **Configurar banco de dados local**
   - Instale PostgreSQL se ainda não tiver instalado
   - Crie um banco de dados:
     ```sql
     CREATE DATABASE leiturinha;
     ```
   - Ou use o serviço Neon disponível em [neon.tech](https://neon.tech)

4. **Configurar variáveis de ambiente**
   ```bash
   # Copie o arquivo de exemplo
   cp .env.example .env
   
   # Edite o arquivo .env com suas credenciais e chaves de API
   ```

5. **Inicializar o banco de dados**
   ```bash
   npm run db:push
   ```

6. **Iniciar o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

7. **Acessar a aplicação**
   - Navegue para `http://localhost:3000`

### Variáveis de Ambiente

O arquivo `.env` deve conter as seguintes variáveis (todas incluídas no `.env.example`):

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| DATABASE_URL | URL de conexão com PostgreSQL | `postgresql://postgres:senha@localhost:5432/leiturinha` |
| JWT_SECRET | Chave secreta para tokens JWT | String aleatória |
| OPENAI_API_KEY | Chave API da OpenAI | Começa com `sk-...` |
| ANTHROPIC_API_KEY | Chave API da Anthropic | Começa com `sk-ant-...` |
| NODE_ENV | Ambiente de execução | `development` |
| PORT | Porta do servidor | `3000` |
| SESSION_SECRET | Segredo para sessões | String aleatória |

## Ambiente Replit

O projeto está configurado para ser executado no Replit sem configuração adicional, utilizando os módulos integrados do Replit.

### Configuração no Replit

1. **Forkar o projeto ou criar um novo Repl**
   - Use o template Node.js com Nix
   - Conecte ao repositório GitHub

2. **Configurar o arquivo `.replit`**
   - O repositório já contém a configuração necessária
   - Certifique-se de que inclui o módulo PostgreSQL:
     ```
     modules = ["nodejs-20", "web", "postgresql-16"]
     ```

3. **Configurar Secrets no Replit**
   - No painel do Replit, vá para "Secrets"
   - Adicione todas as variáveis de ambiente necessárias (mesmas do `.env`)
   - Importante: NÃO comite o arquivo `.env` no Replit

4. **Executar a aplicação**
   - Use o botão "Run" no Replit
   - Isso executará automaticamente os scripts definidos no arquivo `.replit`

### Conexão ao Banco de Dados no Replit

O Replit fornece uma instância PostgreSQL. Os detalhes de conexão estão disponíveis através das variáveis de ambiente:

```
DATABASE_URL=postgresql://$REPLIT_DB_USER:$REPLIT_DB_PASSWORD@$REPLIT_DB_HOST:$REPLIT_DB_PORT/$REPLIT_DB_NAME
```

### Persistência

- O Replit preserva o banco de dados entre execuções
- Os arquivos também são persistidos
- Para reset completo, use o painel de administração do Replit

## Ferramentas de Desenvolvimento

### Recomendadas

- VS Code com extensões:
  - ESLint
  - Prettier
  - TypeScript
  - Tailwind CSS IntelliSense
- TablePlus ou DBeaver para gerenciamento de banco de dados

### Comandos Úteis

```bash
# Verificar erros de tipagem
npm run check

# Executar build de produção
npm run build

# Iniciar em modo produção
npm run start

# Atualizar schema do banco de dados
npm run db:push
```

## Solução de Problemas

### Problemas Comuns

1. **Erro de conexão com banco de dados**
   - Verifique se o PostgreSQL está rodando
   - Confirme se a URL no .env está correta
   - Teste a conexão com uma ferramenta como psql

2. **Erros com dependências**
   - Execute `npm ci` para instalação limpa
   - Verifique se a versão do Node.js é a 20.x

3. **Problemas com APIs de IA**
   - Verifique se as chaves API são válidas
   - Confirme se tem créditos disponíveis nas plataformas
   - Verifique os logs para mensagens de erro detalhadas

### Logs e Depuração

- O sistema usa Winston para logs
- Defina `LOG_LEVEL=debug` para logs mais detalhados
- Execute `NODE_ENV=development npm run dev` para mensagens de depuração completas