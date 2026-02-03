import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface WhatsAppGroup {
  id: string;
  organization_id: string;
  external_group_id: string | null;
  name: string;
  description: string | null;
  group_type: 'group' | 'community';
  invite_link: string | null;
  is_admin: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  is_active: boolean;
  settings: Record<string, unknown>;
}

export interface WhatsAppGroupMember {
  id: string;
  group_id: string;
  contact_id: string | null;
  phone_number: string;
  name: string | null;
  is_admin: boolean;
  joined_at: string;
  left_at: string | null;
  status: 'active' | 'left' | 'removed' | 'banned';
  created_at: string;
  updated_at: string;
}

export interface WhatsAppGroupEvent {
  id: string;
  group_id: string;
  member_id: string | null;
  phone_number: string;
  event_type: 'join' | 'leave' | 'remove' | 'promote' | 'demote';
  event_data: Record<string, unknown>;
  created_at: string;
}

export interface WhatsAppGroupMessage {
  id: string;
  organization_id: string;
  name: string;
  message_type: 'text' | 'image' | 'video' | 'document';
  content: string;
  media_url: string | null;
  trigger_event: 'on_join' | 'on_leave' | 'scheduled' | 'manual' | null;
  is_active: boolean;
  target_groups: string[];
  created_at: string;
  updated_at: string;
}

export function useWhatsAppGroups() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  // Fetch groups
  const { data: groups = [], isLoading: isLoadingGroups, refetch: refetchGroups } = useQuery({
    queryKey: ['whatsapp-groups', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('whatsapp_groups')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WhatsAppGroup[];
    },
    enabled: !!orgId,
  });

  // Fetch group messages/templates
  const { data: groupMessages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['whatsapp-group-messages', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('whatsapp_group_messages')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WhatsAppGroupMessage[];
    },
    enabled: !!orgId,
  });

  // Create group
  const createGroupMutation = useMutation({
    mutationFn: async (group: { name: string; description?: string; group_type?: string }) => {
      if (!orgId) throw new Error('Organização não encontrada');
      
      const { data, error } = await supabase
        .from('whatsapp_groups')
        .insert({
          name: group.name,
          description: group.description,
          group_type: group.group_type || 'group',
          organization_id: orgId,
          settings: {} as Json,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-groups', orgId] });
      toast.success('Grupo criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar grupo: ${error.message}`);
    },
  });

  // Update group
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, name, description, is_active }: { id: string; name?: string; description?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('whatsapp_groups')
        .update({ name, description, is_active })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-groups', orgId] });
      toast.success('Grupo atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar grupo: ${error.message}`);
    },
  });

  // Delete group
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('whatsapp_groups')
        .delete()
        .eq('id', groupId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-groups', orgId] });
      toast.success('Grupo removido!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover grupo: ${error.message}`);
    },
  });

  // Create group message template
  const createGroupMessageMutation = useMutation({
    mutationFn: async (message: { name: string; content: string; message_type?: string; trigger_event?: string; is_active?: boolean; target_groups?: string[] }) => {
      if (!orgId) throw new Error('Organização não encontrada');
      
      const { data, error } = await supabase
        .from('whatsapp_group_messages')
        .insert({
          name: message.name,
          content: message.content,
          message_type: message.message_type || 'text',
          trigger_event: message.trigger_event || 'manual',
          is_active: message.is_active ?? true,
          target_groups: message.target_groups || [],
          organization_id: orgId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-group-messages', orgId] });
      toast.success('Mensagem criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar mensagem: ${error.message}`);
    },
  });

  // Fetch group members
  const fetchGroupMembers = useCallback(async (groupId: string) => {
    const { data, error } = await supabase
      .from('whatsapp_group_members')
      .select('*')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: false });
    
    if (error) throw error;
    return data as WhatsAppGroupMember[];
  }, []);

  // Fetch group events
  const fetchGroupEvents = useCallback(async (groupId: string, limit = 50) => {
    const { data, error } = await supabase
      .from('whatsapp_group_events')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data as WhatsAppGroupEvent[];
  }, []);

  return {
    groups,
    isLoadingGroups,
    refetchGroups,
    groupMessages,
    isLoadingMessages,
    createGroup: createGroupMutation.mutate,
    updateGroup: updateGroupMutation.mutate,
    deleteGroup: deleteGroupMutation.mutate,
    createGroupMessage: createGroupMessageMutation.mutate,
    fetchGroupMembers,
    fetchGroupEvents,
    isCreatingGroup: createGroupMutation.isPending,
    isUpdatingGroup: updateGroupMutation.isPending,
  };
}
