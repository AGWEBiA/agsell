import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SystemIncident {
  id: string;
  title: string;
  description: string | null;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical' | 'maintenance';
  affected_services: string[];
  started_at: string;
  resolved_at: string | null;
  created_at: string;
  updates?: SystemIncidentUpdate[];
}

export interface SystemIncidentUpdate {
  id: string;
  incident_id: string;
  message: string;
  status: string;
  created_at: string;
}

const SERVICES = [
  { name: 'Plataforma Web', key: 'web' },
  { name: 'API', key: 'api' },
  { name: 'WhatsApp', key: 'whatsapp' },
  { name: 'E-mail', key: 'email' },
  { name: 'Automações', key: 'automations' },
  { name: 'Inbox', key: 'inbox' },
  { name: 'Integrações', key: 'integrations' },
  { name: 'Grupos Pagos', key: 'paid_groups' },
];

export function useSystemStatus() {
  const activeIncidentsQuery = useQuery({
    queryKey: ['system-incidents-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_incidents')
        .select('*')
        .neq('status', 'resolved')
        .order('started_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as SystemIncident[];
    },
    refetchInterval: 60000,
  });

  const recentIncidentsQuery = useQuery({
    queryKey: ['system-incidents-recent'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('system_incidents')
        .select('*')
        .gte('started_at', thirtyDaysAgo.toISOString())
        .order('started_at', { ascending: false })
        .limit(20);
      if (error) throw error;

      // Fetch updates for each incident
      const incidents = (data || []) as unknown as SystemIncident[];
      for (const incident of incidents) {
        const { data: updates } = await supabase
          .from('system_incident_updates')
          .select('*')
          .eq('incident_id', incident.id)
          .order('created_at', { ascending: false });
        incident.updates = (updates || []) as unknown as SystemIncidentUpdate[];
      }
      return incidents;
    },
    refetchInterval: 60000,
  });

  const getOverallStatus = () => {
    const active = activeIncidentsQuery.data || [];
    if (active.some(i => i.severity === 'critical')) return 'critical';
    if (active.some(i => i.severity === 'major')) return 'major';
    if (active.some(i => i.severity === 'minor')) return 'minor';
    if (active.some(i => i.severity === 'maintenance')) return 'maintenance';
    return 'operational';
  };

  const getServiceStatus = (serviceKey: string) => {
    const active = activeIncidentsQuery.data || [];
    const affecting = active.filter(i => i.affected_services.includes(serviceKey));
    if (affecting.some(i => i.severity === 'critical')) return 'critical';
    if (affecting.some(i => i.severity === 'major')) return 'major';
    if (affecting.some(i => i.severity === 'minor')) return 'minor';
    if (affecting.some(i => i.severity === 'maintenance')) return 'maintenance';
    return 'operational';
  };

  return {
    activeIncidents: activeIncidentsQuery.data || [],
    recentIncidents: recentIncidentsQuery.data || [],
    isLoading: activeIncidentsQuery.isLoading || recentIncidentsQuery.isLoading,
    overallStatus: getOverallStatus(),
    getServiceStatus,
    services: SERVICES,
  };
}
