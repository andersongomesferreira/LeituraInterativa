import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AgeGroupStepProps {
  selectedAgeGroup: string;
  onSelectAgeGroup: (ageGroup: string) => void;
}

const AgeGroupStep: React.FC<AgeGroupStepProps> = ({ selectedAgeGroup, onSelectAgeGroup }) => {
  const ageGroups = [
    {
      id: "3-5",
      name: "3 a 5 anos",
      description: "Histórias simples com frases curtas e vocabulário básico. Foco em personagens amigáveis e aventuras leves.",
      icon: "🧸",
    },
    {
      id: "6-8",
      name: "6 a 8 anos",
      description: "Narrativas mais elaboradas com vocabulário enriquecido. Histórias com mais aventura e pequenos desafios.",
      icon: "🚀",
    },
    {
      id: "9-12",
      name: "9 a 12 anos",
      description: "Histórias complexas com capítulos mais longos. Temas educativos, mistérios e aventuras mais desafiadoras.",
      icon: "🔍",
    },
  ];

  return (
    <div className="py-4">
      <h2 className="text-xl font-bold mb-4">Escolha a Faixa Etária</h2>
      <p className="text-muted-foreground mb-6">
        Selecione a faixa etária para personalizar a história com linguagem e temas adequados à idade.
      </p>

      <div className="grid gap-4">
        {ageGroups.map((ageGroup) => (
          <Card
            key={ageGroup.id}
            className={cn(
              "cursor-pointer transition-all hover:border-primary/50",
              selectedAgeGroup === ageGroup.id
                ? "border-2 border-primary shadow-md"
                : "border border-border"
            )}
            onClick={() => onSelectAgeGroup(ageGroup.id)}
          >
            <CardContent className="p-4 flex items-center">
              <div className="text-4xl mr-4">{ageGroup.icon}</div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{ageGroup.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {ageGroup.description}
                </p>
              </div>
              <div
                className={cn(
                  "h-5 w-5 rounded-full border-2",
                  selectedAgeGroup === ageGroup.id
                    ? "bg-primary border-primary"
                    : "bg-background border-muted-foreground/30"
                )}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AgeGroupStep;