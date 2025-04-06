import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import StoryWizard from "@/components/story/story-wizard";
import { Helmet } from "react-helmet";

interface AuthStatusType {
  isAuthenticated: boolean;
  user?: {
    id: number;
    name: string;
  };
}

const StoryWizardPage = () => {
  const [_, navigate] = useLocation();
  
  const { data, isLoading } = useQuery<AuthStatusType>({
    queryKey: ["/api/auth/status"],
  });

  // Definindo authStatus explicitamente
  const authStatus: AuthStatusType | undefined = data;
  const isAuthenticated = authStatus?.isAuthenticated || false;
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <>
      <Helmet>
        <title>Assistente de Histórias - LeiturinhaBot</title>
        <meta name="description" content="Crie histórias interativas para crianças de forma guiada, com personagens e temas educativos." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <StoryWizard />
      </div>
    </>
  );
};

export default StoryWizardPage;