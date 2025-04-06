import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Shield, BookOpen, Smartphone } from "lucide-react";

interface AuthStatus {
  isAuthenticated: boolean;
}

const CallToAction = () => {
  const { data: authStatus } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
  });

  return (
    <section className="py-16 px-4 bg-gradient-to-r from-primary to-secondary">
      <div className="container mx-auto max-w-4xl text-center text-white">
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
          Comece a jornada de leitura com seu filho hoje
        </h2>
        <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
          Histórias incríveis, personagens encantadores e momentos inesquecíveis aguardam por vocês.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {authStatus?.isAuthenticated ? (
            <Button 
              asChild
              className="bg-white text-primary hover:bg-neutral-100 px-8 py-4 rounded-full font-heading font-bold text-lg transition-colors"
            >
              <Link href="/story/create">
                <a>Criar História</a>
              </Link>
            </Button>
          ) : (
            <Button 
              asChild
              className="bg-white text-primary hover:bg-neutral-100 px-8 py-4 rounded-full font-heading font-bold text-lg transition-colors"
            >
              <Link href="/register">
                <a>Criar Conta Gratuita</a>
              </Link>
            </Button>
          )}
          <Button 
            asChild
            className="bg-accent text-neutral-800 hover:bg-accent-dark px-8 py-4 rounded-full font-heading font-bold text-lg transition-colors"
          >
            <Link href="/story/create">
              <a>Ver Exemplos de Histórias</a>
            </Link>
          </Button>
        </div>
        
        <div className="mt-12 flex flex-wrap justify-center gap-6">
          <div className="flex items-center bg-white bg-opacity-20 rounded-xl px-4 py-3">
            <Shield className="h-6 w-6 text-2xl mr-3" />
            <div className="text-left">
              <h3 className="font-heading font-bold">Seguro</h3>
              <p className="text-sm opacity-90">Conteúdo apropriado e seguro</p>
            </div>
          </div>
          <div className="flex items-center bg-white bg-opacity-20 rounded-xl px-4 py-3">
            <BookOpen className="h-6 w-6 text-2xl mr-3" />
            <div className="text-left">
              <h3 className="font-heading font-bold">Educativo</h3>
              <p className="text-sm opacity-90">Histórias que ensinam valores</p>
            </div>
          </div>
          <div className="flex items-center bg-white bg-opacity-20 rounded-xl px-4 py-3">
            <Smartphone className="h-6 w-6 text-2xl mr-3" />
            <div className="text-left">
              <h3 className="font-heading font-bold">Multidispositivo</h3>
              <p className="text-sm opacity-90">Web, iOS e Android</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
