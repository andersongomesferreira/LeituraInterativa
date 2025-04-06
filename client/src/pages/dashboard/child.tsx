import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { getTimeAgo } from "@/lib/utils";
import { Helmet } from "react-helmet";
import { ArrowLeft, BookOpen, Clock, Award, Play, ChevronRight } from "lucide-react";
import { Link } from "wouter";

interface ChildProfile {
  id: number;
  name: string;
  ageGroup: string;
  avatar?: string;
}

interface Story {
  id: number;
  title: string;
  content: string;
  ageGroup: string;
  imageUrl?: string;
  createdAt: string;
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

const ChildDashboardPage = () => {
  const [_, navigate] = useLocation();
  const [match, params] = useRoute("/dashboard/child/:id");
  const childId = match ? parseInt(params.id) : null;
  const [activeTab, setActiveTab] = useState("stories");

  const { data: authStatus, isLoading: authLoading } = useQuery({
    queryKey: ["/api/auth/status"],
  });

  // Fetch child profile
  const { data: childProfiles, isLoading: profilesLoading } = useQuery<ChildProfile[]>({
    queryKey: ["/api/child-profiles"],
    enabled: !!authStatus?.isAuthenticated,
  });

  const childProfile = childProfiles?.find((profile) => profile.id === childId);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !authStatus?.isAuthenticated) {
      navigate("/login");
    }
  }, [authStatus, authLoading, navigate]);

  // Redirect if child not found
  useEffect(() => {
    if (!profilesLoading && childProfiles && !childProfile) {
      navigate("/dashboard/parent");
    }
  }, [childProfile, childProfiles, profilesLoading, navigate]);

  if (authLoading || profilesLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authStatus?.isAuthenticated || !childProfile) {
    return null; // Will redirect
  }

  // Mock data for stories and reading sessions (in a real app, this would come from API)
  const mockStories: Story[] = [
    {
      id: 1,
      title: "A Floresta Mágica",
      content: "Era uma vez uma floresta mágica...",
      ageGroup: childProfile.ageGroup,
      imageUrl: "https://images.unsplash.com/photo-1633613286848-e6f43bbafb8d",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      title: "A Aventura no Oceano",
      content: "No fundo do mar, havia um polvo muito curioso...",
      ageGroup: childProfile.ageGroup,
      imageUrl: "https://images.unsplash.com/photo-1535378917042-10a22c95931a",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      title: "O Mistério da Lua",
      content: "Todas as noites, a lua brilhava no céu...",
      ageGroup: childProfile.ageGroup,
      imageUrl: "https://images.unsplash.com/photo-1594750823491-8a22c34183bb",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const mockReadingSessions: ReadingSession[] = [
    {
      id: 1,
      childId: childProfile.id,
      storyId: 1,
      progress: 100,
      completed: true,
      duration: 15,
      lastReadAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      childId: childProfile.id,
      storyId: 2,
      progress: 100,
      completed: true,
      duration: 12,
      lastReadAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      childId: childProfile.id,
      storyId: 3,
      progress: 40,
      completed: false,
      duration: 5,
      lastReadAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Get stories with reading sessions
  const storiesWithSessions = mockStories.map((story) => {
    const session = mockReadingSessions.find((s) => s.storyId === story.id);
    return {
      ...story,
      session,
    };
  });

  // Total reading time
  const totalReadingTime = mockReadingSessions.reduce(
    (acc, session) => acc + session.duration,
    0
  );

  // Completed stories
  const completedStories = mockReadingSessions.filter(
    (session) => session.completed
  ).length;

  return (
    <>
      <Helmet>
        <title>{`${childProfile.name} - LeiturinhaBot`}</title>
        <meta
          name="description"
          content={`Perfil de leitura e histórias de ${childProfile.name}.`}
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="mb-2 sm:mb-0 -ml-2"
            >
              <Link href="/dashboard/parent">
                <a className="flex items-center">
                  <ArrowLeft className="mr-1 h-4 w-4" /> Voltar ao Dashboard
                </a>
              </Link>
            </Button>

            <Button
              asChild
              className="bg-primary hover:bg-primary-dark font-heading font-semibold"
            >
              <Link href="/story/create">
                <a>Criar Nova História</a>
              </Link>
            </Button>
          </div>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center text-white">
                  {childProfile.ageGroup === "3-5" ? (
                    <span className="text-3xl">👶</span>
                  ) : childProfile.ageGroup === "6-8" ? (
                    <span className="text-3xl">👧</span>
                  ) : (
                    <span className="text-3xl">👦</span>
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-heading font-bold">{childProfile.name}</h1>
                  <p className="text-muted-foreground">
                    {childProfile.ageGroup === "3-5"
                      ? "3-5 anos"
                      : childProfile.ageGroup === "6-8"
                      ? "6-8 anos"
                      : "9-12 anos"}
                  </p>
                </div>

                <div className="sm:ml-auto grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center">
                    <div className="font-bold text-xl">{mockStories.length}</div>
                    <div className="text-xs text-muted-foreground">Histórias</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="font-bold text-xl">{totalReadingTime}m</div>
                    <div className="text-xs text-muted-foreground">Leitura</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="font-bold text-xl">{completedStories}</div>
                    <div className="text-xs text-muted-foreground">Completas</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="stories">
                <BookOpen className="mr-2 h-4 w-4" /> Histórias
              </TabsTrigger>
              <TabsTrigger value="progress">
                <Award className="mr-2 h-4 w-4" /> Progresso
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stories" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Histórias de {childProfile.name}</CardTitle>
                  <CardDescription>
                    Histórias geradas para {childProfile.name} e progresso de leitura
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {storiesWithSessions.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhuma história ainda</h3>
                      <p className="text-muted-foreground mb-6">
                        Crie sua primeira história personalizada para {childProfile.name}
                      </p>
                      <Button
                        asChild
                        className="bg-primary hover:bg-primary-dark font-heading font-semibold"
                      >
                        <Link href="/story/create">
                          <a>Criar História</a>
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {storiesWithSessions.map((story) => (
                        <div
                          key={story.id}
                          className="border rounded-lg overflow-hidden flex flex-col sm:flex-row"
                        >
                          <div
                            className="w-full sm:w-32 h-32 bg-cover bg-center"
                            style={{ backgroundImage: `url(${story.imageUrl})` }}
                          ></div>
                          <div className="p-4 flex-1">
                            <div className="flex flex-col sm:flex-row justify-between">
                              <div>
                                <h3 className="font-heading font-bold text-lg">{story.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Criada {getTimeAgo(new Date(story.createdAt))}
                                </p>
                              </div>
                              {story.session && (
                                <div className="mt-2 sm:mt-0">
                                  {story.session.completed ? (
                                    <Badge className="bg-success text-white">Concluída</Badge>
                                  ) : (
                                    <Badge className="bg-warning text-black">Em progresso</Badge>
                                  )}
                                </div>
                              )}
                            </div>

                            {story.session && (
                              <div className="mt-4">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Progresso</span>
                                  <span>{story.session.progress}%</span>
                                </div>
                                <Progress value={story.session.progress} className="h-2" />
                                <div className="flex justify-between items-center mt-4">
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <Clock className="mr-1 h-4 w-4" />
                                    {story.session.duration} minutos de leitura
                                  </div>
                                  <Button
                                    asChild
                                    size="sm"
                                    className="bg-secondary hover:bg-secondary-dark"
                                  >
                                    <Link href={`/story/read/${story.id}?childId=${childProfile.id}`}>
                                      <a className="flex items-center">
                                        {story.session.completed ? "Reler" : "Continuar"}{" "}
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                      </a>
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Progresso de {childProfile.name}</CardTitle>
                  <CardDescription>
                    Acompanhe o desenvolvimento da leitura
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <BookOpen className="h-8 w-8 text-primary" />
                            <div className="text-2xl font-bold">{mockStories.length}</div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Total de histórias
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <Clock className="h-8 w-8 text-secondary" />
                            <div className="text-2xl font-bold">{totalReadingTime}m</div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Tempo de leitura
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <Award className="h-8 w-8 text-accent" />
                            <div className="text-2xl font-bold">
                              {Math.round((completedStories / mockStories.length) * 100)}%
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Taxa de conclusão
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="pt-4">
                      <h3 className="font-heading font-bold mb-4">Atividade Recente</h3>
                      <div className="space-y-4">
                        {mockReadingSessions.sort((a, b) => 
                          new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
                        ).map((session) => {
                          const story = mockStories.find((s) => s.id === session.storyId);
                          if (!story) return null;
                          
                          return (
                            <div key={session.id} className="flex items-center border-b pb-4">
                              <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-white mr-4">
                                <Play className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                  <div>
                                    <h4 className="font-medium">{story.title}</h4>
                                    <p className="text-xs text-muted-foreground">
                                      {getTimeAgo(new Date(session.lastReadAt))} • {session.duration} minutos
                                    </p>
                                  </div>
                                  <div className="mt-2 sm:mt-0">
                                    {session.completed ? (
                                      <Badge className="bg-success text-white">Concluída</Badge>
                                    ) : (
                                      <Badge className="bg-warning text-black">
                                        {session.progress}% completa
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default ChildDashboardPage;
