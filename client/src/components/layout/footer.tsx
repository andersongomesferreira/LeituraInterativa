import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube, FaPaperPlane } from "react-icons/fa";
import { 
  BookOpen, Heart, Phone, MapPin, Sparkles, 
  Crown, FileText, ShieldCheck, Users
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden">
      {/* Storymakery-style cloud transition */}
      <div className="w-full h-24 bg-white relative">
        <div className="cloud absolute top-0 left-1/4 w-48 h-20 bg-white"></div>
        <div className="cloud absolute top-5 right-1/3 w-64 h-24 bg-white"></div>
        <div className="cloud absolute -top-5 left-2/3 w-32 h-16 bg-white"></div>
      </div>
      
      {/* Rainbow dots border */}
      <div className="rainbow-dots-border w-full h-8"></div>
      
      {/* Main footer content with sky blue background */}
      <div className="bg-sky-100 text-gray-800 py-12 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Column 1: Logo and Description */}
            <div>
              <div className="logo-container inline-block mb-6">
                <h3 className="text-2xl font-heading font-bold text-center">
                  <span className="text-blue-500">Leiturinha</span>
                  <span className="text-yellow-500">Bot</span>
                </h3>
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Histórias infantis personalizadas em português, criadas com inteligência artificial para despertar a imaginação das crianças.
              </p>
              <div className="flex space-x-3">
                <a href="#" className="h-10 w-10 rounded-full bg-white flex items-center justify-center hover:bg-blue-50 transition-colors text-blue-500 shadow-md">
                  <FaFacebookF size={18} />
                </a>
                <a href="#" className="h-10 w-10 rounded-full bg-white flex items-center justify-center hover:bg-blue-50 transition-colors text-blue-500 shadow-md">
                  <FaInstagram size={18} />
                </a>
                <a href="#" className="h-10 w-10 rounded-full bg-white flex items-center justify-center hover:bg-blue-50 transition-colors text-blue-500 shadow-md">
                  <FaTwitter size={18} />
                </a>
                <a href="#" className="h-10 w-10 rounded-full bg-white flex items-center justify-center hover:bg-blue-50 transition-colors text-blue-500 shadow-md">
                  <FaYoutube size={18} />
                </a>
              </div>
            </div>

            {/* Column 2: Navegação */}
            <div>
              <h4 className="font-heading font-bold text-xl mb-5 text-blue-700">
                Navegação
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/">
                    <div className="text-gray-700 hover:text-blue-600 transition-colors">
                      Início
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/story/create">
                    <div className="text-gray-700 hover:text-blue-600 transition-colors">
                      Criar História
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/story/create">
                    <div className="text-gray-700 hover:text-blue-600 transition-colors">
                      Personagens
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/">
                    <div className="text-gray-700 hover:text-blue-600 transition-colors">
                      Faixas etárias
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/about">
                    <div className="text-gray-700 hover:text-blue-600 transition-colors">
                      Sobre Nós
                    </div>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Planos */}
            <div>
              <h4 className="font-heading font-bold text-xl mb-5 text-blue-700">
                Planos
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/subscription/plans#free">
                    <div className="text-gray-700 hover:text-blue-600 transition-colors">
                      Plano Gratuito
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/subscription/plans#plus">
                    <div className="text-gray-700 hover:text-blue-600 transition-colors">
                      Leiturinha Plus
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/subscription/plans#family">
                    <div className="text-gray-700 hover:text-blue-600 transition-colors">
                      Plano Família
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/subscription/plans">
                    <div className="text-gray-700 hover:text-blue-600 transition-colors">
                      Comparar Planos
                    </div>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Newsletter */}
            <div className="storymakery-card bg-white p-6">
              <h4 className="font-heading font-bold text-xl mb-4 text-blue-700">
                Fique por dentro
              </h4>
              <p className="text-gray-700 mb-4">
                Receba dicas de leitura e conteúdo educativo para seus filhos!
              </p>
              <div className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Seu e-mail"
                  className="px-4 py-2 w-full text-neutral-800 focus:outline-none border border-gray-200 rounded-lg"
                />
                <Button className="storymakery-button px-3 py-2">
                  <FaPaperPlane />
                </Button>
              </div>
            </div>
          </div>

          {/* Call to action section */}
          <div className="mt-16 text-center">
            <Link href="/story/create">
              <Button className="storymakery-button px-8 py-3">
                <span className="flex items-center">
                  <Sparkles size={16} className="mr-2" />
                  <span>CRIAR MINHA HISTÓRIA</span>
                </span>
              </Button>
            </Link>
          </div>
          
          {/* Copyright section */}
          <div className="border-t border-blue-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-600 text-sm">
            <div className="flex items-center">
              <Heart size={16} className="mr-2 text-red-500" /> 
              <span>&copy; {new Date().getFullYear()} LeiturinhaBot. Todos os direitos reservados.</span>
            </div>
            <div className="mt-6 md:mt-0 flex space-x-6">
              <Link href="/">
                <div className="hover:text-blue-600 transition-colors">Termos</div>
              </Link>
              <Link href="/">
                <div className="hover:text-blue-600 transition-colors">Privacidade</div>
              </Link>
              <Link href="/">
                <div className="hover:text-blue-600 transition-colors">Cookies</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Rainbow dots border */}
      <div className="rainbow-dots-border w-full h-8"></div>
    </footer>
  );
};

export default Footer;
