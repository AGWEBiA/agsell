import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FunnelStat {
  out_stage_name: string;
  out_deal_count: number;
  out_total_value: number;
  out_position: number;
  out_color: string;
}

export interface AutomationMetric {
  out_status: string;
  out_event_count: number;
}

export function useFunnelMetrics() {
  const { user } = useAuth();

  const funnelStats = useQuery({
    queryKey: ['funnel-stats', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('get_funnel_stats', {
        p_user_id: user.id
      });
      if (error) throw error;
      return data as FunnelStat[];
    },
    enabled: !!user,
  });

  const automationMetrics = useQuery({
    queryKey: ['automation-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_automation_metrics');
      if (error) throw error;
      return data as AutomationMetric[];
    },
  });

  return {
    funnelStats,
    automationMetrics
  };
}
