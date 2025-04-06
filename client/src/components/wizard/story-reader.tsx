import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { formatReadingTime } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
}

const StoryReader = ({ storyId, childId }: StoryReaderProps) => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [progress, setProgress] = useState(0);

  // Fetch story details
  const { data: story, isLoading } = useQuery<Story>({
    queryKey: [`/api/stories/${storyId}`]
  });
  
  // Fetch characters
  const { data: characters = [] } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
    enabled: !!story,
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
              <h2 className="text-xl font-bold mb-5 text-primary">
                {currentChapterContent.title}
              </h2>
              
              {currentChapterContent.imageUrl && (
                <div className="mb-6 rounded-lg overflow-hidden shadow-md">
                  <img 
                    src={currentChapterContent.imageUrl} 
                    alt={`Ilustração para ${currentChapterContent.title}`}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}
              
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