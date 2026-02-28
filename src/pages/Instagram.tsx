import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePlanFeature, usePlans } from '@/hooks/usePlans';
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
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ExternalLink,
  RefreshCw,
  ArrowRight,
  Sparkles,
  ShieldCheck
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
  { value: 'dm_reply', label: 'Resposta de DM', icon: MessageCircle, description: 'Responde DMs automaticamente', category: 'dm' },
  { value: 'comment_reply', label: 'Resposta de Comentário', icon: Heart, description: 'Responde comentários em posts', category: 'post' },
  { value: 'comment_to_dm', label: 'Comentário → DM', icon: Send, description: 'Envia DM quando comentam no post', category: 'post' },
  { value: 'story_reply', label: 'Resposta de Story', icon: Eye, description: 'Responde menções em stories', category: 'story' },
  { value: 'story_mention_dm', label: 'Menção em Story → DM', icon: Send, description: 'Envia DM quando mencionam em story', category: 'story' },
  { value: 'specific_post_comment', label: 'Comentário em Post Específico', icon: Heart, description: 'Responde comentários em um post específico', category: 'post' },
  { value: 'specific_post_to_dm', label: 'Post Específico → DM', icon: Send, description: 'Envia DM para quem comenta em um post específico', category: 'post' },
  { value: 'specific_story_reply', label: 'Resposta de Story Específico', icon: Eye, description: 'Responde a reações/respostas de um story específico', category: 'story' },
  { value: 'first_dm', label: 'Primeira DM', icon: Sparkles, description: 'Responde automaticamente na primeira DM recebida', category: 'dm' },
];

type AutomationCategory = 'all' | 'dm' | 'post' | 'story';
const automationCategories: { value: AutomationCategory; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'dm', label: 'DM' },
  { value: 'post', label: 'Posts' },
  { value: 'story', label: 'Stories' },
];

const INSTAGRAM_APP_ID = "1231864369151883";
const INSTAGRAM_SCOPES = "instagram_business_basic,instagram_manage_comments,instagram_business_manage_messages";

/* ─── Wizard de Conexão via Facebook Login ─── */
function ConnectWizard({ 
  onConnected, 
  canAddMore, 
  maxAccounts, 
  accountsCount 
}: { 
  onConnected: () => void; 
  canAddMore: boolean; 
  maxAccounts: number; 
  accountsCount: number; 
}) {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Listen for OAuth callback
  React.useEffect(() => {
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');

      if (!code && !error) return;

      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);

      if (error) {
        toast({ title: 'Conexão cancelada', description: 'Você cancelou a conexão com o Facebook.', variant: 'destructive' });
        return;
      }

      if (!code || !state) return;

      // Validate state
      const savedState = sessionStorage.getItem('ig_oauth_state');
      if (state !== savedState) {
        toast({ title: 'Erro de segurança', description: 'Estado OAuth inválido. Tente novamente.', variant: 'destructive' });
        return;
      }
      sessionStorage.removeItem('ig_oauth_state');

      setLoading(true);
      try {
        const redirectUri = `${window.location.origin}/instagram`;
        const { data, error: fnError } = await supabase.functions.invoke('instagram-oauth', {
          body: {
            code,
            redirect_uri: redirectUri,
            organization_id: currentOrganization?.id,
          },
        });

        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);

        toast({
          title: data.updated ? '🔄 Conta reconectada!' : '✅ Conta conectada!',
          description: `@${data.account.username} vinculada com sucesso.`,
        });
        onConnected();
      } catch (err: any) {
        toast({ title: 'Erro ao conectar', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    handleOAuthCallback();
  }, []);

  const handleInstagramLogin = () => {
    const state = crypto.randomUUID();
    sessionStorage.setItem('ig_oauth_state', state);
    const redirectUri = `${window.location.origin}/instagram`;
    const igUrl = `https://www.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(INSTAGRAM_SCOPES)}&state=${state}`;
    window.location.href = igUrl;
  };

  if (!canAddMore) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center py-10 text-center">
          <ShieldCheck className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="font-semibold text-lg">Limite de contas atingido</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Seu plano permite {maxAccounts} conta(s). Você já tem {accountsCount} conectada(s).
          </p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/plans'}>
            Ver planos
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-16 text-center">
          <RefreshCw className="h-10 w-10 text-pink-500 animate-spin mb-4" />
          <h3 className="font-semibold text-lg">Conectando sua conta...</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Estamos vinculando sua conta do Instagram. Aguarde um momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-orange-500/10 p-8 text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 mb-4">
          <Instagram className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Conectar Instagram</h2>
         <p className="text-muted-foreground max-w-md mx-auto">
          Conecte sua conta Instagram Business ou Creator para automatizar respostas de DM, comentários e stories.
        </p>
      </div>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Requisitos</h4>
          <div className="grid gap-3">
            {[
              { emoji: '📱', text: 'Conta Instagram Business ou Creator' },
              { emoji: '📄', text: 'Página do Facebook vinculada ao Instagram' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <span className="text-xl">{item.emoji}</span>
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <Button 
          className="w-full gap-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white" 
          size="lg"
          onClick={handleInstagramLogin}
        >
          <Instagram className="h-5 w-5" />
          Conectar com Instagram
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Ao conectar, você autoriza o acesso à sua conta Instagram Business ou Creator.
        </p>
      </CardContent>
    </Card>
  );
}

/* ─── Página Principal ─── */
export default function InstagramPage() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasFeature: hasInstagram, isLoading: loadingFeature } = usePlanFeature('instagram');
  const { currentPlan } = usePlans();
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
    target_post_url: '',
    target_story_url: '',
  });
  const [typeFilter, setTypeFilter] = useState<AutomationCategory>('all');

  const maxInstagramAccounts = currentPlan?.max_instagram_accounts ?? 1;
  const canAddMoreAccounts = maxInstagramAccounts === -1 || (accounts?.length ?? 0) < maxInstagramAccounts;
  const hasAccounts = !!accounts?.length;

  const handleCreateAutomation = () => {
    if (!currentOrganization || !user || !accounts?.length) return;
    const isPostSpecific = ['specific_post_comment', 'specific_post_to_dm'].includes(newAutomation.automation_type);
    const isStorySpecific = newAutomation.automation_type === 'specific_story_reply';
    const isDmType = ['comment_to_dm', 'specific_post_to_dm', 'story_mention_dm'].includes(newAutomation.automation_type);

    createAutomation.mutate({
      organization_id: currentOrganization.id,
      instagram_account_id: accounts[0].id,
      name: newAutomation.name,
      description: newAutomation.description,
      automation_type: newAutomation.automation_type,
      trigger_config: {
        keywords: newAutomation.trigger_keywords.split(',').map(k => k.trim()).filter(Boolean),
        ...(isPostSpecific && newAutomation.target_post_url ? { target_post_url: newAutomation.target_post_url } : {}),
        ...(isStorySpecific && newAutomation.target_story_url ? { target_story_url: newAutomation.target_story_url } : {}),
      },
      actions: [{
        type: isDmType ? 'send_dm' : 'reply',
        content: newAutomation.response_message,
      }],
      created_by: user.id,
    } as any, {
      onSuccess: () => {
        setShowCreateDialog(false);
        setNewAutomation({ name: '', description: '', automation_type: 'dm_reply', trigger_keywords: '', response_message: '', target_post_url: '', target_story_url: '' });
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
        <h2 className="text-2xl font-bold">Instagram não disponível</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Disponível a partir do plano Professional.
        </p>
        <Button onClick={() => navigate('/plans')}>Ver Planos</Button>
      </div>
    );
  }

  /* ─── Se não tem conta, mostra só o wizard ─── */
  if (!loadingAccounts && !hasAccounts) {
    return (
      <div className="max-w-lg mx-auto space-y-6 py-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Instagram</h1>
          <p className="text-muted-foreground mt-1">Conecte sua conta para começar</p>
        </div>
        <ConnectWizard 
          onConnected={() => queryClient.invalidateQueries({ queryKey: ['instagram_accounts'] })}
          canAddMore={canAddMoreAccounts}
          maxAccounts={maxInstagramAccounts}
          accountsCount={accounts?.length ?? 0}
        />
      </div>
    );
  }

  /* ─── Interface principal (com conta conectada) ─── */
  return (
    <div className="space-y-6">
      {/* Header com conta conectada */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {accounts?.[0]?.profile_picture_url ? (
            <img src={accounts[0].profile_picture_url} alt="" className="h-12 w-12 rounded-full ring-2 ring-pink-300" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
              <Instagram className="h-6 w-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              @{accounts?.[0]?.username}
              <Badge variant="default" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Conectada
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">{accounts?.[0]?.full_name}</p>
          </div>
        </div>
      </div>

      {/* Stats compactos */}
      <div className="grid gap-3 grid-cols-3">
        {[
          { label: 'Automações', value: automations?.length || 0, sub: `${activeAutomations} ativas` },
          { label: 'Execuções', value: totalExecutions, sub: 'total' },
          { label: 'Contas', value: accounts?.length || 0, sub: maxInstagramAccounts === -1 ? 'ilimitadas' : `de ${maxInstagramAccounts}` },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label} · {stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="automations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="automations" className="gap-2"><Zap className="h-4 w-4" /> Automações</TabsTrigger>
          <TabsTrigger value="account" className="gap-2"><Instagram className="h-4 w-4" /> Conta</TabsTrigger>
          <TabsTrigger value="logs" className="gap-2"><BarChart3 className="h-4 w-4" /> Histórico</TabsTrigger>
        </TabsList>

        {/* Automações */}
        <TabsContent value="automations" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Automações</h2>
              <div className="flex gap-1">
                {automationCategories.map(cat => (
                  <Button
                    key={cat.value}
                    variant={typeFilter === cat.value ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs px-2.5"
                    onClick={() => setTypeFilter(cat.value)}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Nova Automação</DialogTitle>
                  <DialogDescription>Configure uma resposta automática para o Instagram.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={newAutomation.name}
                      onChange={e => setNewAutomation(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Boas-vindas DM"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de automação</Label>
                    <Select value={newAutomation.automation_type} onValueChange={v => setNewAutomation(prev => ({ ...prev, automation_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">DMs</div>
                        {automationTypes.filter(t => t.category === 'dm').map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            <div className="flex items-center gap-2">
                              <t.icon className="h-4 w-4" />
                              <span>{t.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase mt-1">Posts</div>
                        {automationTypes.filter(t => t.category === 'post').map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            <div className="flex items-center gap-2">
                              <t.icon className="h-4 w-4" />
                              <span>{t.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase mt-1">Stories</div>
                        {automationTypes.filter(t => t.category === 'story').map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            <div className="flex items-center gap-2">
                              <t.icon className="h-4 w-4" />
                              <span>{t.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{automationTypes.find(t => t.value === newAutomation.automation_type)?.description}</p>
                  </div>

                  {/* Post/Story URL fields for specific targeting */}
                  {['specific_post_comment', 'specific_post_to_dm'].includes(newAutomation.automation_type) && (
                    <div className="space-y-2">
                      <Label>URL do Post</Label>
                      <Input
                        value={newAutomation.target_post_url}
                        onChange={e => setNewAutomation(prev => ({ ...prev, target_post_url: e.target.value }))}
                        placeholder="https://www.instagram.com/p/ABC123..."
                      />
                      <p className="text-xs text-muted-foreground">Cole o link do post específico que deseja monitorar.</p>
                    </div>
                  )}

                  {newAutomation.automation_type === 'specific_story_reply' && (
                    <div className="space-y-2">
                      <Label>URL ou ID do Story</Label>
                      <Input
                        value={newAutomation.target_story_url}
                        onChange={e => setNewAutomation(prev => ({ ...prev, target_story_url: e.target.value }))}
                        placeholder="https://www.instagram.com/stories/username/123..."
                      />
                      <p className="text-xs text-muted-foreground">Cole o link do story específico.</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Palavras-chave <span className="text-xs text-muted-foreground font-normal">(opcional)</span></Label>
                    <Input
                      value={newAutomation.trigger_keywords}
                      onChange={e => setNewAutomation(prev => ({ ...prev, trigger_keywords: e.target.value }))}
                      placeholder="preço, comprar, informação"
                    />
                    <p className="text-xs text-muted-foreground">Separe por vírgula. Vazio = todas as mensagens.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Mensagem de resposta</Label>
                    <Textarea
                      value={newAutomation.response_message}
                      onChange={e => setNewAutomation(prev => ({ ...prev, response_message: e.target.value }))}
                      placeholder="Olá! Obrigado pelo interesse..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
                  <Button onClick={handleCreateAutomation} disabled={!newAutomation.name || !newAutomation.response_message || createAutomation.isPending}>
                    {createAutomation.isPending ? 'Criando...' : 'Criar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loadingAutomations ? (
            <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : !automations?.length ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-10 text-center">
                <Zap className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="font-semibold">Nenhuma automação ainda</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Crie sua primeira automação para responder automaticamente no Instagram.
                </p>
                <Button size="sm" className="mt-4 gap-1" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4" /> Criar automação
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {automations
                .filter(a => typeFilter === 'all' || automationTypes.find(t => t.value === a.automation_type)?.category === typeFilter)
                .map(automation => {
                const typeInfo = automationTypes.find(t => t.value === automation.automation_type);
                const TypeIcon = typeInfo?.icon || Zap;
                return (
                  <Card key={automation.id}>
                    <CardContent className="flex items-center justify-between py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/20">
                          <TypeIcon className="h-4 w-4 text-pink-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{automation.name}</span>
                            <Badge variant={automation.is_active ? 'default' : 'secondary'} className="text-xs">
                              {automation.is_active ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {typeInfo?.label}
                            {(automation.trigger_config as any)?.target_post_url && <> · 📌 Post específico</>}
                            {(automation.trigger_config as any)?.target_story_url && <> · 📸 Story específico</>}
                            {' · '}{automation.executions_count || 0} execuções
                            {automation.last_triggered_at && (
                              <> · <Clock className="h-3 w-3 inline" /> {format(new Date(automation.last_triggered_at), "dd/MM HH:mm", { locale: ptBR })}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={automation.is_active} onCheckedChange={() => toggleAutomation(automation)} />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteAutomation.mutate(automation.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Conta */}
        <TabsContent value="account" className="space-y-4">
          {accounts?.map(account => (
            <Card key={account.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  {account.profile_picture_url ? (
                    <img src={account.profile_picture_url} alt="" className="h-12 w-12 rounded-full" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Instagram className="h-6 w-6 text-pink-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">@{account.username}</p>
                    <p className="text-sm text-muted-foreground">{account.full_name}</p>
                  </div>
                </div>
                <Badge variant={account.is_active ? 'default' : 'secondary'}>
                  {account.is_active ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Conectada</> : <><XCircle className="h-3 w-3 mr-1" /> Inativa</>}
                </Badge>
              </CardContent>
            </Card>
          ))}

          {canAddMoreAccounts && (
            <ConnectWizard
              onConnected={() => queryClient.invalidateQueries({ queryKey: ['instagram_accounts'] })}
              canAddMore={canAddMoreAccounts}
              maxAccounts={maxInstagramAccounts}
              accountsCount={accounts?.length ?? 0}
            />
          )}
        </TabsContent>

        {/* Logs */}
        <TabsContent value="logs">
          <Card>
            <CardContent className="py-10 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold">Nenhum log ainda</h3>
              <p className="text-sm text-muted-foreground mt-1">
                O histórico aparecerá quando suas automações forem disparadas.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
