import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { differenceInMinutes, subDays, format, startOfDay } from 'date-fns';

export interface InboxKPIs {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgFirstResponseMin: number | null;
  avgResolutionMin: number | null;
  csatAvg: number | null;
  csatTotal: number;
  ticketsByChannel: { channel: string; count: number }[];
  ticketsByPriority: { priority: string; count: number }[];
  ticketsPerDay: { date: string; count: number }[];
  agentPerformance: { agent_id: string; name: string; assigned: number; resolved: number; avgResponseMin: number | null }[];
}

export function useInboxReports(days: number = 30) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['inbox-reports', currentOrganization?.id, days],
    queryFn: async (): Promise<InboxKPIs> => {
      const orgId = currentOrganization?.id;
      if (!orgId) throw new Error('No org');

      const since = subDays(new Date(), days).toISOString();

      // All conversations in period
      const { data: convos } = await supabase
        .from('conversations')
        .select('id, channel, status, priority, created_at, first_response_at, resolved_at, assigned_to')
        .eq('organization_id', orgId)
        .gte('created_at', since);

      const all = convos || [];

      const totalTickets = all.length;
      const openTickets = all.filter(c => c.status === 'open' || c.status === 'pending').length;
      const resolvedTickets = all.filter(c => c.status === 'resolved').length;

      // Avg first response time
      const withResponse = all.filter(c => c.first_response_at && c.created_at);
      const avgFirstResponseMin = withResponse.length > 0
        ? Math.round(withResponse.reduce((sum, c) => sum + differenceInMinutes(new Date(c.first_response_at!), new Date(c.created_at)), 0) / withResponse.length)
        : null;

      // Avg resolution time
      const withResolution = all.filter(c => c.resolved_at && c.created_at);
      const avgResolutionMin = withResolution.length > 0
        ? Math.round(withResolution.reduce((sum, c) => sum + differenceInMinutes(new Date(c.resolved_at!), new Date(c.created_at)), 0) / withResolution.length)
        : null;

      // CSAT
      const { data: csatData } = await supabase
        .from('csat_responses')
        .select('rating')
        .eq('organization_id', orgId)
        .gte('created_at', since);

      const csatTotal = csatData?.length || 0;
      const csatAvg = csatTotal > 0
        ? Math.round((csatData!.reduce((s, r) => s + r.rating, 0) / csatTotal) * 10) / 10
        : null;

      // By channel
      const channelMap: Record<string, number> = {};
      all.forEach(c => { channelMap[c.channel] = (channelMap[c.channel] || 0) + 1; });
      const ticketsByChannel = Object.entries(channelMap).map(([channel, count]) => ({ channel, count })).sort((a, b) => b.count - a.count);

      // By priority
      const prioMap: Record<string, number> = {};
      all.forEach(c => { prioMap[c.priority || 'medium'] = (prioMap[c.priority || 'medium'] || 0) + 1; });
      const ticketsByPriority = Object.entries(prioMap).map(([priority, count]) => ({ priority, count }));

      // Per day
      const dayMap: Record<string, number> = {};
      all.forEach(c => {
        const d = format(new Date(c.created_at), 'yyyy-MM-dd');
        dayMap[d] = (dayMap[d] || 0) + 1;
      });
      const ticketsPerDay = Object.entries(dayMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Agent performance
      const agentMap: Record<string, { assigned: number; resolved: number; responseTimes: number[] }> = {};
      all.forEach(c => {
        const aid = c.assigned_to;
        if (!aid) return;
        if (!agentMap[aid]) agentMap[aid] = { assigned: 0, resolved: 0, responseTimes: [] };
        agentMap[aid].assigned++;
        if (c.status === 'resolved') agentMap[aid].resolved++;
        if (c.first_response_at && c.created_at) {
          agentMap[aid].responseTimes.push(differenceInMinutes(new Date(c.first_response_at), new Date(c.created_at)));
        }
      });

      // Get agent names from org members
      const agentIds = Object.keys(agentMap);
      let agentNames: Record<string, string> = {};
      if (agentIds.length > 0) {
        const { data: members } = await supabase
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', orgId)
          .in('user_id', agentIds);
        // We don't have profile names easily, use IDs as fallback
        agentIds.forEach(id => { agentNames[id] = `Atendente ${id.slice(0, 6)}`; });
      }

      const agentPerformance = Object.entries(agentMap).map(([agent_id, data]) => ({
        agent_id,
        name: agentNames[agent_id] || agent_id.slice(0, 8),
        assigned: data.assigned,
        resolved: data.resolved,
        avgResponseMin: data.responseTimes.length > 0
          ? Math.round(data.responseTimes.reduce((s, v) => s + v, 0) / data.responseTimes.length)
          : null,
      }));

      return {
        totalTickets, openTickets, resolvedTickets,
        avgFirstResponseMin, avgResolutionMin,
        csatAvg, csatTotal,
        ticketsByChannel, ticketsByPriority, ticketsPerDay,
        agentPerformance,
      };
    },
    enabled: !!user && !!currentOrganization?.id,
    staleTime: 60000,
  });
}
