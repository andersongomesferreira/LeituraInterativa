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

import logger from '../logger';

/**
 * HuggingFace Provider Implementation
 * Uses HuggingFace's Inference API for image generation
 */
export class HuggingFaceProvider implements AIProvider {
  id = 'huggingface';
  name = 'HuggingFace';
  status: ProviderStatus = {
    isAvailable: false,
    lastChecked: new Date(),
  };
  capabilities: ProviderCapabilities = {
    textGeneration: true,  // HuggingFace suporta geração de texto
    imageGeneration: true, // e geração de imagens
    audioGeneration: false,
    languagesSupported: ['en', 'pt', 'es'],
    multimodalSupport: true
  };
  
  private apiKey: string | null = null;
  private baseUrl = 'https://api-inference.huggingface.co/models';
  private defaultImageModel = 'stabilityai/stable-diffusion-xl-base-1.0';
  
  constructor() {
    // Inicializar com variável de ambiente, se disponível
    this.apiKey = process.env.HUGGINGFACE_API_KEY || null;
    this.updateAvailability();
  }
  
  /**
   * Atualiza o status de disponibilidade do provedor
   */
  private updateAvailability(): void {
    const hasApiKey = !!this.apiKey && this.apiKey.trim() !== '';
    this.status.isAvailable = hasApiKey;
    this.status.statusMessage = hasApiKey 
      ? 'API key configurada' 
      : 'API key não configurada';
    this.status.lastChecked = new Date();
  }
  
  /**
   * Define a chave da API
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.updateAvailability();
    logger.info('API key do HuggingFace atualizada');
  }
  
  /**
   * Executa uma verificação de saúde no serviço
   */
  async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    // Se não tiver chave de API, o serviço não está disponível
    if (!this.apiKey) {
      return {
        isHealthy: false,
        responseTime: 0,
        timestamp: new Date(),
        message: 'API key não configurada'
      };
    }
    
    try {
      // Fazer uma chamada simples para verificar se o serviço está disponível
      const response = await fetch(`${this.baseUrl}/${this.defaultImageModel}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: 'A small test' })
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok || response.status === 503) {
        // 503 é comum no HuggingFace quando o modelo está carregando,
        // o que ainda indica que o serviço está funcionando
        this.status.isAvailable = true;
        this.status.responseTime = responseTime;
        this.status.statusMessage = 'Serviço operacional';
        
        return {
          isHealthy: true,
          responseTime,
          timestamp: new Date(),
          message: 'Serviço operacional'
        };
      } else {
        const errData = await response.json().catch(() => ({}));
        this.status.isAvailable = false;
        this.status.statusMessage = `Erro de API: ${response.status} ${response.statusText}`;
        
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
      this.status.statusMessage = `Erro de conexão: ${(error as Error).message}`;
      
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
   * Geração de texto (implementação básica, pode ser expandida)
   */
  async generateText(params: TextGenerationParams): Promise<TextGenerationResult> {
    if (!this.apiKey) {
      throw new Error('API key do HuggingFace não configurada');
    }
    
    try {
      // Usar um modelo de linguagem apropriado
      const model = params.model || 'gpt2';
      const response = await fetch(`${this.baseUrl}/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          inputs: params.prompt,
          parameters: {
            max_new_tokens: params.maxTokens || 250,
            temperature: params.temperature || 0.7,
            top_p: params.topP || 0.9
          }
        })
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        logger.error('Erro na geração de texto com HuggingFace:', error);
        throw new Error(`Erro de API HuggingFace: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      let content = '';
      
      // O formato da resposta pode variar dependendo do modelo
      if (Array.isArray(result) && result.length > 0) {
        if (typeof result[0] === 'object' && result[0].generated_text) {
          content = result[0].generated_text;
        } else {
          content = String(result[0]);
        }
      } else if (typeof result === 'object' && result.generated_text) {
        content = result.generated_text;
      } else {
        content = String(result);
      }
      
      return {
        content,
        provider: this.id,
        model: model,
        success: true
      };
    } catch (error) {
      logger.error('Erro na geração de texto com HuggingFace:', error);
      return {
        content: '',
        provider: this.id,
        model: 'error',
        success: false,
        error: (error as Error).message
      };
    }
  }
  
  /**
   * Geração de imagem
   */
  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    if (!this.apiKey) {
      throw new Error('API key do HuggingFace não configurada');
    }
    
    try {
      logger.info(`Gerando imagem com HuggingFace usando prompt: "${params.prompt.substring(0, 50)}..."`);
      
      // Determinar o modelo a ser usado
      const model = params.model || this.defaultImageModel;
      
      // Preparar o prompt
      let enhancedPrompt = params.prompt;
      if (params.style) {
        enhancedPrompt += `, ${params.style} style`;
      }
      
      // Adicionar parâmetros de qualidade para o prompt
      enhancedPrompt += ', high quality, detailed';
      
      // Fazer a requisição para a API
      const response = await fetch(`${this.baseUrl}/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          inputs: enhancedPrompt,
          parameters: {
            negative_prompt: "low quality, blurry, distorted, disfigured, bad anatomy",
            num_inference_steps: 50,
            guidance_scale: 7.5,
            seed: params.seed
          }
        })
      });
      
      // Verificar o status da resposta
      if (!response.ok) {
        // Se o modelo estiver carregando, tentar novamente após um tempo
        if (response.status === 503) {
          logger.info('Modelo HuggingFace carregando, aguardando...');
          // Espera 5 segundos e tenta novamente
          await new Promise(resolve => setTimeout(resolve, 5000));
          return this.generateImage(params);
        }
        
        const error = await response.json().catch(() => ({}));
        logger.error('Erro na geração de imagem com HuggingFace:', error);
        throw new Error(`Erro de API HuggingFace: ${response.status} ${response.statusText}`);
      }
      
      // API do HuggingFace retorna a imagem diretamente como buffer
      const imageBuffer = await response.arrayBuffer();
      
      // Converter o buffer para Base64
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      
      // Usar biblioteca de servidor para salvar a imagem temporariamente e retornar URL
      // (Este trecho precisaria ser adaptado para a infraestrutura real do servidor)
      const imageUrl = await this.saveImageAndGetUrl(base64Image, params);
      
      logger.info(`Imagem gerada com sucesso pelo HuggingFace usando modelo ${model}`);
      
      return {
        success: true,
        imageUrl,
        base64Image,
        provider: this.id,
        model,
        promptUsed: enhancedPrompt,
        seed: params.seed
      };
    } catch (error) {
      logger.error(`Erro na geração de imagem com HuggingFace: ${(error as Error).message}`);
      throw error;
    }
  }
  
  /**
   * Método auxiliar para salvar a imagem e retornar uma URL
   * Na implementação real, você precisaria salvar isso em um servidor de arquivos/CDN
   */
  private async saveImageAndGetUrl(base64Image: string, params: ImageGenerationParams): Promise<string> {
    // Implementação simplificada - na prática, você salvaria em um CDN ou servidor de arquivos
    // e retornaria a URL real
    
    // Usando um serviço de imagem temporária apenas para demonstração
    try {
      const formData = new FormData();
      
      // Converter Base64 para Blob
      const byteCharacters = atob(base64Image);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      // Adicionar ao FormData
      formData.append('file', blob, 'generated-image.png');
      
      // Upload para um serviço temporário (exemplo: imgbb.com)
      // Nota: Na implementação real, você usaria seu próprio CDN ou serviço de armazenamento
      const response = await fetch('https://api.imgbb.com/1/upload?key=YOUR_IMGBB_KEY', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        return data.data.url;
      }
      
      // Fallback para uso em desenvolvimento/demo
      return `data:image/png;base64,${base64Image}`;
    } catch (error) {
      logger.error('Erro ao salvar imagem:', error);
      // Fallback para base64 direto (apenas para desenvolvimento)
      return `data:image/png;base64,${base64Image}`;
    }
  }
} 