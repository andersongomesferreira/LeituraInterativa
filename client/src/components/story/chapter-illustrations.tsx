import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { SparklesIcon, ImageIcon, AlertCircle, CheckCircle, LoaderCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Chapter {
  title: string;
  content: string;
  imagePrompt?: string;
  imageUrl?: string;
}

interface Character {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
}

interface ChapterIllustrationsProps {
  storyId: number;
  chapters: Chapter[];
  characters: Character[];
  ageGroup: string;
  onIllustrationsGenerated?: (updatedChapters: Chapter[]) => void;
}

interface ImageOptions {
  style?: "cartoon" | "watercolor" | "pencil" | "digital";
  mood?: "happy" | "adventure" | "calm" | "exciting";
  ageGroup?: string;
}

const ChapterIllustrations = ({
  storyId,
  chapters,
  characters,
  ageGroup,
  onIllustrationsGenerated
}: ChapterIllustrationsProps) => {
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedStyle, setSelectedStyle] = useState<string>("cartoon");
  const [selectedMood, setSelectedMood] = useState<string>("happy");
  const { toast } = useToast();

  // Utilidade para garantir que temos uma URL de imagem válida
  const ensureValidImageUrl = (imageUrl: any): string => {
    if (!imageUrl) {
      console.warn('URL de imagem vazia ou nula');
      return '';
    }
    
    if (typeof imageUrl === 'string') {
      // Se é uma string, validar se parece uma URL
      if (imageUrl.startsWith('http')) {
        return imageUrl;
      } else {
        console.warn('URL de imagem inválida (não começa com http):', imageUrl);
        return '';
      }
    } else if (imageUrl && typeof imageUrl === 'object') {
      // Tentar extrair a URL do objeto
      console.log('Objeto de imagem encontrado:', JSON.stringify(imageUrl, null, 2));
      
      // @ts-ignore - Tentar várias propriedades comuns onde a URL pode estar
      const extractedUrl = imageUrl.url || imageUrl.imageUrl || imageUrl.src || imageUrl.uri || 
                          (imageUrl.data && imageUrl.data.imageUrl) || '';
      
      if (extractedUrl && typeof extractedUrl === 'string' && extractedUrl.startsWith('http')) {
        return extractedUrl;
      } else {
        console.warn('URL extraída do objeto é inválida:', extractedUrl);
        return '';
      }
    }
    
    console.warn('Formato de imageUrl desconhecido:', typeof imageUrl);
    return '';
  };

  const generateIllustrationsMutation = useMutation({
    mutationFn: async () => {
      const options: ImageOptions = {
        style: selectedStyle as any,
        mood: selectedMood as any,
        ageGroup
      };

      const response = await apiRequest(
        "POST",
        `/api/stories/${storyId}/generateIllustrations`,
        { options }
      );
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.status === "processing") {
        // Nova resposta assíncrona - mostrar que o processamento está em andamento
        toast({
          title: "Gerando ilustrações em segundo plano",
          description: "As ilustrações estão sendo geradas e aparecerão automaticamente. Você pode continuar a leitura enquanto isso.",
          variant: "default",
          duration: 5000,
        });
        
        // Criar um timeout para verificar o status após alguns segundos (opcional)
        setTimeout(() => {
          // Atualização simulada - na implementação completa, poderíamos implementar um endpoint para verificar o status
          const placeholderChaptersWithImages = [...chapters];
          // Adicionar URLs de imagem de placeholder ou outro indicador visual
          if (onIllustrationsGenerated) {
            onIllustrationsGenerated(placeholderChaptersWithImages);
          }
        }, 3000);
        
      } else if (data.successfulIllustrations > 0) {
        // Resposta antiga/síncrona
        toast({
          title: "Ilustrações geradas com sucesso",
          description: `${data.successfulIllustrations} de ${data.totalChapters} ilustrações foram geradas.`,
          variant: "default",
        });
        
        if (onIllustrationsGenerated && data.chaptersWithImages) {
          onIllustrationsGenerated(data.chaptersWithImages);
        }
      } else {
        toast({
          title: "Nenhuma ilustração gerada",
          description: "Tente novamente com outras configurações.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar ilustrações",
        description: error.message || "Ocorreu um erro desconhecido.",
        variant: "destructive",
      });
    },
  });

  const generateSingleIllustrationMutation = useMutation({
    mutationFn: async (chapterIndex: number) => {
      const chapter = chapters[chapterIndex];
      const options: ImageOptions = {
        style: selectedStyle as any,
        mood: selectedMood as any,
        ageGroup
      };

      const characterNames = characters.map(char => char.name);
      
      console.log(`[DEBUG] Iniciando geração de imagem para capítulo "${chapter.title}"`);
      console.log(`[DEBUG] Enviando requisição para API para o storyId ${storyId} e chapterIndex ${chapterIndex}`);
      
      try {
        // Usar a nova rota com parâmetros na URL em vez de body
        const response = await apiRequest(
          "POST",
          `/api/stories/generateChapterImage/${storyId}/${chapterIndex}`,
          {} // Não precisa de body, os parâmetros estão na URL
        );
        
        const responseData = await response.json();
        console.log(`[DEBUG] Resposta da API de geração de imagem:`, responseData);
        
        // Verificar se a resposta contém um objeto imageUrl
        if (responseData.imageUrl && typeof responseData.imageUrl === 'object') {
          console.log(`[DEBUG] Campo imageUrl é um objeto:`, responseData.imageUrl);
        }
        
        // Verificar status e códigos de erro
        if (!responseData.success) {
          console.error(`[DEBUG] Erro na geração de imagem:`, responseData.error || 'Erro desconhecido');
          
          // Se a resposta contiver uma URL de imagem mesmo com success=false, ainda podemos usá-la (é um fallback)
          if (!responseData.imageUrl) {
            throw new Error(responseData.message || "Falha ao gerar imagem");
          }
        }
        
        return {
          result: responseData,
          chapterIndex
        };
      } catch (error) {
        console.error(`[DEBUG] Exceção ao chamar API de geração de imagem:`, error);
        throw error;
      }
    },
    onSuccess: (data) => {
      const { result, chapterIndex } = data;
      
      console.log(`[DEBUG] Processando resposta para o capítulo ${chapterIndex + 1}:`, result);
      
      // Verificar se temos uma imageUrl, mesmo se success=false (pode ser uma imagem de fallback)
      if (result.imageUrl) {
        console.log(`[DEBUG] Tipo de imageUrl:`, typeof result.imageUrl);
        console.log(`[DEBUG] Conteúdo de imageUrl:`, result.imageUrl);
        
        // Verificar se a resposta contém um objeto em vez de uma string URL
        let imageUrlToUse = result.imageUrl;
        if (typeof imageUrlToUse === 'object') {
          console.log(`[DEBUG] imageUrl é um objeto, tentando extrair URL:`, imageUrlToUse);
          // @ts-ignore - Extrair URL de diferentes propriedades possíveis
          imageUrlToUse = imageUrlToUse.url || imageUrlToUse.imageUrl || imageUrlToUse.src || '';
        }
        
        // Determinar a mensagem de toast com base no sucesso
        const toastTitle = result.success 
          ? "Ilustração gerada com sucesso" 
          : "Usando imagem de fallback";
        const toastDesc = result.success
          ? `A ilustração para "${chapters[chapterIndex].title}" foi criada.`
          : `Não foi possível gerar uma ilustração personalizada. Usando uma imagem padrão.`;
        const toastVariant = result.success ? "default" : "warning";
        
        toast({
          title: toastTitle,
          description: toastDesc,
          variant: toastVariant as any,
        });
        
        // Usar a função utilitária para garantir uma URL válida
        const imageUrlString = ensureValidImageUrl(imageUrlToUse);
        console.log(`[DEBUG] URL final após processamento:`, imageUrlString);
        
        // Atualizar o capítulo com a nova imagem, mesmo se for fallback
        const updatedChapters = [...chapters];
        updatedChapters[chapterIndex] = {
          ...updatedChapters[chapterIndex],
          imageUrl: imageUrlString
        };
        
        if (onIllustrationsGenerated) {
          onIllustrationsGenerated(updatedChapters);
        }
      } else {
        toast({
          title: "Erro ao gerar ilustração",
          description: result.message || "Não foi possível criar a ilustração.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar ilustração",
        description: error.message || "Ocorreu um erro desconhecido.",
        variant: "destructive",
      });
    },
  });

  const isAllGenerating = generateIllustrationsMutation.isPending;
  const isAnyGenerating = isAllGenerating || generateSingleIllustrationMutation.isPending;

  const styleOptions = [
    { value: "cartoon", label: "Cartoon" },
    { value: "watercolor", label: "Aquarela" },
    { value: "pencil", label: "Lápis" },
    { value: "digital", label: "Digital" }
  ];

  const moodOptions = [
    { value: "happy", label: "Feliz" },
    { value: "adventure", label: "Aventura" },
    { value: "calm", label: "Calmo" },
    { value: "exciting", label: "Emocionante" }
  ];

  return (
    <div className="rounded-xl bg-white shadow-lg p-4 md:p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-primary mb-2">Ilustrações dos Capítulos</h3>
        <p className="text-muted-foreground">
          Gere ilustrações personalizadas para cada capítulo da história.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Estilo de Ilustração</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {styleOptions.map(option => (
                <Badge 
                  key={option.value}
                  variant={selectedStyle === option.value ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1 text-sm"
                  onClick={() => setSelectedStyle(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Clima da Ilustração</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {moodOptions.map(option => (
                <Badge 
                  key={option.value}
                  variant={selectedMood === option.value ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1 text-sm"
                  onClick={() => setSelectedMood(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Button 
          onClick={() => generateIllustrationsMutation.mutate()}
          disabled={isAnyGenerating || chapters.length === 0}
          className="bg-primary hover:bg-primary-dark w-full"
        >
          {isAllGenerating ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Gerando todas as ilustrações...
            </>
          ) : (
            <>
              <SparklesIcon className="mr-2 h-4 w-4" />
              Gerar ilustrações para todos os capítulos
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="all" className="flex-1">Todos os Capítulos</TabsTrigger>
          <TabsTrigger value="missing" className="flex-1">Sem Ilustração</TabsTrigger>
          <TabsTrigger value="with-image" className="flex-1">Com Ilustração</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <ChapterList 
            chapters={chapters}
            onGenerateImage={(index) => generateSingleIllustrationMutation.mutate(index)}
            isGenerating={isAnyGenerating}
          />
        </TabsContent>
        
        <TabsContent value="missing" className="mt-0">
          <ChapterList 
            chapters={chapters.filter(chapter => !chapter.imageUrl)}
            onGenerateImage={(index) => {
              // Precisa mapear de volta para o índice original
              const originalIndex = chapters.findIndex(
                chapter => chapter.title === chapters.filter(c => !c.imageUrl)[index].title
              );
              generateSingleIllustrationMutation.mutate(originalIndex);
            }}
            isGenerating={isAnyGenerating}
          />
        </TabsContent>
        
        <TabsContent value="with-image" className="mt-0">
          <ChapterList 
            chapters={chapters.filter(chapter => chapter.imageUrl)}
            onGenerateImage={(index) => {
              // Precisa mapear de volta para o índice original
              const originalIndex = chapters.findIndex(
                chapter => chapter.title === chapters.filter(c => c.imageUrl)[index].title
              );
              generateSingleIllustrationMutation.mutate(originalIndex);
            }}
            isGenerating={isAnyGenerating}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface ChapterListProps {
  chapters: Chapter[];
  onGenerateImage: (index: number) => void;
  isGenerating: boolean;
}

const ChapterList = ({ chapters, onGenerateImage, isGenerating }: ChapterListProps) => {
  // Utilidade para garantir que temos uma URL de imagem válida
  const ensureValidImageUrl = (imageUrl: any): string => {
    if (!imageUrl) {
      console.log('[DEBUG] URL de imagem nula ou indefinida');
      return 'https://placehold.co/600x400/e6e6e6/999999?text=Sem+imagem+disponível';
    }
    
    if (typeof imageUrl === 'string') {
      return imageUrl.trim();
    } else if (typeof imageUrl === 'object') {
      // Tentar extrair a URL do objeto
      console.log('[DEBUG] Objeto de imagem encontrado:', imageUrl);
      try {
        // Verificar propriedades comuns onde poderia estar a URL
        const possibleUrls = [
          imageUrl.url,
          imageUrl.imageUrl,
          imageUrl.src,
          imageUrl.uri,
          imageUrl.href
        ];
        
        // Usar a primeira URL válida encontrada
        for (const url of possibleUrls) {
          if (url && typeof url === 'string' && url.trim().length > 0) {
            console.log('[DEBUG] URL válida encontrada em propriedade:', url);
            return url.trim();
          }
        }
        
        // Se chegou aqui, tenta serializar o objeto para verificação
        const serialized = JSON.stringify(imageUrl);
        console.log('[DEBUG] Objeto serializado:', serialized);
        
        // Tenta encontrar URL no formato de string serializada
        const urlMatch = serialized.match(/https?:\/\/[^"']+/);
        if (urlMatch) {
          console.log('[DEBUG] URL encontrada na serialização:', urlMatch[0]);
          return urlMatch[0];
        }
      } catch (e) {
        console.error('[DEBUG] Erro ao processar objeto de imagem:', e);
      }
      
      // Fallback para placeholder
      return 'https://placehold.co/600x400/e6e6e6/999999?text=Formato+inválido';
    }
    
    return 'https://placehold.co/600x400/e6e6e6/999999?text=Sem+imagem+disponível';
  };

  // Função para lidar com erro de carregamento de imagem
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, index: number) => {
    console.error('[DEBUG] Erro ao carregar imagem:', {
      chapter: chapters[index]?.title,
      imageUrl: chapters[index]?.imageUrl
    });
    
    // Definir uma imagem de fallback quando a imagem falhar ao carregar
    e.currentTarget.src = 'https://placehold.co/600x400/e6e6e6/999999?text=Erro+ao+carregar+imagem';
    
    // Opcional: você pode querer notificar o componente pai sobre o erro
    // ou tentar regenerar a imagem automaticamente
  };

  if (chapters.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>Nenhum capítulo encontrado nesta categoria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {chapters.map((chapter, index) => {
        // Garantir que temos uma URL válida para a imagem
        const validImageUrl = ensureValidImageUrl(chapter.imageUrl);
        
        return (
          <Card key={index} className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 bg-accent-light relative min-h-[150px]">
                {validImageUrl ? (
                  <img 
                    src={validImageUrl}
                    alt={chapter.title}
                    className="w-full h-full object-cover aspect-square" 
                    onError={(e) => handleImageError(e, index)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-accent p-4">
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="mx-auto h-12 w-12 mb-2 opacity-50" />
                      <p className="text-sm">Sem ilustração</p>
                    </div>
                  </div>
                )}
                {validImageUrl && (
                  <Badge variant="secondary" className="absolute top-2 right-2 bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Gerada
                  </Badge>
                )}
              </div>
              
              <div className="md:col-span-2 p-4">
                <h4 className="font-heading font-bold text-lg text-primary mb-2">{chapter.title}</h4>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {chapter.content.substring(0, 150)}...
                </p>
                <Button
                  onClick={() => onGenerateImage(index)}
                  disabled={isGenerating}
                  variant={validImageUrl ? "outline" : "default"}
                  size="sm"
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <LoaderCircle className="mr-2 h-3 w-3 animate-spin" />
                      Gerando...
                    </>
                  ) : validImageUrl ? (
                    "Gerar novamente"
                  ) : (
                    "Gerar ilustração"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ChapterIllustrations;