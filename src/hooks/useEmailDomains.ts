import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePlans } from '@/hooks/usePlans';
import { toast } from 'sonner';

export function useEmailDomains() {
  const { currentOrganization } = useOrganization();
  const { checkPlanLimit } = usePlans();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const { data: domains = [], isLoading } = useQuery({
    queryKey: ['email_domains', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('email_domains' as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const addDomain = useMutation({
    mutationFn: async ({ domain, from_email, from_name }: { domain: string; from_email?: string; from_name?: string }) => {
      const currentOrgId = currentOrganization?.id;
      if (!currentOrgId) throw new Error('Organização não selecionada. Selecione uma organização antes de continuar.');

      // Check domain limit before adding
      const currentDomainCount = domains.length;
      const limitCheck = await checkPlanLimit('email_domains', currentDomainCount);
      if (!limitCheck.allowed) {
        throw new Error(`Limite de domínios atingido (${limitCheck.current}/${limitCheck.limit}). Faça upgrade do seu plano para adicionar mais domínios.`);
      }

      const { data, error } = await supabase
        .from('email_domains' as any)
        .insert({
          organization_id: currentOrgId,
          domain,
          from_email: from_email || `noreply@${domain}`,
          from_name: from_name || '',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['email_domains', orgId] });
      toast.success('Domínio adicionado! Registrando no provedor...');
      // Delay the auto-verification to avoid Resend rate limits
      if (data?.id) {
        setTimeout(() => {
          verifyDomain.mutate(data.id);
        }, 2000);
      }
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate key')) {
        toast.error('Este domínio já está cadastrado.');
      } else {
        toast.error('Erro ao adicionar domínio: ' + error.message);
      }
    },
  });

  const verifyDomain = useMutation({
    mutationFn: async (domainId: string) => {
      const { data, error } = await supabase.functions.invoke('verify-email-domain', {
        body: { domain_id: domainId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email_domains', orgId] });
      
      const dnsMissing: string[] = [];
      if (!data.spf_verified) dnsMissing.push('SPF');
      if (!data.dkim_verified) dnsMissing.push('DKIM');
      if (!data.dmarc_verified) dnsMissing.push('DMARC');
      if (!data.mx_verified) dnsMissing.push('MX');
      
      const providerPending = data.resend_status && data.resend_status !== 'verified' && data.resend_status !== 'not_started';
      
      if (data.status === 'verified') {
        toast.success('Domínio verificado com sucesso! Todos os registros DNS estão corretos.');
      } else if (dnsMissing.length === 0 && providerPending) {
        // All DNS OK but provider still processing
        toast.info('Registros DNS configurados corretamente! O provedor de e-mail ainda está processando a verificação. Tente novamente em alguns minutos.', { 
          duration: 10000,
        });
      } else {
        const details: string[] = [];
        if (!data.spf_verified) details.push('⚠️ SPF: Adicione registro TXT com "v=spf1 include:resend.com ~all"');
        if (!data.dkim_verified) details.push('⚠️ DKIM: Adicione o registro CNAME do DKIM fornecido pelo provedor');
        if (!data.dmarc_verified) details.push('⚠️ DMARC: Adicione registro TXT "_dmarc" com "v=DMARC1; p=quarantine"');
        if (!data.mx_verified) details.push('⚠️ MX: Configure registros MX para recebimento de e-mails');
        if (providerPending) details.push('⏳ Provedor: Aguardando confirmação (pode levar alguns minutos)');
        
        toast.warning(`Verificação incompleta. Registros pendentes: ${dnsMissing.join(', ')}`, { 
          duration: 10000,
          description: details.join('\n'),
        });
      }
    },
    onError: (error: any) => {
      toast.error('Erro na verificação: ' + error.message);
    },
  });

  const deleteDomain = useMutation({
    mutationFn: async (domainId: string) => {
      const { error } = await supabase
        .from('email_domains' as any)
        .delete()
        .eq('id', domainId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_domains', orgId] });
      toast.success('Domínio removido.');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover domínio: ' + error.message);
    },
  });

  return {
    domains,
    isLoading,
    addDomain,
    verifyDomain,
    deleteDomain,
  };
}
