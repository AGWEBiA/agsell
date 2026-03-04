import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Smartphone, CheckCircle2, XCircle, Users, Send, Settings, Star, Server, Trash2, Power, Loader2 } from 'lucide-react';
import { WhatsAppProviderSetup } from '@/components/integrations/WhatsAppProviderSetup';
import { WhatsAppGroupsManager } from '@/components/whatsapp/WhatsAppGroupsManager';
import { useWhatsAppGroups } from '@/hooks/useWhatsAppGroups';
import { WhatsAppCampaignsManager } from '@/components/whatsapp/WhatsAppCampaignsManager';
import { WhatsAppGroupMessages } from '@/components/whatsapp/WhatsAppGroupMessages';
import { useWhatsAppInstances } from '@/hooks/useWhatsAppInstances';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
                <strong>API Oficial (Meta Cloud API):</strong> as mensagens são cobradas diretamente pela Meta ao titular da conta, conforme o volume de conversas. O AG Sell não cobra taxas adicionais por mensagem.
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                <strong>Evolution API (QR Code):</strong> não há custos por mensagem. Você precisa apenas hospedar sua própria instância da Evolution API.
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

      {/* Connected Instances Status */}
      {instances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Instâncias Conectadas ({instances.length})
            </CardTitle>
            <CardDescription>
              Gerencie seus números e provedores WhatsApp. Você pode ter múltiplos números conectados simultaneamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {instances.map((instance) => (
                  <Card key={instance.id} className={instance.is_active ? 'border-green-200 dark:border-green-800' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          instance.is_active ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'
                        }`}>
                          {instance.integration_type === 'evolution_api' ? (
                            <Server className={`h-5 w-5 ${instance.is_active ? 'text-green-600' : 'text-muted-foreground'}`} />
                          ) : (
                            <Smartphone className={`h-5 w-5 ${instance.is_active ? 'text-green-600' : 'text-muted-foreground'}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{instance.name}</p>
                          {instance.phone_number && (
                            <p className="text-xs text-muted-foreground truncate">{instance.phone_number}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        <Badge variant={instance.is_active ? 'default' : 'destructive'} className="text-xs">
                          {instance.is_active ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" /> Ativo</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" /> Inativo</>
                          )}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {instance.integration_type === 'evolution_api' ? 'Evolution API' : 'Business API'}
                        </Badge>
                        {instance.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" /> Padrão
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {!instance.is_default && instance.is_active && (
                          <Button variant="outline" size="sm" className="text-xs h-7"
                            onClick={() => setDefaultInstance.mutate(instance.id)}
                            disabled={setDefaultInstance.isPending}>
                            <Star className="h-3 w-3 mr-1" /> Padrão
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="text-xs h-7"
                          onClick={() => toggleInstance.mutate({ id: instance.id, isActive: !instance.is_active })}
                          disabled={toggleInstance.isPending}>
                          <Power className="h-3 w-3 mr-1" />
                          {instance.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs h-7 text-destructive hover:text-destructive"
                          onClick={() => { if (confirm('Remover esta instância?')) deleteInstance.mutate(instance.id); }}
                          disabled={deleteInstance.isPending}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="connection" className="space-y-6">
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
          
          {/* Setup Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Como Configurar</CardTitle>
              <CardDescription>Siga os passos para integrar o WhatsApp</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Escolha o tipo de conexão</p>
                    <p className="text-sm text-muted-foreground">
                      QR Code para uso pessoal ou API Business para empresas com alto volume.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Configure seus grupos</p>
                    <p className="text-sm text-muted-foreground">
                      Adicione grupos para monitorar entradas, saídas e enviar mensagens automáticas.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Crie campanhas em massa</p>
                    <p className="text-sm text-muted-foreground">
                      Envie mensagens 1-a-1 respeitando os limites e boas práticas do WhatsApp.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <WhatsAppGroupsManager />
        </TabsContent>

        <TabsContent value="campaigns">
          <WhatsAppCampaignsManager />
        </TabsContent>

        <TabsContent value="messages">
          <WhatsAppGroupMessages />
        </TabsContent>
      </Tabs>
    </div>
  );
}
