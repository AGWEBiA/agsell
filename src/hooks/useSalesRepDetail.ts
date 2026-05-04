import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

export interface RepSalesSummary {
  id: string;
  title: string;
  value: number;
  commission_value: number;
  payment_link: string | null;
  payment_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesRepDetail {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  sales: RepSalesSummary[];
  stats: {
    totalWon: number;
    totalCommission: number;
    conversionRate: number;
    avgDealValue: number;
  };
  monthlyEvolution: {
    month: string;
    value: number;
  }[];
}

export function useSalesRepDetail(userId: string | null, period: 'day' | 'week' | 'month' | 'all' = 'all') {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['sales-rep-detail', userId, period, currentOrganization?.id],
    queryFn: async (): Promise<SalesRepDetail | null> => {
      if (!userId || !currentOrganization?.id) return null;

      const orgId = currentOrganization.id;
      let query = supabase
        .from('deals')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', orgId);

      const now = new Date();
      if (period === 'day') {
        query = query.gte('updated_at', startOfDay(now).toISOString()).lte('updated_at', endOfDay(now).toISOString());
      } else if (period === 'week') {
        query = query.gte('updated_at', startOfWeek(now).toISOString()).lte('updated_at', endOfWeek(now).toISOString());
      } else if (period === 'month') {
        query = query.gte('updated_at', startOfMonth(now).toISOString()).lte('updated_at', endOfMonth(now).toISOString());
      }

      const { data: deals } = await query;
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', userId).single();

      const wonDeals = (deals || []).filter(d => d.status === 'won');
      const totalWon = wonDeals.reduce((s, d) => s + (Number(d.value) || 0), 0);
      const totalCommission = wonDeals.reduce((s, d) => s + (Number(d.commission_value) || 0), 0);

      // Simple evolution (last 6 months)
      const evolution = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const start = startOfMonth(d);
        const end = endOfMonth(d);
        const monthVal = (deals || [])
          .filter(deal => deal.status === 'won' && new Date(deal.updated_at) >= start && new Date(deal.updated_at) <= end)
          .reduce((s, deal) => s + (Number(deal.value) || 0), 0);
        evolution.push({
          month: d.toLocaleString('pt-BR', { month: 'short' }),
          value: monthVal
        });
      }

      const decided = (deals || []).filter(d => d.status === 'won' || d.status === 'lost').length;

      return {
        user_id: userId,
        full_name: profile?.full_name || 'Vendedor',
        avatar_url: profile?.avatar_url || null,
        sales: (deals || []).map(d => ({
          id: d.id,
          title: d.title,
          value: Number(d.value) || 0,
          commission_value: Number(d.commission_value) || 0,
          payment_link: d.payment_link,
          payment_status: d.payment_status,
          created_at: d.created_at,
          updated_at: d.updated_at
        })),
        stats: {
          totalWon,
          totalCommission,
          conversionRate: decided > 0 ? Math.round((wonDeals.length / decided) * 100) : 0,
          avgDealValue: wonDeals.length > 0 ? totalWon / wonDeals.length : 0
        },
        monthlyEvolution: evolution
      };
    },
    enabled: !!userId && !!currentOrganization?.id,
  });
}
