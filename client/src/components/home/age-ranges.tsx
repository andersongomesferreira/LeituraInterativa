import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Baby, Blocks, BookOpen, Check, Star, Sparkles } from "lucide-react";

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
    linkColor: "text-primary",
    color: "from-blue-200 to-blue-100",
    borderColor: "border-blue-300"
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
    linkColor: "text-secondary",
    color: "from-purple-200 to-purple-100",
    borderColor: "border-purple-300"
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
    linkColor: "text-accent-dark",
    color: "from-green-200 to-green-100",
    borderColor: "border-green-300"
  }
];

const AgeRanges = () => {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-blue-50 to-white storybook-age-ranges">
      <div className="container mx-auto max-w-6xl">
        <div className="storybook-page-title mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center">
            <Star className="inline-block h-6 w-6 text-yellow-500 mr-2" />
            Histórias para todas as idades
            <Star className="inline-block h-6 w-6 text-yellow-500 ml-2" />
          </h2>
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-neutral-600 mt-3">
              Conteúdo adaptado especificamente para a faixa etária do seu filho, com vocabulário e narrativas apropriados para cada estágio de desenvolvimento.
            </p>
          </div>
          <div className="decorative-line mt-3 mx-auto w-24 h-1 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {ageRanges.map((range, index) => (
            <div 
              key={index}
              className={`storybook-card relative overflow-hidden rounded-2xl border-2 ${range.borderColor} bg-gradient-to-b ${range.color} p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1`}
            >
              <div className="storybook-card-content">
                <div className={`${range.bgColor} rounded-full w-16 h-16 flex items-center justify-center mb-4 shadow-md`}>
                  {range.icon}
                </div>
                <h3 className="text-2xl font-heading font-bold mb-2 relative inline-block">
                  {range.title}
                  <Sparkles className="absolute -top-3 -right-6 h-5 w-5 text-yellow-500" />
                </h3>
                <p className="text-neutral-700 mb-4">{range.description}</p>
                <div className="mb-6 bg-white bg-opacity-50 rounded-lg p-3 border border-opacity-30 border-blue-200">
                  <ul className="space-y-2">
                    {range.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center">
                        <Check className="text-success mr-2 h-5 w-5 flex-shrink-0" />
                        <span className="text-neutral-800">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href="/story/create" className={`${range.linkColor} font-semibold flex items-center hover:underline`}>
                  Ver exemplo <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </Link>
                
                {/* Decorative element */}
                <div className="absolute top-2 right-2 opacity-10">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
                    <path d="M12 2L14.5 9H22L16 13.5L18.5 20.5L12 16L5.5 20.5L8 13.5L2 9H9.5L12 2Z" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AgeRanges;
