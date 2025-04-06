import { 
  AIProvider, 
  ProviderStatus, 
  ProviderCapabilities, 
  HealthCheckResult,
  TextGenerationParams,
  TextGenerationResult,
  ImageGenerationParams,
  ImageGenerationResult
} from './types';

/**
 * GetImg.ai Provider Implementation
 * Uses GetImg.ai's Stable Diffusion API for high-quality cartoon-style image generation
 */
export class GetImgProvider implements AIProvider {
  id = 'getimg';
  name = 'GetImg.ai';
  status: ProviderStatus = {
    isAvailable: false,
    lastChecked: new Date(),
  };
  capabilities: ProviderCapabilities = {
    textGeneration: false,
    imageGeneration: true,
    audioGeneration: false,
    languagesSupported: ['en', 'pt', 'es'],
    multimodalSupport: false
  };
  
  private apiKey: string | null = null;
  private baseUrl = 'https://api.getimg.ai/v1/stable-diffusion/text-to-image';
  
  constructor() {
    // Initialize with environment variable if available
    this.apiKey = process.env.GETIMG_AI_API_KEY || null;
    this.updateAvailability();
  }
  
  /**
   * Updates the API key and availability status
   */
  setApiKey(key: string): void {
    this.apiKey = key;
    this.updateAvailability();
  }
  
  /**
   * Checks if API key is available and updates status
   */
  private updateAvailability(): void {
    this.status.isAvailable = !!this.apiKey;
    this.status.lastChecked = new Date();
    this.status.statusMessage = this.status.isAvailable 
      ? 'API key configured'
      : 'API key not configured';
  }
  
  /**
   * Performs a health check on the service
   */
  async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    // If no API key, service is not available
    if (!this.apiKey) {
      return {
        isHealthy: false,
        responseTime: 0,
        timestamp: new Date(),
        message: 'API key not configured'
      };
    }
    
    try {
      // Simple health check by making a minimal request
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (!response.ok) {
        const errorText = await response.text();
        return {
          isHealthy: false,
          responseTime,
          timestamp: new Date(),
          message: `API error: ${response.status} ${response.statusText}`,
          errors: errorText
        };
      }
      
      // Update provider status
      this.status.isAvailable = true;
      this.status.responseTime = responseTime;
      this.status.lastChecked = new Date();
      this.status.statusMessage = 'Service is healthy';
      
      return {
        isHealthy: true,
        responseTime,
        timestamp: new Date(),
        message: 'Service is healthy'
      };
    } catch (error) {
      const endTime = Date.now();
      
      // Update provider status
      this.status.isAvailable = false;
      this.status.responseTime = endTime - startTime;
      this.status.lastChecked = new Date();
      this.status.statusMessage = `Error: ${error.message}`;
      
      return {
        isHealthy: false,
        responseTime: endTime - startTime,
        timestamp: new Date(),
        message: `Error: ${error.message}`,
        errors: error
      };
    }
  }
  
  /**
   * Generate text (not supported by this provider)
   */
  async generateText(params: TextGenerationParams): Promise<TextGenerationResult> {
    return {
      success: false,
      text: '',
      error: 'Text generation not supported by GetImg.ai provider'
    };
  }
  
  /**
   * Generate image using GetImg.ai Stable Diffusion API
   * Specialized for cartoon-style illustrations with consistent character appearance
   */
  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    if (!this.apiKey) {
      return {
        success: false,
        imageUrl: '',
        error: 'API key not configured'
      };
    }
    
    try {
      // Prepare optimized prompt for cartoon-style illustrations
      let enhancedPrompt = params.prompt;
      if (params.style === 'cartoon') {
        enhancedPrompt = `${params.prompt}, cartoonish, vibrant colors, children's book illustration style, cute, appealing, clear outlines`;
      }
      
      // Combine with character descriptions for consistency
      if (params.characterDescriptions && params.characterDescriptions.length > 0) {
        const characterPrompts = params.characterDescriptions.map(char => {
          if (char.visualAttributes) {
            const colors = char.visualAttributes.colors.join(', ');
            return `${char.name}: ${char.appearance || ''}, wearing ${char.visualAttributes.clothing || 'colorful clothes'}, ${colors} colors`;
          }
          return `${char.name}: ${char.appearance || ''}`;
        }).join('; ');
        
        enhancedPrompt = `${enhancedPrompt}. Character details: ${characterPrompts}`;
      }
      
      // Negative prompt to avoid common issues in children's illustrations
      const negativePrompt = "blurry, distorted, deformed, disfigured, bad anatomy, ugly, inappropriate content, scary, frightening, text, watermark, signature, adult content";
      
      // Configure options based on params
      const requestBody = {
        model: "icbinp-realistic",  // Using a child-friendly model
        prompt: enhancedPrompt,
        negative_prompt: negativePrompt,
        width: 1024,
        height: 1024,
        steps: 30,
        guidance: 7.5,
        seed: params.seed || Math.floor(Math.random() * 2147483647), // Use provided seed or random
        scheduler: "dpmsolver++",
        output_format: "jpeg",
        samples: 1
      };
      
      // If batch processing is requested
      if (params.batchSize && params.batchSize > 1) {
        requestBody.samples = Math.min(params.batchSize, 4); // Max 4 samples per request
      }
      
      // Make API request
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => response.text());
        return {
          success: false,
          imageUrl: '',
          error: `API error: ${response.status} ${response.statusText}`,
          details: errorData
        };
      }
      
      const data = await response.json();
      
      // Process response
      if (data.output && data.output.length > 0) {
        // If batch processing, return all images
        if (requestBody.samples > 1) {
          return {
            success: true,
            imageUrl: data.output[0], // Primary image
            alternativeImages: data.output.slice(1), // Additional images
            metadata: {
              seed: data.meta?.seed || requestBody.seed,
              model: data.meta?.model || requestBody.model,
              providerName: this.name
            }
          };
        }
        
        // Single image
        return {
          success: true,
          imageUrl: data.output[0],
          metadata: {
            seed: data.meta?.seed || requestBody.seed,
            model: data.meta?.model || requestBody.model,
            providerName: this.name
          }
        };
      }
      
      return {
        success: false,
        imageUrl: '',
        error: 'No image generated in response'
      };
    } catch (error) {
      return {
        success: false,
        imageUrl: '',
        error: `Error: ${error.message}`
      };
    }
  }
}