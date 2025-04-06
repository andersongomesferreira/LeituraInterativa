import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import AgeGroupStep from "./steps/age-group-step";
import CharacterStep from "./steps/character-step";
import ThemeStep from "./steps/theme-step";
import SummaryStep from "./steps/summary-step";
import { useToast } from "@/hooks/use-toast";

export type WizardData = {
  ageGroup: string;
  characterIds: number[];
  themeId: number;
  childName?: string;
  childId?: number;
  textOnly?: boolean;
};

const StoryWizard = () => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    ageGroup: "",
    characterIds: [],
    themeId: 0,
  });
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const generateStoryMutation = useMutation({
    mutationFn: async (storyData: WizardData) => {
      // Adaptar dados para o formato esperado pela API
      const payload = {
        characters: storyData.characterIds,
        theme: storyData.themeId,
        ageGroup: storyData.ageGroup,
        childName: storyData.childName,
        textOnly: storyData.textOnly === undefined ? true : storyData.textOnly // Ensure textOnly is set with a default of true
      };
      
      try {
        // apiRequest já retorna o JSON processado
        const response = await apiRequest("POST", "/api/stories/generate", payload);
        return response;
      } catch (error) {
        console.error("Erro ao processar resposta:", error);
        throw error;
      }
    },
    onSuccess: (story) => {
      console.log("História criada com sucesso:", story);
      
      toast({
        title: "História criada com sucesso!",
        description: "Sua história foi gerada e está pronta para leitura.",
      });
      
      // Verificar o formato da resposta e construir a URL correta
      if (story && story.id) {
        // Use setTimeout to ensure state updates are processed before navigation
        setTimeout(() => {
          navigate(`/story/read/${story.id}`);
        }, 300);
      } else {
        console.error("ID da história não disponível na resposta:", story);
        toast({
          title: "Erro ao navegar",
          description: "História criada, mas não foi possível navegar automaticamente para a leitura.",
          variant: "destructive",
        });
        
        // Adicionar um pequeno atraso antes de tentar navegar novamente
        setTimeout(() => {
          if (story && story.id) {
            navigate(`/story/read/${story.id}`);
          }
        }, 1000);
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao gerar história",
        description: error.message || "Não foi possível criar a história. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const updateData = (newData: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      generateStory();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const generateStory = () => {
    if (data.ageGroup && data.characterIds.length > 0 && data.themeId) {
      generateStoryMutation.mutate(data);
    } else {
      toast({
        title: "Informações incompletas",
        description: "Por favor, preencha todas as informações necessárias para gerar a história.",
        variant: "destructive",
      });
    }
  };

  const isNextDisabled = () => {
    switch (step) {
      case 1: // Age Group
        return !data.ageGroup;
      case 2: // Characters
        return data.characterIds.length === 0;
      case 3: // Theme
        return data.themeId === 0;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <AgeGroupStep selectedAgeGroup={data.ageGroup} onSelectAgeGroup={(ageGroup: string) => updateData({ ageGroup })} />;
      case 2:
        return <CharacterStep selectedCharacters={data.characterIds} onSelectCharacters={(characterIds: number[]) => updateData({ characterIds })} ageGroup={data.ageGroup} />;
      case 3:
        return <ThemeStep selectedTheme={data.themeId} onSelectTheme={(themeId: number) => updateData({ themeId })} ageGroup={data.ageGroup} />;
      case 4:
        return <SummaryStep 
          wizardData={data} 
          onUpdateChildName={(childName: string) => updateData({ childName })} 
          onToggleTextOnly={(textOnly: boolean) => updateData({ textOnly })}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <Card className="shadow-lg">
        <CardHeader className="bg-primary/10 rounded-t-lg">
          <CardTitle className="text-2xl font-bold text-primary">Assistente de Criação de História</CardTitle>
          <CardDescription>Siga os passos para criar uma história personalizada</CardDescription>
          <Progress value={progress} className="h-2 mt-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Passo {step} de {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </CardHeader>
        <CardContent className="pt-6 px-8">
          {renderStep()}
        </CardContent>
        <CardFooter className="flex justify-between px-8 py-4 bg-muted/20">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
          >
            Voltar
          </Button>
          <Button
            onClick={nextStep}
            disabled={isNextDisabled() || generateStoryMutation.isPending}
          >
            {generateStoryMutation.isPending && step === totalSteps ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : step === totalSteps ? (
              "Criar História"
            ) : (
              "Próximo"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default StoryWizard;