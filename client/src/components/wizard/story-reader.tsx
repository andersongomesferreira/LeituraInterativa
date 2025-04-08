import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { formatReadingTime } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Image, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Chapter {
  title: string;
  content: string;
  imagePrompt?: string;
  imageUrl?: string;
}

interface Story {
  id: number;
  title: string;
  content: string;
  ageGroup: string;
  characterIds: number[];
  themeId: number;
  summary?: string;
  readingTime?: number;
  chapters?: Chapter[];
  textOnly?: boolean;
}

interface Character {
  id: number;
  name: string;
  description: string;
}

interface StoryReaderProps {
  storyId: number;
  childId?: number;
  textOnly?: boolean;
}

const StoryReader = ({ storyId, childId, textOnly: propTextOnly = false }: StoryReaderProps) => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [progress, setProgress] = useState(0);
  const [imageGenerating, setImageGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch story details
  const { data: story, isLoading } = useQuery<Story>({
    queryKey: [`/api/stories/${storyId}`]
  });

  // Fetch characters
  const { data: characters = [] } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
    enabled: !!story,
  });

  // Mutation para gerar ilustração para um capítulo
  const generateImageMutation = useMutation({
    mutationFn: async ({ chapterIndex, chapterTitle, chapterContent, characterNames, options }: { 
      chapterIndex: number, 
      chapterTitle: string, 
      chapterContent: string,
      characterNames: string[],
      options?: {
        style?: string,
        mood?: string,
        ageGroup?: string,
        storyId?: number,
        forceProvider?: string
      }
    }) => {
      setImageGenerating(true);

      try {
        console.log(`Gerando imagem para capítulo "${chapterTitle}" (índice ${chapterIndex})`);
        console.log(`Personagens: ${characterNames.join(', ')}`);
        
        // Opções padrão se não forem fornecidas
        const imageOptions = options || {
          style: "cartoon",
          mood: "adventure",
          ageGroup: story?.ageGroup,
          storyId: storyId,
          forceProvider: "huggingface" // Definir HuggingFace como provedor preferido
        };

        console.log("Opções de geração:", imageOptions);

        const payload = {
          chapterTitle,
          chapterContent,
          characters: characterNames,
          options: imageOptions
        };

        console.log("Enviando requisição para API de geração de imagem:", payload);

        // Usar fetch diretamente para ter acesso à resposta completa
        const rawResponse = await fetch('/api/stories/generateChapterImage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          credentials: 'include'
        });

        // Verificar se a resposta HTTP foi bem-sucedida
        if (!rawResponse.ok) {
          console.error(`Erro HTTP: ${rawResponse.status} ${rawResponse.statusText}`);
          throw new Error(`Erro na requisição: ${rawResponse.status} ${rawResponse.statusText}`);
        }

        // Capturar o texto da resposta para debug
        const responseText = await rawResponse.text();
        console.log('Resposta bruta da API:', responseText);

        // Tentar converter a resposta em JSON
        let response;
        try {
          response = JSON.parse(responseText);
          console.log("Resposta da API de geração de imagem (parseada):", response);
          
          // Verificação adicional para garantir que a resposta contenha os dados necessários
          if (!response || (response.success === false && !response.imageUrl)) {
            console.error('Resposta indica falha:', response);
            throw new Error('Falha na geração de imagem: ' + (response.message || 'Erro desconhecido'));
          }
        } catch (e) {
          console.error('Falha ao converter resposta para JSON:', e);
          throw new Error('Resposta inválida do servidor: ' + responseText.substring(0, 200));
        }

        // Extrair a URL da imagem
        let imageUrl = null;
        let isBackupImage = false;
        let attemptedProviders: string[] = [];

        if (typeof response === 'string') {
          imageUrl = response;
        } else if (typeof response === 'object') {
          // Extrair a URL da imagem de várias localizações possíveis na resposta
          imageUrl = response.imageUrl || 
                    response.url || 
                    (response.success && response.data?.imageUrl) ||
                    (response.data && response.data.imageUrl);

          // Verificar se é imagem de backup
          isBackupImage = !!response.isBackup;
          
          // Extrair quais provedores foram tentados
          if (response.attemptedProviders && Array.isArray(response.attemptedProviders)) {
            attemptedProviders = response.attemptedProviders;
          }

          // Log detalhado da resposta para debug
          console.log("Resposta detalhada da API de imagens:", JSON.stringify(response, null, 2));
          
          if (isBackupImage) {
            console.log("Imagem de backup detectada:", imageUrl);
            console.log("Provedores tentados:", attemptedProviders.join(', '));
            
            // Se já tentamos com alguns provedores específicos, podemos tentar com outros
            if (attemptedProviders.length > 0) {
              const possibleAlternatives = ['openai', 'huggingface', 'stability', 'replicate'];
              const remainingOptions = possibleAlternatives.filter(p => !attemptedProviders.includes(p));
              
              if (remainingOptions.length > 0) {
                console.log(`Tentativas automáticas falharam. Existem ${remainingOptions.length} provedores alternativos disponíveis.`);
              }
            }
          }
        }

        // Se imageUrl for nulo ou inválido, usar imagem de backup
        if (!imageUrl || typeof imageUrl !== 'string') {
          console.warn("URL de imagem inválida ou não encontrada na resposta:", imageUrl);
          imageUrl = 'https://placehold.co/600x400/FFDE59/333333?text=Imagem+temporariamente+indisponível';
          isBackupImage = true;
        }
        
        // Se for imagem de backup, registramos isso
        if (isBackupImage || imageUrl.includes('placehold.co')) {
          isBackupImage = true;
        }

        // Verificar se a URL é válida
        const validImageUrl = imageUrl.startsWith('http') ? imageUrl : null;
        if (!validImageUrl) {
          console.error("URL da imagem inválida:", imageUrl);
          throw new Error("URL da imagem inválida");
        }

        // Pré-carregar a imagem com verificação de erros
        return new Promise((resolve) => {
          const img = new window.Image();
          
          img.onload = () => {
            console.log("Imagem pré-carregada com sucesso:", imageUrl);
            resolve({ 
              imageUrl, 
              chapterIndex, 
              isBackup: isBackupImage,
              attemptedProviders
            });
          };
          
          img.onerror = () => {
            console.error("Erro ao pré-carregar imagem - URL inválida ou inacessível:", imageUrl);
            // Fallback to backup image if preloading fails
            resolve({ 
              imageUrl: 'https://placehold.co/600x400/FFDE59/333333?text=Imagem+temporariamente+indisponível', 
              chapterIndex,
              isBackup: true 
            });
          };
          
          img.src = validImageUrl;
          
          // Timeout para não ficar esperando indefinidamente
          setTimeout(() => {
            if (!img.complete) {
              console.warn("Timeout ao carregar imagem:", validImageUrl);
              resolve({ 
                imageUrl: 'https://placehold.co/600x400/FFDE59/333333?text=Tempo+excedido+ao+carregar', 
                chapterIndex,
                isBackup: true 
              });
            }
          }, 10000); // 10 segundos de timeout
        });
      } catch (error) {
        console.error("Erro ao gerar imagem:", error);
        // Use backup image on error
        console.log("Using backup image URL due to error:", error);
        return { 
          imageUrl: 'https://placehold.co/600x400/FFDE59/333333?text=Imagem+temporariamente+indisponível', 
          chapterIndex,
          isBackup: true,
          error: error instanceof Error ? error.message : String(error)
        };
      } finally {
        setImageGenerating(false);
      }
    },
    onSuccess: ({ imageUrl, chapterIndex }) => {
      // Verificar se imageUrl é válida
      if (!imageUrl) {
        console.error('URL de imagem inválida recebida:', imageUrl);
        return;
      }

      console.log('URL de imagem original recebida:', imageUrl);

      // Processar a URL da imagem para garantir formato correto
      let processedUrl = imageUrl;

      // Se imageUrl é um objeto, extrair a URL real
      if (typeof processedUrl === 'object') {
        console.log('imageUrl é um objeto:', processedUrl);
        // @ts-ignore - Tentar extrair a URL de várias propriedades possíveis
        processedUrl = processedUrl.url || processedUrl.imageUrl || processedUrl.src || '';
      }

      // Garantir que processedUrl seja uma string
      if (typeof processedUrl !== 'string') {
        console.error('URL não é uma string após processamento:', processedUrl);
        processedUrl = String(processedUrl);
      }

      // Verificar novamente se temos uma URL válida após a extração
      if (!processedUrl || processedUrl.trim() === '') {
        console.error('Não foi possível extrair uma URL válida:', processedUrl);
        processedUrl = 'https://placehold.co/600x400/FFDE59/333333?text=Imagem+temporariamente+indisponível';
      }

      // Adicionar timestamp à URL da imagem para evitar cache
      processedUrl = processedUrl.includes('?') ? 
        `${processedUrl}&t=${Date.now()}` : 
        `${processedUrl}?t=${Date.now()}`;

      // Verificar se a URL tem extensão de imagem
      if (!processedUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) {
        console.log('URL sem extensão de imagem, adicionando parâmetro content-type');
        processedUrl += '&content-type=image/png';
      }

      // Log da URL processada
      console.log('URL de imagem processada:', processedUrl);

      // Atualizar o cache do TanStack Query para incluir a nova URL da imagem
      try {
        queryClient.setQueryData([`/api/stories/${storyId}`], (oldData: any) => {
          if (!oldData) {
            console.warn('Dados não encontrados no cache para atualização');
            return oldData;
          }
          
          if (!oldData.chapters || !Array.isArray(oldData.chapters)) {
            console.warn('Capítulos não encontrados no cache ou formato inválido:', oldData);
            return oldData;
          }
          
          if (chapterIndex < 0 || chapterIndex >= oldData.chapters.length) {
            console.warn(`Índice de capítulo inválido: ${chapterIndex}, total de capítulos: ${oldData.chapters.length}`);
            return oldData;
          }
          
          // Criar uma cópia profunda dos dados
          const updatedData = JSON.parse(JSON.stringify(oldData));
          const updatedChapters = updatedData.chapters;
          
          // Atualizar o capítulo específico
          updatedChapters[chapterIndex] = {
            ...updatedChapters[chapterIndex],
            imageUrl: processedUrl
          };
          
          console.log(`Cache atualizado para o capítulo ${chapterIndex}:`, processedUrl);
          
          return {
            ...updatedData,
            chapters: updatedChapters
          };
        });
      } catch (cacheError) {
        console.error('Erro ao atualizar cache:', cacheError);
      }

      toast({
        title: "Ilustração gerada",
        description: "A ilustração para este capítulo foi criada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar ilustração",
        description: error.message || "Não foi possível criar a ilustração. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Mutation para gerar todas as ilustrações de uma história
  const generateAllIllustrationsMutation = useMutation({
    mutationFn: async () => {
      if (!story) throw new Error("História não disponível");

      toast({
        title: "Gerando ilustrações",
        description: "Estamos criando ilustrações para todos os capítulos. Isso pode levar alguns instantes.",
      });

      const response = await apiRequest("POST", `/api/stories/${storyId}/generateIllustrations`, {
        options: {
          style: "cartoon",
          mood: "adventure",
          ageGroup: story.ageGroup
        }
      });

      return response as any;
    },
    onSuccess: (response) => {
      // Atualizar o cache com os capítulos atualizados
      if (response && 'chaptersWithImages' in response) {
        queryClient.setQueryData([`/api/stories/${storyId}`], (oldData: any) => {
          if (oldData) {
            return {
              ...oldData,
              chapters: response.chaptersWithImages
            };
          }
          return oldData;
        });

        toast({
          title: "Ilustrações geradas",
          description: `${response.successfulIllustrations || 0} de ${response.totalChapters || 0} ilustrações foram criadas com sucesso!`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar ilustrações",
        description: error.message || "Não foi possível criar as ilustrações. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Update reading session
  const updateSessionMutation = useMutation({
    mutationFn: async (data: { progress: number; completed: boolean }) => {
      if (!childId) return null;

      // Check if session exists first
      const response = await fetch(`/api/reading-sessions/child/${childId}`);
      const sessions = await response.json();
      const existingSession = sessions.find((s: any) => s.storyId === storyId);

      if (existingSession) {
        return apiRequest("PATCH", `/api/reading-sessions/${existingSession.id}`, data);
      } else {
        return apiRequest("POST", "/api/reading-sessions", {
          childId,
          storyId,
          ...data,
        });
      }
    },
  });

  // Set up chapters from the story
  useEffect(() => {
    if (story?.chapters && story.chapters.length > 0) {
      const totalChapters = Math.max(1, story.chapters.length - 1);
      const initialProgress = Math.floor((currentChapter / totalChapters) * 100);
      setProgress(initialProgress);
    }
  }, [story, currentChapter]);

  // Compute if we're in text-only mode (either from props or story data)
  const isTextOnlyMode = propTextOnly || story?.textOnly || false;

  // Auto-generate illustrations when story loads (if not in text-only mode)
  useEffect(() => {
    if (story && !isTextOnlyMode && !generateAllIllustrationsMutation.isPending) {
      // Check if any chapters need illustrations
      const needsIllustrations = story.chapters?.some(chapter => !chapter.imageUrl);

      if (needsIllustrations) {
        console.log("Iniciando geração automática de ilustrações para todos os capítulos");
        generateAllIllustrationsMutation.mutate();
      }
    }
  }, [story, isTextOnlyMode]);

  // Navigation between chapters
  const goToNextChapter = () => {
    if (story?.chapters && currentChapter < story.chapters.length - 1) {
      setCurrentChapter(currentChapter + 1);
      const newProgress = Math.floor(((currentChapter + 1) / (story.chapters.length - 1)) * 100);
      setProgress(newProgress);

      if (childId) {
        updateSessionMutation.mutate({
          progress: newProgress,
          completed: newProgress === 100,
        });
      }
    }
  };

  const goToPrevChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(currentChapter - 1);
      const totalChapters = story?.chapters?.length ? Math.max(1, story.chapters.length - 1) : 1;
      const newProgress = Math.floor(((currentChapter - 1) / totalChapters) * 100);
      setProgress(newProgress);
    }
  };

  if (isLoading || !story) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const chapters = story.chapters || [];
  const currentChapterContent = chapters[currentChapter];

  // Função para obter os nomes dos personagens a partir dos IDs
  const getCharacterNames = () => {
    return (story?.characterIds || [])
      .map(id => {
        const character = characters.find(c => c.id === id);
        return character ? character.name.split(",")[0] : "";
      })
      .filter(name => name.length > 0);
  };

  // Função para gerar ou regenerar a ilustração do capítulo atual
  const generateCurrentChapterImage = (preferredProvider?: string) => {
    if (!currentChapterContent) return;

    // Preparar opções de geração
    const options: any = {
      style: "cartoon",
      mood: "adventure",
      ageGroup: story?.ageGroup,
      storyId: storyId
    };
    
    // Se um provedor preferido foi especificado, incluí-lo nas opções
    if (preferredProvider) {
      options.forceProvider = preferredProvider;
      console.log(`Forçando geração com provedor: ${preferredProvider}`);
    }

    generateImageMutation.mutate({
      chapterIndex: currentChapter,
      chapterTitle: currentChapterContent.title,
      chapterContent: currentChapterContent.content,
      characterNames: getCharacterNames(),
      options
    });
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="storybook-container bg-gradient-to-b from-blue-50 to-white shadow-xl border-4 border-blue-300 rounded-2xl overflow-hidden">
        {/* Header with book style */}
        <div className="storybook-reader-header bg-gradient-to-r from-blue-200 via-purple-100 to-pink-200 px-6 pt-6 pb-4 rounded-t-xl border-b-2 border-blue-300 relative">
          <div className="flex justify-between items-center">
            <div className="relative">
              <h1 className="text-2xl md:text-3xl font-bold text-blue-600 font-heading drop-shadow-sm relative z-10">
                {story.title}
              </h1>
              <div className="absolute -bottom-1 left-0 right-0 h-3 bg-yellow-200 opacity-50 rounded-full z-0"></div>
              <div className="text-blue-700 mt-1">
                {story.characterIds.map((id) => {
                  const character = characters.find((c) => c.id === id);
                  return character?.name.split(",")[0];
                }).join(", ")}
              </div>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <Badge className="text-xs bg-blue-500 text-white">
                {story.ageGroup} anos
              </Badge>
              {isTextOnlyMode && (
                <Badge variant="secondary" className="text-xs">
                  Modo somente texto
                </Badge>
              )}
            </div>
          </div>

          {/* Star decorations */}
          <div className="absolute top-3 right-3 text-yellow-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div className="absolute bottom-3 left-3 text-yellow-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>

          {/* Progress bar with storybook style */}
          <div className="mt-4 relative">
            <div className="h-4 w-full bg-white rounded-full border-2 border-blue-300 shadow-inner overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-blue-600 mt-1 font-medium">
              <span>Capítulo {currentChapter + 1} de {chapters.length}</span>
              <span>{progress}% concluído</span>
            </div>
          </div>
        </div>

        {/* Chapter content with storybook style */}
        <div className="p-6 md:p-8 bg-gradient-to-b from-white to-blue-50 min-h-[40vh]">
          {currentChapterContent && (
            <div className="py-4 relative">
              {/* Decorative corner elements */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-200 rounded-tl-lg -m-2"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-200 rounded-tr-lg -m-2"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-200 rounded-bl-lg -m-2"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-200 rounded-br-lg -m-2"></div>

              {/* Chapter title with decoration */}
              <div className="mb-5 relative">
                <h2 className="text-xl md:text-2xl font-bold text-blue-600 font-heading inline-block relative">
                  {currentChapterContent.title}
                  <div className="absolute -bottom-1 left-0 right-0 h-2 bg-yellow-200 opacity-50 rounded-full"></div>
                </h2>
                {!isTextOnlyMode && (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs flex items-center gap-1 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                      <Image className="h-3 w-3 text-blue-500" /> Ilustrações automáticas
                    </Badge>
                  </div>
                )}
              </div>

              {/* Image display with frame */}
              {!isTextOnlyMode && currentChapterContent.imageUrl ? (
                <div className="mb-8 relative">
                  <div className="absolute inset-0 -m-2 border-4 border-yellow-200 rounded-lg transform rotate-1 z-0"></div>
                  <div className="relative z-10 rounded-lg overflow-hidden border-4 border-blue-300 shadow-md bg-white p-1">
                    <img 
                      src={currentChapterContent.imageUrl} 
                      alt={`Ilustração para ${currentChapterContent.title}`}
                      className="w-full h-auto object-cover rounded-sm"
                      onError={(e) => {
                        console.error("Erro ao carregar imagem:", currentChapterContent.imageUrl);
                        const isBackupImage = currentChapterContent.imageUrl?.includes('placehold.co') || false;
                        
                        if (isBackupImage) {
                          // Já estamos usando uma imagem de backup, manter
                          e.currentTarget.src = 'https://placehold.co/600x400/FFDE59/333333?text=Imagem+temporariamente+indisponível';
                          e.currentTarget.alt = 'Imagem temporariamente indisponível';
                        } else {
                          // Tentar regenerar a imagem automaticamente - apenas uma vez para evitar loop
                          if (!e.currentTarget.dataset.retried) {
                            console.log("Tentando regenerar a imagem que falhou...");
                            e.currentTarget.dataset.retried = "true";
                            
                            // Timeout para evitar recarregamento imediato
                            setTimeout(() => {
                              // Tentar regenerar
                              generateCurrentChapterImage();
                            }, 500);
                            
                            // Enquanto isso, mostrar imagem de fallback
                            e.currentTarget.src = 'https://placehold.co/600x400/e6f7ff/0066cc?text=Tentando+novamente...';
                          } else {
                            // Segunda falha, usar backup definitivo
                            e.currentTarget.src = 'https://placehold.co/600x400/FFDE59/333333?text=Imagem+temporariamente+indisponível';
                            e.currentTarget.alt = 'Imagem temporariamente indisponível';
                          }
                        }
                      }}
                    />
                    <div className="absolute bottom-3 right-3 bg-white/60 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-blue-600">
                      Ilustração do capítulo
                    </div>
                    {!currentChapterContent.imageUrl?.includes('placehold.co') && (
                      <button 
                        onClick={generateCurrentChapterImage}
                        className="absolute top-3 right-3 bg-white/70 hover:bg-white/90 backdrop-blur-sm p-1.5 rounded-full text-blue-600 transition-all"
                        title="Regenerar ilustração"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : !isTextOnlyMode && (imageGenerating || generateImageMutation.isPending) ? (
                <div className="mb-8 flex items-center justify-center bg-blue-50 h-64 rounded-lg border-4 border-blue-200 shadow-inner">
                  <div className="text-center">
                    <RefreshCw className="h-10 w-10 animate-spin mx-auto mb-2 text-blue-400" />
                    <p className="text-blue-600 font-medium">Desenhando a ilustração mágica...</p>
                  </div>
                </div>
              ) : !isTextOnlyMode ? (
                <div className="mb-8 flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50 h-64 rounded-lg border-2 border-dashed border-blue-300">
                  <div className="text-center space-y-3 p-4">
                    <div className="relative w-full h-3 bg-white rounded-full overflow-hidden border border-blue-200 mb-2">
                      <div className="absolute top-0 left-0 bg-gradient-to-r from-blue-400 to-purple-400 h-full w-1/3 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-sm text-blue-600">Nossa fada ilustradora está desenhando esta cena...</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                      onClick={generateCurrentChapterImage}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Ilustrar agora
                    </Button>
                  </div>
                </div>
              ) : null}

              {/* Story content with styled paragraphs */}
              <div className="font-reading text-lg space-y-5 leading-relaxed text-slate-700 bg-white/50 p-5 rounded-lg border border-blue-100 shadow-inner">
                {currentChapterContent.content.split("\n\n").map((paragraph, index) => (
                  <p key={index} className={index === 0 ? "first-letter:text-2xl first-letter:font-bold first-letter:text-blue-600" : ""}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation with storybook style buttons */}
        <div className="bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 p-6 border-t-2 border-blue-200 flex justify-between">
          <Button
            variant="outline"
            onClick={goToPrevChapter}
            disabled={currentChapter === 0}
            className="flex items-center bg-white border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:bg-gray-100"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Capítulo Anterior
          </Button>

          {currentChapter === chapters.length - 1 ? (
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-md font-medium" asChild>
              <Link href="/stories">
                Concluir Leitura ✨
              </Link>
            </Button>
          ) : (
            <Button
              onClick={goToNextChapter}
              className="flex items-center bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-md font-medium"
            >
              Próximo Capítulo <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Story information card with storybook style */}
      <div className="mt-8 border-2 border-blue-200 rounded-xl p-6 bg-gradient-to-r from-blue-50 to-purple-50 shadow-md">
        <h3 className="text-lg font-bold mb-3 text-blue-600 font-heading flex items-center">
          <svg className="w-5 h-5 mr-2 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Sobre esta História
        </h3>
        <div className="space-y-3 text-sm ml-2">
          <p className="bg-white/70 p-3 rounded-lg border border-blue-100 shadow-sm">
            <span className="font-semibold text-blue-600">Resumo:</span> {story.summary || "Uma aventura mágica cheia de descobertas."}
          </p>
          <p className="bg-white/70 p-3 rounded-lg border border-blue-100 shadow-sm">
            <span className="font-semibold text-blue-600">Tempo de leitura:</span> {story.readingTime ? formatReadingTime(story.readingTime) : "5 minutos"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StoryReader;