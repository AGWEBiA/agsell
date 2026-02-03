import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error';

export type Integration = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'email' | 'payment' | 'infoproduct' | 'analytics' | 'crm' | 'messaging';
  status: IntegrationStatus;
  configFields: { key: string; label: string; type: string; placeholder: string; required?: boolean }[];
  config?: Record<string, string>;
};

const defaultIntegrations: Integration[] = [
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Envio de emails transacionais e marketing',
    icon: '📧',
    category: 'email',
    status: 'disconnected',
    configFields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'SG.xxxx...', required: true },
      { key: 'from_email', label: 'Email de Envio', type: 'email', placeholder: 'noreply@seudominio.com', required: true },
      { key: 'from_name', label: 'Nome do Remetente', type: 'text', placeholder: 'Sua Empresa' },
    ],
  },
  {
    id: 'resend',
    name: 'Resend',
    description: 'Email API moderna para desenvolvedores',
    icon: '✉️',
    category: 'email',
    status: 'disconnected',
    configFields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 're_xxxx...', required: true },
      { key: 'from_email', label: 'Email de Envio', type: 'email', placeholder: 'noreply@seudominio.com', required: true },
    ],
  },
  {
    id: 'amazon_ses',
    name: 'Amazon SES',
    description: 'Serviço de e-mail escalável da AWS',
    icon: '📨',
    category: 'email',
    status: 'disconnected',
    configFields: [
      { key: 'access_key_id', label: 'Access Key ID', type: 'password', placeholder: 'AKIAXXXXXXXX...', required: true },
      { key: 'secret_access_key', label: 'Secret Access Key', type: 'password', placeholder: 'Sua Secret Key', required: true },
      { key: 'region', label: 'Região AWS', type: 'text', placeholder: 'us-east-1', required: true },
      { key: 'from_email', label: 'Email de Envio (verificado)', type: 'email', placeholder: 'noreply@seudominio.com', required: true },
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Pagamentos e assinaturas recorrentes',
    icon: '💳',
    category: 'payment',
    status: 'disconnected',
    configFields: [
      { key: 'secret_key', label: 'Secret Key', type: 'password', placeholder: 'sk_live_xxxx...', required: true },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_xxxx...' },
      { key: 'publishable_key', label: 'Publishable Key', type: 'text', placeholder: 'pk_live_xxxx...' },
    ],
  },
  {
    id: 'hotmart',
    name: 'Hotmart',
    description: 'Plataforma de infoprodutos',
    icon: '🔥',
    category: 'infoproduct',
    status: 'disconnected',
    configFields: [
      { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'Seu Client ID', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'Seu Client Secret', required: true },
      { key: 'hottok', label: 'Hottok (Webhook)', type: 'password', placeholder: 'Token do Webhook' },
    ],
  },
  {
    id: 'kiwify',
    name: 'Kiwify',
    description: 'Vendas de produtos digitais',
    icon: '🥝',
    category: 'infoproduct',
    status: 'disconnected',
    configFields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Sua API Key', required: true },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', placeholder: 'Secret do Webhook' },
    ],
  },
  {
    id: 'eduzz',
    name: 'Eduzz',
    description: 'Plataforma de cursos e produtos digitais',
    icon: '📚',
    category: 'infoproduct',
    status: 'disconnected',
    configFields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Sua API Key', required: true },
      { key: 'public_key', label: 'Public Key', type: 'text', placeholder: 'Sua Public Key' },
    ],
  },
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    description: 'Análise de tráfego e comportamento',
    icon: '📊',
    category: 'analytics',
    status: 'disconnected',
    configFields: [
      { key: 'measurement_id', label: 'Measurement ID', type: 'text', placeholder: 'G-XXXXXXXXXX', required: true },
    ],
  },
  {
    id: 'meta_pixel',
    name: 'Meta Pixel',
    description: 'Rastreamento de conversões Facebook/Instagram',
    icon: '📈',
    category: 'analytics',
    status: 'disconnected',
    configFields: [
      { key: 'pixel_id', label: 'Pixel ID', type: 'text', placeholder: 'Seu Pixel ID', required: true },
      { key: 'access_token', label: 'Access Token (CAPI)', type: 'password', placeholder: 'Token para Conversions API' },
    ],
  },
  {
    id: 'whatsapp_evolution',
    name: 'Evolution API',
    description: 'API não-oficial para WhatsApp',
    icon: '💬',
    category: 'messaging',
    status: 'disconnected',
    configFields: [
      { key: 'api_url', label: 'URL da API', type: 'text', placeholder: 'https://api.evolution.com', required: true },
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Sua API Key', required: true },
      { key: 'instance_name', label: 'Nome da Instância', type: 'text', placeholder: 'minha-instancia' },
    ],
  },
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Automação de workflows',
    icon: '🔗',
    category: 'crm',
    status: 'disconnected',
    configFields: [
      { key: 'webhook_url', label: 'Webhook URL', type: 'text', placeholder: 'https://n8n.example.com/webhook/xxx', required: true },
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Sua API Key' },
    ],
  },
];

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>(defaultIntegrations);

  const connectIntegration = useCallback(async (integrationId: string, config: Record<string, string>) => {
    // Validate required fields
    const integration = integrations.find((i) => i.id === integrationId);
    if (!integration) {
      toast.error('Integração não encontrada');
      return false;
    }

    const missingFields = integration.configFields
      .filter((f) => f.required && !config[f.key]?.trim())
      .map((f) => f.label);

    if (missingFields.length > 0) {
      toast.error(`Campos obrigatórios: ${missingFields.join(', ')}`);
      return false;
    }

    // Simulate API validation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Update integration status
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === integrationId
          ? { ...i, status: 'connected' as IntegrationStatus, config }
          : i
      )
    );

    toast.success(`${integration.name} conectado com sucesso!`);
    return true;
  }, [integrations]);

  const disconnectIntegration = useCallback((integrationId: string) => {
    const integration = integrations.find((i) => i.id === integrationId);
    if (!integration) return;

    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === integrationId
          ? { ...i, status: 'disconnected' as IntegrationStatus, config: undefined }
          : i
      )
    );

    toast.success(`${integration.name} desconectado`);
  }, [integrations]);

  const testIntegration = useCallback(async (integrationId: string) => {
    const integration = integrations.find((i) => i.id === integrationId);
    if (!integration || integration.status !== 'connected') {
      toast.error('Integração não conectada');
      return false;
    }

    // Simulate API test
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // 80% chance of success
    const success = Math.random() > 0.2;

    if (success) {
      toast.success(`Conexão com ${integration.name} testada com sucesso!`);
    } else {
      toast.error(`Falha ao testar ${integration.name}. Verifique as credenciais.`);
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === integrationId ? { ...i, status: 'error' as IntegrationStatus } : i
        )
      );
    }

    return success;
  }, [integrations]);

  const getIntegrationsByCategory = useCallback((category: string) => {
    return integrations.filter((i) => i.category === category);
  }, [integrations]);

  const getConnectedIntegrations = useCallback(() => {
    return integrations.filter((i) => i.status === 'connected');
  }, [integrations]);

  return {
    integrations,
    connectIntegration,
    disconnectIntegration,
    testIntegration,
    getIntegrationsByCategory,
    getConnectedIntegrations,
  };
}
