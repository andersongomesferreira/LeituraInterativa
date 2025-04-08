import { AIProvider, ProviderRoutingConfig, ImageGenerationParams, ImageGenerationResult, TextGenerationParams, TextGenerationResult } from './types';
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import { StabilityAIProvider } from './stability-provider';
import { LexicaProvider } from './lexica-provider';
import { ReplicateProvider } from './replicate-provider';
import { GetImgProvider } from './getimg-provider';
import { RunwareProvider } from './runware-provider';
import { HuggingFaceProvider } from './huggingface-provider';
import config from '../../config';
import logger from '../logger';

// Backup image URL for when all image generation providers fail
const BACKUP_IMAGE_URL = 'https://placehold.co/600x400/FFDE59/333333?text=Imagem+temporariamente+indisponível';

// Add the AICapability enum
export enum AICapability {
  TEXT_GENERATION = 'text',
  IMAGE_GENERATION = 'image',
  AUDIO_GENERATION = 'audio'
}

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
      imageGeneration: ['getimg', 'runware', 'stability', 'lexica', 'replicate', 'anthropic']
    },
    userTierLimits: {
      free: {
        allowedProviders: ['openai', 'replicate', 'getimg'],
        maxRequests: 10,
        maxTokens: 4000
      },
      plus: {
        allowedProviders: ['openai', 'anthropic', 'stability', 'lexica', 'replicate', 'getimg', 'runware'],
        maxRequests: 50,
        maxTokens: 16000
      },
      family: {
        allowedProviders: ['openai', 'anthropic', 'stability', 'lexica', 'replicate', 'getimg', 'runware'],
        maxRequests: 100,
        maxTokens: 32000
      }
    }
  };

  // Índices para rotação dos provedores
  private currentTextProviderIndex = 0;
  private currentImageProviderIndex = 0;

  // Provedores em falha temporária (evitar uso por um período)
  private failedTextProviders: Map<string, number> = new Map();
  private failedImageProviders: Map<string, number> = new Map();

  // Período de espera para tentar novamente um provedor que falhou (15 minutos)
  private readonly RETRY_TIMEOUT = 15 * 60 * 1000;

  // Método para definir o provedor preferido para testes
  private tempPreferredProviders: Record<AICapability, string> = {
    [AICapability.TEXT_GENERATION]: '',
    [AICapability.IMAGE_GENERATION]: '',
    [AICapability.AUDIO_GENERATION]: ''
  };

  constructor() {
    // Register default providers
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new AnthropicProvider());
    this.registerProvider(new StabilityAIProvider());
    this.registerProvider(new LexicaProvider());
    this.registerProvider(new ReplicateProvider());
    this.registerProvider(new GetImgProvider());
    this.registerProvider(new RunwareProvider());
    this.registerProvider(new HuggingFaceProvider());

    // Initialize metrics
    Array.from(this.providers.values()).forEach(provider => {
      this.metrics.set(provider.id, { success: 0, total: 0 });
    });

    // Load API keys from configuration
    this.loadApiKeysFromConfig();

    // Rodar verificação periódica para limpar provedores falhos após o timeout
    setInterval(() => this.cleanupFailedProviders(), 60 * 1000);

    logger.info('AIProviderManager inicializado com sucesso');
    logger.info(`Provedores de texto registrados: ${Array.from(this.providers.values()).filter(p => p.capabilities.textGeneration).map(p => p.id).join(', ')}`);
    logger.info(`Provedores de imagem registrados: ${Array.from(this.providers.values()).filter(p => p.capabilities.imageGeneration).map(p => p.id).join(', ')}`);
  }

  /**
   * Load API keys from configuration
   */
  private loadApiKeysFromConfig(): void {
    console.log('Loading API keys from configuration...');

    // Define providers e suas chaves de configuração
    interface ProviderKeyMap {
      configKey: keyof typeof config.ai;
      providerId: string;
    }

    // Mapear as configurações de forma segura para tipos
    const providerMappings: ProviderKeyMap[] = [
      { configKey: 'openai', providerId: 'openai' },
      { configKey: 'anthropic', providerId: 'anthropic' },
      { configKey: 'stability', providerId: 'stability' },
      { configKey: 'replicate', providerId: 'replicate' },
      { configKey: 'getimg', providerId: 'getimg' },
      { configKey: 'runware', providerId: 'runware' },
      { configKey: 'huggingface', providerId: 'huggingface' }
    ];

    // Track which keys were loaded
    const loadedKeys: string[] = [];

    // Attempt to load and set API keys
    providerMappings.forEach(({ configKey, providerId }) => {
      const apiKey = config.ai[configKey]?.apiKey;

      if (apiKey && apiKey.trim() !== '') {
        try {
          const result = this.setProviderApiKey(providerId, apiKey);

          if (result.success) {
            loadedKeys.push(providerId);
            console.log(`Successfully loaded API key for ${providerId} from configuration`);
          } else {
            console.warn(`Failed to set API key for ${providerId} from configuration: ${result.message}`);
          }
        } catch (error) {
          console.error(`Error setting API key for ${providerId}:`, error);
        }
      } else {
        console.log(`No API key found for ${providerId}`);
      }
    });

    console.log(`API key loading complete. Successfully loaded keys for: [${loadedKeys.join(', ')}]`);
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
   * Sets the API key for a specific provider with improved validation
   * @param providerId ID of the provider to set the API key for
   * @param apiKey The API key to set
   * @returns Object with success status and validation message
   */
  setProviderApiKey(providerId: string, apiKey: string): { 
    success: boolean; 
    message: string;
    validationResult?: { 
      isValid: boolean;
      details?: string;
      format?: string;
    } 
  } {
    // Check if provider exists
    const provider = this.providers.get(providerId);
    if (!provider) {
      return { 
        success: false, 
        message: `Provider ${providerId} not found`
      };
    }

    // Validate API key format based on provider
    const validationResult = this.validateApiKeyFormat(providerId, apiKey);

    // If strict validation is enabled and key format is invalid, return error
    if (validationResult && !validationResult.isValid) {
      return {
        success: false,
        message: `Invalid API key format for ${provider.name}`,
        validationResult
      };
    }

    try {
      // Check if provider has setApiKey method
      if ('setApiKey' in provider && typeof (provider as any).setApiKey === 'function') {
        (provider as any).setApiKey(apiKey);

        // Log success with provider name
        console.log(`API key updated for provider: ${provider.name}`);

        // Immediately run a health check to update availability status
        this.checkProviderHealth(providerId).then(result => {
          if (result.isHealthy) {
            console.log(`${provider.name} health check successful after API key update`);
          } else {
            console.warn(`${provider.name} health check failed after API key update: ${result.message}`);
          }
        }).catch(error => {
          console.error(`Error checking health for ${provider.name} after API key update:`, error);
        });

        return { 
          success: true, 
          message: `API key for ${provider.name} updated successfully`,
          validationResult
        };
      } else {
        return { 
          success: false, 
          message: `Provider ${providerId} does not support API key updates`
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { 
        success: false, 
        message: `Error setting API key: ${errorMessage}`
      };
    }
  }

  /**
   * Performs a health check on a specific provider
   * @param providerId The ID of the provider to check
   * @returns Promise with health check result
   */
  async checkProviderHealth(providerId: string): Promise<{ isHealthy: boolean; message: string }> {
    const provider = this.providers.get(providerId);

    if (!provider) {
      return {
        isHealthy: false,
        message: `Provider ${providerId} not found`
      };
    }

    try {
      return await provider.checkHealth();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        isHealthy: false,
        message: `Error checking health: ${errorMessage}`
      };
    }
  }

  /**
   * Validates API key format based on provider-specific patterns
   * @param providerId The ID of the provider
   * @param apiKey The API key to validate
   * @returns Validation result with isValid flag and optional details
   */
  private validateApiKeyFormat(providerId: string, apiKey: string): { 
    isValid: boolean; 
    details?: string;
    format?: string;
  } {
    // Basic validation - check if API key is not empty
    if (!apiKey || apiKey.trim() === '') {
      return {
        isValid: false,
        details: 'API key cannot be empty'
      };
    }

    // Provider-specific format validation patterns
    switch(providerId) {
      case 'openai':
        // OpenAI API keys start with "sk-" and are typically 51 characters
        if (!apiKey.startsWith('sk-') || apiKey.length < 40) {
          return {
            isValid: false,
            details: 'OpenAI API key should start with "sk-" and be at least 40 characters',
            format: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
          };
        }
        break;

      case 'anthropic':
        // Anthropic API keys have specific prefixes
        if (!apiKey.startsWith('sk-ant-') && !apiKey.startsWith('sk-')) {
          return {
            isValid: false,
            details: 'Anthropic API key should start with "sk-ant-" or "sk-"',
            format: 'sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
          };
        }
        break;

      case 'getimg':
        // GetImg.ai API keys are typically 32+ characters
        if (apiKey.length < 32) {
          return {
            isValid: false,
            details: 'GetImg.ai API key appears too short',
            format: 'At least 32 characters'
          };
        }
        break;

      case 'runware':
        // Runware keys are typically long tokens
        if (apiKey.length < 30) {
          return {
            isValid: false,
            details: 'Runware API key appears too short',
            format: 'At least 30 characters'
          };
        }
        break;

      // Add more providers as needed
    }

    // If we reached here, consider the format valid
    return { isValid: true };
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
   * Enhanced with better fallback provider handling and detailed logging
   */
  async generateText(params: TextGenerationParams, userTier: string = 'free'): Promise<TextGenerationResult> {
    console.log(`Generating text with tier: ${userTier}`);

    // Get allowed providers for user tier
    const tierConfig = this.routingConfig.userTierLimits[userTier] || this.routingConfig.userTierLimits.free;
    const allowedProviderIds = tierConfig.allowedProviders;

    // Filter providers that support text generation and are allowed for this user tier
    const textProviders = Array.from(this.providers.values())
      .filter(p => p.capabilities.textGeneration && allowedProviderIds.includes(p.id))
      .filter(p => p.status.isAvailable);

    console.log(`Found ${textProviders.length} available text providers for tier ${userTier}: ${textProviders.map(p => p.id).join(', ')}`);

    if (textProviders.length === 0) {
      // Force refresh the status of all providers to make sure we have the latest
      await this.checkAllProvidersHealth();

      // Try again after health check
      const refreshedProviders = Array.from(this.providers.values())
        .filter(p => p.capabilities.textGeneration && allowedProviderIds.includes(p.id))
        .filter(p => p.status.isAvailable);

      console.log(`After health refresh, found ${refreshedProviders.length} available text providers: ${refreshedProviders.map(p => p.id).join(', ')}`);

      if (refreshedProviders.length === 0) {
        // Check OpenAI specifically since it's our primary provider
        const openaiProvider = this.providers.get('openai');
        if (openaiProvider) {
          console.log(`OpenAI status: available=${openaiProvider.status.isAvailable}, message=${openaiProvider.status.statusMessage || 'none'}`);
        }

        throw new Error('No available text generation providers');
      }

      textProviders.push(...refreshedProviders);
    }

    // Start with default provider
    let selectedProvider = this.providers.get(this.routingConfig.defaultTextProvider);

    // If default provider is not available or not allowed, use the first available
    if (!selectedProvider || !selectedProvider.status.isAvailable || !allowedProviderIds.includes(selectedProvider.id)) {
      console.log(`Default text provider ${this.routingConfig.defaultTextProvider} not available or allowed, using ${textProviders[0].id} instead`);
      selectedProvider = textProviders[0];
    } else {
      console.log(`Using default text provider: ${selectedProvider.id}`);
    }

    // List of providers we've already tried
    const triedProviders = new Set<string>();

    // Try with the selected provider
    try {
      triedProviders.add(selectedProvider.id);

      // Update metrics
      const providerMetrics = this.metrics.get(selectedProvider.id) || { success: 0, total: 0 };
      providerMetrics.total++;
      this.metrics.set(selectedProvider.id, providerMetrics);

      console.log(`Attempting text generation with ${selectedProvider.id}...`);
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
   * Enhanced with dynamic fallback selection and detailed logging
   */
  async generateImage(params: ImageGenerationParams, userTier: string = 'free'): Promise<ImageGenerationResult> {
    console.log(`Generating image for prompt: "${params.prompt.substring(0, 50)}..." with tier: ${userTier}`);

    // Check if text-only mode is enabled - skip image generation entirely
    if (params.textOnly === true) {
      console.log('Text-only mode enabled, skipping image generation');
      return {
        success: true,
        imageUrl: '', // Empty URL for text-only mode
        provider: 'none',
        model: 'none',
        isBackup: false,
        metadata: { textOnly: true }
      };
    }

    // Get allowed providers for user tier
    const tierConfig = this.routingConfig.userTierLimits[userTier] || this.routingConfig.userTierLimits.free;
    const allowedProviderIds = tierConfig.allowedProviders;

    // Force check provider health to ensure we have most up-to-date availability info
    await this.checkAllProvidersHealth();
    
    // Filter providers that support image generation and are allowed for this user tier
    const imageProviders = Array.from(this.providers.values())
      .filter(p => p.capabilities.imageGeneration && allowedProviderIds.includes(p.id))
      .filter(p => p.status.isAvailable);

    if (imageProviders.length === 0) {
      // No providers available, try to use ALL providers regardless of initial availability
      // This is our best effort attempt before using backup
      console.warn('No available image generation providers, trying ALL providers as last resort');
      
      const allPossibleProviders = Array.from(this.providers.values())
        .filter(p => p.capabilities.imageGeneration && allowedProviderIds.includes(p.id));
      
      if (allPossibleProviders.length > 0) {
        console.log(`Attempting with all ${allPossibleProviders.length} providers regardless of status`);
        
        // Try ALL providers sequentially before giving up
        for (const provider of allPossibleProviders) {
          try {
            console.log(`Last resort attempt with provider: ${provider.id}`);
            const result = await provider.generateImage(params);
            
            if (result.success && result.imageUrl && result.imageUrl.trim().length > 0) {
              console.log(`Last resort attempt succeeded with provider: ${provider.id}`);
              return {
                ...result,
                provider: provider.id
              };
            }
          } catch (error) {
            console.error(`Last resort attempt failed with provider ${provider.id}:`, error);
          }
        }
      }
      
      // If we get here, all attempts have failed
      console.warn('All possible providers failed, using backup image');
      return {
        success: true, 
        imageUrl: BACKUP_IMAGE_URL,
        model: 'backup',
        provider: 'backup',
        promptUsed: params.prompt,
        isBackup: true,
        error: 'No available image generation providers'
      };
    }

    // Log available providers
    console.log(`Found ${imageProviders.length} available image providers for tier ${userTier}: ${imageProviders.map(p => p.id).join(', ')}`);

    // Create a priority order for providers
    // First use specifically requested provider if available
    // Then try HuggingFace as primary provider
    // Then try default provider
    // Then try the rest in order of historical success rate
    const priorityOrder: string[] = [];
    
    // Add requested provider if specified in options (forceProvider)
    if (params.provider && allowedProviderIds.includes(params.provider)) {
      const requestedProvider = this.providers.get(params.provider);
      if (requestedProvider && requestedProvider.capabilities.imageGeneration) {
        priorityOrder.push(params.provider);
        console.log(`Adding requested provider ${params.provider} to priority queue`);
      }
    }
    
    // Add huggingface FIRST if not already in list (highest priority unless explicitly overridden)
    if (!priorityOrder.includes('huggingface') && allowedProviderIds.includes('huggingface')) {
      priorityOrder.push('huggingface');
      console.log(`Adding HuggingFace as highest priority provider`);
    }
    
    // Add default provider if not already in list
    if (this.routingConfig.defaultImageProvider && 
        !priorityOrder.includes(this.routingConfig.defaultImageProvider) &&
        allowedProviderIds.includes(this.routingConfig.defaultImageProvider)) {
      priorityOrder.push(this.routingConfig.defaultImageProvider);
      console.log(`Adding default provider ${this.routingConfig.defaultImageProvider} to priority queue`);
    }
    
    // Add all other providers ordered by success rate
    const providersWithRates = imageProviders
      .filter(p => !priorityOrder.includes(p.id))
      .map(provider => {
        const metrics = this.metrics.get(provider.id) || { success: 0, total: 0 };
        const successRate = metrics.total > 0 ? metrics.success / metrics.total : 0;
        return { provider, successRate };
      })
      .sort((a, b) => b.successRate - a.successRate);
    
    // Add remaining providers in success rate order
    providersWithRates.forEach(p => {
      priorityOrder.push(p.provider.id);
      console.log(`Adding provider ${p.provider.id} to priority queue (success rate: ${(p.successRate * 100).toFixed(1)}%)`);
    });
    
    console.log(`Provider priority order: ${priorityOrder.join(' -> ')}`);
    
    // List of providers we've already tried
    const triedProviders = new Set<string>();
    const errors: Record<string, string> = {};

    // Try each provider in priority order
    for (const providerId of priorityOrder) {
      const provider = this.providers.get(providerId);
      
      if (!provider) {
        console.log(`Provider ${providerId} not found, skipping`);
        continue;
      }
      
      if (triedProviders.has(providerId)) {
        console.log(`Provider ${providerId} already tried, skipping`);
        continue;
      }
      
      if (!provider.capabilities.imageGeneration) {
        console.log(`Provider ${providerId} does not support image generation, skipping`);
        continue;
      }
      
      try {
        triedProviders.add(providerId);
        console.log(`Attempting image generation with ${providerId}...`);

        // Update metrics
        const providerMetrics = this.metrics.get(providerId) || { success: 0, total: 0 };
        providerMetrics.total++;
        this.metrics.set(providerId, providerMetrics);

        // Create a modified version of params with provider-compatible model
        const adaptedParams = { ...params };

        // Adapt model parameter based on provider
        if (providerId === 'openai') {
          console.log(`Adapting model parameter for OpenAI: removing model "${params.model}"`);
          delete adaptedParams.model; // Remove model for OpenAI
        } else if (providerId === 'huggingface' && (!params.model || params.model === 'dall-e-3')) {
          console.log(`Adapting model parameter for HuggingFace: setting default model`);
          adaptedParams.model = 'stable-diffusion-xl';
          
          // Adicionar parâmetros otimizados para HuggingFace
          adaptedParams.width = adaptedParams.width || 768;
          adaptedParams.height = adaptedParams.height || 768;
          adaptedParams.steps = adaptedParams.steps || 30; // Mais steps para melhor qualidade
          adaptedParams.guidance = adaptedParams.guidance || 7.5; // Guidance scale otimizado
        }

        // Attempt generation with this provider
        const result = await provider.generateImage(adaptedParams);

        // Check if result has a valid image URL
        if (!result.success || !result.imageUrl || result.imageUrl.trim().length === 0) {
          console.log(`${providerId} returned success=false or empty URL, treating as failure`);
          throw new Error(`${providerId} returned unsuccessful result or empty URL`);
        }

        // If we get here, generation was successful
        
        // Update success metrics
        providerMetrics.success++;
        this.metrics.set(providerId, providerMetrics);

        // Log success rate
        console.log(`Provider ${providerId} metrics: ${providerMetrics.success}/${providerMetrics.total} successful (${(providerMetrics.success / providerMetrics.total * 100).toFixed(1)}%)`);

        return {
          ...result,
          provider: providerId // Ensure provider is always set
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Image generation with ${providerId} failed:`, errorMessage);
        
        // Track the error
        errors[providerId] = errorMessage;
        
        // Log metrics for failed provider
        const failedMetrics = this.metrics.get(providerId);
        if (failedMetrics) {
          console.log(`Provider ${providerId} metrics: ${failedMetrics.success}/${failedMetrics.total} successful (${(failedMetrics.success / failedMetrics.total * 100).toFixed(1)}%)`);
        }
        
        // Continue trying next provider
        continue;
      }
    }

    // If we reach here, all providers in the priority order have failed
    // Try ANY remaining providers we haven't tried yet as a last resort
    const remainingProviders = Array.from(this.providers.values())
      .filter(p => p.capabilities.imageGeneration && allowedProviderIds.includes(p.id))
      .filter(p => !triedProviders.has(p.id));
    
    if (remainingProviders.length > 0) {
      console.log(`All priority providers failed. Trying ${remainingProviders.length} remaining providers as last resort`);
      
      for (const provider of remainingProviders) {
        try {
          console.log(`Last resort attempt with provider: ${provider.id}`);
          const result = await provider.generateImage(params);
          
          if (result.success && result.imageUrl && result.imageUrl.trim().length > 0) {
            console.log(`Last resort attempt succeeded with provider: ${provider.id}`);
            return {
              ...result,
              provider: provider.id
            };
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Last resort attempt failed with provider ${provider.id}:`, errorMessage);
          errors[provider.id] = errorMessage;
        }
      }
    }

    // If we get here, ALL providers have failed
    console.error('All image generation providers failed, returning backup image');
    
    // Log all errors as a summary
    const errorSummary = Object.entries(errors)
      .map(([provider, error]) => `${provider}: ${error}`)
      .join('; ');
    
    // Criar uma URL de backup legível com informações detalhadas
    const backupUrl = BACKUP_IMAGE_URL;
    
    return {
      success: true, // Alterado para true para evitar rejeição da promessa
      imageUrl: backupUrl,
      model: 'backup',
      provider: 'backup',
      promptUsed: params.prompt,
      isBackup: true,
      error: `All providers failed: ${errorSummary.substring(0, 500)}...`,
      attemptedProviders: Array.from(triedProviders)
    };
  }

  /**
   * Gets a dynamically ordered list of fallback providers based on success rates
   * @param triedProviders Set of provider IDs that have already been tried
   * @param allowedProviderIds Array of provider IDs allowed for the current user tier
   * @returns Array of provider IDs ordered by success rate (highest first)
   */
  private getDynamicFallbackProviders(triedProviders: Set<string>, allowedProviderIds: string[]): string[] {
    // Get all image providers that haven't been tried yet
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p.capabilities.imageGeneration)
      .filter(p => p.status.isAvailable)
      .filter(p => !triedProviders.has(p.id))
      .filter(p => allowedProviderIds.includes(p.id));

    // If prioritizing response time, sort by response time
    if (this.routingConfig.routingPreferences.prioritizeResponseTime) {
      availableProviders.sort((a, b) => 
        (a.status.responseTime || Infinity) - (b.status.responseTime || Infinity)
      );
    }

    // Calculate success rates
    const providersWithRates = availableProviders.map(provider => {
      const metrics = this.metrics.get(provider.id) || { success: 0, total: 0 };
      const successRate = metrics.total > 0 ? metrics.success / metrics.total : 0;
      return { provider, successRate };
    });

    // If prioritizing quality (which we equate with success rate), sort by success rate
    if (this.routingConfig.routingPreferences.prioritizeQuality) {
      providersWithRates.sort((a, b) => b.successRate - a.successRate);
    }

    // Return just the provider IDs in the optimal order
    return providersWithRates.map(p => p.provider.id);
  }

  /**
   * Gets a list of all registered providers with their status
   */
  getProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Gets a specific provider by ID
   * @param providerId The ID of the provider to retrieve
   * @returns The provider instance or undefined if not found
   */
  getProvider(providerId: string): AIProvider | undefined {
    return this.providers.get(providerId);
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

  /**
   * Obtém o próximo provedor de texto disponível
   * @returns Provedor de texto
   */
  private getNextTextProvider(): AIProvider | null {
    if (this.providers.size === 0) {
      return null;
    }

    // Procurar por um provedor disponível
    let checkedProviders = 0;
    let provider: AIProvider | null = null;

    while (checkedProviders < this.providers.size) {
      // Circular para o início se chegamos ao fim da lista
      if (this.currentTextProviderIndex >= this.providers.size) {
        this.currentTextProviderIndex = 0;
      }

      const candidate = Array.from(this.providers.values())[this.currentTextProviderIndex];
      this.currentTextProviderIndex++;
      checkedProviders++;

      // Verificar se o provedor não está marcado como falho
      if (!this.isTextProviderFailed(candidate.id)) {
        provider = candidate;
        break;
      }
    }

    return provider;
  }

  /**
   * Obtém o próximo provedor de imagem disponível
   * @returns Provedor de imagem
   */
  private getNextImageProvider(): AIProvider | null {
    if (this.providers.size === 0) {
      return null;
    }

    // Procurar por um provedor disponível
    let checkedProviders = 0;
    let provider: AIProvider | null = null;

    while (checkedProviders < this.providers.size) {
      // Circular para o início se chegamos ao fim da lista
      if (this.currentImageProviderIndex >= this.providers.size) {
        this.currentImageProviderIndex = 0;
      }

      const candidate = Array.from(this.providers.values())[this.currentImageProviderIndex];
      this.currentImageProviderIndex++;
      checkedProviders++;

      // Verificar se o provedor não está marcado como falho
      if (!this.isImageProviderFailed(candidate.id)) {
        provider = candidate;
        break;
      }
    }

    return provider;
  }

  /**
   * Verifica se um provedor de texto está marcado como falho
   * @param providerId ID do provedor
   * @returns True se o provedor está em falha
   */
  private isTextProviderFailed(providerId: string): boolean {
    const failTime = this.failedTextProviders.get(providerId);
    if (!failTime) return false;

    // Se o tempo de falha expirou, remover da lista
    if (Date.now() - failTime > this.RETRY_TIMEOUT) {
      this.failedTextProviders.delete(providerId);
      return false;
    }

    return true;
  }

  /**
   * Verifica se um provedor de imagem está marcado como falho
   * @param providerId ID do provedor
   * @returns True se o provedor está em falha
   */
  private isImageProviderFailed(providerId: string): boolean {
    const failTime = this.failedImageProviders.get(providerId);
    if (!failTime) return false;

    // Se o tempo de falha expirou, remover da lista
    if (Date.now() - failTime > this.RETRY_TIMEOUT) {
      this.failedImageProviders.delete(providerId);
      return false;
    }

    return true;
  }

  /**
   * Marca um provedor de texto como falho
   * @param providerId ID do provedor
   */
  private markTextProviderAsFailed(providerId: string): void {
    this.failedTextProviders.set(providerId, Date.now());
    logger.warn(`Provedor de texto ${providerId} marcado como falho temporariamente`);
  }

  /**
   * Marca um provedor de imagem como falho
   * @param providerId ID do provedor
   */
  private markImageProviderAsFailed(providerId: string): void {
    this.failedImageProviders.set(providerId, Date.now());
    logger.warn(`Provedor de imagem ${providerId} marcado como falho temporariamente`);
  }

  /**
   * Remove provedores cuja falha expirou do período de timeout
   */
  private cleanupFailedProviders(): void {
    const now = Date.now();

    // Limpar provedores de texto
    Array.from(this.failedTextProviders.entries()).forEach(([providerId, failTime]) => {
      if (now - failTime > this.RETRY_TIMEOUT) {
        this.failedTextProviders.delete(providerId);
        logger.info(`Provedor de texto ${providerId} removido da lista de falhas`);
      }
    });

    // Limpar provedores de imagem
    Array.from(this.failedImageProviders.entries()).forEach(([providerId, failTime]) => {
      if (now - failTime > this.RETRY_TIMEOUT) {
        this.failedImageProviders.delete(providerId);
        logger.info(`Provedor de imagem ${providerId} removido da lista de falhas`);
      }
    });
  }

  /**
   * Sets a preferred provider for model testing
   * @param type The capability type (text, image)
   * @param providerId The provider ID to set as preferred
   */
  async setPreferredProviderForModelTest(type: AICapability, providerId: string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    // Store the current preferred provider to restore later
    this.tempPreferredProviders[type] = providerId;

    logger.info(`Set preferred provider for ${type} testing to ${providerId}`);
  }

  /**
   * Restores the original preferred provider after testing
   * @param type The capability type to restore
   */
  restorePreferredProvider(type: AICapability): void {
    if (this.tempPreferredProviders[type]) {
      delete this.tempPreferredProviders[type];
      logger.info(`Restored original provider preferences for ${type}`);
    }
  }

  /**
   * Get all available models from providers
   * @param type Optional filter by capability type
   * @returns Array of model information objects
   */
  async getAvailableModels(type?: AICapability): Promise<Array<{
    id: string;
    name: string;
    provider: string;
    capabilities: string[];
  }>> {
    const models: Array<{
      id: string;
      name: string;
      provider: string;
      capabilities: string[];
    }> = [];

    try {
      // Convert Map.values() to array before iteration to avoid downlevelIteration issues
      const providerArray = Array.from(this.providers.values());

      for (const provider of providerArray) {
        // Skip providers that don't have the requested capability
        if (type === AICapability.TEXT_GENERATION && !provider.capabilities.textGeneration) continue;
        if (type === AICapability.IMAGE_GENERATION && !provider.capabilities.imageGeneration) continue;
        if (type === AICapability.AUDIO_GENERATION && !provider.capabilities.audioGeneration) continue;

        // Check if provider has a getAvailableModels method
        if ('getAvailableModels' in provider && typeof (provider as any).getAvailableModels === 'function') {
          try {
            const providerModels = await (provider as any).getAvailableModels(type);
            if (Array.isArray(providerModels)) {
              providerModels.forEach(model => {
                models.push({
                  ...model,
                  provider: provider.id
                });
              });
            }
          } catch (error) {
            logger.error(`Error getting models from ${provider.id}:`, error);
          }
        }
      }
    } catch (error) {
      logger.error('Error getting available models:', error);
    }

    return models;
  }
}

// Create singleton instance
export const aiProviderManager = new AIProviderManager();