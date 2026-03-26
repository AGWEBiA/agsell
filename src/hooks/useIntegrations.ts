import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error';

export type Integration = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'analytics' | 'crm';
  status: IntegrationStatus;
  configFields: { key: string; label: string; type: string; placeholder: string; required?: boolean }[];
  config?: Record<string, string>;
};

const defaultIntegrations: Integration[] = [
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

    await new Promise((resolve) => setTimeout(resolve, 1500));
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
