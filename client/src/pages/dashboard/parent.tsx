import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ParentDashboard from "@/components/dashboard/parent-dashboard";
import { Helmet } from "react-helmet";

const ParentDashboardPage = () => {
  const [_, navigate] = useLocation();
  
  const { data: authStatus, isLoading } = useQuery({
    queryKey: ["/api/auth/status"],
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !authStatus?.isAuthenticated) {
      navigate("/login");
    }
  }, [authStatus, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authStatus?.isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <>
      <Helmet>
        <title>Dashboard dos Pais - LeiturinhaBot</title>
        <meta name="description" content="Gerencie perfis de crianças e acompanhe o progresso de leitura." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <ParentDashboard />
      </div>
    </>
  );
};

export default ParentDashboardPage;
