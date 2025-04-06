import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { aiProviderManager } from '../services/ai-providers/provider-manager';

const router = Router();

// Schema for updating user API key
const userAPIKeySchema = z.object({
  providerId: z.string().min(1),
  apiKey: z.string().min(1)
});

// Authentication middleware
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Não autorizado. Usuário precisa estar logado.' });
};

// Get all available AI provider IDs (no sensitive info)
router.get('/available-providers', isAuthenticated, (req, res) => {
  try {
    const providers = aiProviderManager.getProvidersStatus();
    
    // Filter out sensitive information
    const availableProviders = providers.map(provider => ({
      id: provider.id,
      name: provider.name,
      isAvailable: provider.isAvailable,
      capabilities: provider.capabilities
    }));
    
    res.json(availableProviders);
  } catch (error) {
    console.error('Error getting available AI providers:', error);
    res.status(500).json({ message: 'Erro ao buscar provedores de IA disponíveis' });
  }
});

// Set user API key
router.post('/set-api-key', isAuthenticated, async (req, res) => {
  try {
    const data = userAPIKeySchema.parse(req.body);
    
    // Update API key in the provider manager
    const success = aiProviderManager.setProviderApiKey(data.providerId, data.apiKey);
    
    if (success) {
      // Run health check to verify key works
      const providers = aiProviderManager.getProviders();
      const provider = providers.find(p => p.id === data.providerId);
      
      if (provider) {
        const healthResult = await provider.checkHealth();
        
        if (healthResult.isHealthy) {
          res.json({
            success: true,
            message: `Chave API para ${provider.name} configurada com sucesso!`,
            providerName: provider.name,
            isHealthy: true
          });
        } else {
          res.json({
            success: false,
            message: `A chave API para ${provider.name} foi configurada, mas parece estar inválida: ${healthResult.message}`,
            providerName: provider.name,
            isHealthy: false
          });
        }
      } else {
        res.json({
          success: true,
          message: `Chave API configurada, mas o provedor não foi encontrado para verificação`
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: `Falha ao configurar a chave API para o provedor ${data.providerId}`
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    console.error('Error updating user API key:', error);
    res.status(500).json({ message: 'Erro ao configurar chave API' });
  }
});

export default router;