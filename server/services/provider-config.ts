import { aiProviderManager, AICapability } from './ai-providers/provider-manager';
import logger from './logger';

/**
 * Configura os provedores padrão para texto e imagem
 * Define o OpenAI como provedor padrão para texto
 * Define o HuggingFace como provedor padrão para imagens
 */
export function configureDefaultProviders(): void {
  try {
    // Configurar o OpenAI como provedor padrão para texto (GPT-3.5)
    aiProviderManager.updateRoutingConfig({
      defaultTextProvider: 'openai'
    });
    
    // Definir explicitamente que queremos usar o GPT-3.5 Turbo como modelo padrão para texto
    aiProviderManager.setPreferredProviderForModelTest(AICapability.TEXT_GENERATION, 'openai')
      .then(() => {
        logger.info('OpenAI configurado como provedor padrão para geração de texto com modelo gpt-3.5-turbo');
      })
      .catch(error => {
        logger.error('Erro ao definir OpenAI como provedor preferido para texto', error);
      });
    
    // Configurar o HuggingFace como provedor padrão para imagem
    aiProviderManager.updateRoutingConfig({
      defaultImageProvider: 'huggingface'
    });
    
    // Definir explicitamente que queremos usar o HuggingFace como provedor padrão para imagens
    aiProviderManager.setPreferredProviderForModelTest(AICapability.IMAGE_GENERATION, 'huggingface')
      .then(() => {
        logger.info('HuggingFace configurado como provedor padrão para geração de imagem com modelo stable-diffusion-xl');
      })
      .catch(error => {
        logger.error('Erro ao definir HuggingFace como provedor preferido para imagens', error);
      });
    
    logger.info('Provedores padrão configurados com sucesso');
  } catch (error) {
    logger.error('Erro ao configurar provedores padrão', error);
    throw error;
  }
} 