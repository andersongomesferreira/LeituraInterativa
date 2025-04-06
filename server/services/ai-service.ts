// Serviço de IA centralizado que utiliza o gerenciador de provedores
import aiProviderManager, { 
  TextGenerationParams, 
  ImageGenerationParams
} from "./ai-providers";

// Definir tipos para histórias e IA

// Parâmetros para geração de história
export interface StoryParams {
  characters: string[];
  theme: string;
  ageGroup: string;
  childName?: string;
  complexityLevel?: 'low' | 'medium' | 'high';
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
  const { characters, theme, ageGroup, childName } = params;
  
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

// Função para gerar uma imagem utilizando o provedor mais adequado
export async function generateImage(
  prompt: string, 
  options: {
    style?: "cartoon" | "watercolor" | "pencil" | "digital";
    mood?: "happy" | "adventure" | "calm" | "exciting";
    backgroundColor?: string;
    characterStyle?: "cute" | "funny" | "heroic";
    ageGroup?: "3-5" | "6-8" | "9-12";
  } = {},
  userTier: string = "free"
): Promise<GeneratedImage> {
  try {
    const imageParams: ImageGenerationParams = {
      prompt,
      style: options.style || "cartoon",
      mood: options.mood || "happy",
      ageGroup: options.ageGroup
    };
    
    // Usar nosso gerenciador de provedores para escolher o melhor provedor
    const result = await aiProviderManager.generateImage(imageParams, userTier);
    
    return {
      imageUrl: result.imageUrl,
      base64Image: result.base64Image,
      isBackup: result.isBackup
    };
  } catch (error: any) {
    console.error("Error generating image:", error);
    
    // Usar imagem de backup em caso de erro
    return {
      imageUrl: "https://cdn.pixabay.com/photo/2016/04/15/20/28/cartoon-1332054_960_720.png",
      isBackup: true
    };
  }
}

// Função para gerar imagem para um personagem
export async function generateCharacterImage(
  character: string, 
  options: {
    style?: "cartoon" | "watercolor" | "pencil" | "digital";
    mood?: "happy" | "adventure" | "calm" | "exciting";
    backgroundColor?: string;
    characterStyle?: "cute" | "funny" | "heroic";
    ageGroup?: "3-5" | "6-8" | "9-12";
  } = {},
  userTier: string = "free"
): Promise<GeneratedImage> {
  // Construir um prompt especializado para personagem de desenho animado
  const characterType = 
    character.toLowerCase().includes("leão") ? "leão" :
    character.toLowerCase().includes("tucano") ? "tucano" :
    character.toLowerCase().includes("macaco") ? "macaco" :
    character.toLowerCase().includes("jaguatirica") || character.toLowerCase().includes("onça") ? "felino pintado" :
    character.toLowerCase().includes("cobra") || character.toLowerCase().includes("serpente") ? "cobra" :
    "animal da floresta";
    
  const characterPrompt = `
    Quero uma ilustração de personagem para livro infantil do personagem "${character}", que é um ${characterType}.
    
    ESPECIFICAÇÕES VISUAIS OBRIGATÓRIAS:
    - Estilo: Cartoon infantil com contornos grossos e pretos bem definidos (estilo "cel shading")
    - Pose: Corpo inteiro, postura expressiva e dinâmica
    - Visual: ${options.characterStyle || "cute"}, extremamente fofo e simpático
    - Cores: cores vibrantes e saturadas
    - Fundo: ${options.backgroundColor || "claro e sólido (sem gradientes)"}, minimalista para destacar o personagem
    - Proporções: Cabeça grande (estilo cartoon), olhos muito expressivos e grandes
    
    O personagem deve ser desenhado no estilo de desenho animado para crianças da faixa etária ${options.ageGroup || "6-8"} anos.
    Deve ser EXTREMAMENTE cartunizado - nada de realismo ou fotorrealismo ou arte complexa.
    Use um estilo de desenho BIDIMENSIONAL com cores planas, sem sombreamento complexo.
    Certifique-se que o personagem tenha um rosto MUITO expressivo e amigável.
  `;
  
  return generateImage(characterPrompt, {
    ...options,
    style: "cartoon",
    mood: "happy"
  }, userTier);
}

// Função para gerar imagem para um capítulo específico
export async function generateChapterImage(
  chapterTitle: string, 
  chapterContent: string,
  characters: string[] = [],
  options: {
    style?: "cartoon" | "watercolor" | "pencil" | "digital";
    mood?: "happy" | "adventure" | "calm" | "exciting";
    backgroundColor?: string;
    characterStyle?: "cute" | "funny" | "heroic";
    ageGroup?: "3-5" | "6-8" | "9-12";
    storyId?: number; // ID da história para consistência
    chapterId?: number; // ID/número do capítulo para progressão
    characterDescriptions?: any[]; // Descrições detalhadas de personagens
  } = {},
  userTier: string = "free"
): Promise<GeneratedImage> {
  // Extrair elementos essenciais da história para incluir apenas coisas relevantes
  // Usamos um conteúdo mais curto para manter a ilustração mais focada
  const contentSummary = chapterContent.length > 200 
    ? chapterContent.substring(0, 200) 
    : chapterContent;
  
  // Extrair principais elementos do conteúdo para criar palavras-chave
  const keyElements = extractKeyElements(chapterContent, chapterTitle);
  
  // Criar uma lista de personagens para incluir na ilustração
  const charactersList = characters.length > 0 
    ? `Personagens principais na cena: ${characters.join(", ")}.` 
    : "";
  
  // Verificar se temos descrições de personagens detalhadas
  let characterDescriptions = '';
  
  if (options.characterDescriptions && options.characterDescriptions.length > 0) {
    // Criar uma seção com descrições detalhadas dos personagens para consistência visual
    const characterDetailsArray = options.characterDescriptions.map(char => {
      let details = `- ${char.name}: ${char.appearance || 'Personagem da história'}`;
      
      if (char.visualAttributes) {
        if (char.visualAttributes.colors && char.visualAttributes.colors.length > 0) {
          details += `\n    Cores principais: ${char.visualAttributes.colors.join(', ')}`;
        }
        if (char.visualAttributes.clothing) {
          details += `\n    Vestimenta: ${char.visualAttributes.clothing}`;
        }
        if (char.visualAttributes.distinguishingFeatures && char.visualAttributes.distinguishingFeatures.length > 0) {
          details += `\n    Características distintas: ${char.visualAttributes.distinguishingFeatures.join(', ')}`;
        }
      }
      
      return details;
    });
    
    characterDescriptions = `
    DESCRIÇÕES DETALHADAS DOS PERSONAGENS (MANTENHA CONSISTÊNCIA VISUAL COM ESTAS CARACTERÍSTICAS):
    ${characterDetailsArray.join('\n')}
    `;
  }
  
  // Adicionar mensagem sobre progressão da história se for um capítulo específico
  let chapterSequenceInfo = '';
  if (options.chapterId !== undefined) {
    chapterSequenceInfo = `
    OBSERVAÇÃO SOBRE SEQUÊNCIA DA HISTÓRIA:
    - Este é o capítulo ${options.chapterId} da história. 
    - Mantenha a mesma aparência dos personagens e estilo visual de ilustrações anteriores.
    `;
  }

  // Prompt mais estruturado para limitar elementos da cena e garantir relevância
  const scenePrompt = `
    Ilustração de cena para livro infantil do capítulo "${chapterTitle}".
    
    ELEMENTOS A INCLUIR (SOMENTE ESTES, NÃO ADICIONE OUTROS ELEMENTOS):
    - ${keyElements.join("\n    - ")}
    
    ${charactersList}
    ${characterDescriptions}
    ${chapterSequenceInfo}
    
    DIRETRIZES DE QUALIDADE E RELEVÂNCIA (EXTREMAMENTE IMPORTANTES):
    - A ilustração DEVE se concentrar EXCLUSIVAMENTE nos elementos listados acima.
    - É EXPRESSAMENTE PROIBIDO adicionar elementos não mencionados no texto do capítulo.
    - RESTRINGIR-SE aos elementos listados acima é essencial para a qualidade da ilustração.
    - A ilustração deve ser EXTREMAMENTE simples e clara, com poucos elementos.
    - Certifique-se que cada elemento da ilustração se relaciona diretamente ao texto.
    - A cena deve parecer coerente e conectada à história, sem elementos estranhos ou desconexos.
    - CONSISTÊNCIA VISUAL: Mantenha a mesma aparência dos personagens se aparecerem em múltiplos capítulos.
    
    ESPECIFICAÇÕES VISUAIS OBRIGATÓRIAS:
    - Estilo: Cartoon infantil com contornos grossos e pretos bem definidos
    - Visual: Extremamente simplificado, limpo, com poucos elementos visuais
    - Cores: Vibrantes, alegres, paleta limitada (max 5-6 cores)
    - Fundo: Minimalista, com poucos detalhes, apenas o essencial para a cena
    - Proporções: Personagens com cabeças grandes e expressões claras e simples
    
    REQUISITOS CRÍTICOS:
    - A ilustração deve ser para crianças da faixa etária ${options.ageGroup || "6-8"} anos.
    - Deve ser EXTREMAMENTE cartunizada - nada de realismo ou fotorrealismo.
    - Use um estilo de desenho BIDIMENSIONAL com cores planas, sem sombreamento complexo.
    - A CONSISTÊNCIA com os elementos da história é o fator mais importante para gerar uma boa ilustração.
  `;
  
  return generateImage(scenePrompt, {
    ...options,
    style: "cartoon",
    mood: options.mood || "adventure"
  }, userTier);
}

// Função auxiliar para extrair elementos-chave do texto do capítulo
function extractKeyElements(content: string, title: string): string[] {
  // Lista de palavras-chave que provavelmente são elementos visuais importantes
  const visualElementKeywords = [
    'animal', 'árvore', 'floresta', 'casa', 'castelo', 'rio', 'mar', 'montanha',
    'céu', 'lago', 'campo', 'cidade', 'rua', 'parque', 'escola', 'quarto', 'sala',
    'jardim', 'praia', 'caminho', 'ponte', 'porta', 'janela', 'sol', 'lua', 'estrela',
    'nuvem', 'chuva', 'neve', 'dia', 'noite', 'carro', 'bicicleta', 'barco', 'trem',
    'brinquedo', 'livro', 'bola', 'cadeira', 'mesa', 'cama', 'roupa', 'chapéu', 'comida',
    'fruta', 'água', 'fogo', 'planta', 'flor', 'grama',
    // Adicionados mais elementos comuns em histórias infantis brasileiras
    'mato', 'bicho', 'caverna', 'poço', 'rio', 'trilha', 'mochila', 'lanterna',
    'fazenda', 'sítio', 'chácara', 'quintal', 'balanço', 'escorregador', 'pipa',
    'bola', 'futebol', 'boneca', 'carrinho', 'lápis', 'desenho', 'pintura'
  ];
  
  // Normaliza o texto para facilitar a busca por correspondências
  const normalizedContent = content.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove acentos
  
  // Construir elementos-chave a partir do título
  const elements = [
    `Cena principal do capítulo "${title}"`
  ];
  
  // Adicionar personagens que parecem importantes
  const sentences = content.split(/[.!?]+/);
  const mentionedNames = new Set<string>();
  
  for (const sentence of sentences) {
    // Buscar nomes próprios (começam com maiúscula)
    const nameMatches = sentence.match(/\b[A-Z][a-zÀ-ÿ]+\b/g) || [];
    nameMatches.forEach(name => {
      // Filtrar possíveis falsos positivos (palavras no início da frase)
      if (sentence.trim().startsWith(name)) {
        // Verificar se a palavra antes ou depois é um indicador de nome próprio
        const prevNextWords = sentence.match(new RegExp(`(\\w+\\s+)?${name}(\\s+\\w+)?`, 'i'));
        if (prevNextWords && prevNextWords[0]) {
          const context = prevNextWords[0].toLowerCase();
          // Verificar se parece ser realmente um nome próprio
          if (!context.includes('quando') && !context.includes('porque') && 
              !context.includes('então') && !context.includes('depois')) {
            mentionedNames.add(name);
          }
        }
      } else {
        // Se não está no início da frase, é mais provável ser um nome próprio
        mentionedNames.add(name);
      }
    });
  }
  
  // Identificar elementos visuais específicos do texto
  const visualElements = new Set<string>();
  visualElementKeywords.forEach(keyword => {
    // Buscar a palavra-chave e incluir contexto (palavra anterior e posterior)
    const keywordRegex = new RegExp(`\\b(\\w+\\s+)?${keyword}(\\s+\\w+)?\\b`, 'gi');
    const matches = content.match(keywordRegex) || [];
    
    matches.forEach(match => {
      // Limpar e adicionar o elemento visual detectado
      const cleanElement = match.trim().toLowerCase();
      if (cleanElement.length > 3) { // Evitar elementos muito curtos
        visualElements.add(cleanElement);
      }
    });
  });
  
  // Extrair 3-4 frases curtas que descrevem a cena principal, com preferência para frases com elementos visuais
  let bestSentences = sentences
    .filter(s => s.length > 10 && s.length < 100) // Sentenças de tamanho médio
    .filter(s => {
      const normalizedS = s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return visualElementKeywords.some(keyword => normalizedS.includes(keyword.toLowerCase()));
    })
    .slice(0, 4);
  
  // Adicionar personagens e frases relevantes aos elementos
  if (mentionedNames.size > 0) {
    elements.push(`Personagens visíveis na cena: ${Array.from(mentionedNames).join(", ")}`);
  }
  
  // Adicionar elementos visuais específicos identificados
  if (visualElements.size > 0) {
    const topVisualElements = Array.from(visualElements).slice(0, 5);
    elements.push(`Elementos específicos da cena: ${topVisualElements.join(", ")}`);
  }
  
  // Adicionar frases descritivas relevantes
  bestSentences.forEach(sentence => {
    const cleanSentence = sentence.trim();
    if (cleanSentence) {
      // Verificar se a frase parece descrever uma cena visual
      if (visualElementKeywords.some(keyword => cleanSentence.toLowerCase().includes(keyword))) {
        elements.push(`Cena descrita: ${cleanSentence}`);
      }
    }
  });
  
  // Se não temos elementos suficientes, adicionar algumas frases do início do texto
  if (elements.length < 4) {
    const firstParagraph = content.split('\n')[0].trim();
    elements.push(`Cenário principal: ${firstParagraph.substring(0, 100)}`);
  }
  
  // Garantir que temos pelo menos 3 elementos
  while (elements.length < 3) {
    elements.push(`Elementos visuais simples baseados no título "${title}"`);
  }
  
  return elements;
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

// Função para obter o status de todos os provedores de IA
export function getAIProvidersStatus() {
  return aiProviderManager.getProvidersStatus();
}