import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format price from cents to currency format (R$ 10,00)
export function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price / 100);
}

// Determine age group display text
export function formatAgeGroup(ageGroup: string) {
  switch (ageGroup) {
    case '3-5':
      return '3-5 anos';
    case '6-8':
      return '6-8 anos';
    case '9-12':
      return '9-12 anos';
    default:
      return ageGroup;
  }
}

// Format date to pt-BR locale
export function formatDate(date: Date | string) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(dateObj);
}

// Format time in minutes to "X minutos" or "X hora(s) e Y minuto(s)"
export function formatReadingTime(minutes: number) {
  if (minutes < 60) {
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hora${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours} hora${hours !== 1 ? 's' : ''} e ${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''}`;
}

// Get time ago string (e.g., "há 2 dias", "há 5 minutos", etc.)
export function getTimeAgo(date: Date | string) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  // Less than a minute
  if (seconds < 60) {
    return 'agora mesmo';
  }
  
  // Less than an hour
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `há ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }
  
  // Less than a day
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `há ${hours} hora${hours !== 1 ? 's' : ''}`;
  }
  
  // Less than a month
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `há ${days} dia${days !== 1 ? 's' : ''}`;
  }
  
  // Less than a year
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `há ${months} mês${months !== 1 ? 'es' : ''}`;
  }
  
  // More than a year
  const years = Math.floor(months / 12);
  return `há ${years} ano${years !== 1 ? 's' : ''}`;
}

// Text truncation with ellipsis
export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Base64 to Blob converter (for audio playback from OpenAI response)
export function base64ToBlob(base64: string, contentType = 'audio/mpeg') {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}
