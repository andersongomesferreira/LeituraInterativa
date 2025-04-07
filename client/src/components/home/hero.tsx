import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Play, Sparkles, Wand2 } from "lucide-react";
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
    <section className="relative overflow-hidden pt-10 pb-32 px-4">
      {/* Sky blue background with clouds */}
      <div className="absolute inset-0 bg-sky-300 z-0"></div>
      
      {/* Rainbow at the top */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500"></div>
      
      {/* Clouds */}
      <div className="absolute top-12 left-[5%] w-32 h-16 bg-white rounded-full blur-md"></div>
      <div className="absolute top-16 left-[10%] w-40 h-20 bg-white rounded-full blur-md"></div>
      <div className="absolute top-10 right-[15%] w-36 h-18 bg-white rounded-full blur-md"></div>
      <div className="absolute top-20 right-[10%] w-48 h-24 bg-white rounded-full blur-md"></div>
      
      {/* Grass/hills at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-green-500 rounded-t-[100%] transform translate-y-14"></div>
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-green-600 rounded-t-[100%] transform translate-y-12"></div>
      
      <div className="container mx-auto max-w-6xl relative z-10 pt-10">
        {/* Story Maker Logo */}
        <div className="flex justify-center mb-4">
          <div className="bg-white p-4 rounded-2xl shadow-xl inline-block">
            <h1 className="text-4xl font-heading font-bold tracking-wide">
              <span className="text-blue-600">Leiturinha</span>
              <span className="text-yellow-500">Bot</span>
            </h1>
          </div>
        </div>
        
        {/* Main headline */}
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white drop-shadow-md">
            Histórias Personalizadas
          </h2>
        </div>

        {/* Main content area with characters */}
        <div className="flex flex-col md:flex-row items-center justify-between mt-8 mb-12">
          {/* Pirate Boy Character */}
          <div className="hidden md:block w-1/4 relative">
            <div className="absolute bottom-0 left-0 w-40 h-48 bg-transparent float">
              <svg viewBox="0 0 100 120" className="w-full h-full">
                <rect x="40" y="0" width="20" height="20" fill="#ff6b6b" rx="10" />
                <rect x="30" y="15" width="40" height="40" fill="#ff6b6b" rx="10" />
                <circle cx="50" cy="30" r="15" fill="#feca57" />
                <circle cx="44" cy="27" r="3" fill="#222" />
                <circle cx="56" cy="27" r="3" fill="#222" />
                <path d="M45 35 Q 50 40 55 35" stroke="#222" strokeWidth="2" fill="none" />
                <rect x="30" y="55" width="15" height="40" fill="#ff6b6b" />
                <rect x="55" y="55" width="15" height="40" fill="#ff6b6b" />
                <rect x="40" y="55" width="20" height="25" fill="#1e3799" />
                <rect x="42" y="80" width="7" height="15" fill="#feca57" />
                <rect x="52" y="80" width="7" height="15" fill="#feca57" />
                <circle cx="35" cy="18" r="10" fill="#222" />
                <rect x="25" y="14" width="20" height="6" fill="#222" />
              </svg>
            </div>
          </div>
          
          {/* Center content */}
          <div className="w-full md:w-2/4 text-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border-4 border-white">
              <p className="text-xl mb-8 text-gray-700 font-medium leading-relaxed">
                Nossas histórias são cheias de personagens e aventuras. Elas acompanharão as crianças em uma jornada que vai durar por muitos anos. Perfeita para pequenos com grandes sonhos, nossas histórias serão tesouros para além da infância.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {authStatus?.isAuthenticated ? (
                  <Button 
                    asChild
                    className="btn-disney"
                  >
                    <Link href="/story/create">
                      <div className="flex items-center">
                        <Wand2 className="mr-2 h-5 w-5" />
                        Criar História
                      </div>
                    </Link>
                  </Button>
                ) : (
                  <Button 
                    asChild
                    className="btn-disney"
                  >
                    <Link href="/register">
                      <div className="flex items-center">
                        <Sparkles className="mr-2 h-5 w-5" />
                        Experimente Grátis
                      </div>
                    </Link>
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="btn-disney-secondary"
                >
                  <Play className="mr-2 h-5 w-5" /> Ver como funciona
                </Button>
              </div>
            </div>
          </div>
          
          {/* Fairy Character */}
          <div className="hidden md:block w-1/4 relative">
            <div className="absolute bottom-0 right-0 w-48 h-56 bg-transparent float" style={{animationDelay: "0.5s"}}>
              <svg viewBox="0 0 100 140" className="w-full h-full">
                <rect x="40" y="0" width="20" height="20" fill="#ff9ff3" rx="10" />
                <rect x="30" y="15" width="40" height="40" fill="#ff9ff3" rx="20" />
                <circle cx="50" cy="30" r="15" fill="#feca57" />
                <circle cx="44" cy="27" r="3" fill="#222" />
                <circle cx="56" cy="27" r="3" fill="#222" />
                <path d="M45 35 Q 50 40 55 35" stroke="#222" strokeWidth="2" fill="none" />
                <path d="M30 65 L 40 45 L 50 65 L 60 45 L 70 65" fill="#ff9ff3" />
                <ellipse cx="50" cy="110" rx="15" ry="30" fill="#ff9ff3" />
                <ellipse cx="25" cy="40" rx="15" ry="5" fill="#48dbfb" transform="rotate(-20,25,40)" />
                <ellipse cx="75" cy="40" rx="15" ry="5" fill="#48dbfb" transform="rotate(20,75,40)" />
                <path d="M50 65 L 45 95 M 50 65 L 55 95" stroke="#ff9ff3" strokeWidth="10" />
                <path d="M23 40 L 10 35 M 77 40 L 90 35" stroke="#48dbfb" strokeWidth="3" />
                <circle cx="12" cy="35" r="5" fill="#a29bfe" />
                <circle cx="88" cy="35" r="5" fill="#a29bfe" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* "Start your adventure" text */}
        <div className="text-center relative z-20">
          <h3 className="text-2xl font-heading font-bold text-white drop-shadow-lg mb-4">
            Embarque em uma aventura mágica com personagens incríveis
          </h3>
          
          {/* Sparkling stars decoration */}
          <div className="absolute top-0 left-1/4 text-yellow-400 animate-pulse">
            <Sparkles size={20} />
          </div>
          <div className="absolute top-1/2 right-1/4 text-yellow-400 animate-pulse" style={{animationDelay: "0.7s"}}>
            <Sparkles size={16} />
          </div>
        </div>
      </div>
      
      {/* Features section with book images */}
      <div className="relative z-20 mt-8 container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
          <div className="w-full max-w-xs text-center">
            <div className="mb-3 text-center text-white font-heading font-bold">
              Todas as histórias incluem ilustrações adoráveis e coloridas!
            </div>
            
            {/* Book images */}
            <div className="relative w-56 h-56 mx-auto">
              <div className="absolute card-disney w-48 h-48 bg-white p-2 shadow-xl transform -rotate-6 left-0 top-0">
                <div className="w-full h-full bg-blue-100 rounded-sm flex items-center justify-center">
                  <span className="text-xl">📚</span>
                </div>
              </div>
              <div className="absolute card-disney w-48 h-48 bg-white p-2 shadow-xl transform rotate-6 right-0 top-4">
                <div className="w-full h-full bg-green-100 rounded-sm flex items-center justify-center">
                  <span className="text-xl">📗</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full max-w-xs text-center">
            <div className="mb-3 text-center text-white font-heading font-bold">
              Cada história pode ser personalizada com nome, dedicatória e fotos!
            </div>
            
            {/* Personalization illustration */}
            <div className="card-disney bg-white/90 p-4 rounded-xl mx-auto w-56">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 mb-2 flex items-center justify-center">
                  <Wand2 size={24} className="text-blue-600" />
                </div>
                <div className="text-sm text-blue-700 font-bold">Personalize sua história</div>
                <div className="text-xs text-gray-500 mt-1">Nome, idade, preferências</div>
                <div className="w-full h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mt-2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
