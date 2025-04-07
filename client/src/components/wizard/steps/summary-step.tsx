import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { WizardData } from "../story-wizard";

interface Character {
  id: number;
  name: string;
  description: string;
}

interface Theme {
  id: number;
  name: string;
  description: string;
}

interface SummaryStepProps {
  wizardData: WizardData;
  onUpdateChildName: (name: string) => void;
  onToggleTextOnly?: (textOnly: boolean) => void;
}

const SummaryStep: React.FC<SummaryStepProps> = ({ wizardData, onUpdateChildName, onToggleTextOnly }) => {
  const [useChildName, setUseChildName] = useState(!!wizardData.childName);
  const [childName, setChildName] = useState(wizardData.childName || "");
  const [textOnly, setTextOnly] = useState(wizardData.textOnly !== false);

  const { data: characters = [] } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });

  const { data: themes = [] } = useQuery<Theme[]>({
    queryKey: ["/api/themes"],
  });

  const selectedCharacters = characters.filter(char => 
    wizardData.characterIds.includes(char.id)
  );

  const selectedTheme = themes.find(theme => 
    theme.id === wizardData.themeId
  );

  const handleChildNameToggle = (checked: boolean) => {
    setUseChildName(checked);
    if (!checked) {
      setChildName("");
      onUpdateChildName("");
    }
  };

  const handleChildNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChildName(e.target.value);
    onUpdateChildName(e.target.value);
  };
  
  const handleTextOnlyToggle = (checked: boolean) => {
    setTextOnly(checked);
    if (onToggleTextOnly) {
      onToggleTextOnly(checked);
    }
  };

  return (
    <div className="py-4">
      <h2 className="text-xl font-bold mb-4">Resumo</h2>
      <p className="text-muted-foreground mb-6">
        Revise as informações da história antes de criar
      </p>

      <div className="grid gap-6">
        <div className="bg-muted/30 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Faixa Etária</h3>
          <p>{wizardData.ageGroup} anos</p>
        </div>

        <div className="bg-muted/30 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Personagens</h3>
          <ul className="list-disc pl-5 space-y-1">
            {selectedCharacters.map(char => (
              <li key={char.id}>{char.name}</li>
            ))}
          </ul>
        </div>

        <div className="bg-muted/30 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Tema</h3>
          <p>{selectedTheme?.name}</p>
        </div>

        <div className="border border-primary/30 p-4 rounded-lg bg-primary/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Personalização</h3>
              <p className="text-sm text-muted-foreground">
                Adicionar nome da criança na história
              </p>
            </div>
            <Switch 
              checked={useChildName} 
              onCheckedChange={handleChildNameToggle} 
              id="child-name-toggle"
            />
          </div>

          {useChildName && (
            <div className="mt-2">
              <Label htmlFor="child-name" className="text-sm">
                Nome da criança
              </Label>
              <Input 
                id="child-name" 
                value={childName} 
                onChange={handleChildNameChange} 
                placeholder="Digite o nome da criança" 
                className="mt-1"
              />
            </div>
          )}
        </div>
        
        <div className="border border-primary/30 p-4 rounded-lg bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Modo somente texto</h3>
              <p className="text-sm text-muted-foreground">
                Histórias sem ilustrações, apenas conteúdo textual
              </p>
            </div>
            <Switch 
              checked={textOnly} 
              onCheckedChange={handleTextOnlyToggle} 
              id="text-only-toggle"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryStep;