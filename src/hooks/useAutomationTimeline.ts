import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AutomationTimelineEntry {
  id: string;
  automation_id: string;
  execution_id: string | null;
  contact_id: string | null;
  node_id: string | null;
  node_label: string | null;
  action_type: string;
  status: string;
  details: Record<string, unknown>;
  created_at: string;
}

export function useAutomationTimeline(contactId?: string) {
  return useQuery({
    queryKey: ['automation_timeline', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_contact_timeline')
        .select('*, automations(name)')
        .eq('contact_id', contactId!)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as (AutomationTimelineEntry & { automations: { name: string } | null })[];
    },
    enabled: !!contactId,
  });
}

export function useAutomationExecutionTimeline(automationId?: string) {
  return useQuery({
    queryKey: ['automation_execution_timeline', automationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_contact_timeline')
        .select('*, contacts(first_name, last_name)')
        .eq('automation_id', automationId!)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!automationId,
  });
}
