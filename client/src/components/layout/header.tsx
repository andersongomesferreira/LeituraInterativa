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
  ChevronDown, Menu, X, BookOpen, Home, Users, Crown, 
  Stars, Sparkles, Sun, Bookmark, LogOut, Wand2 as Magic
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
    <header className="bg-white relative">
      {/* Disney castle silhouette at the top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600"></div>
      
      {/* Sparkles background for the header */}
      <div className="absolute inset-0 stars-bg opacity-10 z-0"></div>
      
      <div className="container mx-auto px-4 py-3 flex items-center justify-between relative z-10">
        <div className="flex items-center">
          <Link href="/" className="flex items-center group">
            {/* Disney-inspired logo */}
            <div className="relative h-16 w-16 mr-3 float sparkle">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-full shadow-lg transform group-hover:scale-105 transition-transform duration-300"></div>
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-inner">
                <Sparkles size={24} className="text-blue-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-md bounce" style={{ animationDelay: "0.5s" }}>
                <span className="text-xs font-bold text-blue-900">✨</span>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold">
                <span className="text-primary">Leiturinha</span>
                <span className="text-yellow-500">Bot</span>
              </h1>
              <div className="text-xs font-medium text-blue-500 -mt-1">
                Histórias Mágicas para Crianças
              </div>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          <Link href="/">
            <div className="flex flex-col items-center px-4 py-2 group">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-1 group-hover:bg-blue-200 transition-colors">
                <Home size={20} className="text-blue-600" />
              </div>
              <span className="text-sm font-heading font-semibold text-gray-700 group-hover:text-blue-600">Início</span>
            </div>
          </Link>
          
          <Link href="/story/create">
            <div className="flex flex-col items-center px-4 py-2 group">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-1 group-hover:bg-blue-200 transition-colors">
                <BookOpen size={20} className="text-blue-600" />
              </div>
              <span className="text-sm font-heading font-semibold text-gray-700 group-hover:text-blue-600">Histórias</span>
            </div>
          </Link>
          
          <Link href="/subscription/plans">
            <div className="flex flex-col items-center px-4 py-2 group">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-1 group-hover:bg-blue-200 transition-colors">
                <Stars size={20} className="text-blue-600" />
              </div>
              <span className="text-sm font-heading font-semibold text-gray-700 group-hover:text-blue-600">Planos</span>
            </div>
          </Link>

          {authStatus?.isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex flex-col items-center px-4 py-2 hover:bg-transparent">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-1 hover:bg-blue-200 transition-colors">
                    <Users size={20} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-heading font-semibold text-gray-700 group-hover:text-blue-600">
                    Conta
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl border-2 border-blue-100 p-2 shadow-xl">
                <DropdownMenuLabel className="font-heading text-lg flex items-center text-blue-700 p-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold">
                      {authStatus.user?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div>Olá, {authStatus.user?.name}!</div>
                    <div className="text-xs text-blue-500">{authStatus.user?.email}</div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-blue-100" />
                <DropdownMenuItem className="font-heading text-base cursor-pointer hover:bg-blue-50 focus:bg-blue-50 rounded-xl my-1 p-3">
                  <Link href="/dashboard/parent">
                    <div className="w-full flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <Users size={16} className="text-blue-600" />
                      </div>
                      <span>Perfil dos Pais</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="font-heading text-base cursor-pointer hover:bg-blue-50 focus:bg-blue-50 rounded-xl my-1 p-3">
                  <Link href="/subscription/plans">
                    <div className="w-full flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <Crown size={16} className="text-blue-600" />
                      </div>
                      <span>Assinatura</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-blue-100" />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="font-heading text-base cursor-pointer hover:bg-red-50 focus:bg-red-50 rounded-xl my-1 p-3 text-red-500"
                >
                  <div className="w-full flex items-center">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                      <LogOut size={16} className="text-red-500" />
                    </div>
                    <span>Sair</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="btn-disney ml-4">
              <Link href="/login">
                <div className="flex items-center">
                  <Magic size={16} className="mr-2" />
                  <span>Entrar</span>
                </div>
              </Link>
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-3 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors text-blue-600"
          aria-label="Menu"
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white py-6 px-4 shadow-2xl border-t border-blue-100 rounded-b-3xl">
          <nav className="flex flex-col space-y-4">
            <Link href="/">
              <div className="flex items-center bg-blue-50 hover:bg-blue-100 transition-colors p-4 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center mr-4">
                  <Home size={24} className="text-blue-600" />
                </div>
                <span className="font-heading font-semibold text-blue-800">Início</span>
              </div>
            </Link>
            
            <Link href="/story/create">
              <div className="flex items-center bg-blue-50 hover:bg-blue-100 transition-colors p-4 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center mr-4">
                  <BookOpen size={24} className="text-blue-600" />
                </div>
                <span className="font-heading font-semibold text-blue-800">Histórias</span>
              </div>
            </Link>
            
            <Link href="/subscription/plans">
              <div className="flex items-center bg-blue-50 hover:bg-blue-100 transition-colors p-4 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center mr-4">
                  <Stars size={24} className="text-blue-600" />
                </div>
                <span className="font-heading font-semibold text-blue-800">Planos</span>
              </div>
            </Link>
            
            {authStatus?.isAuthenticated ? (
              <>
                <Link href="/dashboard/parent">
                  <div className="flex items-center bg-blue-50 hover:bg-blue-100 transition-colors p-4 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center mr-4">
                      <Users size={24} className="text-blue-600" />
                    </div>
                    <span className="font-heading font-semibold text-blue-800">Perfil dos Pais</span>
                  </div>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center bg-red-50 hover:bg-red-100 transition-colors p-4 rounded-2xl w-full"
                >
                  <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center mr-4">
                    <LogOut size={24} className="text-red-500" />
                  </div>
                  <span className="font-heading font-semibold text-red-600">Sair</span>
                </button>
              </>
            ) : (
              <Link href="/login">
                <div className="btn-disney w-full flex items-center justify-center py-4">
                  <Magic size={20} className="mr-2" />
                  <span className="font-heading font-bold">Entrar</span>
                </div>
              </Link>
            )}
          </nav>
        </div>
      )}
      
      {/* Bottom border with stars effect */}
      <div className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
    </header>
  );
};

export default Header;