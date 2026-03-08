import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FlowNodeAnalytic {
  id: string;
  automation_id: string;
  node_id: string;
  entries_count: number;
  exits_count: number;
  conversions_count: number;
  errors_count: number;
  avg_duration_seconds: number;
  last_triggered_at: string | null;
}

export function useFlowNodeAnalytics(automationId?: string) {
  return useQuery({
    queryKey: ['flow_node_analytics', automationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flow_node_analytics')
        .select('*')
        .eq('automation_id', automationId!);
      if (error) throw error;
      return (data ?? []) as FlowNodeAnalytic[];
    },
    enabled: !!automationId,
  });
}
