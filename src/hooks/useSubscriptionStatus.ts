import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export type SubscriptionStatus = 'active' | 'trialing' | 'expired' | 'past_due' | 'no_subscription' | 'loading';

export function useSubscriptionStatus() {
  const { currentOrganization } = useOrganization();

  const query = useQuery({
    queryKey: ['subscription-status', currentOrganization?.id],
    queryFn: async (): Promise<{ status: SubscriptionStatus; isBlocked: boolean; isPastDue: boolean }> => {
      if (!currentOrganization?.id) {
        return { status: 'no_subscription', isBlocked: false, isPastDue: false };
      }

      // Check if org has a plan_id (free plans don't need subscription)
      const { data: org } = await supabase
        .from('organizations')
        .select('plan_id')
        .eq('id', currentOrganization.id)
        .single();

      if (!org?.plan_id) {
        // No plan assigned = free tier, allow access
        return { status: 'no_subscription', isBlocked: false, isPastDue: false };
      }

      // Check if plan is free (default)
      const { data: plan } = await supabase
        .from('plans')
        .select('is_default, price_monthly')
        .eq('id', org.plan_id)
        .single();

      if (plan?.is_default || (plan?.price_monthly ?? 0) === 0) {
        // Free plan, no subscription needed
        return { status: 'active', isBlocked: false, isPastDue: false };
      }

      // Paid plan - check subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, current_period_end, cancel_at_period_end')
        .eq('organization_id', currentOrganization.id)
        .maybeSingle();

      if (!subscription) {
        // Paid plan but no subscription record = blocked
        return { status: 'expired', isBlocked: true, isPastDue: false };
      }

      const isPastDue = subscription.status === 'past_due';
      const isActive = ['active', 'trialing'].includes(subscription.status);
      const isExpired = subscription.current_period_end
        ? new Date(subscription.current_period_end) < new Date()
        : false;

      if (isPastDue) {
        return { status: 'past_due' as SubscriptionStatus, isBlocked: false, isPastDue: true };
      }

      if (!isActive || isExpired) {
        return { status: 'expired', isBlocked: true, isPastDue: false };
      }

      return { status: subscription.status as SubscriptionStatus, isBlocked: false, isPastDue: false };
    },
    enabled: !!currentOrganization?.id,
    refetchInterval: 5 * 60 * 1000, // Re-check every 5 minutes
    staleTime: 60 * 1000,
  });

  return {
    status: query.data?.status ?? 'loading',
    isBlocked: query.data?.isBlocked ?? false,
    isPastDue: query.data?.isPastDue ?? false,
    isLoading: query.isLoading,
  };
}
