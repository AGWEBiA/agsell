import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface WhatsAppCampaign {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  message_content: string;
  message_type: 'text' | 'image' | 'video' | 'document';
  media_url: string | null;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  target_type: 'contacts' | 'tags' | 'groups' | 'all';
  target_filters: Record<string, unknown>;
  messages_per_minute: number;
  delay_between_messages: number;
  daily_limit: number;
  total_recipients: number;
  messages_sent: number;
  messages_delivered: number;
  messages_failed: number;
  messages_read: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  paused_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface WhatsAppCampaignRecipient {
  id: string;
  campaign_id: string;
  contact_id: string | null;
  phone_number: string;
  name: string | null;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'skipped';
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
}

export interface WhatsAppTemplate {
  id: string;
  organization_id: string;
  external_template_id: string | null;
  name: string;
  language: string;
  category: 'marketing' | 'utility' | 'authentication' | null;
  status: 'pending' | 'approved' | 'rejected';
  content: string;
  header_type: 'text' | 'image' | 'video' | 'document' | null;
  header_content: string | null;
  footer_text: string | null;
  buttons: unknown[];
  variables: unknown[];
  created_at: string;
  updated_at: string;
}

export function useWhatsAppCampaigns() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  // Fetch campaigns
  const { data: campaigns = [], isLoading: isLoadingCampaigns, refetch: refetchCampaigns } = useQuery({
    queryKey: ['whatsapp-campaigns', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('whatsapp_campaigns')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WhatsAppCampaign[];
    },
    enabled: !!orgId,
  });

  // Fetch templates
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['whatsapp-templates', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WhatsAppTemplate[];
    },
    enabled: !!orgId,
  });

  // Create campaign
  const createCampaignMutation = useMutation({
    mutationFn: async (campaign: {
      name: string;
      message_content: string;
      description?: string;
      message_type?: string;
      media_url?: string;
      target_type?: string;
      messages_per_minute?: number;
      delay_between_messages?: number;
      daily_limit?: number;
      scheduled_at?: string;
      instance_id?: string;
    }) => {
      if (!orgId || !user?.id) throw new Error('Organização ou usuário não encontrado');
      
      const { data, error } = await supabase
        .from('whatsapp_campaigns')
        .insert({
          name: campaign.name,
          message_content: campaign.message_content,
          description: campaign.description,
          message_type: campaign.message_type || 'text',
          media_url: campaign.media_url || null,
          target_type: campaign.target_type || 'contacts',
          messages_per_minute: campaign.messages_per_minute || 20,
          delay_between_messages: campaign.delay_between_messages || 3000,
          daily_limit: campaign.daily_limit || 1000,
          scheduled_at: campaign.scheduled_at || null,
          status: campaign.scheduled_at ? 'scheduled' : 'draft',
          organization_id: orgId,
          created_by: user.id,
          target_filters: {} as Json,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-campaigns', orgId] });
      toast.success('Campanha criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar campanha: ${error.message}`);
    },
  });

  // Update campaign
  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      name?: string;
      description?: string | null;
      message_content?: string;
      message_type?: string;
      media_url?: string | null;
      target_type?: string;
      messages_per_minute?: number;
      delay_between_messages?: number;
      daily_limit?: number;
      status?: string;
      started_at?: string;
      paused_at?: string;
      completed_at?: string;
      scheduled_at?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('whatsapp_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-campaigns', orgId] });
      toast.success('Campanha atualizada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar campanha: ${error.message}`);
    },
  });

  // Delete campaign
  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from('whatsapp_campaigns')
        .delete()
        .eq('id', campaignId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-campaigns', orgId] });
      toast.success('Campanha removida!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover campanha: ${error.message}`);
    },
  });

  // Start campaign via edge function
  const startCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('process-whatsapp-campaign', {
        body: { campaign_id: campaignId, action: 'start' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-campaigns', orgId] });
      toast.success('Campanha iniciada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao iniciar campanha: ${error.message}`);
    },
  });

  // Pause campaign via edge function
  const pauseCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('process-whatsapp-campaign', {
        body: { campaign_id: campaignId, action: 'pause' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-campaigns', orgId] });
      toast.success('Campanha pausada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao pausar campanha: ${error.message}`);
    },
  });

  // Create template
  const createTemplateMutation = useMutation({
    mutationFn: async (template: { name: string; content: string; language?: string; category?: string }) => {
      if (!orgId) throw new Error('Organização não encontrada');
      
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .insert({
          name: template.name,
          content: template.content,
          language: template.language || 'pt_BR',
          category: template.category,
          organization_id: orgId,
          buttons: [] as Json,
          variables: [] as Json,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates', orgId] });
      toast.success('Template criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar template: ${error.message}`);
    },
  });

  // Fetch campaign recipients
  const fetchCampaignRecipients = useCallback(async (campaignId: string) => {
    const { data, error } = await supabase
      .from('whatsapp_campaign_recipients')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as WhatsAppCampaignRecipient[];
  }, []);

  // Get campaign stats
  const getCampaignStats = useCallback((campaign: WhatsAppCampaign) => {
    const total = campaign.total_recipients || 0;
    const sent = campaign.messages_sent || 0;
    const delivered = campaign.messages_delivered || 0;
    const failed = campaign.messages_failed || 0;
    const read = campaign.messages_read || 0;

    return {
      total,
      sent,
      delivered,
      failed,
      read,
      pending: total - sent - failed,
      deliveryRate: sent > 0 ? ((delivered / sent) * 100).toFixed(1) : '0',
      readRate: delivered > 0 ? ((read / delivered) * 100).toFixed(1) : '0',
      failureRate: sent > 0 ? ((failed / sent) * 100).toFixed(1) : '0',
    };
  }, []);

  return {
    campaigns,
    isLoadingCampaigns,
    refetchCampaigns,
    templates,
    isLoadingTemplates,
    createCampaign: createCampaignMutation.mutate,
    updateCampaign: updateCampaignMutation.mutate,
    deleteCampaign: deleteCampaignMutation.mutate,
    startCampaign: startCampaignMutation.mutate,
    pauseCampaign: pauseCampaignMutation.mutate,
    stopCampaign: (id: string) => updateCampaignMutation.mutate({ id, status: 'cancelled', completed_at: new Date().toISOString() }),
    createTemplate: createTemplateMutation.mutate,
    fetchCampaignRecipients,
    getCampaignStats,
    isCreatingCampaign: createCampaignMutation.isPending,
    isUpdatingCampaign: updateCampaignMutation.isPending,
    isLoading: isLoadingCampaigns,
  };
}
