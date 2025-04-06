import Anthropic from "@anthropic-ai/sdk";
import { 
  AIProvider,
  ProviderStatus,
  ProviderCapabilities,
  HealthCheckResult,
  TextGenerationParams,
  TextGenerationResult,
  ImageGenerationParams,
  ImageGenerationResult
} from "./types";

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025. do not change this unless explicitly requested by the user
const DEFAULT_TEXT_MODEL = "claude-3-7-sonnet-20250219";
const BACKUP_ILLUSTRATIONS = {
  "default": "https://cdn.pixabay.com/photo/2016/04/15/20/28/cartoon-1332054_960_720.png",
  "character": "https://cdn.pixabay.com/photo/2019/05/26/14/40/cartoon-4230855_960_720.png",
  "forest": "https://cdn.pixabay.com/photo/2017/08/10/02/05/tiles-sprites-2617112_960_720.png",
  "adventure": "https://cdn.pixabay.com/photo/2019/03/17/12/04/cartoon-4060188_960_720.png",
  "animals": "https://cdn.pixabay.com/photo/2023/04/17/21/11/animals-7934300_960_720.png"
};

export class AnthropicProvider implements AIProvider {
  id: string = "anthropic";
  name: string = "Anthropic Claude";
  
  private client!: Anthropic;
  private apiKey: string;
  
  status: ProviderStatus = {
    isAvailable: false,
    lastChecked: new Date(),
  };
  
  capabilities: ProviderCapabilities = {
    textGeneration: true,
    imageGeneration: false, // Claude não suporta geração de imagens como output, apenas input
    audioGeneration: false,
    maxContextLength: 200000,
    languagesSupported: ["en", "pt", "es", "fr", "de", "it", "ja", "ko", "zh"],
    multimodalSupport: true
  };
  
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || "";
    
    if (!this.apiKey) {
      console.warn("Anthropic API key not provided. Anthropic provider will not be available.");
      this.status.isAvailable = false;
      this.status.statusMessage = "API key not configured";
      return;
    }
    
    this.client = new Anthropic({ apiKey: this.apiKey });
    this.status.isAvailable = true;
    this.status.statusMessage = "Initialized";
  }
  
  async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    if (!this.apiKey) {
      return {
        isHealthy: false,
        responseTime: 0,
        timestamp: new Date(),
        message: "API key not configured"
      };
    }
    
    try {
      // Fazer uma pequena solicitação para testar a conectividade e autenticação
      const response = await this.client.messages.create({
        model: DEFAULT_TEXT_MODEL,
        max_tokens: 5,
        messages: [{ role: "user", content: "Hello, are you available? Respond in one word." }]
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Atualizar o status
      this.status.isAvailable = true;
      this.status.lastChecked = new Date();
      this.status.responseTime = responseTime;
      this.status.statusMessage = "Healthy";
      
      return {
        isHealthy: true,
        responseTime,
        timestamp: new Date(),
        message: "API is responding normally",
      };
    } catch (error: any) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Atualizar o status
      this.status.isAvailable = false;
      this.status.lastChecked = new Date();
      this.status.responseTime = responseTime;
      this.status.statusMessage = error.message || "Error connecting to Anthropic API";
      
      // Verificar se é um erro de cota
      let quotaStatus;
      if (error.status === 429) {
        quotaStatus = {
          remaining: 0,
          total: 1000, // valor estimado padrão
        };
      }
      
      return {
        isHealthy: false,
        responseTime,
        timestamp: new Date(),
        message: error.message || "Error connecting to Anthropic API",
        quotaStatus,
        errors: error
      };
    }
  }
  
  async generateText(params: TextGenerationParams): Promise<TextGenerationResult> {
    if (!this.status.isAvailable) {
      await this.checkHealth();
      if (!this.status.isAvailable) {
        throw new Error(`Provider ${this.name} is not available: ${this.status.statusMessage}`);
      }
    }
    
    const model = params.model || DEFAULT_TEXT_MODEL;
    
    try {
      const systemMessage = params.systemMessage || 
        "Você é um autor de histórias infantis em português brasileiro, especializado em criar conteúdo educativo e envolvente para crianças.";
      
      const response = await this.client.messages.create({
        model,
        system: systemMessage,
        max_tokens: params.maxTokens || 4000,
        temperature: params.temperature || 0.7,
        top_p: params.topP || 1,
        messages: [
          { role: "user", content: params.prompt }
        ]
      });
      
      // Acessa o conteúdo de forma segura
      let content = "";
      if (response.content && response.content.length > 0) {
        const firstBlock = response.content[0];
        if ('text' in firstBlock) {
          content = firstBlock.text;
        }
      }
      
      return {
        content,
        model,
        provider: this.id,
        usage: {
          promptTokens: 0, // A API do Anthropic não retorna contagem de tokens atualmente
          completionTokens: 0,
          totalTokens: 0
        }
      };
    } catch (error: any) {
      // Atualizar o status se houver erro
      this.status.isAvailable = false;
      this.status.statusMessage = error.message || "Error generating text";
      
      console.error(`Anthropic text generation error: ${error.message}`);
      throw new Error(`Error generating text with ${this.name}: ${error.message}`);
    }
  }
  
  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    // Anthropic não oferece geração de imagens, então usamos imagens de backup
    console.warn("Anthropic does not support image generation. Using backup illustration.");
    
    // Selecionar uma imagem de backup apropriada baseada no prompt
    let backupImage = BACKUP_ILLUSTRATIONS.default;
    const prompt = params.prompt.toLowerCase();
    
    if (prompt.includes("floresta") || prompt.includes("selva")) {
      backupImage = BACKUP_ILLUSTRATIONS.forest;
    } else if (prompt.includes("aventura")) {
      backupImage = BACKUP_ILLUSTRATIONS.adventure;
    } else if (prompt.includes("animal") || prompt.includes("leão") || 
               prompt.includes("tucano") || prompt.includes("macaco")) {
      backupImage = BACKUP_ILLUSTRATIONS.animals;
    } else if (prompt.includes("personagem") || prompt.includes("character")) {
      backupImage = BACKUP_ILLUSTRATIONS.character;
    }
    
    return {
      imageUrl: backupImage,
      model: "none",
      provider: this.id,
      promptUsed: params.prompt,
      isBackup: true
    };
  }
}