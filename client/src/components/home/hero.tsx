import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: number;
  name: string;
}

interface AuthStatus {
  isAuthenticated: boolean;
  user?: User;
}

// Character components
const PirateCharacter = () => (
  <div className="character character-left float">
    <svg viewBox="0 0 200 300" className="w-full h-full">
      {/* Hat */}
      <path d="M100,50 L150,90 L50,90 Z" fill="#333" />
      <rect x="60" y="70" width="80" height="20" fill="#333" />
      
      {/* Head */}
      <circle cx="100" cy="110" r="30" fill="#FFD89C" />
      
      {/* Eyes */}
      <circle cx="85" cy="105" r="5" fill="#333" />
      <circle cx="115" cy="105" r="5" fill="#333" />
      
      {/* Smile */}
      <path d="M85,120 Q100,135 115,120" stroke="#333" strokeWidth="3" fill="none" />
      
      {/* Body */}
      <rect x="80" y="140" width="40" height="60" fill="#FF6B6B" />
      <rect x="80" y="140" width="40" height="15" fill="#FFF" />
      
      {/* Arms */}
      <rect x="60" y="145" width="20" height="50" fill="#FF6B6B" />
      <rect x="120" y="145" width="20" height="50" fill="#FF6B6B" />
      <circle cx="60" cy="170" r="10" fill="#FFD89C" />
      <circle cx="140" cy="170" r="10" fill="#FFD89C" />
      
      {/* Legs */}
      <rect x="80" y="200" width="15" height="50" fill="#333" />
      <rect x="105" y="200" width="15" height="50" fill="#333" />
      
      {/* Feet */}
      <ellipse cx="87" cy="250" rx="15" ry="7" fill="#8B4513" />
      <ellipse cx="113" cy="250" rx="15" ry="7" fill="#8B4513" />
    </svg>
  </div>
);

const FairyCharacter = () => (
  <div className="character character-right float">
    <svg viewBox="0 0 200 300" className="w-full h-full">
      {/* Head */}
      <circle cx="100" cy="70" r="30" fill="#FFB6C1" />
      
      {/* Hair */}
      <path d="M70,70 Q100,20 130,70" fill="#FF69B4" />
      <path d="M70,70 Q60,90 75,110" fill="#FF69B4" />
      <path d="M130,70 Q140,90 125,110" fill="#FF69B4" />
      
      {/* Eyes */}
      <circle cx="85" cy="65" r="5" fill="#333" />
      <circle cx="115" cy="65" r="5" fill="#333" />
      
      {/* Smile */}
      <path d="M85,80 Q100,95 115,80" stroke="#333" strokeWidth="3" fill="none" />
      
      {/* Dress */}
      <path d="M70,100 L100,220 L130,100 Z" fill="#9370DB" />
      
      {/* Arms */}
      <path d="M70,100 Q50,80 30,110" stroke="#FFB6C1" strokeWidth="10" fill="none" />
      <path d="M130,100 Q150,80 170,110" stroke="#FFB6C1" strokeWidth="10" fill="none" />
      
      {/* Wand */}
      <line x1="170" y1="110" x2="180" y2="90" stroke="#FFD700" strokeWidth="3" />
      <circle cx="180" cy="90" r="8" fill="#FFD700" />
      <circle cx="180" cy="90" r="4" fill="#FFF" />
      
      {/* Wings */}
      <ellipse cx="70" cy="120" rx="20" ry="40" fill="#ADD8E6" opacity="0.7" transform="rotate(-30,70,120)" />
      <ellipse cx="130" cy="120" rx="20" ry="40" fill="#ADD8E6" opacity="0.7" transform="rotate(30,130,120)" />
    </svg>
  </div>
);

const MermaidCharacter = () => (
  <div className="character" style={{right: "20%", bottom: "60px"}}>
    <svg viewBox="0 0 200 300" className="w-full h-full" style={{width: "120px"}}>
      {/* Head */}
      <circle cx="100" cy="70" r="25" fill="#FFD89C" />
      
      {/* Hair */}
      <path d="M75,50 Q100,10 125,50" fill="#CD5C5C" />
      <path d="M75,50 Q60,80 80,110" fill="#CD5C5C" />
      <path d="M125,50 Q140,80 120,110" fill="#CD5C5C" />
      
      {/* Eyes */}
      <circle cx="90" cy="65" r="4" fill="#333" />
      <circle cx="110" cy="65" r="4" fill="#333" />
      
      {/* Smile */}
      <path d="M90,80 Q100,90 110,80" stroke="#333" strokeWidth="2" fill="none" />
      
      {/* Mermaid tail */}
      <path d="M80,95 Q100,110 120,95 L120,180 Q100,200 80,180 Z" fill="#4682B4" />
      <path d="M80,180 Q100,200 120,180 L140,220 Q100,250 60,220 Z" fill="#4682B4" />
      
      {/* Scales */}
      <path d="M90,120 Q100,130 110,120" stroke="#6CA6CD" strokeWidth="2" fill="none" />
      <path d="M85,140 Q100,150 115,140" stroke="#6CA6CD" strokeWidth="2" fill="none" />
      <path d="M80,160 Q100,170 120,160" stroke="#6CA6CD" strokeWidth="2" fill="none" />
      
      {/* Top */}
      <path d="M80,95 Q100,85 120,95 Q120,110 100,115 Q80,110 80,95" fill="#CD5C5C" />
    </svg>
  </div>
);

const Hero = () => {
  const { data: authStatus } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
  });

  return (
    <section className="storymakery-hero">
      {/* Rainbow arc background */}
      <div className="rainbow-arc"></div>
      
      {/* Cloud decorations */}
      <div className="cloud cloud-1"></div>
      <div className="cloud cloud-2"></div>
      <div className="cloud cloud-3"></div>
      
      {/* Main content container */}
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-blue-900 drop-shadow-md">
            Histórias Personalizadas
          </h1>
          <p className="max-w-2xl mx-auto mt-6 text-lg md:text-xl text-blue-900 leading-relaxed">
            Nossas histórias são cheias de personagens e aventuras. Elas acompanharão as crianças em uma jornada que vai durar por muitos anos. Perfeita para pequenos com grandes sonhos.
          </p>
        </div>
        
        {/* Call to action buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20">
          {authStatus?.isAuthenticated ? (
            <Link href="/story/create">
              <Button className="storymakery-button">
                <span className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  CRIAR HISTÓRIA
                </span>
              </Button>
            </Link>
          ) : (
            <Link href="/register">
              <Button className="storymakery-button">
                <span className="flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  COMECE AGORA
                </span>
              </Button>
            </Link>
          )}
        </div>
        
        {/* Character illustrations */}
        <PirateCharacter />
        <FairyCharacter />
        <MermaidCharacter />
        
        {/* Ground/grass decoration */}
        <div className="ground"></div>
        <div className="grass-decoration"></div>
      </div>
      
      {/* Magic adventure tagline */}
      <div className="text-center relative z-10 mt-4">
        <h2 className="text-2xl font-heading font-bold text-white drop-shadow-md mb-4">
          Embarque em uma aventura mágica com personagens incríveis
        </h2>
      </div>
      
      {/* Book showcase section */}
      <div className="relative z-10 mt-10 bg-white py-16">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            {/* Books display */}
            <div className="text-center mb-8 md:mb-0 md:flex-1 max-w-sm">
              <div className="relative w-full h-64 mx-auto">
                <div className="absolute book left-0 w-40 h-52 rounded-lg transform -rotate-12 shadow-xl overflow-hidden">
                  <div className="w-full h-full bg-blue-100 p-2">
                    <div className="bg-white w-full h-full rounded p-2 flex flex-col justify-center items-center">
                      <BookOpen className="w-8 h-8 text-blue-500 mb-2" />
                      <div className="text-xs text-center text-blue-900 font-bold">Uma Aventura Pirata</div>
                    </div>
                  </div>
                </div>
                <div className="absolute book center-0 w-40 h-52 rounded-lg transform rotate-6 shadow-xl overflow-hidden" style={{left: "35%", top: "5%"}}>
                  <div className="w-full h-full bg-green-100 p-2">
                    <div className="bg-white w-full h-full rounded p-2 flex flex-col justify-center items-center">
                      <BookOpen className="w-8 h-8 text-green-500 mb-2" />
                      <div className="text-xs text-center text-green-900 font-bold">Aventuras na Floresta</div>
                    </div>
                  </div>
                </div>
                <div className="absolute book right-0 w-40 h-52 rounded-lg transform -rotate-6 shadow-xl overflow-hidden">
                  <div className="w-full h-full bg-purple-100 p-2">
                    <div className="bg-white w-full h-full rounded p-2 flex flex-col justify-center items-center">
                      <BookOpen className="w-8 h-8 text-purple-500 mb-2" />
                      <div className="text-xs text-center text-purple-900 font-bold">Reino Mágico</div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-blue-900 font-heading font-bold mt-6">
                Todas as histórias incluem ilustrações adoráveis e coloridas!
              </p>
            </div>
            
            {/* Features */}
            <div className="md:flex-1 max-w-sm">
              <h3 className="text-2xl font-heading text-blue-900 mb-6 text-center">
                Cada história pode ser personalizada
              </h3>
              <div className="bg-blue-50 rounded-xl p-6 shadow-md text-center">
                <ul className="space-y-4">
                  <li className="font-heading flex items-center">
                    <span className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                      <span className="text-yellow-600">✓</span>
                    </span>
                    <span className="text-blue-900">Nome da criança</span>
                  </li>
                  <li className="font-heading flex items-center">
                    <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <span className="text-green-600">✓</span>
                    </span>
                    <span className="text-blue-900">Dedicatória especial</span>
                  </li>
                  <li className="font-heading flex items-center">
                    <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <span className="text-blue-600">✓</span>
                    </span>
                    <span className="text-blue-900">Características únicas</span>
                  </li>
                  <li className="font-heading flex items-center">
                    <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                      <span className="text-purple-600">✓</span>
                    </span>
                    <span className="text-blue-900">Histórias sempre diferentes</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
