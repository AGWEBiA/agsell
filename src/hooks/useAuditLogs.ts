import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export function useAuditLogs() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const logEvent = useMutation({
    mutationFn: async (params: {
      action: string;
      resourceType: string;
      resourceId?: string;
      details?: any;
    }) => {
      if (!orgId) return;
      const { error } = await supabase.rpc('log_audit_event', {
        _org_id: orgId,
        _action: params.action,
        _resource_type: params.resourceType,
        _resource_id: params.resourceId || null,
        _details: params.details || null,
      });
      if (error) console.error('Audit log error:', error);
    },
  });

  return { logs, isLoading, logEvent };
}
