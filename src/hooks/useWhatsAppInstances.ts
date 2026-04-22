import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface WhatsAppInstance {
  id: string;
  organization_id: string;
  name: string;
  integration_type: 'evolution_api' | 'whatsapp_business';
  config: Record<string, unknown>;
  is_active: boolean;
  is_default: boolean;
  phone_number?: string;
  instance_name?: string;
  status?: string;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateInstanceData {
  name: string;
  integration_type: 'evolution_api' | 'whatsapp_business';
  config: Record<string, unknown>;
  phone_number?: string;
  is_default?: boolean;
}

const extractDigits = (value: string) => value.replace(/\D/g, '');

const formatPhoneNumber = (value: string): string => {
  const digits = extractDigits(value);
  if (digits.length < 10) return '';

  if (digits.startsWith('55') && digits.length >= 12) {
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4);
    if (rest.length === 9) return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    if (rest.length === 8) return `+55 (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }

  return `+${digits}`;
};

const normalizePhoneCandidate = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.trim();
  if (!cleaned) return undefined;

  const digits = extractDigits(cleaned);
  if (digits.length < 10) return undefined;

  const formatted = formatPhoneNumber(cleaned);
  return formatted || undefined;
};

const extractPhoneFromConfig = (config: Record<string, unknown>): string | undefined => {
  const candidates = [
    config.phone_number,
    config.phone,
    config.ownerJid,
    config.owner_jid,
    config.owner,
    config.number,
  ];

  for (const candidate of candidates) {
    const normalized = normalizePhoneCandidate(candidate);
    if (normalized) return normalized;
  }

  return undefined;
};

export function useWhatsAppInstances() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch all WhatsApp instances for the organization
  const instancesQuery = useQuery({
    queryKey: ['whatsapp_instances', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      const { data, error } = await supabase
        .from('organization_integrations')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .in('integration_type', ['evolution_api', 'whatsapp_business'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => {
        const config = (item.config as Record<string, unknown>) || {};

        return {
          id: item.id,
          organization_id: item.organization_id,
          name: item.name,
          integration_type: item.integration_type as 'evolution_api' | 'whatsapp_business',
          config,
          is_active: item.is_active ?? false,
          is_default: config?.is_default === true,
          phone_number: extractPhoneFromConfig(config),
          instance_name: typeof config?.instance_name === 'string' ? config.instance_name : item.name,
          status: typeof config?.connection_status === 'string'
            ? config.connection_status
            : (typeof config?.status === 'string' ? config.status : undefined),
          last_sync_at: item.last_sync_at,
          created_at: item.created_at,
          updated_at: item.updated_at,
        };
      }) as WhatsAppInstance[];
    },
    enabled: !!currentOrganization?.id,
  });

  // Get active instances only
  const activeInstances = instancesQuery.data?.filter(i => i.is_active) || [];

  // Get the default instance
  const defaultInstance = instancesQuery.data?.find(i => i.is_default && i.is_active) || 
                          activeInstances[0] || null;

  // Create a new instance
  const createInstance = useMutation({
    mutationFn: async (data: CreateInstanceData) => {
      if (!currentOrganization?.id) throw new Error('No organization selected');

      // If this is the first instance or marked as default, ensure it's the only default
      const normalizedPhone = normalizePhoneCandidate(data.phone_number);
      const config = {
        ...data.config,
        is_default: data.is_default ?? false,
        instance_name: data.config?.instance_name || data.name,
        ...(normalizedPhone ? { phone_number: normalizedPhone } : {}),
      };

      // If marked as default, unset other defaults first
      if (data.is_default) {
        const existingInstances = instancesQuery.data || [];
        for (const instance of existingInstances) {
          if (instance.is_default) {
            const updatedConfig = { ...instance.config, is_default: false };
            await supabase
              .from('organization_integrations')
              .update({ config: updatedConfig as unknown as Json })
              .eq('id', instance.id);
          }
        }
      }

      const { data: newInstance, error } = await supabase
        .from('organization_integrations')
        .insert({
          organization_id: currentOrganization.id,
          name: data.name,
          integration_type: data.integration_type,
          config: config as unknown as Json,
          is_active: true,
          user_id: user?.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return newInstance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_instances'] });
      queryClient.invalidateQueries({ queryKey: ['organization_integrations'] });
      toast.success('Instância WhatsApp criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar instância: ' + error.message);
    },
  });

  // Update an instance
  const updateInstance = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CreateInstanceData> & { id: string }) => {
      const existingInstance = instancesQuery.data?.find(i => i.id === id);
      if (!existingInstance) throw new Error('Instance not found');

      const config: Record<string, unknown> = {
        ...existingInstance.config,
        ...updates.config,
        is_default: updates.is_default ?? existingInstance.is_default,
      };

      const normalizedPhone = normalizePhoneCandidate(updates.phone_number ?? config.phone_number ?? existingInstance.phone_number);
      if (normalizedPhone) config.phone_number = normalizedPhone;
      else delete config.phone_number;

      const { data, error } = await supabase
        .from('organization_integrations')
        .update({
          name: updates.name ?? existingInstance.name,
          config: config as unknown as Json,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_instances'] });
      queryClient.invalidateQueries({ queryKey: ['organization_integrations'] });
      toast.success('Instância atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar instância: ' + error.message);
    },
  });

  // Set an instance as default
  const setDefaultInstance = useMutation({
    mutationFn: async (instanceId: string) => {
      if (!currentOrganization?.id) throw new Error('No organization selected');

      // First, unset all defaults
      const instances = instancesQuery.data || [];
      for (const instance of instances) {
        if (instance.is_default && instance.id !== instanceId) {
          const updatedConfig = { ...instance.config, is_default: false };
          await supabase
            .from('organization_integrations')
            .update({ config: updatedConfig as unknown as Json })
            .eq('id', instance.id);
        }
      }

      // Set the new default
      const targetInstance = instances.find(i => i.id === instanceId);
      if (targetInstance) {
        const updatedConfig = { ...targetInstance.config, is_default: true };
        const { error } = await supabase
          .from('organization_integrations')
          .update({ config: updatedConfig as unknown as Json })
          .eq('id', instanceId);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_instances'] });
      queryClient.invalidateQueries({ queryKey: ['organization_integrations'] });
      toast.success('Instância padrão definida!');
    },
    onError: (error) => {
      toast.error('Erro ao definir padrão: ' + error.message);
    },
  });

  // Delete an instance (logout from Evolution API first, then remove from DB)
  const deleteInstance = useMutation({
    mutationFn: async (id: string) => {
      // Find the instance to get its name for Evolution API logout
      const instance = (instancesQuery.data || []).find(i => i.id === id);
      const instanceName = instance?.instance_name || 
        (instance?.config as Record<string, unknown>)?.instance_name as string;

      // Try to logout/delete from Evolution API first (best effort)
      if (instanceName && currentOrganization?.id) {
        try {
          await supabase.functions.invoke('evolution-qrcode', {
            body: {
              organization_id: currentOrganization.id,
              instance_name: instanceName,
              action: 'delete',
            },
          });
        } catch (e) {
          console.warn('Evolution API delete failed (continuing with DB removal):', e);
        }
      }

      // Remove from database
      const { error } = await supabase
        .from('organization_integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_instances'] });
      queryClient.invalidateQueries({ queryKey: ['organization_integrations'] });
      toast.success('Instância desconectada e removida!');
    },
    onError: (error) => {
      toast.error('Erro ao remover instância: ' + error.message);
    },
  });

  // Toggle instance active state
  const toggleInstance = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('organization_integrations')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_instances'] });
      queryClient.invalidateQueries({ queryKey: ['organization_integrations'] });
      toast.success(data.is_active ? 'Instância ativada!' : 'Instância desativada!');
    },
    onError: (error) => {
      toast.error('Erro ao alterar instância: ' + error.message);
    },
  });

  return {
    instances: instancesQuery.data ?? [],
    activeInstances,
    defaultInstance,
    isLoading: instancesQuery.isLoading,
    createInstance,
    updateInstance,
    deleteInstance,
    toggleInstance,
    setDefaultInstance,
  };
}
