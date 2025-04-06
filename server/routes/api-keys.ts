import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { aiProviderManager } from '../services/ai-providers/provider-manager';

const router = Router();

// Schema for updating API key
const updateAPIKeySchema = z.object({
  providerId: z.string().min(1),
  apiKey: z.string().min(1)
});

// Authenticate as admin middleware
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && (req.user as any).role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Acesso negado. Esta operação requer privilégios de administrador.' });
};

// Get all AI providers with status
router.get('/providers', isAdmin, (req, res) => {
  try {
    const providers = aiProviderManager.getProvidersStatus();
    res.json(providers);
  } catch (error) {
    console.error('Error getting AI providers:', error);
    res.status(500).json({ message: 'Erro ao buscar provedores de IA' });
  }
});

// Update API key for a provider
router.post('/update-key', isAdmin, async (req, res) => {
  try {
    const data = updateAPIKeySchema.parse(req.body);
    
    // Update API key in the provider manager
    const success = aiProviderManager.setProviderApiKey(data.providerId, data.apiKey);
    
    if (success) {
      // Run health check to verify key works
      const providers = aiProviderManager.getProviders();
      const provider = providers.find(p => p.id === data.providerId);
      
      if (provider) {
        const healthResult = await provider.checkHealth();
        
        res.json({
          success: true,
          message: `Chave API atualizada para ${provider.name}`,
          healthCheck: healthResult
        });
      } else {
        res.json({
          success: true,
          message: `Chave API atualizada, mas provedor não encontrado para verificação de saúde`
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: `Falha ao atualizar chave API para o provedor ${data.providerId}`
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    console.error('Error updating API key:', error);
    res.status(500).json({ message: 'Erro ao atualizar chave API' });
  }
});

// Check health for all providers
router.post('/check-health', isAdmin, async (req, res) => {
  try {
    await aiProviderManager.checkAllProvidersHealth();
    const providers = aiProviderManager.getProvidersStatus();
    
    res.json({
      success: true,
      message: 'Verificação de saúde concluída para todos os provedores',
      providers
    });
  } catch (error) {
    console.error('Error checking health:', error);
    res.status(500).json({ message: 'Erro ao verificar saúde dos provedores' });
  }
});

export default router;