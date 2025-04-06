import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Baby, Blocks, BookOpen } from "lucide-react";

interface AgeRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const ageRanges = [
  {
    value: "3-5",
    label: "3-5 anos",
    icon: <Baby className="h-5 w-5" />,
    description: "Histórias curtas com vocabulário simples"
  },
  {
    value: "6-8",
    label: "6-8 anos",
    icon: <Blocks className="h-5 w-5" />,
    description: "Narrativas mais elaboradas sobre amizade e valores"
  },
  {
    value: "9-12",
    label: "9-12 anos",
    icon: <BookOpen className="h-5 w-5" />,
    description: "Aventuras complexas com desenvolvimento de personagens"
  }
];

const AgeRangeSelector = ({ value, onChange }: AgeRangeSelectorProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className="text-lg font-heading font-bold mb-2">Faixa Etária</h3>
          <p className="text-sm text-muted-foreground">
            Selecione a faixa etária da criança para adaptar o conteúdo da história
          </p>
        </div>
        
        <RadioGroup
          defaultValue={value}
          value={value}
          onValueChange={onChange}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {ageRanges.map((range) => (
            <div key={range.value}>
              <RadioGroupItem
                value={range.value}
                id={`age-${range.value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`age-${range.value}`}
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
                  {range.icon}
                </div>
                <div className="text-center">
                  <div className="font-bold">{range.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{range.description}</div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default AgeRangeSelector;
