import { createContext, ReactNode, useContext, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const {
    data: authData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/auth/status"],
    queryFn: async () => {
      const response = await fetch("/api/auth/status");
      if (!response.ok) {
        throw new Error("Failed to fetch auth status");
      }
      return response.json();
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      if (!response.ok) {
        let errorMessage = "Login failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        throw new Error(errorMessage);
      }
      return await response.json();
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Login bem-sucedido",
        description: "Você foi autenticado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      if (!response.ok) {
        let errorMessage = "Logout failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        throw new Error(errorMessage);
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      refetch();
      toast({
        title: "Logout bem-sucedido",
        description: "Você foi desconectado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no logout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      if (!response.ok) {
        let errorMessage = "Registration failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        throw new Error(errorMessage);
      }
      return await response.json();
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Registro bem-sucedido",
        description: "Sua conta foi criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const login = async (credentials: { username: string; password: string }) => {
    await loginMutation.mutateAsync(credentials);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const register = async (userData: any) => {
    await registerMutation.mutateAsync(userData);
  };

  const user = authData?.isAuthenticated ? authData.user : null;
  const isAdmin = user?.role === "admin";
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        isAuthenticated,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}