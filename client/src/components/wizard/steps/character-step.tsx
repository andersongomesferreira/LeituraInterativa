import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Character {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  ageGroups: string[];
  isPremium: boolean;
}

interface CharacterStepProps {
  selectedCharacters: number[];
  onSelectCharacters: (characterIds: number[]) => void;
  ageGroup: string;
}

const CharacterStep: React.FC<CharacterStepProps> = ({
  selectedCharacters,
  onSelectCharacters,
  ageGroup,
}) => {
  const { data: characters = [], isLoading } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });

  const toggleCharacter = (id: number) => {
    if (selectedCharacters.includes(id)) {
      onSelectCharacters(selectedCharacters.filter((charId) => charId !== id));
    } else {
      // Permite selecionar até 3 personagens
      if (selectedCharacters.length < 3) {
        onSelectCharacters([...selectedCharacters, id]);
      }
    }
  };

  // Filtra personagens por faixa etária, verificando se ageGroups existe
  const filteredCharacters = characters.filter((character) => {
    // Verifica se o personagem tem a propriedade ageGroups e se é um array
    return Array.isArray(character.ageGroups) 
      ? character.ageGroups.includes(ageGroup)
      : true; // Se não tiver a propriedade, incluir todos por padrão
  });

  if (isLoading) {
    return (
      <div className="py-4 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <h2 className="text-xl font-bold mb-4">Escolha os Personagens</h2>
      <p className="text-muted-foreground mb-2">
        Selecione até 3 personagens para sua história.
      </p>
      <div className="bg-muted/30 p-3 rounded-md mb-6 text-sm">
        <span className="font-medium">Dica:</span> Os personagens determinarão os protagonistas da história.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCharacters.map((character) => (
          <Card
            key={character.id}
            className={cn(
              "cursor-pointer transition-all",
              selectedCharacters.includes(character.id)
                ? "border-2 border-primary shadow-md"
                : "border border-border hover:border-primary/50"
            )}
            onClick={() => toggleCharacter(character.id)}
          >
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xl font-bold">
                {character.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base">{character.name}</h3>
                  <div className="flex items-center gap-2">
                    {character.isPremium && (
                      <Badge variant="default" className="text-xs px-2 py-0">
                        Premium
                      </Badge>
                    )}
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                        selectedCharacters.includes(character.id)
                          ? "bg-primary border-primary text-white"
                          : "bg-background border-muted-foreground/30"
                      )}
                    >
                      {selectedCharacters.includes(character.id) && (
                        <CheckIcon className="h-3 w-3" />
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {character.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CharacterStep;