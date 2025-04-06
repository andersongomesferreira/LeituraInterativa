import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface Theme {
  id: number;
  name: string;
  description: string;
  ageGroups: string[];
  isPremium: boolean;
}

interface ThemeSelectorProps {
  selectedTheme: number | null;
  onThemeSelect: (themeId: number) => void;
  ageGroup: string;
}

const ThemeSelector = ({
  selectedTheme,
  onThemeSelect,
  ageGroup,
}: ThemeSelectorProps) => {
  const [showPremiumWarning, setShowPremiumWarning] = useState(false);
  
  const { data: themes = [], isLoading } = useQuery<Theme[]>({
    queryKey: ["/api/themes", { ageGroup }],
    queryFn: async () => {
      const response = await fetch(`/api/themes?ageGroup=${ageGroup}`);
      if (!response.ok) throw new Error("Failed to fetch themes");
      return response.json();
    },
    enabled: !!ageGroup,
  });

  const { data: authStatus } = useQuery({
    queryKey: ["/api/auth/status"],
  });

  const { data: subscription } = useQuery({
    queryKey: ["/api/user-subscription"],
    enabled: !!authStatus?.isAuthenticated,
  });

  const isPremiumUser = subscription?.plan?.name !== "Plano Gratuito";

  // Reset selected theme when ageGroup changes
  useEffect(() => {
    onThemeSelect(0);
  }, [ageGroup, onThemeSelect]);

  const handleThemeSelect = (themeId: number, isPremium: boolean) => {
    if (isPremium && !isPremiumUser) {
      setShowPremiumWarning(true);
      return;
    }
    
    onThemeSelect(themeId);
  };

  const filteredThemes = themes.filter(theme => 
    theme.ageGroups.includes(ageGroup)
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className="text-lg font-heading font-bold mb-2">Tema da História</h3>
          <p className="text-sm text-muted-foreground">
            Escolha um tema para a história
          </p>
        </div>

        {showPremiumWarning && (
          <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg mb-4 text-sm">
            Este tema está disponível apenas para assinantes dos planos Plus ou Família.{" "}
            <a href="/subscription/plans" className="underline font-semibold">
              Fazer upgrade
            </a>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="flex items-center space-x-4">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredThemes.length > 0 ? (
          <RadioGroup
            value={selectedTheme?.toString() || ""}
            onValueChange={(value) => onThemeSelect(parseInt(value))}
          >
            <div className="space-y-3">
              {filteredThemes.map((theme) => (
                <div
                  key={theme.id}
                  className={`flex items-start relative border rounded-lg p-3 ${
                    theme.isPremium && !isPremiumUser
                      ? "opacity-60"
                      : selectedTheme === theme.id
                      ? "border-primary bg-primary/5"
                      : "border-input"
                  }`}
                  onClick={() => handleThemeSelect(theme.id, theme.isPremium)}
                >
                  <RadioGroupItem
                    value={theme.id.toString()}
                    id={`theme-${theme.id}`}
                    disabled={theme.isPremium && !isPremiumUser}
                    className="mt-1"
                  />
                  <div className="ml-3 space-y-1">
                    <Label
                      htmlFor={`theme-${theme.id}`}
                      className="font-heading font-bold text-base cursor-pointer flex items-center"
                    >
                      {theme.name}
                      {theme.isPremium && (
                        <Badge className="ml-2 bg-accent text-neutral-800">
                          Premium
                        </Badge>
                      )}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {theme.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            Nenhum tema disponível para esta faixa etária.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ThemeSelector;
