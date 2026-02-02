import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, subMonths, format, startOfDay, subDays } from 'date-fns';

export interface AnalyticsOverview {
  totalLeads: number;
  leadsGrowth: number;
  conversionRate: number;
  conversionGrowth: number;
  totalRevenue: number;
  revenueGrowth: number;
  avgLeadScore: number;
  scoreGrowth: number;
}

export interface LeadsOverTime {
  date: string;
  leads: number;
  customers: number;
}

export interface ChannelData {
  name: string;
  value: number;
  color: string;
}

export interface FunnelStage {
  stage: string;
  value: number;
  percentage: number;
}

export interface SalesReport {
  month: string;
  won: number;
  lost: number;
  revenue: number;
}

export interface EmailMetrics {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
}

export function useAnalyticsOverview(days: number = 30) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['analytics-overview', user?.id, days],
    queryFn: async (): Promise<AnalyticsOverview> => {
      const now = new Date();
      const periodStart = subDays(now, days);
      const previousPeriodStart = subDays(periodStart, days);

      // Current period leads
      const { count: currentLeads } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', periodStart.toISOString());

      // Previous period leads
      const { count: previousLeads } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', periodStart.toISOString());

      const leadsGrowth = previousLeads && previousLeads > 0
        ? Math.round(((currentLeads || 0) - previousLeads) / previousLeads * 100 * 10) / 10
        : 0;

      // Conversion rate (deals won / total deals)
      const { count: totalDeals } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true });

      const { count: wonDeals } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'won');

      const conversionRate = totalDeals && totalDeals > 0
        ? Math.round((wonDeals || 0) / totalDeals * 100 * 10) / 10
        : 0;

      // Revenue from won deals
      const { data: revenueData } = await supabase
        .from('deals')
        .select('value')
        .eq('status', 'won');

      const totalRevenue = revenueData?.reduce((sum, d) => sum + (d.value || 0), 0) || 0;

      // Previous period revenue
      const { data: prevRevenueData } = await supabase
        .from('deals')
        .select('value')
        .eq('status', 'won')
        .gte('updated_at', previousPeriodStart.toISOString())
        .lt('updated_at', periodStart.toISOString());

      const prevRevenue = prevRevenueData?.reduce((sum, d) => sum + (d.value || 0), 0) || 0;
      const revenueGrowth = prevRevenue > 0
        ? Math.round((totalRevenue - prevRevenue) / prevRevenue * 100 * 10) / 10
        : 0;

      // Average lead score
      const { data: scores } = await supabase
        .from('contacts')
        .select('lead_score')
        .not('lead_score', 'is', null);

      const avgLeadScore = scores && scores.length > 0
        ? Math.round(scores.reduce((sum, c) => sum + (c.lead_score || 0), 0) / scores.length)
        : 0;

      return {
        totalLeads: currentLeads || 0,
        leadsGrowth,
        conversionRate,
        conversionGrowth: 0,
        totalRevenue,
        revenueGrowth,
        avgLeadScore,
        scoreGrowth: 0,
      };
    },
    enabled: !!user,
    staleTime: 60000,
  });
}

export function useLeadsOverTime(months: number = 7) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['leads-over-time', user?.id, months],
    queryFn: async (): Promise<LeadsOverTime[]> => {
      const result: LeadsOverTime[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);

        const { count: leads } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());

        const { count: customers } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'customer')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());

        result.push({
          date: format(date, 'MMM'),
          leads: leads || 0,
          customers: customers || 0,
        });
      }

      return result;
    },
    enabled: !!user,
    staleTime: 120000,
  });
}

export function useChannelDistribution() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['channel-distribution', user?.id],
    queryFn: async (): Promise<ChannelData[]> => {
      const { data: contacts } = await supabase
        .from('contacts')
        .select('source');

      if (!contacts || contacts.length === 0) return [];

      const counts: Record<string, number> = {};
      contacts.forEach((c) => {
        const source = c.source || 'Desconhecido';
        counts[source] = (counts[source] || 0) + 1;
      });

      const colors: Record<string, string> = {
        'Orgânico': '#22c55e',
        'organic': '#22c55e',
        'Pago': '#3b82f6',
        'paid': '#3b82f6',
        'WhatsApp': '#25d366',
        'whatsapp': '#25d366',
        'Email': '#f59e0b',
        'email': '#f59e0b',
        'Indicação': '#8b5cf6',
        'referral': '#8b5cf6',
        'Desconhecido': '#94a3b8',
      };

      const total = contacts.length;
      return Object.entries(counts)
        .map(([name, count]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value: Math.round((count / total) * 100),
          color: colors[name] || '#94a3b8',
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    },
    enabled: !!user,
    staleTime: 120000,
  });
}

export function useConversionFunnel() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversion-funnel', user?.id],
    queryFn: async (): Promise<FunnelStage[]> => {
      // Get contacts by status
      const { count: totalContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });

      const { count: qualifiedContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'qualified');

      const { count: customerContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'customer');

      // Get deals by stage
      const { count: proposalDeals } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      const { count: wonDeals } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'won');

      const total = totalContacts || 1;
      const stages = [
        { stage: 'Leads', value: totalContacts || 0 },
        { stage: 'Qualificados', value: qualifiedContacts || 0 },
        { stage: 'Propostas', value: proposalDeals || 0 },
        { stage: 'Clientes', value: (customerContacts || 0) + (wonDeals || 0) },
      ];

      return stages.map((s) => ({
        ...s,
        percentage: Math.round((s.value / total) * 100),
      }));
    },
    enabled: !!user,
    staleTime: 60000,
  });
}

export function useSalesReport(months: number = 6) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sales-report', user?.id, months],
    queryFn: async (): Promise<SalesReport[]> => {
      const result: SalesReport[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);

        const { data: wonDeals } = await supabase
          .from('deals')
          .select('value')
          .eq('status', 'won')
          .gte('updated_at', start.toISOString())
          .lte('updated_at', end.toISOString());

        const { count: lostCount } = await supabase
          .from('deals')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'lost')
          .gte('updated_at', start.toISOString())
          .lte('updated_at', end.toISOString());

        result.push({
          month: format(date, 'MMM'),
          won: wonDeals?.length || 0,
          lost: lostCount || 0,
          revenue: wonDeals?.reduce((sum, d) => sum + (d.value || 0), 0) || 0,
        });
      }

      return result;
    },
    enabled: !!user,
    staleTime: 120000,
  });
}

export function useEmailMetrics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['email-metrics', user?.id],
    queryFn: async (): Promise<EmailMetrics> => {
      const { data: campaigns } = await supabase
        .from('email_campaigns')
        .select('sent_count, open_count, click_count')
        .eq('status', 'sent');

      if (!campaigns || campaigns.length === 0) {
        return {
          totalSent: 0,
          totalOpened: 0,
          totalClicked: 0,
          openRate: 0,
          clickRate: 0,
        };
      }

      const totalSent = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);
      const totalOpened = campaigns.reduce((sum, c) => sum + (c.open_count || 0), 0);
      const totalClicked = campaigns.reduce((sum, c) => sum + (c.click_count || 0), 0);

      return {
        totalSent,
        totalOpened,
        totalClicked,
        openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100 * 10) / 10 : 0,
        clickRate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 100 * 10) / 10 : 0,
      };
    },
    enabled: !!user,
    staleTime: 60000,
  });
}
