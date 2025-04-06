import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "wouter";

const faqItems = [
  {
    question: "As histórias são apropriadas para todas as idades?",
    answer: "Sim! O LeiturinhaBot gera histórias adaptadas especificamente para cada faixa etária (3-5, 6-8 e 9-12 anos). O vocabulário, complexidade da narrativa e temas são cuidadosamente ajustados para garantir que sejam apropriados e educativos para a idade da criança."
  },
  {
    question: "Como funciona o sistema de narração por voz?",
    answer: "Nosso Narrador Virtual Interativo utiliza tecnologia avançada de síntese de voz para ler as histórias com entonação natural e expressiva. Você pode escolher entre diferentes vozes de narradores e ajustar a velocidade da leitura. Além disso, incluímos efeitos sonoros que tornam a experiência mais imersiva para as crianças."
  },
  {
    question: "Posso cancelar minha assinatura a qualquer momento?",
    answer: "Absolutamente! Você pode cancelar sua assinatura a qualquer momento, sem multas ou taxas adicionais. Após o cancelamento, você continuará tendo acesso a todas as funcionalidades até o final do período pago. Valorizamos sua satisfação e queremos que você use nosso serviço apenas enquanto estiver realmente satisfeito com ele."
  },
  {
    question: "É possível acessar as histórias offline?",
    answer: "Sim! Os usuários dos planos Plus e Família podem salvar histórias para leitura offline no aplicativo móvel. Isso é perfeito para viagens, momentos sem conexão à internet ou para limitar o tempo de tela online da criança. As histórias ficam disponíveis no dispositivo e podem ser acessadas a qualquer momento, mesmo sem internet."
  },
  {
    question: "Como são geradas as ilustrações das histórias?",
    answer: "Nosso Ilustrador IA cria ilustrações personalizadas para cada história usando tecnologia avançada de inteligência artificial. As imagens são geradas para complementar perfeitamente o texto da história, com estilos apropriados para cada faixa etária e adaptados aos temas e personagens selecionados. Isso garante que cada história tenha uma experiência visual única e envolvente."
  }
];

const FAQ = () => {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
          Perguntas Frequentes
        </h2>
        <p className="text-neutral-600 text-center max-w-2xl mx-auto mb-12">
          Tire suas dúvidas sobre o LeiturinhaBot e como podemos ajudar seu filho a desenvolver o hábito da leitura.
        </p>
        
        <Accordion type="single" collapsible className="space-y-4">
          {faqItems.map((item, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border border-neutral-200 rounded-xl overflow-hidden"
            >
              <AccordionTrigger className="p-5 text-left bg-neutral-50 hover:bg-neutral-100 transition-colors font-heading font-bold text-lg">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="p-5 border-t border-neutral-200 bg-white text-neutral-600">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        
        <div className="mt-12 text-center">
          <p className="mb-4">Ainda tem dúvidas?</p>
          <Button 
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-primary hover:text-white px-8 py-3 rounded-full font-heading font-bold transition-colors"
          >
            Fale Conosco
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
