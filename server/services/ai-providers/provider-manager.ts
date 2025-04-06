import { AIProvider, ProviderRoutingConfig, ImageGenerationParams, ImageGenerationResult, TextGenerationParams, TextGenerationResult } from './types';
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import { StabilityAIProvider } from './stability-provider';
import { LexicaProvider } from './lexica-provider';
import { ReplicateProvider } from './replicate-provider';
import { GetImgProvider } from './getimg-provider';
import { RunwareProvider } from './runware-provider';

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
  
  constructor() {
    // Register default providers
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new AnthropicProvider());
    this.registerProvider(new StabilityAIProvider());
    this.registerProvider(new LexicaProvider());
    this.registerProvider(new ReplicateProvider());
    this.registerProvider(new GetImgProvider());
    this.registerProvider(new RunwareProvider());
    
    // Initialize metrics
    Array.from(this.providers.values()).forEach(provider => {
      this.metrics.set(provider.id, { success: 0, total: 0 });
    });
    
    // Load API keys from environment variables
    this.loadApiKeysFromEnv();
    
    // Start health check interval (every 15 minutes)
    setInterval(() => this.checkAllProvidersHealth(), 15 * 60 * 1000);
    
    // Run initial health check
    this.checkAllProvidersHealth();
  }
  
  /**
   * Load API keys from environment variables
   */
  private loadApiKeysFromEnv(): void {
    console.log('Loading API keys from environment variables...');
    
    // Map environment variable names to provider IDs
    const envKeyMap: Record<string, string> = {
      'OPENAI_API_KEY': 'openai',
      'ANTHROPIC_API_KEY': 'anthropic',
      'GETIMG_AI_API_KEY': 'getimg',
      'RUNWARE_API_KEY': 'runware',
      'STABILITY_API_KEY': 'stability',
      'REPLICATE_API_KEY': 'replicate'
    };
    
    // Track which keys were loaded
    const loadedKeys: string[] = [];
    
    // Attempt to load and set API keys
    Object.entries(envKeyMap).forEach(([envName, providerId]) => {
      const apiKey = process.env[envName];
      
      if (apiKey && apiKey.trim() !== '') {
        try {
          const result = this.setProviderApiKey(providerId, apiKey);
          
          if (result.success) {
            loadedKeys.push(providerId);
            console.log(`Successfully loaded API key for ${providerId} from environment`);
          } else {
            console.warn(`Failed to set API key for ${providerId} from environment: ${result.message}`);
          }
        } catch (error) {
          console.error(`Error setting API key for ${providerId}:`, error);
        }
      } else {
        console.log(`No API key found for ${providerId} (${envName})`);
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
        setTimeout(() => {
          provider.checkHealth().then(result => {
            if (result.isHealthy) {
              console.log(`${provider.name} health check successful after API key update`);
            } else {
              console.warn(`${provider.name} health check failed after API key update: ${result.message}`);
            }
          }).catch(error => {
            console.error(`Error checking health for ${provider.name} after API key update:`, error);
          });
        }, 0);
        
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
    
    // Filter providers that support image generation and are allowed for this user tier
    const imageProviders = Array.from(this.providers.values())
      .filter(p => p.capabilities.imageGeneration && allowedProviderIds.includes(p.id))
      .filter(p => p.status.isAvailable);
    
    if (imageProviders.length === 0) {
      // Return backup image if no available providers
      console.warn('No available image generation providers, using backup image');
      return {
        success: false,
        imageUrl: BACKUP_IMAGE_URL,
        model: 'backup',
        provider: 'backup',
        promptUsed: params.prompt,
        isBackup: true,
        error: 'No available image generation providers'
      };
    }
    
    // Count available providers
    console.log(`Found ${imageProviders.length} available image providers for tier ${userTier}: ${imageProviders.map(p => p.id).join(', ')}`);
    
    // Start with default provider
    let selectedProvider = this.providers.get(this.routingConfig.defaultImageProvider);
    
    // If default provider is not available or not allowed, use the first available
    if (!selectedProvider || !selectedProvider.status.isAvailable || !allowedProviderIds.includes(selectedProvider.id)) {
      console.log(`Default provider ${this.routingConfig.defaultImageProvider} not available or allowed, using ${imageProviders[0].id} instead`);
      selectedProvider = imageProviders[0];
    } else {
      console.log(`Using default provider: ${selectedProvider.id}`);
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
      
      console.log(`Attempting image generation with ${selectedProvider.id}...`);
      const result = await selectedProvider.generateImage(params);
      
      // Check if result has a valid image URL
      if (!result.success || !result.imageUrl || result.imageUrl.trim().length === 0) {
        console.log(`${selectedProvider.id} returned success=false or empty URL, treating as failure`);
        throw new Error(`${selectedProvider.id} returned unsuccessful result or empty URL`);
      }
      
      // Update success metrics
      providerMetrics.success++;
      this.metrics.set(selectedProvider.id, providerMetrics);
      
      // Log success rate
      console.log(`Provider ${selectedProvider.id} metrics: ${providerMetrics.success}/${providerMetrics.total} successful (${(providerMetrics.success / providerMetrics.total * 100).toFixed(1)}%)`);
      
      return {
        ...result,
        provider: selectedProvider.id // Ensure provider is always set
      };
    } catch (error) {
      console.error(`Image generation with ${selectedProvider.id} failed:`, error);
      
      // Log metrics for failed provider
      const failedMetrics = this.metrics.get(selectedProvider.id);
      if (failedMetrics) {
        console.log(`Provider ${selectedProvider.id} metrics: ${failedMetrics.success}/${failedMetrics.total} successful (${(failedMetrics.success / failedMetrics.total * 100).toFixed(1)}%)`);
      }
      
      console.log('Image generation failed, trying fallback providers');
      
      // Get fallback providers dynamically ordered by success rate
      const fallbackProviders = this.getDynamicFallbackProviders(triedProviders, allowedProviderIds);
      console.log(`Dynamic fallback order: ${fallbackProviders.join(', ')}`);
      
      // Try each fallback provider
      for (const fallbackId of fallbackProviders) {
        const fallbackProvider = this.providers.get(fallbackId);
        
        if (!fallbackProvider) {
          console.log(`Provider ${fallbackId} not found, skipping`);
          continue;
        }
        
        if (triedProviders.has(fallbackId)) {
          console.log(`Provider ${fallbackId} already tried, skipping`);
          continue;
        }
        
        if (!fallbackProvider.status.isAvailable) {
          console.log(`Provider ${fallbackId} not available, skipping`);
          continue;
        }
        
        if (!fallbackProvider.capabilities.imageGeneration) {
          console.log(`Provider ${fallbackId} does not support image generation, skipping`);
          continue;
        }
        
        if (!allowedProviderIds.includes(fallbackId)) {
          console.log(`Provider ${fallbackId} not allowed for tier ${userTier}, skipping`);
          continue;
        }
        
        try {
          triedProviders.add(fallbackId);
          console.log(`Trying fallback image generation with ${fallbackId}`);
          
          // Update metrics
          const fallbackMetrics = this.metrics.get(fallbackId) || { success: 0, total: 0 };
          fallbackMetrics.total++;
          this.metrics.set(fallbackId, fallbackMetrics);
          
          const result = await fallbackProvider.generateImage(params);
          
          // Check if result has a valid image URL
          if (!result.success || !result.imageUrl || result.imageUrl.trim().length === 0) {
            console.log(`${fallbackId} returned success=false or empty URL, treating as failure`);
            throw new Error(`${fallbackId} returned unsuccessful result or empty URL`);
          }
          
          // Update success metrics
          fallbackMetrics.success++;
          this.metrics.set(fallbackId, fallbackMetrics);
          
          console.log(`Fallback to ${fallbackId} successful`);
          
          return {
            ...result,
            provider: fallbackId // Ensure provider is always set
          };
        } catch (fallbackError) {
          console.error(`Fallback image generation with ${fallbackId} failed:`, fallbackError);
        }
      }
      
      // If all providers failed, return backup image
      console.error('All image generation providers failed, returning backup image');
      return {
        success: false,
        imageUrl: BACKUP_IMAGE_URL,
        model: 'backup',
        provider: 'backup',
        promptUsed: params.prompt,
        isBackup: true,
        error: 'All image generation providers failed'
      };
    }
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