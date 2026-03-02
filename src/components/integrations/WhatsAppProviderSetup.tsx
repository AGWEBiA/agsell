import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  ExternalLink,
  Lock,
  Plus,
  RefreshCw,
  Settings,
  Star,
  Trash2,
  Zap,
  MessageSquare,
  Shield,
  Server,
  Smartphone,
  QrCode,
  AlertTriangle,
} from 'lucide-react';
import { useWhatsAppInstances, WhatsAppInstance } from '@/hooks/useWhatsAppInstances';
import { usePlans } from '@/hooks/usePlans';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EvolutionAPIConfig {
  api_url: string;
  api_key: string;
  is_configured: boolean;
}

interface WhatsAppBusinessConfig {
  access_token: string;
  phone_number_id: string;
  business_account_id: string;
  webhook_verify_token: string;
  phone_number: string;
}

export function WhatsAppProviderSetup() {
  const { 
    instances, 
    activeInstances,
    defaultInstance,
    createInstance, 
    deleteInstance, 
    toggleInstance, 
    setDefaultInstance,
    isLoading 
  } = useWhatsAppInstances();
  const { currentPlan, isLoading: plansLoading } = usePlans();
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('evolution');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [instanceName, setInstanceName] = useState('');
  const [evolutionInstanceName, setEvolutionInstanceName] = useState('');
  const [evolutionPhone, setEvolutionPhone] = useState('');
  
  // QR Code states
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [qrPairingCode, setQrPairingCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrStatus, setQrStatus] = useState<'idle' | 'waiting' | 'connected' | 'error'>('idle');
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrInstanceName, setQrInstanceName] = useState('');
  const [qrOrgId, setQrOrgId] = useState('');
  const statusPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stop polling on unmount or dialog close
  useEffect(() => {
    return () => {
      if (statusPollRef.current) clearInterval(statusPollRef.current);
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (statusPollRef.current) {
      clearInterval(statusPollRef.current);
      statusPollRef.current = null;
    }
  }, []);

  const fetchQRCode = useCallback(async (instName: string, orgId: string, action: 'create' | 'connect' = 'connect') => {
    setQrLoading(true);
    setQrError(null);
    setQrCodeBase64(null);
    setQrPairingCode(null);
    setQrStatus('waiting');
    stopPolling();

    try {
      const { data, error } = await supabase.functions.invoke('evolution-qrcode', {
        body: {
          instance_name: instName,
          organization_id: orgId,
          action,
        },
      });

      if (error) throw error;

      if (!data?.success) {
        setQrError(data?.error || 'Erro ao obter QR Code');
        setQrStatus('error');
        return;
      }

      if (data.action === 'connected') {
        setQrStatus('connected');
        toast.success('Instância já está conectada!');
        return;
      }

      if (data.qrcode) {
        // base64 QR from Evolution API
        const base64 = data.qrcode.startsWith('data:') ? data.qrcode : `data:image/png;base64,${data.qrcode}`;
        setQrCodeBase64(base64);
      }
      if (data.pairingCode) {
        setQrPairingCode(data.pairingCode);
      }
      if (data.code) {
        // raw QR code string — we'd need a QR renderer, but base64 is preferred
        if (!data.qrcode) {
          setQrError('QR code retornado em formato de texto. Atualize a Evolution API para versão mais recente.');
          setQrStatus('error');
          return;
        }
      }

      // Start polling for connection status
      statusPollRef.current = setInterval(async () => {
        try {
          const { data: statusData } = await supabase.functions.invoke('evolution-qrcode', {
            body: {
              instance_name: instName,
              organization_id: orgId,
              action: 'status',
            },
          });

          if (statusData?.data?.instance?.state === 'open') {
            setQrStatus('connected');
            stopPolling();
            toast.success('WhatsApp conectado com sucesso!');
          }
        } catch {
          // ignore polling errors
        }
      }, 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setQrError(msg);
      setQrStatus('error');
    } finally {
      setQrLoading(false);
    }
  }, [stopPolling]);

  const handleCloseQRDialog = useCallback(() => {
    stopPolling();
    setShowQRDialog(false);
    setQrCodeBase64(null);
    setQrPairingCode(null);
    setQrStatus('idle');
    setQrError(null);
    setQrInstanceName('');
    setQrOrgId('');
  }, [stopPolling]);

  // Fetch global Evolution API config
  const { data: globalEvolutionConfig } = useQuery({
    queryKey: ['platform_settings', 'evolution_api'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'evolution_api')
        .maybeSingle();
      if (error) throw error;
      return data?.value as unknown as EvolutionAPIConfig | null;
    },
  });

  const isEvolutionGlobalConfigured = globalEvolutionConfig?.is_configured === true;

  // Check if plan includes WhatsApp feature
  const hasWhatsAppFeature = currentPlan?.features?.includes('whatsapp') || 
                             currentPlan?.slug === 'professional' || 
                             currentPlan?.slug === 'enterprise' ||
                             (currentPlan?.max_whatsapp_messages ?? 0) > 0;

  // WhatsApp Business Config
  const [businessConfig, setBusinessConfig] = useState<WhatsAppBusinessConfig>({
    access_token: '',
    phone_number_id: '',
    business_account_id: '',
    webhook_verify_token: '',
    phone_number: '',
  });

  // Get existing integrations by type
  const evolutionInstances = instances.filter(i => i.integration_type === 'evolution_api');
  const businessInstances = instances.filter(i => i.integration_type === 'whatsapp_business');

  // If plan doesn't include WhatsApp, show upgrade prompt
  if (!plansLoading && !hasWhatsAppFeature) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Recurso Exclusivo</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            A integração com WhatsApp está disponível apenas nos planos pagos. 
            Faça upgrade para enviar mensagens e campanhas pelo WhatsApp.
          </p>
          <Button onClick={() => navigate('/plans')}>
            Ver Planos
          </Button>
        </CardContent>
      </Card>
    );
  }

  const resetForm = () => {
    setBusinessConfig({ access_token: '', phone_number_id: '', business_account_id: '', webhook_verify_token: '', phone_number: '' });
    setInstanceName('');
    setEvolutionInstanceName('');
    setEvolutionPhone('');
    setIsDefault(false);
  };

  // Simplified Evolution save — only needs instance name (global config provides URL + key)
  const handleSaveEvolution = async () => {
    if (!evolutionInstanceName) {
      toast.error('Informe o nome da instância na Evolution API');
      return;
    }
    if (!instanceName) {
      toast.error('Digite um nome para identificar esta instância');
      return;
    }

    setIsSaving(true);
    try {
      await createInstance.mutateAsync({
        name: instanceName,
        integration_type: 'evolution_api',
        config: {
          instance_name: evolutionInstanceName,
          phone_number: evolutionPhone,
        } as Record<string, string>,
        phone_number: evolutionPhone || evolutionInstanceName,
        is_default: isDefault || instances.length === 0,
      });
      setIsDialogOpen(false);
      resetForm();

      // Open QR dialog to create/connect the instance
      setQrInstanceName(evolutionInstanceName);
      const orgId = currentOrganization?.id || '';
      setQrOrgId(orgId);
      setShowQRDialog(true);
      await fetchQRCode(evolutionInstanceName, orgId, 'create');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!businessConfig.access_token || !businessConfig.phone_number_id) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    if (!instanceName) {
      toast.error('Digite um nome para identificar esta instância');
      return;
    }

    setIsSaving(true);
    try {
      await createInstance.mutateAsync({
        name: instanceName,
        integration_type: 'whatsapp_business',
        config: { ...businessConfig } as Record<string, string>,
        phone_number: businessConfig.phone_number || businessConfig.phone_number_id,
        is_default: isDefault || instances.length === 0,
      });
      setIsDialogOpen(false);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEvolution = async (instance: WhatsAppInstance) => {
    const instanceNameEvo = instance.config.instance_name;
    if (!instanceNameEvo) {
      toast.error('Nome da instância não configurado');
      return;
    }

    setIsTesting(instance.id);
    try {
      const { data, error } = await supabase.functions.invoke('evolution-qrcode', {
        body: {
          instance_name: instanceNameEvo,
          organization_id: instance.organization_id || '',
          action: 'status',
        },
      });

      if (error) throw error;

      if (data?.data?.instance?.state === 'open') {
        toast.success('Conexão ativa! WhatsApp conectado.');
      } else {
        toast.warning(`Status: ${data?.data?.instance?.state || 'desconectado'}. Escaneie o QR Code.`);
      }
    } catch {
      toast.error('Não foi possível verificar o status.');
    } finally {
      setIsTesting(null);
    }
  };

  const handleConnectQR = (instance: WhatsAppInstance) => {
    const instName = instance.config.instance_name;
    if (!instName) {
      toast.error('Nome da instância não configurado');
      return;
    }
    setQrInstanceName(instName);
    setQrOrgId(instance.organization_id || '');
    setShowQRDialog(true);
    fetchQRCode(instName, instance.organization_id || '', 'connect');
  };

  const handleTestBusiness = async (instance: WhatsAppInstance) => {
    const config = instance.config;
    if (!config.access_token || !config.phone_number_id) {
      toast.error('Configuração incompleta');
      return;
    }

    setIsTesting(instance.id);
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${config.phone_number_id}`,
        { headers: { Authorization: `Bearer ${config.access_token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(`Conectado! Número: ${data.display_phone_number || config.phone_number_id}`);
      } else {
        const error = await response.json();
        toast.error(`Erro: ${error.error?.message || 'Token inválido'}`);
      }
    } catch {
      toast.error('Não foi possível conectar. Verifique as credenciais.');
    } finally {
      setIsTesting(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover esta instância?')) {
      await deleteInstance.mutateAsync(id);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleInstance.mutateAsync({ id, isActive });
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultInstance.mutateAsync(id);
  };

  const renderInstanceCard = (instance: WhatsAppInstance) => {
    const isEvolution = instance.integration_type === 'evolution_api';
    
    return (
      <Card 
        key={instance.id} 
        className={`${instance.is_active ? 'border-green-200 dark:border-green-800' : ''} ${instance.is_default ? 'ring-2 ring-primary/40' : ''}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isEvolution ? 'bg-purple-100 dark:bg-purple-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
                {isEvolution ? (
                  <Server className="h-5 w-5 text-purple-600" />
                ) : (
                  <Smartphone className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {instance.name}
                  {instance.is_default && (
                    <Badge variant="outline" className="text-xs">
                      <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                      Padrão
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isEvolution ? 'Evolution API' : 'WhatsApp Business API'}
                  {instance.phone_number && ` • ${instance.phone_number}`}
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={instance.is_active}
              onCheckedChange={(checked) => handleToggle(instance.id, checked)}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <Badge variant={instance.is_active ? 'default' : 'secondary'}>
              {instance.is_active ? (
                <><CheckCircle2 className="h-3 w-3 mr-1" /> Ativo</>
              ) : (
                'Inativo'
              )}
            </Badge>
            <div className="flex gap-1">
              {isEvolution && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleConnectQR(instance)}
                  title="Conectar / QR Code"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              )}
              {!instance.is_default && instance.is_active && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSetDefault(instance.id)}
                  title="Definir como padrão"
                >
                  <Star className="h-4 w-4" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => isEvolution ? handleTestEvolution(instance) : handleTestBusiness(instance)}
                disabled={isTesting === instance.id}
              >
                {isTesting === instance.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(instance.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-green-600" />
            Provedores WhatsApp
          </h2>
          <p className="text-muted-foreground">
            Configure múltiplos números e escolha qual usar para envios
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Número
        </Button>
      </div>

      {/* Info notices */}
      {isEvolutionGlobalConfigured && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="pt-5 pb-5">
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-green-800 dark:text-green-200">
                  <strong>Evolution API configurada globalmente.</strong> Para adicionar um número, basta informar o nome da instância e escanear o QR Code.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isEvolutionGlobalConfigured && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="pt-5 pb-5">
            <div className="flex gap-3">
              <Shield className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-amber-800 dark:text-amber-200">
                  <strong>Evolution API não configurada.</strong> O administrador da plataforma precisa configurar a Evolution API nas configurações globais para habilitar conexões via QR Code.
                </p>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  Enquanto isso, você pode usar a <strong>WhatsApp Business API</strong> (Meta) informando suas próprias credenciais.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {instances.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhum número configurado</h3>
            <p className="text-muted-foreground mb-4">
              Adicione seu primeiro número WhatsApp para começar a enviar mensagens
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Número
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {instances.map(renderInstanceCard)}
        </div>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Qual provedor escolher?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-purple-600">Evolution API (QR Code)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✅ Basta informar o nome da instância</li>
                <li>✅ Escaneie o QR Code e pronto</li>
                <li>✅ Não precisa de conta Business</li>
                <li>✅ Sem custos por mensagem</li>
                <li>{isEvolutionGlobalConfigured ? '✅ Configurada pelo admin' : '⚠️ Requer configuração do admin'}</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">WhatsApp Business API</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✅ API oficial e mais estável</li>
                <li>✅ Maior limite de mensagens</li>
                <li>✅ Templates aprovados pela Meta</li>
                <li>⚠️ Requer aprovação da Meta</li>
                <li>⚠️ Custo por mensagem</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Número WhatsApp</DialogTitle>
            <DialogDescription>
              Escolha o provedor e configure as credenciais
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="instance-name">Nome da Instância *</Label>
              <Input
                id="instance-name"
                placeholder="Ex: WhatsApp Principal, Suporte, Marketing..."
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Um nome para identificar este número</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="evolution" disabled={!isEvolutionGlobalConfigured}>
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </TabsTrigger>
              <TabsTrigger value="business">
                <Smartphone className="h-4 w-4 mr-2" />
                Business API
              </TabsTrigger>
            </TabsList>

            <TabsContent value="evolution" className="space-y-4 mt-4">
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-sm text-green-800 dark:text-green-200">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Evolution API configurada globalmente. Apenas informe o nome da instância.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="evo-instance-name">Nome da Instância na Evolution API *</Label>
                <Input
                  id="evo-instance-name"
                  placeholder="minha-instancia"
                  value={evolutionInstanceName}
                  onChange={(e) => setEvolutionInstanceName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Nome da instância criada no servidor Evolution API
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="evo-phone">Número do WhatsApp</Label>
                <Input
                  id="evo-phone"
                  placeholder="+55 11 99999-9999"
                  value={evolutionPhone}
                  onChange={(e) => setEvolutionPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Opcional — para identificação</p>
              </div>
            </TabsContent>

            <TabsContent value="business" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="biz-token">Access Token *</Label>
                <Input
                  id="biz-token"
                  type="password"
                  placeholder="Token de acesso da Meta"
                  value={businessConfig.access_token}
                  onChange={(e) => setBusinessConfig({ ...businessConfig, access_token: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="biz-phone-id">Phone Number ID *</Label>
                <Input
                  id="biz-phone-id"
                  placeholder="ID do número no Meta"
                  value={businessConfig.phone_number_id}
                  onChange={(e) => setBusinessConfig({ ...businessConfig, phone_number_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="biz-account">Business Account ID</Label>
                <Input
                  id="biz-account"
                  placeholder="ID da conta Business"
                  value={businessConfig.business_account_id}
                  onChange={(e) => setBusinessConfig({ ...businessConfig, business_account_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="biz-phone">Número do WhatsApp</Label>
                <Input
                  id="biz-phone"
                  placeholder="+55 11 99999-9999"
                  value={businessConfig.phone_number}
                  onChange={(e) => setBusinessConfig({ ...businessConfig, phone_number: e.target.value })}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="is-default"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked === true)}
            />
            <Label htmlFor="is-default" className="text-sm font-normal">
              Definir como número padrão para envios
            </Label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button
              onClick={activeTab === 'evolution' ? handleSaveEvolution : handleSaveBusiness}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Adicionar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={(open) => { if (!open) handleCloseQRDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Conectar WhatsApp
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR Code com seu WhatsApp para conectar a instância <strong>{qrInstanceName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {qrStatus === 'connected' ? (
              <div className="text-center py-6">
                <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-green-100 dark:bg-green-900 mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Conectado com Sucesso!</h3>
                <p className="text-muted-foreground">
                  Seu WhatsApp foi conectado ao AG Sell
                </p>
              </div>
            ) : qrLoading ? (
              <div className="flex flex-col items-center py-10">
                <RefreshCw className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Gerando QR Code...</p>
              </div>
            ) : qrError ? (
              <div className="text-center py-6">
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-destructive/10 mb-4">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-destructive font-medium mb-2">Erro</p>
                <p className="text-sm text-muted-foreground mb-4">{qrError}</p>
                <Button onClick={() => fetchQRCode(qrInstanceName, qrOrgId, 'connect')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            ) : qrCodeBase64 ? (
              <div className="text-center">
                <div className="relative inline-block bg-white p-2 rounded-lg">
                  <img
                    src={qrCodeBase64}
                    alt="QR Code WhatsApp"
                    className="w-64 h-64 mx-auto"
                  />
                </div>
                {qrPairingCode && (
                  <div className="mt-3 p-2 bg-muted rounded text-sm">
                    <p className="text-muted-foreground">Código de pareamento:</p>
                    <p className="font-mono font-bold text-lg tracking-wider">{qrPairingCode}</p>
                  </div>
                )}
                <div className="mt-4 text-sm text-muted-foreground space-y-1">
                  <p>1. Abra o WhatsApp no seu celular</p>
                  <p>2. Vá em <strong>Configurações → Dispositivos Conectados</strong></p>
                  <p>3. Toque em <strong>"Conectar um Dispositivo"</strong></p>
                  <p>4. Escaneie este QR Code</p>
                </div>
                <div className="mt-4 flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => fetchQRCode(qrInstanceName, qrOrgId, 'connect')}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar QR Code
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Aguardando conexão...
                </p>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseQRDialog}>
              {qrStatus === 'connected' ? 'Fechar' : 'Cancelar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
