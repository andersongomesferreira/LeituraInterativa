import OpenAI from "openai";
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

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_TEXT_MODEL = "gpt-4o";
const DEFAULT_IMAGE_MODEL = "dall-e-3";

export class OpenAIProvider implements AIProvider {
  id: string = "openai";
  name: string = "OpenAI";
  
  private client!: OpenAI;
  private apiKey: string;
  
  status: ProviderStatus = {
    isAvailable: false,
    lastChecked: new Date(),
  };
  
  capabilities: ProviderCapabilities = {
    textGeneration: true,
    imageGeneration: true,
    audioGeneration: true,
    maxContextLength: 128000,
    languagesSupported: ["en", "pt", "es", "fr", "de", "it", "ja", "ko", "zh"],
    multimodalSupport: true
  };
  
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    
    if (!this.apiKey) {
      console.warn("OpenAI API key not provided. OpenAI provider will not be available.");
      this.status.isAvailable = false;
      this.status.statusMessage = "API key not configured";
      return;
    }
    
    try {
      // Check if API key is properly formatted
      if (!this.apiKey.startsWith('sk-') || this.apiKey.length < 20) {
        console.warn("OpenAI API key appears to be invalid (wrong format). OpenAI provider will not be available.");
        this.status.isAvailable = false;
        this.status.statusMessage = "API key appears to be invalid (wrong format)";
        return;
      }
      
      this.client = new OpenAI({ apiKey: this.apiKey });
      this.status.isAvailable = true;
      this.status.statusMessage = "Initialized";
      
      // Schedule an immediate health check
      setTimeout(() => this.checkHealth(), 1000);
    } catch (error: any) {
      console.error("Error initializing OpenAI provider:", error);
      this.status.isAvailable = false;
      this.status.statusMessage = `Error initializing: ${error.message || String(error)}`;
    }
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
      const response = await this.client.chat.completions.create({
        model: DEFAULT_TEXT_MODEL,
        messages: [{ role: "user", content: "Hello, are you available? Respond in one word." }],
        max_tokens: 5
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
      this.status.statusMessage = error.message || "Error connecting to OpenAI API";
      
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
        message: error.message || "Error connecting to OpenAI API",
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
      
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: params.prompt }
        ],
        max_tokens: params.maxTokens || 4000,
        temperature: params.temperature || 0.7,
        top_p: params.topP || 1,
        presence_penalty: params.presencePenalty || 0,
        frequency_penalty: params.frequencyPenalty || 0,
        response_format: params.format === "json" ? { type: "json_object" } : undefined
      });
      
      const content = response.choices[0]?.message?.content || "";
      
      return {
        content,
        model,
        provider: this.id,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        }
      };
    } catch (error: any) {
      // Atualizar o status se houver erro
      this.status.isAvailable = false;
      this.status.statusMessage = error.message || "Error generating text";
      
      console.error(`OpenAI text generation error: ${error.message}`);
      throw new Error(`Error generating text with ${this.name}: ${error.message}`);
    }
  }
  
  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    if (!this.status.isAvailable) {
      await this.checkHealth();
      if (!this.status.isAvailable) {
        throw new Error(`Provider ${this.name} is not available: ${this.status.statusMessage}`);
      }
    }
    
    const model = params.model || DEFAULT_IMAGE_MODEL;
    
    try {
      // Construir um prompt enriquecido para garantir que as imagens sejam adequadas para crianças
      let enhancedPrompt = params.prompt;
      
      // Adicionar instruções específicas baseadas no grupo etário
      if (params.ageGroup) {
        enhancedPrompt = this.enhancePromptForAgeGroup(enhancedPrompt, params.ageGroup, params.style);
      }
      
      console.log(`OpenAI generating image with prompt: ${enhancedPrompt.substring(0, 100)}...`);
      
      const response = await this.client.images.generate({
        model,
        prompt: enhancedPrompt,
        n: params.n || 1,
        size: (params.size as any) || "1024x1024",
        quality: (params.quality as any) || "standard",
        style: (params.style === "cartoon" || params.style === "vivid") ? "vivid" : "natural",
        response_format: (params.responseFormat as any) || "url"
      });
      
      const imageUrl = response.data[0]?.url || "";
      const b64Json = response.data[0]?.b64_json;
      
      return {
        success: true,
        imageUrl,
        base64Image: b64Json,
        model,
        provider: this.id,
        promptUsed: enhancedPrompt
      };
    } catch (error: any) {
      // Atualizar o status se houver erro
      this.status.isAvailable = false;
      this.status.statusMessage = error.message || "Error generating image";
      
      console.error(`OpenAI image generation error: ${error.message}`);
      throw new Error(`Error generating image with ${this.name}: ${error.message}`);
    }
  }
  
  private enhancePromptForAgeGroup(prompt: string, ageGroup: string, style?: string): string {
    let enhancedPrompt = "IMPORTANTE: Esta é uma ilustração para um LIVRO INFANTIL. ";
    enhancedPrompt += "Crie uma ILUSTRAÇÃO ESTILO CARTOON para a seguinte cena, incluindo APENAS os elementos mencionados na descrição:\n\n";
    
    // Adicionar o prompt original
    enhancedPrompt += prompt + "\n\n";
    
    // Estilo base apropriado para a idade
    let ageStyle = "";
    switch (ageGroup) {
      case "3-5":
        ageStyle = "estilo muito simples e colorido, formas geométricas básicas, personagens muito grandes e expressivos com cabeças grandes, ABSOLUTAMENTE sem detalhes complexos, cores primárias vibrantes, contornos grossos e bem definidos, fundo simples e minimalista";
        break;
      case "6-8":
        ageStyle = "estilo cartunizado colorido com personagens expressivos com proporções exageradas tipo desenho animado (como na Turma da Mônica), cenários mais detalhados mas simplificados, cores vibrantes, linhas claras e definidas, expressões faciais exageradas";
        break;
      case "9-12":
        ageStyle = "estilo cartunizado com mais detalhes, personagens com proporções cartunescas (cabeças maiores, feições expressivas), cenários mais elaborados mas ainda estilizados, paleta de cores ricas, linhas claras e contornos definidos, sem ser complexo demais";
        break;
      default:
        ageStyle = "estilo cartunizado colorido adequado para crianças, com linhas claras e definidas, cores vibrantes, personagens expressivos com proporções exageradas";
    }
    
    // Adicionar instruções detalhadas e rigorosas
    enhancedPrompt += `ESTILO VISUAL OBRIGATÓRIO: ${ageStyle}.\n`;
    enhancedPrompt += `MOOD/CLIMA: ${style === "exciting" ? "aventura e emoção" : style === "calm" ? "tranquilo e aconchegante" : style === "happy" ? "alegre e animado" : "alegre e amigável"}.\n`;
    enhancedPrompt += "CARACTERÍSTICAS VISUAIS OBRIGATÓRIAS:\n";
    enhancedPrompt += "- Ilustre APENAS os personagens e elementos mencionados na descrição acima\n";
    enhancedPrompt += "- Cores: Vibrantes, saturadas e alegres, sem tons escuros ou assustadores\n";
    enhancedPrompt += "- Linhas: Contornos grossos, pretos e bem definidos em todos os elementos\n";
    enhancedPrompt += "- Personagens: Olhos grandes e expressivos, proporções cartunescas (cabeças maiores que o corpo)\n";
    enhancedPrompt += "- Visual geral: Simplificado, divertido, 100% apropriado para crianças\n";
    enhancedPrompt += "- Estilo de render: Flat colors (cores chapadas) com sombras simples\n";
    enhancedPrompt += "- Composição: Cenário claro e minimalista que não distraia da ação principal\n\n";
    
    // Adicionar regras negativas explícitas com mais ênfase
    enhancedPrompt += "ABSOLUTAMENTE PROIBIDO (NUNCA INCLUA):\n";
    enhancedPrompt += "- NÃO inclua elementos não mencionados na descrição da cena acima\n";
    enhancedPrompt += "- NÃO use fotorrealismo ou realismo nos personagens ou cenários\n";
    enhancedPrompt += "- NÃO use estilo de arte complexa, renderização 3D realista ou estilo de anime\n";
    enhancedPrompt += "- NÃO inclua imagens assustadoras, sombrias ou inapropriadas para crianças\n";
    enhancedPrompt += "- NÃO inclua texto ou letras dentro da imagem\n";
    enhancedPrompt += "- NÃO use elementos visuais complexos, texturas detalhadas ou sombras intensas\n";
    enhancedPrompt += "- NÃO desenhe pessoas ou animais reais, somente personagens de desenho animado\n\n";
    
    // Referências específicas a estilos
    enhancedPrompt += "REFERÊNCIAS DE ESTILO: Desenhos animados como Turma da Mônica, Gravity Falls, Hora de Aventura, O Incrível Mundo de Gumball.";
    
    return enhancedPrompt;
  }
}