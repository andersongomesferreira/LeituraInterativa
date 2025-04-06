import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

const loginSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // Usar apiRequest para padronizar o tratamento de erros
      const response = await apiRequest("POST", "/api/auth/login", data);
      
      const responseData = await response.json();
      
      if (response.ok && responseData?.success) {
        // Invalidar cache de autenticação para forçar nova consulta
        queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
        
        toast({
          title: "Login realizado com sucesso!",
          description: "Você será redirecionado para a página inicial.",
        });
        
        // Aguardar antes de navegar para garantir que o estado da sessão está atualizado
        setTimeout(() => {
          navigate("/dashboard/parent");
        }, 1000);
      } else {
        throw new Error(responseData?.message || "Falha no login");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = "Nome de usuário ou senha incorretos.";
      if (error.message === "Usuário não encontrado") {
        errorMessage = "Usuário não encontrado. Verifique seu nome de usuário.";
      } else if (error.message === "Senha incorreta") {
        errorMessage = "Senha incorreta. Tente novamente.";
      }
      
      toast({
        title: "Erro ao fazer login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center font-heading">Entrar no LeiturinhaBot</CardTitle>
        <CardDescription className="text-center">
          Acesse sua conta para criar histórias mágicas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de Usuário</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite seu nome de usuário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Digite sua senha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary-dark text-white"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-center">
          Não tem uma conta?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Registre-se
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
