import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface InboundWebhook {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  endpoint_id: string;
  secret_token: string;
  is_active: boolean;
  payload_format: string;
  target_action: string;
  field_mapping: Record<string, string>;
  requests_count: number;
  last_request_at: string | null;
  created_at: string;
  automation_id: string | null;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  status: string;
  status_code: number | null;
  request_headers: Record<string, string>;
  request_body: Record<string, unknown>;
  response_body: Record<string, unknown> | null;
  error_message: string | null;
  processed_at: string | null;
  created_at: string;
}

export function useWebhooks() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['webhooks', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
      
      const { data, error } = await supabase
        .from('inbound_webhooks')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InboundWebhook[];
    },
    enabled: !!currentOrganization,
  });

  const createWebhook = useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      target_action: string;
      field_mapping?: Record<string, string>;
      automation_id?: string | null;
    }) => {
      if (!currentOrganization) throw new Error('No organization');

      const { data, error } = await supabase
        .from('inbound_webhooks')
        .insert({
          organization_id: currentOrganization.id,
          name: input.name,
          description: input.description,
          target_action: input.target_action,
          field_mapping: input.field_mapping || {},
          automation_id: input.automation_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as InboundWebhook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook criado com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar webhook: ' + error.message);
    },
  });

  const updateWebhook = useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      description?: string;
      is_active?: boolean;
      target_action?: string;
      field_mapping?: Record<string, string>;
      automation_id?: string | null;
    }) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('inbound_webhooks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook atualizado');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inbound_webhooks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook removido');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover: ' + error.message);
    },
  });

  const regenerateToken = useMutation({
    mutationFn: async (id: string) => {
      // Generate new token client-side
      const newToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const { data, error } = await supabase
        .from('inbound_webhooks')
        .update({ secret_token: newToken })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as InboundWebhook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Token regenerado');
    },
    onError: (error: Error) => {
      toast.error('Erro ao regenerar token: ' + error.message);
    },
  });

  return {
    webhooks,
    isLoading,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    regenerateToken,
  };
}

export function useWebhookLogs(webhookId: string | null) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['webhook-logs', webhookId],
    queryFn: async () => {
      if (!webhookId) return [];
      
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as WebhookLog[];
    },
    enabled: !!webhookId,
  });

  return { logs, isLoading };
}
