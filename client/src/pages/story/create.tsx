import React from "react";
import StoryWizard from "@/components/wizard/story-wizard";

const CreateStoryPage = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary">Criar Nova História</h1>
        <p className="text-muted-foreground mt-2">
          Siga o assistente para criar uma história personalizada
        </p>
      </div>
      
      <StoryWizard />
    </div>
  );
};

export default CreateStoryPage;