import os from 'os';
import { AICapability } from './ai-providers/provider-manager';
import aiProviderManager from './ai-providers';
import { ImageGenerationParams, TextGenerationParams } from './ai-providers/types';
import logger from './logger';
import { db } from '../db';

// Admin service for managing administrative functions
export class AdminService {
  /**
   * Get system resource information
   */
  async getSystemResources() {
    try {
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const uptime = os.uptime();
      
      return {
        cpu: {
          count: cpus.length,
          model: cpus[0].model,
          speed: cpus[0].speed,
          load: process.cpuUsage(),
        },
        memory: {
          total: totalMem,
          free: freeMem,
          used: totalMem - freeMem,
          percentUsed: ((totalMem - freeMem) / totalMem * 100).toFixed(2)
        },
        uptime: {
          seconds: uptime,
          minutes: (uptime / 60).toFixed(2),
          hours: (uptime / 3600).toFixed(2),
          days: (uptime / 86400).toFixed(2)
        },
        platform: process.platform,
        nodeVersion: process.version
      };
    } catch (error) {
      logger.error('Error getting system resources:', error);
      throw new Error('Failed to get system resources');
    }
  }
  
  /**
   * Get admin statistics
   */
  async getAdminStats() {
    try {
      // Note: These would need to be adapted to the actual schema definitions
      // Using simple counts for demonstration
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Mock data since we don't have the actual schema
      const totalUsers = 100;
      const activeUsers = 75;
      const totalStories = 250;
      const newStories = 50;
      const imageGenerations = 500;
      const imageGenerationsLast30Days = 150;
      const textGenerations = 300;
      const textGenerationsLast30Days = 100;
      
      const providerStats = aiProviderManager.getProvidersStatus();
      
      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          percentActive: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : '0'
        },
        stories: {
          total: totalStories,
          new: newStories,
          percentNew: totalStories > 0 ? ((newStories / totalStories) * 100).toFixed(2) : '0'
        },
        generations: {
          text: {
            total: textGenerations,
            last30Days: textGenerationsLast30Days,
            percentChange: textGenerations > 0 
              ? (((textGenerationsLast30Days / textGenerations) * 100) - 100).toFixed(2) 
              : '0'
          },
          image: {
            total: imageGenerations,
            last30Days: imageGenerationsLast30Days,
            percentChange: imageGenerations > 0 
              ? (((imageGenerationsLast30Days / imageGenerations) * 100) - 100).toFixed(2) 
              : '0'
          }
        },
        providers: providerStats
      };
    } catch (error) {
      logger.error('Error getting admin stats:', error);
      throw new Error('Failed to get admin statistics');
    }
  }
  
  /**
   * Generate a story using a specific model and provider
   */
  async generateStoryWithModel(params: TextGenerationParams & { 
    model?: string;
    provider?: string;
  }): Promise<{
    content: string;
    title?: string;
    summary?: string;
    tokens?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    time: number;
    estimatedCost: number;
  }> {
    try {
      const startTime = Date.now();
      
      // If provider is specified, set it as preferred for the test
      if (params.provider) {
        await aiProviderManager.setPreferredProviderForModelTest(
          AICapability.TEXT_GENERATION, 
          params.provider
        );
      }
      
      // Generate the story
      const result = await aiProviderManager.generateText({
        ...params,
        model: params.model || undefined
      });
      
      // Restore the original preferred provider
      if (params.provider) {
        aiProviderManager.restorePreferredProvider(AICapability.TEXT_GENERATION);
      }
      
      const endTime = Date.now();
      const generationTime = endTime - startTime;
      
      // Calculate estimated cost
      const estimatedCost = this.calculateTextCost(
        result.model,
        result.usage?.totalTokens || 0
      );
      
      // Try to extract title and summary from generated content
      let title = '';
      let summary = '';
      
      try {
        // Simple regex extraction of title and summary (without using 's' flag)
        const titleMatch = result.content.match(/Title:\s*(.*?)(\n|$)/i);
        if (titleMatch) title = titleMatch[1].trim();
        
        const summaryMatch = result.content.match(/Summary:\s*([\s\S]*?)(\n\n|$)/i);
        if (summaryMatch) summary = summaryMatch[1].trim();
      } catch (extractionError) {
        logger.warn('Error extracting title/summary from generated content', { error: String(extractionError) });
      }
      
      return {
        content: result.content,
        title,
        summary,
        tokens: result.usage,
        time: generationTime,
        estimatedCost
      };
    } catch (error) {
      logger.error('Error generating story with model', error);
      throw new Error(`Failed to generate story: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Generate an image using a specific model and provider
   */
  async generateImageWithModel(params: ImageGenerationParams & {
    model?: string;
    provider?: string;
  }): Promise<{
    imageUrl: string;
    prompt: string;
    model: string;
    provider: string;
    time: number;
    estimatedCost: number;
  }> {
    try {
      // Se um provedor específico foi solicitado, verificar se está disponível
      if (params.provider) {
        const provider = aiProviderManager.getProvider(params.provider);
        
        if (!provider) {
          throw new Error(`O provedor ${params.provider} não existe`);
        }
        
        // Verificar se o provedor tem uma API key configurada - verificação segura
        if (provider.hasApiKey && !provider.hasApiKey()) {
          throw new Error(`O provedor ${provider.name || params.provider} não está configurado (API key não disponível)`);
        }
      }
      
      const startTime = Date.now();
      
      // If provider is specified, set it as preferred for the test
      if (params.provider) {
        await aiProviderManager.setPreferredProviderForModelTest(
          AICapability.IMAGE_GENERATION, 
          params.provider
        );
      }
      
      // Generate the image
      const result = await aiProviderManager.generateImage({
        ...params,
        model: params.model || undefined
      });
      
      // Restore the original preferred provider
      if (params.provider) {
        aiProviderManager.restorePreferredProvider(AICapability.IMAGE_GENERATION);
      }
      
      const endTime = Date.now();
      const generationTime = endTime - startTime;
      
      // Calculate estimated cost
      const estimatedCost = this.calculateImageCost(
        result.model || '',
        params.size || '512x512' 
      );
      
      return {
        imageUrl: result.imageUrl,
        prompt: params.prompt,
        model: result.model || 'unknown',
        provider: result.provider || 'unknown',
        time: generationTime,
        estimatedCost
      };
    } catch (error) {
      logger.error('Error generating image with model', error);
      throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Calculate the estimated cost of text generation
   */
  calculateTextCost(model: string, tokens: number): number {
    // Default values
    let inputCostPer1k = 0.0015;  // Default to GPT-3.5 pricing
    let outputCostPer1k = 0.002;
    
    // Adjust based on model
    if (model.includes('gpt-4')) {
      inputCostPer1k = 0.03;
      outputCostPer1k = 0.06;
    } else if (model.includes('gpt-3.5-turbo-16k')) {
      inputCostPer1k = 0.003;
      outputCostPer1k = 0.004;
    } else if (model.includes('claude-3')) {
      inputCostPer1k = 0.015;
      outputCostPer1k = 0.075;
    }
    
    // Assume 30% of tokens are prompt, 70% are completion
    const promptTokens = tokens * 0.3;
    const completionTokens = tokens * 0.7;
    
    // Calculate costs
    const promptCost = (promptTokens / 1000) * inputCostPer1k;
    const completionCost = (completionTokens / 1000) * outputCostPer1k;
    
    return promptCost + completionCost;
  }
  
  /**
   * Calculate the estimated cost of image generation
   */
  calculateImageCost(model: string, size: string): number {
    // Default cost for DALL-E 2 standard size
    let cost = 0.02;
    
    // Adjust based on model and size
    if (model.includes('dall-e-3')) {
      if (size.includes('1024')) {
        cost = 0.04;
      } else if (size.includes('1792') || size.includes('1024x1792')) {
        cost = 0.08;
      }
    } else if (model.includes('midjourney')) {
      cost = 0.05; // approximation
    } else if (model.includes('stability')) {
      cost = 0.03;
    }
    
    return cost;
  }
  
  /**
   * Get available AI models for text and image generation
   */
  async getAvailableModels() {
    try {
      const textModels = await aiProviderManager.getAvailableModels(AICapability.TEXT_GENERATION);
      const imageModels = await aiProviderManager.getAvailableModels(AICapability.IMAGE_GENERATION);
      
      return {
        text: textModels,
        image: imageModels
      };
    } catch (error) {
      logger.error('Error getting available models', error);
      throw new Error('Failed to get available models');
    }
  }
}

// Export a singleton instance
const adminService = new AdminService();
export default adminService; 