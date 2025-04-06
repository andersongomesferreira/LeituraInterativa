// Interfaces principais para o sistema de provedores de IA

// Definição básica de um provedor de IA
export interface AIProvider {
  id: string;
  name: string;
  status: ProviderStatus;
  capabilities: ProviderCapabilities;
  
  checkHealth(): Promise<HealthCheckResult>;
  generateText(params: TextGenerationParams): Promise<TextGenerationResult>;
  generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult>;
}

// Status atual de um provedor
export interface ProviderStatus {
  isAvailable: boolean;
  lastChecked: Date;
  responseTime?: number;
  statusMessage?: string;
  quotaRemaining?: number;
  quotaTotal?: number;
}

// Capacidades de um provedor
export interface ProviderCapabilities {
  textGeneration: boolean;
  imageGeneration: boolean;
  audioGeneration: boolean;
  maxContextLength?: number;
  languagesSupported?: string[];
  multimodalSupport?: boolean;
}

// Resultado da verificação de saúde
export interface HealthCheckResult {
  isHealthy: boolean;
  responseTime: number;
  timestamp: Date;
  message: string;
  quotaStatus?: {
    remaining: number;
    total: number;
  };
  errors?: any;
}

// Parâmetros para geração de texto
export interface TextGenerationParams {
  prompt: string;
  systemMessage?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  model?: string;
  format?: "text" | "json" | "markdown";
  languageCode?: string;
}

// Resultado da geração de texto
export interface TextGenerationResult {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: any;
  
  // For error handling in providers
  success?: boolean;
  error?: string;
  text?: string; // Alternative to content for some providers
}

// Parâmetros para geração de imagem
export interface ImageGenerationParams {
  prompt: string;
  n?: number;
  size?: string;
  quality?: string;
  style?: string;
  responseFormat?: string;
  model?: string;
  ageGroup?: string;
  mood?: string;
  seed?: number; // Seed for reproducible generations
  batchSize?: number; // Number of images to generate in a batch
  characterDescriptions?: CharacterDescription[]; // Descrições de personagens para manter consistência
  storyId?: number; // ID da história para rastreamento de consistência
  chapterId?: number; // ID do capítulo para progressão
}

// Descrição de personagem para consistência visual
export interface CharacterDescription {
  name: string;
  appearance: string;
  visualAttributes?: {
    colors: string[];
    clothing?: string;
    accessories?: string[];
    distinguishingFeatures?: string[];
  };
  previousImages?: string[]; // URLs de imagens anteriores do personagem
}

// Resultado da geração de imagem
export interface ImageGenerationResult {
  imageUrl: string;
  base64Image?: string;
  model?: string;
  provider?: string;
  promptUsed?: string;
  metadata?: any;
  isBackup?: boolean;
  alternativeImages?: string[]; // For batch generation results
  
  // For error handling and provider implementation
  success: boolean; // Making this required to enforce consistent error handling
  error?: string;
  details?: any;
}

// Configuração de roteamento para provedores
export interface ProviderRoutingConfig {
  defaultTextProvider: string;
  defaultImageProvider: string;
  
  // Preferências para seleção inteligente
  routingPreferences: {
    prioritizeAvailability: boolean; // Priorizar provedores disponíveis
    prioritizeResponseTime: boolean; // Priorizar provedores mais rápidos
    prioritizeCost: boolean; // Priorizar provedores mais baratos
    prioritizeQuality: boolean; // Priorizar provedores com melhor qualidade
    characterConsistency?: boolean; // Priorizar consistência em personagens nas ilustrações
  };
  
  // Políticas de fallback
  fallbackPolicies: {
    textGeneration: string[];
    imageGeneration: string[];
  };
  
  // Limites baseados no plano do usuário
  userTierLimits: {
    [tier: string]: {
      allowedProviders: string[];
      maxRequests: number;
      maxTokens: number;
    };
  };
}

// Interfaces básicas utilizadas na integração com provedores de IA