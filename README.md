# LeiturinhaBot

Sistema de leitura interativa com geração de histórias e ilustrações usando IA.

## Ambiente de Desenvolvimento

### Pré-requisitos

- Node.js (v20)
- PostgreSQL (v16)
- Git

### Configuração Inicial

1. Clone o repositório:
   ```
   git clone [url-do-repositorio]
   cd LeituraInterativa
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```
   cp .env.example .env
   ```
   Edite o arquivo `.env` com suas configurações e chaves de API.

4. Inicialize o banco de dados:
   ```
   npm run db:push
   ```

5. Inicie o servidor de desenvolvimento:
   ```
   npm run dev
   ```

6. Acesse a aplicação em `http://localhost:3000`

### Estrutura do Projeto

- `client/`: Frontend React
- `server/`: Backend Express
- `shared/`: Código compartilhado entre frontend e backend
- `docs/`: Documentação do projeto

### Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento
- `npm run build`: Compila o projeto para produção
- `npm run start`: Inicia o servidor em modo produção
- `npm run check`: Verifica erros de tipagem TypeScript
- `npm run db:push`: Atualiza o schema do banco de dados
- `npm run seed`: Popula o banco de dados com dados iniciais

## Ambiente de Produção

A aplicação está configurada para deploy no Replit. O fluxo de integração contínua é gerenciado via GitHub Actions.

## Acesso Administrativo

O sistema possui uma área administrativa para gerenciamento da plataforma, monitoramento de recursos e testes das funcionalidades de IA.

### Acesso à Área Administrativa

O acesso à área administrativa é baseado apenas no nome de usuário:

1. Crie um usuário com o nome de usuário exato: `andersongomes86` (case-sensitive)
2. Faça login com este usuário
3. Acesse a URL `/admin` no navegador

A área administrativa inclui:

- **Dashboard**: Visão geral e estatísticas do sistema
- **Gerenciamento de usuários**: Controle de contas e permissões
- **Teste de IA**: Interface para testar geração de histórias e imagens
- **Monitoramento**: Estado do sistema e uso de recursos
- **Chaves de API**: Gerenciamento de chaves para serviços de IA

## Documentação

A documentação completa do projeto está disponível na pasta `docs/`:

- `docs/projeto/`: Arquitetura e visão geral
- `docs/desenvolvimento/`: Convenções e práticas de código
- `docs/memoria/`: Estado atual e progresso do desenvolvimento
- `docs/modulos/`: Detalhes sobre os módulos do sistema
- `docs/guia-ia/`: Instruções para assistentes de IA

## Licença

MIT