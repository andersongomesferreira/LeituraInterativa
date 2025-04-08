
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

const DiagnosticPage = () => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest("GET", "/api/stories/test-image-generation");
      setResults(response);
    } catch (err) {
      console.error("Erro ao executar diagnóstico:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Executar diagnóstico ao carregar a página
    runDiagnostic();
  }, []);

  return (
    <div className="container max-w-5xl py-8">
      <h1 className="text-3xl font-bold mb-6">Diagnóstico de Geração de Imagens</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Status do Sistema</CardTitle>
          <CardDescription>
            Verifique o status dos provedores de geração de imagem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runDiagnostic} 
            disabled={loading}
            className="mb-4"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Executando diagnóstico...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Executar Diagnóstico
              </>
            )}
          </Button>
          
          {error && (
            <div className="p-4 mb-4 bg-red-50 text-red-800 rounded-md border border-red-200">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p><strong>Erro:</strong> {error}</p>
              </div>
            </div>
          )}
          
          {results && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                <h3 className="font-semibold mb-2">Informações do Sistema</h3>
                <p><strong>Provedor Padrão:</strong> {results.systemStatus?.defaultProvider || "Não definido"}</p>
                <p><strong>Provedores Disponíveis:</strong> {results.systemStatus?.availableProviders?.join(", ") || "Nenhum"}</p>
              </div>
              
              <Tabs defaultValue="default">
                <TabsList className="mb-4">
                  <TabsTrigger value="default">Padrão</TabsTrigger>
                  {results.results && Object.keys(results.results)
                    .filter(key => key !== "default")
                    .map(provider => (
                      <TabsTrigger key={provider} value={provider}>
                        {provider}
                      </TabsTrigger>
                    ))}
                </TabsList>
                
                <TabsContent value="default">
                  <ProviderResult 
                    provider="Provedor Padrão" 
                    result={results.results?.default} 
                  />
                </TabsContent>
                
                {results.results && Object.keys(results.results)
                  .filter(key => key !== "default")
                  .map(provider => (
                    <TabsContent key={provider} value={provider}>
                      <ProviderResult 
                        provider={provider} 
                        result={results.results[provider]} 
                      />
                    </TabsContent>
                  ))}
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ProviderResult = ({ provider, result }: { provider: string, result: any }) => {
  if (!result) {
    return <p>Sem dados para este provedor</p>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className={`p-4 flex items-center justify-between ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className="flex items-center">
          {result.success ? (
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          )}
          <div>
            <h3 className="font-semibold">{provider}</h3>
            <p className={result.success ? 'text-green-700' : 'text-red-700'}>
              {result.success ? 'Funcionando' : 'Falha'}
              {result.isBackup ? ' (usando imagem de backup)' : ''}
            </p>
          </div>
        </div>
        
        {result.error && (
          <div className="bg-red-100 px-3 py-1 rounded text-sm text-red-800">
            {result.error}
          </div>
        )}
      </div>
      
      {result.imageUrl && (
        <div className="p-4 bg-white">
          <p className="mb-2 text-sm font-medium">Imagem gerada:</p>
          <div className="relative border rounded overflow-hidden" style={{ height: '200px' }}>
            <img 
              src={result.imageUrl} 
              alt={`Imagem gerada por ${provider}`}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/600x400/e6e6e6/999999?text=Erro+ao+carregar+imagem';
              }}
            />
            {result.isBackup && (
              <div className="absolute bottom-0 left-0 right-0 bg-yellow-500 text-white text-center text-xs py-1">
                Imagem de Backup
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticPage;
