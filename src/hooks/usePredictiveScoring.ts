import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface PredictiveScore {
  id: string;
  contact_id: string;
  organization_id: string;
  predicted_score: number;
  confidence: number;
  factors: Array<{ name: string; impact: number; description: string }>;
  model_version: string;
  calculated_at: string;
}

export function usePredictiveScores() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['predictive_scores', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predictive_lead_scores')
        .select('*, contacts(first_name, last_name, email, lead_score)')
        .eq('organization_id', orgId!)
        .order('predicted_score', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!orgId,
  });
}

export function useCalculatePredictiveScore() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (contactId: string) => {
      const { data, error } = await supabase.functions.invoke('predictive-scoring', {
        body: { contact_id: contactId, organization_id: currentOrganization?.id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictive_scores'] });
      toast.success('Score preditivo calculado!');
    },
    onError: (error) => {
      toast.error('Erro ao calcular score: ' + error.message);
    },
  });
}

export function useCalculateAllPredictiveScores() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('predictive-scoring', {
        body: { organization_id: currentOrganization?.id, calculate_all: true },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['predictive_scores'] });
      toast.success(`Score calculado para ${data?.processed ?? 0} contatos!`);
    },
    onError: (error) => {
      toast.error('Erro ao calcular scores: ' + error.message);
    },
  });
}
