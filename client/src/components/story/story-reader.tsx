const generateCurrentChapterImage = async () => {
  if (!story || !storyId || !chapters || chapters.length === 0 || currentChapter === null) {
    return;
  }

  const chapter = chapters[currentChapter];
  setIsGeneratingImage(true);

  try {
    console.log(`Gerando imagem para capítulo atual: ${chapter.title}`);
    
    // Use a rota antiga que restauramos no servidor (compatibilidade)
    const response = await apiRequest(
      "POST",
      "/api/stories/generateChapterImage",
      {
        chapterTitle: chapter.title,
        chapterContent: chapter.content,
        characters: story.characters?.map(c => c.name) || [],
        options: {
          style: story.illustrationStyle || "cartoon",
          ageGroup: story.ageGroup || "6-8",
          storyId: parseInt(storyId)
        }
      }
    );
    
    console.log("Resposta da geração de imagem:", response);

    if (response.success && response.imageUrl) {
      // Criar uma cópia dos capítulos atuais
      const updatedChapters = [...chapters];
      updatedChapters[currentChapter] = {
        ...updatedChapters[currentChapter],
        imageUrl: response.imageUrl
      };
      
      // Atualizar o estado dos capítulos com a nova imagem
      setChapters(updatedChapters);
      
      // Registrar a atualização no servidor (opcional, se tiver uma API para isso)
      try {
        await apiRequest(
          "PUT",
          `/api/stories/${storyId}/chapters/${currentChapter}`,
          { imageUrl: response.imageUrl }
        );
        console.log("Imagem salva no servidor com sucesso");
      } catch (saveError) {
        console.error("Erro ao salvar imagem no servidor:", saveError);
        // Continue mesmo se falhar o salvamento no servidor
      }
      
      toast({
        title: "Ilustração gerada com sucesso",
        description: "A ilustração para este capítulo foi criada.",
        variant: "default",
      });
    } else {
      console.error("Erro na resposta da geração de imagem:", response);
      toast({
        title: "Erro ao gerar ilustração",
        description: response.message || "Não foi possível criar a ilustração.",
        variant: "destructive",
      });
    }
  } catch (error) {
    console.error("Erro ao gerar imagem:", error);
    toast({
      title: "Erro ao gerar ilustração",
      description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      variant: "destructive",
    });
  } finally {
    setIsGeneratingImage(false);
  }
}; 