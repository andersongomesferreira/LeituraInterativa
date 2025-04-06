import React from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import StoryReader from "@/components/wizard/story-reader";

interface Story {
  id: number;
  textOnly?: boolean;
}

const ReadStoryPage = () => {
  // Capturar ambos os formatos de rota
  const [matchStories] = useRoute<{ id: string }>("/stories/:id");
  const [matchStoryRead] = useRoute<{ id: string }>("/story/read/:id");
  
  // Extrair os parâmetros da URL
  const [, paramsStories] = useRoute<{ id: string }>("/stories/:id");
  const [, paramsStoryRead] = useRoute<{ id: string }>("/story/read/:id");
  
  // Usar os parâmetros do caminho que corresponder
  const params = matchStoryRead ? paramsStoryRead : paramsStories;
  const storyId = params?.id ? parseInt(params.id) : 0;
  
  // Fetch story metadata to determine if it's text-only
  const { data: story, isLoading } = useQuery<Story>({
    queryKey: [`/api/stories/${storyId}`],
    enabled: !!storyId
  });
  
  if (!storyId) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold text-red-500">História não encontrada</h1>
        <p className="mt-4">O ID da história não foi fornecido ou é inválido.</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <StoryReader storyId={storyId} textOnly={story?.textOnly} />
    </div>
  );
};

export default ReadStoryPage;