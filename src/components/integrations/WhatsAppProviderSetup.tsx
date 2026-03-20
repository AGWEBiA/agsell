import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2, ExternalLink, Globe, Loader2, Lock, Monitor,
  Plus, QrCode, RefreshCw, Server, Shield, Smartphone, Star,
  Trash2, Zap, MessageSquare, AlertTriangle, Settings, ChevronRight, Phone, Power, X,
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
    instances, activeInstances, createInstance, deleteInstance, toggleInstance,
    setDefaultInstance, isLoading,
  } = useWhatsAppInstances();
  const { currentPlan, isLoading: plansLoading } = usePlans();
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();

  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<'plataforma' | 'propria' | 'oficial' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { status: 'connected' | 'disconnected' | 'error'; message: string }>>({});

  // New instance forms
  const [platformInstanceName, setPlatformInstanceName] = useState('');
  const [ownApiUrl, setOwnApiUrl] = useState('');
  const [ownApiKey, setOwnApiKey] = useState('');
  const [ownInstanceName, setOwnInstanceName] = useState('');
  const [officialPhoneNumberId, setOfficialPhoneNumberId] = useState('');
  const [officialAccessToken, setOfficialAccessToken] = useState('');
  const [officialWabaId, setOfficialWabaId] = useState('');
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

  // Auto-select first instance
  useEffect(() => {
    if (!selectedInstanceId && instances.length > 0 && !addMode) {
      setSelectedInstanceId(instances[0].id);
    }
  }, [instances, selectedInstanceId, addMode]);

  useEffect(() => {
    return () => { if (statusPollRef.current) clearInterval(statusPollRef.current); };
  }, []);

  const stopPolling = useCallback(() => {
    if (statusPollRef.current) { clearInterval(statusPollRef.current); statusPollRef.current = null; }
  }, []);

  const fetchQRCode = useCallback(async (instName: string, orgId: string, action: 'create' | 'connect' = 'connect') => {
    setQrLoading(true); setQrError(null); setQrCodeBase64(null); setQrPairingCode(null); setQrStatus('waiting'); stopPolling();
    try {
      const { data, error } = await supabase.functions.invoke('evolution-qrcode', {
        body: { instance_name: instName, organization_id: orgId, action },
      });
      if (error) throw error;
      if (!data?.success) { setQrError(data?.error || 'Erro ao obter QR Code'); setQrStatus('error'); return; }
      if (data.action === 'connected') { setQrStatus('connected'); toast.success('Instância já está conectada!'); return; }
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
            setQrStatus('connected'); stopPolling(); toast.success('WhatsApp conectado com sucesso!');
          }
        } catch { /* ignore */ }
      }, 5000);
    } catch (err) { setQrError(err instanceof Error ? err.message : 'Erro desconhecido'); setQrStatus('error'); }
    finally { setQrLoading(false); }
  }, [stopPolling]);

  const handleCloseQRDialog = useCallback(() => {
    stopPolling(); setShowQRDialog(false); setQrCodeBase64(null); setQrPairingCode(null); setQrStatus('idle'); setQrError(null);
  }, [stopPolling]);

  const { data: isEvolutionGlobalConfigured = false } = useQuery({
    queryKey: ['evolution_api_configured'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_evolution_api_configured');
      if (error) throw error;
      return data === true;
    },
  });

  const hasWhatsAppFeature = currentPlan?.features?.includes('whatsapp') ||
    currentPlan?.slug === 'professional' || currentPlan?.slug === 'enterprise' ||
    (currentPlan?.max_whatsapp_messages ?? 0) > 0;

  const selectedInstance = instances.find(i => i.id === selectedInstanceId) || null;

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
    if (!platformInstanceName.trim()) { toast.error('Informe um nome para a instância'); return; }
    if (!isEvolutionGlobalConfigured) { toast.error('Evolution API não configurada globalmente'); return; }
    setIsSaving(true);
    try {
      await createInstance.mutateAsync({
        name: platformInstanceName, integration_type: 'evolution_api',
        config: { instance_name: platformInstanceName } as Record<string, string>,
        is_default: instances.length === 0,
      });
      setPendingQRAction({ instanceName: platformInstanceName, orgId: currentOrganization?.id || '', action: 'create' });
      setShowBanWarning(true);
      setPlatformInstanceName('');
      setAddMode(null);
    } finally { setIsSaving(false); }
  };

  const handleSaveOwn = async () => {
    if (!ownApiUrl.trim() || !ownApiKey.trim() || !ownInstanceName.trim()) { toast.error('Preencha todos os campos obrigatórios'); return; }
    setIsSaving(true);
    try {
      await createInstance.mutateAsync({
        name: ownInstanceName, integration_type: 'evolution_api',
        config: { instance_name: ownInstanceName, own_api_url: ownApiUrl, own_api_key: ownApiKey } as Record<string, string>,
        is_default: instances.length === 0,
      });
      setPendingQRAction({ instanceName: ownInstanceName, orgId: currentOrganization?.id || '', action: 'create' });
      setShowBanWarning(true);
      setOwnApiUrl(''); setOwnApiKey(''); setOwnInstanceName('');
      setAddMode(null);
    } finally { setIsSaving(false); }
  };

  const handleSaveOfficial = async () => {
    if (!officialPhoneNumberId.trim() || !officialAccessToken.trim()) { toast.error('Preencha Phone Number ID e Access Token'); return; }
    setIsSaving(true);
    try {
      await createInstance.mutateAsync({
        name: `API Oficial - ${officialPhoneNumberId.slice(-4)}`, integration_type: 'whatsapp_business',
        config: { phone_number_id: officialPhoneNumberId, access_token: officialAccessToken, waba_id: officialWabaId, webhook_verify_token: crypto.randomUUID(), phone_number: officialPhone } as Record<string, string>,
        phone_number: officialPhone || officialPhoneNumberId, is_default: instances.length === 0,
      });
      setOfficialPhoneNumberId(''); setOfficialAccessToken(''); setOfficialWabaId(''); setOfficialPhone('');
      setAddMode(null);
      toast.success('API Oficial configurada com sucesso!');
    } finally { setIsSaving(false); }
  };

  const handleConfirmBanWarning = () => {
    setShowBanWarning(false);
    if (pendingQRAction) {
      setQrInstanceName(pendingQRAction.instanceName); setQrOrgId(pendingQRAction.orgId);
      setShowQRDialog(true);
      fetchQRCode(pendingQRAction.instanceName, pendingQRAction.orgId, pendingQRAction.action);
      setPendingQRAction(null);
    }
  };

  const handleConnectQR = (instance: WhatsAppInstance) => {
    const instName = instance.config.instance_name;
    if (!instName) { toast.error('Nome da instância não configurado'); return; }
    setPendingQRAction({ instanceName: instName as string, orgId: instance.organization_id || '', action: 'connect' });
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
    } finally { setIsTesting(null); }
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
      } else {
        const error = await response.json();
        setTestResults(prev => ({ ...prev, [instance.id]: { status: 'error', message: error.error?.message || 'Token inválido ou expirado' } }));
      }
    } catch {
      setTestResults(prev => ({ ...prev, [instance.id]: { status: 'error', message: 'Não foi possível conectar à API da Meta.' } }));
    } finally { setIsTesting(null); }
  };

  const getStatusColor = (instance: WhatsAppInstance) => {
    const testResult = testResults[instance.id];
    if (testResult?.status === 'connected') return 'bg-emerald-500';
    if (testResult?.status === 'disconnected') return 'bg-amber-500';
    if (testResult?.status === 'error') return 'bg-destructive';
    return instance.is_active ? 'bg-emerald-500' : 'bg-muted-foreground/40';
  };

  const getTypeLabel = (instance: WhatsAppInstance) => {
    if (instance.integration_type === 'whatsapp_business') return 'API Oficial';
    if (instance.config.own_api_url) return 'Evolution Própria';
    return 'Plataforma';
  };

  const getTypeIcon = (instance: WhatsAppInstance) => {
    if (instance.integration_type === 'whatsapp_business') return <Globe className="h-4 w-4" />;
    if (instance.config.own_api_url) return <Monitor className="h-4 w-4" />;
    return <Server className="h-4 w-4" />;
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              Dispositivos WhatsApp
            </CardTitle>
            <Button size="sm" onClick={() => { setAddMode('plataforma'); setSelectedInstanceId(null); }}>
              <Plus className="h-4 w-4 mr-1.5" /> Novo dispositivo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* ===== INSTANCE LIST ===== */}
          {instances.length > 0 && !addMode && (
            <div className="space-y-1.5">
              {instances.map((instance) => {
                const isSelected = selectedInstanceId === instance.id;
                const isEvolution = instance.integration_type === 'evolution_api';
                return (
                  <button
                    key={instance.id}
                    onClick={() => setSelectedInstanceId(instance.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 group
                      ${isSelected
                        ? 'bg-primary/8 ring-1 ring-primary/25 shadow-sm'
                        : 'hover:bg-muted/60'
                      }`}
                  >
                    {/* Status dot */}
                    <div className="relative shrink-0">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors
                        ${isSelected ? 'bg-primary/12 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {getTypeIcon(instance)}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(instance)}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                          {instance.name}
                        </span>
                        {instance.is_default && <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {instance.phone_number ? (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {instance.phone_number}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {(instance.config.instance_name as string) || 'Sem número'}
                          </span>
                        )}
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                          {getTypeLabel(instance)}
                        </Badge>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className={`h-4 w-4 shrink-0 transition-transform duration-200
                      ${isSelected ? 'text-primary rotate-90' : 'text-muted-foreground/40 group-hover:text-muted-foreground'}`}
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* ===== SELECTED INSTANCE DETAIL ===== */}
          {selectedInstance && !addMode && (
            <div className="rounded-xl border bg-card p-4 space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-300">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary`}>
                    {getTypeIcon(selectedInstance)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{selectedInstance.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedInstance.phone_number || (selectedInstance.config.instance_name as string) || 'Sem número'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Ativo</span>
                  <Switch
                    checked={selectedInstance.is_active}
                    onCheckedChange={(checked) => toggleInstance.mutate({ id: selectedInstance.id, isActive: checked })}
                  />
                </div>
              </div>

              {/* Test result banner */}
              {testResults[selectedInstance.id] && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  testResults[selectedInstance.id].status === 'connected'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : testResults[selectedInstance.id].status === 'disconnected'
                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                    : 'bg-destructive/10 text-destructive border border-destructive/20'
                }`}>
                  {testResults[selectedInstance.id].status === 'connected' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                  )}
                  <span className="flex-1">{testResults[selectedInstance.id].message}</span>
                </div>
              )}

              {/* Actions grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button
                  variant="outline" size="sm"
                  className="h-auto py-2.5 flex-col gap-1.5 text-xs"
                  disabled={isTesting === selectedInstance.id}
                  onClick={() => selectedInstance.integration_type === 'evolution_api'
                    ? handleTestEvolution(selectedInstance)
                    : handleTestBusiness(selectedInstance)}
                >
                  {isTesting === selectedInstance.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  Testar
                </Button>

                {selectedInstance.integration_type === 'evolution_api' && (
                  <Button variant="outline" size="sm" className="h-auto py-2.5 flex-col gap-1.5 text-xs" onClick={() => handleConnectQR(selectedInstance)}>
                    <QrCode className="h-4 w-4" />
                    QR Code
                  </Button>
                )}

                {!selectedInstance.is_default && selectedInstance.is_active && (
                  <Button variant="outline" size="sm" className="h-auto py-2.5 flex-col gap-1.5 text-xs" onClick={() => setDefaultInstance.mutate(selectedInstance.id)}>
                    <Star className="h-4 w-4" />
                    Tornar Padrão
                  </Button>
                )}

                <Button
                  variant="outline" size="sm"
                  className="h-auto py-2.5 flex-col gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/5 hover:border-destructive/30"
                  onClick={() => { if (confirm('Tem certeza que deseja remover esta instância?')) deleteInstance.mutate(selectedInstance.id); }}
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </Button>
              </div>

              {/* Instance details */}
              <div className="pt-2 border-t space-y-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div>
                    <span className="text-muted-foreground">Tipo</span>
                    <p className="font-medium">{getTypeLabel(selectedInstance)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <p className="font-medium">{selectedInstance.is_active ? 'Ativo' : 'Inativo'}</p>
                  </div>
                  {selectedInstance.config.instance_name && (
                    <div>
                      <span className="text-muted-foreground">Instância</span>
                      <p className="font-medium truncate">{selectedInstance.config.instance_name as string}</p>
                    </div>
                  )}
                  {selectedInstance.last_sync_at && (
                    <div>
                      <span className="text-muted-foreground">Última sync</span>
                      <p className="font-medium">{new Date(selectedInstance.last_sync_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== EMPTY STATE ===== */}
          {instances.length === 0 && !addMode && (
            <div className="text-center py-12 space-y-4">
              <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-2xl bg-muted">
                <Smartphone className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Nenhum dispositivo conectado</h3>
                <p className="text-sm text-muted-foreground mt-1">Conecte seu WhatsApp para começar a enviar e receber mensagens.</p>
              </div>
              <Button onClick={() => setAddMode('plataforma')}>
                <Plus className="h-4 w-4 mr-2" /> Conectar WhatsApp
              </Button>
            </div>
          )}

          {/* ===== ADD NEW INSTANCE ===== */}
          {addMode && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Novo Dispositivo</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setAddMode(null); if (instances.length > 0) setSelectedInstanceId(instances[0].id); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Tabs value={addMode} onValueChange={(v) => setAddMode(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="plataforma" className="gap-1.5 text-xs sm:text-sm">
                    <QrCode className="h-3.5 w-3.5" /> QR Code
                  </TabsTrigger>
                  <TabsTrigger value="propria" className="gap-1.5 text-xs sm:text-sm">
                    <Server className="h-3.5 w-3.5" /> Própria
                  </TabsTrigger>
                  <TabsTrigger value="oficial" className="gap-1.5 text-xs sm:text-sm">
                    <Globe className="h-3.5 w-3.5" /> Oficial
                  </TabsTrigger>
                </TabsList>

                {/* PLATAFORMA */}
                <TabsContent value="plataforma" className="space-y-4 mt-4">
                  <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 p-4">
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                      <QrCode className="h-4 w-4" /> Conexão via QR Code
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Crie uma instância gerenciada pela plataforma. Basta informar um nome e escanear o QR Code.
                    </p>
                  </div>

                  {!isEvolutionGlobalConfigured && (
                    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4">
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        <strong>Evolution API não configurada globalmente.</strong> Contate o administrador.
                      </p>
                    </div>
                  )}

                  {isEvolutionGlobalConfigured && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Nome da instância</Label>
                        <Input placeholder="Ex: Vendas, Suporte..." value={platformInstanceName} onChange={e => setPlatformInstanceName(e.target.value)} />
                      </div>
                      <Button className="w-full" onClick={handleSavePlatform} disabled={isSaving || !platformInstanceName.trim()}>
                        <Plus className="h-4 w-4 mr-2" /> {isSaving ? 'Criando...' : 'Criar e Gerar QR Code'}
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* PRÓPRIA */}
                <TabsContent value="propria" className="space-y-4 mt-4">
                  <div className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10 p-4">
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-400 flex items-center gap-2">
                      <Monitor className="h-4 w-4" /> Evolution API própria
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Conecte usando sua própria instância do Evolution API.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>URL da Evolution API *</Label>
                      <Input placeholder="https://sua-api.com" value={ownApiUrl} onChange={e => setOwnApiUrl(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>API Key *</Label>
                      <Input type="password" placeholder="Sua API Key" value={ownApiKey} onChange={e => setOwnApiKey(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Nome da instância *</Label>
                      <Input placeholder="minha-instancia" value={ownInstanceName} onChange={e => setOwnInstanceName(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={handleSaveOwn} disabled={isSaving}>
                        {isSaving ? 'Salvando...' : 'Salvar e Conectar'}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* OFICIAL */}
                <TabsContent value="oficial" className="space-y-4 mt-4">
                  <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 p-4">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center gap-2">
                      <Globe className="h-4 w-4" /> WhatsApp Business API (Cloud API)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Conecte usando sua conta Meta Business.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Phone Number ID *</Label>
                      <Input placeholder="Ex: 123456789012345" value={officialPhoneNumberId} onChange={e => setOfficialPhoneNumberId(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Access Token permanente *</Label>
                      <Input type="password" placeholder="Token de acesso" value={officialAccessToken} onChange={e => setOfficialAccessToken(e.target.value)} />
                    </div>
                    <Separator />
                    <p className="text-xs text-muted-foreground font-medium">Opcionais</p>
                    <div className="space-y-2">
                      <Label>WABA ID</Label>
                      <Input placeholder="Ex: 987654321098765" value={officialWabaId} onChange={e => setOfficialWabaId(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Número do WhatsApp</Label>
                      <Input placeholder="+55 11 99999-9999" value={officialPhone} onChange={e => setOfficialPhone(e.target.value)} />
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                      <p className="font-medium text-xs flex items-center gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> Webhook URL</p>
                      <code className="block text-xs bg-background p-2 rounded border break-all select-all">
                        {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`}
                      </code>
                    </div>
                    <Button className="w-full" onClick={handleSaveOfficial} disabled={isSaving}>
                      {isSaving ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
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
            <DialogDescription>Escaneie o QR Code no seu WhatsApp para conectar.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {qrStatus === 'connected' ? (
              <div className="text-center py-6">
                <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 mb-4">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
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
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
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
                  <div className="mt-3 flex justify-center">
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
