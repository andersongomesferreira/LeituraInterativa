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

    console.log(`Resposta da geração de imagem:`, response);

    // Extrair a URL da imagem de diferentes formatos de resposta
    let imageUrl = null;

    if (typeof response === 'string') {
      imageUrl = response;
    } else if (typeof response === 'object') {
      // Tratamento mais robusto para diferentes formatos de resposta
      imageUrl = response.imageUrl || response.url || 
                (response.success && response.data?.imageUrl) || 
                (response.result && response.result.imageUrl);
      
      // Log detalhado para depuração
      console.log('Objeto de resposta recebido:', response);
      console.log('URL de imagem extraída:', imageUrl);
      
      // Verificar se a URL é um objeto em vez de string (problema comum)
      if (imageUrl && typeof imageUrl === 'object') {
        console.log('URL de imagem é um objeto:', imageUrl);
        // @ts-ignore
        imageUrl = imageUrl.url || imageUrl.imageUrl || imageUrl.src || '';
      }
    }

    if (imageUrl) {
      try {
        // Usar window.Image em vez de Image diretamente
        const img = new window.Image();
        img.src = imageUrl;
        console.log("Pré-carregando imagem:", imageUrl);
      } catch (imgError) {
        console.error("Erro ao pré-carregar imagem:", imgError);
      }
      const updatedChapters = [...chapters];
      updatedChapters[currentChapter] = {
        ...updatedChapters[currentChapter],
        imageUrl: imageUrl
      };

      // Atualizar o estado dos capítulos com a nova imagem
      setChapters(updatedChapters);

      // Registrar a atualização no servidor (opcional, se tiver uma API para isso)
      try {
        await apiRequest(
          "PUT",
          `/api/stories/${storyId}/chapters/${currentChapter}`,
          { imageUrl: imageUrl }
        );
        console.log("Imagem salva no servidor com sucesso");
      } catch (saveError) {
        console.error("Erro ao salvar imagem no servidor:", saveError);
        // Continue mesmo se falhar o salvamento no servidor
      }

      toast({
        title: "Ilustração criada!",
        description: "A imagem para este capítulo foi gerada com sucesso.",
        variant: "default",
      });
    } else {
      console.error("Resposta sem URL de imagem:", response);
      toast({
        title: "Erro ao gerar ilustração",
        description: "Não foi possível obter a URL da imagem.",
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

// ... other code ...

{chapter.imageUrl && (
      <div className="mx-auto my-6 w-full max-w-3xl rounded-xl overflow-hidden">
        <img
          src={chapter.imageUrl}
          alt={`Ilustração para ${chapter.title}`}
          className="w-full h-auto object-cover"
          onError={(e) => {
            console.error("Erro ao carregar imagem:", chapter.imageUrl);
            e.currentTarget.src = 'https://placehold.co/600x400/FFDE59/333333?text=Ilustração+não+disponível';
            e.currentTarget.alt = 'Ilustração não disponível';
          }}
        />
      </div>
    )}