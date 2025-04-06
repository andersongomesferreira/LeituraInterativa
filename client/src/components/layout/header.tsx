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
import { ChevronDown, Menu, X } from "lucide-react";

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
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <svg viewBox="0 0 100 100" className="h-12 w-auto mr-3 text-primary">
              <circle cx="50" cy="50" r="40" fill="currentColor" />
              <text x="50" y="65" fontFamily="Arial" fontSize="50" fill="white" textAnchor="middle">L</text>
            </svg>
            <h1 className="text-2xl font-heading font-bold text-primary">
              Leiturinha<span className="text-secondary">Bot</span>
            </h1>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="font-heading font-semibold hover:text-primary transition-colors">
            Início
          </Link>
          <Link href="/story/create" className="font-heading font-semibold hover:text-primary transition-colors">
            Histórias
          </Link>
          <Link href="/subscription/plans" className="font-heading font-semibold hover:text-primary transition-colors">
            Planos
          </Link>

          {authStatus?.isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center font-heading font-semibold hover:text-primary transition-colors">
                  <span>Conta</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Olá, {authStatus.user?.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/parent" className="w-full">
                    Perfil dos Pais
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/subscription/plans" className="w-full">
                    Assinatura
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full font-heading font-semibold transition-colors">
              <Link href="/login">
                Entrar
              </Link>
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-2xl"
          aria-label="Menu"
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-md py-4 px-4">
          <nav className="flex flex-col space-y-4">
            <Link href="/" className="font-heading font-semibold hover:text-primary transition-colors py-2">
              Início
            </Link>
            <Link href="/story/create" className="font-heading font-semibold hover:text-primary transition-colors py-2">
              Histórias
            </Link>
            <Link href="/subscription/plans" className="font-heading font-semibold hover:text-primary transition-colors py-2">
              Planos
            </Link>
            {authStatus?.isAuthenticated ? (
              <>
                <Link href="/dashboard/parent" className="font-heading font-semibold hover:text-primary transition-colors py-2">
                  Perfil dos Pais
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-left font-heading font-semibold text-red-500 py-2"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link href="/login" className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full font-heading font-semibold transition-colors text-center">
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
