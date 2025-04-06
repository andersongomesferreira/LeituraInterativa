import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Users, BookOpen, CreditCard, Activity } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Type definitions
interface DashboardData {
  counts: {
    users: number;
    stories: number;
    subscriptions: number;
    activeSubscriptions: number;
  };
  aiProviders: Array<{
    id: string;
    name: string;
    isAvailable: boolean;
    capabilities: string[];
    metrics: {
      success: number;
      total: number;
      successRate: number;
    };
  }>;
}

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/admin/dashboard"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/dashboard");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh] text-center">
          <div>
            <h2 className="text-lg font-semibold mb-2">Erro ao carregar dados</h2>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : "Erro desconhecido"}
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Painel Administrativo
          </h2>
          <p className="text-muted-foreground">
            Bem-vindo ao painel de administração do LeiturinhaBot. Aqui você pode
            gerenciar usuários, histórias, assinaturas e configurações do sistema.
          </p>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Usuários
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.counts.users}</div>
              <p className="text-xs text-muted-foreground">
                Usuários registrados no sistema
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Histórias
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.counts.stories}</div>
              <p className="text-xs text-muted-foreground">
                Histórias geradas pelos usuários
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Assinaturas Ativas
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.counts.activeSubscriptions}
              </div>
              <p className="text-xs text-muted-foreground">
                Assinaturas premium ativas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa de Conversão
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.counts.users
                  ? Math.round(
                      (data.counts.activeSubscriptions / data.counts.users) * 100
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                Usuários com assinatura ativa
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="ai-services">Serviços de IA</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Usuários Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Usuários cadastrados recentemente serão exibidos aqui.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Histórias Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Histórias geradas recentemente serão exibidas aqui.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="ai-services" className="space-y-4">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Status dos Provedores de IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="py-3 px-4 text-left font-medium text-sm">
                          Provedor
                        </th>
                        <th className="py-3 px-4 text-left font-medium text-sm">
                          Status
                        </th>
                        <th className="py-3 px-4 text-left font-medium text-sm">
                          Capacidades
                        </th>
                        <th className="py-3 px-4 text-left font-medium text-sm">
                          Taxa de Sucesso
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.aiProviders.map((provider) => (
                        <tr
                          key={provider.id}
                          className="border-t hover:bg-muted/50"
                        >
                          <td className="py-3 px-4">{provider.name}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                provider.isAvailable
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {provider.isAvailable ? "Disponível" : "Indisponível"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {provider.capabilities.map((cap) => (
                                <span
                                  key={cap}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {cap}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="mr-2">
                                {provider.metrics.successRate.toFixed(1)}%
                              </div>
                              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary"
                                  style={{
                                    width: `${Math.max(
                                      Math.min(provider.metrics.successRate, 100),
                                      0
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}