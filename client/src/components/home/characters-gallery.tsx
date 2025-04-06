import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
    <section className="py-16 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
          Personagens incríveis
        </h2>
        <p className="text-neutral-600 text-center max-w-2xl mx-auto mb-12">
          Conheça alguns dos personagens que podem fazer parte das histórias do seu filho:
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="rounded-2xl bg-neutral-100 overflow-hidden shadow-md animate-pulse">
                <div className="aspect-w-3 aspect-h-4 bg-neutral-200"></div>
                <div className="p-4">
                  <div className="h-5 bg-neutral-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : (
            characters.slice(0, 5).map((character) => (
              <div
                key={character.id}
                className="relative group cursor-pointer rounded-2xl bg-neutral-100 overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:-translate-y-2"
                onClick={() => handleCharacterSelect(character)}
              >
                <div className="aspect-w-3 aspect-h-4 bg-secondary-light">
                  <img
                    src={character.imageUrl}
                    alt={character.name}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-heading font-bold text-lg">{character.name.split(',')[0]}</h3>
                  <div className="text-sm text-neutral-600">{character.name.split(',')[1]}</div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-primary to-transparent opacity-0 group-hover:opacity-60 transition-opacity flex items-end justify-center pb-20">
                  <button className="bg-white text-primary px-4 py-2 rounded-full font-semibold transform translate-y-10 group-hover:translate-y-0 transition-transform">
                    Ver mais
                  </button>
                </div>
                
                {character.isPremium && (
                  <div className="absolute top-2 right-2 bg-accent text-neutral-800 px-2 py-1 rounded-full text-xs font-bold">
                    Premium
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="text-center mt-12">
          <Button
            asChild
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-primary hover:text-white px-8 py-3 rounded-full font-heading font-bold text-lg transition-colors"
          >
            <Link href="/story/create">
              <a>Ver todos os personagens</a>
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Character Details Dialog */}
      <Dialog open={!!selectedCharacter} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedCharacter?.name}</DialogTitle>
            <DialogDescription>
              {selectedCharacter?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-40 h-40 rounded-full overflow-hidden">
              <img
                src={selectedCharacter?.imageUrl}
                alt={selectedCharacter?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold mb-2">Personalidade:</h4>
              <p>{selectedCharacter?.personality}</p>
              
              {selectedCharacter?.isPremium && (
                <div className="mt-4 p-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
                  Este é um personagem premium, disponível apenas nos planos pagos.
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleClose}>Fechar</Button>
            <Button asChild>
              <Link href="/story/create">
                <a>Criar História</a>
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CharactersGallery;
