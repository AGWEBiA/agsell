import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';

/**
 * Hook to fire automation triggers when CRM events occur.
 * Usage: call `fireEvent('contact_created', contactId)` after creating a contact.
 */
export function useAutomationTrigger() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  const fireEvent = useCallback(
    async (triggerEvent: string, contactId?: string) => {
      if (!user?.id || !currentOrganization?.id) return;

      try {
        // Find active automations matching this trigger
        const { data: automations } = await supabase
          .from('automations')
          .select('id')
          .eq('organization_id', currentOrganization.id)
          .eq('trigger_type', triggerEvent)
          .eq('is_active', true);

        if (!automations?.length) return;

        // Fire each matching automation
        await Promise.allSettled(
          automations.map((auto) =>
            supabase.functions.invoke('process-automation', {
              body: {
                automation_id: auto.id,
                contact_id: contactId ?? null,
                trigger_event: triggerEvent,
              },
            })
          )
        );
      } catch (err) {
        console.error('Automation trigger error:', err);
      }
    },
    [user?.id, currentOrganization?.id]
  );

  return { fireEvent };
}
