import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAdminView } from '@/contexts/AdminViewContext';
import { toast } from 'sonner';

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_contacts: number;
  max_emails_per_month: number;
  max_whatsapp_messages: number;
  max_automations: number;
  max_forms: number;
  max_instagram_accounts: number;
  max_ai_requests_per_month: number;
  max_email_domains: number;
  features: string[];
  is_active: boolean;
  is_default: boolean;
}

export interface Subscription {
  id: string;
  organization_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  plan?: Plan;
}

export interface PlanLimitCheck {
  allowed: boolean;
  limit: number;
  current: number;
  remaining?: number;
  message?: string;
}

export function usePlans() {
  const { currentOrganization } = useOrganization();
  const { simulatedPlan } = useAdminView();
  const queryClient = useQueryClient();

  // Fetch all active plans
  const plansQuery = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      return data as Plan[];
    },
  });

  // Fetch current organization's subscription
  const subscriptionQuery = useQuery({
    queryKey: ['subscription', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plan:plans(*)')
        .eq('organization_id', currentOrganization.id)
        .maybeSingle();

      if (error) throw error;
      return data as (Subscription & { plan: Plan }) | null;
    },
    enabled: !!currentOrganization?.id,
  });

  // Get current plan (from subscription or organization's plan_id)
  const currentPlanQuery = useQuery({
    queryKey: ['currentPlan', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return null;

      // First check subscription
      if (subscriptionQuery.data?.plan) {
        return subscriptionQuery.data.plan;
      }

      // Fallback to organization's plan_id
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('plan_id')
        .eq('id', currentOrganization.id)
        .single();

      if (orgError || !org?.plan_id) {
        // Return default free plan
        const { data: freePlan } = await supabase
          .from('plans')
          .select('*')
          .eq('is_default', true)
          .single();
        return freePlan as Plan | null;
      }

      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', org.plan_id)
        .single();

      if (planError) throw planError;
      return plan as Plan;
    },
    enabled: !!currentOrganization?.id,
  });

  // Check plan limit
  const checkPlanLimit = async (resource: 'users' | 'contacts' | 'emails' | 'whatsapp' | 'automations' | 'forms' | 'ai_requests' | 'email_domains', currentCount?: number): Promise<PlanLimitCheck> => {
    if (!currentOrganization?.id) {
      return { allowed: true, limit: -1, current: 0, message: 'No organization' };
    }

    const { data, error } = await supabase.rpc('check_plan_limit', {
      _org_id: currentOrganization.id,
      _resource: resource,
      _current_count: currentCount ?? null,
    });

    if (error) {
      console.error('Error checking plan limit:', error);
      return { allowed: true, limit: -1, current: 0, message: error.message };
    }

    return data as unknown as PlanLimitCheck;
  };

  // Update organization's plan
  const updatePlan = useMutation({
    mutationFn: async (planId: string) => {
      if (!currentOrganization?.id) throw new Error('No organization');

      const { error } = await supabase
        .from('organizations')
        .update({ plan_id: planId })
        .eq('id', currentOrganization.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentPlan'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success('Plano atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar plano: ' + error.message);
    },
  });

  // If simulating a plan, override the current plan
  const effectivePlan = simulatedPlan ?? currentPlanQuery.data;

  return {
    plans: plansQuery.data ?? [],
    subscription: subscriptionQuery.data,
    currentPlan: effectivePlan,
    isLoading: plansQuery.isLoading || currentPlanQuery.isLoading,
    checkPlanLimit,
    updatePlan,
  };
}

// Hook for checking if a feature is available in current plan
export function usePlanFeature(feature: string) {
  const { currentPlan, isLoading } = usePlans();

  const hasFeature = currentPlan?.features?.includes(feature) ?? false;

  return { hasFeature, isLoading };
}
