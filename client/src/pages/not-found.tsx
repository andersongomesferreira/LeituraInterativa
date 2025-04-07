import { Button } from "@/components/ui/button";
import { Sparkles, MapPin, ArrowLeft, BookOpen } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center justify-center stars-bg py-12">
      <div className="relative">
        {/* Spinning star background */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center -z-10">
          <div className="w-80 h-80 rounded-full stars-bg animate-spin-slow" style={{ animationDuration: '240s' }}></div>
        </div>
        
        {/* Lost castle silhouette */}
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-40 h-12 opacity-10 z-0">
          <svg viewBox="0 0 512 180" fill="currentColor" className="text-blue-600">
            <path d="M160,180H96v-40H32v40H0V100H32V60h32v40h32V60h32v40h32V180z M288,180h-64v-40h-32v40h-32V60h32V20h64v40h32V180z M416,180h-64v-40h-32v40h-32V100h32V60h32v40h32V60h32v40h32V180z M512,180h-32v-40h-32v40h-32V60h32V20h32v40h32V180z"/>
          </svg>
        </div>
        
        {/* 404 Disney-style card */}
        <div className="card-disney bg-white w-full max-w-md relative overflow-hidden py-10 px-8 text-center">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500"></div>
          
          {/* Floating sparkle 1 */}
          <div className="absolute top-10 right-10 animate-float" style={{ animationDelay: '0.5s' }}>
            <Sparkles className="h-6 w-6 text-yellow-400" />
          </div>
          
          {/* Floating sparkle 2 */}
          <div className="absolute bottom-10 left-10 animate-float" style={{ animationDelay: '1.2s' }}>
            <Sparkles className="h-4 w-4 text-blue-400" />
          </div>
          
          {/* 404 Number */}
          <div className="relative mb-8">
            <h1 className="text-8xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600">404</h1>
            <div className="absolute -top-6 -right-6 animate-bounce" style={{ animationDuration: '3s' }}>
              <MapPin className="h-10 w-10 text-red-500" />
            </div>
          </div>
          
          {/* Message */}
          <h2 className="text-2xl font-heading font-bold text-gray-800 mb-4">
            Oops! Parece que você se perdeu na história
          </h2>
          <p className="text-gray-600 mb-8">
            A página que você está procurando foi para um reino muito, muito distante ou talvez nem exista.
          </p>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/">
              <Button className="btn-disney-secondary w-full sm:w-auto flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o início
              </Button>
            </Link>
            <Link href="/story/create">
              <Button className="btn-disney w-full sm:w-auto flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                Criar uma história
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
