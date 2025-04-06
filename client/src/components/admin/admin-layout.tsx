import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Users,
  BookOpen,
  Settings,
  CreditCard,
  Home,
  ServerCog,
  Database,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  active: boolean;
  onClick?: () => void;
}

function NavItem({ href, icon, title, active, onClick }: NavItemProps) {
  return (
    <Link href={href}>
      <a
        className={`flex items-center space-x-3 px-3 py-2 rounded-md transition ${
          active
            ? "bg-primary/10 text-primary"
            : "hover:bg-muted text-muted-foreground hover:text-foreground"
        }`}
        onClick={onClick}
      >
        {icon}
        <span>{title}</span>
      </a>
    </Link>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      href: "/admin",
      icon: <Home size={20} />,
      title: "Painel",
    },
    {
      href: "/admin/users",
      icon: <Users size={20} />,
      title: "Usuários",
    },
    {
      href: "/admin/stories",
      icon: <BookOpen size={20} />,
      title: "Histórias",
    },
    {
      href: "/admin/subscriptions",
      icon: <CreditCard size={20} />,
      title: "Assinaturas",
    },
    {
      href: "/admin/characters-themes",
      icon: <Settings size={20} />,
      title: "Personagens e Temas",
    },
    {
      href: "/admin/ai-providers",
      icon: <ServerCog size={20} />,
      title: "Provedores IA",
    },
    {
      href: "/admin/api-keys",
      icon: <Database size={20} />,
      title: "Chaves API",
    },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile header */}
      <div className="md:hidden bg-background border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">LeiturinhaBot Admin</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background h-screen w-full fixed z-50 overflow-auto">
          <div className="py-6 px-4 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold">LeiturinhaBot Admin</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                aria-label="Close menu"
              >
                <X size={24} />
              </Button>
            </div>
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  title={item.title}
                  active={location === item.href}
                  onClick={closeMobileMenu}
                />
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground px-3 py-1">
                {user?.name} ({user?.email})
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500"
                onClick={() => {
                  logout();
                  closeMobileMenu();
                }}
              >
                <LogOut size={20} className="mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-background border-r h-screen sticky top-0">
        <div className="p-4">
          <h1 className="text-xl font-bold">LeiturinhaBot Admin</h1>
        </div>
        <div className="flex-1 py-6 px-4 space-y-6 overflow-auto">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                title={item.title}
                active={location === item.href}
              />
            ))}
          </nav>
          <Separator className="my-4" />
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground px-3 py-1">
              {user?.name} ({user?.email})
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500"
              onClick={() => logout()}
            >
              <LogOut size={20} className="mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 md:p-8 overflow-auto">{children}</div>
    </div>
  );
}