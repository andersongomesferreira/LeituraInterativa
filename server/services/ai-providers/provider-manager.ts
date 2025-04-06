import { AIProvider, ProviderRoutingConfig, ImageGenerationParams, ImageGenerationResult, TextGenerationParams, TextGenerationResult } from './types';
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import { StabilityAIProvider } from './stability-provider';
import { LexicaProvider } from './lexica-provider';
import { ReplicateProvider } from './replicate-provider';

// Backup image URL for when all image generation providers fail
const BACKUP_IMAGE_URL = 'https://placehold.co/600x400/FFDE59/333333?text=Imagem+temporariamente+indisponível';

/**
 * AI Provider Manager
 * Manages multiple AI providers and routes requests based on availability and capabilities
 */
export class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private metrics: Map<string, { success: number, total: number }> = new Map();
  private routingConfig: ProviderRoutingConfig = {
    defaultTextProvider: 'openai',
    defaultImageProvider: 'openai',
    routingPreferences: {
      prioritizeAvailability: true,
      prioritizeResponseTime: true,
      prioritizeCost: false,
      prioritizeQuality: true,
      characterConsistency: true
    },
    fallbackPolicies: {
      textGeneration: ['anthropic', 'replicate'],
      imageGeneration: ['stability', 'lexica', 'replicate', 'anthropic']
    },
    userTierLimits: {
      free: {
        allowedProviders: ['openai', 'replicate'],
        maxRequests: 10,
        maxTokens: 4000
      },
      plus: {
        allowedProviders: ['openai', 'anthropic', 'stability', 'lexica', 'replicate'],
        maxRequests: 50,
        maxTokens: 16000
      },
      family: {
        allowedProviders: ['openai', 'anthropic', 'stability', 'lexica', 'replicate'],
        maxRequests: 100,
        maxTokens: 32000
      }
    }
  };
  
  constructor() {
    // Register default providers
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new AnthropicProvider());
    this.registerProvider(new StabilityAIProvider());
    this.registerProvider(new LexicaProvider());
    this.registerProvider(new ReplicateProvider());
    
    // Initialize metrics
    for (const provider of this.providers.values()) {
      this.metrics.set(provider.id, { success: 0, total: 0 });
    }
    
    // Start health check interval (every 15 minutes)
    setInterval(() => this.checkAllProvidersHealth(), 15 * 60 * 1000);
    
    // Run initial health check
    this.checkAllProvidersHealth();
  }
  
  /**
   * Registers a new AI provider
   */
  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
    this.metrics.set(provider.id, { success: 0, total: 0 });
    console.log(`Initialized AI provider: ${provider.name}`);
  }
  
  /**
   * Sets the API key for a specific provider
   */
  setProviderApiKey(providerId: string, apiKey: string): boolean {
    const provider = this.providers.get(providerId);
    if (!provider) {
      console.error(`Provider ${providerId} not found`);
      return false;
    }
    
    try {
      if ('setApiKey' in provider && typeof (provider as any).setApiKey === 'function') {
        (provider as any).setApiKey(apiKey);
        console.log(`API key updated for provider: ${provider.name}`);
        return true;
      } else {
        console.error(`Provider ${providerId} does not support setApiKey method`);
        return false;
      }
    } catch (error) {
      console.error(`Error setting API key for provider ${providerId}:`, error);
      return false;
    }
  }
  
  /**
   * Updates the routing configuration
   */
  updateRoutingConfig(config: Partial<ProviderRoutingConfig>): void {
    this.routingConfig = {
      ...this.routingConfig,
      ...config,
      routingPreferences: {
        ...this.routingConfig.routingPreferences,
        ...(config.routingPreferences || {})
      },
      fallbackPolicies: {
        ...this.routingConfig.fallbackPolicies,
        ...(config.fallbackPolicies || {})
      },
      userTierLimits: {
        ...this.routingConfig.userTierLimits,
        ...(config.userTierLimits || {})
      }
    };
  }
  
  /**
   * Checks the health of all registered providers
   */
  async checkAllProvidersHealth(): Promise<void> {
    console.log('Checking health of all AI providers...');
    
    const healthCheckPromises = Array.from(this.providers.values()).map(async provider => {
      try {
        const healthResult = await provider.checkHealth();
        return {
          providerId: provider.id,
          isHealthy: healthResult.isHealthy
        };
      } catch (error) {
        console.error(`Error checking health for provider ${provider.id}:`, error);
        return {
          providerId: provider.id,
          isHealthy: false
        };
      }
    });
    
    const results = await Promise.all(healthCheckPromises);
    const healthyProviders = results.filter(r => r.isHealthy).map(r => r.providerId);
    const unhealthyProviders = results.filter(r => !r.isHealthy).map(r => r.providerId);
    
    console.log(`AI providers health check completed. Healthy: [${healthyProviders.join(', ')}]. Unhealthy: [${unhealthyProviders.join(', ')}]`);
  }
  
  /**
   * Generates text using the optimal provider based on routing config
   */
  async generateText(params: TextGenerationParams, userTier: string = 'free'): Promise<TextGenerationResult> {
    // Get allowed providers for user tier
    const tierConfig = this.routingConfig.userTierLimits[userTier] || this.routingConfig.userTierLimits.free;
    const allowedProviderIds = tierConfig.allowedProviders;
    
    // Filter providers that support text generation and are allowed for this user tier
    const textProviders = Array.from(this.providers.values())
      .filter(p => p.capabilities.textGeneration && allowedProviderIds.includes(p.id))
      .filter(p => p.status.isAvailable);
    
    if (textProviders.length === 0) {
      throw new Error('No available text generation providers');
    }
    
    // Start with default provider
    let selectedProvider = this.providers.get(this.routingConfig.defaultTextProvider);
    
    // If default provider is not available or not allowed, use the first available
    if (!selectedProvider || !selectedProvider.status.isAvailable || !allowedProviderIds.includes(selectedProvider.id)) {
      selectedProvider = textProviders[0];
    }
    
    // Try with the selected provider
    try {
      // Update metrics
      const providerMetrics = this.metrics.get(selectedProvider.id) || { success: 0, total: 0 };
      providerMetrics.total++;
      this.metrics.set(selectedProvider.id, providerMetrics);
      
      const result = await selectedProvider.generateText(params);
      
      // Update success metrics
      providerMetrics.success++;
      this.metrics.set(selectedProvider.id, providerMetrics);
      
      return result;
    } catch (error) {
      console.error(`Text generation with ${selectedProvider.id} failed:`, error);
      
      // Try fallback providers based on fallback policy
      for (const fallbackId of this.routingConfig.fallbackPolicies.textGeneration) {
        const fallbackProvider = this.providers.get(fallbackId);
        
        if (fallbackProvider && fallbackProvider.id !== selectedProvider.id &&
            fallbackProvider.status.isAvailable && 
            fallbackProvider.capabilities.textGeneration &&
            allowedProviderIds.includes(fallbackProvider.id)) {
          try {
            console.log(`Trying fallback text generation with ${fallbackProvider.id}`);
            
            // Update metrics
            const fallbackMetrics = this.metrics.get(fallbackProvider.id) || { success: 0, total: 0 };
            fallbackMetrics.total++;
            this.metrics.set(fallbackProvider.id, fallbackMetrics);
            
            const result = await fallbackProvider.generateText(params);
            
            // Update success metrics
            fallbackMetrics.success++;
            this.metrics.set(fallbackProvider.id, fallbackMetrics);
            
            return result;
          } catch (fallbackError) {
            console.error(`Fallback text generation with ${fallbackProvider.id} failed:`, fallbackError);
          }
        }
      }
      
      // If all providers failed, rethrow the original error
      throw error;
    }
  }
  
  /**
   * Generates an image using the optimal provider based on routing config
   */
  async generateImage(params: ImageGenerationParams, userTier: string = 'free'): Promise<ImageGenerationResult> {
    // Get allowed providers for user tier
    const tierConfig = this.routingConfig.userTierLimits[userTier] || this.routingConfig.userTierLimits.free;
    const allowedProviderIds = tierConfig.allowedProviders;
    
    // Filter providers that support image generation and are allowed for this user tier
    const imageProviders = Array.from(this.providers.values())
      .filter(p => p.capabilities.imageGeneration && allowedProviderIds.includes(p.id))
      .filter(p => p.status.isAvailable);
    
    if (imageProviders.length === 0) {
      // Return backup image if no available providers
      console.warn('No available image generation providers, using backup image');
      return {
        imageUrl: BACKUP_IMAGE_URL,
        model: 'backup',
        provider: 'backup',
        promptUsed: params.prompt,
        isBackup: true
      };
    }
    
    // Start with default provider
    let selectedProvider = this.providers.get(this.routingConfig.defaultImageProvider);
    
    // If default provider is not available or not allowed, use the first available
    if (!selectedProvider || !selectedProvider.status.isAvailable || !allowedProviderIds.includes(selectedProvider.id)) {
      selectedProvider = imageProviders[0];
    }
    
    // Try with the selected provider
    try {
      // Update metrics
      const providerMetrics = this.metrics.get(selectedProvider.id) || { success: 0, total: 0 };
      providerMetrics.total++;
      this.metrics.set(selectedProvider.id, providerMetrics);
      
      const result = await selectedProvider.generateImage(params);
      
      // Update success metrics
      providerMetrics.success++;
      this.metrics.set(selectedProvider.id, providerMetrics);
      
      // Log success rate
      console.log(`Provider ${selectedProvider.id} metrics: ${providerMetrics.success}/${providerMetrics.total} successful (${(providerMetrics.success / providerMetrics.total * 100).toFixed(1)}%)`);
      
      return result;
    } catch (error) {
      console.error(`Image generation with ${selectedProvider.id} failed:`, error);
      console.log(`Provider ${selectedProvider.id} metrics: ${this.metrics.get(selectedProvider.id)?.success}/${this.metrics.get(selectedProvider.id)?.total} successful (${(this.metrics.get(selectedProvider.id)?.success! / this.metrics.get(selectedProvider.id)?.total! * 100).toFixed(1)}%)`);
      
      console.log('Image generation with', selectedProvider.id, 'failed, trying fallback providers');
      
      // Try fallback providers based on fallback policy
      for (const fallbackId of this.routingConfig.fallbackPolicies.imageGeneration) {
        const fallbackProvider = this.providers.get(fallbackId);
        
        if (fallbackProvider && fallbackProvider.id !== selectedProvider.id &&
            fallbackProvider.status.isAvailable && 
            fallbackProvider.capabilities.imageGeneration &&
            allowedProviderIds.includes(fallbackProvider.id)) {
          try {
            console.log(`Trying fallback image generation with ${fallbackProvider.id}`);
            
            // Update metrics
            const fallbackMetrics = this.metrics.get(fallbackProvider.id) || { success: 0, total: 0 };
            fallbackMetrics.total++;
            this.metrics.set(fallbackProvider.id, fallbackMetrics);
            
            const result = await fallbackProvider.generateImage(params);
            
            // Update success metrics
            fallbackMetrics.success++;
            this.metrics.set(fallbackProvider.id, fallbackMetrics);
            
            return result;
          } catch (fallbackError) {
            console.error(`Fallback image generation with ${fallbackProvider.id} failed:`, fallbackError);
          }
        }
      }
      
      // If all providers failed, return backup image
      console.error('All image generation providers failed, returning backup image');
      return {
        imageUrl: BACKUP_IMAGE_URL,
        model: 'backup',
        provider: 'backup',
        promptUsed: params.prompt,
        isBackup: true
      };
    }
  }
  
  /**
   * Gets a list of all registered providers with their status
   */
  getProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }
  
  /**
   * Gets all providers' status information
   */
  getProvidersStatus(): Array<{
    id: string;
    name: string;
    isAvailable: boolean;
    capabilities: string[];
    metrics: { success: number; total: number; successRate: string };
  }> {
    return Array.from(this.providers.values()).map(provider => {
      const metrics = this.metrics.get(provider.id) || { success: 0, total: 0 };
      const successRate = metrics.total > 0 
        ? ((metrics.success / metrics.total) * 100).toFixed(1) + '%'
        : 'N/A';
      
      const capabilities = [];
      if (provider.capabilities.textGeneration) capabilities.push('text');
      if (provider.capabilities.imageGeneration) capabilities.push('image');
      if (provider.capabilities.audioGeneration) capabilities.push('audio');
      if (provider.capabilities.multimodalSupport) capabilities.push('multimodal');
      
      return {
        id: provider.id,
        name: provider.name,
        isAvailable: provider.status.isAvailable,
        capabilities,
        metrics: {
          success: metrics.success,
          total: metrics.total,
          successRate
        }
      };
    });
  }
}

// Create singleton instance
export const aiProviderManager = new AIProviderManager();