import { UserPlus, Baby, Lightbulb, Wand2 } from "lucide-react";

const steps = [
  {
    icon: <UserPlus className="text-primary text-3xl" />,
    title: "Crie o perfil",
    description: "Configure um perfil para você e seu filho com preferências de leitura."
  },
  {
    icon: <Baby className="text-primary text-3xl" />,
    title: "Escolha personagens",
    description: "Selecione entre diversos personagens com diferentes personalidades."
  },
  {
    icon: <Lightbulb className="text-primary text-3xl" />,
    title: "Defina o tema",
    description: "Escolha entre temas educativos como amizade, natureza ou superação."
  },
  {
    icon: <Wand2 className="text-primary text-3xl" />,
    title: "Leia a história",
    description: "Nossa IA gera uma história única que você pode ler ou ouvir com seu filho."
  }
];

const HowItWorks = () => {
  return (
    <section className="py-16 px-4 bg-neutral-100">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
          Como funciona
        </h2>
        <p className="text-neutral-600 text-center max-w-2xl mx-auto mb-12">
          Criar histórias personalizadas para seu filho nunca foi tão fácil. Siga estes simples passos:
        </p>
        
        <div className="relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-primary-light transform -translate-y-1/2 z-0"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="bg-white w-20 h-20 rounded-full shadow-lg flex items-center justify-center mb-6 border-4 border-primary">
                  {step.icon}
                </div>
                <h3 className="text-xl font-heading font-bold mb-2">{step.title}</h3>
                <p className="text-neutral-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
