import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Theme {
  id: number;
  name: string;
  description: string;
  ageGroups: string[];
  isPremium: boolean;
}

interface ThemeStepProps {
  selectedTheme: number;
  onSelectTheme: (themeId: number) => void;
  ageGroup: string;
}

const ThemeStep: React.FC<ThemeStepProps> = ({
  selectedTheme,
  onSelectTheme,
  ageGroup,
}) => {
  const { data: themes = [], isLoading } = useQuery<Theme[]>({
    queryKey: ["/api/themes"],
  });

  // Filtra temas por faixa etária
  const filteredThemes = themes.filter((theme) =>
    theme.ageGroups.includes(ageGroup)
  );

  if (isLoading) {
    return (
      <div className="py-4 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <h2 className="text-xl font-bold mb-4">Escolha o Tema</h2>
      <p className="text-muted-foreground mb-2">
        Selecione um tema para sua história.
      </p>
      <div className="bg-muted/30 p-3 rounded-md mb-6 text-sm">
        <span className="font-medium">Dica:</span> O tema influenciará o cenário e as lições da história.
      </div>

      <div className="grid gap-4">
        {filteredThemes.map((theme) => (
          <Card
            key={theme.id}
            className={cn(
              "cursor-pointer transition-all",
              selectedTheme === theme.id
                ? "border-2 border-primary shadow-md"
                : "border border-border hover:border-primary/50"
            )}
            onClick={() => onSelectTheme(theme.id)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">{theme.name}</h3>
                <div className="flex gap-2">
                  {theme.isPremium && (
                    <Badge variant="default" className="text-xs">
                      Premium
                    </Badge>
                  )}
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full border-2",
                      selectedTheme === theme.id
                        ? "bg-primary border-primary"
                        : "bg-background border-muted-foreground/30"
                    )}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {theme.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ThemeStep;