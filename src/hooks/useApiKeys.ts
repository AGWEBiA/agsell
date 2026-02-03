import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface ApiKey {
  id: string;
  organization_id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  requests_today: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'ag_';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export function useApiKeys() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['api-keys', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
      
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, organization_id, name, key_prefix, permissions, rate_limit_per_minute, rate_limit_per_day, requests_today, is_active, expires_at, created_at')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ApiKey[];
    },
    enabled: !!currentOrganization,
  });

  const createApiKey = useMutation({
    mutationFn: async (input: {
      name: string;
      permissions: string[];
      rate_limit_per_minute?: number;
      rate_limit_per_day?: number;
      expires_at?: string | null;
    }) => {
      if (!currentOrganization) throw new Error('No organization');

      const rawKey = generateApiKey();
      const keyHash = await hashApiKey(rawKey);
      const keyPrefix = rawKey.substring(0, 8);

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          organization_id: currentOrganization.id,
          name: input.name,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          permissions: input.permissions,
          rate_limit_per_minute: input.rate_limit_per_minute || 60,
          rate_limit_per_day: input.rate_limit_per_day || 10000,
          expires_at: input.expires_at,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Return the raw key only on creation (won't be retrievable after)
      return { ...data, raw_key: rawKey };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key criada com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar API key: ' + error.message);
    },
  });

  const updateApiKey = useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      permissions?: string[];
      rate_limit_per_minute?: number;
      rate_limit_per_day?: number;
      is_active?: boolean;
      expires_at?: string | null;
    }) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('api_keys')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key atualizada');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  const deleteApiKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key removida');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover: ' + error.message);
    },
  });

  return {
    apiKeys,
    isLoading,
    createApiKey,
    updateApiKey,
    deleteApiKey,
  };
}
