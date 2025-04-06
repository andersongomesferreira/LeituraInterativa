import { Helmet } from "react-helmet";
import SubscriptionPlansComponent from "@/components/home/subscription-plans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

const SubscriptionPlansPage = () => {
  const { data: authStatus } = useQuery({
    queryKey: ["/api/auth/status"],
  });

  const { data: subscription } = useQuery({
    queryKey: ["/api/user-subscription"],
    enabled: !!authStatus?.isAuthenticated,
  });

  return (
    <>
      <Helmet>
        <title>Planos de Assinatura - LeiturinhaBot</title>
        <meta name="description" content="Escolha o plano ideal para criar histórias personalizadas para crianças." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        {authStatus?.isAuthenticated && subscription && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <CardTitle>Seu Plano Atual</CardTitle>
                  <CardDescription>
                    Detalhes da sua assinatura atual do LeiturinhaBot
                  </CardDescription>
                </div>
                <Badge className={`
                  ${subscription.plan.name === "Plano Gratuito" 
                    ? "bg-neutral-800" 
                    : subscription.plan.name === "Plano Leiturinha Plus" 
                    ? "bg-primary" 
                    : "bg-secondary"}
                  text-white px-4 py-1 text-base font-heading font-bold
                `}>
                  {subscription.plan.name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {subscription.plan.name === "Plano Gratuito"
                  ? "Você está usando o plano gratuito com recursos limitados. Atualize para um plano premium para desbloquear todos os recursos."
                  : subscription.plan.name === "Plano Leiturinha Plus"
                  ? "Obrigado por assinar o Plano Leiturinha Plus. Você tem acesso a histórias ilimitadas, todos os personagens e temas."
                  : "Obrigado por assinar o Plano Família. Você tem acesso a todas as funcionalidades premium e até 4 perfis de crianças."}
              </p>
              <div className="text-sm">
                <div>Próxima cobrança: {subscription.plan.name === "Plano Gratuito" ? "N/A" : "10/12/2023"}</div>
                <div className="mt-1">
                  Status: <span className="text-success font-medium">Ativo</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Planos de Assinatura</CardTitle>
            <CardDescription>
              Escolha o plano ideal para sua família e crie histórias personalizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubscriptionPlansComponent />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SubscriptionPlansPage;
