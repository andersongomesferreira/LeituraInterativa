// Serviço de IA centralizado que utiliza o gerenciador de provedores
import aiProviderManager, { 
  TextGenerationParams, 
  ImageGenerationParams
} from "./ai-providers";

import { promptEnhancer } from './prompt-enhancement-service';
import { characterConsistencyService } from './character-consistency-service';
import logger from './logger';

// Definir tipos para histórias e IA

// Parâmetros para geração de história
export interface StoryParams {
  characters: string[];
  theme: string;
  ageGroup: string;
  childName?: string;
  complexityLevel?: 'low' | 'medium' | 'high';
  textOnly?: boolean; // Opção para gerar histórias sem ilustrações
}

// História gerada
export interface GeneratedStory {
  title: string;
  content: string;
  summary: string;
  readingTime: number;
  chapters: Chapter[];
}

// Capítulo de uma história
export interface Chapter {
  title: string;
  content: string;
  imagePrompt?: string;
  imageUrl?: string;
  audioUrl?: string;
}

// Imagem gerada
export interface GeneratedImage {
  imageUrl: string;
  base64Image?: string;
  metadata?: any;
  isBackup?: boolean;
  success?: boolean;
  error?: string;
  provider?: string;
  model?: string;
  promptUsed?: string;
  seed?: number;
  generationTime?: number;
  details?: any;
  attemptedProviders?: string[];
}

// Função para extrair capítulos de uma história
export function extractChapters(content: string): Chapter[] {
  // Primeiro tentamos encontrar capítulos formatados com markdown (## Título)
  const chapterRegex = /##\s+([^\n]+)(?:\n+)((?:(?!##\s+).|\n)+)/g;
  const chapters: Chapter[] = [];
  let match;
  
  while ((match = chapterRegex.exec(content)) !== null) {
    const title = match[1].trim();
    const chapterContent = match[2].trim();
    
    // Extrair prompt de imagem se estiver definido
    let imagePrompt = undefined;
    
    // Procurar por um marcador de prompt de imagem no conteúdo
    const promptRegex = /\[(?:image|imagem|IMAGEM):\s*([^\]]+)\]/i;
    const promptMatch = chapterContent.match(promptRegex);
    
    if (promptMatch) {
      imagePrompt = promptMatch[1].trim();
    } else {
      // Se não encontrar um prompt específico, criar um baseado no título e conteúdo
      const summary = chapterContent.substring(0, 200); // Pegar os primeiros 200 caracteres para um resumo
      imagePrompt = `Ilustração para o capítulo "${title}": ${summary}`;
    }
    
    // Remover o marcador de prompt de imagem do conteúdo do capítulo
    const cleanContent = chapterContent.replace(promptRegex, '').trim();
    
    chapters.push({
      title,
      content: cleanContent,
      imagePrompt
    });
  }
  
  // Se não encontrou capítulos formatados, tentamos dividir por parágrafos em 3-4 seções
  if (chapters.length === 0) {
    const paragraphs = content.split(/\n\s*\n/);
    
    // Se houver pelo menos 3 parágrafos, criamos "capítulos" artificiais
    if (paragraphs.length >= 3) {
      const chapterSize = Math.ceil(paragraphs.length / 3); // Dividir em 3 capítulos aproximadamente iguais
      
      for (let i = 0; i < paragraphs.length; i += chapterSize) {
        const chapterParagraphs = paragraphs.slice(i, i + chapterSize);
        const chapterContent = chapterParagraphs.join('\n\n');
        const chapterNumber = Math.floor(i / chapterSize) + 1;
        
        let title = '';
        switch (chapterNumber) {
          case 1: title = "O Início da Aventura"; break;
          case 2: title = "O Desafio"; break;
          case 3: title = "A Solução"; break;
          default: title = `Parte ${chapterNumber}`;
        }
        
        // Criar um prompt de imagem básico para esse capítulo
        const imagePrompt = `Ilustração para ${title}: ${chapterContent.substring(0, 150)}`;
        
        chapters.push({
          title,
          content: chapterContent,
          imagePrompt
        });
      }
    } else {
      // Se houver poucos parágrafos, criamos um único capítulo
      const imagePrompt = `Ilustração para a história: ${content.substring(0, 200)}`;
      
      chapters.push({
        title: "A História",
        content,
        imagePrompt
      });
    }
  }
  
  return chapters;
}

// Função para gerar uma história utilizando o provedor mais adequado
export async function generateStory(params: StoryParams, userTier: string = "free"): Promise<GeneratedStory> {
  const { characters, theme, ageGroup, childName, textOnly } = params;
  
  let ageAppropriateInstructions = "";
  let vocabularyLevel = "";
  let storyLength = "";
  
  switch (ageGroup) {
    case "3-5":
      ageAppropriateInstructions = "Crie uma história curta com frases simples, com vocabulário muito básico e adequado para crianças de 3 a 5 anos. Use repetições e rimas simples. Foque em situações cotidianas, amizade e descobertas simples.";
      vocabularyLevel = "básico";
      storyLength = "muito curta (4-5 parágrafos)";
      break;
    case "6-8":
      ageAppropriateInstructions = "Crie uma história com frases um pouco mais elaboradas, mas ainda acessíveis para crianças de 6 a 8 anos. Pode incluir alguns desafios simples para os personagens e lições de amizade e cooperação.";
      vocabularyLevel = "intermediário";
      storyLength = "curta (6-7 parágrafos)";
      break;
    case "9-12":
      ageAppropriateInstructions = "Crie uma história mais elaborada com desenvolvimento de personagens e trama, adequada para crianças de 9 a 12 anos. Pode incluir temas como superação de desafios, autoconhecimento e amizade.";
      vocabularyLevel = "avançado (mas ainda apropriado para crianças)";
      storyLength = "média (8-10 parágrafos)";
      break;
    default:
      ageAppropriateInstructions = "Crie uma história curta com frases simples, adequada para crianças.";
      vocabularyLevel = "básico";
      storyLength = "curta";
  }

  const charactersList = characters.join(", ");
  const namePersonalization = childName ? `Use o nome "${childName}" como personagem principal ou secundário na história.` : "";

  const systemMessage = "Você é um autor de histórias infantis em português brasileiro.";
  const prompt = `
    ${ageAppropriateInstructions}
    
    Crie uma história ${storyLength} sobre o tema "${theme}" com os seguintes personagens: ${charactersList}.
    ${namePersonalization}
    
    A história deve ser educativa, envolvente e apropriada para a faixa etária. Use vocabulário de nível ${vocabularyLevel}.
    Não use palavras em inglês ou outras línguas. Apenas português brasileiro.
    Não use conteúdo assustador, violento ou inadequado para crianças.
    
    IMPORTANTE: 
    1. Divida a história em 3-5 capítulos curtos. Cada capítulo deve ter um título próprio e começar com a formatação "## Nome do Capítulo" (usando a marcação markdown).
    2. Inicie a história com um título no formato "# Título da História" seguido de um breve resumo introdutório.
    3. Para cada capítulo, adicione no final uma descrição para uma possível ilustração no formato:
       [IMAGEM: descrição detalhada de uma cena para ilustrar este capítulo, incluindo personagens e cenário]
    
    A resposta deve estar em formato markdown, NÃO em JSON.
  `;

  try {
    console.log(`Generating story with theme "${theme}" for age group ${ageGroup}...`);
    
    const textParams: TextGenerationParams = {
      prompt,
      systemMessage,
      temperature: 0.7,
      maxTokens: 4000,
      format: "markdown"
    };
    
    try {
      // Before trying to generate, check the provider status
      await aiProviderManager.checkAllProvidersHealth();
      
      // Usar nosso gerenciador de provedores para escolher o melhor provedor
      const result = await aiProviderManager.generateText(textParams, userTier);
      const content = result.content;
      
      // Extrair o título usando regex (# Título)
      const titleMatch = content.match(/# (.*?)(\n|$)/);
      const title = titleMatch ? titleMatch[1].trim() : "Aventura Mágica";
      
      console.log(`Story generated successfully: "${title}" using provider: ${result.provider}`);
      
      // Extrair o resumo da história (texto entre o título e o primeiro capítulo)
      let summary = "";
      const firstChapterIndex = content.indexOf("## ");
      if (firstChapterIndex > 0 && titleMatch) {
        const titleEndIndex = content.indexOf("\n", content.indexOf(titleMatch[0])) + 1;
        const introText = content.substring(titleEndIndex, firstChapterIndex).trim();
        // Limitar o resumo a 1-2 frases
        const sentences = introText.split(/[.!?]+/).filter(s => s.trim().length > 0);
        summary = sentences.slice(0, Math.min(2, sentences.length)).join(". ") + ".";
      } else {
        summary = `Uma história sobre ${theme}`;
      }
      
      // Extrair capítulos da história
      const chapters = extractChapters(content);
      
      // Calcular tempo de leitura estimado (1 palavra = ~0.3 segundos em média)
      const wordCount = content.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200); // ~200 palavras por minuto
      
      return {
        title,
        content,
        summary,
        readingTime,
        chapters
      };
    } catch (aiError) {
      console.error("AI service error generating story:", aiError);
      
      // Use a fallback template-based story generator if AI fails
      console.log("Using fallback story generation method due to AI service error");
      
      // Create a fallback story without using AI
      return generateFallbackStory({
        characters,
        theme,
        ageGroup,
        childName,
        textOnly
      });
    }
  } catch (error: any) {
    console.error("Error generating story:", error);
    
    // Mensagens de erro mais específicas baseadas no tipo de erro
    if (error.message.includes("API key")) {
      throw new Error("Falha na autenticação com a API. Verifique a chave da API.");
    } else if (error.message.includes("429")) {
      throw new Error("Limite de requisições da API excedido. Tente novamente mais tarde.");
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
      throw new Error("Erro de conexão. Verifique sua conexão à internet.");
    } else {
      throw new Error("Não foi possível gerar a história. Por favor, tente novamente.");
    }
  }
}

// Função aprimorada para gerar uma imagem utilizando o provedor mais adequado
export async function generateImage(
  prompt: string, 
  options: {
    style?: "cartoon" | "watercolor" | "pencil" | "digital";
    mood?: "happy" | "adventure" | "calm" | "exciting";
    backgroundColor?: string;
    characterStyle?: "cute" | "funny" | "heroic";
    ageGroup?: "3-5" | "6-8" | "9-12";
    provider?: string; // Provedor específico a ser usado (opcional)
    seed?: number; // Seed para resultados consistentes (opcional)
    textOnly?: boolean; // Opção para histórias sem ilustrações
    characterDescriptions?: Array<{
      name: string;
      appearance?: string;
      visualAttributes?: {
        colors: string[];
        clothing?: string;
        distinguishingFeatures?: string[];
      };
      previousImages?: string[];
    }>;
  } = {},
  userTier: string = "free"
): Promise<GeneratedImage & {
  success: boolean;
  error?: string;
  provider?: string;
  model?: string;
  promptUsed?: string;
  seed?: number;
  generationTime?: number;
}> {
  try {
    logger.info(`Gerando imagem com prompt: "${prompt.substring(0, 50)}..."`);
    
    // Sempre forçar HuggingFace como provedor primeiro
    const forcedProvider = "huggingface";
    logger.info(`Forçando uso do provedor ${forcedProvider} para geração de imagem`);
    
    // Preparar um prompt melhorado com base no estilo solicitado
    let enhancedPrompt = prompt;
    const style = options.style || "cartoon";
    const ageGroup = options.ageGroup || "6-8";
    
    // Adicionar detalhes de estilo ao prompt para melhorar a geração
    if (style === "cartoon") {
      enhancedPrompt += ", colorful cartoon style, child-friendly illustration, digital art";
    } else if (style === "watercolor") {
      enhancedPrompt += ", beautiful watercolor painting, soft colors, artistic";
    } else if (style === "pencil") {
      enhancedPrompt += ", detailed pencil drawing, sketch style, black and white";
    } else if (style === "digital") {
      enhancedPrompt += ", modern digital art, vibrant colors, detailed";
    }
    
    // Adicionar ajustes baseados na faixa etária
    if (ageGroup === "3-5") {
      enhancedPrompt += ", simple shapes, bright colors, very child-friendly, cute characters";
    } else if (ageGroup === "6-8") {
      enhancedPrompt += ", colorful, engaging, child-friendly characters, moderate detail";
    } else if (ageGroup === "9-12") {
      enhancedPrompt += ", more detailed, adventurous, slightly sophisticated but still appropriate for children";
    }
    
    // Adicionar especificações de qualidade para o modelo de geração
    enhancedPrompt += ", high quality, 4k, professional illustration";
    
    logger.debug(`Prompt aprimorado: "${enhancedPrompt.substring(0, 100)}..."`);
    
    try {
      // Parâmetros para geração de imagem
      const imageParams: ImageGenerationParams = {
        prompt: enhancedPrompt,
        n: 1,
        size: userTier === "free" ? "1024x1024" : "1792x1024", 
        style: style,
        quality: "standard",
        provider: forcedProvider,
        seed: options.seed
      };
      
      // Primeiro, tentar usar o provedor HuggingFace
      const result = await aiProviderManager.generateImage(imageParams, userTier);
      
      if (result.success && result.imageUrl) {
        logger.info(`Imagem gerada com sucesso pelo HuggingFace`);
        return {
          success: true,
          imageUrl: result.imageUrl,
          provider: forcedProvider,
          model: result.model || "stable-diffusion-xl",
          promptUsed: enhancedPrompt
        };
      } else {
        throw new Error(result.error || "Falha na geração com HuggingFace");
      }
    } catch (error: any) {
      logger.warn(`Erro ao gerar imagem com HuggingFace: ${error.message}. Tentando OpenAI como fallback.`);
      
      // Se falhar com HuggingFace, tentar com OpenAI como fallback
      try {
        const fallbackParams: ImageGenerationParams = {
          prompt: enhancedPrompt,
          n: 1,
          size: userTier === "free" ? "1024x1024" : "1792x1024",
          style: style,
          provider: 'openai'
        };
        
        const fallbackResult = await aiProviderManager.generateImage(fallbackParams, userTier);
        
        if (fallbackResult.success && fallbackResult.imageUrl) {
          logger.info(`Imagem gerada com sucesso pelo OpenAI (fallback)`);
          return {
            success: true,
            imageUrl: fallbackResult.imageUrl,
            provider: "openai",
            model: "dall-e-3",
            promptUsed: enhancedPrompt
          };
        } else {
          throw new Error(fallbackResult.error || "Falha na geração com OpenAI");
        }
      } catch (fallbackError: any) {
        logger.error(`Falha também no provedor fallback: ${fallbackError.message}`);
        
        // Se todos os provedores falharem, usar imagem estática de fallback
        const fallbackUrl = "https://placehold.co/600x400/e6e6e6/999999?text=Imagem+indisponível";
        logger.warn(`Usando URL de fallback: ${fallbackUrl}`);
        
        return {
          success: false,
          imageUrl: fallbackUrl,
          error: `Falha em todos os provedores: ${error.message}`,
          provider: "fallback-static",
          model: "none",
          promptUsed: enhancedPrompt
        };
      }
    }
  } catch (error: any) {
    logger.error(`Erro geral na geração de imagem: ${error.message}`);
    return {
      success: false,
      imageUrl: "https://placehold.co/600x400/e6e6e6/999999?text=Erro+na+geração",
      error: error.message || "Erro desconhecido na geração de imagem",
      provider: "error",
      model: "none"
    };
  }
}

/**
 * Gera uma imagem para um capítulo de história
 * 
 * @param promptOrChapterId Prompt para geração de imagem ou ID do capítulo (número)
 * @param storyIdOrContent ID da história ou conteúdo do capítulo
 * @param chapterIdOrCharacters ID do capítulo ou array de nomes de personagens
 * @param options Opções adicionais como faixa etária
 * @param userTier Nível de assinatura do usuário
 * @returns URL da imagem gerada e indicador de sucesso
 */
export async function generateChapterImage(
  promptOrChapterId: string | number,
  storyIdOrContent: number | string,
  chapterIdOrCharacters: number | string[],
  options: {
    ageGroup?: string;
    style?: string;
    mood?: string;
    characters?: string[];
    storyId?: number;
    textOnly?: boolean;
    forceProvider?: string;
  } = {},
  userTier: string = 'free'
): Promise<{ success: boolean; imageUrl?: string; error?: string; provider?: string }> {
  try {
    // Verificar se estamos usando a versão antiga (strings) ou nova (números) da função
    const isUsingStringParams = typeof promptOrChapterId === 'string' && typeof storyIdOrContent === 'string';
    
    logger.info(`Iniciando geração de imagem para capítulo. Usando formato de parâmetros ${isUsingStringParams ? 'baseado em strings' : 'baseado em IDs'}`);
    
    let chapterTitle: string;
    let chapterContent: string;
    let characterNames: string[] = [];
    
    if (isUsingStringParams) {
      // Versão antiga: usando strings diretamente
      chapterTitle = promptOrChapterId as string;
      chapterContent = storyIdOrContent as string;
      characterNames = Array.isArray(chapterIdOrCharacters) ? chapterIdOrCharacters : [];
      
      logger.info(`Gerando imagem para capítulo com título: "${chapterTitle.substring(0, 30)}..."`);
    } else {
      // Versão nova: usando IDs - esta parte seria implementada se tivéssemos um banco de dados
      // estruturado dessa forma, mas como não temos, usamos um fallback para a versão de strings
      logger.warn(`Chamada com formato de IDs não totalmente implementada, usando fallback`);
      const storyId = typeof storyIdOrContent === 'number' ? storyIdOrContent : 0;
      const chapterId = typeof chapterIdOrCharacters === 'number' ? chapterIdOrCharacters : 0;
      
      // Aqui poderíamos buscar os dados do capítulo do banco de dados pelos IDs
      // Mas como não temos isso implementado, usamos um fallback simplificado
      chapterTitle = `Capítulo ${chapterId}`;
      chapterContent = "Conteúdo não disponível por ID";
      
      logger.warn(`Usando dados de fallback para storyId ${storyId}, chapterId ${chapterId}`);
    }
    
    // Verificar se estamos no modo text-only
    if (options.textOnly) {
      logger.info("Modo texto-only ativado, pulando geração de imagem");
      return { success: true, imageUrl: "" };
    }
    
    // Determinar a faixa etária e estilo com valores padrão seguros
    const ageGroup = options.ageGroup || '6-8';
    const style = options.style || 'cartoon';
    const mood = options.mood || promptEnhancer.detectMood(chapterContent);
    
    // Buscar informações dos personagens para consistência
    characterNames = options.characters || characterNames || 
      promptEnhancer.extractCharacterNames(chapterContent);
    
    logger.debug(`Gerando imagem para capítulo com título "${chapterTitle}" e personagens: ${characterNames.join(', ')}`);
    logger.debug(`Parâmetros da geração - Faixa etária: ${ageGroup}, Estilo: ${style}, Clima: ${mood}`);
    
    // Criar prompt aprimorado para imagem
    const enhancedPrompt = promptEnhancer.enhanceChapterImagePrompt({
      chapterTitle,
      chapterContent,
      characterDescriptions: [],
      ageGroup,
      style,
      mood
    });
    
    logger.debug(`Prompt aprimorado gerado com ${enhancedPrompt.length} caracteres`);
    
    // Definir o tamanho da imagem com base no nível de assinatura
    const imageSize = userTier === 'free' ? '512x512' : (userTier === 'plus' ? '768x768' : '1024x1024');
    
    logger.info(`Chamando provider para gerar imagem com tamanho ${imageSize}`);
    
    // Verificar se devemos forçar um provedor específico
    let generationOptions: ImageGenerationParams = {
      prompt: enhancedPrompt,
      size: imageSize as any,
      style,
      mood,
      characterDescriptions: []
    };
    
    // Gerar a imagem usando o serviço de IA
    let result;
    
    // Se forceProvider estiver definido, usamos o provedor específico
    if (options.forceProvider) {
      logger.info(`Forçando uso do provedor: ${options.forceProvider}`);
      
      // Adicionar o provedor forçado aos parâmetros de geração
      generationOptions.provider = options.forceProvider;
      
      // Usar o gerenciador para gerar a imagem com o provedor específico
      result = await aiProviderManager.generateImage(generationOptions, userTier);
    } else {
      // Definir HuggingFace como provedor padrão
      generationOptions.provider = 'huggingface';
      
      // Usar o gerenciador normal de provedores com preferência para HuggingFace
      result = await aiProviderManager.generateImage(generationOptions, userTier);
    }
    
    logger.debug(`Resposta do provedor de IA recebida:`, {
      success: result.success,
      provider: result.provider,
      hasImageUrl: !!result.imageUrl,
      imageUrlType: typeof result.imageUrl
    });
    
    // Log detalhado se a imageUrl for um objeto
    if (result.imageUrl && typeof result.imageUrl === 'object') {
      logger.debug(`Objeto imageUrl retornado pelo provedor:`, result.imageUrl);
    }
    
    // Verificar se a geração foi bem-sucedida
    if (result.success && result.imageUrl) {
      // Tentar extrair URL válida se for um objeto
      if (typeof result.imageUrl === 'object') {
        logger.warn(`imageUrl retornada como objeto, tentando extrair URL válida`, result.imageUrl);
        // @ts-ignore
        const extractedUrl = result.imageUrl.url || result.imageUrl.imageUrl || result.imageUrl.src;
        if (extractedUrl) {
          logger.info(`URL extraída com sucesso do objeto`);
          return { 
            success: true, 
            imageUrl: extractedUrl,
            provider: result.provider
          };
        } else {
          logger.error(`Não foi possível extrair URL válida do objeto`);
          return { 
            success: false, 
            error: 'Formato de resposta inválido do provedor de IA',
            provider: result.provider
          };
        }
      }
      
      // URL como string - formato esperado
      logger.info(`Imagem gerada com sucesso pelo provedor ${result.provider}`);
      return { 
        success: true, 
        imageUrl: result.imageUrl,
        provider: result.provider
      };
    } else {
      // Falha na geração
      logger.error(`Falha na geração de imagem: ${result.error || 'Erro desconhecido'}`);
      return { 
        success: false, 
        error: result.error || 'Não foi possível gerar a imagem',
        provider: result.provider
      };
    }
  } catch (error: any) {
    logger.error(`Erro ao gerar imagem para capítulo: ${error instanceof Error ? error.message : String(error)}`);
    
    // Tentar novamente com provedor diferente em caso de falha
    try {
      logger.info('Tentando novamente com provedor alternativo (OpenAI)');
      
      const fallbackParams: ImageGenerationParams = {
        prompt: `Ilustração para história infantil "${promptOrChapterId.toString().substring(0, 100)}..."`,
        n: 1,
        size: userTier === 'free' ? '512x512' : '1024x1024',
        provider: 'openai'
      };
      
      const fallbackResult = await aiProviderManager.generateImage(fallbackParams, userTier);
      
      if (fallbackResult.success && fallbackResult.imageUrl) {
        logger.info(`Imagem gerada com sucesso pelo provedor de fallback: ${fallbackResult.provider}`);
        return { 
          success: true, 
          imageUrl: fallbackResult.imageUrl,
          provider: fallbackResult.provider || 'openai'
        };
      } else {
        throw new Error(fallbackResult.error || 'Falha no provedor alternativo');
      }
    } catch (fallbackError: any) {
      logger.error(`Falha também no provedor alternativo: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
      return { 
        success: false, 
        error: 'Não foi possível gerar a imagem no momento. Por favor, tente novamente mais tarde.' 
      };
    }
  }
}

/**
 * Gera uma imagem de personagem baseada em sua descrição
 * 
 * @param characterName Nome do personagem
 * @param characterDescription Descrição do personagem
 * @param storyId ID da história (para consistência)
 * @param options Opções adicionais como estilo e faixa etária
 * @returns URL da imagem gerada e indicador de sucesso
 */
export async function generateCharacterImage(
  characterName: string,
  characterDescription: string,
  storyId: number,
  options: {
    ageGroup?: string;
    style?: string;
    mood?: string;
  } = {}
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    // Valores padrão seguros
    const ageGroup = options.ageGroup || '6-8';
    const style = options.style || 'cartoon'; // Cartoon é mais adequado para personagens
    const mood = options.mood || 'happy'; // Personagens geralmente aparecem com expressão feliz
    
    // Usar o prompt enhancer para criar um prompt melhor
    const enhancedPrompt = promptEnhancer.enhanceCharacterImagePrompt({
      characterName,
      characterDescription,
      ageGroup,
      style,
      mood
    });
    
    // Gerar a imagem
    const imageUrl = await aiProviderManager.generateImage({
      prompt: enhancedPrompt,
      n: 1,
      size: '512x512', // Tamanho padrão para personagens
      storyId,
      style,
      ageGroup,
      mood
    });
    
    // Atualizar a consistência visual
    if (imageUrl) {
      characterConsistencyService.updateCharacterVisuals(storyId, [{
        name: characterName,
        imageUrl,
        description: characterDescription
      }]);
    }
    
    return { success: true, imageUrl };
  } catch (error) {
    logger.error(`Erro ao gerar imagem para personagem: ${error instanceof Error ? error.message : String(error)}`);
    
    // Fallback para garantir que sempre retornamos uma imagem
    try {
      const fallbackImageUrl = await aiProviderManager.generateImage({
        prompt: `Personagem de história infantil chamado ${characterName}. ${characterDescription.substring(0, 100)}`,
        n: 1,
        size: '512x512',
        provider: 'fallback'
      });
      
      return { success: true, imageUrl: fallbackImageUrl };
    } catch (fallbackError) {
      logger.error(`Falha também no provedor alternativo: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
      return { 
        success: false, 
        error: 'Não foi possível gerar a imagem do personagem. Por favor, tente novamente mais tarde.' 
      };
    }
  }
}

// Função para gerar áudio a partir de texto (mantém a implementação existente)
export async function generateAudioFromText(text: string, userTier: string = "plus"): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Chave da API OpenAI não configurada. Não é possível gerar áudio.");
  }
  
  if (!text || text.trim().length === 0) {
    throw new Error("Texto vazio. Não é possível gerar áudio.");
  }
  
  try {
    // Esta funcionalidade só está disponível via OpenAI por enquanto
    const openai = new (require("openai").default)({ apiKey: process.env.OPENAI_API_KEY });
    
    // Limitar o texto para evitar exceder limites da API (50k caracteres)
    const MAX_CHARS = 1000; // Limitado para evitar arquivos grandes
    const limitedText = text.length > MAX_CHARS ? text.substring(0, MAX_CHARS) + "..." : text;
    
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "shimmer", // voz feminina e suave
      input: limitedText,
      response_format: "mp3"
    });
    
    const buffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(buffer).toString("base64");
    
    return base64Audio;
  } catch (error) {
    console.error("Error generating audio:", error);
    throw new Error("Não foi possível gerar o áudio. Por favor, tente novamente.");
  }
}

/**
 * Fallback story generator when AI services are unavailable
 * Uses predefined templates instead of AI generation
 */
function generateFallbackStory(params: StoryParams): GeneratedStory {
  const { characters, theme, ageGroup, childName, textOnly } = params;
  
  // Create a title based on theme and characters
  const title = `A Aventura de ${characters[0]} e ${characters.length > 1 ? characters[1] : 'Amigos'}: ${theme}`;
  
  // Create chapter titles
  const chapterTitles = [
    `O Início da Jornada`,
    `Descobrindo ${theme}`,
    `Um Novo Desafio`,
    `Superando Obstáculos`,
    `A Grande Descoberta`
  ];
  
  // Basic content templates based on age group
  let contentStyle = '';
  let paragraphLength = 2;
  
  switch (ageGroup) {
    case '3-5':
      contentStyle = 'simples e curta';
      paragraphLength = 2;
      break;
    case '6-8':
      contentStyle = 'divertida e educativa';
      paragraphLength = 3;
      break;
    case '9-12':
      contentStyle = 'aventureira e interessante';
      paragraphLength = 4;
      break;
    default:
      contentStyle = 'educativa';
      paragraphLength = 3;
  }
  
  // Create basic chapter contents
  const chapters: Chapter[] = chapterTitles.map((chapterTitle, i) => {
    // Basic content template for each chapter - this is just a simple template
    // that will only be used when actual AI generation fails
    let content = '';
    
    // First paragraph - introduction to the characters
    if (i === 0) {
      content += `Era uma vez, ${characters.join(' e ')} que estavam explorando o mundo de ${theme}. `;
      content += childName ? `${childName} assistia com entusiasmo enquanto ` : '';
      content += `${characters[0]} liderava o caminho com muita curiosidade.\n\n`;
      
      content += `"Vamos descobrir o que há pela frente!", disse ${characters[0]} com entusiasmo. `;
      content += characters.length > 1 ? `"Estou com você!", respondeu ${characters[1]}.\n\n` : '\n\n';
      
      content += `E assim começou uma grande aventura ${contentStyle}. Os amigos caminhavam juntos, `;
      content += `observando cada detalhe daquele lugar incrível.`;
    } 
    // Discovery chapter
    else if (i === 1) {
      content += `Enquanto caminhavam, ${characters[0]} apontou para algo interessante. `;
      content += `"Olhem! É um ${theme} incrível!" `;
      content += `Todos ficaram maravilhados com a descoberta.\n\n`;
      
      content += `"Nunca vi algo tão legal", disse ${characters.length > 1 ? characters[1] : characters[0]}. `;
      content += `Havia muito a aprender sobre ${theme}, e eles estavam animados para explorar mais.\n\n`;
      
      content += `Cada passo revelava novas surpresas e lições sobre ${theme}.`;
    }
    // Challenge chapter
    else if (i === 2) {
      content += `De repente, os amigos encontraram um grande desafio: `;
      content += `havia um rio que precisavam atravessar para continuar explorando ${theme}.\n\n`;
      
      content += `"Como vamos passar?", perguntou ${characters[0]}. `;
      content += `Todos pensaram juntos em uma solução. Era hora de usar a criatividade!\n\n`;
      
      content += `Depois de pensar um pouco, eles decidiram construir uma pequena ponte usando `;
      content += `galhos e folhas que encontraram por perto. Trabalhando juntos, eles podiam superar qualquer obstáculo.`;
    }
    // Problem solving chapter
    else if (i === 3) {
      content += `Trabalhando juntos, ${characters.join(' e ')} construíram a ponte passo a passo. `;
      content += `Cada um contribuiu de uma forma especial.\n\n`;
      
      content += `"Se ajudarmos uns aos outros, conseguimos resolver qualquer problema!", disse ${characters[0]}. `;
      content += `A ponte ficou firme e segura, perfeita para atravessar o rio.\n\n`;
      
      content += `Depois de atravessar, eles continuaram sua jornada, mais confiantes do que nunca. `;
      content += `A amizade e trabalho em equipe estavam tornando tudo possível.`;
    }
    // Resolution chapter
    else if (i === 4) {
      content += `Finalmente, após muitas aventuras, ${characters.join(' e ')} chegaram a um lindo vale. `;
      content += `Era o coração de ${theme}, cheio de cores e maravilhas.\n\n`;
      
      content += `"Conseguimos!", comemorou ${characters[0]}. "Nossa jornada foi incrível!" `;
      content += `Todos concordaram que aprenderam muito sobre amizade, coragem e ${theme}.\n\n`;
      
      content += `Ao voltarem para casa, carregavam não apenas as memórias da aventura, mas também lições valiosas: `;
      content += `juntos, podemos superar desafios e fazer descobertas incríveis. ${theme} era agora algo especial para todos eles.`;
    }
    
    // Generate an appropriate image prompt (if not text-only mode)
    const imagePrompt = textOnly ? undefined : 
      `Ilustração para o capítulo "${chapterTitle}" mostrando ${characters.join(' e ')} ${
        i === 0 ? 'iniciando sua jornada em um cenário colorido' : 
        i === 1 ? `descobrindo um ${theme.toLowerCase()} incrível` :
        i === 2 ? 'enfrentando um desafio (um rio) juntos' :
        i === 3 ? 'trabalhando juntos para construir uma ponte' :
        'celebrando sua jornada em um lindo vale colorido'
      }. Estilo cartoon colorido apropriado para crianças de ${ageGroup} anos.`;
    
    return {
      title: chapterTitle,
      content,
      imagePrompt
    };
  });
  
  // Combine all chapter contents
  const fullContent = chapters.map(c => `## ${c.title}\n\n${c.content}`).join('\n\n');
  const contentWithTitle = `# ${title}\n\nUma história sobre ${characters.join(', ')} explorando o tema de ${theme}.\n\n${fullContent}`;
  
  return {
    title,
    content: contentWithTitle,
    summary: `Uma história sobre ${characters.join(', ')} explorando o tema de ${theme}.`,
    readingTime: 5,
    chapters
  };
}

// Função para obter o status de todos os provedores de IA
export function getAIProvidersStatus() {
  return aiProviderManager.getProvidersStatus();
}