import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export function useEmailDomains() {
  const { currentOrganization } = useOrganization();
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

      const dnsRecords = [
        {
          type: 'TXT',
          name: domain,
          value: `v=spf1 include:amazonses.com include:resend.com ~all`,
          purpose: 'SPF',
          description: 'Autoriza o provedor de e-mail a enviar em nome do seu domínio',
        },
        {
          type: 'CNAME',
          name: `default._domainkey.${domain}`,
          value: `default._domainkey.${domain}.d.{provider}`,
          purpose: 'DKIM',
          description: 'Assinatura digital para autenticar e-mails enviados',
        },
        {
          type: 'TXT',
          name: `_dmarc.${domain}`,
          value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}; pct=100`,
          purpose: 'DMARC',
          description: 'Política de autenticação e relatórios de e-mail',
        },
      ];

      const { data, error } = await supabase
        .from('email_domains' as any)
        .insert({
          organization_id: currentOrgId,
          domain,
          from_email: from_email || `noreply@${domain}`,
          from_name: from_name || '',
          dns_records: dnsRecords,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_domains', orgId] });
      toast.success('Domínio adicionado! Configure os registros DNS para verificação.');
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
      if (data.status === 'verified') {
        toast.success('Domínio verificado com sucesso!');
      } else {
        toast.info('Verificação realizada. Alguns registros ainda estão pendentes.');
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
