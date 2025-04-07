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
        return response as any;
      } catch (error) {
        console.error("Erro ao processar resposta:", error);
        throw error;
      }
    },
    onSuccess: (story: any) => {
      console.log("História criada com sucesso:", story);
      
      toast({
        title: "História criada com sucesso!",
        description: "Sua história foi gerada e está pronta para leitura.",
      });
      
      // Verificar o formato da resposta e construir a URL correta
      if (story && 'id' in story) {
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
          if (story && 'id' in story) {
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
      <div className="storybook-container bg-gradient-to-b from-blue-50 to-white shadow-xl border-4 border-blue-300 rounded-2xl overflow-hidden">
        {/* Wizard header with storybook style */}
        <div className="storybook-wizard-header bg-gradient-to-r from-blue-200 via-purple-100 to-pink-200 px-6 pt-6 pb-4 rounded-t-xl border-b-2 border-blue-300 relative">
          {/* Decorative elements */}
          <div className="absolute top-2 right-2 text-yellow-400 transform rotate-12">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div className="absolute top-4 left-3 text-blue-300 transform -rotate-12">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-blue-600 font-heading drop-shadow-sm relative inline-block">
            Assistente de Criação de História
            <div className="absolute -bottom-1 left-0 right-0 h-3 bg-yellow-200 opacity-50 rounded-full"></div>
          </h1>
          <p className="text-blue-700 mt-2">Siga os passos para criar uma história mágica personalizada</p>
          
          {/* Progress bar with storybook style */}
          <div className="mt-4 relative">
            <div className="h-4 w-full bg-white rounded-full border-2 border-blue-300 shadow-inner overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-blue-600 mt-1 font-medium">
              <span>Passo {step} de {totalSteps}</span>
              <span>{Math.round(progress)}% concluído</span>
            </div>
          </div>
        </div>
        
        {/* Wizard content with storybook style */}
        <div className="p-6 md:p-8 bg-gradient-to-b from-white to-blue-50 min-h-[60vh] relative">
          {/* Decorative corner elements */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-200 rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-200 rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-200 rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-200 rounded-br-lg"></div>
          
          {/* Wizard step content */}
          <div className="bg-white/70 rounded-xl border-2 border-blue-100 p-5 shadow-inner relative z-10">
            {renderStep()}
          </div>
          
          {/* Decorative floating elements */}
          <div className="absolute top-10 right-6 opacity-20 animate-pulse">
            <svg className="w-12 h-12 text-purple-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.9 6.858l4.242 4.243L7.242 21H3v-4.243l9.9-9.9zm1.414-1.414l2.121-2.122a1 1 0 0 1 1.414 0l2.829 2.829a1 1 0 0 1 0 1.414l-2.122 2.121-4.242-4.242z" />
            </svg>
          </div>
          <div className="absolute bottom-10 left-6 opacity-20 animate-bounce">
            <svg className="w-10 h-10 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L14.5 9H22L16 13.5L18.5 20.5L12 16L5.5 20.5L8 13.5L2 9H9.5L12 2Z" />
            </svg>
          </div>
        </div>
        
        {/* Wizard footer with storybook style buttons */}
        <div className="bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 p-6 border-t-2 border-blue-200 flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
            className="flex items-center bg-white border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:bg-gray-100"
          >
            Voltar
          </Button>
          
          <Button
            onClick={nextStep}
            disabled={isNextDisabled() || generateStoryMutation.isPending}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-md font-medium"
          >
            {generateStoryMutation.isPending && step === totalSteps ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando Magia...
              </>
            ) : step === totalSteps ? (
              "Criar História ✨"
            ) : (
              "Próximo Passo"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoryWizard;