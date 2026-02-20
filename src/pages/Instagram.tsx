import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Instagram, 
  Plus, 
  MessageCircle, 
  Heart, 
  Send, 
  Eye, 
  Zap, 
  Trash2, 
  Settings2, 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useInstagramAccounts, useInstagramAutomations, useCreateInstagramAutomation, useUpdateInstagramAutomation, useDeleteInstagramAutomation } from '@/hooks/useInstagram';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const automationTypes = [
  { value: 'dm_reply', label: 'Resposta Automática de DM', icon: MessageCircle, description: 'Responde automaticamente mensagens diretas com palavras-chave' },
  { value: 'comment_reply', label: 'Resposta de Comentário', icon: Heart, description: 'Responde comentários em posts automaticamente' },
  { value: 'comment_to_dm', label: 'Comentário → DM', icon: Send, description: 'Envia DM automática quando alguém comenta em um post' },
  { value: 'story_reply', label: 'Resposta de Story', icon: Eye, description: 'Responde automaticamente menções e respostas em stories' },
];

export default function InstagramPage() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { data: accounts, isLoading: loadingAccounts } = useInstagramAccounts();
  const { data: automations, isLoading: loadingAutomations } = useInstagramAutomations();
  const createAutomation = useCreateInstagramAutomation();
  const updateAutomation = useUpdateInstagramAutomation();
  const deleteAutomation = useDeleteInstagramAutomation();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAutomation, setNewAutomation] = useState({
    name: '',
    description: '',
    automation_type: 'dm_reply',
    trigger_keywords: '',
    response_message: '',
  });

  const handleCreateAutomation = () => {
    if (!currentOrganization || !user || !accounts?.length) return;

    createAutomation.mutate({
      organization_id: currentOrganization.id,
      instagram_account_id: accounts[0].id,
      name: newAutomation.name,
      description: newAutomation.description,
      automation_type: newAutomation.automation_type,
      trigger_config: {
        keywords: newAutomation.trigger_keywords.split(',').map(k => k.trim()).filter(Boolean),
      },
      actions: [{
        type: newAutomation.automation_type === 'comment_to_dm' ? 'send_dm' : 'reply',
        content: newAutomation.response_message,
      }],
      created_by: user.id,
    } as any, {
      onSuccess: () => {
        setShowCreateDialog(false);
        setNewAutomation({ name: '', description: '', automation_type: 'dm_reply', trigger_keywords: '', response_message: '' });
      },
    });
  };

  const toggleAutomation = (automation: any) => {
    updateAutomation.mutate({ id: automation.id, is_active: !automation.is_active } as any);
  };

  const activeAutomations = automations?.filter(a => a.is_active).length || 0;
  const totalExecutions = automations?.reduce((sum, a) => sum + (a.executions_count || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Instagram className="h-8 w-8 text-pink-500" />
            Instagram
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie automações de DMs, comentários e stories do Instagram
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Conectadas</CardTitle>
            <Instagram className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automações Ativas</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAutomations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Automações</CardTitle>
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automations?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Execuções Totais</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExecutions}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="automations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="automations">Automações</TabsTrigger>
          <TabsTrigger value="accounts">Contas</TabsTrigger>
          <TabsTrigger value="logs">Histórico</TabsTrigger>
        </TabsList>

        {/* Automations Tab */}
        <TabsContent value="automations" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Automações de Instagram</h2>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button disabled={!accounts?.length}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Automação
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Criar Automação de Instagram</DialogTitle>
                  <DialogDescription>
                    Configure uma automação para responder automaticamente no Instagram.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={newAutomation.name}
                      onChange={e => setNewAutomation(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Resposta automática de boas-vindas"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      value={newAutomation.description}
                      onChange={e => setNewAutomation(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição opcional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Automação</Label>
                    <Select
                      value={newAutomation.automation_type}
                      onValueChange={v => setNewAutomation(prev => ({ ...prev, automation_type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {automationTypes.map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            <div className="flex items-center gap-2">
                              <t.icon className="h-4 w-4" />
                              {t.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {automationTypes.find(t => t.value === newAutomation.automation_type)?.description}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Palavras-chave (separadas por vírgula)</Label>
                    <Input
                      value={newAutomation.trigger_keywords}
                      onChange={e => setNewAutomation(prev => ({ ...prev, trigger_keywords: e.target.value }))}
                      placeholder="Ex: preço, informação, comprar"
                    />
                    <p className="text-xs text-muted-foreground">
                      Deixe vazio para disparar em todas as mensagens
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Mensagem de Resposta</Label>
                    <Textarea
                      value={newAutomation.response_message}
                      onChange={e => setNewAutomation(prev => ({ ...prev, response_message: e.target.value }))}
                      placeholder="Olá! Obrigado pelo seu interesse..."
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
                  <Button
                    onClick={handleCreateAutomation}
                    disabled={!newAutomation.name || !newAutomation.response_message || createAutomation.isPending}
                  >
                    {createAutomation.isPending ? 'Criando...' : 'Criar Automação'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {!accounts?.length && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma conta conectada</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  Para criar automações, primeiro conecte sua conta do Instagram na aba "Contas".
                </p>
              </CardContent>
            </Card>
          )}

          {loadingAutomations ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : automations?.length === 0 && accounts?.length ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma automação criada</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Crie sua primeira automação para começar a responder automaticamente no Instagram.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {automations?.map(automation => {
                const typeInfo = automationTypes.find(t => t.value === automation.automation_type);
                const TypeIcon = typeInfo?.icon || Zap;
                return (
                  <Card key={automation.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/20">
                          <TypeIcon className="h-5 w-5 text-pink-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{automation.name}</h3>
                            <Badge variant={automation.is_active ? 'default' : 'secondary'}>
                              {automation.is_active ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {typeInfo?.label} • {automation.executions_count} execuções
                          </p>
                          {automation.last_triggered_at && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              Último disparo: {format(new Date(automation.last_triggered_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={automation.is_active}
                          onCheckedChange={() => toggleAutomation(automation)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAutomation.mutate(automation.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Contas do Instagram</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="h-5 w-5 text-pink-500" />
                Conectar Conta do Instagram
              </CardTitle>
              <CardDescription>
                Para conectar sua conta do Instagram, é necessário configurar a integração com a Meta (Facebook) API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Pré-requisitos
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                  <li>Conta do Instagram Business ou Creator vinculada a uma Página do Facebook</li>
                  <li>App registrado na Meta Developers com permissões do Instagram Graph API</li>
                  <li>Token de acesso de longa duração configurado</li>
                  <li>Webhooks da Meta configurados para receber eventos em tempo real</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Meta Developers
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://developers.facebook.com/docs/instagram-api/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Documentação da API
                  </a>
                </Button>
              </div>

              {loadingAccounts ? (
                <Skeleton className="h-20 w-full" />
              ) : accounts?.length ? (
                <div className="space-y-3 mt-4">
                  <h4 className="font-medium">Contas Conectadas</h4>
                  {accounts.map(account => (
                    <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {account.profile_picture_url ? (
                          <img src={account.profile_picture_url} alt={account.username} className="h-10 w-10 rounded-full" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                            <Instagram className="h-5 w-5 text-pink-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">@{account.username}</p>
                          <p className="text-sm text-muted-foreground">{account.full_name}</p>
                        </div>
                      </div>
                      <Badge variant={account.is_active ? 'default' : 'secondary'}>
                        {account.is_active ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Conectada</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Desconectada</>
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>Nenhuma conta conectada ainda.</p>
                  <p className="text-sm mt-1">Configure a integração nas Configurações → Integrações para conectar sua conta.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Histórico de Execuções</h2>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum log disponível</h3>
              <p className="text-muted-foreground">
                O histórico de execuções aparecerá aqui quando suas automações começarem a ser disparadas.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
