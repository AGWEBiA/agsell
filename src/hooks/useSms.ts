import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface SmsCreditPackage {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  price_per_credit_cents: number;
  is_active: boolean;
  sort_order: number;
}

export interface SmsCredits {
  id: string;
  organization_id: string;
  balance: number;
  total_purchased: number;
  total_used: number;
}

export interface SmsTransaction {
  id: string;
  organization_id: string;
  user_id: string;
  type: string;
  amount: number;
  package_id: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  description: string | null;
  created_at: string;
}

export interface SmsCampaign {
  id: string;
  organization_id: string;
  user_id: string;
  name: string;
  message: string;
  status: string;
  recipient_count: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  click_count: number;
  credits_used: number;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useSms = () => {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const packagesQuery = useQuery({
    queryKey: ['sms-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sms_credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as SmsCreditPackage[];
    },
  });

  const creditsQuery = useQuery({
    queryKey: ['sms-credits', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from('sms_credits')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();
      if (error) throw error;
      return data as SmsCredits | null;
    },
    enabled: !!orgId,
  });

  const transactionsQuery = useQuery({
    queryKey: ['sms-transactions', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('sms_transactions')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as SmsTransaction[];
    },
    enabled: !!orgId,
  });

  const campaignsQuery = useQuery({
    queryKey: ['sms-campaigns', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('sms_campaigns')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as SmsCampaign[];
    },
    enabled: !!orgId,
  });

  const createCampaign = useMutation({
    mutationFn: async (data: { name: string; message: string }) => {
      if (!user || !orgId) throw new Error('Usuário não autenticado');
      const { data: campaign, error } = await supabase
        .from('sms_campaigns')
        .insert({
          organization_id: orgId,
          user_id: user.id,
          name: data.name,
          message: data.message,
          status: 'draft',
        })
        .select()
        .single();
      if (error) throw error;
      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-campaigns'] });
      toast.success('Campanha SMS criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar campanha'),
  });

  return {
    packages: packagesQuery.data ?? [],
    credits: creditsQuery.data,
    transactions: transactionsQuery.data ?? [],
    campaigns: campaignsQuery.data ?? [],
    isLoading: packagesQuery.isLoading || creditsQuery.isLoading,
    createCampaign,
  };
};
