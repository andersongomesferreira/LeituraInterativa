import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, AlertTriangle, Clock, XCircle, HelpCircle } from 'lucide-react';

// Tipos para os provedores e seus estatutos
type ProviderStatus = 'online' | 'offline' | 'unconfigured' | 'error';
type ProviderInfo = {
  id: string;
  name: string;
  status: ProviderStatus;
  models: string[];
  supportsStyles?: boolean;
};

// Mapeamento de modelos por provedor
const providerModels: Record<string, { id: string, name: string }[]> = {
  openai: [
    { id: 'dall-e-3', name: 'DALL-E 3' },
    { id: 'dall-e-2', name: 'DALL-E 2' }
  ],
  huggingface: [
    { id: 'stable-diffusion-xl', name: 'Stable Diffusion XL' },
    { id: 'sdxl-turbo', name: 'SDXL Turbo' },
    { id: 'playground-v2', name: 'Playground v2' }
  ],
  stability: [
    { id: 'stable-diffusion-xl', name: 'Stable Diffusion XL' },
    { id: 'stable-diffusion-3', name: 'Stable Diffusion 3' }
  ],
  runware: [
    { id: 'stable-diffusion-xl', name: 'Stable Diffusion XL' },
    { id: 'anime-diffusion', name: 'Anime Diffusion' }
  ],
  replicate: [
    { id: 'midjourney-diffusion', name: 'Midjourney Diffusion' },
    { id: 'stable-diffusion-xl', name: 'Stable Diffusion XL' }
  ],
  getimg: [
    { id: 'getimg-model', name: 'GetImg Default' }
  ],
  lexica: [
    { id: 'lexica-aperture', name: 'Lexica Aperture' }
  ]
};

const AITestImagePage: React.FC = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [provider, setProvider] = useState('huggingface');
  const [model, setModel] = useState('stable-diffusion-xl');
  const [style, setStyle] = useState('cartoon');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<any>(null);
  const [responseDetails, setResponseDetails] = useState<any>(null);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  // Carregar status dos provedores quando a página iniciar
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoadingProviders(true);
        
        // Verifique a autenticação primeiro
        try {
          const authStatus = await apiRequest('GET', '/api/auth/status');
          if (!authStatus.isAuthenticated || !authStatus.user || authStatus.user.role !== 'admin') {
            console.error('Usuário não autenticado ou não é um administrador');
            toast({
              title: "Erro de autenticação",
              description: "Você precisa estar logado como administrador para acessar esta página.",
              variant: "destructive"
            });
            
            // Redirecionar para a página de login
            setTimeout(() => {
              window.location.href = '/login?redirect=/admin/ai-test/image';
            }, 2000);
            
            return;
          }
        } catch (authError) {
          console.error('Erro ao verificar autenticação:', authError);
        }
        
        const response = await apiRequest('GET', '/api/admin/ai-providers/status');
        
        if (response.success && response.providers) {
          setProviders(response.providers);
          
          // Se o provedor atual não estiver disponível, selecione o primeiro disponível
          const currentProviderInfo = response.providers.find((p: ProviderInfo) => p.id === provider);
          if (!currentProviderInfo || currentProviderInfo.status !== 'online') {
            const firstOnlineProvider = response.providers.find((p: ProviderInfo) => p.status === 'online');
            if (firstOnlineProvider) {
              setProvider(firstOnlineProvider.id);
              // Define o primeiro modelo disponível para o provedor
              if (firstOnlineProvider.models && firstOnlineProvider.models.length > 0) {
                setModel(firstOnlineProvider.models[0]);
              }
            }
          }
        } else {
          // Caso não possamos obter os provedores da API, use os padrões
          const defaultProviders: ProviderInfo[] = [
            { id: 'huggingface', name: 'HuggingFace', status: 'online', models: ['stable-diffusion-xl', 'sdxl-turbo'] },
            { id: 'openai', name: 'OpenAI', status: 'unconfigured', models: ['dall-e-3'] },
            { id: 'stability', name: 'Stability AI', status: 'offline', models: ['stable-diffusion-xl'] },
            { id: 'runware', name: 'Runware', status: 'online', models: ['stable-diffusion-xl'] },
            { id: 'replicate', name: 'Replicate', status: 'offline', models: ['midjourney-diffusion'] },
            { id: 'getimg', name: 'GetImg.ai', status: 'offline', models: ['getimg-model'] },
            { id: 'lexica', name: 'Lexica', status: 'offline', models: ['lexica-aperture'] }
          ];
          setProviders(defaultProviders);
        }
      } catch (error) {
        console.error('Erro ao carregar provedores:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os provedores de IA",
          variant: "destructive"
        });
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchProviders();
  }, []);

  // Atualizar o modelo quando o provedor mudar
  useEffect(() => {
    const availableModels = providerModels[provider] || [];
    if (availableModels.length > 0 && !availableModels.some(m => m.id === model)) {
      setModel(availableModels[0].id);
    }
  }, [provider, model]);

  // Encontrar o status do provedor selecionado
  const selectedProviderInfo = providers.find(p => p.id === provider);
  const isProviderOnline = selectedProviderInfo?.status === 'online';
  
  // Mensagem personalizada com base no status do provedor
  const getProviderStatusMessage = (status: ProviderStatus) => {
    switch (status) {
      case 'online':
        return null; // Nenhuma mensagem para provedores online
      case 'unconfigured':
        return "Este provedor não está configurado (sem API key)";
      case 'offline':
        return "Este provedor está temporariamente indisponível";
      case 'error':
        return "Erro ao conectar com este provedor";
      default:
        return "Status desconhecido";
    }
  };

  const getProviderStatusColor = (status: ProviderStatus) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'unconfigured':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'offline':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getProviderStatusIcon = (status: ProviderStatus) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-500" />;
      case 'unconfigured':
        return <AlertCircle className="h-3.5 w-3.5 mr-1 text-amber-500" />;
      case 'offline':
        return <Clock className="h-3.5 w-3.5 mr-1 text-gray-500" />;
      case 'error':
        return <XCircle className="h-3.5 w-3.5 mr-1 text-red-500" />;
      default:
        return <HelpCircle className="h-3.5 w-3.5 mr-1 text-gray-500" />;
    }
  };

  const getAvailableModels = () => {
    return providerModels[provider] || [];
  };

  const handleGenerateImage = async () => {
    if (!prompt) {
      toast({
        title: "Erro",
        description: "Por favor, informe um prompt para gerar a imagem.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setGeneratedImage(null);
    setImageError(null);
    
    // Preparar os dados da requisição
    const requestData = {
      prompt,
      negativePrompt,
      provider,
      model,
      style
    };
    
    // Armazenar os detalhes da requisição para debug
    setRequestDetails(requestData);

    try {
      // Fazer a requisição à API
      console.log('Enviando requisição:', requestData);
      
      // Adicionar um interceptor temporário para capturar a resposta bruta
      let rawResponse: Response;
      let responseText: string;
      
      try {
        // Usar fetch diretamente para ter acesso à resposta completa
        rawResponse = await fetch('/api/admin/test-image-generation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
          credentials: 'include'
        });
        
        // Capturar o texto da resposta
        responseText = await rawResponse.text();
        
        // Debug: mostra o status e response headers no console
        console.log('Response status:', rawResponse.status, rawResponse.statusText);
        console.log('Response headers:', Object.fromEntries(rawResponse.headers.entries()));
        console.log('Response raw content-type:', rawResponse.headers.get('content-type'));
        console.log('Resposta bruta (primeiros 500 caracteres):', responseText.substring(0, 500));
        
        // Tentar converter a resposta em JSON
        let jsonResponse;
        try {
          jsonResponse = JSON.parse(responseText);
          console.log('JSON parsed successfully:', jsonResponse);
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          jsonResponse = { 
            success: false, 
            message: 'Resposta não é um JSON válido', 
            rawResponse: responseText 
          };
        }
        
        // Armazenar os detalhes da resposta
        setResponseDetails({
          status: rawResponse.status,
          statusText: rawResponse.statusText,
          headers: Object.fromEntries(Array.from(rawResponse.headers)),
          body: jsonResponse,
          raw: responseText
        });
        
        // Check if the response has imageUrl directly at top level (new format)
        // or nested in a data property (old format)
        if (rawResponse.ok && jsonResponse.success) {
          // Direct imageUrl (new format) or nested in data (old format)
          const imageUrl = jsonResponse.imageUrl || (jsonResponse.data && jsonResponse.data.imageUrl);
          
          if (imageUrl) {
            console.log('Imagem URL recebida:', imageUrl);
            setGeneratedImage(imageUrl);
            toast({
              title: "Sucesso",
              description: "Imagem gerada com sucesso!"
            });
          } else {
            throw new Error('URL da imagem não encontrada na resposta');
          }
        } else {
          throw new Error(jsonResponse.message || 'Erro ao gerar imagem');
        }
      } catch (fetchError) {
        console.error('Erro na requisição fetch:', fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      const message = error instanceof Error ? error.message : 'Ocorreu um erro ao gerar a imagem';
      setImageError(message);
      toast({
        title: "Falha na geração",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teste de Geração de Imagens</h1>
          <p className="text-muted-foreground">
            Use esta ferramenta para testar diferentes modelos e provedores de geração de imagens.
          </p>
        </div>

        <Separator />

        {/* Resumo de status dos provedores */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-medium mb-3">Status dos Provedores</h2>
          <div className="flex flex-wrap gap-2">
            {loadingProviders ? (
              <div className="animate-pulse">Carregando status dos provedores...</div>
            ) : (
              providers.map((p) => (
                <Badge 
                  key={p.id} 
                  variant="outline"
                  className={`flex items-center px-3 py-1 rounded-full ${getProviderStatusColor(p.status)}`}
                >
                  {getProviderStatusIcon(p.status)}
                  {p.name}
                </Badge>
              ))
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>Configure os parâmetros para geração de imagem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Descreva a imagem que deseja gerar..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="negativePrompt">Prompt Negativo</Label>
                <Textarea
                  id="negativePrompt"
                  placeholder="Elementos que não devem aparecer na imagem..."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Provedor</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger id="provider">
                    <SelectValue placeholder="Selecione o provedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem 
                        key={p.id} 
                        value={p.id}
                        className="flex items-center"
                        disabled={p.status !== 'online'}
                      >
                        <div className="flex items-center">
                          {getProviderStatusIcon(p.status)}
                          <span className={p.status !== 'online' ? 'text-gray-400' : ''}>
                            {p.name}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProviderInfo && selectedProviderInfo.status !== 'online' && (
                  <p className="text-amber-600 text-xs mt-1">
                    {getProviderStatusMessage(selectedProviderInfo.status)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Select value={model} onValueChange={setModel} disabled={!isProviderOnline}>
                  <SelectTrigger id="model">
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableModels().map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Estilo</Label>
                <Select value={style} onValueChange={setStyle} disabled={!isProviderOnline}>
                  <SelectTrigger id="style">
                    <SelectValue placeholder="Selecione o estilo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cartoon">Desenho Animado</SelectItem>
                    <SelectItem value="watercolor">Aquarela</SelectItem>
                    <SelectItem value="digital-art">Arte Digital</SelectItem>
                    <SelectItem value="pencil-drawing">Desenho a Lápis</SelectItem>
                    <SelectItem value="3d-render">Renderização 3D</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleGenerateImage} 
                className="w-full" 
                disabled={loading || !isProviderOnline}
              >
                {loading ? 'Gerando...' : 'Gerar Imagem'}
              </Button>
              
              {!isProviderOnline && (
                <div className="text-amber-600 text-sm p-2 bg-amber-50 rounded">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span>Não é possível gerar imagem: o provedor selecionado não está disponível</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resultado</CardTitle>
              <CardDescription>Visualize a imagem gerada</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[400px]">
              {loading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Gerando imagem...</p>
                </div>
              ) : imageError ? (
                <div className="text-center p-4 rounded-lg bg-destructive/10 text-destructive max-w-md mx-auto">
                  <p className="font-semibold mb-2">Erro ao gerar imagem</p>
                  <p>{imageError}</p>
                </div>
              ) : generatedImage ? (
                <div className="flex flex-col items-center">
                  <div className="relative w-full max-w-md">
                    <img 
                      src={generatedImage} 
                      alt="Imagem gerada" 
                      className="max-w-full max-h-[400px] rounded-lg shadow-md object-contain mx-auto"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error('Erro ao carregar a imagem:', e);
                        // Adiciona um timestamp para evitar cache
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('?')) {
                          target.src = `${generatedImage}?t=${Date.now()}`;
                        } else if (!target.src.includes('fallback')) {
                          // Se já tentou recarregar e falhou, mostra imagem de fallback
                          target.src = 'https://placehold.co/600x400/FFDE59/333333?text=Erro+ao+carregar+imagem&fallback=true';
                        }
                      }}
                    />
                  </div>
                  <div className="mt-4 flex flex-col gap-2 items-center">
                    <p className="text-sm text-gray-500 mb-2">URL da imagem: {generatedImage.substring(0, 50)}...</p>
                    <a 
                      href={generatedImage} 
                      download="imagem-gerada.png"
                      className="flex items-center gap-2 text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      Download da Imagem
                    </a>
                    <a 
                      href={generatedImage}
                      className="flex items-center gap-2 text-blue-500 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      Abrir Imagem em Nova Aba
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>Sua imagem gerada aparecerá aqui.</p>
                  <p>Configure os parâmetros e clique em "Gerar Imagem".</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Seção de debug com os detalhes da requisição e resposta */}
        {(requestDetails || responseDetails) && (
          <>
            <Separator className="my-8" />
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Informações de Depuração</h2>
              
              {requestDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes da Requisição</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-xs">
                      {JSON.stringify(requestDetails, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
              
              {responseDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes da Resposta</CardTitle>
                    <CardDescription>
                      Status: {responseDetails.status} {responseDetails.statusText}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Cabeçalhos:</h3>
                        <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-40 text-xs">
                          {JSON.stringify(responseDetails.headers, null, 2)}
                        </pre>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2">Corpo da Resposta:</h3>
                        <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-xs">
                          {JSON.stringify(responseDetails.body, null, 2)}
                        </pre>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2">Resposta Raw:</h3>
                        <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-xs">
                          {responseDetails.raw}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AITestImagePage; 