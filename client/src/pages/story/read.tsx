import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ReadingInterface from "@/components/story/reading-interface";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const ReadStoryPage = () => {
  const [_, navigate] = useLocation();
  const [match, params] = useRoute("/story/read/:id");
  const storyId = match ? parseInt(params.id) : null;
  
  // Get childId from query params if available
  const queryParams = new URLSearchParams(window.location.search);
  const childId = queryParams.get("childId") ? parseInt(queryParams.get("childId")!) : undefined;
  
  const { data: authStatus, isLoading: authLoading } = useQuery({
    queryKey: ["/api/auth/status"],
  });

  // Fetch story
  const { data: story, isLoading: storyLoading } = useQuery({
    queryKey: [`/api/stories/${storyId}`],
    enabled: !!storyId && !!authStatus?.isAuthenticated,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !authStatus?.isAuthenticated) {
      navigate("/login");
    }
  }, [authStatus, authLoading, navigate]);

  // Redirect if story not found
  useEffect(() => {
    if (!storyLoading && !story && storyId) {
      navigate("/story/create");
    }
  }, [story, storyId, storyLoading, navigate]);

  if (authLoading || storyLoading || !storyId) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authStatus?.isAuthenticated || !story) {
    return null; // Will redirect
  }

  return (
    <>
      <Helmet>
        <title>{`${story.title} - LeiturinhaBot`}</title>
        <meta name="description" content={`Leia a história "${story.title}" na LeiturinhaBot.`} />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="-ml-2"
          >
            <Link href={childId ? `/dashboard/child/${childId}` : "/story/create"}>
              <a className="flex items-center">
                <ArrowLeft className="mr-1 h-4 w-4" /> 
                {childId ? "Voltar para o perfil" : "Voltar para criação"}
              </a>
            </Link>
          </Button>
        </div>
        
        <ReadingInterface storyId={storyId} childId={childId} />
      </div>
    </>
  );
};

export default ReadStoryPage;
