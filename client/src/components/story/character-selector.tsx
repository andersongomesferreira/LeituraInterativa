import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface Character {
  id: number;
  name: string;
  description: string;
  personality: string;
  imageUrl: string;
  isPremium: boolean;
}

interface CharacterSelectorProps {
  selectedCharacters: number[];
  onCharacterSelect: (characters: number[]) => void;
  maxSelections?: number;
}

const CharacterSelector = ({
  selectedCharacters,
  onCharacterSelect,
  maxSelections = 3,
}: CharacterSelectorProps) => {
  const [showPremiumWarning, setShowPremiumWarning] = useState(false);

  const { data: characters = [], isLoading } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });

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

  const { data: authStatus } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
  });

  const { data: subscription } = useQuery<Subscription>({
    queryKey: ["/api/user-subscription"],
    enabled: !!authStatus?.isAuthenticated,
  });

  const isPremiumUser = subscription?.plan?.name !== "Plano Gratuito";

  const handleCharacterToggle = (characterId: number, isPremium: boolean) => {
    // If character is already selected, remove it
    if (selectedCharacters.includes(characterId)) {
      onCharacterSelect(
        selectedCharacters.filter((id) => id !== characterId)
      );
      return;
    }

    // If premium character and user doesn't have premium subscription
    if (isPremium && !isPremiumUser) {
      setShowPremiumWarning(true);
      return;
    }

    // If max selections reached
    if (selectedCharacters.length >= maxSelections) {
      // Replace the last selection with the new one
      const newSelections = [...selectedCharacters];
      newSelections.pop();
      newSelections.push(characterId);
      onCharacterSelect(newSelections);
    } else {
      // Add the new selection
      onCharacterSelect([...selectedCharacters, characterId]);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className="text-lg font-heading font-bold mb-2">Personagens</h3>
          <p className="text-sm text-muted-foreground">
            Selecione até {maxSelections} personagens para sua história
            {selectedCharacters.length > 0 && (
              <span className="ml-2 text-primary">
                ({selectedCharacters.length}/{maxSelections} selecionados)
              </span>
            )}
          </p>
        </div>

        {showPremiumWarning && (
          <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg mb-4 text-sm">
            Este personagem está disponível apenas para assinantes dos planos Plus ou Família.{" "}
            <a href="/subscription/plans" className="underline font-semibold">
              Fazer upgrade
            </a>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="rounded-lg border p-2 h-[180px]"
                >
                  <Skeleton className="h-24 w-full rounded-md" />
                  <Skeleton className="h-4 w-3/4 mt-2" />
                  <Skeleton className="h-3 w-1/2 mt-2" />
                </div>
              ))
            : characters.map((character) => (
                <div
                  key={character.id}
                  className={`rounded-lg border p-2 cursor-pointer transition-all hover:shadow-md relative ${
                    selectedCharacters.includes(character.id)
                      ? "border-primary bg-primary/5"
                      : character.isPremium && !isPremiumUser
                      ? "opacity-60"
                      : ""
                  }`}
                  onClick={() =>
                    handleCharacterToggle(character.id, character.isPremium)
                  }
                >
                  {selectedCharacters.includes(character.id) && (
                    <div className="absolute top-2 right-2 bg-primary text-white rounded-full">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                  
                  {character.isPremium && (
                    <Badge className="absolute top-2 left-2 bg-accent text-neutral-800">
                      Premium
                    </Badge>
                  )}
                  
                  <div className="h-24 flex items-center justify-center mb-2 bg-neutral-100 rounded-md">
                    {character.imageUrl ? (
                      <img
                        src={character.imageUrl}
                        alt={character.name}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          // Fallback to a colored avatar with initial
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `<div class="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold">${character.name.charAt(0)}</div>`;
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold">
                        {character.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h4 className="font-heading font-bold text-sm line-clamp-1">
                    {character.name}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {character.personality.split(",")[0]}
                  </p>
                </div>
              ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CharacterSelector;
