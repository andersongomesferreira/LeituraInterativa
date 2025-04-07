import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export const apiRequest = async (
  method: string,
  endpoint: string,
  data?: any
): Promise<any> => {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  };

  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(endpoint, options);

  // If the response is not successful, try to parse the error message
  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erro na requisição");
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message !== "Erro na requisição") {
        throw parseError;
      }
      // If we couldn't parse the JSON, just throw a generic error
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }
  }

  // Processar a resposta como JSON e retornar os dados
  try {
    return await response.json();
  } catch (error) {
    console.error("Erro ao processar resposta JSON:", error);
    throw new Error("Erro ao processar resposta do servidor");
  }
};

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
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});