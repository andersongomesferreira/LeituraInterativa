import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, Star, Wand, Crown, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: number;
  name: string;
}

interface AuthStatus {
  isAuthenticated: boolean;
  user?: User;
}

// Character SVG illustrations with embedded animation
const LeoCharacter = () => (
  <div className="storybook-character leo-character">
    <svg viewBox="0 0 200 300" className="w-full h-full">
      {/* Lion head */}
      <circle className="character-head" cx="100" cy="80" r="40" fill="#f9a825" />
      <circle cx="100" cy="80" r="30" fill="#ffcc80" />
      
      {/* Mane */}
      <g className="lion-mane">
        {[...Array(12)].map((_, i) => (
          <path 
            key={i} 
            d={`M100,80 L${100 + 45 * Math.cos(i * Math.PI / 6)},${80 + 45 * Math.sin(i * Math.PI / 6)}`} 
            stroke="#f9a825" 
            strokeWidth="12" 
            strokeLinecap="round"
          />
        ))}
      </g>
      
      {/* Eyes with blink animation */}
      <g className="character-eyes">
        <circle cx="85" cy="75" r="5" fill="white" />
        <circle cx="85" cy="75" r="3" fill="#333" className="character-pupil" />
        <circle cx="115" cy="75" r="5" fill="white" />
        <circle cx="115" cy="75" r="3" fill="#333" className="character-pupil" />
      </g>
      
      {/* Mouth */}
      <path d="M90,95 Q100,105 110,95" stroke="#333" strokeWidth="2" fill="none" className="character-mouth" />
      
      {/* Body */}
      <rect x="80" y="120" width="40" height="60" rx="10" fill="#f9a825" className="character-body" />
      
      {/* Arms */}
      <path d="M80,130 Q60,150 70,170" stroke="#f9a825" strokeWidth="12" strokeLinecap="round" className="character-arm-left" />
      <path d="M120,130 Q140,150 130,170" stroke="#f9a825" strokeWidth="12" strokeLinecap="round" className="character-arm-right" />
      
      {/* Legs */}
      <path d="M85,180 Q80,220 90,230" stroke="#f9a825" strokeWidth="15" strokeLinecap="round" className="character-leg-left" />
      <path d="M115,180 Q120,220 110,230" stroke="#f9a825" strokeWidth="15" strokeLinecap="round" className="character-leg-right" />
      
      {/* Sparkles */}
      <circle cx="70" cy="60" r="4" fill="#fff176" className="sparkle sparkle-1" />
      <circle cx="130" cy="70" r="3" fill="#fff176" className="sparkle sparkle-2" />
      <circle cx="60" cy="110" r="2" fill="#fff176" className="sparkle sparkle-3" />
      <path d="M60,60 L65,65 M60,65 L65,60" stroke="#fff176" strokeWidth="2" className="sparkle sparkle-star-1" />
      <path d="M140,90 L145,95 M140,95 L145,90" stroke="#fff176" strokeWidth="2" className="sparkle sparkle-star-2" />
    </svg>
  </div>
);

const BiaCharacter = () => (
  <div className="storybook-character bia-character">
    <svg viewBox="0 0 200 300" className="w-full h-full">
      {/* Head */}
      <circle className="character-head" cx="100" cy="80" r="35" fill="#ec407a" />
      <circle cx="100" cy="80" r="30" fill="#f8bbd0" />
      
      {/* Hair */}
      <path d="M70,65 C85,25 115,25 130,65" fill="#9c27b0" className="character-hair" />
      <path d="M65,75 C60,45 75,35 85,65" fill="#9c27b0" className="character-hair-strand" />
      <path d="M135,75 C140,45 125,35 115,65" fill="#9c27b0" className="character-hair-strand" />
      
      {/* Eyes with blink animation */}
      <g className="character-eyes">
        <circle cx="85" cy="75" r="5" fill="white" />
        <circle cx="85" cy="75" r="3" fill="#333" className="character-pupil" />
        <circle cx="115" cy="75" r="5" fill="white" />
        <circle cx="115" cy="75" r="3" fill="#333" className="character-pupil" />
      </g>
      
      {/* Mouth */}
      <path d="M90,95 Q100,105 110,95" stroke="#333" strokeWidth="2" fill="none" className="character-mouth" />
      
      {/* Wand with sparkle */}
      <g className="character-wand">
        <line x1="145" y1="130" x2="150" y2="110" stroke="#ffeb3b" strokeWidth="3" />
        <circle cx="150" cy="110" r="8" fill="#ffeb3b" />
        <path d="M150,102 L150,118 M146,106 L154,114 M146,114 L154,106" stroke="white" strokeWidth="1.5" className="wand-sparkle" />
      </g>
      
      {/* Body / Dress */}
      <path d="M70,115 L100,200 L130,115 Z" fill="#ec407a" className="character-dress" />
      <path d="M85,115 L100,150 L115,115 Z" fill="#f06292" className="character-dress-top" />
      
      {/* Arms */}
      <path d="M80,120 Q60,130 45,125" stroke="#f8bbd0" strokeWidth="8" strokeLinecap="round" className="character-arm-left" />
      <path d="M120,120 Q140,130 145,130" stroke="#f8bbd0" strokeWidth="8" strokeLinecap="round" className="character-arm-right" />
      
      {/* Magic sparkles */}
      <circle cx="60" cy="60" r="3" fill="#f8bbd0" className="sparkle sparkle-1" />
      <circle cx="140" cy="70" r="4" fill="#f8bbd0" className="sparkle sparkle-2" />
      <circle cx="70" cy="100" r="2" fill="#f8bbd0" className="sparkle sparkle-3" />
      <path d="M70,50 L75,55 M70,55 L75,50" stroke="#f8bbd0" strokeWidth="2" className="sparkle sparkle-star-1" />
      <path d="M130,50 L135,55 M130,55 L135,50" stroke="#f8bbd0" strokeWidth="2" className="sparkle sparkle-star-2" />
      <path d="M40,120 L45,125 M40,125 L45,120" stroke="#f8bbd0" strokeWidth="2" className="sparkle sparkle-star-3" />
    </svg>
  </div>
);

const Hero = () => {
  const { data: authStatus } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
  });

  return (
    <section className="storybook-hero">
      {/* Storybook page fold corner */}
      <div className="page-corner"></div>
      
      {/* Animated background elements */}
      <div className="storybook-sky">
        {/* Animated clouds */}
        <div className="storybook-cloud cloud-1"></div>
        <div className="storybook-cloud cloud-2"></div>
        <div className="storybook-cloud cloud-3"></div>
        
        {/* Animated stars */}
        <div className="storybook-star star-1"></div>
        <div className="storybook-star star-2"></div>
        <div className="storybook-star star-3"></div>
        <div className="storybook-star star-4"></div>
        <div className="storybook-star star-5"></div>
        
        {/* Rainbow */}
        <div className="storybook-rainbow">
          <div className="rainbow-stripe stripe-1"></div>
          <div className="rainbow-stripe stripe-2"></div>
          <div className="rainbow-stripe stripe-3"></div>
          <div className="rainbow-stripe stripe-4"></div>
          <div className="rainbow-stripe stripe-5"></div>
          <div className="rainbow-stripe stripe-6"></div>
          <div className="rainbow-stripe stripe-7"></div>
        </div>
      </div>
      
      {/* Animated landscape */}
      <div className="storybook-landscape">
        <div className="landscape-hill hill-1"></div>
        <div className="landscape-hill hill-2"></div>
        <div className="landscape-hill hill-3"></div>
        
        {/* Trees */}
        <div className="storybook-tree tree-1">
          <div className="tree-trunk"></div>
          <div className="tree-crown"></div>
        </div>
        <div className="storybook-tree tree-2">
          <div className="tree-trunk"></div>
          <div className="tree-crown"></div>
        </div>
        <div className="storybook-tree tree-3">
          <div className="tree-trunk"></div>
          <div className="tree-crown"></div>
        </div>
        
        {/* Flowers */}
        <div className="storybook-flower flower-1"></div>
        <div className="storybook-flower flower-2"></div>
        <div className="storybook-flower flower-3"></div>
        <div className="storybook-flower flower-4"></div>
        <div className="storybook-flower flower-5"></div>
      </div>
      
      {/* Book edge and bindings */}
      <div className="book-edge left-edge"></div>
      <div className="book-edge right-edge"></div>
      <div className="book-binding">
        <div className="binding-hole binding-hole-1"></div>
        <div className="binding-hole binding-hole-2"></div>
        <div className="binding-hole binding-hole-3"></div>
      </div>
      
      {/* Main content container with paper texture */}
      <div className="storybook-content">
        <div className="storybook-header">
          <div className="storybook-title-wrapper">
            <div className="storybook-title-decoration left-deco">
              <Star className="star-icon" />
              <div className="squiggle-line"></div>
            </div>
            
            <h1 className="storybook-title">
              <span className="title-magic-left">✨</span>
              <span className="title-first">Leiturinha</span>
              <span className="title-second">Bot</span>
              <span className="title-magic-right">✨</span>
            </h1>
            
            <div className="storybook-title-decoration right-deco">
              <div className="squiggle-line"></div>
              <Star className="star-icon" />
            </div>
          </div>
          
          <p className="storybook-subtitle">
            Histórias Mágicas Personalizadas para Crianças de Todas as Idades
          </p>
        </div>
        
        {/* Main illustrated content area */}
        <div className="storybook-main">
          {/* Characters */}
          <LeoCharacter />
          <BiaCharacter />
          
          {/* Magical floating elements */}
          <div className="magical-element magic-wand">
            <Wand />
          </div>
          <div className="magical-element magic-crown">
            <Crown />
          </div>
          <div className="magical-element magic-heart">
            <Heart />
          </div>
          
          {/* Text on illustration */}
          <div className="storybook-callout">
            <div className="callout-text">
              <p>Nossas histórias são mágicas e cheias de aventuras que vão acompanhar as crianças em sua jornada de crescimento e descoberta!</p>
            </div>
          </div>
          
          {/* Call to action */}
          <div className="storybook-cta">
            {authStatus?.isAuthenticated ? (
              <Link href="/story/create">
                <Button className="cta-button">
                  <BookOpen className="cta-icon" />
                  <span className="cta-text">CRIAR MINHA HISTÓRIA</span>
                  <Sparkles className="cta-sparkle" />
                </Button>
              </Link>
            ) : (
              <Link href="/register">
                <Button className="cta-button">
                  <Sparkles className="cta-icon" />
                  <span className="cta-text">COMECE SUA AVENTURA</span>
                  <Wand className="cta-sparkle" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Features section with storybook appearance */}
      <div className="storybook-features">
        <div className="features-page">
          <div className="page-title">
            <h2>
              <Star className="title-star left-star" />
              Escolha Sua Aventura
              <Star className="title-star right-star" />
            </h2>
          </div>
          
          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon bg-red-100">
                <Heart className="text-red-500" />
              </div>
              <div className="feature-text">
                <h3>Personagens Adoráveis</h3>
                <p>Conheça Léo, Bia e muitos outros personagens em histórias exclusivas</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon bg-blue-100">
                <Wand className="text-blue-500" />
              </div>
              <div className="feature-text">
                <h3>Mundos Mágicos</h3>
                <p>Visite florestas encantadas, castelos de cristal e reinos subaquáticos</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon bg-yellow-100">
                <Crown className="text-yellow-500" />
              </div>
              <div className="feature-text">
                <h3>Personalização Total</h3>
                <p>Histórias únicas com o nome e características da criança</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon bg-green-100">
                <BookOpen className="text-green-500" />
              </div>
              <div className="feature-text">
                <h3>Ilustrações Coloridas</h3>
                <p>Cada história tem imagens vibrantes e cheias de encanto</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative page number */}
      <div className="page-number">1</div>
    </section>
  );
};

export default Hero;
