import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
  Globe,
  Loader2,
  Lock,
  Monitor,
  Plus,
  QrCode,
  RefreshCw,
  Server,
  Shield,
  Smartphone,
  Star,
  Trash2,
  Zap,
  MessageSquare,
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

export function WhatsAppProviderSetup() {
  const {
    instances,
    activeInstances,
    createInstance,
    deleteInstance,
    toggleInstance,
    setDefaultInstance,
    isLoading,
  } = useWhatsAppInstances();
  const { currentPlan, isLoading: plansLoading } = usePlans();
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'plataforma' | 'propria' | 'oficial'>('plataforma');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { status: 'connected' | 'disconnected' | 'error'; message: string }>>({});

  // Plataforma (global Evolution) form
  const [platformInstanceName, setPlatformInstanceName] = useState('');

  // Própria (own Evolution) form
  const [ownApiUrl, setOwnApiUrl] = useState('');
  const [ownApiKey, setOwnApiKey] = useState('');
  const [ownInstanceName, setOwnInstanceName] = useState('');

  // API Oficial form
  const [officialPhoneNumberId, setOfficialPhoneNumberId] = useState('');
  const [officialAccessToken, setOfficialAccessToken] = useState('');
  const [officialWabaId, setOfficialWabaId] = useState('');
  // webhook token is auto-generated
  const [officialPhone, setOfficialPhone] = useState('');

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

  // Ban warning
  const [showBanWarning, setShowBanWarning] = useState(false);
  const [pendingQRAction, setPendingQRAction] = useState<{ instanceName: string; orgId: string; action: 'create' | 'connect' } | null>(null);

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
        body: { instance_name: instName, organization_id: orgId, action },
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
        const base64 = data.qrcode.startsWith('data:') ? data.qrcode : `data:image/png;base64,${data.qrcode}`;
        setQrCodeBase64(base64);
      }
      if (data.pairingCode) setQrPairingCode(data.pairingCode);

      statusPollRef.current = setInterval(async () => {
        try {
          const { data: statusData } = await supabase.functions.invoke('evolution-qrcode', {
            body: { instance_name: instName, organization_id: orgId, action: 'status' },
          });
          if (statusData?.data?.instance?.state === 'open') {
            setQrStatus('connected');
            stopPolling();
            toast.success('WhatsApp conectado com sucesso!');
          }
        } catch { /* ignore */ }
      }, 5000);
    } catch (err) {
      setQrError(err instanceof Error ? err.message : 'Erro desconhecido');
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
  }, [stopPolling]);

  // Fetch global Evolution API config status (uses security definer RPC to avoid RLS)
  const { data: isEvolutionGlobalConfigured = false } = useQuery({
    queryKey: ['evolution_api_configured'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_evolution_api_configured');
      if (error) throw error;
      return data === true;
    },
  });

  const hasWhatsAppFeature = currentPlan?.features?.includes('whatsapp') ||
    currentPlan?.slug === 'professional' ||
    currentPlan?.slug === 'enterprise' ||
    (currentPlan?.max_whatsapp_messages ?? 0) > 0;

  // Instance categorization
  const platformInstances = instances.filter(i => i.integration_type === 'evolution_api' && !i.config.own_api_url);
  const ownInstances = instances.filter(i => i.integration_type === 'evolution_api' && !!i.config.own_api_url);
  const officialInstances = instances.filter(i => i.integration_type === 'whatsapp_business');

  const platformStatus = platformInstances.some(i => i.is_active) ? 'On' : 'Off';
  const ownStatus = ownInstances.some(i => i.is_active) ? 'On' : 'Off';
  const officialStatus = officialInstances.some(i => i.is_active) ? 'On' : 'Off';

  if (!plansLoading && !hasWhatsAppFeature) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Lock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Recurso Exclusivo</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            A integração com WhatsApp está disponível apenas nos planos pagos.
          </p>
          <Button onClick={() => navigate('/plans')}>Ver Planos</Button>
        </CardContent>
      </Card>
    );
  }

  // --- Save handlers ---

  const handleSavePlatform = async () => {
    if (!platformInstanceName.trim()) {
      toast.error('Informe um nome para a instância');
      return;
    }
    if (!isEvolutionGlobalConfigured) {
      toast.error('Evolution API não configurada globalmente');
      return;
    }
    setIsSaving(true);
    try {
      await createInstance.mutateAsync({
        name: platformInstanceName,
        integration_type: 'evolution_api',
        config: { instance_name: platformInstanceName } as Record<string, string>,
        is_default: instances.length === 0,
      });
      // Show ban warning then QR
      setPendingQRAction({ instanceName: platformInstanceName, orgId: currentOrganization?.id || '', action: 'create' });
      setShowBanWarning(true);
      setPlatformInstanceName('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOwn = async () => {
    if (!ownApiUrl.trim() || !ownApiKey.trim() || !ownInstanceName.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setIsSaving(true);
    try {
      await createInstance.mutateAsync({
        name: ownInstanceName,
        integration_type: 'evolution_api',
        config: {
          instance_name: ownInstanceName,
          own_api_url: ownApiUrl,
          own_api_key: ownApiKey,
        } as Record<string, string>,
        is_default: instances.length === 0,
      });
      setPendingQRAction({ instanceName: ownInstanceName, orgId: currentOrganization?.id || '', action: 'create' });
      setShowBanWarning(true);
      setOwnApiUrl('');
      setOwnApiKey('');
      setOwnInstanceName('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOfficial = async () => {
    if (!officialPhoneNumberId.trim() || !officialAccessToken.trim()) {
      toast.error('Preencha Phone Number ID e Access Token');
      return;
    }
    setIsSaving(true);
    try {
      await createInstance.mutateAsync({
        name: `API Oficial - ${officialPhoneNumberId.slice(-4)}`,
        integration_type: 'whatsapp_business',
        config: {
          phone_number_id: officialPhoneNumberId,
          access_token: officialAccessToken,
          waba_id: officialWabaId,
          webhook_verify_token: crypto.randomUUID(),
          phone_number: officialPhone,
        } as Record<string, string>,
        phone_number: officialPhone || officialPhoneNumberId,
        is_default: instances.length === 0,
      });
      setOfficialPhoneNumberId('');
      setOfficialAccessToken('');
      setOfficialWabaId('');
      
      setOfficialPhone('');
      toast.success('API Oficial configurada com sucesso!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmBanWarning = () => {
    setShowBanWarning(false);
    if (pendingQRAction) {
      setQrInstanceName(pendingQRAction.instanceName);
      setQrOrgId(pendingQRAction.orgId);
      setShowQRDialog(true);
      fetchQRCode(pendingQRAction.instanceName, pendingQRAction.orgId, pendingQRAction.action);
      setPendingQRAction(null);
    }
  };

  const handleConnectQR = (instance: WhatsAppInstance) => {
    const instName = instance.config.instance_name;
    if (!instName) {
      toast.error('Nome da instância não configurado');
      return;
    }
    setPendingQRAction({ instanceName: instName, orgId: instance.organization_id || '', action: 'connect' });
    setShowBanWarning(true);
  };

  const handleTestEvolution = async (instance: WhatsAppInstance) => {
    setIsTesting(instance.id);
    setTestResults(prev => ({ ...prev, [instance.id]: undefined as any }));
    try {
      const { data, error } = await supabase.functions.invoke('evolution-qrcode', {
        body: { instance_name: instance.config.instance_name, organization_id: instance.organization_id || '', action: 'status' },
      });
      if (error) throw error;
      if (data?.data?.instance?.state === 'open') {
        setTestResults(prev => ({ ...prev, [instance.id]: { status: 'connected', message: 'WhatsApp conectado e funcionando!' } }));
        toast.success('Conexão ativa! WhatsApp conectado.');
      } else {
        const state = data?.data?.instance?.state || data?.error || 'desconectado';
        setTestResults(prev => ({ ...prev, [instance.id]: { status: 'disconnected', message: `Status: ${state}. Reconecte via QR Code.` } }));
        toast.warning(`Status: ${state}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setTestResults(prev => ({ ...prev, [instance.id]: { status: 'error', message: msg } }));
      toast.error('Não foi possível verificar o status.');
    } finally {
      setIsTesting(null);
    }
  };

  const handleTestBusiness = async (instance: WhatsAppInstance) => {
    setIsTesting(instance.id);
    setTestResults(prev => ({ ...prev, [instance.id]: undefined as any }));
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${instance.config.phone_number_id}`, {
        headers: { Authorization: `Bearer ${instance.config.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTestResults(prev => ({ ...prev, [instance.id]: { status: 'connected', message: `Conectado! Número: ${data.display_phone_number || instance.config.phone_number_id}` } }));
        toast.success(`Conectado! Número: ${data.display_phone_number || instance.config.phone_number_id}`);
      } else {
        const error = await response.json();
        const msg = error.error?.message || 'Token inválido ou expirado';
        setTestResults(prev => ({ ...prev, [instance.id]: { status: 'error', message: msg } }));
        toast.error(`Erro: ${msg}`);
      }
    } catch {
      setTestResults(prev => ({ ...prev, [instance.id]: { status: 'error', message: 'Não foi possível conectar à API da Meta.' } }));
      toast.error('Não foi possível conectar.');
    } finally {
      setIsTesting(null);
    }
  };

  const renderInstanceCard = (instance: WhatsAppInstance) => {
    const isEvolution = instance.integration_type === 'evolution_api';
    const testResult = testResults[instance.id];
    return (
      <Card key={instance.id} className={`${instance.is_default ? 'ring-2 ring-primary/30' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${isEvolution ? 'bg-purple-100 dark:bg-purple-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
                {isEvolution ? <Server className="h-4 w-4 text-purple-600" /> : <Smartphone className="h-4 w-4 text-blue-600" />}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate flex items-center gap-1.5">
                  {instance.name}
                  {instance.is_default && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {instance.phone_number || instance.config.instance_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Switch checked={instance.is_active} onCheckedChange={(checked) => toggleInstance.mutate({ id: instance.id, isActive: checked })} />
            </div>
          </div>

          {/* Test result banner */}
          {testResult && (
            <div className={`mt-3 p-2.5 rounded-md text-xs flex items-center gap-2 ${
              testResult.status === 'connected'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : testResult.status === 'disconnected'
                ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}>
              {testResult.status === 'connected' ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : testResult.status === 'disconnected' ? (
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="flex-1">{testResult.message}</span>
              {testResult.status !== 'connected' && isEvolution && (
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2 shrink-0" onClick={() => handleConnectQR(instance)}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Reconectar
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <Badge variant={instance.is_active ? 'default' : 'secondary'} className="text-[10px]">
              {instance.is_active ? '● Ativo' : 'Inativo'}
            </Badge>
            <div className="flex gap-1">
              {/* Test Connection button */}
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                disabled={isTesting === instance.id}
                onClick={() => isEvolution ? handleTestEvolution(instance) : handleTestBusiness(instance)}
              >
                {isTesting === instance.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Zap className="h-3 w-3" />
                )}
                Testar
              </Button>
              {isEvolution && (
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => handleConnectQR(instance)}>
                  <QrCode className="h-3 w-3" /> QR
                </Button>
              )}
              {!instance.is_default && instance.is_active && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDefaultInstance.mutate(instance.id)}>
                  <Star className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm('Remover instância?')) deleteInstance.mutate(instance.id); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Configuração do WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${platformStatus === 'On' ? 'bg-green-500' : 'bg-muted-foreground'}`} />
              Plataforma: {platformStatus}
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${ownStatus === 'On' ? 'bg-green-500' : 'bg-muted-foreground'}`} />
              Própria: {ownStatus}
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${officialStatus === 'On' ? 'bg-green-500' : 'bg-muted-foreground'}`} />
              Oficial: {officialStatus}
            </Badge>
          </div>

          {/* 3-tab layout */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="plataforma" className="gap-1.5 text-xs sm:text-sm">
                <QrCode className="h-4 w-4" /> 1) QR Code
              </TabsTrigger>
              <TabsTrigger value="propria" className="gap-1.5 text-xs sm:text-sm">
                <Server className="h-4 w-4" /> 2) Evolution Própria
              </TabsTrigger>
              <TabsTrigger value="oficial" className="gap-1.5 text-xs sm:text-sm">
                <Globe className="h-4 w-4" /> 3) API Oficial
              </TabsTrigger>
            </TabsList>

            {/* ===== PLATAFORMA ===== */}
            <TabsContent value="plataforma" className="space-y-5 mt-4">
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 p-4">
                <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                  <QrCode className="h-4 w-4" /> Conexão via QR Code (Plataforma)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use a instância gerenciada pela plataforma. Basta gerar o QR Code e escanear com seu WhatsApp.
                </p>
              </div>

              {!isEvolutionGlobalConfigured && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <strong>Evolution API não configurada globalmente.</strong> Contate o administrador da plataforma.
                  </p>
                </div>
              )}

              {/* Existing platform instances */}
              {platformInstances.length > 0 && (
                <div className="grid gap-3">
                  {platformInstances.map(renderInstanceCard)}
                </div>
              )}

              {/* New connection */}
              {isEvolutionGlobalConfigured && (
                <>
                  {platformInstances.length > 0 && (
                    <div className="flex items-center gap-3 pt-2">
                      <Separator className="flex-1" />
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Plus className="h-3 w-3" /> Nova instância
                      </span>
                      <Separator className="flex-1" />
                    </div>
                  )}
                  <div className="text-center space-y-4 py-4">
                    {platformInstances.length === 0 && (
                      <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-muted">
                        <QrCode className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{platformInstances.length === 0 ? 'Conecte seu WhatsApp' : 'Adicionar outro número'}</h3>
                      <p className="text-sm text-muted-foreground">O sistema criará uma instância e exibirá o QR Code automaticamente.</p>
                    </div>
                    <div className="max-w-xs mx-auto space-y-3">
                      <Input
                        placeholder="Nome da instância"
                        value={platformInstanceName}
                        onChange={e => setPlatformInstanceName(e.target.value)}
                      />
                      <Button
                        className="w-full"
                        onClick={handleSavePlatform}
                        disabled={isSaving || !platformInstanceName.trim()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {isSaving ? 'Criando...' : 'Gerar QR Code'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* ===== PRÓPRIA ===== */}
            <TabsContent value="propria" className="space-y-5 mt-4">
              <div className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10 p-4">
                <p className="text-sm font-medium text-orange-700 dark:text-orange-400 flex items-center gap-2">
                  <Monitor className="h-4 w-4" /> Instância própria (Evolution API)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Conecte usando sua própria instância do Evolution API. Informe a URL, API Key e o nome da instância.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Vantagem:</strong> Maior estabilidade por ser uma instância dedicada ao seu uso. Porém, não há garantia de que números não serão banidos ou que o serviço não cairá — as regras são regidas pelo WhatsApp e não pela AG Sell.
                </p>
              </div>

              {/* Existing own instances */}
              {ownInstances.length > 0 && (
                <div className="grid gap-3">
                  {ownInstances.map(renderInstanceCard)}
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>URL da Evolution API *</Label>
                  <Input
                    placeholder="https://sua-instancia.evolution-api.com"
                    value={ownApiUrl}
                    onChange={e => setOwnApiUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Key (Global) *</Label>
                  <Input
                    placeholder="Sua Global API Key"
                    value={ownApiKey}
                    onChange={e => setOwnApiKey(e.target.value)}
                    type="password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome da instância *</Label>
                  <Input
                    placeholder="minha-instancia"
                    value={ownInstanceName}
                    onChange={e => setOwnInstanceName(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveOwn} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button variant="outline" disabled={!ownInstanceName.trim() || isSaving}
                    onClick={() => {
                      if (ownInstanceName.trim()) {
                        setPendingQRAction({ instanceName: ownInstanceName, orgId: currentOrganization?.id || '', action: 'connect' });
                        setShowBanWarning(true);
                      }
                    }}>
                    <QrCode className="h-4 w-4 mr-2" /> Conectar (QR Code)
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ===== API OFICIAL ===== */}
            <TabsContent value="oficial" className="space-y-5 mt-4">
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 p-4">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <Globe className="h-4 w-4" /> WhatsApp Business API (Cloud API)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Conecte usando sua conta Meta Business. Insira o Phone Number ID e Access Token.
                </p>
              </div>

              {/* Embedded Signup hint */}
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-blue-600 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Embedded Signup (Facebook Login)</p>
                      <p className="text-xs text-muted-foreground">
                        Faça login com sua conta Facebook/Meta Business para autorizar automaticamente o acesso à WhatsApp Business API.
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-3" onClick={() => window.open('https://business.facebook.com/', '_blank')}>
                    <Globe className="h-4 w-4 mr-2" /> Abrir Meta Business Suite
                  </Button>
                </CardContent>
              </Card>

              <Separator />

              {/* Existing official instances */}
              {officialInstances.length > 0 && (
                <div className="grid gap-3">
                  {officialInstances.map(renderInstanceCard)}
                </div>
              )}

              {/* Manual config */}
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-4">
                  <Smartphone className="h-4 w-4" /> Configuração manual
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Phone Number ID <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="Ex: 123456789012345"
                      value={officialPhoneNumberId}
                      onChange={e => setOfficialPhoneNumberId(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Encontre em: Meta for Developers → WhatsApp → API Setup → Phone Number ID
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Access Token permanente <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="Token de acesso permanente"
                      type="password"
                      value={officialAccessToken}
                      onChange={e => setOfficialAccessToken(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Crie um System User em Meta Business Suite → Configurações → Usuários do sistema → Gerar token com permissão <code className="bg-muted px-1 rounded">whatsapp_business_messaging</code>
                    </p>
                  </div>

                  <Separator className="my-2" />
                  <p className="text-xs text-muted-foreground font-medium">Campos opcionais (recomendados)</p>

                  <div className="space-y-2">
                    <Label>WABA ID <span className="text-xs text-muted-foreground">(opcional — necessário para templates)</span></Label>
                    <Input
                      placeholder="Ex: 987654321098765"
                      value={officialWabaId}
                      onChange={e => setOfficialWabaId(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      WhatsApp Business Account ID. Necessário para gerenciar templates de mensagem.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Número do WhatsApp <span className="text-xs text-muted-foreground">(opcional — exibição)</span></Label>
                    <Input
                      placeholder="+55 11 99999-9999"
                      value={officialPhone}
                      onChange={e => setOfficialPhone(e.target.value)}
                    />
                  </div>

                  {/* Webhook URL */}
                  <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
                    <p className="font-medium flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      URL do Webhook
                    </p>
                    <code className="block text-xs bg-background p-2 rounded border break-all select-all">
                      {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`}
                    </code>
                    <p className="text-xs text-muted-foreground">
                      Cole esta URL no campo "Callback URL" no Meta for Developers.
                    </p>
                  </div>

                  <Button onClick={handleSaveOfficial} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Ban Warning */}
      <Dialog open={showBanWarning} onOpenChange={setShowBanWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" /> Alerta
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4 text-sm">
            <p className="text-foreground leading-relaxed">
              O AG Sell exime-se de quaisquer responsabilidades quanto ao uso de automações no perfil. Ao utilizar automações em seus perfis no WhatsApp, o usuário compreende que está colocando em potencial risco suas contas.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowBanWarning(false); setPendingQRAction(null); }}>Cancelar</Button>
            <Button onClick={handleConfirmBanWarning}>Continuar Mesmo Assim</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={(open) => { if (!open) handleCloseQRDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" /> Conexão via QR Code
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR Code no seu WhatsApp para conectar.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {qrStatus === 'connected' ? (
              <div className="text-center py-6">
                <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-green-100 dark:bg-green-900 mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Conectado com Sucesso!</h3>
                <p className="text-muted-foreground">Seu WhatsApp foi conectado ao AG Sell</p>
              </div>
            ) : qrLoading ? (
              <div className="flex flex-col items-center py-10">
                <RefreshCw className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Gerando QR Code...</p>
              </div>
            ) : qrError ? (
              <div className="text-center py-6">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive font-medium mb-2">Erro</p>
                <p className="text-sm text-muted-foreground mb-4">{qrError}</p>
                <Button onClick={() => fetchQRCode(qrInstanceName, qrOrgId, 'connect')}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Tentar Novamente
                </Button>
              </div>
            ) : qrCodeBase64 ? (
              <div className="space-y-4">
                <div className="space-y-3 text-left">
                  {['Abra o WhatsApp no celular', 'Vá em Configurações > Dispositivos Conectados', 'Toque em "Conectar um aparelho"', 'Escaneie o QR Code abaixo'].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <p className="text-sm">{step}</p>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <div className="inline-block bg-white p-2 rounded-lg">
                    <img src={qrCodeBase64} alt="QR Code" className="w-56 h-56 mx-auto" />
                  </div>
                  {qrPairingCode && (
                    <div className="mt-3 p-2 bg-muted rounded text-sm">
                      <p className="text-muted-foreground">Código: <span className="font-mono font-bold">{qrPairingCode}</span></p>
                    </div>
                  )}
                  <div className="mt-3 flex justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchQRCode(qrInstanceName, qrOrgId, 'connect')}>
                      <RefreshCw className="h-4 w-4 mr-2" /> Atualizar QR Code
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Aguardando conexão...
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Button onClick={() => fetchQRCode(qrInstanceName, qrOrgId, 'connect')}>
                  <QrCode className="h-4 w-4 mr-2" /> Gerar QR Code
                </Button>
              </div>
            )}
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
