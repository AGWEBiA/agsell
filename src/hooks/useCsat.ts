import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface CsatSurvey {
  id: string;
  organization_id: string;
  name: string;
  question: string;
  is_active: boolean;
  auto_send: boolean;
  channels: string[];
  created_at: string;
  updated_at: string;
}

export interface CsatResponse {
  id: string;
  survey_id: string;
  conversation_id: string | null;
  contact_id: string | null;
  organization_id: string;
  agent_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export function useCsat() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const surveysQuery = useQuery({
    queryKey: ['csat-surveys', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('csat_surveys')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CsatSurvey[];
    },
    enabled: !!orgId,
  });

  const responsesQuery = useQuery({
    queryKey: ['csat-responses', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('csat_responses')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as CsatResponse[];
    },
    enabled: !!orgId,
  });

  const createSurvey = useMutation({
    mutationFn: async (survey: Partial<CsatSurvey>) => {
      if (!orgId) throw new Error('Organização não selecionada');
      const { data, error } = await supabase
        .from('csat_surveys')
        .insert({ ...survey, organization_id: orgId } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['csat-surveys', orgId] });
      toast.success('Pesquisa CSAT criada!');
    },
    onError: (error) => toast.error('Erro: ' + error.message),
  });

  const updateSurvey = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CsatSurvey> & { id: string }) => {
      const { data, error } = await supabase
        .from('csat_surveys')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['csat-surveys', orgId] });
      toast.success('Pesquisa atualizada!');
    },
    onError: (error) => toast.error('Erro: ' + error.message),
  });

  const deleteSurvey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('csat_surveys').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['csat-surveys', orgId] });
      toast.success('Pesquisa excluída!');
    },
    onError: (error) => toast.error('Erro: ' + error.message),
  });

  // Compute CSAT metrics
  const responses = responsesQuery.data ?? [];
  const averageRating = responses.length > 0
    ? responses.reduce((sum, r) => sum + r.rating, 0) / responses.length
    : 0;
  const satisfactionRate = responses.length > 0
    ? (responses.filter(r => r.rating >= 4).length / responses.length) * 100
    : 0;

  return {
    surveys: surveysQuery.data ?? [],
    responses,
    isLoading: surveysQuery.isLoading || responsesQuery.isLoading,
    averageRating,
    satisfactionRate,
    totalResponses: responses.length,
    createSurvey,
    updateSurvey,
    deleteSurvey,
  };
}
