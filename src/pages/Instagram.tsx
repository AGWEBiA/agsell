import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePlanFeature } from '@/hooks/usePlans';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasFeature: hasInstagram, isLoading: loadingFeature } = usePlanFeature('instagram');
  const { data: accounts, isLoading: loadingAccounts } = useInstagramAccounts();
  const { data: automations, isLoading: loadingAutomations } = useInstagramAutomations();
  const createAutomation = useCreateInstagramAutomation();
  const updateAutomation = useUpdateInstagramAutomation();
  const deleteAutomation = useDeleteInstagramAutomation();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectForm, setConnectForm] = useState({
    access_token: '',
    instagram_user_id: '',
    username: '',
  });
  const [newAutomation, setNewAutomation] = useState({
    name: '',
    description: '',
    automation_type: 'dm_reply',
    trigger_keywords: '',
    response_message: '',
  });

  const handleConnectAccount = async () => {
    if (!currentOrganization || !user) return;
    if (!connectForm.access_token || !connectForm.instagram_user_id || !connectForm.username) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    setIsConnecting(true);
    try {
      const { error } = await supabase.from('instagram_accounts').insert({
        organization_id: currentOrganization.id,
        access_token: connectForm.access_token,
        instagram_user_id: connectForm.instagram_user_id,
        username: connectForm.username,
        connected_by: user.id,
      } as any);
      if (error) throw error;
      toast({ title: 'Conta conectada!', description: `@${connectForm.username} foi vinculada com sucesso.` });
      setConnectForm({ access_token: '', instagram_user_id: '', username: '' });
      queryClient.invalidateQueries({ queryKey: ['instagram_accounts'] });
    } catch (err: any) {
      toast({ title: 'Erro ao conectar', description: err.message, variant: 'destructive' });
    } finally {
      setIsConnecting(false);
    }
  };

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

  if (!loadingFeature && !hasInstagram) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-4 rounded-full bg-muted">
          <Lock className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Instagram não disponível no seu plano</h2>
        <p className="text-muted-foreground text-center max-w-md">
          As automações de Instagram estão disponíveis a partir do plano Professional. Faça upgrade para desbloquear essa funcionalidade.
        </p>
        <Button onClick={() => navigate('/plans')}>Ver Planos</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Instagram className="h-8 w-8 text-pink-500" />
            Automação do Instagram
          </h1>
          <p className="text-muted-foreground mt-1">
            Conecte sua conta do Instagram e crie automações para DMs, comentários e stories
          </p>
        </div>
      </div>

      {/* Banner de conexão quando não tem conta */}
      {!loadingAccounts && !accounts?.length && (
        <Card className="border-pink-200 dark:border-pink-800 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
          <CardContent className="flex items-center gap-6 py-6">
            <div className="p-4 rounded-full bg-pink-100 dark:bg-pink-900/30 shrink-0">
              <Instagram className="h-10 w-10 text-pink-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">Conecte sua conta do Instagram</h3>
              <p className="text-sm text-muted-foreground">
                Para começar a usar automações, você precisa conectar sua conta do Instagram Business ou Creator. 
                Vá até a aba <strong>"Minha Conta Instagram"</strong> abaixo para seguir o passo a passo.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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

      <Tabs defaultValue={accounts?.length ? 'automations' : 'accounts'} className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            Minha Conta Instagram
          </TabsTrigger>
          <TabsTrigger value="automations">Automações</TabsTrigger>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Instagram className="h-6 w-6 text-pink-500" />
                Conectar sua Conta do Instagram
              </CardTitle>
              <CardDescription className="text-base">
                Siga os passos abaixo para vincular sua conta do Instagram ao AG Sell e começar a usar automações.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step-by-step guide */}
              <div className="space-y-4">
                <div className="flex gap-4 items-start p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">1</div>
                  <div>
                    <h4 className="font-semibold">Tenha uma conta Instagram Business ou Creator</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sua conta pessoal do Instagram precisa ser convertida para <strong>Business</strong> ou <strong>Creator</strong>. 
                      Isso é feito nas configurações do próprio Instagram (Configurações → Conta → Mudar para conta profissional).
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">2</div>
                  <div>
                    <h4 className="font-semibold">Vincule à uma Página do Facebook</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      A conta Instagram Business precisa estar vinculada a uma Página do Facebook. 
                      Faça isso em: Instagram → Configurações → Conta → Páginas vinculadas.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">3</div>
                  <div>
                    <h4 className="font-semibold">Crie um App no Meta Developers</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Acesse o portal de desenvolvedores da Meta, crie um App do tipo "Business" e ative a Instagram Graph API. 
                      Gere um <strong>Token de Acesso de Longa Duração</strong>.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir Meta Developers
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4 items-start p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">4</div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="font-semibold">Cole suas credenciais abaixo para conectar</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Com o token e o ID do Instagram em mãos, preencha os campos abaixo para vincular sua conta.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="ig-username">@ Usuário do Instagram <span className="text-destructive">*</span></Label>
                        <Input
                          id="ig-username"
                          placeholder="seu_usuario"
                          value={connectForm.username}
                          onChange={e => setConnectForm(prev => ({ ...prev, username: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ig-user-id">Instagram User ID <span className="text-destructive">*</span></Label>
                        <Input
                          id="ig-user-id"
                          placeholder="Ex: 17841400123456789"
                          value={connectForm.instagram_user_id}
                          onChange={e => setConnectForm(prev => ({ ...prev, instagram_user_id: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ig-token">Access Token (Longa Duração) <span className="text-destructive">*</span></Label>
                      <Input
                        id="ig-token"
                        type="password"
                        placeholder="Cole aqui o token gerado no Meta Developers"
                        value={connectForm.access_token}
                        onChange={e => setConnectForm(prev => ({ ...prev, access_token: e.target.value }))}
                      />
                    </div>
                    <Button
                      onClick={handleConnectAccount}
                      disabled={isConnecting || !connectForm.access_token || !connectForm.instagram_user_id || !connectForm.username}
                      className="gap-2"
                    >
                      {isConnecting ? (
                        <><RefreshCw className="h-4 w-4 animate-spin" /> Conectando...</>
                      ) : (
                        <><Instagram className="h-4 w-4" /> Conectar Conta</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Importante
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  A Meta exige que sua empresa esteja <strong>verificada no Business Manager</strong> para liberar 
                  as permissões de mensagens automáticas (DMs). Sem essa verificação, as automações de mensagens não funcionarão.
                </p>
              </div>

              {/* Connected accounts */}
              {loadingAccounts ? (
                <Skeleton className="h-20 w-full" />
              ) : accounts?.length ? (
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Contas Conectadas
                  </h4>
                  {accounts.map(account => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {account.profile_picture_url ? (
                          <img src={account.profile_picture_url} alt={account.username} className="h-12 w-12 rounded-full" />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <Instagram className="h-6 w-6 text-pink-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-base">@{account.username}</p>
                          <p className="text-sm text-muted-foreground">{account.full_name}</p>
                        </div>
                      </div>
                      <Badge variant={account.is_active ? 'default' : 'secondary'} className="text-sm">
                        {account.is_active ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Conectada</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Desconectada</>
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : null}
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
