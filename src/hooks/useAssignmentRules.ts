import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export type AssignmentStrategy = 'round_robin' | 'least_busy' | 'manual';

export interface AssignmentRule {
  id: string;
  organization_id: string;
  name: string;
  strategy: AssignmentStrategy;
  is_active: boolean;
  channels: string[];
  eligible_members: string[];
  max_concurrent: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useAssignmentRules() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const rulesQuery = useQuery({
    queryKey: ['assignment-rules', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('assignment_rules')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AssignmentRule[];
    },
    enabled: !!orgId,
  });

  const createRule = useMutation({
    mutationFn: async (rule: Partial<AssignmentRule>) => {
      if (!orgId) throw new Error('Organização não selecionada');
      const { data, error } = await supabase
        .from('assignment_rules')
        .insert({ ...rule, organization_id: orgId } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-rules', orgId] });
      toast.success('Regra de atribuição criada!');
    },
    onError: (error) => toast.error('Erro ao criar regra: ' + error.message),
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AssignmentRule> & { id: string }) => {
      const { data, error } = await supabase
        .from('assignment_rules')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-rules', orgId] });
      toast.success('Regra atualizada!');
    },
    onError: (error) => toast.error('Erro ao atualizar regra: ' + error.message),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assignment_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-rules', orgId] });
      toast.success('Regra excluída!');
    },
    onError: (error) => toast.error('Erro ao excluir regra: ' + error.message),
  });

  const assignConversation = useMutation({
    mutationFn: async ({ conversationId, userId }: { conversationId: string; userId: string | null }) => {
      const { data, error } = await supabase
        .from('conversations')
        .update({ assigned_to: userId } as any)
        .eq('id', conversationId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Conversa atribuída!');
    },
    onError: (error) => toast.error('Erro ao atribuir: ' + error.message),
  });

  return {
    rules: rulesQuery.data ?? [],
    isLoading: rulesQuery.isLoading,
    createRule,
    updateRule,
    deleteRule,
    assignConversation,
  };
}
