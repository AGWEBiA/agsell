import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

export interface WhatsAppFlow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  status: string;
  flow_json: { screens: FlowScreen[] };
  trigger_keywords: string[];
  auto_trigger: boolean;
  response_message: string | null;
  collect_as_contact: boolean;
  is_active: boolean;
  submissions_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FlowScreen {
  id: string;
  title: string;
  fields: FlowField[];
}

export interface FlowField {
  id: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'select' | 'date';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // for select type
}

export interface WhatsAppFlowSubmission {
  id: string;
  flow_id: string;
  contact_id: string | null;
  phone_number: string;
  contact_name: string | null;
  responses: Record<string, unknown>;
  status: string;
  completed_at: string | null;
  created_at: string;
}

export function useWhatsAppFlows() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['whatsapp_flows', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_flows')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as WhatsAppFlow[];
    },
    enabled: !!orgId,
  });
}

export function useWhatsAppFlowSubmissions(flowId?: string) {
  return useQuery({
    queryKey: ['whatsapp_flow_submissions', flowId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_flow_submissions')
        .select('*')
        .eq('flow_id', flowId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as WhatsAppFlowSubmission[];
    },
    enabled: !!flowId,
  });
}

export function useCreateWhatsAppFlow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (flow: Partial<WhatsAppFlow>) => {
      const { data, error } = await supabase
        .from('whatsapp_flows')
        .insert(flow as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_flows'] });
      toast({ title: 'Flow criado', description: 'WhatsApp Flow criado com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateWhatsAppFlow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WhatsAppFlow> & { id: string }) => {
      const { data, error } = await supabase
        .from('whatsapp_flows')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_flows'] });
      toast({ title: 'Flow atualizado' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteWhatsAppFlow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('whatsapp_flows')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_flows'] });
      toast({ title: 'Flow excluído' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}
