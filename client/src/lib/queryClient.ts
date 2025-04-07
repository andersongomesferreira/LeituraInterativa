import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Endereço base do servidor da API
const API_BASE_URL = window.location.origin;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  data?: any,
  options?: RequestInit
) {
  // Adicionar logs para depuração
  console.log(`[API Request] ${method} ${endpoint}`);
  if (data) {
    console.log(`[API Request Data]`, data);
  }
  
  // Construir a URL completa
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint}`;

  // Configurar opções de requisição
  const fetchOptions: RequestInit = {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...((options?.headers || {}) as Record<string, string>),
    },
    credentials: "include", // Incluir cookies em requisições cross-origin
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  };

  try {
    const response = await fetch(url, fetchOptions);
    
    // Criando um clone da resposta para logging, preservando o original para processamento
    const responseForLogging = response.clone();

    // Log detalhado da resposta
    console.log(`[API Response] ${method} ${url} - Status: ${response.status} ${response.statusText}`);
    
    // Log para diagnóstico
    if (!response.ok) {
      console.error(`[API Error] ${response.status} ${response.statusText}`);
      try {
        const errorText = await responseForLogging.text();
        console.error(`[API Error Response] ${errorText}`);
        
        // Se conseguirmos analisar o erro como JSON, usamos a mensagem do servidor
        try {
          const errorObj = JSON.parse(errorText);
          console.error(`[API Error Decoded]`, errorObj);
          if (errorObj.message) {
            throw new Error(errorObj.message);
          }
        } catch (parseError) {
          // Se não for JSON, continuamos com o fluxo normal
          console.error(`[API Error Parse Failed]`, parseError);
        }
      } catch (e) {
        console.error('[API Error] Failed to read error response', e);
      }
      
      // Erro genérico se nenhum erro específico foi lançado acima
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    // Para requisições de imagem, log especial
    if (endpoint.includes('Image') || endpoint.includes('image')) {
      try {
        const jsonResponse = await responseForLogging.clone().json();
        console.log(`[API Image Response]`, jsonResponse);
        
        if (jsonResponse.imageUrl) {
          console.log(`[API Image URL Type]`, typeof jsonResponse.imageUrl);
          if (typeof jsonResponse.imageUrl === 'object') {
            console.log(`[API Image URL Object]`, jsonResponse.imageUrl);
          } else {
            console.log(`[API Image URL]`, jsonResponse.imageUrl.substring(0, 100) + '...');
          }
        }
        
        if (jsonResponse.error) {
          console.error(`[API Image Error]`, jsonResponse.error);
        }
      } catch (e) {
        console.error('[API Error] Failed to read image response for logging', e);
      }
    }

    // Processar a resposta como JSON e retornar os dados
    try {
      // Verificar se o content-type é JSON antes de tentar parsear
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        // Se não for JSON, mostrar o conteúdo para diagnóstico
        const textResponse = await response.text();
        console.error(`[API Error] Resposta não é JSON. Content-Type: ${contentType}`);
        console.error(`[API Error] Resposta não-JSON:`, textResponse.substring(0, 500) + '...');
        throw new Error(`Resposta do servidor não é um JSON válido. Verifique se você está autenticado e tem permissões adequadas.`);
      }
      
      const jsonData = await response.json();
      return jsonData;
    } catch (error) {
      console.error("Erro ao processar resposta JSON:", error);
      // Tentar ler a resposta como texto para diagnóstico
      try {
        const textResponse = await responseForLogging.text();
        const preview = textResponse.substring(0, 200) + (textResponse.length > 200 ? '...' : '');
        console.error(`[API Error] Conteúdo da resposta:`, preview);
        
        // Se parece ser HTML, é possível que seja uma página de erro ou de login
        if (textResponse.includes('<!DOCTYPE') || textResponse.includes('<html')) {
          throw new Error("Resposta recebida em HTML. Verifique se você está autenticado e tem permissões adequadas.");
        }
      } catch (textError) {
        console.error('[API Error] Falha ao ler texto da resposta:', textError);
      }
      
      throw new Error("Erro ao processar resposta do servidor");
    }
  } catch (networkError) {
    console.error(`[API Network Error] ${method} ${url}`, networkError);
    throw networkError;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    try {
      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error("Query error:", error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});