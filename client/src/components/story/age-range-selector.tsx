import { Card, CardContent } from "@/components/ui/card";
import { Baby, Blocks, BookOpen, Check } from "lucide-react";

interface AgeRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const ageRanges = [
  {
    key: "3-5",
    icon: <Baby className="text-white text-xl" />,
    bgColor: "bg-primary-light",
    title: "3-5 anos",
    description: "Histórias curtas com vocabulário simples",
    features: [
      "Frases curtas e simples",
      "Personagens amigáveis",
    ],
  },
  {
    key: "6-8",
    icon: <Blocks className="text-white text-xl" />,
    bgColor: "bg-secondary-light",
    title: "6-8 anos",
    description: "Narrativas mais elaboradas com personagens cativantes",
    features: [
      "Histórias com capítulos curtos",
      "Vocabulário mais diversificado",
    ],
  },
  {
    key: "9-12",
    icon: <BookOpen className="text-white text-xl" />,
    bgColor: "bg-accent",
    title: "9-12 anos",
    description: "Aventuras mais complexas e elaboradas",
    features: [
      "Narrativas mais complexas",
      "Temas educativos avançados",
    ],
  },
];

const AgeRangeSelector = ({ value, onChange }: AgeRangeSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {ageRanges.map((range) => (
        <Card 
          key={range.key}
          className={`
            rounded-xl p-4 cursor-pointer transition-all
            ${value === range.key 
              ? "bg-primary/10 border-primary shadow-md" 
              : "bg-neutral-100 hover:bg-white hover:shadow-md"}
          `}
          onClick={() => onChange(range.key)}
        >
          <CardContent className="p-0">
            <div className="flex items-start space-x-4">
              <div className={`${range.bgColor} rounded-full w-12 h-12 flex-shrink-0 flex items-center justify-center mt-1`}>
                {range.icon}
              </div>
              <div>
                <h3 className="text-lg font-heading font-bold mb-1 flex items-center">
                  {range.title}
                  {value === range.key && <Check className="ml-2 h-4 w-4 text-primary" />}
                </h3>
                <p className="text-sm text-neutral-600 mb-2">{range.description}</p>
                <ul className="space-y-1 text-xs">
                  {range.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <span className="bg-primary/20 rounded-full h-3 w-3 flex-shrink-0 mr-2"></span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AgeRangeSelector;