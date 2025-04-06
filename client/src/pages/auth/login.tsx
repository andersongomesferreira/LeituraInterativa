import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import LoginForm from "@/components/auth/login-form";
import { Helmet } from "react-helmet";

const Login = () => {
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
        <title>Login - LeiturinhaBot</title>
        <meta name="description" content="Faça login na sua conta do LeiturinhaBot para criar histórias personalizadas." />
      </Helmet>
      
      <div className="bg-gradient-to-br from-primary-light via-primary to-secondary py-12 min-h-[calc(100vh-8rem)]">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <LoginForm />
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
