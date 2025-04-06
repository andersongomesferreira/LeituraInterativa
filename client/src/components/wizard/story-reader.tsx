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

const StoryReader = ({ storyId, childId, textOnly = false }: StoryReaderProps) => {
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
    mutationFn: async ({ chapterIndex, chapterTitle, chapterContent, characterNames }: { 
      chapterIndex: number, 
      chapterTitle: string, 
      chapterContent: string,
      characterNames: string[]
    }) => {
      setImageGenerating(true);
      
      try {
        // Tentar usar o prompt de imagem do capítulo, ou gerar baseado no conteúdo
        const promptSource = story?.chapters?.[chapterIndex]?.imagePrompt || 
          `Ilustração para o capítulo "${chapterTitle}": ${chapterContent.substring(0, 200)}`;
          
        const payload = {
          chapterTitle,
          chapterContent,
          characters: characterNames,
          options: {
            style: "cartoon",
            mood: "adventure",
            ageGroup: story?.ageGroup
          }
        };
        
        const response = await apiRequest("POST", "/api/stories/generateChapterImage", payload);
        return { response, chapterIndex };
      } catch (error) {
        console.error("Erro ao gerar imagem:", error);
        throw error;
      } finally {
        setImageGenerating(false);
      }
    },
    onSuccess: ({ response, chapterIndex }) => {
      if (response && response.imageUrl) {
        // Atualizar o cache do TanStack Query para incluir a nova URL da imagem
        queryClient.setQueryData([`/api/stories/${storyId}`], (oldData: any) => {
          if (oldData && oldData.chapters && oldData.chapters[chapterIndex]) {
            const updatedChapters = [...oldData.chapters];
            updatedChapters[chapterIndex] = {
              ...updatedChapters[chapterIndex],
              imageUrl: response.imageUrl
            };
            
            return {
              ...oldData,
              chapters: updatedChapters
            };
          }
          return oldData;
        });
        
        toast({
          title: "Ilustração gerada",
          description: "A ilustração para este capítulo foi criada com sucesso!",
        });
      }
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
      
      return response;
    },
    onSuccess: (response) => {
      // Atualizar o cache com os capítulos atualizados
      if (response && response.chaptersWithImages) {
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
          description: `${response.successfulIllustrations} de ${response.totalChapters} ilustrações foram criadas com sucesso!`,
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
  const generateCurrentChapterImage = () => {
    if (!currentChapterContent) return;
    
    generateImageMutation.mutate({
      chapterIndex: currentChapter,
      chapterTitle: currentChapterContent.title,
      chapterContent: currentChapterContent.content,
      characterNames: getCharacterNames()
    });
  };

  return (
    <div className="container max-w-4xl py-8">
      <Card className="shadow-lg">
        <CardHeader className="bg-primary/10 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold text-primary">{story.title}</CardTitle>
              <CardDescription>
                {story.characterIds.map((id) => {
                  const character = characters.find((c) => c.id === id);
                  return character?.name.split(",")[0];
                }).join(", ")}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {story.ageGroup} anos
            </Badge>
          </div>
          
          <Progress value={progress} className="h-2 mt-4" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Capítulo {currentChapter + 1} de {chapters.length}</span>
            <span>{progress}% concluído</span>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 px-8">
          {currentChapterContent && (
            <div className="py-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-primary">
                  {currentChapterContent.title}
                </h2>
                {!textOnly && (
                  <div className="flex space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={generateCurrentChapterImage}
                            disabled={imageGenerating || generateImageMutation.isPending}
                          >
                            {imageGenerating || generateImageMutation.isPending ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Image className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Gerar ilustração para este capítulo</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => generateAllIllustrationsMutation.mutate()}
                            disabled={generateAllIllustrationsMutation.isPending}
                            className="text-xs"
                          >
                            {generateAllIllustrationsMutation.isPending ? (
                              <>
                                <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                                Gerando...
                              </>
                            ) : (
                              <>
                                <Image className="mr-1 h-3 w-3" />
                                Gerar todas as ilustrações
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Gerar ilustrações para todos os capítulos da história</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
              
              {!textOnly && currentChapterContent.imageUrl ? (
                <div className="mb-6 rounded-lg overflow-hidden shadow-md">
                  <img 
                    src={currentChapterContent.imageUrl} 
                    alt={`Ilustração para ${currentChapterContent.title}`}
                    className="w-full h-auto object-cover"
                  />
                </div>
              ) : !textOnly && (imageGenerating || generateImageMutation.isPending) ? (
                <div className="mb-6 flex items-center justify-center bg-muted h-64 rounded-lg">
                  <div className="text-center">
                    <RefreshCw className="h-10 w-10 animate-spin mx-auto mb-2 text-primary/60" />
                    <p className="text-muted-foreground">Gerando ilustração...</p>
                  </div>
                </div>
              ) : !textOnly ? (
                <div className="mb-6 flex items-center justify-center bg-muted/30 border border-dashed border-muted-foreground/50 h-64 rounded-lg">
                  <div className="text-center space-y-3">
                    <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                      <div className="absolute inset-0 bg-primary/20 w-full h-full opacity-20"></div>
                      <div className="absolute top-0 left-0 bg-primary h-full w-1/3 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-sm text-muted-foreground">Ilustração sendo gerada automaticamente...</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={generateCurrentChapterImage}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Gerar agora
                    </Button>
                  </div>
                </div>
              ) : null}
              
              <div className="font-reading text-lg space-y-4 leading-relaxed">
                {currentChapterContent.content.split("\n\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between px-8 py-4 bg-muted/20">
          <Button
            variant="outline"
            onClick={goToPrevChapter}
            disabled={currentChapter === 0}
            className="flex items-center"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Capítulo Anterior
          </Button>
          
          {currentChapter === chapters.length - 1 ? (
            <Button asChild>
              <Link href="/stories">
                Concluir Leitura
              </Link>
            </Button>
          ) : (
            <Button
              onClick={goToNextChapter}
              className="flex items-center"
            >
              Próximo Capítulo <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <div className="mt-6 bg-accent/20 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-3">Sobre esta História</h3>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-semibold">Resumo:</span> {story.summary || "Uma aventura mágica cheia de descobertas."}
          </p>
          <p>
            <span className="font-semibold">Tempo de leitura:</span> {story.readingTime ? formatReadingTime(story.readingTime) : "5 minutos"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StoryReader;