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
export interface GenerateImageOptions {
  style?: "cartoon" | "watercolor" | "pencil" | "digital";
  mood?: "happy" | "adventure" | "calm" | "exciting";
  backgroundColor?: string;
  characterStyle?: "cute" | "funny" | "heroic";
  ageGroup?: "3-5" | "6-8" | "9-12";
}

// Banco de ilustrações de backup para casos de falha
const BACKUP_ILLUSTRATIONS = {
  "default": "https://cdn.pixabay.com/photo/2016/04/15/20/28/cartoon-1332054_960_720.png",
  "character": "https://cdn.pixabay.com/photo/2019/05/26/14/40/cartoon-4230855_960_720.png",
  "forest": "https://cdn.pixabay.com/photo/2017/08/10/02/05/tiles-sprites-2617112_960_720.png",
  "adventure": "https://cdn.pixabay.com/photo/2019/03/17/12/04/cartoon-4060188_960_720.png",
  "animals": "https://cdn.pixabay.com/photo/2023/04/17/21/11/animals-7934300_960_720.png"
};

// Estilo de ilustração baseado na faixa etária
function getIllustrationStyleByAge(ageGroup?: string): string {
  switch (ageGroup) {
    case "3-5":
      return "estilo muito simples e colorido, formas geométricas básicas, personagens muito grandes e expressivos com cabeças grandes, ABSOLUTAMENTE sem detalhes complexos, cores primárias vibrantes, contornos grossos e bem definidos";
    case "6-8":
      return "estilo cartunizado colorido com personagens expressivos com proporções exageradas tipo desenho animado, cenários mais detalhados mas simplificados, cores vibrantes, linhas claras e definidas, expressões faciais exageradas";
    case "9-12":
      return "estilo cartunizado com mais detalhes, personagens com proporções cartunescas (cabeças maiores, feições expressivas), cenários mais elaborados mas ainda estilizados, paleta de cores ricas, linhas claras e contornos definidos";
    default:
      return "estilo cartunizado colorido adequado para crianças, com linhas claras e definidas, cores vibrantes, personagens expressivos com proporções exageradas";
  }
}

export async function generateImage(prompt: string, options: GenerateImageOptions = {}): Promise<GeneratedImage> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Chave da API OpenAI não configurada. Não é possível gerar imagens.");
  }
  
  // Definir estilos baseados nas opções
  const style = options.style || "cartoon";
  const mood = options.mood || "happy";
  const ageStyle = getIllustrationStyleByAge(options.ageGroup);
  
  // Construir o prompt final com instruções muito mais rigorosas para garantir estilo cartoon
  let enhancedPrompt = "IMPORTANTE: Esta é uma ilustração para um LIVRO INFANTIL. ";
  enhancedPrompt += "Crie uma ILUSTRAÇÃO ESTILO CARTOON com as seguintes características OBRIGATÓRIAS:\n\n";
  
  // Adicionar o prompt original
  enhancedPrompt += prompt + "\n\n";
  
  // Adicionar instruções detalhadas e rigorosas
  enhancedPrompt += `ESTILO OBRIGATÓRIO: Desenho animado infantil colorido, ${ageStyle}.\n`;
  enhancedPrompt += `MOOD/CLIMA: ${mood}.\n`;
  enhancedPrompt += "CARACTERÍSTICAS VISUAIS OBRIGATÓRIAS:\n";
  enhancedPrompt += "- Cores: Vibrantes, saturadas e alegres\n";
  enhancedPrompt += "- Linhas: Contornos grossos, pretos e bem definidos em todos os elementos\n";
  enhancedPrompt += "- Personagens: Olhos grandes e expressivos, proporções exageradas (cabeças maiores que o corpo)\n";
  enhancedPrompt += "- Visual geral: Simplificado, divertido, 100% apropriado para crianças\n";
  enhancedPrompt += "- Estilo de render: Flat colors (cores chapadas) com sombras simples\n\n";
  
  // Adicionar regras negativas explícitas com mais ênfase
  enhancedPrompt += "ABSOLUTAMENTE PROIBIDO (NUNCA INCLUA):\n";
  enhancedPrompt += "- Qualquer traço de fotorrealismo ou realismo nos personagens ou cenários\n";
  enhancedPrompt += "- Qualquer estilo de arte complexa, renderização 3D realista ou estilo de anime\n";
  enhancedPrompt += "- Imagens assustadoras, sombrias ou inapropriadas para crianças\n";
  enhancedPrompt += "- Texto ou letras dentro da imagem\n";
  enhancedPrompt += "- Elementos visuais complexos ou texturas detalhadas\n\n";
  
  // Adicionar instruções específicas por idade
  if (options.ageGroup === "3-5") {
    enhancedPrompt += "REGRAS ESPECIAIS PARA 3-5 ANOS:\n";
    enhancedPrompt += "- EXTREMAMENTE simplificado (como livros para bebês)\n";
    enhancedPrompt += "- Apenas cores primárias muito vibrantes\n";
    enhancedPrompt += "- Personagens MUITO fofinhos com cabeças MUITO grandes\n";
    enhancedPrompt += "- Cenários super simples com pouquíssimos elementos\n";
    enhancedPrompt += "- Expressões faciais super claras e básicas\n";
  } else if (options.ageGroup === "6-8") {
    enhancedPrompt += "REGRAS ESPECIAIS PARA 6-8 ANOS:\n";
    enhancedPrompt += "- Estilo como desenhos animados da Cartoon Network\n";
    enhancedPrompt += "- Personagens expressivos e dinâmicos\n";
    enhancedPrompt += "- Cenários coloridos mas não complexos\n";
  } else if (options.ageGroup === "9-12") {
    enhancedPrompt += "REGRAS ESPECIAIS PARA 9-12 ANOS:\n";
    enhancedPrompt += "- Mais detalhes, mas AINDA ASSIM estilo cartoon completo\n";
    enhancedPrompt += "- Cenas mais dinâmicas e aventureiras\n";
    enhancedPrompt += "- NUNCA usar estilo realista mesmo para esta idade\n";
  }
  
  // Referências específicas a estilos
  enhancedPrompt += "\nREFERÊNCIAS DE ESTILO: Desenhos animados como Gravity Falls, Hora de Aventura, O Incrível Mundo de Gumball, Turma da Mônica Jovem.";
  
  try {
    console.log("Gerando imagem aprimorada...");
    console.log("Prompt base:", prompt);
    console.log("Opções:", options);
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid" // Manter vivid para cores mais brilhantes
    });
    
    console.log("Imagem gerada com sucesso");
    const imageUrl = response.data[0].url || "";
    
    return { imageUrl };
  } catch (error: any) {
    console.error("Erro ao gerar imagem:", error);
    
    // Selecionar uma imagem de backup apropriada baseada no prompt
    let backupImage = BACKUP_ILLUSTRATIONS.default;
    
    if (prompt.toLowerCase().includes("floresta") || prompt.toLowerCase().includes("selva")) {
      backupImage = BACKUP_ILLUSTRATIONS.forest;
    } else if (prompt.toLowerCase().includes("aventura")) {
      backupImage = BACKUP_ILLUSTRATIONS.adventure;
    } else if (prompt.toLowerCase().includes("animal") || prompt.toLowerCase().includes("leão") || 
              prompt.toLowerCase().includes("tucano") || prompt.toLowerCase().includes("macaco")) {
      backupImage = BACKUP_ILLUSTRATIONS.animals;
    } else if (prompt.toLowerCase().includes("personagem") || prompt.toLowerCase().includes("character")) {
      backupImage = BACKUP_ILLUSTRATIONS.character;
    }
    
    // Log do erro com detalhes para depuração
    if (error.response?.status === 401) {
      console.error("Falha na autenticação com API OpenAI. Retornando imagem de backup.");
      return { imageUrl: backupImage, isBackup: true };
    } else if (error.response?.status === 429) {
      console.error("Limite de requisições da API OpenAI excedido. Retornando imagem de backup.");
      return { imageUrl: backupImage, isBackup: true };
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error("Erro de conexão. Retornando imagem de backup.");
      return { imageUrl: backupImage, isBackup: true };
    } else {
      console.error("Erro genérico. Retornando imagem de backup.");
      return { imageUrl: backupImage, isBackup: true };
    }
  }
}

// Função para gerar imagem de um personagem
export async function generateCharacterImage(character: string, options: GenerateImageOptions = {}): Promise<GeneratedImage> {
  const characterStyle = options.characterStyle || "cute";
  const backgroundColor = options.backgroundColor || "claro e sólido (sem gradientes)";
  const ageGroup = options.ageGroup || "6-8";
  
  // Adaptar características baseadas no tipo de personagem
  let characterType = "";
  let characterTraits = "";
  let characterColors = "";
  
  if (character.toLowerCase().includes("leão")) {
    characterType = "leão";
    characterTraits = "juba colorida e volumosa, focinho arredondado, patas grandes";
    characterColors = "tons de amarelo, laranja e marrom";
  } else if (character.toLowerCase().includes("tucano")) {
    characterType = "tucano";
    characterTraits = "bico grande e colorido, asas coloridas, olhos expressivos";
    characterColors = "preto com detalhes coloridos no bico e peito";
  } else if (character.toLowerCase().includes("macaco")) {
    characterType = "macaco";
    characterTraits = "cauda longa e enrolada, orelhas redondas, expressão brincalhona";
    characterColors = "marrom ou castanho com detalhes em bege";
  } else if (character.toLowerCase().includes("jaguatirica") || character.toLowerCase().includes("onça")) {
    characterType = "felino pintado";
    characterTraits = "manchas no pelo, orelhas pontudas, cauda longa";
    characterColors = "amarelo ou dourado com manchas pretas simplificadas";
  } else if (character.toLowerCase().includes("cobra") || character.toLowerCase().includes("serpente")) {
    characterType = "cobra";
    characterTraits = "corpo ondulado, escamas estilizadas, olhos grandes e expressivos";
    characterColors = "verde vibrante com detalhes coloridos";
  } else {
    characterType = "animal da floresta";
    characterTraits = "feições amigáveis, expressão simpática, postura ereta";
    characterColors = "cores vibrantes que combinam com o personagem";
  }
  
  // Construir o prompt especializado para personagem de desenho animado
  let characterPrompt = `
    Quero uma ilustração de personagem para livro infantil do personagem "${character}", que é um ${characterType}.
    
    ESPECIFICAÇÕES VISUAIS OBRIGATÓRIAS:
    - Estilo: Cartoon infantil com contornos grossos e pretos bem definidos (estilo "cel shading")
    - Pose: Corpo inteiro, postura expressiva e dinâmica
    - Visual: ${characterStyle}, ${characterTraits}, extremamente fofo e simpático
    - Cores: ${characterColors}, cores vibrantes e saturadas
    - Fundo: ${backgroundColor}, minimalista para destacar o personagem
    - Proporções: Cabeça grande (estilo cartoon), olhos muito expressivos e grandes
    
    O personagem deve ser desenhado no estilo de desenho animado para crianças da faixa etária ${ageGroup} anos.
    Deve ser EXTREMAMENTE cartunizado - nada de realismo ou fotorrealismo ou arte complexa.
    Use um estilo de desenho BIDIMENSIONAL com cores planas, sem sombreamento complexo.
    Certifique-se que o personagem tenha um rosto MUITO expressivo e amigável.
  `;
  
  return generateImage(characterPrompt, {
    ...options,
    style: "cartoon",
    mood: "happy"
  });
}

// Função para gerar imagem de um capítulo da história
export async function generateChapterImage(
  chapterTitle: string, 
  chapterContent: string,
  characters: string[] = [],
  options: GenerateImageOptions = {}
): Promise<GeneratedImage> {
  // Extrair os elementos principais do capítulo para criar um prompt mais detalhado
  const contentSummary = chapterContent.length > 300 
    ? chapterContent.substring(0, 300) 
    : chapterContent;
  
  // Definir estilo baseado na idade
  const ageGroup = options.ageGroup || "6-8";
  let visualStyle = "";
  
  switch (ageGroup) {
    case "3-5":
      visualStyle = "EXTREMAMENTE simples e colorido, com pouquíssimos elementos e fundo muito básico";
      break;
    case "6-8":
      visualStyle = "colorido e cartunizado, tipo desenho animado da Cartoon Network";
      break;
    case "9-12":
      visualStyle = "cartunizado com mais detalhes, mas ainda puramente cartoon, estilo Adventure Time";
      break;
    default:
      visualStyle = "cartunizado e colorido, perfeito para livros infantis";
  }
  
  // Criar um prompt para análise do capítulo
  const analysisPrompt = `
    Título do capítulo: "${chapterTitle}"
    Conteúdo: "${contentSummary}"
    
    Baseado no título e conteúdo acima, qual seria a MELHOR cena para ilustrar em um livro infantil em estilo CARTOON?
    Escolha o momento mais visualmente interessante e memorável do capítulo para crianças de ${ageGroup} anos.
    Personagens envolvidos: ${characters.join(", ")}
    
    Responda no formato JSON com os seguintes campos OBRIGATÓRIOS:
    {
      "scene": "descrição clara e detalhada da cena principal para ilustrar",
      "characters": "quais personagens aparecem na cena e como estão posicionados",
      "setting": "local exato onde a cena acontece com 2-3 elementos visuais importantes",
      "action": "o que está acontecendo na cena - qual ação específica mostrar",
      "mood": "clima/emoção da cena (alegre, tenso, misterioso, etc)",
      "colors": "paleta de cores sugerida para esta ilustração",
      "focus": "em qual elemento a ilustração deve focar principalmente"
    }
  `;
  
  try {
    // Analisar o capítulo para gerar um prompt melhor
    const analysis = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: analysisPrompt }],
      response_format: { type: "json_object" }
    });
    
    let sceneAnalysis;
    try {
      sceneAnalysis = JSON.parse(analysis.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Erro ao analisar resposta JSON:", error);
      sceneAnalysis = {
        scene: chapterTitle,
        characters: characters.join(", "),
        setting: "cena da história",
        action: "momento importante",
        mood: "interessante",
        colors: "vibrantes e coloridas",
        focus: "nos personagens principais"
      };
    }
    
    // Criar um prompt MUITO mais detalhado baseado na análise para garantir estilo cartoon
    const detailedPrompt = `
      ILUSTRAÇÃO DE LIVRO INFANTIL para o capítulo "${chapterTitle}", em estilo 100% CARTOON, ${visualStyle}.
      
      CENA PRINCIPAL: ${sceneAnalysis.scene}
      
      ELEMENTOS ESSENCIAIS:
      • Personagens: ${sceneAnalysis.characters}
      • Cenário: ${sceneAnalysis.setting}
      • Ação: ${sceneAnalysis.action}
      • Clima emocional: ${sceneAnalysis.mood}
      • Foco principal: ${sceneAnalysis.focus}
      • Cores: ${sceneAnalysis.colors}
      
      ESTILO VISUAL OBRIGATÓRIO:
      • Traços: Contornos pretos e GROSSOS em TODOS os elementos
      • Cores: Saturadas, vibrantes e chapadas (flat colors)
      • Personagens: Proporções exageradas com cabeças grandes e olhos expressivos
      • Composição: Simples, clara e centralizada na ação principal
      • Perspectiva: Simplificada, estilo 2D, sem perspectiva complexa
      • Sombras: Mínimas e simplificadas
      
      ABSOLUTAMENTE PROIBIDO:
      • Realismo de qualquer tipo
      • Renderização 3D
      • Estilo anime ou mangá
      • Texturas complexas
      • Elementos assustadores
      • Texto dentro da imagem
    `;
    
    return generateImage(detailedPrompt, {
      ...options,
      style: "cartoon",
      mood: options.mood || sceneAnalysis.mood.toLowerCase().includes("feliz") ? "happy" : 
                          sceneAnalysis.mood.toLowerCase().includes("aventura") ? "adventure" : "calm"
    });
  } catch (error) {
    console.error("Erro na análise do capítulo:", error);
    // Fallback para um prompt mais simples em caso de erro
    const simplePrompt = `
      ILUSTRAÇÃO DE LIVRO INFANTIL 100% CARTOON para o capítulo "${chapterTitle}".
      
      Desenho infantil colorido mostrando ${characters.join(", ")} em uma cena importante do capítulo.
      
      OBRIGATÓRIO: Estilo cartoon com contornos grossos e pretos, cores vibrantes, personagens com olhos grandes
      e expressivos, sem QUALQUER realismo, completamente cartunizado no estilo de desenhos animados para crianças
      da faixa etária ${ageGroup} anos.
    `;
    return generateImage(simplePrompt, {
      ...options,
      style: "cartoon", 
      mood: "happy"
    });
  }
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
