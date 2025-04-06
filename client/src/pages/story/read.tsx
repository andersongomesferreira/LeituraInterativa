import React from "react";
import { useRoute } from "wouter";
import StoryReader from "@/components/wizard/story-reader";

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

  if (!storyId) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold text-red-500">História não encontrada</h1>
        <p className="mt-4">O ID da história não foi fornecido ou é inválido.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <StoryReader storyId={storyId} />
    </div>
  );
};

export default ReadStoryPage;