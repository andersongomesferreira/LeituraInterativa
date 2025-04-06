import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: number;
  name: string;
}

interface AuthStatus {
  isAuthenticated: boolean;
  user?: User;
}

const Hero = () => {
  const { data: authStatus } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
  });

  return (
    <section className="bg-gradient-to-br from-primary-light via-primary to-secondary pt-16 pb-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 text-white mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight mb-6">
              Histórias mágicas criadas para seu filho
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Personalize aventuras educativas em português com personagens divertidos e temas que seu filho vai adorar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {authStatus?.isAuthenticated ? (
                <Button 
                  asChild
                  className="bg-accent hover:bg-accent-dark text-neutral-800 px-8 py-4 rounded-full font-heading font-bold text-lg transition-colors transform hover:scale-105 shadow-lg"
                >
                  <Link href="/story/create">
                    <a>Criar História</a>
                  </Link>
                </Button>
              ) : (
                <Button 
                  asChild
                  className="bg-accent hover:bg-accent-dark text-neutral-800 px-8 py-4 rounded-full font-heading font-bold text-lg transition-colors transform hover:scale-105 shadow-lg"
                >
                  <Link href="/register">
                    <a>Experimente Grátis</a>
                  </Link>
                </Button>
              )}
              <Button variant="outline" className="bg-white hover:bg-neutral-100 text-primary px-8 py-4 rounded-full font-heading font-bold text-lg transition-colors flex items-center justify-center">
                <Play className="mr-2 h-5 w-5" /> Ver como funciona
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 relative">
            <div className="relative z-10">
              <div 
                className="rounded-2xl shadow-2xl transform rotate-2 animate-[float_3s_ease-in-out_infinite] h-[300px] md:h-[400px]"
                style={{
                  background: "url('https://images.unsplash.com/photo-1512253022256-19f1a62a8c98?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=500&q=80') center/cover"
                }}
              ></div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg flex items-center animate-[bounce_3s_infinite]">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                <span className="font-bold">1K+</span>
              </div>
              <div>
                <div className="font-heading font-bold">+1000 histórias</div>
                <div className="text-sm text-neutral-500">geradas diariamente</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
