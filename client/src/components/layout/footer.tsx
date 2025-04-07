import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube, FaPaperPlane } from "react-icons/fa";
import { 
  BookOpen, Heart, Sparkles,
  Crown, Star, Wand2
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden mt-24">
      {/* Fantasy landscape transition */}
      <div className="footer-landscape relative -mt-24">
        {/* Grassy hill with 3D effect */}
        <div className="hill hill-back"></div>
        <div className="hill hill-middle"></div>
        <div className="hill hill-front"></div>
        
        {/* Floating clouds */}
        <div className="cloud-wrapper">
          <div className="cloud cloud-1 float-slow"></div>
          <div className="cloud cloud-2 float-medium"></div>
          <div className="cloud cloud-3 float-fast"></div>
        </div>
        
        {/* Flying birds */}
        <div className="birds">
          <div className="bird bird-1"></div>
          <div className="bird bird-2"></div>
          <div className="bird bird-3"></div>
        </div>
        
        {/* Little cartoon house */}
        <div className="house">
          <div className="house-body"></div>
          <div className="house-roof"></div>
          <div className="house-door"></div>
          <div className="house-window"></div>
          <div className="house-chimney">
            <div className="smoke smoke-1"></div>
            <div className="smoke smoke-2"></div>
            <div className="smoke smoke-3"></div>
          </div>
        </div>
        
        {/* Rainbow arch */}
        <div className="rainbow">
          <div className="rainbow-layer rainbow-layer-1"></div>
          <div className="rainbow-layer rainbow-layer-2"></div>
          <div className="rainbow-layer rainbow-layer-3"></div>
          <div className="rainbow-layer rainbow-layer-4"></div>
          <div className="rainbow-layer rainbow-layer-5"></div>
          <div className="rainbow-layer rainbow-layer-6"></div>
          <div className="rainbow-layer rainbow-layer-7"></div>
        </div>
        
        {/* Bouncing characters */}
        <div className="character character-leo bounce-slow"></div>
        <div className="character character-bia bounce-medium"></div>
      </div>
      
      {/* Main footer content with paper texture background */}
      <div className="paper-bg text-gray-800 py-16 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Column 1: Logo and Description */}
            <div className="md:col-span-4">
              <div className="storybook-frame mb-6">
                <h3 className="text-2xl font-heading font-bold text-center">
                  <span className="text-blue-600">Leiturinha</span>
                  <span className="text-yellow-500">Bot</span>
                </h3>
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Histórias infantis personalizadas em português, criadas com inteligência artificial para despertar a imaginação das crianças e tornar cada momento de leitura mágico!
              </p>
              <div className="flex space-x-3">
                <a href="#" className="social-button facebook">
                  <FaFacebookF size={18} />
                </a>
                <a href="#" className="social-button instagram">
                  <FaInstagram size={18} />
                </a>
                <a href="#" className="social-button twitter">
                  <FaTwitter size={18} />
                </a>
                <a href="#" className="social-button youtube">
                  <FaYoutube size={18} />
                </a>
              </div>
            </div>

            {/* Column 2: Navegação */}
            <div className="md:col-span-2">
              <div className="navigation-container">
                <h4 className="crayon-title">
                  <BookOpen size={18} className="crayon-icon" />
                  Navegação
                </h4>
                <ul className="crayon-list">
                  <li>
                    <Link href="/">
                      <div className="crayon-item">
                        Início
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link href="/story/create">
                      <div className="crayon-item">
                        Criar História
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link href="/characters">
                      <div className="crayon-item">
                        Personagens
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link href="/age-groups">
                      <div className="crayon-item">
                        Faixas etárias
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link href="/about">
                      <div className="crayon-item">
                        Sobre Nós
                      </div>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Column 3: Planos */}
            <div className="md:col-span-2">
              <div className="navigation-container">
                <h4 className="crayon-title">
                  <Crown size={18} className="crayon-icon" />
                  Planos
                </h4>
                <ul className="crayon-list">
                  <li>
                    <Link href="/subscription/plans#free">
                      <div className="crayon-item">
                        Gratuito
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link href="/subscription/plans#plus">
                      <div className="crayon-item">
                        Plus
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link href="/subscription/plans#family">
                      <div className="crayon-item">
                        Família
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link href="/subscription/plans">
                      <div className="crayon-item">
                        Comparar
                      </div>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Column 4: Newsletter */}
            <div className="md:col-span-4">
              <div className="storybook-page">
                <h4 className="page-title">
                  <Star className="page-icon" />
                  <span>Fique por dentro</span>
                  <Star className="page-icon" />
                </h4>
                <p className="newsletter-text">
                  Receba dicas de leitura e conteúdo educativo para seus filhos!
                </p>
                <div className="newsletter-form">
                  <Input
                    type="email"
                    placeholder="Seu e-mail"
                    className="newsletter-input"
                  />
                  <Button className="newsletter-button">
                    <FaPaperPlane />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Call to action button in a notebook style frame */}
          <div className="cta-container">
            <div className="cta-notebook">
              <div className="notebook-binding"></div>
              <div className="notebook-page">
                <Link href="/story/create">
                  <Button className="cta-button">
                    <span className="cta-text">
                      <Wand2 size={18} className="mr-2" />
                      <span>CRIAR MINHA HISTÓRIA</span>
                    </span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Copyright section with whimsical divider */}
          <div className="copyright-section">
            <div className="crayon-divider">
              <div className="crayon crayon-red"></div>
              <div className="crayon crayon-orange"></div>
              <div className="crayon crayon-yellow"></div>
              <div className="crayon crayon-green"></div>
              <div className="crayon crayon-blue"></div>
              <div className="crayon crayon-purple"></div>
            </div>
            
            <div className="copyright-content">
              <div className="copyright-text">
                <Heart size={16} className="text-red-500 pulse" /> 
                <span>&copy; {new Date().getFullYear()} LeiturinhaBot. Todos os direitos reservados.</span>
              </div>
              <div className="copyright-links">
                <Link href="/terms"><div className="copyright-link">Termos</div></Link>
                <Link href="/privacy"><div className="copyright-link">Privacidade</div></Link>
                <Link href="/cookies"><div className="copyright-link">Cookies</div></Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom decorative elements */}
      <div className="footer-bottom">
        <div className="pencil-border"></div>
      </div>
    </footer>
  );
};

export default Footer;
