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
    <section className="relative overflow-hidden pt-16 pb-24 px-4">
      {/* Background with playful patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 z-0 bubble-bg"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-400/30 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-blue-400/30 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-purple-400/30 rounded-full blur-xl animate-pulse"></div>
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border-2 border-primary/10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight mb-6 text-primary">
                Histórias <span className="rainbow-text">mágicas</span> para seu filho
              </h1>
              <p className="text-xl mb-8 text-gray-700 font-medium">
                Personalize aventuras educativas em português com personagens divertidos e temas que seu filho vai adorar!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {authStatus?.isAuthenticated ? (
                  <Button 
                    asChild
                    className="btn-bouncy bg-gradient-to-r from-primary to-indigo-600 text-white px-8 py-6 rounded-2xl font-heading font-bold text-xl shadow-lg border-b-4 border-indigo-700"
                  >
                    <Link href="/story/create">
                      <div className="flex items-center">
                        <span className="mr-2">✨</span> 
                        Criar História
                      </div>
                    </Link>
                  </Button>
                ) : (
                  <Button 
                    asChild
                    className="btn-bouncy bg-gradient-to-r from-primary to-indigo-600 text-white px-8 py-6 rounded-2xl font-heading font-bold text-xl shadow-lg border-b-4 border-indigo-700"
                  >
                    <Link href="/register">
                      <div className="flex items-center">
                        <span className="mr-2">✨</span>
                        Experimente Grátis
                      </div>
                    </Link>
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="btn-bouncy bg-white hover:bg-gray-50 text-primary border-2 border-primary/20 px-8 py-6 rounded-2xl font-heading font-bold text-xl transition-colors flex items-center justify-center shadow-lg"
                >
                  <Play className="mr-2 h-6 w-6" /> Ver como funciona
                </Button>
              </div>
            </div>
          </div>
          
          <div className="md:w-1/2 relative">
            <div className="relative z-10 floating">
              <div className="absolute -inset-4 bg-white rounded-[2.5rem] shadow-xl transform -rotate-3"></div>
              <div className="absolute -inset-4 bg-primary/10 rounded-[2.5rem] shadow-xl transform rotate-3"></div>
              <div 
                className="relative rounded-2xl shadow-2xl border-8 border-white overflow-hidden h-[350px] md:h-[450px]"
                style={{
                  background: "url('https://images.unsplash.com/photo-1512253022256-19f1a62a8c98?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=500&q=80') center/cover"
                }}
              ></div>
            </div>
            
            {/* Floating badge */}
            <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-2xl shadow-xl border-2 border-primary/20 flex items-center floating">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-indigo-600 text-white flex items-center justify-center mr-3 shadow-lg">
                <span className="font-bold text-lg">1K+</span>
              </div>
              <div>
                <div className="font-heading font-bold text-primary text-lg">+1000 histórias</div>
                <div className="text-sm text-gray-600">geradas diariamente</div>
              </div>
            </div>
            
            {/* Floating stickers */}
            <div className="absolute top-10 -right-6 bg-yellow-400 p-3 rounded-full shadow-lg transform rotate-12 floating">
              <span className="text-2xl">🚀</span>
            </div>
            <div className="absolute top-1/2 -right-10 bg-green-400 p-3 rounded-full shadow-lg transform -rotate-6 floating" style={{ animationDelay: "0.5s" }}>
              <span className="text-2xl">🦁</span>
            </div>
            <div className="absolute bottom-20 -right-8 bg-blue-400 p-3 rounded-full shadow-lg transform rotate-3 floating" style={{ animationDelay: "1s" }}>
              <span className="text-2xl">🌟</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
