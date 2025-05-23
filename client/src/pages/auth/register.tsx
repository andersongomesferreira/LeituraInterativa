import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import RegisterForm from "@/components/auth/register-form";
import { Helmet } from "react-helmet";

const Register = () => {
  const [_, navigate] = useLocation();
  
  const { data: authStatus, isLoading } = useQuery({
    queryKey: ["/api/auth/status"],
  });

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && authStatus?.isAuthenticated) {
      navigate("/dashboard/parent");
    }
  }, [authStatus, isLoading, navigate]);

  return (
    <>
      <Helmet>
        <title>Cadastro - LeiturinhaBot</title>
        <meta name="description" content="Crie uma conta no LeiturinhaBot para começar a criar histórias personalizadas para crianças." />
      </Helmet>
      
      <div className="bg-gradient-to-br from-primary-light via-primary to-secondary py-12 min-h-[calc(100vh-8rem)]">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <RegisterForm />
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
