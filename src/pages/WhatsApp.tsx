import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare, Smartphone, CheckCircle2, Users, Send, Settings, Star,
  Server, Trash2, Power, Loader2, Copy, Gauge, Phone, Headphones, Globe, Monitor,
} from 'lucide-react';
import { WhatsAppProviderSetup } from '@/components/integrations/WhatsAppProviderSetup';
import { WhatsAppGroupsManager } from '@/components/whatsapp/WhatsAppGroupsManager';
import { useWhatsAppGroups } from '@/hooks/useWhatsAppGroups';
import { WhatsAppCampaignsManager } from '@/components/whatsapp/WhatsAppCampaignsManager';
import { WhatsAppGroupMessages } from '@/components/whatsapp/WhatsAppGroupMessages';
import { useWhatsAppInstances, WhatsAppInstance } from '@/hooks/useWhatsAppInstances';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

function InstanceConfigDialog({ instance, open, onOpenChange }: {
  instance: WhatsAppInstance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { updateInstance } = useWhatsAppInstances();
  const [name, setName] = useState(instance?.name || '');
  const [messagesPerMinute, setMessagesPerMinute] = useState(
    parseInt(instance?.config?.messages_per_minute as string || '2000', 10)
  );
  const [useForSac, setUseForSac] = useState(
    instance?.config?.use_for_sac === true
  );
  const webhookUrl = `${window.location.origin}/api/whatsapp-webhook`;
  const token = (instance?.config?.webhook_token as string) || instance?.id?.slice(0, 16) || '';

  React.useEffect(() => {
    if (instance) {
      setName(instance.name);
      setMessagesPerMinute(parseInt(instance.config?.messages_per_minute as string || '2000', 10));
      setUseForSac(instance.config?.use_for_sac === true);
    }
  }, [instance]);

  const handleSave = () => {
    if (!instance) return;
    updateInstance.mutate({
      id: instance.id,
      name,
      config: {
        ...instance.config,
        messages_per_minute: String(messagesPerMinute),
        use_for_sac: useForSac,
      },
    });
    onOpenChange(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  if (!instance) return null;

  const phone = instance.phone_number || (instance.config?.phone_number as string) || (instance.config?.instance_name as string) || '';
  const instanceName = (instance.config?.instance_name as string) || instance.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="text-lg font-semibold">{phone || instanceName}</div>
          <DialogTitle>Configurações do Dispositivo</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2 max-h-[70vh] overflow-y-auto">
          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                window.dispatchEvent(new CustomEvent('navigate-to-groups', { detail: { instanceName, autoFetch: true } }));
              }}
              className="flex flex-col items-start p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
            >
              <span className="font-medium text-sm">Importar grupos</span>
              <span className="text-xs text-muted-foreground mt-1">Importar grupos de WhatsApp do dispositivo.</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                window.dispatchEvent(new CustomEvent('navigate-to-contacts-import', { detail: { instanceName } }));
              }}
              className="flex flex-col items-start p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
            >
              <span className="font-medium text-sm">Importar contatos</span>
              <span className="text-xs text-muted-foreground mt-1">Importar contatos deste dispositivo.</span>
            </button>
          </div>

          {/* Device Name */}
          <div className="space-y-2">
            <Label>Nome do dispositivo</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do dispositivo" />
          </div>

          {/* SAC toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Headphones className="h-4 w-4" /> Usar para Atendimento (SAC)
              </Label>
              <p className="text-xs text-muted-foreground">
                Quando ativo, mensagens recebidas neste dispositivo serão encaminhadas para o Inbox de atendimento.
              </p>
            </div>
            <Switch checked={useForSac} onCheckedChange={setUseForSac} />
          </div>

          {/* Messages per minute */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Gauge className="h-4 w-4" /> Mensagens por minuto
            </Label>
            <Slider
              value={[messagesPerMinute]}
              onValueChange={([v]) => setMessagesPerMinute(v)}
              min={12} max={4000} step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>12</span>
              <span className="font-medium text-foreground">{messagesPerMinute}</span>
              <span>4000</span>
            </div>
          </div>

          {/* Webhook - only official */}
          {instance.integration_type === 'whatsapp_business' && (
            <>
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(webhookUrl)}>
                    <Copy className="h-4 w-4 mr-1" /> Copiar
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Token</Label>
                <div className="flex gap-2">
                  <Input value={token} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(token)}>
                    <Copy className="h-4 w-4 mr-1" /> Copiar
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={handleSave} disabled={updateInstance.isPending}>
            {updateInstance.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Instance Selector Bar ----
function InstanceSelectorBar({
  instances,
  selectedId,
  onSelect,
  onConfig,
}: {
  instances: WhatsAppInstance[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onConfig: (instance: WhatsAppInstance) => void;
}) {
  if (instances.length === 0) return null;

  const getTypeIcon = (instance: WhatsAppInstance) => {
    if (instance.integration_type === 'whatsapp_business') return <Globe className="h-3.5 w-3.5" />;
    if (instance.config?.own_api_url) return <Monitor className="h-3.5 w-3.5" />;
    return <Server className="h-3.5 w-3.5" />;
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
      {instances.map((instance) => {
        const isSelected = selectedId === instance.id;
        const phone = instance.phone_number || (instance.config?.phone_number as string) || '';
        const displayName = phone || instance.name;
        const isConnected = instance.is_active;
        const hasSac = instance.config?.use_for_sac === true;

        return (
          <button
            key={instance.id}
            onClick={() => onSelect(instance.id)}
            className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all duration-200 shrink-0 group
              ${isSelected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-transparent bg-muted/40 hover:bg-muted/70 hover:border-border'
              }`}
          >
            {/* Status dot */}
            <div className="relative">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors
                ${isSelected ? 'bg-primary/12 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {getTypeIcon(instance)}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background
                ${isConnected ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
            </div>

            <div className="text-left min-w-0">
              <p className={`text-xs font-semibold truncate max-w-[140px] ${isSelected ? 'text-primary' : ''}`}>
                {displayName}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {instance.is_default && <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />}
                {hasSac && <Headphones className="h-2.5 w-2.5 text-blue-500" />}
                <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                  {instance.name}
                </span>
              </div>
            </div>

            {/* Config gear on hover */}
            <button
              onClick={(e) => { e.stopPropagation(); onConfig(instance); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted shrink-0"
              title="Configurações"
            >
              <Settings className="h-3 w-3 text-muted-foreground" />
            </button>
          </button>
        );
      })}
    </div>
  );
}

export default function WhatsApp() {
  const {
    instances, activeInstances, defaultInstance, isLoading,
    deleteInstance, toggleInstance, setDefaultInstance,
  } = useWhatsAppInstances();
  const { groups } = useWhatsAppGroups();
  const [configInstance, setConfigInstance] = useState<WhatsAppInstance | null>(null);
  const [activeTab, setActiveTab] = useState('connection');
  const [filterDeviceInstance, setFilterDeviceInstance] = useState<string | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  // Auto-select default or first instance
  React.useEffect(() => {
    if (!selectedInstanceId && instances.length > 0) {
      setSelectedInstanceId(defaultInstance?.id || instances[0].id);
    }
  }, [instances, defaultInstance, selectedInstanceId]);

  const selectedInstance = instances.find(i => i.id === selectedInstanceId) || null;

  const handleSelectInstance = (id: string) => {
    setSelectedInstanceId(id);
    const inst = instances.find(i => i.id === id);
    if (inst) {
      const instName = (inst.config?.instance_name as string) || inst.name;
      setFilterDeviceInstance(instName);
    }
  };

  const navigate = useNavigate();

  // Listen for navigate-to-groups events
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.instanceName) {
        setFilterDeviceInstance(detail.instanceName);
        setActiveTab('groups');
      }
    };
    window.addEventListener('navigate-to-groups', handler);
    return () => window.removeEventListener('navigate-to-groups', handler);
  }, []);

  // Listen for navigate-to-contacts-import events
  React.useEffect(() => {
    const handler = () => {
      navigate('/contacts?import=true');
    };
    window.addEventListener('navigate-to-contacts-import', handler);
    return () => window.removeEventListener('navigate-to-contacts-import', handler);
  }, [navigate]);

  const sacInstances = instances.filter(i => i.config?.use_for_sac === true && i.is_active);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">WhatsApp</h1>
        <p className="text-muted-foreground text-sm">Gerencie conexões, grupos e campanhas</p>
      </div>

      {/* ===== INSTANCE SELECTOR BAR ===== */}
      {instances.length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Dispositivos ({instances.length})
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {activeInstances.length} conectado(s)
                </Badge>
              </div>
              {sacInstances.length > 0 && (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Headphones className="h-3 w-3" />
                  {sacInstances.length} no SAC
                </Badge>
              )}
            </div>

            <InstanceSelectorBar
              instances={instances}
              selectedId={selectedInstanceId}
              onSelect={handleSelectInstance}
              onConfig={setConfigInstance}
            />

            {/* Selected instance context */}
            {selectedInstance && (
              <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>
                    Exibindo dados de: <strong className="text-foreground">{selectedInstance.phone_number || selectedInstance.name}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {selectedInstance.config?.use_for_sac && (
                    <Badge variant="outline" className="text-[10px] gap-0.5">
                      <Headphones className="h-2.5 w-2.5" /> SAC
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setConfigInstance(selectedInstance)}>
                    <Settings className="h-3 w-3 mr-1" /> Config
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900">
                <Smartphone className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{isLoading ? '...' : activeInstances.length}</p>
                <p className="text-sm text-muted-foreground">Conexões Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <Smartphone className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{isLoading ? '...' : instances.length}</p>
                <p className="text-sm text-muted-foreground">Total de Instâncias</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{groups.length}</p>
                <p className="text-sm text-muted-foreground">Grupos Gerenciados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <Send className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Campanhas Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v !== 'groups') setFilterDeviceInstance(null); }} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="connection" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Conexão</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Grupos</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Campanhas</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Automações</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-6">
          <WhatsAppProviderSetup />
        </TabsContent>

        <TabsContent value="groups">
          <WhatsAppGroupsManager filterInstanceName={filterDeviceInstance} onClearFilter={() => setFilterDeviceInstance(null)} />
        </TabsContent>

        <TabsContent value="campaigns">
          <WhatsAppCampaignsManager />
        </TabsContent>

        <TabsContent value="messages">
          <WhatsAppGroupMessages />
        </TabsContent>
      </Tabs>

      {/* Instance Config Dialog */}
      <InstanceConfigDialog
        instance={configInstance}
        open={!!configInstance}
        onOpenChange={(open) => { if (!open) setConfigInstance(null); }}
      />
    </div>
  );
}
