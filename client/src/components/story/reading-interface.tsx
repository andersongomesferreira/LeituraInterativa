import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { formatReadingTime } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  BookmarkPlus,
  Share2,
} from "lucide-react";

interface Story {
  id: number;
  title: string;
  content: string;
  ageGroup: string;
  imageUrl: string;
  characterIds: number[];
  themeId: number;
  summary?: string;
  readingTime?: number;
}

interface ReadingInterfaceProps {
  storyId: number;
  childId?: number;
}

const ReadingInterface = ({ storyId, childId }: ReadingInterfaceProps) => {
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // Fetch story details
  const { data: story, isLoading } = useQuery<Story>({
    queryKey: [`/api/stories/${storyId}`],
  });

  // Fetch characters
  interface Character {
    id: number;
    name: string;
    description: string;
  }
  
  const { data: characters = [] } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
    enabled: !!story,
  });

  // Split story content into pages
  const pages = story?.content
    ? story.content
        .split("\n\n")
        .filter((p) => p.trim().length > 0)
        .map((p) => p.trim())
    : [];

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

  // Handle page navigation
  const goToNextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
      const newProgress = Math.round(((currentPage + 1) / (pages.length - 1)) * 100);
      setProgress(newProgress);
      
      if (childId) {
        updateSessionMutation.mutate({
          progress: newProgress,
          completed: newProgress === 100,
        });
      }
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      const newProgress = Math.round(((currentPage - 1) / (pages.length - 1)) * 100);
      setProgress(newProgress);
    }
  };

  // Remove word highlighting effect

  if (isLoading || !story) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/2 p-4">
          <div className="bg-neutral-100 rounded-xl p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-heading font-bold text-xl text-primary">{story.title}</h3>
                <p className="text-sm text-neutral-600">
                  {story.characterIds.map((id) => {
                    const character = characters.find((c) => c.id === id);
                    return character?.name.split(",")[0];
                  }).join(", ")}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <BookmarkPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative mb-6">
              <div className="absolute -top-2 -right-2 bg-accent text-neutral-800 rounded-full w-10 h-10 flex items-center justify-center shadow-md font-bold animate-[wiggle_1s_ease-in-out_infinite]">
                {currentPage + 1}/{pages.length}
              </div>
              <div
                className="w-full h-48 rounded-lg bg-center bg-cover"
                style={{
                  backgroundImage: story.imageUrl
                    ? `url(${story.imageUrl})`
                    : "url('https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=500&q=80')",
                }}
              ></div>
            </div>

            <div className="font-reading text-lg mb-6 leading-relaxed flex-grow">
              {pages[currentPage] ? (
                <p>{pages[currentPage]}</p>
              ) : (
                <p>Carregando história...</p>
              )}
            </div>

            <div className="flex justify-between mt-auto">
              <Button
                variant="outline"
                className="flex items-center"
                onClick={goToPrevPage}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
              </Button>
              <Button
                variant="default"
                className="bg-primary hover:bg-primary-dark flex items-center"
                onClick={goToNextPage}
                disabled={currentPage === pages.length - 1}
              >
                Próxima <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="md:w-1/2 p-4">
          <div className="bg-accent-light rounded-xl p-6 h-full flex flex-col">
            <h3 className="font-heading font-bold text-xl mb-4">Recursos Interativos</h3>

            <Card className="mb-4 shadow-md">
              <CardContent className="p-4">
                <h4 className="font-heading font-bold mb-2">Experiência de Leitura</h4>
                <div className="bg-accent-light p-3 rounded-lg mb-3">
                  <p className="text-sm">
                    Aproveite a experiência de leitura com ilustrações coloridas e design adequado para crianças.
                  </p>
                </div>
                
                <div className="p-3 border rounded-lg bg-white">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Recursos Visuais</span>
                    <Badge variant="outline" className="text-xs">Divertido</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-accent mr-2"></div>
                      <span>Ilustrações coloridas</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-secondary mr-2"></div>
                      <span>Layout amigável</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    Interface adaptada para leitores infantis, com foco em facilidade e diversão.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-4 shadow-md">
              <CardContent className="p-4">
                <h4 className="font-heading font-bold mb-2">Progresso da Leitura</h4>
                <div className="mb-2">
                  <Progress value={progress} className="h-2" max={100} />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{progress}% concluído</span>
                  <span>{story.readingTime ? formatReadingTime(story.readingTime) : "5 minutos"} de leitura</span>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-4 shadow-md">
              <CardContent className="p-4">
                <h4 className="font-heading font-bold mb-2">Sobre esta História</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Faixa etária:</span>
                    <Badge variant="outline" className="font-heading">
                      {story.ageGroup} anos
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Páginas:</span>
                    <span className="font-medium">{pages.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Resumo:</span>
                    <p className="mt-1">{story.summary || "Uma aventura mágica cheia de descobertas."}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-auto">
              <Button asChild className="w-full bg-secondary hover:bg-secondary-dark text-white py-3 rounded-lg font-bold flex items-center justify-center">
                <Link href="/story/create">
                  <a>Criar Nova História</a>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingInterface;
