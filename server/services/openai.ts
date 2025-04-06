import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "your-api-key" });

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
    
    Formate a saída como um objeto JSON com os seguintes campos:
    - title: Título atraente para a história
    - content: O texto completo da história
    - summary: Um resumo curto da história (1-2 frases)
    - readingTime: Tempo estimado de leitura em minutos (número)
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      title: result.title || "História sem título",
      content: result.content || "Era uma vez...",
      summary: result.summary || "Uma aventura mágica",
      readingTime: result.readingTime || 5
    };
  } catch (error) {
    console.error("Erro ao gerar história:", error);
    throw new Error("Não foi possível gerar a história. Por favor, tente novamente.");
  }
}

// Text to speech for story narration
export async function generateAudioFromText(text: string): Promise<string> {
  try {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova", // A friendly, warm voice
      input: text,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.toString('base64');
  } catch (error) {
    console.error("Erro ao gerar áudio:", error);
    throw new Error("Não foi possível gerar o áudio para narração.");
  }
}
