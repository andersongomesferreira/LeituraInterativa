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
 * Runware Provider Implementation
 * Uses Runware's API for ultra-fast image generation with low latency
 */
export class RunwareProvider implements AIProvider {
  id = 'runware';
  name = 'Runware';
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
  private baseUrl = 'https://api.runware.ai/v1/generation';
  
  constructor() {
    // Initialize with environment variable if available
    this.apiKey = process.env.RUNWARE_API_KEY || null;
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
      // For Runware, simply check if API key exists - no need to make a test API call
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
      error: 'Text generation not supported by Runware provider'
    };
  }
  
  /**
   * Generate image using Runware API
   * Specialized for fast cartoon-style illustrations with consistent character appearance
   */
  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    if (!this.apiKey) {
      console.warn('Runware: API key not configured');
      return {
        success: false,
        imageUrl: '',
        error: 'API key not configured'
      };
    }
    
    try {
      // Prepare optimized prompt for cartoon-style illustrations
      let enhancedPrompt = params.prompt;
      
      // Apply style enhancements based on requested style
      if (params.style === 'cartoon') {
        enhancedPrompt = `${params.prompt}, cartoonish style, children's book illustration, vibrant colors, simple backgrounds, clear outlines`;
      } else if (params.style === 'watercolor') {
        enhancedPrompt = `${params.prompt}, watercolor style illustration, soft colors, gentle brushstrokes, children's book quality`;
      } else if (params.style === 'pencil') {
        enhancedPrompt = `${params.prompt}, pencil sketch style, hand-drawn illustration, gentle shading, children's book quality`;
      }
      
      // Factor in age group if specified
      if (params.ageGroup) {
        if (params.ageGroup === '3-5') {
          enhancedPrompt += ', very simple shapes, bright primary colors, extremely child-friendly';
        } else if (params.ageGroup === '6-8') {
          enhancedPrompt += ', simple scenes, colorful and engaging, child-friendly';
        } else if (params.ageGroup === '9-12') {
          enhancedPrompt += ', more detailed scenes, engaging illustration style';
        }
      }
      
      // Combine with character descriptions for consistency
      if (params.characterDescriptions && params.characterDescriptions.length > 0) {
        const characterPrompts = params.characterDescriptions.map(char => {
          let charPrompt = `${char.name}: ${char.appearance || ''}`;
          
          if (char.visualAttributes) {
            if (char.visualAttributes.colors && char.visualAttributes.colors.length > 0) {
              charPrompt += `, ${char.visualAttributes.colors.join(', ')} colors`;
            }
            
            if (char.visualAttributes.clothing) {
              charPrompt += `, wearing ${char.visualAttributes.clothing}`;
            }
            
            if (char.visualAttributes.distinguishingFeatures && char.visualAttributes.distinguishingFeatures.length > 0) {
              charPrompt += `, with ${char.visualAttributes.distinguishingFeatures.join(', ')}`;
            }
          }
          
          return charPrompt;
        }).join('; ');
        
        enhancedPrompt = `${enhancedPrompt}. Character details: ${characterPrompts}`;
      }
      
      // Negative prompt to avoid common issues in children's illustrations
      const negativePrompt = "blurry, distorted, deformed, disfigured, bad anatomy, ugly, inappropriate content, scary, frightening, text, watermark, signature, adult content";
      
      // Truncate the prompt to avoid "string too long" error
      const MAX_PROMPT_LENGTH = 800; // Even more conservative than 1000 to be safe
      if (enhancedPrompt.length > MAX_PROMPT_LENGTH) {
        console.log(`Runware: Truncating prompt from ${enhancedPrompt.length} to ${MAX_PROMPT_LENGTH} characters`);
        
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
        console.log(`Runware: Truncated prompt: "${enhancedPrompt.substring(0, 100)}..."`);
      }
      
      // Configure options based on params
      const requestBody: any = {
        prompt: enhancedPrompt,
        negative_prompt: negativePrompt,
        width: 512, // Reduced from 1024 to improve performance
        height: 512, // Reduced from 1024 to improve performance
        num_outputs: 1,
        seed: params.seed || Math.floor(Math.random() * 2147483647) // Use provided seed or random
      };
      
      // Apply specific styles if requested
      if (params.style) {
        requestBody.style = params.style;
      }
      
      // If batch processing is requested
      if (params.batchSize && params.batchSize > 1) {
        requestBody.num_outputs = Math.min(params.batchSize, 4); // Max 4 samples per request
      }
      
      // Log the request details (without exposing full API key)
      console.log(`Runware request details:
        URL: ${this.baseUrl}
        API Key (first 5 chars): ${this.apiKey?.substring(0, 5)}...
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
      console.log(`Runware response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => response.text());
        console.error('Runware API error details:', JSON.stringify(errorData));
        return {
          success: false,
          imageUrl: '',
          error: `API error: ${response.status} ${response.statusText}`,
          details: errorData
        };
      }
      
      const data = await response.json();
      
      // Log response data structure for debugging
      console.log(`Runware response data structure: ${JSON.stringify({
        hasImages: !!data.images,
        imagesLength: data.images ? data.images.length : 0,
        keys: Object.keys(data)
      })}`);
      
      // Process response - structure may vary based on actual API response
      if (data.images && data.images.length > 0) {
        // Check if image URLs are valid
        const validImages = data.images.filter((img: any) => img.url && img.url.trim().length > 0);
        
        if (validImages.length === 0) {
          console.error('Runware returned a success response but with empty image URLs');
          return {
            success: false,
            imageUrl: '',
            error: 'API returned empty image URLs despite successful response'
          };
        }
        
        // If batch processing, return all images
        if (requestBody.num_outputs > 1) {
          return {
            success: true,
            imageUrl: validImages[0].url, // Primary image
            alternativeImages: validImages.slice(1).map((img: any) => img.url), // Additional images
            metadata: {
              seed: data.seed || requestBody.seed,
              providerName: this.name,
              generationTime: data.generation_time || undefined
            }
          };
        }
        
        // Single image
        const imageUrl = validImages[0].url.trim();
        
        if (!imageUrl) {
          console.error('Runware returned a success response but with an empty image URL');
          return {
            success: false,
            imageUrl: '',
            error: 'API returned empty image URL despite successful response'
          };
        }
        
        return {
          success: true,
          imageUrl: imageUrl,
          metadata: {
            seed: data.seed || requestBody.seed,
            providerName: this.name,
            generationTime: data.generation_time || undefined
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
        error: `Error: ${errorMessage}`,
        provider: this.id,
        model: 'none'
      };
    }
  }
}