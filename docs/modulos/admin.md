# Módulo Administrativo

Este documento descreve o módulo administrativo do sistema LeiturinhaBot, que fornece funcionalidades de gerenciamento da plataforma, monitoramento de recursos e testes de IA.

## Visão Geral

O módulo administrativo é acessível apenas para o usuário com nome de usuário "andersongomes86". Não há necessidade de configuração especial de funções de usuário (roles) nesta versão simplificada.

## Rotas da API

Todas as rotas da API administrativa estão protegidas pelo middleware `isAdmin` que verifica se o usuário autenticado possui o username "andersongomes86".

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin/system-resources` | Obtém informações sobre recursos do sistema (CPU, memória, etc.) |
| GET | `/api/admin/stats` | Obtém estatísticas da plataforma (usuários, histórias, gerações) |
| GET | `/api/admin/models` | Lista todos os modelos de IA disponíveis |
| POST | `/api/admin/test-story-generation` | Testa a geração de história com parâmetros específicos |
| POST | `/api/admin/test-image-generation` | Testa a geração de imagem com parâmetros específicos |
| GET | `/api/admin/api-keys` | Lista todas as chaves de API para integração com serviços externos |
| POST | `/api/admin/api-keys` | Cria uma nova chave de API |
| PUT | `/api/admin/api-keys/:id` | Atualiza uma chave de API existente |
| DELETE | `/api/admin/api-keys/:id` | Remove uma chave de API |

## Acesso ao Admin

Para acessar a área administrativa:

1. Crie um usuário com o nome de usuário exato "andersongomes86" (case-sensitive)
2. Faça login com este usuário
3. Acesse a URL `/admin` no navegador

A segurança nesta versão está baseada apenas na verificação do nome de usuário, sem necessidade de configurações adicionais.

## Interface de Administração

A interface de administração é acessível através do navegador na rota `/admin` e inclui:

### Dashboard

- Visão geral do sistema
- Contagem de usuários ativos e inativos
- Estatísticas de geração de histórias e imagens
- Estado dos provedores de IA

### Teste de IA

- Formulários para testar geração de histórias com diferentes modelos
- Formulários para testar geração de imagens com diferentes modelos
- Visualização de resultados, incluindo estatísticas de performance e custo

### Monitoramento de Sistema

- Uso de CPU e memória
- Tempo de atividade do servidor
- Logs de erros e avisos

### Gerenciamento de Chaves de API

- Criação e gerenciamento de chaves para integração com provedores de IA
- Monitoramento de uso e cotas

## Logs e Auditoria

Todas as ações realizadas na área administrativa são registradas no sistema de logs com o nível `info` e incluem:

- Usuário que realizou a ação
- Tipo de ação realizada
- Timestamp
- Dados relevantes da ação

## Arquivos Relacionados

- `server/routes/admin.ts`: Rotas da API administrativa
- `server/services/admin-service.ts`: Serviços para funcionalidades administrativas
- `server/middleware/security.ts`: Middleware de segurança, incluindo verificação de admin 