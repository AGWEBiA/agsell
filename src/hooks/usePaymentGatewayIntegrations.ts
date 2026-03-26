import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export type GatewayType = 'hotmart' | 'kiwify' | 'eduzz' | 'shopify';

export interface GatewayIntegration {
  id: string;
  organization_id: string;
  integration_type: string;
  name: string;
  config: {
    webhook_secret?: string;
    [key: string]: unknown;
  } | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

const GATEWAY_INFO: Record<GatewayType, {
  name: string;
  icon: string;
  description: string;
  webhookPath: string;
  signatureHeader: string;
  docsUrl: string;
  instructions: string[];
}> = {
  hotmart: {
    name: 'Hotmart',
    icon: '🔥',
    description: 'Receba eventos de vendas, reembolsos e cancelamentos da Hotmart',
    webhookPath: 'webhook-hotmart',
    signatureHeader: 'x-hotmart-hottok',
    docsUrl: 'https://developers.hotmart.com/docs/pt-BR/',
    instructions: [
      'Acesse o painel da Hotmart → Ferramentas → Webhooks',
      'Cole a URL do webhook abaixo no campo de URL',
      'Selecione os eventos: Compra aprovada, Reembolso, Cancelamento, Assinatura atrasada',
      '(Opcional) Configure o Hottok para verificação de segurança e cole abaixo',
    ],
  },
  kiwify: {
    name: 'Kiwify',
    icon: '🥝',
    description: 'Receba eventos de vendas, boletos e PIX da Kiwify',
    webhookPath: 'webhook-kiwify',
    signatureHeader: 'x-kiwify-signature',
    docsUrl: 'https://dashboard.kiwify.com.br/',
    instructions: [
      'Acesse o painel da Kiwify → Configurações → Webhooks',
      'Cole a URL do webhook abaixo no campo de URL',
      'Selecione todos os eventos de pedido',
      '(Opcional) Copie o Webhook Secret e cole abaixo para verificação de assinatura',
    ],
  },
  eduzz: {
    name: 'Eduzz',
    icon: '📚',
    description: 'Receba eventos de vendas e transações da Eduzz/Sun',
    webhookPath: 'webhook-eduzz',
    signatureHeader: 'x-eduzz-signature',
    docsUrl: 'https://orbita.eduzz.com/',
    instructions: [
      'Acesse o painel da Eduzz → Integrações → Webhooks',
      'Cole a URL do webhook abaixo no campo de URL',
      'Selecione os eventos de transação desejados',
      '(Opcional) Configure um secret para verificação de assinatura',
    ],
  },
  shopify: {
    name: 'Shopify',
    icon: '🛍️',
    description: 'Receba eventos de pedidos, clientes e checkouts do Shopify',
    webhookPath: 'webhook-shopify',
    signatureHeader: 'x-shopify-hmac-sha256',
    docsUrl: 'https://admin.shopify.com/',
    instructions: [
      'Acesse o admin do Shopify → Configurações → Notificações → Webhooks',
      'Crie um novo webhook e cole a URL abaixo',
      'Selecione os eventos: Pedido criado, Pedido pago, Checkout criado',
      'Copie o Signing Secret e cole abaixo',
    ],
  },
};

export function usePaymentGatewayIntegrations() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const gatewayTypes: GatewayType[] = ['hotmart', 'kiwify', 'eduzz', 'shopify'];

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['gateway-integrations', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
      const { data, error } = await supabase
        .from('organization_integrations')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .in('integration_type', gatewayTypes);
      if (error) throw error;
      return (data || []) as unknown as GatewayIntegration[];
    },
    enabled: !!currentOrganization,
  });

  const getWebhookUrl = (gateway: GatewayType) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const info = GATEWAY_INFO[gateway];
    const orgId = currentOrganization?.id;
    return `${supabaseUrl}/functions/v1/${info.webhookPath}${orgId ? `?org_id=${orgId}` : ''}`;
  };

  const getGatewayIntegration = (gateway: GatewayType) => {
    return integrations.find(i => i.integration_type === gateway);
  };

  const saveIntegration = useMutation({
    mutationFn: async ({ gateway, webhookSecret }: { gateway: GatewayType; webhookSecret?: string }) => {
      if (!currentOrganization) throw new Error('Sem organização');

      const existing = getGatewayIntegration(gateway);
      const config = { webhook_secret: webhookSecret || '' };

      if (existing) {
        const { error } = await supabase
          .from('organization_integrations')
          .update({ config: config as any, is_active: true, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('organization_integrations')
          .insert({
            organization_id: currentOrganization.id,
            integration_type: gateway,
            name: GATEWAY_INFO[gateway].name,
            config: config as any,
            is_active: true,
          });
        if (error) throw error;
      }
    },
    onSuccess: (_, { gateway }) => {
      queryClient.invalidateQueries({ queryKey: ['gateway-integrations'] });
      toast.success(`${GATEWAY_INFO[gateway].name} configurado com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error('Erro ao salvar: ' + error.message);
    },
  });

  const toggleIntegration = useMutation({
    mutationFn: async ({ gateway, isActive }: { gateway: GatewayType; isActive: boolean }) => {
      const existing = getGatewayIntegration(gateway);
      if (!existing) throw new Error('Integração não encontrada');

      const { error } = await supabase
        .from('organization_integrations')
        .update({ is_active: isActive })
        .eq('id', existing.id);
      if (error) throw error;
    },
    onSuccess: (_, { gateway, isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['gateway-integrations'] });
      toast.success(`${GATEWAY_INFO[gateway].name} ${isActive ? 'ativado' : 'desativado'}`);
    },
  });

  const removeIntegration = useMutation({
    mutationFn: async (gateway: GatewayType) => {
      const existing = getGatewayIntegration(gateway);
      if (!existing) throw new Error('Integração não encontrada');

      const { error } = await supabase
        .from('organization_integrations')
        .delete()
        .eq('id', existing.id);
      if (error) throw error;
    },
    onSuccess: (_, gateway) => {
      queryClient.invalidateQueries({ queryKey: ['gateway-integrations'] });
      toast.success(`${GATEWAY_INFO[gateway].name} removido`);
    },
  });

  return {
    integrations,
    isLoading,
    gatewayTypes,
    gatewayInfo: GATEWAY_INFO,
    getWebhookUrl,
    getGatewayIntegration,
    saveIntegration,
    toggleIntegration,
    removeIntegration,
  };
}
