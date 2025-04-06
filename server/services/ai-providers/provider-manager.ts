import { 
  AIProvider, 
  ProviderRoutingConfig,
  TextGenerationParams,
  TextGenerationResult,
  ImageGenerationParams,
  ImageGenerationResult,
  HealthCheckResult
} from "./types";
import { OpenAIProvider } from "./openai-provider";
import { AnthropicProvider } from "./anthropic-provider";

// Lista de provedores disponíveis
const PROVIDERS = {
  openai: OpenAIProvider,
  anthropic: AnthropicProvider
};

// Configuração padrão de roteamento
const DEFAULT_ROUTING_CONFIG: ProviderRoutingConfig = {
  defaultTextProvider: "openai",
  defaultImageProvider: "openai",
  
  routingPreferences: {
    prioritizeAvailability: true,
    prioritizeResponseTime: true,
    prioritizeCost: true, // Agora priorizamos custo por padrão
    prioritizeQuality: true
  },
  
  fallbackPolicies: {
    textGeneration: ["openai", "anthropic"],
    imageGeneration: ["openai"]
  },
  
  userTierLimits: {
    free: {
      allowedProviders: ["openai"],
      maxRequests: 10,
      maxTokens: 4000
    },
    plus: {
      allowedProviders: ["openai", "anthropic"],
      maxRequests: 100,
      maxTokens: 16000
    },
    family: {
      allowedProviders: ["openai", "anthropic"],
      maxRequests: 300,
      maxTokens: 32000
    }
  }
};

export class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private healthCheckData: Map<string, HealthCheckResult> = new Map();
  private routingConfig: ProviderRoutingConfig;
  private performanceMetrics: Map<string, { 
    totalRequests: number,
    successfulRequests: number,
    failedRequests: number,
    averageResponseTime: number,
    lastUsed: Date
  }> = new Map();
  
  constructor(config?: Partial<ProviderRoutingConfig>) {
    this.routingConfig = { ...DEFAULT_ROUTING_CONFIG, ...config };
    this.initializeProviders();
  }
  
  private initializeProviders() {
    // Inicializar todos os provedores disponíveis
    for (const [id, Provider] of Object.entries(PROVIDERS)) {
      try {
        const provider = new Provider();
        this.providers.set(id, provider);
        console.log(`Initialized AI provider: ${provider.name}`);
        
        // Inicializar métricas de desempenho
        this.performanceMetrics.set(id, {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
          lastUsed: new Date()
        });
      } catch (error) {
        console.error(`Failed to initialize provider ${id}:`, error);
      }
    }
    
    // Executar verificação de saúde inicial
    this.checkProvidersHealth();
  }
  
  async checkProvidersHealth() {
    console.log("Checking health of all AI providers...");
    
    const healthCheckPromises = Array.from(this.providers.entries()).map(async ([id, provider]) => {
      try {
        const healthResult = await provider.checkHealth();
        this.healthCheckData.set(id, healthResult);
        return { id, result: healthResult };
      } catch (error) {
        console.error(`Health check failed for provider ${id}:`, error);
        const failedResult: HealthCheckResult = {
          isHealthy: false,
          responseTime: 0,
          timestamp: new Date(),
          message: error instanceof Error ? error.message : "Unknown error",
          errors: error
        };
        this.healthCheckData.set(id, failedResult);
        return { id, result: failedResult };
      }
    });
    
    const results = await Promise.all(healthCheckPromises);
    const healthySummary = results.filter(r => r.result.isHealthy).map(r => r.id).join(", ");
    const unhealthySummary = results.filter(r => !r.result.isHealthy).map(r => r.id).join(", ");
    
    console.log(`AI providers health check completed. Healthy: [${healthySummary}]. Unhealthy: [${unhealthySummary}]`);
    
    return results;
  }
  
  async generateText(params: TextGenerationParams, userTier: string = "free"): Promise<TextGenerationResult> {
    // Limitar acesso de acordo com o plano do usuário
    const tierLimits = this.routingConfig.userTierLimits[userTier] || this.routingConfig.userTierLimits.free;
    
    // Selecionar o provedor apropriado
    const providerId = await this.selectTextProvider(userTier);
    const provider = this.providers.get(providerId);
    
    if (!provider) {
      throw new Error(`No available text generation providers for tier: ${userTier}`);
    }
    
    // Registrar atividade
    this.logProviderActivity(providerId, "start");
    
    try {
      // Limitar tokens de acordo com o plano
      const maxTokens = Math.min(params.maxTokens || tierLimits.maxTokens, tierLimits.maxTokens);
      const result = await provider.generateText({
        ...params,
        maxTokens
      });
      
      // Registrar sucesso
      this.logProviderActivity(providerId, "success");
      
      return result;
    } catch (error) {
      // Registrar falha
      this.logProviderActivity(providerId, "failure");
      
      // Tentar com provedores de fallback
      return this.handleTextGenerationFallback(params, userTier, providerId, error);
    }
  }
  
  async generateImage(params: ImageGenerationParams, userTier: string = "free"): Promise<ImageGenerationResult> {
    // Limitar acesso de acordo com o plano do usuário
    const tierLimits = this.routingConfig.userTierLimits[userTier] || this.routingConfig.userTierLimits.free;
    
    // Selecionar o provedor apropriado (apenas OpenAI suporta geração de imagens atualmente)
    const providerId = await this.selectImageProvider(userTier);
    const provider = this.providers.get(providerId);
    
    if (!provider) {
      throw new Error(`No available image generation providers for tier: ${userTier}`);
    }
    
    // Registrar atividade
    this.logProviderActivity(providerId, "start");
    
    try {
      const result = await provider.generateImage(params);
      
      // Registrar sucesso
      this.logProviderActivity(providerId, "success");
      
      return result;
    } catch (error) {
      // Registrar falha
      this.logProviderActivity(providerId, "failure");
      
      // Tentar com provedores de fallback
      return this.handleImageGenerationFallback(params, userTier, providerId, error);
    }
  }
  
  private async selectTextProvider(userTier: string): Promise<string> {
    const tierLimits = this.routingConfig.userTierLimits[userTier] || this.routingConfig.userTierLimits.free;
    const allowedProviders = tierLimits.allowedProviders;
    
    // Filtrar provedores disponíveis e permitidos para este tier
    const availableProviders = Array.from(this.providers.entries())
      .filter(([id, provider]) => 
        allowedProviders.includes(id) && 
        provider.capabilities.textGeneration && 
        provider.status.isAvailable)
      .map(([id]) => id);
    
    if (availableProviders.length === 0) {
      // Se nenhum provedor está disponível, tente usar o fallback
      for (const id of this.routingConfig.fallbackPolicies.textGeneration) {
        if (allowedProviders.includes(id)) {
          const provider = this.providers.get(id);
          if (provider) {
            // Tentar atualizar o status
            await provider.checkHealth();
            if (provider.status.isAvailable) {
              return id;
            }
          }
        }
      }
      
      // Se ainda não tiver um provedor, use o padrão do nível
      return this.routingConfig.defaultTextProvider;
    }
    
    // Se houver apenas um provedor disponível, use-o
    if (availableProviders.length === 1) {
      return availableProviders[0];
    }
    
    // Implementar lógica de roteamento inteligente
    return this.routeIntelligently(availableProviders, "text");
  }
  
  private async selectImageProvider(userTier: string): Promise<string> {
    const tierLimits = this.routingConfig.userTierLimits[userTier] || this.routingConfig.userTierLimits.free;
    const allowedProviders = tierLimits.allowedProviders;
    
    // Filtrar provedores disponíveis e permitidos para este tier
    const availableProviders = Array.from(this.providers.entries())
      .filter(([id, provider]) => 
        allowedProviders.includes(id) && 
        provider.capabilities.imageGeneration && 
        provider.status.isAvailable)
      .map(([id]) => id);
    
    if (availableProviders.length === 0) {
      // Se nenhum provedor está disponível, tente usar o fallback
      for (const id of this.routingConfig.fallbackPolicies.imageGeneration) {
        if (allowedProviders.includes(id)) {
          const provider = this.providers.get(id);
          if (provider) {
            // Tentar atualizar o status
            await provider.checkHealth();
            if (provider.status.isAvailable) {
              return id;
            }
          }
        }
      }
      
      // Se ainda não tiver um provedor, use o padrão
      return this.routingConfig.defaultImageProvider;
    }
    
    // Se houver apenas um provedor disponível, use-o
    if (availableProviders.length === 1) {
      return availableProviders[0];
    }
    
    // Implementar lógica de roteamento inteligente
    return this.routeIntelligently(availableProviders, "image");
  }
  
  private routeIntelligently(providers: string[], serviceType: "text" | "image"): string {
    const { prioritizeAvailability, prioritizeResponseTime, prioritizeCost, prioritizeQuality } = this.routingConfig.routingPreferences;
    
    // Pontuação para cada provedor
    const scores = new Map<string, number>();
    for (const id of providers) {
      scores.set(id, 0);
    }
    
    // Avaliar com base na disponibilidade (status de saúde)
    if (prioritizeAvailability) {
      for (const id of providers) {
        const healthData = this.healthCheckData.get(id);
        if (healthData?.isHealthy) {
          scores.set(id, scores.get(id)! + 3);
        }
      }
    }
    
    // Avaliar com base no tempo de resposta
    if (prioritizeResponseTime) {
      // Ordenar por tempo de resposta (menor é melhor)
      const sortedByResponseTime = [...providers].sort((a, b) => {
        const timeA = this.healthCheckData.get(a)?.responseTime || Infinity;
        const timeB = this.healthCheckData.get(b)?.responseTime || Infinity;
        return timeA - timeB;
      });
      
      // Dar pontos baseados na posição (primeiro lugar recebe mais pontos)
      sortedByResponseTime.forEach((id, index) => {
        scores.set(id, scores.get(id)! + (sortedByResponseTime.length - index));
      });
    }
    
    // Avaliar com base na qualidade (preferência por modelos específicos)
    if (prioritizeQuality) {
      if (serviceType === "text") {
        // Para geração de texto, preferir GPT-3.5 para histórias básicas (mais barato e rápido)
        // e Claude/GPT-4 apenas para conteúdo que requer maior complexidade
        if (providers.includes("openai")) {
          // GPT-3.5 é bom o suficiente para histórias infantis padrão
          scores.set("openai", scores.get("openai")! + 2);
        }
        
        // Adicionar pontos por capacidade de contexto maior
        for (const id of providers) {
          const provider = this.providers.get(id);
          if (provider?.capabilities.maxContextLength && provider.capabilities.maxContextLength > 100000) {
            scores.set(id, scores.get(id)! + 1); // Menos peso do que antes
          }
        }
      } else if (serviceType === "image") {
        // Para imagens, qualquer provedor que possa gerar imagens adequadas para crianças
        // com ilustrações claras e simples é bom o suficiente
        for (const id of providers) {
          if (id === "openai") {
            // DALL-E tem boas capacidades para ilustrações infantis
            scores.set(id, scores.get(id)! + 2);
          }
        }
      }
    }
    
    // Avaliar com base no custo (agora com maior prioridade)
    if (prioritizeCost || serviceType === "image") { // Sempre considerar custo para imagens
      // Pontuação de custo dinamicamente calculada
      const costScore = (id: string): number => {
        // Valores aproximados de custo por API
        switch (id) {
          case "anthropic":
            return serviceType === "text" ? 3 : 0; // Melhor pontuação para texto, não gera imagem
          case "openai":
            return serviceType === "text" ? 2 : 2; // GPT-3.5 é mais barato que GPT-4, DALL-E é razoável
          default:
            return 1;
        }
      };
      
      // Aplicar pontuação de custo a cada provedor
      for (const id of providers) {
        const currentScore = scores.get(id) || 0;
        scores.set(id, currentScore + costScore(id) * (prioritizeCost ? 3 : 1));
      }
    }
    
    // Selecionar o provedor com a maior pontuação
    let bestProvider = providers[0];
    let highestScore = scores.get(bestProvider) || 0;
    
    // Usando uma abordagem compatível para iteração
    scores.forEach((score, id) => {
      if (score > highestScore) {
        highestScore = score;
        bestProvider = id;
      }
    });
    
    console.log(`Intelligent routing selected ${bestProvider} for ${serviceType} generation with score ${highestScore}`);
    return bestProvider;
  }
  
  private async handleTextGenerationFallback(
    params: TextGenerationParams, 
    userTier: string,
    failedProvider: string,
    error: any
  ): Promise<TextGenerationResult> {
    console.warn(`Text generation with ${failedProvider} failed, trying fallback providers`);
    
    const tierLimits = this.routingConfig.userTierLimits[userTier] || this.routingConfig.userTierLimits.free;
    const fallbackProviders = this.routingConfig.fallbackPolicies.textGeneration.filter(id => 
      id !== failedProvider && tierLimits.allowedProviders.includes(id));
    
    for (const id of fallbackProviders) {
      const provider = this.providers.get(id);
      if (provider && provider.capabilities.textGeneration) {
        try {
          // Atualizar status antes de tentar
          await provider.checkHealth();
          
          if (provider.status.isAvailable) {
            console.log(`Trying fallback text provider: ${id}`);
            this.logProviderActivity(id, "start");
            
            const result = await provider.generateText({
              ...params,
              maxTokens: Math.min(params.maxTokens || tierLimits.maxTokens, tierLimits.maxTokens)
            });
            
            this.logProviderActivity(id, "success");
            return result;
          }
        } catch (fallbackError) {
          console.error(`Fallback provider ${id} also failed:`, fallbackError);
          this.logProviderActivity(id, "failure");
        }
      }
    }
    
    // Se todos os fallbacks falharem, relance o erro original
    throw new Error(`Text generation failed with provider ${failedProvider} and all fallbacks: ${error.message}`);
  }
  
  private async handleImageGenerationFallback(
    params: ImageGenerationParams, 
    userTier: string,
    failedProvider: string,
    error: any
  ): Promise<ImageGenerationResult> {
    console.warn(`Image generation with ${failedProvider} failed, trying fallback providers`);
    
    const tierLimits = this.routingConfig.userTierLimits[userTier] || this.routingConfig.userTierLimits.free;
    const fallbackProviders = this.routingConfig.fallbackPolicies.imageGeneration.filter(id => 
      id !== failedProvider && tierLimits.allowedProviders.includes(id));
    
    for (const id of fallbackProviders) {
      const provider = this.providers.get(id);
      if (provider && provider.capabilities.imageGeneration) {
        try {
          // Atualizar status antes de tentar
          await provider.checkHealth();
          
          if (provider.status.isAvailable) {
            console.log(`Trying fallback image provider: ${id}`);
            this.logProviderActivity(id, "start");
            
            const result = await provider.generateImage(params);
            
            this.logProviderActivity(id, "success");
            return result;
          }
        } catch (fallbackError) {
          console.error(`Fallback provider ${id} also failed:`, fallbackError);
          this.logProviderActivity(id, "failure");
        }
      }
    }
    
    // Se todos os fallbacks falharem, retornar uma imagem de backup
    console.error("All image generation providers failed, returning backup image");
    
    return {
      imageUrl: "https://cdn.pixabay.com/photo/2016/04/15/20/28/cartoon-1332054_960_720.png",
      model: "backup",
      provider: "backup",
      promptUsed: params.prompt,
      isBackup: true
    };
  }
  
  private logProviderActivity(providerId: string, activity: "start" | "success" | "failure") {
    const metrics = this.performanceMetrics.get(providerId);
    if (!metrics) return;
    
    metrics.lastUsed = new Date();
    
    if (activity === "start") {
      metrics.totalRequests++;
    } else if (activity === "success") {
      metrics.successfulRequests++;
    } else if (activity === "failure") {
      metrics.failedRequests++;
    }
    
    // Calcular taxa de sucesso
    const successRate = metrics.totalRequests > 0 
      ? (metrics.successfulRequests / metrics.totalRequests) * 100 
      : 0;
      
    if (activity !== "start") {
      console.log(`Provider ${providerId} metrics: ${metrics.successfulRequests}/${metrics.totalRequests} successful (${successRate.toFixed(1)}%)`);
    }
  }
  
  // Método para obter métricas e status de todos os provedores
  getProvidersStatus() {
    const status = Array.from(this.providers.entries()).map(([id, provider]) => {
      const health = this.healthCheckData.get(id);
      const metrics = this.performanceMetrics.get(id);
      
      return {
        id,
        name: provider.name,
        status: provider.status,
        health,
        capabilities: provider.capabilities,
        metrics: metrics ? {
          totalRequests: metrics.totalRequests,
          successfulRequests: metrics.successfulRequests,
          failedRequests: metrics.failedRequests,
          successRate: metrics.totalRequests > 0 
            ? (metrics.successfulRequests / metrics.totalRequests) * 100 
            : 0,
          lastUsed: metrics.lastUsed
        } : undefined
      };
    });
    
    return status;
  }
  
  // Método para atualizar a configuração de roteamento
  updateRoutingConfig(config: Partial<ProviderRoutingConfig>) {
    this.routingConfig = {
      ...this.routingConfig,
      ...config
    };
    
    console.log("Updated AI provider routing configuration");
  }
}

// Criar e exportar uma instância única
export const aiProviderManager = new AIProviderManager();