import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';

const AdminPage: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/auth/check-admin', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Falha ao verificar permissões de administrador');
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Erro ao verificar permissões');
        }
        
        setIsAdmin(data.isAdmin);
        
        // Se não for admin, redirecionar após 3 segundos
        if (!data.isAdmin) {
          setTimeout(() => {
            setLocation('/');
          }, 3000);
        }
      } catch (error) {
        setError(error.message || 'Ocorreu um erro ao verificar as permissões');
        console.error('Erro ao verificar status de admin:', error);
        
        // Redirecionar em caso de erro após 3 segundos
        setTimeout(() => {
          setLocation('/');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [setLocation]);

  // Função para fazer logout
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Limpar o cache de queries
        queryClient.clear();
        // Redirecionar para a home
        setLocation('/');
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-blue-600 mb-4">Área Administrativa</h1>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-center text-gray-600 mt-4">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (error || isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-red-600 mb-4">Acesso Restrito</h1>
          <p className="text-center text-gray-700 mb-6">
            Esta área é reservada apenas para administradores do sistema. 
            Você não tem permissão para acessar esta página.
          </p>
          <p className="text-center text-gray-500 mb-6">
            {error ? `Erro: ${error}` : 'Você será redirecionado para a página inicial em alguns segundos.'}
          </p>
          <div className="flex justify-center">
            <button 
              onClick={() => setLocation('/')}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Voltar para a página inicial
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
          <div className="flex space-x-4">
            <button 
              onClick={handleLogout}
              className="px-3 py-1 bg-blue-700 rounded hover:bg-blue-800 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card de Estatísticas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Estatísticas do Sistema</h2>
            <p className="text-gray-600">Visualize estatísticas da plataforma, usuários e geração de conteúdo.</p>
            <button 
              onClick={() => setLocation('/admin/stats')}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors w-full"
            >
              Ver Estatísticas
            </button>
          </div>
          
          {/* Card de Recursos do Sistema */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recursos do Sistema</h2>
            <p className="text-gray-600">Monitore CPU, memória e outros recursos do servidor.</p>
            <button 
              onClick={() => setLocation('/admin/system-resources')}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors w-full"
            >
              Ver Recursos
            </button>
          </div>
          
          {/* Card de Teste de IA */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Teste de IA</h2>
            <p className="text-gray-600">Teste a geração de histórias e imagens com diferentes modelos e parâmetros.</p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button 
                onClick={() => setLocation('/admin/test-story-generation')}
                className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Gerar Histórias
              </button>
              <button 
                onClick={() => setLocation('/admin/test-image-generation')}
                className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
              >
                Gerar Imagens
              </button>
            </div>
          </div>
          
          {/* Card de Chaves de API */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Chaves de API</h2>
            <p className="text-gray-600">Gerencie as chaves de API para integração com serviços externos.</p>
            <button 
              onClick={() => setLocation('/admin/api-keys')}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors w-full"
            >
              Gerenciar Chaves
            </button>
          </div>
          
          {/* Card de Modelos de IA */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Modelos de IA</h2>
            <p className="text-gray-600">Visualize e gerencie os modelos de IA disponíveis no sistema.</p>
            <button 
              onClick={() => setLocation('/admin/models')}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors w-full"
            >
              Ver Modelos
            </button>
          </div>
          
        </div>
      </main>
      
      <footer className="bg-gray-200 py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© {new Date().getFullYear()} LeiturinhaBot - Painel Administrativo</p>
        </div>
      </footer>
    </div>
  );
};

export default AdminPage; 