// Definir tipos para histórias

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