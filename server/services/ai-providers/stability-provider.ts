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
 * Stability AI Provider Implementation
 * Uses Stability AI's API for image generation
 */
export class StabilityAIProvider implements AIProvider {
  id = 'stability';
  name = 'Stability AI';
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
    this.apiKey = process.env.STABILITY_API_KEY || null;
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
      const response = await fetch('https://api.stability.ai/v1/engines/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
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
   * Text generation is not supported by Stability AI
   */
  async generateText(): Promise<TextGenerationResult> {
    throw new Error('Text generation not supported by Stability AI');
  }
  
  /**
   * Generates an image using Stability AI's API
   */
  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    if (!this.apiKey) {
      throw new Error('API key not configured for Stability AI');
    }
    
    try {
      console.log(`Stability AI generating image with prompt: ${params.prompt.substring(0, 100)}...`);
      
      // Prepare style parameters based on the input
      let stylePreset = 'animation';
      if (params.style) {
        switch(params.style.toLowerCase()) {
          case 'cartoon':
          case 'anime':
            stylePreset = 'animation';
            break;
          case 'watercolor':
            stylePreset = 'watercolor';
            break;
          case 'pencil':
          case 'sketch':
            stylePreset = 'line-art';
            break;
          case 'digital':
            stylePreset = 'digital-art';
            break;
        }
      }
      
      // Prepare the request payload
      const payload = {
        text_prompts: [{ text: params.prompt }],
        cfg_scale: 7,
        height: 512,
        width: 512,
        samples: 1,
        steps: 30,
        style_preset: stylePreset
      };
      
      // Select appropriate engine based on parameters
      const engine = 'stable-diffusion-xl-1024-v1-0';
      
      // Make API request to Stability AI
      const response = await fetch(`https://api.stability.ai/v1/generation/${engine}/text-to-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('Stability AI image generation error:', error);
        throw new Error(`Stability AI API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract image data from the response
      if (data.artifacts && data.artifacts.length > 0) {
        const generatedImage = data.artifacts[0];
        const base64Image = generatedImage.base64;
        
        // Create a URL from the base64 data
        const imageUrl = `data:image/png;base64,${base64Image}`;
        
        return {
          imageUrl,
          base64Image,
          model: engine,
          provider: this.id,
          promptUsed: params.prompt
        };
      } else {
        throw new Error('No image generated');
      }
    } catch (error) {
      console.error('Stability AI image generation error:', error);
      throw new Error(`Failed to generate image with Stability AI: ${(error as Error).message}`);
    }
  }
}