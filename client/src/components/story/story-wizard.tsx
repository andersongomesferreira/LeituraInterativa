import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Wand2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Star,
  Sparkles,
  UserCircle2,
  BookOpen,
  Palette,
} from "lucide-react";

import CharacterSelector from "./character-selector";
import ThemeSelector from "./theme-selector";
import AgeRangeSelector from "./age-range-selector";

// Tipos de etapas do wizard
type WizardStep = "intro" | "age" | "character" | "theme" | "personalize" | "preview";

interface StoryWizardProps {
  initialAgeGroup?: string;
}

const StoryWizard = ({ initialAgeGroup = "6-8" }: StoryWizardProps) => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  // Estado do wizard
  const [currentStep, setCurrentStep] = useState<WizardStep>("intro");
  const [progress, setProgress] = useState(0);
  
  // Estado da história
  const [ageGroup, setAgeGroup] = useState(initialAgeGroup);
  const [selectedCharacters, setSelectedCharacters] = useState<number[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<number | null>(null);
  const [childName, setChildName] = useState("");
  const [previewData, setPreviewData] = useState<{
    characters: Character[];
    theme: Theme | undefined;
  } | null>(null);
  
  // Interfaces para tipagem
  interface AuthStatus {
    isAuthenticated: boolean;
    user?: {
      id: number;
      name: string;
    };
  }

  interface Subscription {
    plan: {
      id: number;
      name: string;
      price: number;
    };
  }

  interface Character {
    id: number;
    name: string;
    description: string;
    personality: string;
    imageUrl: string;
    isPremium: boolean;
  }

  interface Theme {
    id: number;
    name: string;
    description: string;
    ageGroups: string[];
    isPremium: boolean;
  }

  // Consultas de autenticação e assinatura
  const { data: authStatus } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
  });

  const { data: subscription } = useQuery<Subscription>({
    queryKey: ["/api/user-subscription"],
    enabled: !!authStatus?.isAuthenticated,
  });

  const isPremiumUser = subscription?.plan?.name !== "Plano Gratuito";
  const allowPersonalization = subscription?.plan?.name === "Plano Família";
  
  // Consulta de personagens e temas para a visualização prévia
  const { data: characters = [] } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });
  
  const { data: themes = [] } = useQuery<Theme[]>({
    queryKey: ["/api/themes", ageGroup],
  });

  // Configuração da mutação para geração da história
  const generateStoryMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/stories/generate", {
        characters: selectedCharacters,
        theme: selectedTheme,
        ageGroup,
        childName: allowPersonalization ? childName : undefined,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "História criada com sucesso!",
        description: "Preparando sua história...",
      });
      navigate(`/story/read/${data.id}`);
    },
    onError: (error) => {
      console.error("Error generating story:", error);
      toast({
        title: "Erro ao gerar história",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Atualiza a barra de progresso quando a etapa muda
  useEffect(() => {
    const progressMap: Record<WizardStep, number> = {
      intro: 0,
      age: 20,
      character: 40,
      theme: 60,
      personalize: 80,
      preview: 95,
    };
    
    setProgress(progressMap[currentStep]);
    
    // Atualiza os dados de visualização se estivermos na etapa de visualização
    if (currentStep === "preview") {
      // Usamos type guard para garantir que os personagens não sejam undefined
      const selectedChars = selectedCharacters
        .map(id => characters.find(c => c.id === id))
        .filter((char): char is Character => char !== undefined);
      
      const theme = themes.find(t => t.id === selectedTheme);
      
      setPreviewData({
        characters: selectedChars,
        theme,
      });
    }
  }, [currentStep, selectedCharacters, selectedTheme, characters, themes]);

  // Navegação entre etapas
  const goToNextStep = () => {
    const stepOrder: WizardStep[] = ["intro", "age", "character", "theme", "personalize", "preview"];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    // Se for a última etapa, gera a história
    if (currentIndex === stepOrder.length - 1) {
      handleGenerateStory();
      return;
    }
    
    // Validação por etapa
    if (currentStep === "character" && selectedCharacters.length === 0) {
      toast({
        title: "Selecione pelo menos um personagem",
        description: "É necessário escolher personagens para sua história.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep === "theme" && !selectedTheme) {
      toast({
        title: "Selecione um tema",
        description: "É necessário escolher um tema para sua história.",
        variant: "destructive",
      });
      return;
    }
    
    // Se for a etapa de personalização e o usuário não tem permissão, pula para a próxima etapa
    if (currentStep === "theme" && !allowPersonalization) {
      setCurrentStep(stepOrder[currentIndex + 2]); // Pula a etapa de personalização
      return;
    }
    
    // Avança para a próxima etapa normalmente
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const goToPrevStep = () => {
    const stepOrder: WizardStep[] = ["intro", "age", "character", "theme", "personalize", "preview"];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    // Se estiver na etapa de visualização e não tiver personalização, volta 2 etapas
    if (currentStep === "preview" && !allowPersonalization) {
      setCurrentStep(stepOrder[currentIndex - 2]);
      return;
    }
    
    // Volta para a etapa anterior normalmente
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleGenerateStory = async () => {
    if (!authStatus?.isAuthenticated) {
      toast({
        title: "Faça login para continuar",
        description: "É necessário estar logado para criar histórias.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (selectedCharacters.length === 0) {
      toast({
        title: "Selecione pelo menos um personagem",
        description: "É necessário escolher personagens para sua história.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTheme) {
      toast({
        title: "Selecione um tema",
        description: "É necessário escolher um tema para sua história.",
        variant: "destructive",
      });
      return;
    }

    generateStoryMutation.mutate();
  };

  // Renderiza o conteúdo baseado na etapa atual
  const renderStepContent = () => {
    switch (currentStep) {
      case "intro":
        return (
          <div className="text-center space-y-6 py-6">
            <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl font-heading font-bold">Assistente de Histórias</h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Vamos criar uma história incrível juntos! 
              Este assistente irá guiá-lo no processo de criação.
            </p>
            <div className="pt-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary-dark px-8"
                onClick={goToNextStep}
              >
                Começar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "age":
        return (
          <div className="space-y-6 py-4">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <UserCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-heading font-bold">Escolha a Faixa Etária</h2>
              <p className="text-muted-foreground mt-2">
                Personalize o conteúdo e a linguagem para idade adequada
              </p>
            </div>
            
            <AgeRangeSelector
              value={ageGroup}
              onChange={(value) => setAgeGroup(value)}
            />
          </div>
        );

      case "character":
        return (
          <div className="space-y-6 py-4">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Star className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-heading font-bold">Escolha os Personagens</h2>
              <p className="text-muted-foreground mt-2">
                Selecione até 3 personagens para sua história
              </p>
            </div>
            
            <CharacterSelector
              selectedCharacters={selectedCharacters}
              onCharacterSelect={setSelectedCharacters}
              maxSelections={3}
            />
          </div>
        );

      case "theme":
        return (
          <div className="space-y-6 py-4">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Palette className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-heading font-bold">Escolha o Tema</h2>
              <p className="text-muted-foreground mt-2">
                Selecione um tema para a narrativa da história
              </p>
            </div>
            
            <ThemeSelector
              selectedTheme={selectedTheme}
              onThemeSelect={setSelectedTheme}
              ageGroup={ageGroup}
            />
          </div>
        );

      case "personalize":
        return (
          <div className="space-y-6 py-4">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <UserCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-heading font-bold">Personalização</h2>
              <p className="text-muted-foreground mt-2">
                Personalize a história para torná-la ainda mais especial
              </p>
            </div>
            
            <Card className="p-6 max-w-md mx-auto">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="childName">Nome da Criança</Label>
                  <Input
                    id="childName"
                    placeholder="Digite o nome da criança"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    O nome será incluído na narrativa da história
                  </p>
                </div>
                
                {!allowPersonalization && (
                  <div className="bg-yellow-100 p-3 rounded-md text-yellow-800 text-sm">
                    Personalização disponível apenas no plano Família.{" "}
                    <a href="/subscription/plans" className="underline font-medium">
                      Fazer upgrade
                    </a>
                  </div>
                )}
              </div>
            </Card>
          </div>
        );

      case "preview":
        return (
          <div className="space-y-6 py-4">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-heading font-bold">Revisar e Gerar</h2>
              <p className="text-muted-foreground mt-2">
                Verifique as escolhas e gere sua história personalizada
              </p>
            </div>
            
            <Card className="p-6 max-w-lg mx-auto">
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">Faixa Etária</h3>
                    <p className="text-lg">{ageGroup} anos</p>
                  </div>
                  
                  {allowPersonalization && childName && (
                    <div>
                      <h3 className="text-sm font-medium">Personalização</h3>
                      <p className="text-lg">{childName}</p>
                    </div>
                  )}
                  
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium">Personagens</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {previewData?.characters.map((char) => (
                        <div key={char.id} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10">
                          <span className="text-sm">{char.name.split(',')[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium">Tema</h3>
                    <p className="text-lg">{previewData?.theme?.name}</p>
                    <p className="text-xs text-muted-foreground">{previewData?.theme?.description}</p>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    Nossa IA irá gerar uma história única com base nas suas escolhas. 
                    Isso pode levar alguns segundos.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      {/* Barra de progresso */}
      <div className="mb-8">
        <Progress value={progress} max={100} className="h-2" />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Início</span>
          <span>História Completa</span>
        </div>
      </div>
      
      {/* Conteúdo da etapa */}
      <div className="transition-all duration-300 min-h-[400px] flex flex-col justify-between">
        <div>
          {renderStepContent()}
        </div>
        
        {/* Botões de navegação (exceto para a primeira etapa) */}
        {currentStep !== "intro" && (
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={goToPrevStep}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
            
            <Button 
              onClick={goToNextStep}
              className="bg-primary hover:bg-primary-dark gap-2"
              disabled={generateStoryMutation.isPending}
            >
              {currentStep === "preview" ? (
                generateStoryMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Gerando...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" /> Gerar História
                  </>
                )
              ) : (
                <>
                  Próximo <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryWizard;