import { CharacterDescription } from './ai-providers/types';
import { storage } from '../storage';
import logger from './logger';

/**
 * Serviço para gerenciar a consistência visual de personagens entre capítulos
 * Este serviço armazena e recupera informações sobre a aparência dos personagens
 * para garantir que eles mantenham a mesma aparência em todas as ilustrações
 */
class CharacterConsistencyService {
  // Cache em memória para as descrições de personagens por história
  private characterCache: Map<number, Map<string, CharacterDescription>> = new Map();
  
  // Listas de termos para extração de atributos visuais
  private readonly colorList = [
    'vermelho', 'azul', 'verde', 'amarelo', 'laranja', 'roxo', 'rosa', 'marrom', 
    'preto', 'branco', 'cinza', 'dourado', 'prateado', 'bege', 'turquesa', 
    'magenta', 'lilás', 'violeta', 'ciano', 'coral', 'carmesim', 'escarlate', 
    'índigo', 'ocre', 'púrpura', 'âmbar', 'bordô', 'terracota', 'esmeralda', 
    'safira', 'rubi', 'jade', 'lima', 'oliva', 'aqua', 'vinho', 'chocolate'
  ];
  
  private readonly clothingList = [
    'chapéu', 'boné', 'coroa', 'tiara', 'óculos', 'cachecol', 'lenço',
    'camiseta', 'camisa', 'blusa', 'casaco', 'jaqueta', 'manto', 'capa',
    'calça', 'shorts', 'saia', 'vestido', 'macacão', 'jardineira',
    'sapato', 'bota', 'tênis', 'sandália', 'chinelo',
    'gravata', 'laço', 'pulseira', 'colar', 'brinco', 'anel',
    'bolsa', 'mochila', 'luva', 'máscara', 'capacete', 'armadura',
    'uniforme', 'pijama', 'fantasia', 'avental', 'colete', 'suspensório'
  ];
  
  private readonly featuresList = [
    // Características físicas
    'alto', 'baixo', 'magro', 'forte', 'gordo', 'atlético',
    // Cabelo
    'cabelo cacheado', 'cabelo liso', 'cabelo curto', 'cabelo longo', 'cabelo espetado',
    'franja', 'careca', 'topete', 'tranças', 'rabo de cavalo', 'coque',
    // Rosto
    'barba', 'bigode', 'óculos', 'monóculo', 'sardas', 'cicatriz', 'pinta',
    'sobrancelhas grossas', 'cílios longos', 'nariz grande', 'nariz pequeno',
    'bochecha', 'queixo', 'rosto redondo', 'rosto fino', 'orelhas grandes',
    // Expressões
    'sorridente', 'sério', 'bravo', 'triste', 'surpreso', 'assustado', 'animado',
    // Acessórios
    'coroa', 'varinha', 'cetro', 'cajado', 'espada', 'escudo', 'arco', 'flecha',
    'colar', 'amuleto', 'pingente', 'anel', 'bracelete', 'pulseira', 'brinco',
    // Características especiais
    'asas', 'cauda', 'chifres', 'mágico', 'brilhante', 'luminoso', 'mecânico',
    'robótico', 'metálico', 'peludo', 'escamoso', 'listrado', 'pintado', 'manchado'
  ];
  
  constructor() {
    logger.info('Character Consistency Service initialized');
  }
  
  /**
   * Obtém ou cria descrições de personagens para uma história
   * 
   * @param storyId ID da história
   * @param characterNames Nomes dos personagens
   * @returns Array de descrições de personagens com atributos visuais
   */
  async getCharacterDescriptions(storyId: number, characterNames: string[]): Promise<CharacterDescription[]> {
    // Verificar se já temos estas descrições em cache
    if (!this.characterCache.has(storyId)) {
      this.characterCache.set(storyId, new Map());
    }
    
    const storyCache = this.characterCache.get(storyId)!;
    const story = await storage.getStory(storyId);
    
    if (!story) {
      logger.warn(`Story ID ${storyId} not found for character consistency service`);
      return [];
    }
    
    // Buscar detalhes dos personagens do banco de dados
    const characterDescriptions: CharacterDescription[] = [];
    
    for (const characterName of characterNames) {
      // Verificar cache primeiro
      if (storyCache.has(characterName)) {
        characterDescriptions.push(storyCache.get(characterName)!);
        continue;
      }
      
      // Buscar informações do personagem no banco de dados
      // (Aqui estamos buscando apenas pelo nome, em uma implementação mais robusta
      // poderíamos usar IDs dos personagens)
      let characterDescription: CharacterDescription;
      
      // Verificar se o nome do personagem corresponde a um personagem no banco
      const characters = await storage.getAllCharacters();
      const matchedCharacter = characters.find(char => 
        char.name.toLowerCase().includes(characterName.toLowerCase()) ||
        characterName.toLowerCase().includes(char.name.toLowerCase())
      );
      
      if (matchedCharacter) {
        // Criar uma descrição de personagem baseada no registro do banco de dados
        characterDescription = {
          name: characterName,
          appearance: matchedCharacter.description,
          visualAttributes: this.extractVisualAttributes(matchedCharacter.description)
        };
        
        logger.debug(`Character '${characterName}' matched with database character '${matchedCharacter.name}'`);
      } else {
        // Se não encontrou no banco, criar uma descrição genérica
        characterDescription = {
          name: characterName,
          appearance: `Um personagem chamado ${characterName}`,
          visualAttributes: {
            colors: this.generateConsistentColors(characterName),
            clothing: '',
            distinguishingFeatures: []
          }
        };
        
        logger.debug(`Character '${characterName}' not found in database, using generated description`);
      }
      
      // Armazenar no cache
      storyCache.set(characterName, characterDescription);
      characterDescriptions.push(characterDescription);
    }
    
    return characterDescriptions;
  }
  
  /**
   * Atualiza as descrições de personagens com informações de imagens prévias
   * 
   * @param storyId ID da história
   * @param characterUpdates Atualizações para os personagens
   */
  updateCharacterVisuals(storyId: number, characterUpdates: {
    name: string;
    imageUrl?: string;
    description?: string;
    chapterId?: number;
  }[]): void {
    if (!this.characterCache.has(storyId)) {
      this.characterCache.set(storyId, new Map());
    }
    
    const storyCache = this.characterCache.get(storyId)!;
    logger.info(`Atualizando descrições visuais para ${characterUpdates.length} personagens na história ${storyId}`);
    
    for (const update of characterUpdates) {
      if (!update.name) continue;
      
      const currentDesc = storyCache.get(update.name);
      
      if (currentDesc) {
        // Criar uma cópia segura para atualização
        const updatedDesc: CharacterDescription = { 
          name: currentDesc.name,
          appearance: currentDesc.appearance,
          visualAttributes: currentDesc.visualAttributes ? { 
            colors: [...(currentDesc.visualAttributes.colors || [])],
            clothing: currentDesc.visualAttributes.clothing || '',
            distinguishingFeatures: currentDesc.visualAttributes.distinguishingFeatures ? 
              [...currentDesc.visualAttributes.distinguishingFeatures] : []
          } : {
            colors: this.generateConsistentColors(update.name),
            clothing: '',
            distinguishingFeatures: []
          },
          previousImages: currentDesc.previousImages ? [...currentDesc.previousImages] : [],
          chapterAppearances: currentDesc.chapterAppearances ? [...currentDesc.chapterAppearances] : []
        };
        
        // Atualizar com a nova URL de imagem, se fornecida
        if (update.imageUrl) {
          // Adicionar à lista de imagens anteriores
          if (!updatedDesc.previousImages) {
            updatedDesc.previousImages = [];
          }
          
          updatedDesc.previousImages.push(update.imageUrl);
          
          // Manter apenas as últimas 3 imagens para não sobrecarregar
          if (updatedDesc.previousImages.length > 3) {
            updatedDesc.previousImages = updatedDesc.previousImages.slice(-3);
          }
          
          logger.debug(`Added image for character ${update.name}, now has ${updatedDesc.previousImages.length} images`);
          
          // Adicionar à lista de aparições em capítulos
          if (!updatedDesc.chapterAppearances) {
            updatedDesc.chapterAppearances = [];
          }
          
          // Se já existir uma entrada para este capítulo, atualizá-la
          const chapterId = update.chapterId || updatedDesc.chapterAppearances.length + 1;
          const existingAppearanceIndex = updatedDesc.chapterAppearances.findIndex(
            app => app.chapterId === chapterId
          );
          
          if (existingAppearanceIndex >= 0) {
            // Atualizar a entrada existente
            updatedDesc.chapterAppearances[existingAppearanceIndex] = {
              ...updatedDesc.chapterAppearances[existingAppearanceIndex],
              imageUrl: update.imageUrl,
              description: update.description || updatedDesc.chapterAppearances[existingAppearanceIndex].description
            };
            
            logger.debug(`Updated existing chapter appearance ${chapterId} for character ${update.name}`);
          } else {
            // Adicionar nova entrada
            updatedDesc.chapterAppearances.push({
              chapterId,
              imageUrl: update.imageUrl,
              description: update.description
            });
            
            logger.debug(`Added new chapter appearance ${chapterId} for character ${update.name}`);
          }
        }
        
        // Se foi fornecida uma nova descrição, extrair atributos visuais atualizados
        if (update.description && update.description.length > 10) {
          const newVisualAttributes = this.extractVisualAttributes(update.description);
          
          // Manter cores existentes se novas não foram encontradas
          if (newVisualAttributes.colors.length === 0 && updatedDesc.visualAttributes?.colors?.length > 0) {
            newVisualAttributes.colors = updatedDesc.visualAttributes.colors;
          }
          
          // Se já temos roupas definidas e a nova descrição não menciona roupas, manter as anteriores
          if (!newVisualAttributes.clothing && updatedDesc.visualAttributes?.clothing) {
            newVisualAttributes.clothing = updatedDesc.visualAttributes.clothing;
          }
          
          // Combinar características distintivas, removendo duplicatas
          const allFeatures = [
            ...(updatedDesc.visualAttributes?.distinguishingFeatures || []),
            ...(newVisualAttributes.distinguishingFeatures || [])
          ];
          
          // Remover duplicatas
          newVisualAttributes.distinguishingFeatures = Array.from(new Set(allFeatures));
          
          // Sobrescrever atributos visuais com valores mesclados
          updatedDesc.visualAttributes = newVisualAttributes;
          
          logger.debug(`Updated visual attributes for character ${update.name} from new description`);
        }
        
        // Armazenar de volta no cache
        storyCache.set(update.name, updatedDesc);
      } else {
        // Se o personagem não existir no cache, criar uma nova entrada
        const newCharacter: CharacterDescription = {
          name: update.name,
          appearance: update.description || `Um personagem chamado ${update.name}`,
          visualAttributes: {
            colors: this.generateConsistentColors(update.name),
            clothing: '',
            distinguishingFeatures: []
          },
          previousImages: update.imageUrl ? [update.imageUrl] : [],
          chapterAppearances: update.imageUrl && update.chapterId ? [{
            chapterId: update.chapterId,
            imageUrl: update.imageUrl,
            description: update.description
          }] : []
        };
        
        // Se foi fornecida uma descrição, extrair atributos visuais
        if (update.description && update.description.length > 10) {
          newCharacter.visualAttributes = this.extractVisualAttributes(update.description);
        }
        
        // Armazenar no cache
        storyCache.set(update.name, newCharacter);
        
        logger.debug(`Created new character entry for ${update.name}`);
      }
    }
  }
  
  /**
   * Extrai atributos visuais de uma descrição de texto
   * 
   * @param description Descrição do personagem
   * @returns Atributos visuais extraídos da descrição
   */
  private extractVisualAttributes(description: string): CharacterDescription['visualAttributes'] {
    const colors: string[] = [];
    const clothing: string[] = [];
    const features: string[] = [];
    
    // Normalizar texto para busca
    const normalizedDesc = description.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // Remover acentos
    
    // Procurar por cores (busca mais inteligente)
    for (const color of this.colorList) {
      // Verificar se a palavra completa existe na descrição
      const colorRegex = new RegExp(`\\b${color}\\b`, 'i');
      if (colorRegex.test(normalizedDesc)) {
        colors.push(color);
      }
    }
    
    // Procurar por peças de roupa
    for (const item of this.clothingList) {
      // Verificar item individual e possíveis plurais
      const clothingRegex = new RegExp(`\\b${item}(s)?\\b`, 'i');
      if (clothingRegex.test(normalizedDesc)) {
        clothing.push(item);
      }
    }
    
    // Procurar por características distintivas
    for (const feature of this.featuresList) {
      // Busca mais flexível para características
      if (normalizedDesc.includes(feature)) {
        features.push(feature);
      }
    }
    
    // Extrair descrições de cabelo específicas (cor, comprimento, estilo)
    const hairColors = ['vermelho', 'azul', 'verde', 'amarelo', 'laranja', 'roxo', 'rosa', 
                       'marrom', 'preto', 'branco', 'loiro', 'castanho', 'ruivo'];
    
    // Método seguro para detectar cabelo de cor específica
    for (const color of hairColors) {
      if (normalizedDesc.includes(`cabelo ${color}`)) {
        features.push(`cabelo ${color}`);
      }
    }
    
    // Extrair características de animais/criaturas
    if (
      normalizedDesc.includes('leão') || 
      normalizedDesc.includes('tigre') ||
      normalizedDesc.includes('urso') ||
      normalizedDesc.includes('lobo') ||
      normalizedDesc.includes('raposa') ||
      normalizedDesc.includes('dragão') ||
      normalizedDesc.includes('elfo') ||
      normalizedDesc.includes('fada')
    ) {
      // Identificar qual a criatura
      const creatureTypes = ['leão', 'tigre', 'urso', 'lobo', 'raposa', 'dragão', 'elfo', 'fada'];
      for (const type of creatureTypes) {
        if (normalizedDesc.includes(type)) {
          features.push(`personagem tipo ${type}`);
        }
      }
    }
    
    // Criar um string de descrição de roupas se encontrado várias peças
    const clothingDescription = clothing.length > 0 ? clothing.join(', ') : '';
    
    // Fornecer atributos visuais padrão se não encontrados
    return {
      colors: colors.length > 0 ? colors : ['azul', 'vermelho'], // cores padrão se não encontrar nenhuma
      clothing: clothingDescription,
      distinguishingFeatures: features
    };
  }
  
  /**
   * Gera cores consistentes baseadas no nome do personagem
   * para garantir que mesmo personagens sem descrição detalhada
   * mantenham aparência consistente
   * 
   * @param name Nome do personagem
   * @returns Array de cores consistentes para o personagem
   */
  private generateConsistentColors(name: string): string[] {
    // Usar o nome como seed para gerar cores consistentes
    const seed = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Paleta de cores para histórias infantis (cores vibrantes e amigáveis)
    const colorPalette = [
      'vermelho', 'azul', 'verde', 'amarelo', 'laranja', 
      'roxo', 'rosa', 'turquesa', 'lima', 'azul-claro'
    ];
    
    // Selecionar 2-3 cores consistentemente baseadas no nome
    const colorCount = (seed % 2) + 2; // 2 ou 3 cores
    const colors: string[] = [];
    
    for (let i = 0; i < colorCount; i++) {
      const index = (seed + i * 7) % colorPalette.length;
      colors.push(colorPalette[index]);
    }
    
    return colors;
  }
  
  /**
   * Obtém um resumo visual de todos os personagens de uma história
   * Útil para depuração e monitoramento da consistência
   * 
   * @param storyId ID da história
   * @returns Resumo dos personagens e suas características visuais
   */
  getCharacterSummary(storyId: number): any {
    if (!this.characterCache.has(storyId)) {
      return { characters: [], message: "Nenhum personagem encontrado para esta história" };
    }
    
    const storyCache = this.characterCache.get(storyId)!;
    const characters = Array.from(storyCache.values()).map(char => ({
      name: char.name,
      appearance: char.appearance,
      visualAttributes: char.visualAttributes,
      imagesCount: char.previousImages?.length || 0,
      chapterAppearances: char.chapterAppearances?.length || 0
    }));
    
    return {
      characters,
      storyId,
      charactersCount: characters.length
    };
  }
}

// Singleton para uso em toda a aplicação
export const characterConsistencyService = new CharacterConsistencyService();