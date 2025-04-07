import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Star, Sparkles, Crown, BookOpen } from "lucide-react";

interface Character {
  id: number;
  name: string;
  description: string;
  personality: string;
  imageUrl: string;
  isPremium: boolean;
}

const CharactersGallery = () => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  
  const { data: characters = [], isLoading } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character);
  };

  const handleClose = () => {
    setSelectedCharacter(null);
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-blue-50 via-white to-purple-50">
      <div className="container mx-auto max-w-6xl">
        <div className="storybook-page-title mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center">
            <Star className="inline-block h-6 w-6 text-yellow-500 mr-2" />
            Personagens Mágicos
            <Star className="inline-block h-6 w-6 text-yellow-500 ml-2" />
          </h2>
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-neutral-600 mt-3">
              Conheça os amiguinhos que vão acompanhar seu filho em incríveis aventuras:
            </p>
          </div>
          <div className="decorative-line mt-3 mx-auto w-24 h-1 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="rounded-2xl bg-blue-50 overflow-hidden shadow-md animate-pulse">
                <div className="aspect-w-3 aspect-h-4 bg-blue-100"></div>
                <div className="p-4">
                  <div className="h-5 bg-blue-100 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-blue-100 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : (
            characters.slice(0, 5).map((character, idx) => (
              <div
                key={character.id}
                className={`storybook-character-card relative cursor-pointer rounded-2xl border-2 overflow-hidden transition-all transform hover:-translate-y-2 hover:shadow-xl ${idx % 3 === 0 ? 'border-blue-300 bg-gradient-to-b from-blue-100 to-blue-50' : idx % 3 === 1 ? 'border-purple-300 bg-gradient-to-b from-purple-100 to-purple-50' : 'border-pink-300 bg-gradient-to-b from-pink-100 to-pink-50'}`}
                onClick={() => handleCharacterSelect(character)}
              >
                {/* Decorative shapes */}
                <div className="absolute top-2 left-2 opacity-20">
                  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                
                {/* Character image */}
                <div className="p-3 pt-4 relative">
                  <div className="rounded-lg overflow-hidden border-2 border-white shadow-md mb-2 relative">
                    <div className="aspect-w-1 aspect-h-1">
                      <img
                        src={character.imageUrl}
                        alt={character.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    
                    {/* Animated sparkle overlay */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="animate-pulse absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full opacity-70"></div>
                      <div className="animate-pulse delay-300 absolute top-3/4 left-2/3 w-1 h-1 bg-white rounded-full opacity-50"></div>
                      <div className="animate-pulse delay-700 absolute top-1/2 left-1/3 w-1.5 h-1.5 bg-white rounded-full opacity-60"></div>
                    </div>
                  </div>
                  
                  <div className="text-center p-2">
                    <h3 className="font-heading font-bold text-lg relative inline-block">
                      {character.name.split(',')[0]}
                      {character.isPremium && (
                        <Crown className="absolute -top-4 -right-6 h-5 w-5 text-yellow-500" />
                      )}
                    </h3>
                    <div className="text-sm text-neutral-600 mt-1">{character.name.split(',')[1]}</div>
                  </div>
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center bg-gradient-to-t from-blue-500/70 to-transparent">
                    <div className="bg-white text-blue-600 font-medium px-4 py-2 rounded-full transform translate-y-4 hover:translate-y-0 transition-transform shadow-md flex items-center">
                      <Sparkles className="h-4 w-4 mr-1" />
                      Ver detalhes
                    </div>
                  </div>
                </div>
                
                {/* Premium badge */}
                {character.isPremium && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md transform rotate-3">
                    Premium
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="text-center mt-8">
          <Link href="/story/create" className="inline-block storybook-button">
            <div className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              <span>Ver todos os personagens</span>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Character Details Dialog with storybook style */}
      <Dialog open={!!selectedCharacter} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg border-4 border-blue-300 rounded-xl overflow-hidden bg-gradient-to-b from-blue-50 to-white shadow-xl p-0">
          <div className="bg-gradient-to-r from-blue-200 via-purple-100 to-pink-200 pt-4 pb-2 px-5 rounded-t-lg border-b-2 border-blue-300 relative">
            <DialogTitle className="text-2xl font-bold text-blue-600 font-heading">
              {selectedCharacter?.name.split(',')[0]}
              {selectedCharacter?.isPremium && (
                <Crown className="inline-block h-5 w-5 text-yellow-500 ml-2" />
              )}
            </DialogTitle>
            <DialogDescription className="text-blue-700">
              {selectedCharacter?.description}
            </DialogDescription>
            
            {/* Star decorations */}
            <div className="absolute top-2 right-2 text-yellow-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="relative">
                <div className="absolute inset-0 -m-2 border-4 border-yellow-200 rounded-full transform rotate-3 z-0"></div>
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-blue-300 shadow-md bg-white p-1 relative z-10">
                  <img
                    src={selectedCharacter?.imageUrl}
                    alt={selectedCharacter?.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                  
                  {/* Animated sparkle overlay */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
                    <div className="animate-pulse absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full opacity-70"></div>
                    <div className="animate-pulse delay-300 absolute top-3/4 left-2/3 w-1 h-1 bg-white rounded-full opacity-50"></div>
                    <div className="animate-pulse delay-700 absolute top-1/2 left-1/3 w-1.5 h-1.5 bg-white rounded-full opacity-60"></div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 bg-white/70 p-4 rounded-lg border border-blue-100 shadow-inner">
                <h4 className="text-lg font-semibold text-blue-600 mb-2 font-heading">Personalidade:</h4>
                <p className="text-slate-700">{selectedCharacter?.personality}</p>
                
                {selectedCharacter?.isPremium && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg shadow-sm">
                    <div className="flex items-center text-amber-700">
                      <Crown className="h-5 w-5 mr-2 text-yellow-500" />
                      <span className="font-medium">Personagem premium, disponível nos planos pagos.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                Fechar
              </Button>
              <Link href="/story/create" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-md font-medium px-4 py-2 rounded-full">
                Criar História ✨
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CharactersGallery;
