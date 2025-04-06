import { db } from "../db";
import { 
  characters, themes, subscriptionPlans,
  type InsertCharacter, type InsertTheme, type InsertSubscriptionPlan
} from "@shared/schema";

async function seedDatabase() {
  console.log("Iniciando população do banco de dados...");

  try {
    // Verificar se já existem dados
    const existingCharacters = await db.select().from(characters);
    const existingThemes = await db.select().from(themes);
    const existingPlans = await db.select().from(subscriptionPlans);

    // Inserir apenas se as tabelas estiverem vazias
    if (existingCharacters.length === 0) {
      console.log("Inserindo personagens padrão...");
      // Criar personagens padrão
      const defaultCharacters: InsertCharacter[] = [
        {
          name: "Léo, o Leão",
          description: "Um leão explorador e corajoso",
          personality: "Corajoso, aventureiro e líder",
          imageUrl: "https://cdn3.iconfinder.com/data/icons/animal-flat-colors/64/lion-512.png",
          isPremium: false
        },
        {
          name: "Bia, a Borboleta",
          description: "Uma borboleta curiosa e gentil",
          personality: "Curiosa, gentil e artística",
          imageUrl: "https://cdn3.iconfinder.com/data/icons/spring-2-1/30/Butterfly-512.png",
          isPremium: false
        },
        {
          name: "Pedro, o Polvo",
          description: "Um polvo inteligente e criativo",
          personality: "Inteligente, criativo e prestativo",
          imageUrl: "https://cdn3.iconfinder.com/data/icons/ocean-life/500/Octopus-512.png",
          isPremium: false
        },
        {
          name: "Luna, a Loba",
          description: "Uma loba protetora e sábia",
          personality: "Protetora, sábia e leal",
          imageUrl: "https://cdn3.iconfinder.com/data/icons/animal-flat-colors/64/wolf-512.png",
          isPremium: false
        },
        {
          name: "Teo, o Tucano",
          description: "Um tucano músico e divertido",
          personality: "Músico, divertido e comunicativo",
          imageUrl: "https://cdn3.iconfinder.com/data/icons/bird-set-ii-1/512/toucan-512.png",
          isPremium: false
        },
        // Personagens premium
        {
          name: "Nina, a Naja",
          description: "Uma naja sábia e misteriosa",
          personality: "Sábia, misteriosa e calma",
          imageUrl: "https://cdn3.iconfinder.com/data/icons/animal-flat-colors/64/snake-512.png",
          isPremium: true
        },
        {
          name: "Max, o Macaco",
          description: "Um macaco ágil e brincalhão",
          personality: "Ágil, brincalhão e inteligente",
          imageUrl: "https://cdn3.iconfinder.com/data/icons/animal-flat-colors/64/monkey-512.png",
          isPremium: true
        }
      ];

      await db.insert(characters).values(defaultCharacters);
    }

    if (existingThemes.length === 0) {
      console.log("Inserindo temas padrão...");
      // Criar temas padrão
      const defaultThemes: InsertTheme[] = [
        {
          name: "Amizade",
          description: "Histórias sobre o valor da amizade e trabalho em equipe",
          ageGroups: ["3-5", "6-8", "9-12"],
          isPremium: false
        },
        {
          name: "Natureza e Meio Ambiente",
          description: "Histórias sobre a importância de cuidar da natureza",
          ageGroups: ["3-5", "6-8", "9-12"],
          isPremium: false
        },
        {
          name: "Aventuras Incríveis",
          description: "Histórias de aventuras emocionantes e descobertas",
          ageGroups: ["6-8", "9-12"],
          isPremium: false
        },
        // Temas premium
        {
          name: "Explorando o Espaço",
          description: "Histórias sobre viagens espaciais e descobertas cósmicas",
          ageGroups: ["6-8", "9-12"],
          isPremium: true
        },
        {
          name: "Superando Medos",
          description: "Histórias sobre como enfrentar e superar medos",
          ageGroups: ["3-5", "6-8", "9-12"],
          isPremium: true
        }
      ];

      await db.insert(themes).values(defaultThemes);
    }

    if (existingPlans.length === 0) {
      console.log("Inserindo planos de assinatura padrão...");
      // Criar planos de assinatura
      const defaultPlans: InsertSubscriptionPlan[] = [
        {
          name: "Plano Gratuito",
          price: 0,
          description: "Plano básico com funcionalidades limitadas",
          features: ["5 histórias por mês", "5 personagens básicos", "3 temas por faixa etária", "Interface básica de leitura"]
        },
        {
          name: "Plano Leiturinha Plus",
          price: 1490, // R$14,90
          description: "Plano intermediário com mais funcionalidades",
          features: ["Histórias ilimitadas", "Todos os personagens", "Todos os temas disponíveis", "Narração por voz de qualidade", "Sem anúncios", "Download em PDF"]
        },
        {
          name: "Plano Família",
          price: 2990, // R$29,90
          description: "Plano completo para toda a família",
          features: ["Todas as funcionalidades do Plus", "Até 4 perfis de crianças", "Histórias personalizadas com nome da criança", "Analytics avançados de leitura", "Suporte prioritário", "Recursos educacionais exclusivos"]
        }
      ];

      await db.insert(subscriptionPlans).values(defaultPlans);
    }

    console.log("Banco de dados populado com sucesso!");
  } catch (error) {
    console.error("Erro ao popular o banco de dados:", error);
  }
}

// Executar o script
seedDatabase();