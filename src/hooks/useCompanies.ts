import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Company {
  id: string;
  user_id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  size: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contacts_count?: number;
  deals_count?: number;
}

export interface CreateCompanyData {
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  notes?: string;
}

export function useCompanies() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['companies', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Company[];
    },
    enabled: !!user,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateCompanyData) => {
      const { data: result, error } = await supabase
        .from('companies')
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
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar empresa: ' + error.message);
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Company> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('companies')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar empresa: ' + error.message);
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('companies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa excluída!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir empresa: ' + error.message);
    },
  });
}
