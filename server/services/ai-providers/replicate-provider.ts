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
 * Replicate Provider Implementation
 * Uses Replicate's API for image generation with open models
 */
export class ReplicateProvider implements AIProvider {
  id = 'replicate';
  name = 'Replicate';
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
    this.apiKey = process.env.REPLICATE_API_KEY || null;
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
      const response = await fetch('https://api.replicate.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Token ${this.apiKey}`
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
   * Text generation is not supported by this implementation
   */
  async generateText(): Promise<TextGenerationResult> {
    throw new Error('Text generation not supported by this Replicate implementation');
  }
  
  /**
   * Generates an image using Replicate's API
   */
  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    if (!this.apiKey) {
      throw new Error('API key not configured for Replicate');
    }
    
    try {
      console.log(`Replicate generating image with prompt: ${params.prompt.substring(0, 100)}...`);
      
      // Determine the best model based on the style
      let modelVersion = "stability-ai/sdxl:c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316";
      
      // For cartoon style, use a specific model better suited for children's illustrations
      if (params.style === 'cartoon') {
        modelVersion = "stability-ai/sdxl:c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316"; // SDXL base which is good for cartoon styles
      }
      
      // Enhance prompt based on style
      let enhancedPrompt = params.prompt;
      if (params.style === 'cartoon') {
        enhancedPrompt = `${params.prompt}, children's book illustration, cartoon style, vibrant colors, simple shapes, cute design`;
      } else if (params.style === 'watercolor') {
        enhancedPrompt = `${params.prompt}, watercolor painting style, soft colors, gentle brushstrokes`;
      } else if (params.style === 'pencil') {
        enhancedPrompt = `${params.prompt}, pencil sketch, hand-drawn, illustration, line art`;
      }
      
      // Prepare input parameters based on the selected model
      const input = {
        prompt: enhancedPrompt,
        negative_prompt: "ugly, deformed, disfigured, poor quality, blurry",
        width: 768,
        height: 768,
        num_outputs: 1,
        num_inference_steps: 30,
        guidance_scale: 7.5,
        scheduler: "K_EULER_ANCESTRAL",
      };
      
      // Start the prediction
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${this.apiKey}`
        },
        body: JSON.stringify({
          version: modelVersion,
          input: input
        })
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('Replicate prediction creation error:', error);
        throw new Error(`Replicate API error: ${response.status} ${response.statusText}`);
      }
      
      const prediction = await response.json();
      const predictionId = prediction.id;
      
      // Poll for the prediction result
      const maxAttempts = 60; // 5 minutes max (5s * 60)
      let attempts = 0;
      let outputUrl = '';
      
      while (!outputUrl && attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between polls
        
        const getResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
          method: "GET",
          headers: {
            "Authorization": `Token ${this.apiKey}`
          }
        });
        
        if (!getResponse.ok) {
          console.error(`Replicate poll error: ${getResponse.status} ${getResponse.statusText}`);
          continue;
        }
        
        const status = await getResponse.json();
        
        if (status.status === "succeeded") {
          // For SDXL models, the output is an array of image URLs
          outputUrl = Array.isArray(status.output) ? status.output[0] : status.output;
          break;
        } else if (status.status === "failed") {
          throw new Error(`Replicate prediction failed: ${status.error}`);
        }
        // Otherwise continue polling
      }
      
      if (!outputUrl) {
        throw new Error('Timeout waiting for Replicate prediction');
      }
      
      // Download the image to convert to base64
      const imageResponse = await fetch(outputUrl);
      const blob = await imageResponse.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64Image = Buffer.from(arrayBuffer).toString('base64');
      
      return {
        imageUrl: outputUrl,
        base64Image,
        model: modelVersion.split(':')[0], // Just get the model name without version
        provider: this.id,
        promptUsed: enhancedPrompt
      };
    } catch (error) {
      console.error('Replicate image generation error:', error);
      throw new Error(`Failed to generate image with Replicate: ${(error as Error).message}`);
    }
  }
}