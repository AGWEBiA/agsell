import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { startOfMonth, endOfMonth, subMonths, format, startOfDay } from 'date-fns';

export interface CRMOverview {
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalPipelineValue: number;
  wonValue: number;
  avgDealValue: number;
  avgSalesCycleDays: number;
  conversionRate: number;
  newDealsThisMonth: number;
  wonThisMonth: number;
  wonValueThisMonth: number;
  lastMonthWonValue: number;
  monthlyGrowth: number;
}

export interface SalesRepPerformance {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  pipelineValue: number;
  wonValue: number;
  commissionValue: number;
  conversionRate: number;
  avgDealValue: number;
  contactsOwned: number;
  tasksCompleted: number;
  meetingsCount: number;
  interactionsCount: number;
}

export interface DealsByStageAdmin {
  stage_id: string | null;
  name: string;
  color: string;
  count: number;
  value: number;
}

export interface DealsBySource {
  source: string;
  count: number;
  value: number;
}

export interface MonthlyTrend {
  month: string;
  created: number;
  won: number;
  wonValue: number;
}

export function useCRMOverview() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['crm-admin-overview', currentOrganization?.id],
    queryFn: async (): Promise<CRMOverview> => {
      if (!currentOrganization?.id) {
        return {
          totalDeals: 0, openDeals: 0, wonDeals: 0, lostDeals: 0,
          totalPipelineValue: 0, wonValue: 0, avgDealValue: 0,
          avgSalesCycleDays: 0, conversionRate: 0,
          newDealsThisMonth: 0, wonThisMonth: 0, wonValueThisMonth: 0,
          lastMonthWonValue: 0, monthlyGrowth: 0,
        };
      }

      const orgId = currentOrganization.id;
      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      const { data: deals } = await supabase
        .from('deals')
        .select('id, value, status, created_at, updated_at, stage_id')
        .eq('organization_id', orgId);

      const all = deals || [];
      const open = all.filter(d => d.status === 'open' || !d.status);
      const won = all.filter(d => d.status === 'won');
      const lost = all.filter(d => d.status === 'lost');

      const totalPipelineValue = open.reduce((s, d) => s + (d.value || 0), 0);
      const wonValue = won.reduce((s, d) => s + (d.value || 0), 0);
      const avgDealValue = won.length > 0 ? wonValue / won.length : 0;

      // Sales cycle: avg days between created_at and updated_at for won deals
      const cycleDays = won
        .map(d => {
          const created = new Date(d.created_at).getTime();
          const closed = new Date(d.updated_at).getTime();
          return (closed - created) / (1000 * 60 * 60 * 24);
        })
        .filter(d => d >= 0);
      const avgSalesCycleDays = cycleDays.length > 0
        ? Math.round(cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length)
        : 0;

      const decided = won.length + lost.length;
      const conversionRate = decided > 0 ? Math.round((won.length / decided) * 100) : 0;

      const newDealsThisMonth = all.filter(d => new Date(d.created_at) >= thisMonthStart).length;
      const wonThisMonthList = won.filter(d => new Date(d.updated_at) >= thisMonthStart);
      const wonThisMonth = wonThisMonthList.length;
      const wonValueThisMonth = wonThisMonthList.reduce((s, d) => s + (d.value || 0), 0);

      const wonLastMonthList = won.filter(d => {
        const dt = new Date(d.updated_at);
        return dt >= lastMonthStart && dt <= lastMonthEnd;
      });
      const lastMonthWonValue = wonLastMonthList.reduce((s, d) => s + (d.value || 0), 0);
      const monthlyGrowth = lastMonthWonValue > 0
        ? Math.round(((wonValueThisMonth - lastMonthWonValue) / lastMonthWonValue) * 100)
        : 0;

      return {
        totalDeals: all.length,
        openDeals: open.length,
        wonDeals: won.length,
        lostDeals: lost.length,
        totalPipelineValue,
        wonValue,
        avgDealValue,
        avgSalesCycleDays,
        conversionRate,
        newDealsThisMonth,
        wonThisMonth,
        wonValueThisMonth,
        lastMonthWonValue,
        monthlyGrowth,
      };
    },
    enabled: !!currentOrganization?.id,
    staleTime: 60_000,
  });
}

export function useSalesRepPerformance() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['crm-admin-reps', currentOrganization?.id],
    queryFn: async (): Promise<SalesRepPerformance[]> => {
      if (!currentOrganization?.id) return [];
      const orgId = currentOrganization.id;

      const { data: members } = await supabase
        .from('organization_members')
        .select('user_id, role')
        .eq('organization_id', orgId);
      if (!members?.length) return [];

      const userIds = members.map(m => m.user_id);
      const [{ data: profiles }, { data: deals }, { data: contacts }, { data: tasks }, { data: activities }, { data: messages }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', userIds),
        supabase.from('deals').select('user_id, value, status, commission_value').eq('organization_id', orgId),
        supabase.from('contacts').select('user_id').eq('organization_id', orgId),
        supabase.from('tasks').select('user_id, status').eq('organization_id', orgId).eq('status', 'completed'),
        supabase.from('activities').select('user_id, type').eq('organization_id', orgId).in('type', ['meeting', 'call']),
        supabase.from('messages').select('user_id').eq('organization_id', orgId),
      ]);

      return members.map(m => {
        const profile = profiles?.find(p => p.user_id === m.user_id);
        const userDeals = (deals || []).filter(d => d.user_id === m.user_id);
        const open = userDeals.filter(d => d.status === 'open' || !d.status);
        const won = userDeals.filter(d => d.status === 'won');
        const lost = userDeals.filter(d => d.status === 'lost');
        const pipelineValue = open.reduce((s, d) => s + (d.value || 0), 0);
        const wonValue = won.reduce((s, d) => s + (d.value || 0), 0);
        const commissionValue = won.reduce((s, d) => s + (Number(d.commission_value) || 0), 0);
        const decided = won.length + lost.length;
        return {
          user_id: m.user_id,
          full_name: profile?.full_name || 'Sem nome',
          avatar_url: profile?.avatar_url || null,
          role: m.role,
          totalDeals: userDeals.length,
          openDeals: open.length,
          wonDeals: won.length,
          lostDeals: lost.length,
          pipelineValue,
          wonValue,
          commissionValue,
          conversionRate: decided > 0 ? Math.round((won.length / decided) * 100) : 0,
          avgDealValue: won.length > 0 ? Math.round(wonValue / won.length) : 0,
          contactsOwned: (contacts || []).filter(c => c.user_id === m.user_id).length,
          tasksCompleted: (tasks || []).filter(t => t.user_id === m.user_id).length,
          meetingsCount: (activities || []).filter(a => a.user_id === m.user_id && a.type === 'meeting').length,
          interactionsCount: (messages || []).filter(msg => msg.user_id === m.user_id).length + 
                           (activities || []).filter(a => a.user_id === m.user_id && a.type === 'call').length,
        };
      }).sort((a, b) => b.wonValue - a.wonValue);
    },
    enabled: !!currentOrganization?.id,
    staleTime: 60_000,
  });
}

export function useDealsByStageAdmin() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['crm-admin-by-stage', currentOrganization?.id],
    queryFn: async (): Promise<DealsByStageAdmin[]> => {
      if (!currentOrganization?.id) return [];
      const orgId = currentOrganization.id;

      const [{ data: stages }, { data: deals }] = await Promise.all([
        supabase.from('pipeline_stages').select('id, name, color, position').order('position'),
        supabase.from('deals').select('stage_id, value, status').eq('organization_id', orgId),
      ]);

      return (stages || []).map(s => {
        const stageDeals = (deals || []).filter(d => d.stage_id === s.id && (d.status === 'open' || !d.status));
        return {
          stage_id: s.id,
          name: s.name,
          color: s.color || '#3b82f6',
          count: stageDeals.length,
          value: stageDeals.reduce((sum, d) => sum + (d.value || 0), 0),
        };
      });
    },
    enabled: !!currentOrganization?.id,
    staleTime: 60_000,
  });
}

export function useDealsBySource() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['crm-admin-by-source', currentOrganization?.id],
    queryFn: async (): Promise<DealsBySource[]> => {
      if (!currentOrganization?.id) return [];
      const orgId = currentOrganization.id;

      const { data: deals } = await supabase
        .from('deals')
        .select('value, contact_id, contacts:contacts(source)')
        .eq('organization_id', orgId);

      const map = new Map<string, { count: number; value: number }>();
      (deals || []).forEach((d: any) => {
        const src = d.contacts?.source || 'desconhecida';
        const cur = map.get(src) || { count: 0, value: 0 };
        cur.count += 1;
        cur.value += d.value || 0;
        map.set(src, cur);
      });

      return Array.from(map.entries())
        .map(([source, v]) => ({ source, count: v.count, value: v.value }))
        .sort((a, b) => b.count - a.count);
    },
    enabled: !!currentOrganization?.id,
    staleTime: 60_000,
  });
}

export function useMonthlyTrend() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['crm-admin-trend', currentOrganization?.id],
    queryFn: async (): Promise<MonthlyTrend[]> => {
      if (!currentOrganization?.id) return [];
      const orgId = currentOrganization.id;

      const { data: deals } = await supabase
        .from('deals')
        .select('value, status, created_at, updated_at')
        .eq('organization_id', orgId);

      const months: MonthlyTrend[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        const created = (deals || []).filter(d => {
          const dt = new Date(d.created_at);
          return dt >= start && dt <= end;
        });
        const wonInMonth = (deals || []).filter(d => {
          if (d.status !== 'won') return false;
          const dt = new Date(d.updated_at);
          return dt >= start && dt <= end;
        });
        months.push({
          month: format(date, 'MMM'),
          created: created.length,
          won: wonInMonth.length,
          wonValue: wonInMonth.reduce((s, d) => s + (d.value || 0), 0),
        });
      }
      return months;
    },
    enabled: !!currentOrganization?.id,
    staleTime: 60_000,
  });
}
