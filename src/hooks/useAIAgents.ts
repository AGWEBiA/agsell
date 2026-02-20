import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AIAgent {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  system_prompt: string;
  model: string;
  temperature: number;
  is_active: boolean;
  channels: string[];
  knowledge_base: string | null;
  welcome_message: string | null;
  fallback_message: string | null;
  max_tokens: number | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface AIAgentKnowledge {
  id: string;
  agent_id: string;
  title: string;
  content: string;
  content_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateAIAgentData {
  name: string;
  description?: string;
  system_prompt: string;
  model?: string;
  temperature?: number;
  channels?: string[];
  welcome_message?: string;
  fallback_message?: string;
  max_tokens?: number;
}

export function useAIAgents() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['ai_agents', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AIAgent[];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useCreateAIAgent() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateAIAgentData) => {
      if (!currentOrganization?.id || !user?.id) throw new Error('Organização não encontrada');
      const { data: result, error } = await supabase
        .from('ai_agents')
        .insert({
          ...data,
          organization_id: currentOrganization.id,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_agents'] });
      toast.success('Agente de IA criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar agente: ' + error.message);
    },
  });
}

export function useUpdateAIAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<AIAgent> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('ai_agents')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_agents'] });
      toast.success('Agente atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar agente: ' + error.message);
    },
  });
}

export function useDeleteAIAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ai_agents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_agents'] });
      toast.success('Agente removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover agente: ' + error.message);
    },
  });
}

export function useAIAgentKnowledge(agentId: string | undefined) {
  return useQuery({
    queryKey: ['ai_agent_knowledge', agentId],
    queryFn: async () => {
      if (!agentId) return [];
      const { data, error } = await supabase
        .from('ai_agent_knowledge')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AIAgentKnowledge[];
    },
    enabled: !!agentId,
  });
}

export function useAddKnowledge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { agent_id: string; title: string; content: string; content_type?: string }) => {
      const { data: result, error } = await supabase
        .from('ai_agent_knowledge')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai_agent_knowledge', variables.agent_id] });
      toast.success('Conhecimento adicionado!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar conhecimento: ' + error.message);
    },
  });
}

export function useDeleteKnowledge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string }) => {
      const { error } = await supabase.from('ai_agent_knowledge').delete().eq('id', id);
      if (error) throw error;
      return agentId;
    },
    onSuccess: (agentId) => {
      queryClient.invalidateQueries({ queryKey: ['ai_agent_knowledge', agentId] });
      toast.success('Conhecimento removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover: ' + error.message);
    },
  });
}
