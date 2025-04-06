import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Wand2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AgeRangeSelector from "@/components/story/age-range-selector";
import CharacterSelector from "@/components/story/character-selector";
import ThemeSelector from "@/components/story/theme-selector";

interface StoryFormProps {
  initialAgeGroup?: string;
}

const StoryGenerator = ({ initialAgeGroup = "6-8" }: StoryFormProps) => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [ageGroup, setAgeGroup] = useState(initialAgeGroup);
  const [selectedCharacters, setSelectedCharacters] = useState<number[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<number | null>(null);
  const [childName, setChildName] = useState("");

  const { data: authStatus } = useQuery({
    queryKey: ["/api/auth/status"],
  });

  const { data: subscription } = useQuery({
    queryKey: ["/api/user-subscription"],
    enabled: !!authStatus?.isAuthenticated,
  });

  const isPremiumUser = subscription?.plan?.name !== "Plano Gratuito";
  const allowPersonalization = subscription?.plan?.name === "Plano Família";

  // Story generation mutation
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

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-heading font-bold">Criar Nova História</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Personalize uma história mágica escolhendo os personagens, tema e faixa etária
            </p>
          </div>
          
          <Button
            className="bg-primary hover:bg-primary-dark font-heading font-semibold"
            onClick={handleGenerateStory}
            disabled={
              generateStoryMutation.isPending ||
              selectedCharacters.length === 0 ||
              !selectedTheme
            }
          >
            {generateStoryMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" /> Gerar História
              </>
            )}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AgeRangeSelector
            value={ageGroup}
            onChange={(value) => setAgeGroup(value)}
          />
          
          {allowPersonalization && (
            <Card className="p-6">
              <h3 className="text-lg font-heading font-bold mb-2">Personalização</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Personalize a história com o nome da criança (Plano Família)
              </p>
              <Input
                placeholder="Nome da criança"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="max-w-xs"
              />
            </Card>
          )}
        </div>

        <div className="lg:col-span-3 space-y-6">
          <CharacterSelector
            selectedCharacters={selectedCharacters}
            onCharacterSelect={setSelectedCharacters}
            maxSelections={3}
          />
          
          <ThemeSelector
            selectedTheme={selectedTheme}
            onThemeSelect={setSelectedTheme}
            ageGroup={ageGroup}
          />
        </div>
      </div>
    </div>
  );
};

export default StoryGenerator;
