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
 * Lexica AI Provider Implementation
 * Uses Lexica's API for image generation
 */
export class LexicaProvider implements AIProvider {
  id = 'lexica';
  name = 'Lexica';
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
  
  constructor() {
    // Initialize with environment variable if available
    this.apiKey = process.env.LEXICA_API_KEY || null;
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
      // Make a simple API call to check if service is available
      const response = await fetch('https://api.lexica.art/v1/models', {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        this.status.isAvailable = true;
        this.status.responseTime = responseTime;
        this.status.statusMessage = 'Service operational';
        
        return {
          isHealthy: true,
          responseTime,
          timestamp: new Date(),
          message: 'Service operational'
        };
      } else {
        const errData = await response.json().catch(() => ({}));
        this.status.isAvailable = false;
        this.status.statusMessage = `API error: ${response.status} ${response.statusText}`;
        
        return {
          isHealthy: false,
          responseTime,
          timestamp: new Date(),
          message: this.status.statusMessage,
          errors: errData
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.status.isAvailable = false;
      this.status.statusMessage = `Connection error: ${(error as Error).message}`;
      
      return {
        isHealthy: false,
        responseTime,
        timestamp: new Date(),
        message: this.status.statusMessage,
        errors: error
      };
    }
  }
  
  /**
   * Text generation is not supported by Lexica
   */
  async generateText(): Promise<TextGenerationResult> {
    throw new Error('Text generation not supported by Lexica');
  }
  
  /**
   * Generates an image using Lexica's API
   */
  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    if (!this.apiKey) {
      throw new Error('API key not configured for Lexica');
    }
    
    try {
      console.log(`Lexica generating image with prompt: ${params.prompt.substring(0, 100)}...`);
      
      // Enhance prompt for cartoon style if needed
      let enhancedPrompt = params.prompt;
      if (params.style === 'cartoon') {
        enhancedPrompt = `${params.prompt}, cartoon style, children's book illustration, vibrant colors, simple style`;
      }
      
      // Prepare the request payload
      const payload = {
        prompt: enhancedPrompt,
        width: 512,
        height: 512,
        guidance_scale: 7.5,
        negative_prompt: "blurry, bad drawing, bad anatomy, poor quality, low resolution",
        model: "lexica-aperture-v2"
      };
      
      // Make API request to Lexica
      const response = await fetch('https://api.lexica.art/v1/generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('Lexica image generation error:', error);
        throw new Error(`Lexica API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract image data from the response
      if (data && data.images && data.images.length > 0) {
        const imageUrl = data.images[0].url;
        
        // Download the image to extract base64 data if needed
        const imageResponse = await fetch(imageUrl);
        const blob = await imageResponse.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');
        
        return {
          imageUrl,
          base64Image,
          model: "lexica-aperture-v2",
          provider: this.id,
          promptUsed: enhancedPrompt
        };
      } else {
        throw new Error('No image generated');
      }
    } catch (error) {
      console.error('Lexica image generation error:', error);
      throw new Error(`Failed to generate image with Lexica: ${(error as Error).message}`);
    }
  }
}