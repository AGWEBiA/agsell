import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface PipelineStage {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  position: number;
  created_at: string;
}

export interface Deal {
  id: string;
  user_id: string;
  contact_id: string | null;
  company_id: string | null;
  stage_id: string | null;
  title: string;
  value: number | null;
  currency: string | null;
  probability: number | null;
  expected_close_date: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contact?: { id: string; first_name: string; last_name: string | null } | null;
  company?: { id: string; name: string } | null;
}

export interface CreateStageData {
  name: string;
  color?: string;
  position?: number;
}

export interface CreateDealData {
  title: string;
  value?: number;
  stage_id?: string;
  contact_id?: string;
  company_id?: string;
  expected_close_date?: string;
  probability?: number;
  notes?: string;
}

export function usePipelineStages() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pipeline_stages', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      return data as PipelineStage[];
    },
    enabled: !!user,
  });
}

export function useDeals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          contact:contacts(id, first_name, last_name),
          company:companies(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Deal[];
    },
    enabled: !!user,
  });
}

export function useCreateStage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (data: CreateStageData) => {
      // Get max position
      const { data: stages } = await supabase
        .from('pipeline_stages')
        .select('position')
        .order('position', { ascending: false })
        .limit(1);

      const position = data.position ?? ((stages?.[0]?.position ?? -1) + 1);

      const { data: result, error } = await supabase
        .from('pipeline_stages')
        .insert({
          ...data,
          position,
          user_id: user!.id,
          organization_id: currentOrganization?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline_stages'] });
      toast.success('Estágio criado!');
    },
    onError: (error) => {
      toast.error('Erro ao criar estágio: ' + error.message);
    },
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (data: CreateDealData) => {
      const { data: result, error } = await supabase
        .from('deals')
        .insert({
          ...data,
          user_id: user!.id,
          organization_id: currentOrganization?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal criado com sucesso!');
      // Fire automation trigger
      try {
        const { data: automations } = await supabase
          .from('automations')
          .select('id')
          .eq('organization_id', currentOrganization?.id ?? '')
          .eq('trigger_type', 'deal_created')
          .eq('is_active', true);
        if (automations?.length) {
          await Promise.allSettled(
            automations.map((a) =>
              supabase.functions.invoke('process-automation', {
                body: { automation_id: a.id, contact_id: result.contact_id, trigger_event: 'deal_created' },
              })
            )
          );
        }
      } catch {}
    },
    onError: (error) => {
      toast.error('Erro ao criar deal: ' + error.message);
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Deal> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('deals')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: async (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });

      const orgId = currentOrganization?.id ?? '';
      const contactId = result.contact_id;

      // Fire deal_stage_changed automation if stage_id was updated
      if (variables.stage_id) {
        try {
          const { data: automations } = await supabase
            .from('automations')
            .select('id')
            .eq('organization_id', orgId)
            .eq('trigger_type', 'deal_stage_changed')
            .eq('is_active', true);
          if (automations?.length) {
            await Promise.allSettled(
              automations.map((a) =>
                supabase.functions.invoke('process-automation', {
                  body: { automation_id: a.id, contact_id: contactId, trigger_event: 'deal_stage_changed' },
                })
              )
            );
          }
        } catch {}
      }

      // Fire deal_won automation if status changed to won
      if (variables.status === 'won') {
        try {
          const { data: automations } = await supabase
            .from('automations')
            .select('id')
            .eq('organization_id', orgId)
            .eq('trigger_type', 'deal_won')
            .eq('is_active', true);
          if (automations?.length) {
            await Promise.allSettled(
              automations.map((a) =>
                supabase.functions.invoke('process-automation', {
                  body: { automation_id: a.id, contact_id: contactId, trigger_event: 'deal_won' },
                })
              )
            );
          }
        } catch {}
      }
    },
    onError: (error) => {
      toast.error('Erro ao atualizar deal: ' + error.message);
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('deals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal excluído!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir deal: ' + error.message);
    },
  });
}

export function useInitializeDefaultStages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const defaultStages = [
        { name: 'Prospecção', color: '#a70202', position: 0 },
        { name: 'Qualificação', color: '#3b82f6', position: 1 },
        { name: 'Proposta', color: '#f59e0b', position: 2 },
        { name: 'Negociação', color: '#8b5cf6', position: 3 },
        { name: 'Fechado', color: '#22c55e', position: 4 },
      ];

      const { error } = await supabase.from('pipeline_stages').insert(
        defaultStages.map((s) => ({ ...s, user_id: user!.id }))
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline_stages'] });
    },
  });
}
