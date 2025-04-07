import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { ChevronDown, Menu, X, BookOpen, Home, Users, Crown } from "lucide-react";

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
}

interface AuthStatus {
  isAuthenticated: boolean;
  user?: User;
}

const Header = () => {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: authStatus, isLoading } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
  });

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      navigate("/");
      window.location.reload(); // Force refresh to update auth state
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  useEffect(() => {
    // Close mobile menu when location changes
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <header className="bg-white shadow-xl border-b-4 border-primary/20">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center group">
            <div className="relative h-16 w-16 mr-3 floating">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transform rotate-3 group-hover:rotate-6 transition-transform duration-300"></div>
              <div className="absolute inset-0.5 bg-white rounded-full flex items-center justify-center">
                <span className="text-3xl font-heading rainbow-text">L</span>
              </div>
            </div>
            <h1 className="text-3xl font-heading font-bold">
              <span className="text-primary">Leiturinha</span>
              <span className="text-secondary">Bot</span>
            </h1>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="flex items-center px-3 py-2 rounded-full font-heading font-semibold hover:bg-primary/10 transition-colors">
            <Home size={20} className="mr-1 text-primary" />
            <span>Início</span>
          </Link>
          <Link href="/story/create" className="flex items-center px-3 py-2 rounded-full font-heading font-semibold hover:bg-primary/10 transition-colors">
            <BookOpen size={20} className="mr-1 text-primary" />
            <span>Histórias</span>
          </Link>
          <Link href="/subscription/plans" className="flex items-center px-3 py-2 rounded-full font-heading font-semibold hover:bg-primary/10 transition-colors">
            <Crown size={20} className="mr-1 text-primary" />
            <span>Planos</span>
          </Link>

          {authStatus?.isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center font-heading font-semibold hover:bg-primary/10 transition-colors rounded-full">
                  <Users size={20} className="mr-1 text-primary" />
                  <span>Conta</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl border-2 border-primary/20 shadow-lg">
                <DropdownMenuLabel className="font-heading text-lg">Olá, {authStatus.user?.name}!</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="font-heading text-base cursor-pointer hover:bg-primary/10 focus:bg-primary/10 rounded-lg my-1">
                  <a href="/dashboard/parent" className="w-full flex items-center">
                    <Users size={18} className="mr-2" />
                    Perfil dos Pais
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem className="font-heading text-base cursor-pointer hover:bg-primary/10 focus:bg-primary/10 rounded-lg my-1">
                  <a href="/subscription/plans" className="w-full flex items-center">
                    <Crown size={18} className="mr-2" />
                    Assinatura
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 font-heading text-base cursor-pointer hover:bg-red-50 focus:bg-red-50 rounded-lg my-1">
                  <X size={18} className="mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="btn-bouncy bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-2 rounded-full font-heading font-bold shadow-md transition-all">
              <Link href="/login">
                Entrar
              </Link>
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-2xl p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
          aria-label="Menu"
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg py-4 px-4 border-t-2 border-primary/10 rounded-b-xl">
          <nav className="flex flex-col space-y-3">
            <Link href="/" className="flex items-center font-heading font-semibold hover:bg-primary/10 transition-colors py-3 px-4 rounded-xl">
              <Home size={20} className="mr-3 text-primary" />
              Início
            </Link>
            <Link href="/story/create" className="flex items-center font-heading font-semibold hover:bg-primary/10 transition-colors py-3 px-4 rounded-xl">
              <BookOpen size={20} className="mr-3 text-primary" />
              Histórias
            </Link>
            <Link href="/subscription/plans" className="flex items-center font-heading font-semibold hover:bg-primary/10 transition-colors py-3 px-4 rounded-xl">
              <Crown size={20} className="mr-3 text-primary" />
              Planos
            </Link>
            {authStatus?.isAuthenticated ? (
              <>
                <Link href="/dashboard/parent" className="flex items-center font-heading font-semibold hover:bg-primary/10 transition-colors py-3 px-4 rounded-xl">
                  <Users size={20} className="mr-3 text-primary" />
                  Perfil dos Pais
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-left font-heading font-semibold text-red-500 py-3 px-4 rounded-xl hover:bg-red-50"
                >
                  <X size={20} className="mr-3" />
                  Sair
                </button>
              </>
            ) : (
              <Link href="/login" className="bg-gradient-to-r from-primary to-primary-dark text-white py-3 px-4 rounded-xl font-heading font-semibold transition-colors text-center flex items-center justify-center">
                Entrar
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;