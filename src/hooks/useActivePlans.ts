import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  max_ai_requests_per_month: number;
  features: string[];
  kiwify_checkout_url?: string | null;
  is_active: boolean;
}

export function useActivePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('plans_public' as any)
          .select('*')
          .eq('is_active', true)
          .order('price_monthly', { ascending: true });

        if (error) {
          console.error('Error fetching plans:', error);
          toast.error('Erro ao carregar planos');
        } else if (data) {
          // Double filter to ensure only active plans are shown even if RLS/View allows others
          const activePlans = (data as any[])
            .filter((p) => p.is_active === true)
            .map((p) => ({
              ...p,
              features: Array.isArray(p.features) ? p.features : [],
              price_monthly: p.price_monthly || 0,
              price_yearly: p.price_yearly || 0,
              max_users: p.max_users || 0,
              max_contacts: p.max_contacts || 0,
              max_emails_per_month: p.max_emails_per_month || 0,
              max_whatsapp_messages: p.max_whatsapp_messages || 0,
              max_automations: p.max_automations || 0,
              max_forms: p.max_forms || 0,
              max_ai_requests_per_month: p.max_ai_requests_per_month || 0,
            }));
          setPlans(activePlans);
        }
      } catch (err) {
        console.error('Unexpected error fetching plans:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  return { plans, isLoading };
}
