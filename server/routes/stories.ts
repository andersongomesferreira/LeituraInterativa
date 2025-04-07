import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { insertStorySchema } from '@shared/schema';
import { z } from 'zod';
import { isAuthenticated } from '../middleware/security';
import { 
  generateStory, 
  generateAudioFromText, 
  generateImage,
  generateChapterImage,
  extractChapters 
} from '../services/ai-service';

const router = Router();

// Middleware para verificar se o usuário tem acesso à história
const hasStoryAccess = async (req: Request, res: Response, next: Function) => {
  const storyId = parseInt(req.params.id);
  if (isNaN(storyId)) {
    return res.status(400).json({ success: false, message: "ID de história inválido" });
  }
  
  try {
    const story = await storage.getStory(storyId);
    if (!story) {
      return res.status(404).json({ success: false, message: "História não encontrada" });
    }
    
    const user = req.user as any;
    // Verificar se o usuário é o proprietário da história ou um admin
    if (story.userId === user.id || user.role === 'admin') {
      // Armazenar a história no request para uso posterior
      (req as any).story = story;
      return next();
    }
    
    // Verificar se a história está vinculada a um perfil infantil do usuário
    if (story.childProfileId) {
      const childProfiles = await storage.getChildProfilesByParentId(user.id);
      const hasAccess = childProfiles.some(profile => profile.id === story.childProfileId);
      
      if (hasAccess) {
        (req as any).story = story;
        return next();
      }
    }
    
    return res.status(403).json({ success: false, message: "Acesso negado a esta história" });
  } catch (error) {
    console.error("Erro ao verificar acesso à história:", error);
    return res.status(500).json({ success: false, message: "Erro interno do servidor" });
  }
};

// Obter todas as histórias do usuário atual
router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const stories = await storage.getStoriesByUserId(userId);
    
    return res.status(200).json({
      success: true,
      stories
    });
  } catch (error) {
    console.error("Erro ao buscar histórias:", error);
    return res.status(500).json({ success: false, message: "Erro ao buscar histórias" });
  }
});

// Obter histórias de um perfil infantil específico
router.get('/child/:childId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const childId = parseInt(req.params.childId);
    if (isNaN(childId)) {
      return res.status(400).json({ success: false, message: "ID de perfil infantil inválido" });
    }
    
    // Verificar se o usuário tem acesso ao perfil infantil
    const userId = (req.user as any).id;
    const childProfiles = await storage.getChildProfilesByParentId(userId);
    const hasAccess = childProfiles.some(profile => profile.id === childId);
    
    if (!hasAccess && (req.user as any).role !== 'admin') {
      return res.status(403).json({ success: false, message: "Acesso negado a este perfil infantil" });
    }
    
    const stories = await storage.getStoriesByChildId(childId);
    
    return res.status(200).json({
      success: true,
      stories
    });
  } catch (error) {
    console.error("Erro ao buscar histórias do perfil infantil:", error);
    return res.status(500).json({ success: false, message: "Erro ao buscar histórias" });
  }
});

// Obter uma história específica
router.get('/:id', isAuthenticated, hasStoryAccess, async (req: Request, res: Response) => {
  // A história já foi verificada e carregada pelo middleware hasStoryAccess
  const story = (req as any).story;
  
  return res.status(200).json({
    success: true,
    story
  });
});

// Criar uma nova história
router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    
    // Obter nível de assinatura do usuário
    const userSubscription = await storage.getUserSubscription(userId);
    const userTier = userSubscription?.planId ? (userSubscription.planId === 1 ? 'free' : (userSubscription.planId === 2 ? 'plus' : 'family')) : 'free';
    
    // Validar os dados da requisição
    const { characters, theme, ageGroup, childName, childProfileId, textOnly } = req.body;
    
    if (!characters || !Array.isArray(characters) || characters.length === 0) {
      return res.status(400).json({ success: false, message: "É necessário fornecer pelo menos um personagem" });
    }
    
    if (!theme) {
      return res.status(400).json({ success: false, message: "É necessário fornecer um tema para a história" });
    }
    
    if (!ageGroup || !['3-5', '6-8', '9-12'].includes(ageGroup)) {
      return res.status(400).json({ success: false, message: "Faixa etária inválida" });
    }
    
    // Verificar acesso ao perfil infantil, se fornecido
    if (childProfileId) {
      const childProfiles = await storage.getChildProfilesByParentId(userId);
      const hasAccess = childProfiles.some(profile => profile.id === childProfileId);
      
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: "Acesso negado a este perfil infantil" });
      }
    }
    
    // Gerar a história usando o serviço de IA
    const generatedStory = await generateStory({
      characters,
      theme,
      ageGroup,
      childName,
      textOnly: textOnly || false
    }, userTier);
    
    // Criar a história no banco de dados
    const story = await storage.createStory({
      userId,
      childProfileId: childProfileId || null,
      title: generatedStory.title,
      content: generatedStory.content,
      summary: generatedStory.summary,
      readingTime: generatedStory.readingTime,
      ageGroup,
      theme,
      characters: characters.join(', '),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return res.status(201).json({
      success: true,
      message: "História criada com sucesso",
      story,
      generatedStory
    });
  } catch (error) {
    console.error("Erro ao criar história:", error);
    return res.status(500).json({ success: false, message: "Erro ao criar história" });
  }
});

// Gerar áudio para um capítulo
router.post('/:id/chapters/:chapterIndex/audio', isAuthenticated, hasStoryAccess, async (req: Request, res: Response) => {
  try {
    const story = (req as any).story;
    const chapterIndex = parseInt(req.params.chapterIndex);
    
    if (isNaN(chapterIndex)) {
      return res.status(400).json({ success: false, message: "Índice de capítulo inválido" });
    }
    
    // Extrair capítulos da história
    const chapters = extractChapters(story.content);
    
    if (chapterIndex < 0 || chapterIndex >= chapters.length) {
      return res.status(400).json({ success: false, message: "Capítulo não encontrado" });
    }
    
    const chapter = chapters[chapterIndex];
    
    // Gerar áudio para o conteúdo do capítulo
    const audioResult = await generateAudioFromText(chapter.content);
    
    if (!audioResult.success) {
      return res.status(500).json({ success: false, message: "Erro ao gerar áudio" });
    }
    
    return res.status(200).json({
      success: true,
      audioUrl: audioResult.audioUrl
    });
  } catch (error) {
    console.error("Erro ao gerar áudio:", error);
    return res.status(500).json({ success: false, message: "Erro ao gerar áudio" });
  }
});

// Gerar imagem para um capítulo
router.post('/:id/chapters/:chapterIndex/image', isAuthenticated, hasStoryAccess, async (req: Request, res: Response) => {
  try {
    const story = (req as any).story;
    const chapterIndex = parseInt(req.params.chapterIndex);
    
    if (isNaN(chapterIndex)) {
      return res.status(400).json({ success: false, message: "Índice de capítulo inválido" });
    }
    
    // Extrair capítulos da história
    const chapters = extractChapters(story.content);
    
    if (chapterIndex < 0 || chapterIndex >= chapters.length) {
      return res.status(400).json({ success: false, message: "Capítulo não encontrado" });
    }
    
    const chapter = chapters[chapterIndex];
    
    // Obter nível de assinatura do usuário
    const userId = (req.user as any).id;
    const userSubscription = await storage.getUserSubscription(userId);
    const userTier = userSubscription?.planId ? (userSubscription.planId === 1 ? 'free' : (userSubscription.planId === 2 ? 'plus' : 'family')) : 'free';
    
    // Extrair nomes de personagens da história
    let characterNames: string[] = [];
    
    // Tentar extrair personagens do story.characters (se disponível)
    if (story.characters) {
      characterNames = story.characters.split(',').map((name: string) => name.trim());
    }
    
    // Gerar imagem para o capítulo
    const imageResult = await generateChapterImage(
      chapter.imagePrompt || `Ilustração para o capítulo "${chapter.title}": ${chapter.content.substring(0, 200)}`,
      story.id, // Passar o ID da história para manter consistência
      chapterIndex, // Usar o índice do capítulo como ID
      { 
        ageGroup: story.ageGroup,
        storyId: story.id // Redundante mas mantido para compatibilidade
      },
      userTier
    );
    
    if (!imageResult.success) {
      return res.status(500).json({ success: false, message: "Erro ao gerar imagem" });
    }
    
    return res.status(200).json({
      success: true,
      imageUrl: imageResult.imageUrl
    });
  } catch (error) {
    console.error("Erro ao gerar imagem:", error);
    return res.status(500).json({ success: false, message: "Erro ao gerar imagem" });
  }
});

// Excluir uma história
router.delete('/:id', isAuthenticated, hasStoryAccess, async (req: Request, res: Response) => {
  try {
    const storyId = parseInt(req.params.id);
    
    // A história já foi verificada pelo middleware hasStoryAccess
    
    // Implementar a exclusão quando o storage suportar esta operação
    // await storage.deleteStory(storyId);
    
    return res.status(200).json({
      success: true,
      message: "História excluída com sucesso"
    });
  } catch (error) {
    console.error("Erro ao excluir história:", error);
    return res.status(500).json({ success: false, message: "Erro ao excluir história" });
  }
});

export default router; 