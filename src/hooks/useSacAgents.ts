import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface SacAgent {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  phone: string | null;
  department: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface CreateAgentInput {
  name: string;
  email: string;
  phone?: string;
  department?: string;
}

interface UpdateAgentInput {
  id: string;
  name?: string;
  email?: string;
  phone?: string | null;
  department?: string | null;
  is_active?: boolean;
}

export function useSacAgents() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const agentsQuery = useQuery({
    queryKey: ['sac-agents', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('sac_agents')
        .select('*')
        .eq('organization_id', orgId)
        .order('name');
      if (error) throw error;
      return data as SacAgent[];
    },
    enabled: !!orgId,
  });

  const createAgent = useMutation({
    mutationFn: async (input: CreateAgentInput) => {
      if (!orgId || !user?.id) throw new Error('Organização não encontrada');
      const { data, error } = await supabase
        .from('sac_agents')
        .insert({
          organization_id: orgId,
          created_by: user.id,
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          phone: input.phone?.trim() || null,
          department: input.department?.trim() || null,
        })
        .select()
        .single();
      if (error) {
        if (error.code === '23505') throw new Error('Já existe um atendente com este e-mail');
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sac-agents'] });
      toast.success('Atendente criado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateAgent = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateAgentInput) => {
      const { data, error } = await supabase
        .from('sac_agents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        if (error.code === '23505') throw new Error('Já existe um atendente com este e-mail');
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sac-agents'] });
      toast.success('Atendente atualizado!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteAgent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sac_agents')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sac-agents'] });
      toast.success('Atendente removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover atendente: ' + error.message);
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('sac_agents')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sac-agents'] });
      toast.success('Status atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  return {
    agents: agentsQuery.data ?? [],
    isLoading: agentsQuery.isLoading,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleStatus,
  };
}
