import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate, Json } from '@/integrations/supabase/types';

type Form = Tables<'forms'>;
type FormInsert = TablesInsert<'forms'>;
type FormUpdate = TablesUpdate<'forms'>;
type FormSubmission = Tables<'form_submissions'>;

export function useForms() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const formsQuery = useQuery({
    queryKey: ['forms', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Form[];
    },
    enabled: !!user?.id,
  });

  const createForm = useMutation({
    mutationFn: async (form: Omit<FormInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('forms')
        .insert({ ...form, user_id: user.id, organization_id: currentOrganization?.id ?? null })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Formulário criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar formulário: ' + error.message);
    },
  });

  const updateForm = useMutation({
    mutationFn: async ({ id, ...updates }: FormUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('forms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Formulário atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar formulário: ' + error.message);
    },
  });

  const deleteForm = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Formulário excluído!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir formulário: ' + error.message);
    },
  });

  const toggleForm = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('forms')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success(data.is_active ? 'Formulário ativado!' : 'Formulário desativado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar formulário: ' + error.message);
    },
  });

  const getFormSubmissions = async (formId: string) => {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('form_id', formId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as FormSubmission[];
  };

  return {
    forms: formsQuery.data ?? [],
    isLoading: formsQuery.isLoading,
    error: formsQuery.error,
    createForm,
    updateForm,
    deleteForm,
    toggleForm,
    getFormSubmissions,
  };
}
