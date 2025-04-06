import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube, FaPaperPlane } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-neutral-800 text-white py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <svg viewBox="0 0 100 100" className="h-10 w-auto mr-3 text-white">
                <circle cx="50" cy="50" r="40" fill="currentColor" />
                <text x="50" y="65" fontFamily="Arial" fontSize="50" fill="currentColor" textAnchor="middle" className="text-primary">L</text>
              </svg>
              <h3 className="text-xl font-heading font-bold">
                Leiturinha<span className="text-primary">Bot</span>
              </h3>
            </div>
            <p className="text-neutral-400 mb-4">
              Histórias infantis personalizadas em português, geradas por inteligência artificial.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                <FaFacebookF />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                <FaInstagram />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                <FaTwitter />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                <FaYoutube />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-bold mb-4">Plataforma</h4>
            <ul className="space-y-2 text-neutral-400">
              <li>
                <Link href="/">
                  <a className="hover:text-white transition-colors">Como funciona</a>
                </Link>
              </li>
              <li>
                <Link href="/story/create">
                  <a className="hover:text-white transition-colors">Personagens</a>
                </Link>
              </li>
              <li>
                <Link href="/story/create">
                  <a className="hover:text-white transition-colors">Temas</a>
                </Link>
              </li>
              <li>
                <Link href="/">
                  <a className="hover:text-white transition-colors">Faixas etárias</a>
                </Link>
              </li>
              <li>
                <Link href="/story/create">
                  <a className="hover:text-white transition-colors">Recursos educativos</a>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold mb-4">Suporte</h4>
            <ul className="space-y-2 text-neutral-400">
              <li>
                <Link href="/">
                  <a className="hover:text-white transition-colors">FAQ</a>
                </Link>
              </li>
              <li>
                <Link href="/">
                  <a className="hover:text-white transition-colors">Contato</a>
                </Link>
              </li>
              <li>
                <Link href="/">
                  <a className="hover:text-white transition-colors">Termos de uso</a>
                </Link>
              </li>
              <li>
                <Link href="/">
                  <a className="hover:text-white transition-colors">Política de privacidade</a>
                </Link>
              </li>
              <li>
                <Link href="/">
                  <a className="hover:text-white transition-colors">Ajuda</a>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold mb-4">Boletim Informativo</h4>
            <p className="text-neutral-400 mb-4">
              Receba dicas de leitura, novidades e conteúdo educativo.
            </p>
            <div className="flex">
              <Input
                type="email"
                placeholder="Seu e-mail"
                className="rounded-l-lg px-4 py-2 w-full text-neutral-800 focus:outline-none"
              />
              <Button className="bg-primary hover:bg-primary-dark text-white px-4 rounded-r-lg transition-colors">
                <FaPaperPlane />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-700 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center text-neutral-500 text-sm">
          <div>&copy; 2023 LeiturinhaBot. Todos os direitos reservados.</div>
          <div className="mt-4 md:mt-0">
            <Link href="/">
              <a className="hover:text-white transition-colors mr-4">Termos</a>
            </Link>
            <Link href="/">
              <a className="hover:text-white transition-colors mr-4">Privacidade</a>
            </Link>
            <Link href="/">
              <a className="hover:text-white transition-colors">Cookies</a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
