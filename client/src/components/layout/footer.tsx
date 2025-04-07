import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube, FaPaperPlane } from "react-icons/fa";
import { 
  BookOpen, Stars, Heart, Mail, Phone, MapPin, Sparkles, 
  Crown, LifeBuoy, FileText, ShieldCheck, Users, Wand2
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden mt-16">
      {/* Disney-inspired wave decoration with castle silhouette */}
      <div className="absolute top-0 left-0 right-0 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600"></div>
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full fill-blue-100 -mt-1">
          <path d="M0 120L48 105C96 90 192 60 288 55C384 50 480 70 576 75C672 80 768 70 864 65C960 60 1056 60 1152 70C1248 80 1344 100 1392 110L1440 120V0H1392C1344 0 1248 0 1152 0C1056 0 960 0 864 0C768 0 672 0 576 0C480 0 384 0 288 0C192 0 96 0 48 0H0V120Z" />
        </svg>
      </div>
      
      {/* Castle silhouette */}
      <div className="absolute top-14 left-1/2 transform -translate-x-1/2 w-48 h-12 opacity-10 z-0">
        <svg viewBox="0 0 512 180" fill="currentColor" className="text-blue-600">
          <path d="M160,180H96v-40H32v40H0V100H32V60h32v40h32V60h32v40h32V180z M288,180h-64v-40h-32v40h-32V60h32V20h64v40h32V180z M416,180h-64v-40h-32v40h-32V100h32V60h32v40h32V60h32v40h32V180z M512,180h-32v-40h-32v40h-32V60h32V20h32v40h32V180z"/>
        </svg>
      </div>
      
      {/* Sparkles animation */}
      <div className="absolute top-20 left-1/4 w-6 h-6 text-yellow-400 animate-pulse">
        <Sparkles />
      </div>
      <div className="absolute top-24 right-1/3 w-8 h-8 text-yellow-500 animate-pulse" style={{ animationDelay: "1s" }}>
        <Stars />
      </div>
      
      {/* Disney-inspired blue background */}
      <div className="bg-gradient-to-b from-blue-100 to-blue-50 text-gray-800 pt-24 pb-16 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Column 1: Logo and Description */}
            <div>
              <div className="flex items-center mb-6 group">
                <div className="relative h-14 w-14 mr-3 float sparkle">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-full shadow-lg transform group-hover:scale-105 transition-transform duration-300"></div>
                  <div className="absolute inset-1.5 bg-white rounded-full flex items-center justify-center shadow-inner">
                    <Sparkles size={24} className="text-blue-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-md bounce" style={{ animationDelay: "0.5s" }}>
                    <span className="text-xs font-bold text-blue-900">✨</span>
                  </div>
                </div>
                <h3 className="text-2xl font-heading font-bold">
                  <span className="text-blue-600">Leiturinha</span>
                  <span className="text-yellow-500">Bot</span>
                </h3>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Histórias infantis personalizadas em português, criadas com inteligência artificial para despertar a imaginação das crianças e tornar cada momento de leitura uma aventura mágica.
              </p>
              <div className="flex space-x-3">
                <a href="#" className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors text-blue-600">
                  <FaFacebookF size={18} />
                </a>
                <a href="#" className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors text-blue-600">
                  <FaInstagram size={18} />
                </a>
                <a href="#" className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors text-blue-600">
                  <FaTwitter size={18} />
                </a>
                <a href="#" className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors text-blue-600">
                  <FaYoutube size={18} />
                </a>
              </div>
            </div>

            {/* Column 2: Navegação */}
            <div>
              <h4 className="font-heading font-bold text-xl flex items-center mb-5 text-blue-700">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                  <BookOpen size={16} className="text-blue-600" />
                </div>
                Navegação
              </h4>
              <ul className="space-y-3 ml-10">
                <li>
                  <Link href="/">
                    <div className="text-gray-600 hover:text-blue-600 transition-colors flex items-center">
                      <span className="mr-2 text-blue-300">•</span>Início
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/story/create">
                    <div className="text-gray-600 hover:text-blue-600 transition-colors flex items-center">
                      <span className="mr-2 text-blue-300">•</span>Criar História
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/story/create">
                    <div className="text-gray-600 hover:text-blue-600 transition-colors flex items-center">
                      <span className="mr-2 text-blue-300">•</span>Personagens
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/">
                    <div className="text-gray-600 hover:text-blue-600 transition-colors flex items-center">
                      <span className="mr-2 text-blue-300">•</span>Faixas etárias
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/about">
                    <div className="text-gray-600 hover:text-blue-600 transition-colors flex items-center">
                      <span className="mr-2 text-blue-300">•</span>Sobre Nós
                    </div>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Planos */}
            <div>
              <h4 className="font-heading font-bold text-xl flex items-center mb-5 text-blue-700">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                  <Crown size={16} className="text-blue-600" />
                </div>
                Planos
              </h4>
              <ul className="space-y-3 ml-10">
                <li>
                  <Link href="/subscription/plans#free">
                    <div className="text-gray-600 hover:text-blue-600 transition-colors flex items-center">
                      <span className="mr-2 text-blue-300">•</span>Plano Gratuito
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/subscription/plans#plus">
                    <div className="text-gray-600 hover:text-blue-600 transition-colors flex items-center">
                      <span className="mr-2 text-blue-300">•</span>Leiturinha Plus
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/subscription/plans#family">
                    <div className="text-gray-600 hover:text-blue-600 transition-colors flex items-center">
                      <span className="mr-2 text-blue-300">•</span>Plano Família
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/subscription/plans">
                    <div className="text-gray-600 hover:text-blue-600 transition-colors flex items-center">
                      <span className="mr-2 text-blue-300">•</span>Comparar Planos
                    </div>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Disney-inspired subscription form */}
            <div className="card-disney p-6 relative overflow-hidden">
              <div className="absolute inset-0 stars-bg opacity-25"></div>
              <h4 className="font-heading font-bold text-xl flex items-center mb-4 text-blue-700 relative z-10">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                  <Wand2 size={16} className="text-blue-600" />
                </div>
                Fique por dentro
              </h4>
              <p className="text-gray-600 mb-4 relative z-10">
                Receba dicas de leitura, novidades e conteúdo educativo para seus filhos!
              </p>
              <div className="flex relative z-10">
                <Input
                  type="email"
                  placeholder="Seu e-mail"
                  className="rounded-l-full px-4 py-3 w-full text-neutral-800 focus:outline-none border-2 border-r-0 border-blue-200 focus:border-blue-400"
                />
                <Button className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-4 py-3 rounded-r-full transition-colors font-semibold">
                  <FaPaperPlane />
                </Button>
              </div>
              
              {/* Disney magic sparkle decoration */}
              <div className="absolute -bottom-3 -right-3 w-16 h-16 text-blue-300 opacity-25 transform rotate-12">
                <Sparkles size={64} />
              </div>
            </div>
          </div>

          {/* Call to action - Disney style */}
          <div className="mt-12 py-8 px-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl text-center relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 stars-bg opacity-15"></div>
            <h3 className="text-xl font-heading font-bold text-white mb-3 relative z-10">
              Crie histórias únicas para suas crianças!
            </h3>
            <p className="text-blue-100 max-w-xl mx-auto mb-5 relative z-10">
              Experimente agora mesmo e veja a magia acontecer. Sua primeira história é grátis!
            </p>
            <Link href="/story/create">
              <div className="inline-block">
                <Button className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 px-6 py-3 rounded-full transition-colors font-bold shadow-lg relative z-10 transform hover:scale-105 transition-transform flex items-center">
                  <Sparkles size={16} className="mr-2" />
                  <span>Criar minha primeira história</span>
                </Button>
              </div>
            </Link>
            
            {/* Decorative elements */}
            <div className="absolute -top-8 -right-8 w-24 h-24 text-white/20">
              <Sparkles size={96} />
            </div>
            <div className="absolute -bottom-8 -left-8 w-24 h-24 text-white/20">
              <Stars size={96} />
            </div>
          </div>
          
          {/* Disney-style copyright */}
          <div className="border-t border-blue-200 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-blue-500 text-sm">
            <div className="flex items-center">
              <Heart size={16} className="mr-2 text-red-500 animate-pulse" /> 
              <span>&copy; {new Date().getFullYear()} LeiturinhaBot. Todos os direitos reservados.</span>
            </div>
            <div className="mt-6 md:mt-0 flex space-x-6">
              <Link href="/">
                <div className="hover:text-blue-700 transition-colors">Termos</div>
              </Link>
              <Link href="/">
                <div className="hover:text-blue-700 transition-colors">Privacidade</div>
              </Link>
              <Link href="/">
                <div className="hover:text-blue-700 transition-colors">Cookies</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom decorative element */}
      <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600"></div>
    </footer>
  );
};

export default Footer;
