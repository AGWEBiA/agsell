import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export function useGroupRotator() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['group-rotator-campaigns', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('group_rotator_campaigns' as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!orgId,
  });

  const fetchEntries = async (campaignId: string) => {
    const { data, error } = await supabase
      .from('group_rotator_entries' as any)
      .select('*')
      .eq('campaign_id', campaignId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data as any[];
  };

  const fetchClicks = async (campaignId: string, limit = 100) => {
    const { data, error } = await supabase
      .from('group_rotator_clicks' as any)
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as any[];
  };

  const createCampaign = useMutation({
    mutationFn: async (input: { name: string; slug: string }) => {
      if (!orgId) throw new Error('Organização não encontrada');
      const { data, error } = await supabase
        .from('group_rotator_campaigns' as any)
        .insert({ name: input.name, slug: input.slug, organization_id: orgId } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-rotator-campaigns', orgId] });
      toast.success('Campanha criada!');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; slug?: string; is_active?: boolean; click_limit?: number; tags?: string[] }) => {
      const { data, error } = await supabase
        .from('group_rotator_campaigns' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-rotator-campaigns', orgId] });
      toast.success('Campanha atualizada!');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('group_rotator_campaigns' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-rotator-campaigns', orgId] });
      toast.success('Campanha removida!');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const createEntry = useMutation({
    mutationFn: async (input: { campaign_id: string; name: string; invite_link: string; max_capacity?: number; max_clicks?: number; sort_order?: number }) => {
      const { data, error } = await supabase
        .from('group_rotator_entries' as any)
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => toast.success('Grupo adicionado!'),
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; invite_link?: string; max_capacity?: number; max_clicks?: number; is_paused?: boolean; member_count?: number; sort_order?: number }) => {
      const { data, error } = await supabase
        .from('group_rotator_entries' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => toast.success('Grupo atualizado!'),
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('group_rotator_entries' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => toast.success('Grupo removido!'),
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  return {
    campaigns,
    isLoadingCampaigns,
    fetchEntries,
    fetchClicks,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    createEntry,
    updateEntry,
    deleteEntry,
  };
}
