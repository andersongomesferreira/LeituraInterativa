import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";
import { Check, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  description: string;
  features: string[];
}

const SubscriptionPlans = () => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  const { data: authStatus } = useQuery({
    queryKey: ["/api/auth/status"],
  });
  
  const { data: plans = [], isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });
  
  const { data: currentSubscription } = useQuery({
    queryKey: ["/api/user-subscription"],
    enabled: !!authStatus?.isAuthenticated,
  });
  
  const subscribeMutation = useMutation({
    mutationFn: async (planId: number) => {
      return apiRequest("POST", "/api/subscribe", { planId });
    },
    onSuccess: () => {
      toast({
        title: "Assinatura atualizada com sucesso!",
        description: "Aproveite todos os recursos do plano.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar assinatura",
        description: "Por favor, tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });
  
  const handleSelectPlan = (planId: number) => {
    if (!authStatus?.isAuthenticated) {
      navigate("/login");
      return;
    }
    
    subscribeMutation.mutate(planId);
  };

  if (isLoading) {
    return (
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
            Escolha o plano ideal para sua família
          </h2>
          <p className="text-neutral-600 text-center max-w-2xl mx-auto mb-12">
            Carregando planos...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
          Escolha o plano ideal para sua família
        </h2>
        <p className="text-neutral-600 text-center max-w-2xl mx-auto mb-12">
          Temos opções para todas as necessidades, desde o plano gratuito até o plano família completo.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const isPopular = index === 1;
            const isCurrentPlan = currentSubscription?.plan?.id === plan.id;
            
            return (
              <div 
                key={plan.id}
                className={cn(
                  "bg-white rounded-2xl shadow-lg overflow-hidden border transition-all transform hover:-translate-y-1",
                  isPopular ? "border-2 border-primary relative transform scale-105 hover:shadow-xl" : "border-neutral-200 hover:shadow-xl",
                )}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-primary text-white py-1 px-4 rounded-bl-lg font-bold text-sm">
                    MAIS POPULAR
                  </div>
                )}
                
                <div className={cn(
                  "p-6 text-center",
                  plan.name === "Plano Gratuito" ? "bg-neutral-100" : 
                  plan.name === "Plano Leiturinha Plus" ? "bg-primary bg-opacity-10" : 
                  "bg-secondary bg-opacity-10"
                )}>
                  <h3 className={cn(
                    "font-heading font-bold text-2xl",
                    plan.name === "Plano Leiturinha Plus" ? "text-primary" : 
                    plan.name === "Plano Família" ? "text-secondary" : ""
                  )}>{plan.name}</h3>
                  <div className="text-3xl font-bold mt-4 mb-2">{formatPrice(plan.price)}</div>
                  <p className="text-neutral-500 text-sm">
                    {plan.price === 0 ? "para sempre" : "por mês"}
                  </p>
                </div>
                
                <div className="p-6">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="text-success mt-1 mr-3 h-5 w-5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.name === "Plano Gratuito" && (
                      <li className="flex items-start text-neutral-400">
                        <X className="mt-1 mr-3 h-5 w-5 flex-shrink-0" />
                        <span>Conteúdo com anúncios</span>
                      </li>
                    )}
                  </ul>
                  
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrentPlan}
                    className={cn(
                      "w-full py-3 rounded-lg font-bold",
                      plan.name === "Plano Gratuito" ? "bg-neutral-800 hover:bg-black text-white" :
                      plan.name === "Plano Leiturinha Plus" ? "bg-primary hover:bg-primary-dark text-white" :
                      "bg-secondary hover:bg-secondary-dark text-white"
                    )}
                  >
                    {isCurrentPlan ? "Plano Atual" : 
                     plan.price === 0 ? "Começar Grátis" : 
                     plan.name === "Plano Leiturinha Plus" ? "Assinar Agora" : 
                     "Assinar Plano Família"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="text-center mt-12 max-w-2xl mx-auto">
          <p className="text-neutral-500 mb-4">
            Todas as assinaturas incluem cancelamento fácil a qualquer momento. Ao assinar, você concorda com nossos termos de serviço e política de privacidade.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg" alt="Apple Pay" className="h-8" />
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" alt="Google Pay" className="h-8" />
            <svg className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.5 8.5h-11a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-2a3 3 0 0 0-3-3z"/>
              <path d="M7 15.5a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h.5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H7z"/>
            </svg>
            <svg className="h-8 w-8 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 10a8 8 0 0 1-8 8 8 8 0 0 1-8-8 8 8 0 0 1 8-8 8 8 0 0 1 8 8z"/>
              <path d="M12 21.5a10 10 0 0 1-10-10 10 10 0 0 1 10-10 10 10 0 0 1 10 10 10 10 0 0 1-10 10zm0-18a8 8 0 0 0-8 8 8 8 0 0 0 8 8 8 8 0 0 0 8-8 8 8 0 0 0-8-8z"/>
            </svg>
            <svg className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L6 10H18L12 2Z"/>
              <path d="M12 22L18 14H6L12 22Z"/>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionPlans;
