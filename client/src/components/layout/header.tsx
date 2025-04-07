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
import { 
  Menu, X, BookOpen, Home, Users, Crown, 
  Stars, Sparkles, LogOut, Wand2 as Magic
} from "lucide-react";

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
    <header className="bg-white shadow-md relative">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between relative z-10">
        {/* Logo in center for Storymakery style */}
        <div className="flex-1 flex justify-center md:justify-start">
          <Link href="/">
            <div className="logo-container flex flex-col items-center">
              <h1 className="text-3xl font-heading font-bold text-center">
                <span className="text-blue-500">Leiturinha</span>
                <span className="text-yellow-500">Bot</span>
              </h1>
              <div className="text-xs font-medium text-gray-500 -mt-1">
                Histórias Mágicas para Crianças
              </div>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation - right aligned */}
        <nav className="hidden md:flex items-center">
          {authStatus?.isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="storymakery-button">
                  <div className="flex items-center">
                    <Users size={18} className="mr-2" />
                    <span className="font-heading">Minha Conta</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="storymakery-card p-2 min-w-[250px] mt-2">
                <DropdownMenuLabel className="font-heading text-lg flex items-center p-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold">
                      {authStatus.user?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">Olá, {authStatus.user?.name}!</div>
                    <div className="text-xs text-gray-500">{authStatus.user?.email}</div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-lg p-2 hover:bg-blue-50">
                  <Link href="/story/create" className="w-full">
                    <div className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-2 text-blue-500" />
                      <span>Criar História</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg p-2 hover:bg-blue-50">
                  <Link href="/dashboard/parent" className="w-full">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-blue-500" />
                      <span>Perfil dos Pais</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg p-2 hover:bg-blue-50">
                  <Link href="/subscription/plans" className="w-full">
                    <div className="flex items-center">
                      <Crown className="h-5 w-5 mr-2 text-blue-500" />
                      <span>Assinatura</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="rounded-lg p-2 hover:bg-red-50 text-red-500"
                >
                  <div className="flex items-center">
                    <LogOut className="h-5 w-5 mr-2" />
                    <span>Sair</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button className="storymakery-button">
                <div className="flex items-center">
                  <Magic size={18} className="mr-2" /> 
                  <span>ENTRAR</span>
                </div>
              </Button>
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex-1 flex justify-end md:hidden">
          <button
            className="p-2 rounded-full bg-gray-100 text-gray-700"
            aria-label="Menu"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg py-4 px-4">
          <nav className="flex flex-col space-y-3">
            <Link href="/">
              <div className="flex items-center p-3 rounded-lg hover:bg-blue-50">
                <Home size={20} className="text-blue-500 mr-3" />
                <span className="font-heading">Início</span>
              </div>
            </Link>
            
            <Link href="/story/create">
              <div className="flex items-center p-3 rounded-lg hover:bg-blue-50">
                <BookOpen size={20} className="text-blue-500 mr-3" />
                <span className="font-heading">Criar História</span>
              </div>
            </Link>
            
            <Link href="/subscription/plans">
              <div className="flex items-center p-3 rounded-lg hover:bg-blue-50">
                <Stars size={20} className="text-blue-500 mr-3" />
                <span className="font-heading">Planos</span>
              </div>
            </Link>
            
            {authStatus?.isAuthenticated ? (
              <>
                <Link href="/dashboard/parent">
                  <div className="flex items-center p-3 rounded-lg hover:bg-blue-50">
                    <Users size={20} className="text-blue-500 mr-3" />
                    <span className="font-heading">Perfil dos Pais</span>
                  </div>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center p-3 rounded-lg hover:bg-red-50 w-full text-left"
                >
                  <LogOut size={20} className="text-red-500 mr-3" />
                  <span className="font-heading text-red-500">Sair</span>
                </button>
              </>
            ) : (
              <Link href="/login">
                <div className="storymakery-button w-full flex items-center justify-center py-3">
                  <Magic size={20} className="mr-2" />
                  <span className="font-heading">ENTRAR</span>
                </div>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;