import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
if (!process.env.OPENAI_API_KEY) {
  console.error("AVISO CRÍTICO: OPENAI_API_KEY não está configurada! A geração de histórias não funcionará.");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface StoryParams {
  characters: string[];
  theme: string;
  ageGroup: string;
  childName?: string;
}

export interface GeneratedStory {
  title: string;
  content: string;
  summary: string;
  readingTime: number;
  chapters: Chapter[];
}

export interface Chapter {
  title: string;
  content: string;
  imagePrompt?: string;
  imageUrl?: string;
}

export interface GeneratedImage {
  imageUrl: string;
  base64Image?: string;
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
    
    chapters.push({
      title,
      content: chapterContent,
      imagePrompt: `Desenho infantil colorido e cartunizado ilustrando "${title}" - um desenho simples e divertido para crianças, estilo ilustração de livro infantil` 
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
        
        chapters.push({
          title,
          content: chapterContent,
          imagePrompt: `Desenho infantil colorido e cartunizado ilustrando "${title}" - um desenho simples e divertido para crianças, estilo ilustração de livro infantil`
        });
      }
    } else {
      // Se houver poucos parágrafos, criamos um único capítulo
      chapters.push({
        title: "A História",
        content,
        imagePrompt: "Desenho infantil colorido e cartunizado ilustrando a história - um desenho simples e divertido para crianças, estilo ilustração de livro infantil"
      });
    }
  }
  
  return chapters;
}

// Função para gerar imagem usando DALL-E
export async function generateImage(prompt: string): Promise<GeneratedImage> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Chave da API OpenAI não configurada. Não é possível gerar imagens.");
  }
  
  try {
    console.log("Gerando imagem...");
    console.log("Prompt:", prompt);
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt + " (desenho infantil, ilustração de livro para crianças, colorido, cartunizado, NÃO realista)",
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });
    
    console.log("Imagem gerada com sucesso");
    const imageUrl = response.data[0].url || "";
    
    return { imageUrl };
  } catch (error: any) {
    console.error("Erro ao gerar imagem:", error);
    
    if (error.response?.status === 401) {
      throw new Error("Falha na autenticação com API OpenAI. Verifique a chave da API.");
    } else if (error.response?.status === 429) {
      throw new Error("Limite de requisições da API OpenAI excedido. Tente novamente mais tarde.");
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error("Erro de conexão com a API OpenAI. Verifique sua conexão à internet.");
    } else {
      throw new Error("Não foi possível gerar a imagem. Por favor, tente novamente.");
    }
  }
}

// Função para gerar imagem de um personagem
export async function generateCharacterImage(character: string): Promise<GeneratedImage> {
  const prompt = `Desenho infantil colorido de ${character} - estilo cartunizado, divertido e amigável para crianças. Personagem em fundo branco, visual simpático e expressivo.`;
  return generateImage(prompt);
}

export async function generateStory(params: StoryParams): Promise<GeneratedStory> {
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

  const prompt = `
    Você é um autor de histórias infantis em português brasileiro.
    ${ageAppropriateInstructions}
    
    Crie uma história ${storyLength} sobre o tema "${theme}" com os seguintes personagens: ${charactersList}.
    ${namePersonalization}
    
    A história deve ser educativa, envolvente e apropriada para a faixa etária. Use vocabulário de nível ${vocabularyLevel}.
    Não use palavras em inglês ou outras línguas. Apenas português brasileiro.
    Não use conteúdo assustador, violento ou inadequado para crianças.
    
    IMPORTANTE: Divida a história em 3-5 capítulos curtos. Cada capítulo deve ter um título próprio e começar com a formatação "## Nome do Capítulo" (usando a marcação markdown).
    
    Formate a saída como um objeto JSON com os seguintes campos:
    - title: Título atraente para a história
    - content: O texto completo da história, incluindo os títulos dos capítulos com o formato markdown (## Nome do Capítulo)
    - summary: Um resumo curto da história (1-2 frases)
    - readingTime: Tempo estimado de leitura em minutos (número)
  `;

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Chave da API OpenAI não configurada. Não é possível gerar histórias.");
  }

  try {
    console.log(`Gerando história com tema "${theme}" para faixa etária ${ageGroup}...`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    if (!response.choices || response.choices.length === 0 || !response.choices[0].message.content) {
      console.error("Resposta da API OpenAI não contém conteúdo:", response);
      throw new Error("Resposta da API OpenAI inválida");
    }

    let result;
    try {
      result = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      console.error("Erro ao analisar JSON da resposta:", response.choices[0].message.content);
      throw new Error("Formato de resposta inválido da API");
    }
    
    if (!result.title || !result.content) {
      console.error("Resposta da API não contém campos obrigatórios:", result);
      throw new Error("Resposta incompleta da API");
    }
    
    console.log(`História gerada com sucesso: "${result.title}"`);
    
    // Extrair capítulos da história
    const chapters = extractChapters(result.content);
    console.log(`Identificados ${chapters.length} capítulos na história`);
    
    return {
      title: result.title,
      content: result.content,
      summary: result.summary || `Uma história sobre ${theme}`,
      readingTime: result.readingTime || Math.ceil(result.content.length / 1000),
      chapters: chapters
    };
  } catch (error: any) {
    console.error("Erro ao gerar história:", error);
    
    // Mensagens de erro mais específicas baseadas no tipo de erro
    if (error.response?.status === 401) {
      throw new Error("Falha na autenticação com API OpenAI. Verifique a chave da API.");
    } else if (error.response?.status === 429) {
      throw new Error("Limite de requisições da API OpenAI excedido. Tente novamente mais tarde.");
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error("Erro de conexão com a API OpenAI. Verifique sua conexão à internet.");
    } else if (error.message.includes("JSON")) {
      throw new Error("Erro no formato da resposta da API. Tente novamente.");
    } else {
      throw new Error("Não foi possível gerar a história. Por favor, tente novamente.");
    }
  }
}

// Text to speech for story narration
export async function generateAudioFromText(text: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Chave da API OpenAI não configurada. Não é possível gerar áudio.");
  }
  
  if (!text || text.trim().length === 0) {
    throw new Error("Texto vazio. Não é possível gerar áudio.");
  }
  
  // Limitar o tamanho do texto para evitar problemas com a API
  const maxLength = 4000;
  const textForAudio = text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  
  try {
    console.log("Gerando áudio para narração...");
    
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova", // A friendly, warm voice
      input: textForAudio,
    });

    console.log("Áudio gerado com sucesso");
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.toString('base64');
  } catch (error: any) {
    console.error("Erro ao gerar áudio:", error);
    
    // Mensagens de erro mais específicas
    if (error.response?.status === 401) {
      throw new Error("Falha na autenticação com API OpenAI. Verifique a chave da API.");
    } else if (error.response?.status === 429) {
      throw new Error("Limite de requisições da API OpenAI excedido. Tente novamente mais tarde.");
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error("Erro de conexão com a API OpenAI. Verifique sua conexão à internet.");
    } else {
      throw new Error("Não foi possível gerar o áudio para narração. Por favor, tente novamente.");
    }
  }
}
