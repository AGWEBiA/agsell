import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

export interface InstagramAccount {
  id: string;
  organization_id: string;
  instagram_user_id: string;
  username: string;
  full_name: string | null;
  profile_picture_url: string | null;
  is_active: boolean;
  connected_by: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface InstagramAutomation {
  id: string;
  organization_id: string;
  instagram_account_id: string;
  name: string;
  description: string | null;
  automation_type: string;
  trigger_config: Record<string, unknown>;
  actions: Record<string, unknown>[];
  is_active: boolean;
  executions_count: number;
  last_triggered_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InstagramAutomationLog {
  id: string;
  automation_id: string;
  instagram_account_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  action_taken: string | null;
  status: string;
  error_message: string | null;
  contact_id: string | null;
  created_at: string;
}

export function useInstagramAccounts() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['instagram_accounts', orgId],
    queryFn: async () => {
      // Use the safe view that excludes sensitive token fields
      const { data, error } = await supabase
        .from('instagram_accounts_safe' as any)
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as InstagramAccount[];
    },
    enabled: !!orgId,
  });
}

export function useInstagramAutomations(accountId?: string) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['instagram_automations', orgId, accountId],
    queryFn: async () => {
      let query = supabase
        .from('instagram_automations')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      
      if (accountId) {
        query = query.eq('instagram_account_id', accountId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as InstagramAutomation[];
    },
    enabled: !!orgId,
  });
}

export function useInstagramAutomationLogs(automationId?: string) {
  return useQuery({
    queryKey: ['instagram_automation_logs', automationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_automation_logs')
        .select('*')
        .eq('automation_id', automationId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as InstagramAutomationLog[];
    },
    enabled: !!automationId,
  });
}

export function useCreateInstagramAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (automation: Partial<InstagramAutomation>) => {
      const { data, error } = await supabase
        .from('instagram_automations')
        .insert(automation as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram_automations'] });
      toast({ title: 'Automação criada', description: 'Automação de Instagram criada com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateInstagramAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InstagramAutomation> & { id: string }) => {
      const { data, error } = await supabase
        .from('instagram_automations')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram_automations'] });
      toast({ title: 'Automação atualizada' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteInstagramAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('instagram_automations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram_automations'] });
      toast({ title: 'Automação excluída' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}
