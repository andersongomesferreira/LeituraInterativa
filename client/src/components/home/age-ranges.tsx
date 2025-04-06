import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Baby, Blocks, BookOpen, Check } from "lucide-react";

const ageRanges = [
  {
    icon: <Baby className="text-white text-2xl" />,
    bgColor: "bg-primary-light",
    title: "3-5 anos",
    description: "Histórias curtas com vocabulário simples e ilustrações coloridas para despertar a imaginação.",
    features: [
      "Frases curtas e simples",
      "Personagens amigáveis",
      "Temas lúdicos e educativos"
    ],
    linkColor: "text-primary"
  },
  {
    icon: <Blocks className="text-white text-2xl" />,
    bgColor: "bg-secondary-light",
    title: "6-8 anos",
    description: "Narrativas mais elaboradas com personagens cativantes e lições sutis sobre amizade e valores.",
    features: [
      "Histórias com capítulos curtos",
      "Vocabulário mais diversificado",
      "Desafios e soluções simples"
    ],
    linkColor: "text-secondary"
  },
  {
    icon: <BookOpen className="text-white text-2xl" />,
    bgColor: "bg-accent",
    title: "9-12 anos",
    description: "Aventuras mais complexas com desenvolvimento de personagens e temas mais elaborados.",
    features: [
      "Narrativas mais complexas",
      "Personagens com dilemas",
      "Temas educativos avançados"
    ],
    linkColor: "text-accent-dark"
  }
];

const AgeRanges = () => {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
          Histórias para todas as idades
        </h2>
        <p className="text-neutral-600 text-center max-w-2xl mx-auto mb-12">
          Conteúdo adaptado especificamente para a faixa etária do seu filho, com vocabulário e narrativas apropriados para cada estágio de desenvolvimento.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {ageRanges.map((range, index) => (
            <Card 
              key={index}
              className="bg-neutral-100 hover:bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
            >
              <CardContent className="p-0">
                <div className={`${range.bgColor} rounded-full w-16 h-16 flex items-center justify-center mb-4`}>
                  {range.icon}
                </div>
                <h3 className="text-2xl font-heading font-bold mb-2">{range.title}</h3>
                <p className="text-neutral-600 mb-4">{range.description}</p>
                <ul className="space-y-2 mb-6">
                  {range.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <Check className="text-success mr-2 h-5 w-5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/story/create">
                  <a className={`${range.linkColor} font-semibold flex items-center hover:underline`}>
                    Ver exemplo <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </a>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AgeRanges;
