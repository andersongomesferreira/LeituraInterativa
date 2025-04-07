# Convenções de Código

## Visão Geral

Este documento define as convenções de código a serem seguidas em todo o projeto LeiturinhaBot para garantir consistência, legibilidade e manutenibilidade.

## Estrutura de Projeto

### Organização de Arquivos

```
src/
├── modules/                  # Módulos da aplicação
│   ├── [nome-modulo]/        # Cada módulo em pasta separada
│   │   ├── components/       # Componentes React do módulo
│   │   ├── hooks/            # Hooks personalizados  
│   │   ├── services/         # Serviços e lógica de negócios
│   │   ├── types.ts          # Definições de tipos para o módulo
│   │   ├── utils.ts          # Funções utilitárias específicas
│   │   └── index.ts          # Ponto de entrada do módulo
├── components/               # Componentes compartilhados
├── hooks/                    # Hooks compartilhados
├── lib/                      # Bibliotecas e utilitários
├── styles/                   # Estilos globais
├── types/                    # Tipos compartilhados
└── utils/                    # Utilitários compartilhados
```

### Estrutura de Módulos

Cada módulo segue o padrão:

```
modules/[nome-modulo]/
├── components/               # Componentes React específicos do módulo
│   ├── ComponenteA.tsx       # Um componente por arquivo
│   └── index.ts              # Exporta todos os componentes
├── hooks/                    # Hooks personalizados
│   ├── useFeatureA.ts        # Um hook por arquivo
│   └── index.ts              # Exporta todos os hooks
├── services/                 # Serviços específicos do módulo
│   ├── moduleService.ts      # Um serviço por arquivo
│   └── index.ts              # Exporta todos os serviços
├── types.ts                  # Definições de tipos para o módulo
└── index.ts                  # Exporta a API pública do módulo
```

### Estrutura de Serviços no Backend

```
server/
├── services/                 # Serviços do backend
│   ├── ai-providers/         # Provedores de IA
│   │   ├── provider-a.ts     # Um provedor por arquivo
│   │   ├── types.ts          # Tipos compartilhados pelos provedores
│   │   └── index.ts          # Exporta todos os provedores
│   ├── service-a.ts          # Um serviço por arquivo
│   └── index.ts              # Exporta todos os serviços
├── routes/                   # Rotas da API
├── middleware/               # Middleware compartilhado 
└── types/                    # Tipos compartilhados
```

## Nomenclatura

### Arquivos e Pastas

- **Componentes React**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useAuth.ts`)
- **Serviços**: camelCase com sufixo `Service` (`userService.ts`)
- **Tipos**: camelCase ou PascalCase dependendo do contexto
- **Utilitários**: camelCase (`formatDate.ts`)
- **Constantes**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)

### Variáveis e Funções

- **Variáveis**: camelCase (`userName`, `isLoggedIn`)
- **Funções**: camelCase (`getUserData()`, `formatDate()`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`, `API_TIMEOUT`)
- **Interfaces e Types**: PascalCase (`UserProfile`, `AuthState`)
- **Enums**: PascalCase (`UserRole`, `PaymentStatus`)

### Componentes React

- **Componentes**: PascalCase (`StoryCard`, `ChapterEditor`)
- **Props**: PascalCase com sufixo `Props` (`StoryCardProps`)
- **Contextos**: PascalCase com sufixo `Context` (`AuthContext`)
- **Providers**: PascalCase com sufixo `Provider` (`AuthProvider`)

### Serviços e Classes

- **Classes**: PascalCase (`CharacterConsistencyService`)
- **Métodos**: camelCase (`generateImage()`, `fetchUserData()`)
- **Instâncias**: camelCase (`const authService = new AuthService()`)

## Estilos de Codificação

### TypeScript/JavaScript

- Usar ponto-e-vírgula no final das instruções
- Usar aspas simples para strings
- Indentação de 2 espaços
- Limite de 100 caracteres por linha
- Declarar tipos explicitamente para APIs públicas
- Evitar o uso de `any` sempre que possível
- Usar interfaces para definir formas de objetos
- Adicionar tipos de retorno para funções públicas

```typescript
// Exemplo correto
interface UserData {
  id: string;
  name: string;
  email: string;
}

function fetchUserData(userId: string): Promise<UserData> {
  return api.get(`/users/${userId}`);
}
```

### React

- Usar componentes funcionais com hooks
- Declarar props usando interfaces TypeScript
- Usar destructuring para props
- Organizar imports na ordem: React, bibliotecas externas, imports locais
- Usar React.memo para componentes puros
- Extrair lógica complexa para hooks personalizados

```typescript
// Exemplo correto
import React from 'react';
import { useQuery } from 'react-query';

import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';

interface UserProfileProps {
  userId: string;
  showDetails?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  userId, 
  showDetails = false 
}) => {
  const { user } = useAuth();
  
  // Restante do componente
};
```

### CSS/Styling

- Usar CSS Modules ou Tailwind CSS
- Nomes de classes em kebab-case
- Evitar estilização inline
- Organizar propriedades CSS em ordem alfabética
- Preferir variáveis CSS para cores, espaçamentos e tipografia

## Arquitetura e Padrões

### Padrões de Design

- **Container/Presentational**: Separar lógica de negócios da apresentação
- **Custom Hooks**: Encapsular lógica reutilizável
- **Context API**: Para estado global compartilhado
- **Service Layer**: Para lógica de negócios e chamadas de API

### Gerenciamento de Estado

- **Local State**: `useState` para estado de componente
- **Form State**: React Hook Form para formulários
- **Server State**: React Query para dados do servidor
- **Global State**: Context API para estado global simples
- **Persistência**: LocalStorage através de custom hooks

### Tratamento de Erros

- Usar try/catch para operações assíncronas
- Centralizar tratamento de erros em interceptors ou middleware
- Usar tipos personalizados para erros (Error, ValidationError, etc.)
- Logar erros críticos no serviço de monitoramento

```typescript
// Exemplo correto
try {
  const result = await userService.updateProfile(userData);
  return result;
} catch (error) {
  logger.error('Failed to update user profile', { error, userId: userData.id });
  if (error instanceof ValidationError) {
    throw new ApiError(400, 'Dados inválidos', error.details);
  }
  throw new ApiError(500, 'Erro interno do servidor');
}
```

## Documentação

### Comentários

- Usar JSDoc para APIs públicas e funções complexas
- Manter comentários atualizados com a implementação
- Evitar comentários óbvios
- Documentar comportamentos não intuitivos ou edge cases

```typescript
/**
 * Gera uma imagem para o capítulo baseada no conteúdo
 * 
 * @param chapterId - ID do capítulo 
 * @param options - Opções de geração
 * @param options.style - Estilo visual (cartoon, watercolor, etc)
 * @param options.mood - Humor predominante (happy, adventure, etc)
 * @returns Promise com URL da imagem gerada
 * @throws {ApiError} Se o provedor de IA falhar
 */
async function generateChapterImage(
  chapterId: string, 
  options?: GenerationOptions
): Promise<string> {
  // Implementação
}
```

### Documentação de Módulos

- Cada módulo deve ter um arquivo README.md
- Explicar o propósito do módulo
- Documentar a API pública
- Mostrar exemplos de uso
- Documentar dependências e relacionamentos com outros módulos

## Testes

### Organização de Testes

- Colocar testes próximos ao código testado (`Component.test.tsx`)
- Usar pastas `__tests__` para organizar múltiplos arquivos de teste
- Nomear testes de forma descritiva (`should return user data when authenticated`)

### Padrões de Teste

- Usar Jest e React Testing Library
- Focar em comportamento, não implementação
- Testar componentes como o usuário os usaria
- Usar mocks para serviços externos
- Separar testes unitários, de integração e end-to-end

```typescript
// Exemplo correto
describe('AuthService', () => {
  describe('login', () => {
    it('should return user data when credentials are valid', async () => {
      // Preparação
      const validCredentials = { email: 'test@example.com', password: 'password123' };
      
      // Execução
      const result = await authService.login(validCredentials);
      
      // Verificação
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
    });
    
    it('should throw AuthError when credentials are invalid', async () => {
      // Preparação
      const invalidCredentials = { email: 'test@example.com', password: 'wrong' };
      
      // Execução e verificação
      await expect(authService.login(invalidCredentials)).rejects.toThrow(AuthError);
    });
  });
});
```

## Git e Controle de Versão

### Branches

- `main`: Branch de produção, sempre estável
- `develop`: Branch principal de desenvolvimento
- `feature/nome-feature`: Para novas funcionalidades
- `fix/nome-bug`: Para correções de bugs
- `refactor/nome-refatoracao`: Para refatorações

### Commits

- Mensagens de commit descritivas e claras
- Prefixos de commit: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
- Limitar a 72 caracteres na primeira linha
- Usar corpo do commit para explicações detalhadas quando necessário

### Pull Requests

- Descrever claramente o propósito do PR
- Listar as mudanças principais
- Referenciar issues relacionadas
- Incluir instruções para testes quando aplicável
- Solicitar reviewers apropriados

## Segurança

### Práticas de Segurança

- Sempre validar entrada do usuário
- Usar mecanismos de sanitização para evitar XSS
- Implementar CSRF protection
- Nunca armazenar senhas em texto plano
- Usar tokens JWT com tempo de expiração curto
- Implementar rate limiting em endpoints sensíveis
- Seguir o princípio do menor privilégio
- Implementar políticas RLS no PostgreSQL

### Segurança de Dados e Isolamento

- Toda operação de banco DEVE incluir filtro de usuário (userId ou childProfileId)
- Usar middleware de autorização para verificar acesso a recursos
- Implementar isolamento de cache por usuário
- Auditar operações entre usuários diferentes
- Validar IDs de usuário e perfis infantis em todas as rotas

## Otimização e Performance

### Práticas de Otimização

- Usar React.memo para componentes puros
- Implementar code-splitting e lazy loading
- Otimizar renders com useMemo e useCallback
- Implementar virtualização para listas grandes
- Adicionar índices apropriados no banco de dados
- Usar caching para dados frequentemente acessados
- Otimizar imagens e assets
- Implementar estratégias de retry e circuit breaker para serviços externos