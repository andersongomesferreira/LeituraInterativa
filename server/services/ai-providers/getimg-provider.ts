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
      // For GetImg.ai, simply check if API key exists - no need to make a test API call
      // as their free tier has limited requests and we don't want to waste them on checks
      this.status.isAvailable = true;
      this.status.lastChecked = new Date();
      this.status.statusMessage = 'API key is configured and provider is available';
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Update provider status
      this.status.responseTime = responseTime;
      
      return {
        isHealthy: true,
        responseTime,
        timestamp: new Date(),
        message: 'API key is configured and provider is available'
      };
    } catch (error) {
      const endTime = Date.now();
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Update provider status
      this.status.isAvailable = false;
      this.status.responseTime = endTime - startTime;
      this.status.lastChecked = new Date();
      this.status.statusMessage = `Error: ${errorMessage}`;
      
      return {
        isHealthy: false,
        responseTime: endTime - startTime,
        timestamp: new Date(),
        message: `Error: ${errorMessage}`,
        errors: error instanceof Error ? error : new Error(errorMessage)
      };
    }
  }
  
  /**
   * Generate text (not supported by this provider)
   */
  async generateText(params: TextGenerationParams): Promise<TextGenerationResult> {
    return {
      success: false,
      content: '',
      model: 'none',
      provider: this.id,
      error: 'Text generation not supported by GetImg.ai provider'
    };
  }
  
  /**
   * Generate image using GetImg.ai Stable Diffusion API
   * Specialized for cartoon-style illustrations with consistent character appearance
   */
  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    if (!this.apiKey) {
      console.warn('GetImg.ai: API key not configured');
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
      
      // Truncate the prompt to avoid "string too long" error
      const MAX_PROMPT_LENGTH = 800; // Even more conservative than 1000 to be safe
      if (enhancedPrompt.length > MAX_PROMPT_LENGTH) {
        console.log(`GetImg.ai: Truncating prompt from ${enhancedPrompt.length} to ${MAX_PROMPT_LENGTH} characters`);
        
        // Extract the first part of the prompt (main context)
        const mainContext = enhancedPrompt.substring(0, MAX_PROMPT_LENGTH * 0.6);
        
        // Keep some character descriptions if available
        let characterInfo = '';
        if (params.characterDescriptions && params.characterDescriptions.length > 0) {
          // Just use the name and basic appearance of the first 2 characters
          characterInfo = params.characterDescriptions.slice(0, 2).map(char => 
            `${char.name}: ${char.appearance?.substring(0, 40) || ''}`
          ).join('; ');
        }
        
        // Keep some style keywords
        const styleKeywords = params.style === 'cartoon' 
          ? "cartoonish, vibrant colors, children's book illustration style, cute" 
          : "high quality illustration, clean artwork";
        
        // Combine truncated elements with priority to main context
        enhancedPrompt = `${mainContext} ${characterInfo}. ${styleKeywords}`.trim();
        console.log(`GetImg.ai: Truncated prompt: "${enhancedPrompt.substring(0, 100)}..."`);
      }
      
      // Configure options based on params
      const requestBody = {
        model: "sdxl", // Updated to "sdxl" instead of "sdxl-lightning" which is no longer valid
        prompt: enhancedPrompt,
        negative_prompt: negativePrompt,
        width: 512, // Reduced from 1024 to improve performance
        height: 512, // Reduced from 1024 to improve performance 
        steps: 20,  // Reduced for better reliability
        guidance: 7.5,
        seed: params.seed || Math.floor(Math.random() * 2147483647), // Use provided seed or random
        scheduler: "ddim", // More reliable scheduler, alternative: "dpmsolver++"
        output_format: "jpeg",
        samples: 1
      };
      
      // If batch processing is requested
      if (params.batchSize && params.batchSize > 1) {
        requestBody.samples = Math.min(params.batchSize, 4); // Max 4 samples per request
      }
      
      // Log the request details (without exposing full API key)
      console.log(`GetImg.ai request details:
        URL: ${this.baseUrl}
        API Key (first 5 chars): ${this.apiKey?.substring(0, 5)}...
        Model: ${requestBody.model}
        Prompt length: ${requestBody.prompt.length} chars
      `);
      
      // Make API request
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      // Log response status for debugging
      console.log(`GetImg.ai response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => response.text());
        console.error('GetImg.ai API error details:', JSON.stringify(errorData));
        return {
          success: false,
          imageUrl: '',
          error: `API error: ${response.status} ${response.statusText}`,
          details: errorData
        };
      }
      
      const data = await response.json();
      
      // Log response data structure for debugging
      console.log(`GetImg.ai response data structure: ${JSON.stringify({
        hasOutput: !!data.output,
        outputLength: data.output ? data.output.length : 0,
        outputType: data.output ? typeof data.output : 'undefined',
        hasMeta: !!data.meta,
        keys: Object.keys(data)
      })}`);
      
      // Process response
      if (data.output && data.output.length > 0) {
        // Ensure the image URL is valid and not empty
        const imageUrl = data.output[0].trim();
        
        // If URL is empty or invalid, handle as an error
        if (!imageUrl) {
          console.error('GetImg.ai returned a success response but with an empty image URL');
          return {
            success: false,
            imageUrl: '',
            error: 'API returned empty image URL despite successful response'
          };
        }
        
        // If batch processing, return all images
        if (requestBody.samples > 1) {
          // Filter out any empty URLs
          const validUrls = data.output.filter((url: string) => url && url.trim().length > 0);
          
          if (validUrls.length === 0) {
            return {
              success: false,
              imageUrl: '',
              error: 'API returned empty image URLs despite successful response'
            };
          }
          
          return {
            success: true,
            imageUrl: validUrls[0], // Primary image
            alternativeImages: validUrls.slice(1), // Additional images
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
          imageUrl: imageUrl,
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        imageUrl: '',
        error: `Error: ${errorMessage}`
      };
    }
  }
}