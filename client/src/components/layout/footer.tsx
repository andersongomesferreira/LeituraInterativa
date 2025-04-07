import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube, FaPaperPlane } from "react-icons/fa";
import { BookOpen, Star, Heart, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden">
      {/* Decorative wavy pattern */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-indigo-100 overflow-hidden">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -top-10 w-full">
          <path d="M0 120L48 105C96 90 192 60 288 55C384 50 480 70 576 75C672 80 768 70 864 65C960 60 1056 60 1152 70C1248 80 1344 100 1392 110L1440 120V0H1392C1344 0 1248 0 1152 0C1056 0 960 0 864 0C768 0 672 0 576 0C480 0 384 0 288 0C192 0 96 0 48 0H0V120Z" fill="#9f7aea" />
        </svg>
      </div>
      
      {/* Main footer content */}
      <div className="bg-gradient-to-b from-purple-600 to-indigo-700 text-white pt-24 pb-16 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center mb-6 group">
                <div className="relative h-14 w-14 mr-3 bg-white rounded-full p-1 shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
                  <div className="w-full h-full bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-heading text-white font-bold">L</span>
                  </div>
                </div>
                <h3 className="text-2xl font-heading font-bold">
                  Leiturinha<span className="text-yellow-300">Bot</span>
                </h3>
              </div>
              <p className="text-indigo-100 mb-6 leading-relaxed">
                Histórias infantis personalizadas em português, criadas com inteligência artificial para despertar a imaginação das crianças.
              </p>
              <div className="flex space-x-3">
                <a href="#" className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors">
                  <FaFacebookF className="text-white" size={18} />
                </a>
                <a href="#" className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors">
                  <FaInstagram className="text-white" size={18} />
                </a>
                <a href="#" className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors">
                  <FaTwitter className="text-white" size={18} />
                </a>
                <a href="#" className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors">
                  <FaYoutube className="text-white" size={18} />
                </a>
              </div>
            </div>

            <div className="backdrop-blur-sm bg-white/5 p-6 rounded-2xl shadow-lg">
              <h4 className="font-heading font-bold text-xl flex items-center mb-5 text-yellow-300">
                <BookOpen className="mr-2" size={20} />
                Plataforma
              </h4>
              <ul className="space-y-3 text-indigo-100">
                <li>
                  <Link href="/">
                    <a className="hover:text-white transition-colors flex items-center">
                      <span className="mr-2">•</span>Como funciona
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/story/create">
                    <a className="hover:text-white transition-colors flex items-center">
                      <span className="mr-2">•</span>Personagens
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/story/create">
                    <a className="hover:text-white transition-colors flex items-center">
                      <span className="mr-2">•</span>Temas
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/">
                    <a className="hover:text-white transition-colors flex items-center">
                      <span className="mr-2">•</span>Faixas etárias
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/story/create">
                    <a className="hover:text-white transition-colors flex items-center">
                      <span className="mr-2">•</span>Recursos educativos
                    </a>
                  </Link>
                </li>
              </ul>
            </div>

            <div className="backdrop-blur-sm bg-white/5 p-6 rounded-2xl shadow-lg">
              <h4 className="font-heading font-bold text-xl flex items-center mb-5 text-yellow-300">
                <Heart className="mr-2" size={20} />
                Suporte
              </h4>
              <ul className="space-y-3 text-indigo-100">
                <li>
                  <Link href="/">
                    <a className="hover:text-white transition-colors flex items-center">
                      <span className="mr-2">•</span>FAQ
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/">
                    <a className="hover:text-white transition-colors flex items-center">
                      <span className="mr-2">•</span>Contato
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/">
                    <a className="hover:text-white transition-colors flex items-center">
                      <span className="mr-2">•</span>Termos de uso
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/">
                    <a className="hover:text-white transition-colors flex items-center">
                      <span className="mr-2">•</span>Política de privacidade
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/">
                    <a className="hover:text-white transition-colors flex items-center">
                      <span className="mr-2">•</span>Ajuda
                    </a>
                  </Link>
                </li>
              </ul>
            </div>

            <div className="backdrop-blur-sm bg-white/5 p-6 rounded-2xl shadow-lg">
              <h4 className="font-heading font-bold text-xl flex items-center mb-5 text-yellow-300">
                <Star className="mr-2" size={20} />
                Novidades
              </h4>
              <p className="text-indigo-100 mb-5">
                Receba dicas de leitura, novidades e conteúdo educativo para seus filhos!
              </p>
              <div className="flex">
                <Input
                  type="email"
                  placeholder="Seu e-mail"
                  className="rounded-l-xl px-4 py-3 w-full text-neutral-800 focus:outline-none border-2 border-r-0 border-white/30"
                />
                <Button className="bg-yellow-400 hover:bg-yellow-500 text-purple-900 px-4 py-3 rounded-r-xl transition-colors font-semibold">
                  <FaPaperPlane />
                </Button>
              </div>
            </div>
          </div>

          {/* Animated bubbles */}
          <div className="absolute -top-16 -left-10 w-20 h-20 bg-indigo-300/30 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute -bottom-8 right-10 w-28 h-28 bg-purple-300/30 rounded-full blur-xl animate-pulse"></div>
          
          <div className="border-t border-indigo-400/30 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-indigo-200 text-sm">
            <div>&copy; 2025 LeiturinhaBot. Todos os direitos reservados.</div>
            <div className="mt-6 md:mt-0 flex space-x-6">
              <Link href="/">
                <a className="hover:text-white transition-colors">Termos</a>
              </Link>
              <Link href="/">
                <a className="hover:text-white transition-colors">Privacidade</a>
              </Link>
              <Link href="/">
                <a className="hover:text-white transition-colors">Cookies</a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
