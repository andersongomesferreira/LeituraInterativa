# Módulo de Geração de Imagens

## Descrição
O módulo de geração de imagens é responsável por criar ilustrações para histórias infantis, garantindo consistência visual, adequação à faixa etária e relevância narrativa.

## Componentes Principais

### 1. Serviço de Aprimoramento de Prompts
**Arquivo:** `server/services/prompt-enhancement-service.ts`

Este serviço aprimora a qualidade dos prompts enviados para os geradores de imagem, resultando em ilustrações mais relevantes e esteticamente adequadas.

#### Funcionalidades:
- **Extração de elementos-chave**: Identifica objetos, cenários, ações, emoções e cores do texto
- **Detecção de personagens**: Extrai nomes e características de personagens do texto
- **Adaptação por faixa etária**: Ajusta o estilo visual de acordo com a idade do público-alvo
- **Direção artística**: Define estilo, complexidade, contornos e esquema de cores
- **Prompts negativos**: Evita problemas comuns em ilustrações para crianças

#### Métodos principais:
```typescript
enhanceChapterImagePrompt(params): string
enhanceCharacterImagePrompt(params): string 
enhanceSceneImagePrompt(params): string
detectMood(text): string
extractCharacterNames(text): string[]
extractCharacterDescription(characterName, text): string
```

### 2. Serviço de Consistência de Personagens
**Arquivo:** `server/services/character-consistency-service.ts`

Mantém a consistência visual dos personagens entre diferentes ilustrações, armazenando e gerenciando suas características visuais.

#### Funcionalidades:
- **Cache de personagens**: Armazena descrições por história e personagem
- **Extração de atributos visuais**: Identifica cores, roupas e características distintivas
- **Histórico de aparições**: Mantém registro de ilustrações por capítulo
- **Geração de atributos**: Cria cores consistentes para personagens novos

#### Métodos principais:
```typescript
getCharacterDescriptions(storyId, characterNames): Promise<CharacterDescription[]>
updateCharacterVisuals(storyId, characterUpdates): void
extractVisualAttributes(description): CharacterDescription['visualAttributes']
getCharacterSummary(storyId): any
```

### 3. Gerenciador de Provedores de IA
**Arquivo:** `server/services/ai-providers/provider-manager.ts`

Gerencia múltiplos provedores de geração de imagens, oferecendo rotação e fallback.

#### Funcionalidades:
- **Rotação de provedores**: Alterna entre provedores disponíveis
- **Detecção de falhas**: Identifica e marca provedores com problemas
- **Fallback automático**: Redireciona para provedores alternativos em caso de falha
- **Seleção baseada em estilo**: Escolhe provedores mais adequados para cada estilo visual

#### Métodos principais:
```typescript
generateImage(params): Promise<string>
registerImageProvider(provider): void
getNextImageProvider(): AIProvider | null
```

### 4. Serviço de AI (Interface Principal)
**Arquivo:** `server/services/ai-service.ts`

Integra os serviços acima, oferecendo uma interface unificada para geração de imagens.

#### Funcionalidades:
- **Geração de imagens para capítulos**: Cria ilustrações para capítulos específicos
- **Geração de imagens para personagens**: Cria retratos de personagens
- **Tratamento de erros**: Lida com falhas na geração e tenta alternativas
- **Logging**: Registra informações sobre o processo de geração

#### Métodos principais:
```typescript
generateChapterImage(prompt, storyId, chapterId, options, userTier): Promise<{ success: boolean; imageUrl?: string; error?: string }>
generateCharacterImage(characterName, characterDescription, storyId, options): Promise<{ success: boolean; imageUrl?: string; error?: string }>
```

## Fluxo de Geração de Imagens

1. **Solicitação de imagem**:
   - O usuário ou sistema solicita uma imagem para um capítulo ou personagem
   - A solicitação inclui informações como storyId, chapterId, texto relevante

2. **Preparação do prompt**:
   - O `ai-service` extrai informações relevantes do texto
   - Os nomes de personagens são identificados
   - O texto é enviado para o serviço de aprimoramento de prompts

3. **Aprimoramento do prompt**:
   - `prompt-enhancement-service` extrai elementos-chave do texto
   - O serviço detecta o clima/humor predominante
   - Um prompt estruturado é criado com direção artística específica
   - Prompts negativos são adicionados para evitar problemas comuns

4. **Obtenção de informações de personagens**:
   - `character-consistency-service` é consultado para obter descrições visuais
   - Atributos visuais são incluídos no prompt para manter consistência

5. **Geração da imagem**:
   - O prompt aprimorado é enviado para o `aiProviderManager`
   - O gerenciador seleciona um provedor adequado para o estilo solicitado
   - Se o provedor falhar, o sistema tenta automaticamente outros provedores

6. **Atualização de consistência**:
   - Após geração bem-sucedida, `character-consistency-service` é atualizado
   - Novas informações visuais são extraídas e armazenadas para uso futuro

7. **Retorno do resultado**:
   - A URL da imagem gerada é retornada para o cliente
   - Em caso de falha em todos os provedores, uma mensagem de erro é retornada

## Provedores de Imagens Suportados

Atualmente, o sistema suporta os seguintes provedores de geração de imagens:

- **Runware**: Eficaz para ilustrações de estilo cartoon e digital
- **Stability AI**: Bom para estilos de aquarela e lápis
- **GetImg**: Especializado em imagens no estilo cartoon
- **Lexica**: Alternativa para diversos estilos
- **Replicate**: Usado como backup para estilos específicos

## Personalizações Disponíveis

O sistema suporta as seguintes opções de personalização para as imagens:

### Estilos Visuais
- **cartoon**: Estilo de desenho animado infantil (padrão)
- **watercolor**: Estilo de aquarela com pinceladas suaves
- **pencil**: Ilustrações com traços de lápis e texturas sutis
- **digital**: Ilustração digital moderna com efeitos de luz

### Faixas Etárias
- **3-5**: Imagens simples, cores primárias, contornos grossos
- **6-8**: Detalhes moderados, paleta mais diversificada (padrão)
- **9-12**: Mais detalhes, esquemas de cores sofisticados

### Humor/Clima
- **happy**: Atmosfera alegre e ensolarada (padrão)
- **adventure**: Sensação de descoberta, iluminação dramática
- **calm**: Ambiente tranquilo, tons suaves, luz difusa
- **exciting**: Energia e movimento, cores intensas

## Exemplos de Uso

### Geração de imagem para capítulo
```typescript
const imageResult = await generateChapterImage(
  `Ilustração para o capítulo "A Floresta Encantada": João e Maria encontraram um pequeno coelho azul que brilhava na escuridão da floresta.`,
  123, // storyId
  2,   // chapterId
  { 
    ageGroup: '6-8',
    style: 'cartoon',
    mood: 'adventure'
  },
  'plus' // userTier
);

if (imageResult.success) {
  console.log(`Imagem gerada: ${imageResult.imageUrl}`);
} else {
  console.error(`Erro: ${imageResult.error}`);
}
```

### Geração de imagem para personagem
```typescript
const characterImage = await generateCharacterImage(
  'Coelho Azul',
  'Um coelho de pelagem azul brilhante com olhos grandes e expressivos. Ele tem orelhas longas e usa um pequeno lenço vermelho no pescoço.',
  123, // storyId
  {
    ageGroup: '6-8',
    style: 'cartoon'
  }
);
```

## Considerações sobre Performance

- As chamadas para provedores de IA são as operações mais caras/demoradas
- O sistema implementa cache para evitar regenerar imagens desnecessariamente
- As imagens são armazenadas em URLs externas (provedores de IA)
- O fallback automático entre provedores pode aumentar o tempo de resposta em caso de falhas

## Limitações Conhecidas

1. **Inconsistência ocasional**: Mesmo com as melhorias, pode haver variações na aparência de personagens
2. **Dependência de provedores externos**: O sistema depende de APIs externas que podem mudar ou ficar indisponíveis
3. **Tempo de geração**: A criação de imagens pode levar vários segundos
4. **Custo de operação**: A geração de imagens tem custos associados por chamada de API

## Próximas Melhorias Planejadas

1. **Interface para regeneração seletiva**: Permitir que usuários regenerem apenas imagens específicas
2. **Histórico visual de personagens**: Interface para visualizar todas as aparições de um personagem
3. **Ajuste fino de imagens**: Permitir que usuários façam ajustes manuais no prompt
4. **Opções avançadas**: Mais controle sobre aspectos específicos da imagem
5. **Cache local de imagens**: Armazenar cópias das imagens para reduzir dependência de provedores externos