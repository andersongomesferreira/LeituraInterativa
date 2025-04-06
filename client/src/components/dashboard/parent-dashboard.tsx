import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate, getTimeAgo } from "@/lib/utils";
import ChildProfileDialog, { ChildProfileCard } from "@/components/dashboard/child-profile";
import { UserPlus, Users, BookOpen, Clock, BarChart, AlertTriangle } from "lucide-react";

interface ChildProfile {
  id: number;
  name: string;
  ageGroup: string;
  avatar?: string;
}

interface ReadingSession {
  id: number;
  childId: number;
  storyId: number;
  progress: number;
  completed: boolean;
  duration: number;
  lastReadAt: string;
}

interface Story {
  id: number;
  title: string;
  ageGroup: string;
  imageUrl?: string;
}

interface UserSubscription {
  plan: {
    id: number;
    name: string;
    price: number;
  };
}

const ParentDashboard = () => {
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ChildProfile | null>(null);
  const [timeframe, setTimeframe] = useState("30");

  // Fetch child profiles
  const { data: childProfiles = [] } = useQuery<ChildProfile[]>({
    queryKey: ["/api/child-profiles"],
  });

  // Fetch subscription
  const { data: subscription } = useQuery<UserSubscription>({
    queryKey: ["/api/user-subscription"],
  });

  // Check if user can add more profiles
  const canAddMoreProfiles =
    subscription?.plan?.name === "Plano Família"
      ? childProfiles.length < 4
      : childProfiles.length < 1;

  const handleAddProfile = () => {
    setSelectedProfile(null);
    setIsProfileDialogOpen(true);
  };

  const handleEditProfile = (profile: ChildProfile) => {
    setSelectedProfile(profile);
    setIsProfileDialogOpen(true);
  };

  const handleCloseProfileDialog = () => {
    setIsProfileDialogOpen(false);
  };

  // Placeholder reading data (in a real app, this would come from API)
  const readingStats = [
    { name: "Seg", stories: 2, minutes: 15 },
    { name: "Ter", stories: 1, minutes: 8 },
    { name: "Qua", stories: 3, minutes: 22 },
    { name: "Qui", stories: 0, minutes: 0 },
    { name: "Sex", stories: 2, minutes: 17 },
    { name: "Sáb", stories: 4, minutes: 30 },
    { name: "Dom", stories: 2, minutes: 12 },
  ];

  const childReadingData = childProfiles.map((profile) => ({
    profile,
    stats: {
      totalStories: Math.floor(Math.random() * 20) + 5,
      readingTime: Math.floor(Math.random() * 120) + 30,
      lastRead: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    },
  }));

  // Recent stories (placeholder)
  const recentStories = [
    {
      id: 1,
      title: "A Floresta Mágica",
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      duration: 12,
      status: "completed",
      imageUrl: "https://images.unsplash.com/photo-1633613286848-e6f43bbafb8d",
    },
    {
      id: 2,
      title: "A Aventura no Oceano",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      duration: 15,
      status: "completed",
      imageUrl: "https://images.unsplash.com/photo-1535378917042-10a22c95931a",
    },
    {
      id: 3,
      title: "O Mistério da Lua",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      duration: 10,
      status: "partial",
      imageUrl: "https://images.unsplash.com/photo-1594750823491-8a22c34183bb",
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-heading">Dashboard dos Pais</CardTitle>
            <CardDescription>
              Acompanhe o progresso de leitura e gerencie os perfis das crianças
            </CardDescription>
          </div>
          <Button
            onClick={handleAddProfile}
            disabled={!canAddMoreProfiles}
            className="bg-primary hover:bg-primary-dark text-white"
          >
            <UserPlus className="mr-2 h-4 w-4" /> Adicionar Perfil
          </Button>
        </CardHeader>
      </Card>

      <Tabs defaultValue="profiles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profiles" className="flex items-center">
            <Users className="mr-2 h-4 w-4" /> Perfis
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center">
            <BarChart className="mr-2 h-4 w-4" /> Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-6">
          {childProfiles.length === 0 ? (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center h-60">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground mb-4">
                  Nenhum perfil de criança encontrado.
                </p>
                <Button
                  onClick={handleAddProfile}
                  className="bg-primary hover:bg-primary-dark text-white"
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Criar Primeiro Perfil
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {childReadingData.map(({ profile, stats }) => (
                <ChildProfileCard
                  key={profile.id}
                  profile={profile}
                  onEdit={handleEditProfile}
                  readingStats={stats}
                />
              ))}
              
              {canAddMoreProfiles && (
                <Card
                  className="border-dashed hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors flex items-center justify-center h-[180px]"
                  onClick={handleAddProfile}
                >
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <UserPlus className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground font-medium">Adicionar Perfil</p>
                    {subscription?.plan?.name === "Plano Família" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {4 - childProfiles.length} perfis restantes
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="flex justify-end">
            <Select
              value={timeframe}
              onValueChange={setTimeframe}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Último trimestre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6 flex flex-col items-center">
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <div className="text-3xl font-bold text-primary mb-1">
                  {childReadingData.reduce((acc, curr) => acc + curr.stats.totalStories, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Histórias lidas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center">
                <Clock className="h-8 w-8 text-secondary mb-2" />
                <div className="text-3xl font-bold text-secondary mb-1">
                  {childReadingData.reduce((acc, curr) => acc + curr.stats.readingTime, 0)}m
                </div>
                <div className="text-sm text-muted-foreground">Tempo de leitura</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center">
                <Users className="h-8 w-8 text-accent mb-2" />
                <div className="text-3xl font-bold text-accent-dark mb-1">
                  {childProfiles.length}
                </div>
                <div className="text-sm text-muted-foreground">Perfis ativos</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Atividade de Leitura</CardTitle>
              <CardDescription>Histórias lidas e tempo de leitura semanal</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={readingStats}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorStories" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="stories"
                    name="Histórias"
                    stroke="var(--chart-1)"
                    fillOpacity={1}
                    fill="url(#colorStories)"
                  />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    name="Minutos"
                    stroke="var(--chart-2)"
                    fillOpacity={1}
                    fill="url(#colorMinutes)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórias Recentes</CardTitle>
              <CardDescription>Últimas histórias lidas por todas as crianças</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentStories.map((story) => (
                  <div key={story.id} className="bg-neutral-100 rounded-xl p-3 flex items-center">
                    <div className="w-12 h-12 rounded-lg overflow-hidden mr-4">
                      <img
                        src={story.imageUrl}
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-heading font-semibold">{story.title}</h5>
                      <p className="text-xs text-neutral-600">
                        {getTimeAgo(story.date)} • {story.duration} minutos
                      </p>
                    </div>
                    <div className="text-sm">
                      {story.status === "completed" ? (
                        <span className="bg-success text-white py-1 px-2 rounded-full text-xs">
                          Concluído
                        </span>
                      ) : (
                        <span className="bg-warning text-neutral-800 py-1 px-2 rounded-full text-xs">
                          Parcial
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Profile Dialog */}
      <ChildProfileDialog
        profile={selectedProfile || undefined}
        isNew={!selectedProfile}
        open={isProfileDialogOpen}
        onClose={handleCloseProfileDialog}
      />
    </div>
  );
};

export default ParentDashboard;
