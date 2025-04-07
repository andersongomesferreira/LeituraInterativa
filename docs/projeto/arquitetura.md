# Arquitetura do Sistema LeiturinhaBot

## Visão Geral

O LeiturinhaBot é uma plataforma de leitura interativa voltada para crianças, que utiliza IA para criar histórias personalizadas com ilustrações. A arquitetura do sistema foi projetada para ser modular, segura e escalável.

## Princípios Arquiteturais

- **Modularidade**: Componentes independentes com interfaces bem definidas
- **Segurança**: Isolamento de dados entre usuários, validação em múltiplas camadas
- **Escalabilidade**: Design que permite crescimento do número de usuários
- **Manutenibilidade**: Código organizado e bem documentado
- **Acessibilidade**: Interfaces adaptadas a diferentes faixas etárias

## Camadas da Aplicação

### Frontend (Cliente)

- **Tecnologias**: React, NextJS, Tailwind CSS
- **Componentes Principais**:
  - Interface de usuário adaptativa por faixa etária
  - Leitor de histórias interativo
  - Dashboard para pais/responsáveis
  - Sistema de perfis infantis

### Backend (Servidor)

- **Tecnologias**: Express.js, TypeScript, PostgreSQL (Neon)
- **Componentes Principais**:
  - API RESTful
  - Serviços de autenticação e autorização
  - Orquestração de serviços de IA
  - Gestão de histórias e capítulos

### Serviços de IA

- **Geração de Texto**: API da OpenAI (ChatGPT) e Anthropic (Claude)
- **Geração de Imagens**: Múltiplos provedores (OpenAI, GetImg, Stability AI, etc.)
- **Serviços Complementares**:
  - Avaliação de conteúdo por faixa etária
  - Geração de prompts aprimorados para ilustrações
  - Consistência de personagens entre capítulos

## Estrutura de Módulos

### Core

- Lógica central do sistema
- Orquestração de outros módulos
- Gestão de configurações globais

### Auth

- Autenticação de usuários
- Autorização baseada em funções
- Gestão de sessões

### Stories

- Criação e edição de histórias
- Estruturação em capítulos
- Metadados e categorização

### Generation

- Integração com APIs de IA
- Geração de texto narrativo
- Geração de ilustrações

### Profiles

- Gestão de perfis de usuário
- Perfis infantis e preferências
- Histórico de leitura

### UI

- Componentes reutilizáveis
- Temas e estilos
- Adaptação por faixa etária

## Fluxo de Dados

1. **Autenticação**: Usuário (pai/responsável) se autentica
2. **Seleção de Perfil**: Escolha do perfil infantil
3. **Interação com Histórias**: Criação ou continuação de histórias
4. **Geração de Conteúdo**: Texto e ilustrações via IA
5. **Persistência**: Armazenamento de histórias e progresso
6. **Feedback**: Interação com o conteúdo gerado

## Segurança e Privacidade

- **Isolamento de Dados**: Políticas RLS no PostgreSQL
- **Validação**: Validação em múltiplas camadas (frontend e backend)
- **Autenticação**: JWT com sistema personalizado
- **Proteção de Conteúdo**: Filtragem de conteúdo inadequado

## Integração e Implantação

- **Ambiente de Hospedagem**: Replit
- **CI/CD**: GitHub Actions
- **Monitoramento**: Logging estruturado e alertas

## Escalabilidade

- **Horizontal**: Arquitetura que permite replicação de serviços
- **Vertical**: Otimização de recursos por instância
- **Caching**: Estratégias de cache para conteúdo frequentemente acessado

## Considerações Técnicas

- Uso de TypeScript para tipagem estática
- Padronização de APIs com contratos claros
- Testes automatizados para componentes críticos
- Documentação abrangente de código e APIs