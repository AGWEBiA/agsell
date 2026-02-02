import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
  contacts_count?: number;
}

export interface CreateTagData {
  name: string;
  color?: string;
}

export function useTags() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tags', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Tag[];
    },
    enabled: !!user,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateTagData) => {
      const { data: result, error } = await supabase
        .from('tags')
        .insert({
          ...data,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar tag: ' + error.message);
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Tag> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('tags')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar tag: ' + error.message);
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tags').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag excluída!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir tag: ' + error.message);
    },
  });
}
