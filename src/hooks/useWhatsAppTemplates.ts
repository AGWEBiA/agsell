import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface WhatsAppTemplate {
  id: string;
  organization_id: string;
  external_template_id: string | null;
  name: string;
  language: string;
  category: string;
  status: string;
  content: string;
  header_type: string | null;
  header_content: string | null;
  footer_text: string | null;
  buttons: TemplateButton[];
  variables: TemplateVariable[];
  created_at: string;
  updated_at: string;
}

export interface TemplateButton {
  type: string; // 'url' | 'quick_reply' | 'phone'
  text: string;
  url?: string;
  phone?: string;
}

export interface TemplateVariable {
  key: string;
  example: string;
  parameter: string;
}

interface CreateTemplateData {
  name: string;
  language: string;
  category: string;
  content: string;
  header_type?: string;
  header_content?: string;
  footer_text?: string;
  buttons?: TemplateButton[];
  variables?: TemplateVariable[];
}

export function useWhatsAppTemplates() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['whatsapp_templates', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const { data, error } = await supabase
        .from('whatsapp_templates' as any)
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any[])?.map(t => ({
        ...t,
        buttons: (t.buttons || []) as TemplateButton[],
        variables: (t.variables || []) as TemplateVariable[],
      })) as WhatsAppTemplate[];
    },
    enabled: !!currentOrganization?.id,
  });

  const createTemplate = useMutation({
    mutationFn: async (input: CreateTemplateData) => {
      if (!currentOrganization?.id) throw new Error('Sem organização');
      const { error } = await supabase.from('whatsapp_templates' as any).insert({
        organization_id: currentOrganization.id,
        name: input.name,
        language: input.language,
        category: input.category,
        content: input.content,
        status: 'pending',
        header_type: input.header_type || null,
        header_content: input.header_content || null,
        footer_text: input.footer_text || null,
        buttons: (input.buttons || []) as unknown as Json,
        variables: (input.variables || []) as unknown as Json,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_templates'] });
      toast.success('Template criado com sucesso!');
    },
    onError: (e) => toast.error(e.message),
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateTemplateData> & { id: string }) => {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.name !== undefined) updates.name = input.name;
      if (input.language !== undefined) updates.language = input.language;
      if (input.category !== undefined) updates.category = input.category;
      if (input.content !== undefined) updates.content = input.content;
      if (input.header_type !== undefined) updates.header_type = input.header_type;
      if (input.header_content !== undefined) updates.header_content = input.header_content;
      if (input.footer_text !== undefined) updates.footer_text = input.footer_text;
      if (input.buttons !== undefined) updates.buttons = input.buttons as unknown as Json;
      if (input.variables !== undefined) updates.variables = input.variables as unknown as Json;
      const { error } = await supabase.from('whatsapp_templates' as any).update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_templates'] });
      toast.success('Template atualizado!');
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('whatsapp_templates' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_templates'] });
      toast.success('Template removido!');
    },
    onError: (e) => toast.error(e.message),
  });

  // Submit template to Meta for approval
  const submitToMeta = useMutation({
    mutationFn: async (templateId: string) => {
      if (!currentOrganization?.id) throw new Error('Sem organização');
      const { data, error } = await supabase.functions.invoke('whatsapp-templates', {
        body: { organization_id: currentOrganization.id, action: 'create', template_id: templateId },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao enviar para Meta');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_templates'] });
      toast.success(data.message || 'Template enviado para aprovação!');
    },
    onError: (e) => toast.error(e.message),
  });

  // Sync templates from Meta
  const syncFromMeta = useMutation({
    mutationFn: async (filters?: { name?: string; category?: string; language?: string; status?: string }) => {
      if (!currentOrganization?.id) throw new Error('Sem organização');
      const { data, error } = await supabase.functions.invoke('whatsapp-templates', {
        body: { organization_id: currentOrganization.id, action: 'sync', filters },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao sincronizar');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_templates'] });
      toast.success(data.message || 'Sincronização concluída!');
    },
    onError: (e) => toast.error(e.message),
  });

  // Check single template status
  const checkStatus = useMutation({
    mutationFn: async (templateId: string) => {
      if (!currentOrganization?.id) throw new Error('Sem organização');
      const { data, error } = await supabase.functions.invoke('whatsapp-templates', {
        body: { organization_id: currentOrganization.id, action: 'status', template_id: templateId },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao consultar status');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_templates'] });
      toast.success(`Status atualizado: ${data.status}`);
    },
    onError: (e) => toast.error(e.message),
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    submitToMeta,
    syncFromMeta,
    checkStatus,
  };
}
