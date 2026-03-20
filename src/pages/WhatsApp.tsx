import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Smartphone, CheckCircle2, XCircle, Users, Send, Settings, Star, Server, Trash2, Power, Loader2, Copy, Gauge, Link2, KeyRound } from 'lucide-react';
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
    parseInt(instance?.config?.messages_per_minute || '2000', 10)
  );
  const webhookUrl = `${window.location.origin}/api/whatsapp-webhook`;
  const token = instance?.config?.webhook_token || instance?.id?.slice(0, 16) || '';

  React.useEffect(() => {
    if (instance) {
      setName(instance.name);
      setMessagesPerMinute(parseInt(instance.config?.messages_per_minute || '2000', 10));
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
      },
    });
    onOpenChange(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  if (!instance) return null;

  const phone = instance.phone_number || instance.config?.phone_number || instance.config?.instance_name || '';
  const instanceName = instance.config?.instance_name || instance.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="text-lg font-semibold">{phone || instanceName}</div>
          <DialogTitle>Configurações de WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2 max-h-[70vh] overflow-y-auto">
          {/* Gerenciamento de grupos */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Gerenciamento de grupos</h4>
            <p className="text-xs text-muted-foreground">
              Clicando aqui, você pode configurar os seus grupos de WhatsApp, criar grupos novos, importar os leads e definir suas tags.
            </p>
          </div>

          {/* Mais recursos - Import buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                // Navigate to groups tab filtered by this instance
                window.dispatchEvent(new CustomEvent('navigate-to-groups', { detail: { instanceName } }));
              }}
              className="flex flex-col items-start p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
            >
              <span className="font-medium text-sm">Importar todos os grupos</span>
              <span className="text-xs text-muted-foreground mt-1">Faça a importação de todos os grupos de WhatsApp do dispositivo.</span>
            </button>
            <button
              type="button"
              onClick={() => toast.info('Importação de contatos será disponibilizada em breve.')}
              className="flex flex-col items-start p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
            >
              <span className="font-medium text-sm">Importar todos os contatos</span>
              <span className="text-xs text-muted-foreground mt-1">Importar todos os contatos deste dispositivo para a lista de leads.</span>
            </button>
          </div>

          {/* Device Name */}
          <div className="space-y-2">
            <Label>Nome do dispositivo</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Dê um nome para o seu dispositivo na plataforma" />
          </div>

          {/* Messages per minute */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Gauge className="h-4 w-4" /> Mensagens por minuto
            </Label>
            <Slider
              value={[messagesPerMinute]}
              onValueChange={([v]) => setMessagesPerMinute(v)}
              min={12}
              max={4000}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>12</span>
              <span className="font-medium text-foreground">{messagesPerMinute}</span>
              <span>4000</span>
            </div>
            {instance.integration_type === 'whatsapp_business' && (
              <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Ao alterar este campo, por favor, considere o <span className="font-semibold underline">limite diário de envio</span> imposto pela API Oficial do WhatsApp.
                </p>
              </div>
            )}
          </div>

          {/* Webhook URL & Token - only for official API */}
          {instance.integration_type === 'whatsapp_business' && (
            <>
              <div className="space-y-2">
                <Label>Link do Webhook (URL de retorno de chamada)</Label>
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

export default function WhatsApp() {
  const {
    instances,
    activeInstances,
    defaultInstance,
    isLoading,
    deleteInstance,
    toggleInstance,
    setDefaultInstance,
  } = useWhatsAppInstances();
  const { groups } = useWhatsAppGroups();
  const [configInstance, setConfigInstance] = useState<WhatsAppInstance | null>(null);
  const [activeTab, setActiveTab] = useState('connection');
  const [filterDeviceInstance, setFilterDeviceInstance] = useState<string | null>(null);

  const handleDeviceClick = (instance: WhatsAppInstance) => {
    const instanceName = instance.config?.instance_name || instance.name;
    setFilterDeviceInstance(instanceName);
    setActiveTab('groups');
  };

  // Listen for navigate-to-groups events from InstanceConfigDialog
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">WhatsApp</h1>
          <p className="text-muted-foreground text-sm">Gerencie suas conexões, grupos e campanhas WhatsApp</p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Integração WhatsApp Completa</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Conecte via QR Code ou API, gerencie grupos e comunidades, e envie campanhas em massa respeitando as boas práticas do WhatsApp.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meta Billing Notice */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <CardContent className="pt-6">
          <div className="flex gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900">
              <Settings className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">Aviso sobre cobrança de mensagens</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                <strong>API Oficial (Meta Cloud API):</strong> as mensagens são cobradas diretamente pela Meta ao titular da conta. O AG Sell não cobra taxas adicionais.
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                <strong>Evolution API (QR Code):</strong> não há custos por mensagem. Você precisa apenas hospedar sua própria instância da Evolution API.
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                <strong>Nota:</strong> A API Oficial não suporta grupos — apenas mensagens individuais.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <Smartphone className="h-6 w-6 text-green-600" />
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

      {/* Dispositivos (Instance Cards) - SellFlux style */}
      {instances.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Dispositivos ({instances.length})
              </CardTitle>
              <CardDescription>
                Configure seus telefones para o atendimento e para as automações de WhatsApp.
                Você possui um total de {instances.length} dispositivo(s), com {activeInstances.length} conectado(s).
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {instances.map((instance) => {
                  const isActive = instance.is_active;
                  const phone = instance.phone_number || instance.config?.phone_number || '';
                  const instanceName = instance.config?.instance_name || instance.name;
                  const displayName = phone || instanceName;
                  const isConnected = instance.status === 'connected' || isActive;
                  return (
                    <div
                      key={instance.id}
                      onClick={() => handleDeviceClick(instance)}
                      className={`relative group cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-lg ${
                        isConnected
                          ? 'border-green-500/50 bg-green-50/30 dark:bg-green-950/20'
                          : 'border-border bg-card opacity-75 hover:opacity-100'
                      }`}
                    >
                      {/* Status indicator */}
                      <div className={`absolute top-3 right-3 h-3 w-3 rounded-full ${
                        isConnected ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-muted-foreground/30'
                      }`} />

                      {/* Phone number - prominently displayed */}
                      <p className="font-semibold text-sm truncate pr-6">
                        {phone ? phone : <span className="text-muted-foreground italic">Conexão incompleta!</span>}
                      </p>

                      {/* Instance name & status */}
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {instance.name !== displayName ? instance.name + ' • ' : ''}
                        {isConnected ? 'Conectado' : 'Inativo'}
                      </p>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-1 mt-2">
                        <Badge variant={isConnected ? 'default' : 'secondary'} className="text-[10px] h-5">
                          {instance.integration_type === 'evolution_api' ? 'Evolution' : 'API Oficial'}
                        </Badge>
                        {instance.is_default && (
                          <Badge variant="outline" className="text-[10px] h-5 border-amber-400 text-amber-600">
                            <Star className="h-2.5 w-2.5 mr-0.5 fill-amber-400" /> Padrão
                          </Badge>
                        )}
                      </div>

                      {/* Quick actions (on hover) */}
                      <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => setConfigInstance(instance)}
                          title="Configurações">
                          <Settings className="h-3.5 w-3.5" />
                        </Button>
                        {!instance.is_default && isActive && (
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => setDefaultInstance.mutate(instance.id)}
                            title="Definir como padrão">
                            <Star className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => toggleInstance.mutate({ id: instance.id, isActive: !instance.is_active })}
                          title={isActive ? 'Desativar' : 'Ativar'}>
                          <Power className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => { if (confirm('Remover esta instância?')) deleteInstance.mutate(instance.id); }}
                          title="Remover">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
          
          <Card>
            <CardHeader>
              <CardTitle>Como Configurar</CardTitle>
              <CardDescription>Siga os passos para integrar o WhatsApp</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">1</div>
                  <div>
                    <p className="font-medium">Escolha o tipo de conexão</p>
                    <p className="text-sm text-muted-foreground">QR Code para uso pessoal ou API Business para empresas com alto volume.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">2</div>
                  <div>
                    <p className="font-medium">Configure seus grupos</p>
                    <p className="text-sm text-muted-foreground">Adicione grupos para monitorar entradas, saídas e enviar mensagens automáticas.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">3</div>
                  <div>
                    <p className="font-medium">Crie campanhas em massa</p>
                    <p className="text-sm text-muted-foreground">Envie mensagens 1-a-1 respeitando os limites e boas práticas do WhatsApp.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
