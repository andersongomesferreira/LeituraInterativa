import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";
import { Baby, Blocks, BookOpen, User, Clock, BookOpen as BookIcon } from "lucide-react";

// Função de utilidade para obter o ícone baseado na faixa etária
const getAgeIcon = (ageGroup: string) => {
  switch (ageGroup) {
    case "3-5":
      return <Baby className="mr-2 h-4 w-4" />;
    case "6-8":
      return <Blocks className="mr-2 h-4 w-4" />;
    case "9-12":
      return <BookOpen className="mr-2 h-4 w-4" />;
    default:
      return <User className="mr-2 h-4 w-4" />;
  }
};

interface ChildProfileProps {
  profile?: {
    id: number;
    name: string;
    ageGroup: string;
    avatar?: string;
  };
  isNew?: boolean;
  onClose: () => void;
  open: boolean;
}

const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  ageGroup: z.string().min(1, "Faixa etária é obrigatória"),
  avatar: z.string().optional(),
});

const ChildProfileDialog = ({ profile, isNew = false, onClose, open }: ChildProfileProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || "",
      ageGroup: profile?.ageGroup || "6-8",
      avatar: profile?.avatar || "",
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      if (isNew) {
        return apiRequest("POST", "/api/child-profiles", data);
      } else if (profile) {
        return apiRequest("PATCH", `/api/child-profiles/${profile.id}`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/child-profiles"] });
      toast({
        title: isNew ? "Perfil criado com sucesso!" : "Perfil atualizado com sucesso!",
        description: isNew
          ? "O perfil da criança foi criado."
          : "As alterações foram salvas.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o perfil. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    createProfileMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isNew ? "Criar Novo Perfil" : "Editar Perfil"}
          </DialogTitle>
          <DialogDescription>
            {isNew
              ? "Crie um perfil para a criança para personalizar as histórias."
              : "Edite as informações do perfil da criança."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Criança</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ageGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Faixa Etária</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a faixa etária" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="3-5">
                        <div className="flex items-center">
                          <Baby className="mr-2 h-4 w-4" /> 3-5 anos
                        </div>
                      </SelectItem>
                      <SelectItem value="6-8">
                        <div className="flex items-center">
                          <Blocks className="mr-2 h-4 w-4" /> 6-8 anos
                        </div>
                      </SelectItem>
                      <SelectItem value="9-12">
                        <div className="flex items-center">
                          <BookOpen className="mr-2 h-4 w-4" /> 9-12 anos
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary-dark"
                disabled={createProfileMutation.isPending}
              >
                {createProfileMutation.isPending
                  ? "Salvando..."
                  : isNew
                  ? "Criar Perfil"
                  : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export interface ChildProfileCardProps {
  profile: {
    id: number;
    name: string;
    ageGroup: string;
    avatar?: string;
  };
  onEdit: (profile: any) => void;
  readingStats?: {
    totalStories: number;
    readingTime: number;
    lastRead?: Date;
  };
}

export const ChildProfileCard = ({
  profile,
  onEdit,
  readingStats,
}: ChildProfileCardProps) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all flex flex-col">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-white mr-4">
          {getAgeIcon(profile.ageGroup)}
        </div>
        <div>
          <h4 className="font-heading font-bold text-lg">{profile.name}</h4>
          <p className="text-sm text-neutral-600">
            {profile.ageGroup === "3-5"
              ? "3-5 anos"
              : profile.ageGroup === "6-8"
              ? "6-8 anos"
              : "9-12 anos"}
          </p>
        </div>
      </div>

      {readingStats && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-neutral-100 p-2 rounded-lg text-center">
            <div className="flex items-center justify-center mb-1">
              <BookIcon className="h-4 w-4 mr-1 text-primary" />
              <span className="font-bold">{readingStats.totalStories}</span>
            </div>
            <p className="text-xs text-neutral-500">Histórias</p>
          </div>
          <div className="bg-neutral-100 p-2 rounded-lg text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-4 w-4 mr-1 text-primary" />
              <span className="font-bold">{readingStats.readingTime}m</span>
            </div>
            <p className="text-xs text-neutral-500">Tempo</p>
          </div>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(profile)}
        >
          Editar
        </Button>
        <Button
          asChild
          size="sm"
          className="bg-secondary hover:bg-secondary-dark"
        >
          <Link href={`/dashboard/child/${profile.id}`}>
            <a>Ver Histórias</a>
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default ChildProfileDialog;
