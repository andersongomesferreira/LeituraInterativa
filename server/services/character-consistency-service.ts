import { CharacterDescription } from './ai-providers/types';
import { storage } from '../storage';

/**
 * Serviço para gerenciar a consistência visual de personagens entre capítulos
 * Este serviço armazena e recupera informações sobre a aparência dos personagens
 * para garantir que eles mantenham a mesma aparência em todas as ilustrações
 */
class CharacterConsistencyService {
  // Cache em memória para as descrições de personagens por história
  private characterCache: Map<number, Map<string, CharacterDescription>> = new Map();
  
  constructor() {
    console.log('Character Consistency Service initialized');
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
      console.warn(`Story ID ${storyId} not found for character consistency service`);
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
      } else {
        // Se não encontrou no banco, criar uma descrição genérica
        characterDescription = {
          name: characterName,
          appearance: `Um personagem chamado ${characterName}`,
          visualAttributes: {
            colors: this.generateConsistentColors(characterName)
          }
        };
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
  }[]): void {
    if (!this.characterCache.has(storyId)) {
      this.characterCache.set(storyId, new Map());
    }
    
    const storyCache = this.characterCache.get(storyId)!;
    
    for (const update of characterUpdates) {
      if (!update.name) continue;
      
      const currentDesc = storyCache.get(update.name);
      
      if (currentDesc) {
        // Criar uma cópia segura para atualização
        const updatedDesc: CharacterDescription = { 
          name: currentDesc.name,
          appearance: currentDesc.appearance,
          visualAttributes: currentDesc.visualAttributes ? { 
            colors: [...currentDesc.visualAttributes.colors],
            clothing: currentDesc.visualAttributes.clothing || '',
            distinguishingFeatures: currentDesc.visualAttributes.distinguishingFeatures ? 
              [...currentDesc.visualAttributes.distinguishingFeatures] : []
          } : {
            colors: ['azul', 'vermelho'], // cores padrão
            clothing: '',
            distinguishingFeatures: []
          },
          previousImages: currentDesc.previousImages ? [...currentDesc.previousImages] : []
        };
        
        // Atualizar com a nova URL de imagem, se fornecida
        if (update.imageUrl) {
          if (!updatedDesc.previousImages) {
            updatedDesc.previousImages = [];
          }
          
          updatedDesc.previousImages.push(update.imageUrl);
          
          // Manter apenas as últimas 3 imagens para não sobrecarregar
          if (updatedDesc.previousImages.length > 3) {
            updatedDesc.previousImages = updatedDesc.previousImages.slice(-3);
          }
        }
        
        // Atualizar com uma nova descrição, se fornecida
        if (update.description) {
          // Extrair atributos visuais da nova descrição
          const extractedAttributes = this.extractVisualAttributes(update.description);
          
          // Garantir que o objeto visualAttributes existe
          if (!updatedDesc.visualAttributes) {
            updatedDesc.visualAttributes = {
              colors: ['azul', 'vermelho'],
              clothing: '',
              distinguishingFeatures: []
            };
          }
          
          // Mesclar cores (remover duplicatas)
          const combinedColors = [
            ...updatedDesc.visualAttributes.colors,
            ...extractedAttributes.colors
          ].filter((color, index, self) => self.indexOf(color) === index);
          
          updatedDesc.visualAttributes.colors = combinedColors;
          
          // Atualizar roupa se a nova descrição tiver essa informação
          if (extractedAttributes.clothing && extractedAttributes.clothing.length > 0) {
            updatedDesc.visualAttributes.clothing = extractedAttributes.clothing;
          }
          
          // Mesclar características distintivas
          if (extractedAttributes.distinguishingFeatures && extractedAttributes.distinguishingFeatures.length > 0) {
            const combinedFeatures = [
              ...(updatedDesc.visualAttributes.distinguishingFeatures || []),
              ...extractedAttributes.distinguishingFeatures
            ].filter((feature, index, self) => self.indexOf(feature) === index);
            
            updatedDesc.visualAttributes.distinguishingFeatures = combinedFeatures;
          }
        }
        
        // Atualizar no cache
        storyCache.set(update.name, updatedDesc);
      }
    }
  }
  
  /**
   * Extrai atributos visuais importantes de uma descrição textual
   */
  private extractVisualAttributes(description: string): CharacterDescription['visualAttributes'] {
    const colors: string[] = [];
    const clothing: string[] = [];
    const features: string[] = [];
    
    // Lista de cores comuns para procurar
    const colorList = [
      'vermelho', 'azul', 'verde', 'amarelo', 'laranja', 
      'roxo', 'rosa', 'marrom', 'preto', 'branco', 
      'cinza', 'dourado', 'prateado', 'colorido'
    ];
    
    // Lista de peças de roupa comuns
    const clothingList = [
      'chapéu', 'boné', 'camiseta', 'camisa', 'calça',
      'shorts', 'vestido', 'saia', 'jaqueta', 'casaco',
      'macacão', 'uniforme', 'gravata', 'lenço', 'cachecol'
    ];
    
    // Lista de características distintivas
    const featuresList = [
      'óculos', 'barba', 'bigode', 'cicatriz', 'tatuagem',
      'asas', 'cauda', 'chifres', 'penas', 'escamas',
      'mochila', 'bengala', 'bolsa', 'coroa', 'espada'
    ];
    
    // Normalizar descrição
    const normalizedDesc = description.toLowerCase();
    
    // Procurar por cores
    for (const color of colorList) {
      if (normalizedDesc.includes(color)) {
        colors.push(color);
      }
    }
    
    // Procurar por peças de roupa
    for (const item of clothingList) {
      if (normalizedDesc.includes(item)) {
        clothing.push(item);
      }
    }
    
    // Procurar por características distintivas
    for (const feature of featuresList) {
      if (normalizedDesc.includes(feature)) {
        features.push(feature);
      }
    }
    
    return {
      colors: colors.length > 0 ? colors : ['azul', 'vermelho'], // cores padrão se não encontrar nenhuma
      clothing: clothing.join(', '),
      distinguishingFeatures: features
    };
  }
  
  /**
   * Gera cores consistentes baseadas no nome do personagem
   * para garantir que mesmo personagens sem descrição detalhada
   * mantenham aparência consistente
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
}

// Singleton para uso em toda a aplicação
export const characterConsistencyService = new CharacterConsistencyService();