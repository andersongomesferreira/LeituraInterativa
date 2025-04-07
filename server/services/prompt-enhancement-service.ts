import { CharacterDescription } from './ai-providers/types';
import logger from './logger';

/**
 * Serviço para aprimorar prompts visuais
 * Este serviço melhora a qualidade e relevância das imagens geradas
 * para histórias infantis, aplicando técnicas específicas para cada
 * faixa etária e estilo de ilustração
 */
class PromptEnhancementService {
  // Categorias de palavras-chave para extração de elementos da história
  private readonly keywordCategories = {
    objects: [
      'animal', 'árvore', 'floresta', 'casa', 'castelo', 'rio', 'mar', 'montanha',
      'céu', 'lago', 'campo', 'cidade', 'rua', 'parque', 'escola', 'quarto', 'sala',
      'jardim', 'praia', 'caminho', 'ponte', 'porta', 'janela', 'sol', 'lua', 'estrela',
      'nuvem', 'chuva', 'neve', 'carro', 'bicicleta', 'barco', 'trem', 'avião',
      'brinquedo', 'livro', 'bola', 'cadeira', 'mesa', 'cama', 'roupa', 'chapéu', 'comida',
      'fruta', 'água', 'fogo', 'planta', 'flor', 'grama', 'presente', 'bolo', 'doce',
    ],
    scenarios: [
      'fazenda', 'sítio', 'quintal', 'escorregador', 'praia', 'floresta', 'parque',
      'escola', 'sala de aula', 'biblioteca', 'casa', 'quarto', 'cozinha', 'jardim', 
      'loja', 'restaurante', 'circo', 'zoológico', 'aquário', 'museu', 'teatro',
      'cinema', 'hospital', 'aeroporto', 'estação', 'rua', 'praça', 'campo',
      'lago', 'rio', 'caverna', 'montanha', 'ilha', 'navio', 'submarino', 'foguete',
      'castelo', 'palácio', 'cabana', 'tenda', 'iglu', 'pirâmide', 'torre'
    ],
    actions: [
      'correr', 'pular', 'nadar', 'voar', 'dançar', 'cantar', 'gritar', 'sussurrar',
      'comer', 'beber', 'dormir', 'acordar', 'sonhar', 'pensar', 'esconder', 'procurar',
      'encontrar', 'olhar', 'ver', 'ouvir', 'tocar', 'sentir', 'cheirar', 'provar',
      'ler', 'escrever', 'desenhar', 'pintar', 'brincar', 'jogar', 'construir', 'imaginar',
      'ajudar', 'salvar', 'proteger', 'lutar', 'vencer', 'perder', 'cair', 'levantar'
    ],
    emotions: [
      'alegre', 'feliz', 'triste', 'assustado', 'surpreso', 'curioso', 'confuso',
      'animado', 'empolgado', 'calmo', 'tranquilo', 'preocupado', 'nervoso',
      'corajoso', 'tímido', 'orgulhoso', 'envergonhado', 'zangado', 'bravo',
      'amigável', 'carinhoso', 'amoroso', 'ciumento', 'aliviado', 'esperançoso'
    ],
    colors: [
      'vermelho', 'azul', 'verde', 'amarelo', 'laranja', 'roxo', 'rosa', 'marrom',
      'preto', 'branco', 'cinza', 'dourado', 'prateado', 'colorido', 'brilhante',
      'escuro', 'claro', 'transparente', 'arco-íris'
    ]
  };
  
  // Estilos visuais para cada faixa etária
  private readonly ageGroupStyles: Record<string, {
    complexity: string;
    outlines: string;
    colors: string;
    proportions: string;
    backgrounds: string;
  }> = {
    '3-5': {
      complexity: 'extremamente simples e clara, sem elementos distrativos',
      outlines: 'contornos grossos e bem definidos',
      colors: 'cores primárias vibrantes e contrastantes',
      proportions: 'formas arredondadas e exageradas, personagens com cabeças grandes',
      backgrounds: 'fundos simples com poucos elementos'
    },
    '6-8': {
      complexity: 'simples mas com alguns detalhes interessantes',
      outlines: 'contornos definidos mas não excessivamente grossos',
      colors: 'paleta de cores alegre e diversificada',
      proportions: 'proporções mais equilibradas, mas ainda estilizadas',
      backgrounds: 'cenários mais elaborados com elementos secundários visíveis'
    },
    '9-12': {
      complexity: 'moderadamente detalhada com elementos de profundidade',
      outlines: 'contornos mais refinados e variados',
      colors: 'esquemas de cores mais sofisticados com sombras sutis',
      proportions: 'proporções mais realistas, mas ainda estilizadas',
      backgrounds: 'cenários detalhados com elementos que complementam a narrativa'
    }
  };
  
  // Definições de estilos de ilustração
  private readonly illustrationStyles: Record<string, {
    description: string;
    inspirations: string;
  }> = {
    cartoon: {
      description: 'estilo de desenho animado infantil com contornos definidos e cores vibrantes',
      inspirations: 'como nas animações da Disney, Pixar ou DreamWorks para crianças'
    },
    watercolor: {
      description: 'estilo aquarela com pinceladas suaves e cores que se misturam delicadamente',
      inspirations: 'como nos livros ilustrados de Beatrix Potter ou Quentin Blake'
    },
    pencil: {
      description: 'ilustração a lápis com traços leves e texturas sutis',
      inspirations: 'como nos livros ilustrados de E.H. Shepard (Ursinho Pooh) ou Shaun Tan'
    },
    digital: {
      description: 'ilustração digital moderna com detalhes nítidos e efeitos de luz',
      inspirations: 'como nos livros infantis contemporâneos e jogos modernos para crianças'
    }
  };
  
  // Definições de humores para imagens
  private readonly moodMappings: Record<string, {
    atmosphere: string;
    palette: string;
    lighting: string;
    expressions: string;
  }> = {
    happy: {
      atmosphere: 'atmosfera alegre e ensolarada',
      palette: 'cores vibrantes e alegres',
      lighting: 'iluminação brilhante e acolhedora',
      expressions: 'personagens sorridentes e animados'
    },
    adventure: {
      atmosphere: 'sensação de aventura e descoberta',
      palette: 'cores ricas e contrastantes',
      lighting: 'iluminação dramática com sombras interessantes',
      expressions: 'personagens com expressões de surpresa e determinação'
    },
    calm: {
      atmosphere: 'ambiente tranquilo e relaxante',
      palette: 'tons suaves e harmoniosos',
      lighting: 'luz suave e difusa',
      expressions: 'personagens com expressões serenas e relaxadas'
    },
    exciting: {
      atmosphere: 'energia e movimento dinâmico',
      palette: 'cores intensas e vibrantes',
      lighting: 'iluminação enérgica com brilhos e destaques',
      expressions: 'personagens com expressões animadas e empolgadas'
    }
  };
  
  constructor() {
    logger.info('Prompt Enhancement Service initialized');
  }
  
  /**
   * Extrai os elementos-chave de um texto narrativo
   * 
   * @param text Texto do qual extrair elementos
   * @returns Array de elementos-chave extraídos do texto
   */
  extractKeyElements(text: string): {
    objects: string[];
    scenarios: string[];
    actions: string[];
    emotions: string[];
    colors: string[];
    characters: string[];
  } {
    // Normalizar texto para busca
    const normalizedText = text.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // Remover acentos
    
    const result = {
      objects: [] as string[],
      scenarios: [] as string[],
      actions: [] as string[],
      emotions: [] as string[],
      colors: [] as string[],
      characters: [] as string[]
    };
    
    // Extrair nomes de personagens (palavra com inicial maiúscula que não está no início da frase)
    const potentialCharacters = new Set<string>();
    const sentences = text.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      // Buscar nomes próprios (começam com maiúscula)
      const nameMatches = sentence.match(/\b[A-Z][a-zÀ-ÿ]{2,}\b/g) || [];
      
      nameMatches.forEach(name => {
        // Verificar se não é início de frase
        const trimmedSentence = sentence.trim();
        const isStartOfSentence = trimmedSentence.startsWith(name);
        
        // Adicionar à lista se não for início de frase ou se aparecer múltiplas vezes
        if (!isStartOfSentence || nameMatches.filter(n => n === name).length > 1) {
          potentialCharacters.add(name);
        }
      });
    }
    
    // Adicionar nomes encontrados à lista de personagens
    result.characters = Array.from(potentialCharacters);
    
    // Extrair elementos por categoria
    for (const [category, keywords] of Object.entries(this.keywordCategories)) {
      const found = new Set<string>();
      
      for (const keyword of keywords) {
        // Verificar se a palavra existe no texto
        const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (keywordRegex.test(normalizedText)) {
          found.add(keyword);
        }
      }
      
      // Adicionar elementos encontrados à categoria correspondente
      result[category as keyof typeof result] = Array.from(found);
    }
    
    return result;
  }
  
  /**
   * Aprimora um prompt para imagem de capítulo
   * 
   * @param params Parâmetros para aprimorar o prompt
   * @returns Prompt aprimorado para geração de imagem
   */
  enhanceChapterImagePrompt(params: {
    chapterTitle: string;
    chapterContent: string;
    characterDescriptions?: CharacterDescription[];
    ageGroup?: string;
    style?: string;
    mood?: string;
  }): string {
    const {
      chapterTitle,
      chapterContent,
      characterDescriptions = [],
      ageGroup = '6-8',
      style = 'cartoon',
      mood = 'happy'
    } = params;
    
    // Extrair elementos-chave do conteúdo
    const keyElements = this.extractKeyElements(chapterContent);
    
    // Identificar cenário principal
    const mainScenario = keyElements.scenarios.length > 0 
      ? keyElements.scenarios[0] 
      : 'ambiente apropriado para crianças';
    
    // Identificar objetos principais (limitar a 3)
    const mainObjects = keyElements.objects.slice(0, 3).join(', ');
    
    // Identificar cores mencionadas
    const colorTheme = keyElements.colors.length > 0 
      ? `cores predominantes: ${keyElements.colors.join(', ')}` 
      : '';
    
    // Definir estilo visual baseado na faixa etária
    const ageStyle = this.ageGroupStyles[ageGroup] || this.ageGroupStyles['6-8'];
    
    // Definir estilo de ilustração
    const illustrationStyle = this.illustrationStyles[style] || this.illustrationStyles.cartoon;
    
    // Definir humor/clima da imagem
    const moodStyle = this.moodMappings[mood] || this.moodMappings.happy;
    
    // Construir descrições dos personagens para o prompt
    let characterPrompt = '';
    
    if (characterDescriptions && characterDescriptions.length > 0) {
      // Limite a 3 personagens para não sobrecarregar o prompt
      const mainCharacters = characterDescriptions.slice(0, 3);
      
      characterPrompt = 'Personagens: ' + mainCharacters.map(char => {
        // Extrair atributos visuais importantes
        const colors = char.visualAttributes?.colors?.join(', ') || '';
        const clothing = char.visualAttributes?.clothing || '';
        const features = char.visualAttributes?.distinguishingFeatures?.join(', ') || '';
        
        // Construir descrição concisa do personagem
        return `${char.name} (${colors}${clothing ? ', usando ' + clothing : ''}${features ? ', com ' + features : ''})`;
      }).join('; ');
    } else if (keyElements.characters.length > 0) {
      // Usar nomes de personagens extraídos se não temos descrições detalhadas
      characterPrompt = 'Personagens: ' + keyElements.characters.slice(0, 3).join(', ');
    }
    
    // Construir prompt base melhorado
    const basePrompt = [
      `Ilustração para "${chapterTitle}".`,
      `Cena mostrando ${characterPrompt || 'personagens infantis apropriados'} em um ${mainScenario}.`,
      mainObjects ? `Incluindo ${mainObjects}.` : '',
      `${moodStyle.atmosphere} com ${moodStyle.expressions}.`,
      colorTheme
    ].filter(Boolean).join(' ');
    
    // Adicionar direção artística
    const artDirection = [
      `Estilo ${illustrationStyle.description}, ${illustrationStyle.inspirations}.`,
      `Composição com ${ageStyle.complexity},`,
      `${ageStyle.outlines},`,
      `${ageStyle.colors},`,
      `${ageStyle.proportions},`,
      `${ageStyle.backgrounds}.`,
      `${moodStyle.lighting} e ${moodStyle.palette}.`
    ].join(' ');
    
    // Prompt negativo para evitar problemas comuns
    const negativePrompt = this.generateNegativePrompt();
    
    // Montar prompt completo
    const enhancedPrompt = `${basePrompt} ${artDirection} História infantil apropriada para idade ${ageGroup}. Negativo: ${negativePrompt}`;
    
    logger.debug(`Prompt aprimorado gerado para capítulo "${chapterTitle}"`);
    
    return enhancedPrompt;
  }
  
  /**
   * Aprimora um prompt para imagem de personagem
   * 
   * @param params Parâmetros para aprimorar o prompt
   * @returns Prompt aprimorado para geração de imagem
   */
  enhanceCharacterImagePrompt(params: {
    characterName: string;
    characterDescription: string;
    ageGroup?: string;
    style?: string;
    mood?: string;
  }): string {
    const {
      characterName,
      characterDescription,
      ageGroup = '6-8',
      style = 'cartoon',
      mood = 'happy'
    } = params;
    
    // Extrair elementos-chave da descrição
    const keyElements = this.extractKeyElements(characterDescription);
    
    // Identificar cores mencionadas para o personagem
    const colorTheme = keyElements.colors.length > 0 
      ? `cores predominantes: ${keyElements.colors.join(', ')}` 
      : '';
    
    // Identificar emoções para a expressão do personagem
    const emotion = keyElements.emotions.length > 0 
      ? keyElements.emotions[0] 
      : 'feliz';
    
    // Definir estilo visual baseado na faixa etária
    const ageStyle = this.ageGroupStyles[ageGroup] || this.ageGroupStyles['6-8'];
    
    // Definir estilo de ilustração
    const illustrationStyle = this.illustrationStyles[style] || this.illustrationStyles.cartoon;
    
    // Definir humor/clima da imagem
    const moodStyle = this.moodMappings[mood] || this.moodMappings.happy;
    
    // Construir prompt base para o personagem
    const basePrompt = [
      `Retrato de personagem infantil chamado ${characterName}.`,
      `${characterDescription.substring(0, 200)}`,
      `Personagem com expressão ${emotion}.`,
      colorTheme,
      `Fundo simples e apropriado.`
    ].filter(Boolean).join(' ');
    
    // Adicionar direção artística
    const artDirection = [
      `Estilo ${illustrationStyle.description}, ${illustrationStyle.inspirations}.`,
      `Personagem com ${ageStyle.proportions},`,
      `${ageStyle.outlines},`,
      `${ageStyle.colors}.`,
      `${moodStyle.lighting} e ${moodStyle.palette}.`
    ].join(' ');
    
    // Prompt negativo para evitar problemas comuns
    const negativePrompt = this.generateNegativePrompt();
    
    // Montar prompt completo
    const enhancedPrompt = `${basePrompt} ${artDirection} História infantil apropriada para idade ${ageGroup}. Negativo: ${negativePrompt}`;
    
    logger.debug(`Prompt aprimorado gerado para personagem "${characterName}"`);
    
    return enhancedPrompt;
  }
  
  /**
   * Aprimora um prompt para imagem de cena específica da história
   * 
   * @param params Parâmetros para aprimorar o prompt
   * @returns Prompt aprimorado para geração de imagem
   */
  enhanceSceneImagePrompt(params: {
    sceneDescription: string;
    characterDescriptions?: CharacterDescription[];
    ageGroup?: string;
    style?: string;
    mood?: string;
  }): string {
    const {
      sceneDescription,
      characterDescriptions = [],
      ageGroup = '6-8',
      style = 'cartoon',
      mood = 'happy'
    } = params;
    
    // Extrair elementos-chave da descrição da cena
    const keyElements = this.extractKeyElements(sceneDescription);
    
    // Identificar cenário principal
    const mainScenario = keyElements.scenarios.length > 0 
      ? keyElements.scenarios[0] 
      : 'ambiente apropriado';
    
    // Identificar objetos principais (limitar a 3)
    const mainObjects = keyElements.objects.slice(0, 3).join(', ');
    
    // Identificar cores mencionadas
    const colorTheme = keyElements.colors.length > 0 
      ? `cores predominantes: ${keyElements.colors.join(', ')}` 
      : '';
    
    // Definir estilo visual baseado na faixa etária
    const ageStyle = this.ageGroupStyles[ageGroup] || this.ageGroupStyles['6-8'];
    
    // Definir estilo de ilustração
    const illustrationStyle = this.illustrationStyles[style] || this.illustrationStyles.cartoon;
    
    // Definir humor/clima da imagem
    const moodStyle = this.moodMappings[mood] || this.moodMappings.happy;
    
    // Construir descrições dos personagens para o prompt
    let characterPrompt = '';
    
    if (characterDescriptions && characterDescriptions.length > 0) {
      // Limite a 3 personagens para não sobrecarregar o prompt
      const mainCharacters = characterDescriptions.slice(0, 3);
      
      characterPrompt = 'Personagens: ' + mainCharacters.map(char => {
        // Extrair atributos visuais importantes
        const colors = char.visualAttributes?.colors?.join(', ') || '';
        const clothing = char.visualAttributes?.clothing || '';
        const features = char.visualAttributes?.distinguishingFeatures?.join(', ') || '';
        
        // Construir descrição concisa do personagem
        return `${char.name} (${colors}${clothing ? ', usando ' + clothing : ''}${features ? ', com ' + features : ''})`;
      }).join('; ');
    } else if (keyElements.characters.length > 0) {
      // Usar nomes de personagens extraídos se não temos descrições detalhadas
      characterPrompt = 'Personagens: ' + keyElements.characters.slice(0, 3).join(', ');
    }
    
    // Construir prompt base melhorado
    const basePrompt = [
      `Ilustração de cena: "${sceneDescription.substring(0, 100)}..."`,
      `Mostrando ${characterPrompt || 'personagens infantis apropriados'} em um ${mainScenario}.`,
      mainObjects ? `Incluindo ${mainObjects}.` : '',
      `${moodStyle.atmosphere} com ${moodStyle.expressions}.`,
      colorTheme
    ].filter(Boolean).join(' ');
    
    // Adicionar direção artística
    const artDirection = [
      `Estilo ${illustrationStyle.description}, ${illustrationStyle.inspirations}.`,
      `Composição com ${ageStyle.complexity},`,
      `${ageStyle.outlines},`,
      `${ageStyle.colors},`,
      `${ageStyle.proportions},`,
      `${ageStyle.backgrounds}.`,
      `${moodStyle.lighting} e ${moodStyle.palette}.`
    ].join(' ');
    
    // Prompt negativo para evitar problemas comuns
    const negativePrompt = this.generateNegativePrompt();
    
    // Montar prompt completo
    const enhancedPrompt = `${basePrompt} ${artDirection} História infantil apropriada para idade ${ageGroup}. Negativo: ${negativePrompt}`;
    
    logger.debug(`Prompt aprimorado gerado para cena específica`);
    
    return enhancedPrompt;
  }
  
  /**
   * Gera um prompt negativo para evitar problemas comuns em ilustrações infantis
   * 
   * @returns String com termos para evitar nas imagens
   */
  generateNegativePrompt(): string {
    return [
      'texto, palavras, letras, assinaturas, marca d\'água',
      'imagens inapropriadas, assustadoras ou violentas',
      'realismo excessivo, hiper-realismo, proporções adultas',
      'dedos deformados, mãos estranhas, faces distorcidas',
      'elementos complexos demais, fundos muito carregados',
      'estilos fotográficos, renderização 3D excessivamente realista'
    ].join(', ');
  }
  
  /**
   * Detecta o humor/clima predominante em um texto
   * 
   * @param text Texto para análise
   * @returns Tipo de humor detectado (happy, adventure, calm, exciting)
   */
  detectMood(text: string): string {
    // Palavras associadas a diferentes humores
    const moodKeywords: Record<string, string[]> = {
      happy: [
        'feliz', 'alegre', 'divertido', 'sorriso', 'risada', 'brincadeira', 
        'festa', 'comemorar', 'presente', 'bolo', 'doce', 'amigo', 'família'
      ],
      adventure: [
        'aventura', 'explorar', 'descobrir', 'misterioso', 'surpresa', 'floresta',
        'caverna', 'mapa', 'tesouro', 'herói', 'magia', 'desafio', 'missão',
        'viagem', 'desconhecido', 'animal', 'selvagem', 'coragem'
      ],
      calm: [
        'calmo', 'tranquilo', 'silêncio', 'paz', 'suave', 'lento', 'gentil',
        'sonhar', 'dormir', 'descansar', 'relaxar', 'noite', 'estrela', 'lua',
        'nuvem', 'céu', 'respirar', 'jardim', 'flor'
      ],
      exciting: [
        'empolgante', 'incrível', 'extraordinário', 'espantoso', 'impressionante',
        'rápido', 'veloz', 'corrida', 'competição', 'vencer', 'campeão', 'aplaudir',
        'vibrar', 'forte', 'poder', 'energia', 'fogos', 'brilhante'
      ]
    };
    
    // Normalizar texto para busca
    const normalizedText = text.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // Remover acentos
    
    // Contar ocorrências de palavras-chave para cada humor
    const moodCounts: Record<string, number> = {
      happy: 0,
      adventure: 0,
      calm: 0,
      exciting: 0
    };
    
    // Calcular pontuação para cada humor
    Object.entries(moodKeywords).forEach(([mood, keywords]) => {
      keywords.forEach(keyword => {
        // Contar ocorrências da palavra-chave
        const regex = new RegExp(`\\b${keyword}\\b`, 'ig');
        const matches = normalizedText.match(regex) || [];
        moodCounts[mood] += matches.length;
      });
    });
    
    // Encontrar o humor com maior pontuação
    let detectedMood = 'happy'; // Padrão se nenhum humor se destacar
    let highestCount = 0;
    
    Object.entries(moodCounts).forEach(([mood, count]) => {
      if (count > highestCount) {
        highestCount = count;
        detectedMood = mood;
      }
    });
    
    logger.debug(`Humor detectado no texto: ${detectedMood} (pontuação: ${highestCount})`);
    
    return detectedMood;
  }
  
  /**
   * Extrai nomes de personagens a partir do texto de um capítulo
   * 
   * @param text Texto do capítulo
   * @returns Array com nomes de personagens detectados
   */
  extractCharacterNames(text: string): string[] {
    // Array para armazenar nomes detectados
    const characterNames = new Set<string>();
    
    // Dividir o texto em frases
    const sentences = text.split(/[.!?]+/);
    
    // Iterar pelas frases buscando nomes próprios (começam com maiúscula)
    for (const sentence of sentences) {
      // Padrão para nomes: começam com maiúscula, pelo menos 3 letras, não estão no início da frase
      const nameMatches = sentence.match(/\b[A-Z][a-zÀ-ÿ]{2,}\b/g) || [];
      
      for (const name of nameMatches) {
        const trimmedSentence = sentence.trim();
        
        // Verificar se não é início de frase para reduzir falsos positivos
        if (!trimmedSentence.startsWith(name)) {
          characterNames.add(name);
        } 
        // Se estiver no início da frase, verificar se aparece mais de uma vez no texto
        else {
          const occurrences = (text.match(new RegExp(`\\b${name}\\b`, 'g')) || []).length;
          if (occurrences > 1) {
            characterNames.add(name);
          }
        }
      }
    }
    
    // Filtrar nomes comuns que não são personagens (dia/noite/palavras comuns)
    const excludedWords = ['Dia', 'Noite', 'Manhã', 'Tarde', 'Sol', 'Lua', 'Deus', 
                          'Entretanto', 'Finalmente', 'Agora', 'Então', 'Depois'];
    
    const filteredNames = Array.from(characterNames).filter(
      name => !excludedWords.includes(name)
    );
    
    // Limitar a 5 personagens no máximo
    const result = filteredNames.slice(0, 5);
    
    logger.debug(`Personagens detectados: ${result.join(', ')}`);
    
    return result;
  }
  
  /**
   * Extrai a descrição de um personagem específico a partir do texto
   * 
   * @param characterName Nome do personagem
   * @param text Texto contendo descrições
   * @returns Descrição extraída do personagem
   */
  extractCharacterDescription(characterName: string, text: string): string {
    // Array para armazenar frases relevantes
    const relevantSentences: string[] = [];
    
    // Dividir o texto em frases
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    
    // Buscar frases que mencionam o personagem
    for (const sentence of sentences) {
      if (sentence.includes(characterName)) {
        relevantSentences.push(sentence);
      }
    }
    
    // Se não encontrarmos frases, retornar descrição genérica
    if (relevantSentences.length === 0) {
      return `Um personagem chamado ${characterName}`;
    }
    
    // Selecionar as frases mais informativas (até 3)
    // Priorizar frases que descrevem características físicas
    const physicalDescriptors = [
      'alto', 'baixo', 'magro', 'gordo', 'forte', 'cabelo', 'olhos', 'rosto',
      'pele', 'orelha', 'nariz', 'boca', 'dente', 'mão', 'braço', 'perna',
      'vestido', 'roupa', 'chapéu', 'usando', 'vestindo', 'cor', 'colorido'
    ];
    
    // Classificar frases por relevância descritiva
    const scoredSentences = relevantSentences.map(sentence => {
      let score = 0;
      
      // Mais pontos se a sentença começa com o nome do personagem
      if (sentence.startsWith(characterName)) {
        score += 5;
      }
      
      // Pontos para cada descritor físico encontrado
      for (const descriptor of physicalDescriptors) {
        if (sentence.toLowerCase().includes(descriptor)) {
          score += 2;
        }
      }
      
      // Mais pontos para sentenças mais curtas e focadas
      if (sentence.length < 100) {
        score += 2;
      }
      
      return { sentence, score };
    });
    
    // Ordenar por pontuação e pegar as melhores
    scoredSentences.sort((a, b) => b.score - a.score);
    const bestSentences = scoredSentences.slice(0, 3).map(item => item.sentence);
    
    // Combinar as melhores frases em uma descrição
    const description = bestSentences.join('. ');
    
    logger.debug(`Descrição extraída para ${characterName}: ${description.substring(0, 50)}...`);
    
    return description;
  }
}

// Singleton para uso em toda a aplicação
export const promptEnhancer = new PromptEnhancementService(); 