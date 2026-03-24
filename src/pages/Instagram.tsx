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
  ShieldCheck,
  UserPlus,
  Users,
  Megaphone,
  Loader2
} from 'lucide-react';
import { useInstagramAccounts, useInstagramAutomations, useCreateInstagramAutomation, useUpdateInstagramAutomation, useDeleteInstagramAutomation, useDisconnectInstagramAccount } from '@/hooks/useInstagram';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const automationTypes = [
  { value: 'dm_reply', label: 'Resposta de DM', icon: MessageCircle, description: 'Responde DMs automaticamente', category: 'dm', hasDualAction: false },
  { value: 'first_dm', label: 'Primeira DM', icon: Sparkles, description: 'Responde automaticamente na primeira DM recebida', category: 'dm', hasDualAction: false },
  { value: 'new_follower', label: 'Novo Seguidor', icon: UserPlus, description: 'Envia DM automaticamente para novos seguidores', category: 'dm', hasDualAction: false },
  { value: 'comment_reply', label: 'Resposta de Comentário', icon: Heart, description: 'Responde comentários em posts (comentário + DM opcional)', category: 'post', hasDualAction: true },
  { value: 'comment_to_dm', label: 'Comentário → DM', icon: Send, description: 'Envia apenas DM quando comentam no post', category: 'post', hasDualAction: false },
  { value: 'specific_post_comment', label: 'Post Específico', icon: Heart, description: 'Responde comentários em um post específico (comentário + DM opcional)', category: 'post', hasDualAction: true },
  { value: 'specific_post_to_dm', label: 'Post Específico → DM', icon: Send, description: 'Envia apenas DM para quem comenta em um post específico', category: 'post', hasDualAction: false },
  { value: 'story_reply', label: 'Resposta de Story', icon: Eye, description: 'Responde menções em stories (resposta + DM opcional)', category: 'story', hasDualAction: true },
  { value: 'story_mention_dm', label: 'Menção em Story → DM', icon: Send, description: 'Envia apenas DM quando mencionam em story', category: 'story', hasDualAction: false },
  { value: 'specific_story_reply', label: 'Story Específico', icon: Eye, description: 'Responde a reações/respostas de um story específico (resposta + DM opcional)', category: 'story', hasDualAction: true },
];

type AutomationCategory = 'all' | 'dm' | 'post' | 'story';
const automationCategories: { value: AutomationCategory; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'dm', label: 'DM' },
  { value: 'post', label: 'Posts' },
  { value: 'story', label: 'Stories' },
];

const INSTAGRAM_APP_ID = "1231864369151883";
const INSTAGRAM_SCOPES = "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments";

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
  const OAUTH_REDIRECT_URI = 'https://site.agsell.com.br/instagram';

  // Listen for OAuth callback
  React.useEffect(() => {
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash.replace(/^#\/?/, '');
      const hashParams = new URLSearchParams(hash);

      const code = params.get('code') || hashParams.get('code');
      const state = params.get('state') || hashParams.get('state');
      const error = params.get('error') || hashParams.get('error');
      const errorDescription =
        params.get('error_description') ||
        hashParams.get('error_description') ||
        params.get('error_reason') ||
        hashParams.get('error_reason');

      if (!code && !error) return;

      if (error) {
        sessionStorage.removeItem('ig_oauth_state');
        window.history.replaceState({}, '', window.location.pathname);
        toast({
          title: 'Conexão cancelada',
          description: errorDescription || 'Você cancelou a conexão com o Facebook.',
          variant: 'destructive'
        });
        return;
      }

      if (!code) {
        sessionStorage.removeItem('ig_oauth_state');
        window.history.replaceState({}, '', window.location.pathname);
        toast({ title: 'Erro ao conectar', description: 'Callback OAuth inválido.', variant: 'destructive' });
        return;
      }

      const savedState = sessionStorage.getItem('ig_oauth_state');
      if (!savedState) {
        window.history.replaceState({}, '', window.location.pathname);
        toast({
          title: 'Sessão expirada',
          description: 'A sessão de conexão expirou. Clique em conectar novamente.',
          variant: 'destructive'
        });
        return;
      }

      // Alguns fluxos do Instagram podem não retornar `state`; validamos apenas quando ele vem no callback.
      if (state && state !== savedState) {
        sessionStorage.removeItem('ig_oauth_state');
        window.history.replaceState({}, '', window.location.pathname);
        toast({ title: 'Erro de segurança', description: 'Estado OAuth inválido. Tente novamente.', variant: 'destructive' });
        return;
      }

      // Aguarda organização carregar antes de enviar o callback para backend
      if (!currentOrganization?.id) return;

      setLoading(true);
      try {
        const { data, error: fnError } = await supabase.functions.invoke('instagram-oauth', {
          body: {
            code,
            redirect_uri: OAUTH_REDIRECT_URI,
            organization_id: currentOrganization.id,
          },
        });

        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);

        sessionStorage.removeItem('ig_oauth_state');
        window.history.replaceState({}, '', window.location.pathname);

        toast({
          title: data.updated ? '🔄 Conta reconectada!' : '✅ Conta conectada!',
          description: `@${data.account.username} vinculada com sucesso.`,
        });
        onConnected();
      } catch (err: any) {
        window.history.replaceState({}, '', window.location.pathname);
        toast({ title: 'Erro ao conectar', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    handleOAuthCallback();
  }, [currentOrganization?.id, onConnected, toast]);

  const handleInstagramLogin = () => {
    const state = crypto.randomUUID();
    sessionStorage.setItem('ig_oauth_state', state);
    const igUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(OAUTH_REDIRECT_URI)}&response_type=code&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(INSTAGRAM_SCOPES)}`;
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

/* ─── Painel de Histórico de Broadcasts ─── */
function BroadcastHistory({ organizationId }: { organizationId?: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: broadcasts, isLoading } = useQuery({
    queryKey: ['instagram_broadcasts', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_dm_broadcasts' as any)
        .select('*')
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!organizationId,
    refetchInterval: 5000,
  });

  const { data: recipients } = useQuery({
    queryKey: ['broadcast_recipients', expandedId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_dm_broadcast_recipients' as any)
        .select('*')
        .eq('broadcast_id', expandedId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!expandedId,
    refetchInterval: 3000,
  });

  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (!broadcasts?.length) return null;

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    queued: { label: 'Na fila', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: <Clock className="h-3 w-3" /> },
    processing: { label: 'Enviando', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    completed: { label: 'Concluído', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: <CheckCircle2 className="h-3 w-3" /> },
    failed: { label: 'Falhou', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: <XCircle className="h-3 w-3" /> },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Histórico de Envios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {broadcasts.map((b: any) => {
          const status = statusConfig[b.status] || statusConfig.queued;
          const isExpanded = expandedId === b.id;
          return (
            <div key={b.id} className="border rounded-lg">
              <button
                className="w-full flex items-center justify-between p-3 hover:bg-accent/50 text-left"
                onClick={() => setExpandedId(isExpanded ? null : b.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {status.icon}
                    {status.label}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm truncate max-w-[300px]">{b.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(b.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      {' · '}{b.target_type === 'all' ? 'Todos' : `${b.total_recipients} selecionados`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                  <span className="text-green-600 dark:text-green-400">{b.sent_count} enviadas</span>
                  {b.failed_count > 0 && <span className="text-red-600 dark:text-red-400">{b.failed_count} falhas</span>}
                  <ArrowRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-3 py-2 space-y-1 max-h-48 overflow-y-auto bg-muted/30">
                  {!recipients?.length ? (
                    <p className="text-xs text-muted-foreground py-2 text-center">
                      {b.target_type === 'all' ? 'Envio para todos — detalhes individuais não disponíveis.' : 'Carregando destinatários...'}
                    </p>
                  ) : (
                    recipients.map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between py-1.5 text-sm">
                        <span className="font-medium">@{r.username}</span>
                        <div className="flex items-center gap-1">
                          {r.status === 'pending' && <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>}
                          {r.status === 'sent' && <Badge variant="default" className="text-xs bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Enviada</Badge>}
                          {r.status === 'failed' && (
                            <Badge variant="destructive" className="text-xs" title={r.error_message}>
                              <XCircle className="h-3 w-3 mr-1" /> Falhou
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ─── Seletor de Seguidores com Autocomplete ─── */
export interface FollowerEntry {
  username: string;
  instagram_user_id?: string;
}

function FollowerSelector({
  selectedFollowers,
  setSelectedFollowers,
  followerSearch,
  setFollowerSearch,
  organizationId,
}: {
  selectedFollowers: FollowerEntry[];
  setSelectedFollowers: React.Dispatch<React.SetStateAction<FollowerEntry[]>>;
  followerSearch: string;
  setFollowerSearch: React.Dispatch<React.SetStateAction<string>>;
  organizationId?: string;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch contacts from CRM that could be Instagram users
  const { data: crmContacts } = useQuery({
    queryKey: ['crm_contacts_ig_suggest', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, source')
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Fetch contacts from instagram automation logs (interaction history) — these have IGSIDs
  const { data: interactionContacts } = useQuery({
    queryKey: ['ig_interaction_contacts', organizationId],
    queryFn: async () => {
      const map = new Map<string, string | undefined>();

      // Source 1: automation logs
      const { data: logs } = await supabase
        .from('instagram_automation_logs')
        .select('event_data, contact_id')
        .order('created_at', { ascending: false })
        .limit(200);
      
      logs?.forEach(log => {
        const ed = log.event_data as Record<string, unknown>;
        const username = (ed?.username || ed?.from_username) as string | undefined;
        const igId = (ed?.from_id || ed?.sender_id || ed?.user_id) as string | undefined;
        if (username && typeof username === 'string') {
          if (!map.has(username.toLowerCase()) || (igId && !map.get(username.toLowerCase()))) {
            map.set(username.toLowerCase(), igId);
          }
        }
      });

      // Source 2: previously discovered IGSIDs from broadcast recipients
      const { data: pastRecipients } = await supabase
        .from('instagram_dm_broadcast_recipients' as any)
        .select('username, instagram_user_id')
        .not('instagram_user_id', 'is', null)
        .limit(500);

      (pastRecipients as any[])?.forEach((r: any) => {
        const u = (r.username as string).toLowerCase();
        if (!map.has(u) || (!map.get(u) && r.instagram_user_id)) {
          map.set(u, r.instagram_user_id);
        }
      });

      return Array.from(map.entries()).map(([username, igId]) => ({ username, instagram_user_id: igId }));
    },
    enabled: !!organizationId,
  });

  // Build suggestion list
  const suggestions = React.useMemo(() => {
    const items: { username: string; instagram_user_id?: string; label: string; source: 'crm' | 'interaction' | 'manual'; hasIgId: boolean }[] = [];
    const seen = new Set<string>();

    // From interaction history (prioritize — these may have IGSIDs)
    interactionContacts?.forEach(({ username, instagram_user_id }) => {
      if (!seen.has(username.toLowerCase())) {
        seen.add(username.toLowerCase());
        items.push({ username, instagram_user_id, label: `@${username}`, source: 'interaction', hasIgId: !!instagram_user_id });
      }
    });

    // From CRM contacts (use first_name as pseudo-username if source is instagram)
    crmContacts?.forEach(contact => {
      const name = `${contact.first_name}${contact.last_name ? ' ' + contact.last_name : ''}`;
      if (contact.source === 'instagram' && !seen.has(contact.first_name.toLowerCase())) {
        seen.add(contact.first_name.toLowerCase());
        items.push({ username: contact.first_name, label: `@${contact.first_name} (${name})`, source: 'crm', hasIgId: false });
      }
    });

    return items;
  }, [crmContacts, interactionContacts]);

  const searchTerm = followerSearch.replace(/^@/, '').toLowerCase();
  const filteredSuggestions = searchTerm
    ? suggestions.filter(s => 
        s.username.toLowerCase().includes(searchTerm) && 
        !selectedFollowers.some(f => f.username === s.username)
      )
    : [];

  const addFollower = (username: string, instagram_user_id?: string) => {
    const clean = username.trim().replace(/^@/, '');
    if (clean && !selectedFollowers.some(f => f.username === clean)) {
      setSelectedFollowers(prev => [...prev, { username: clean, instagram_user_id }]);
    }
    setFollowerSearch('');
    setShowSuggestions(false);
  };

  const hasNoIgId = selectedFollowers.some(f => !f.instagram_user_id);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Adicionar seguidores</Label>
        <div className="relative">
          <div className="flex gap-2">
            <Input
              value={followerSearch}
              onChange={e => {
                setFollowerSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="@username — digite para buscar"
              onKeyDown={e => {
                if (e.key === 'Enter' && followerSearch.trim()) {
                  e.preventDefault();
                  addFollower(followerSearch);
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => addFollower(followerSearch)}
              disabled={!followerSearch.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Autocomplete dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
              {filteredSuggestions.slice(0, 10).map(suggestion => (
                <button
                  key={suggestion.username}
                  type="button"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left"
                  onMouseDown={e => {
                    e.preventDefault();
                    addFollower(suggestion.username, suggestion.instagram_user_id);
                  }}
                >
                  <Instagram className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{suggestion.label}</span>
                  <div className="ml-auto flex items-center gap-1">
                    {suggestion.hasIgId && (
                      <Badge variant="default" className="text-[10px] h-5 bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-0.5" /> IGSID
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] h-5">
                      {suggestion.source === 'interaction' ? 'Interação' : 'CRM'}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Priorize contatos com badge <strong>IGSID</strong> — são usuários que já interagiram com sua conta e podem receber DMs.
        </p>
      </div>

      {selectedFollowers.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {selectedFollowers.map(({ username, instagram_user_id }) => (
              <Badge key={username} variant={instagram_user_id ? 'secondary' : 'outline'} className={`gap-1 pr-1 ${!instagram_user_id ? 'border-yellow-400 dark:border-yellow-600' : ''}`}>
                @{username}
                {!instagram_user_id && <span className="text-yellow-600 dark:text-yellow-400 text-[10px]">⚠</span>}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => setSelectedFollowers(prev => prev.filter(u => u.username !== username))}
                >
                  <XCircle className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-destructive"
              onClick={() => setSelectedFollowers([])}
            >
              Limpar todos
            </Button>
          </div>
          {hasNoIgId && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              ⚠️ Destinatários sem IGSID podem falhar. A API do Instagram só permite enviar DMs para usuários que já interagiram com sua conta.
            </p>
          )}
        </div>
      )}
    </div>
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
  const disconnectAccount = useDisconnectInstagramAccount();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAutomation, setNewAutomation] = useState({
    name: '',
    description: '',
    automation_type: 'dm_reply',
    trigger_keywords: '',
    response_message: '',
    dm_message: '',
    send_dm_too: false,
    target_post_url: '',
    target_story_url: '',
  });
  const [typeFilter, setTypeFilter] = useState<AutomationCategory>('all');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'selected'>('all');
  const [selectedFollowers, setSelectedFollowers] = useState<FollowerEntry[]>([]);
  const [followerSearch, setFollowerSearch] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  const maxInstagramAccounts = currentPlan?.max_instagram_accounts ?? 1;
  const canAddMoreAccounts = maxInstagramAccounts === -1 || (accounts?.length ?? 0) < maxInstagramAccounts;
  const hasAccounts = !!accounts?.length;

  const handleCreateAutomation = () => {
    if (!currentOrganization || !user || !accounts?.length) return;
    const isPostSpecific = ['specific_post_comment', 'specific_post_to_dm'].includes(newAutomation.automation_type);
    const isStorySpecific = newAutomation.automation_type === 'specific_story_reply';
    const isDmOnlyType = ['comment_to_dm', 'specific_post_to_dm', 'story_mention_dm'].includes(newAutomation.automation_type);
    const typeInfo = automationTypes.find(t => t.value === newAutomation.automation_type);
    const hasDual = typeInfo?.hasDualAction && newAutomation.send_dm_too;

    const actions: { type: string; content: string }[] = [];

    if (isDmOnlyType) {
      actions.push({ type: 'send_dm', content: newAutomation.response_message });
    } else {
      actions.push({ type: 'reply', content: newAutomation.response_message });
      if (hasDual && newAutomation.dm_message) {
        actions.push({ type: 'send_dm', content: newAutomation.dm_message });
      }
    }

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
      actions,
      created_by: user.id,
    } as any, {
      onSuccess: () => {
        setShowCreateDialog(false);
        setNewAutomation({ name: '', description: '', automation_type: 'dm_reply', trigger_keywords: '', response_message: '', dm_message: '', send_dm_too: false, target_post_url: '', target_story_url: '' });
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
          <TabsTrigger value="broadcast" className="gap-2"><Megaphone className="h-4 w-4" /> DM em Massa</TabsTrigger>
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
                    <Label>
                      {['comment_to_dm', 'specific_post_to_dm', 'story_mention_dm', 'dm_reply', 'first_dm'].includes(newAutomation.automation_type)
                        ? 'Mensagem da DM'
                        : 'Mensagem de resposta (comentário/story)'}
                    </Label>
                    <Textarea
                      value={newAutomation.response_message}
                      onChange={e => setNewAutomation(prev => ({ ...prev, response_message: e.target.value }))}
                      placeholder={['comment_to_dm', 'specific_post_to_dm', 'story_mention_dm', 'dm_reply', 'first_dm'].includes(newAutomation.automation_type)
                        ? 'Olá! Obrigado pelo interesse...'
                        : 'Obrigado pelo comentário! 🎉'}
                      rows={3}
                    />
                  </div>

                  {/* Dual action: also send DM */}
                  {automationTypes.find(t => t.value === newAutomation.automation_type)?.hasDualAction && (
                    <>
                      <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/50">
                        <Switch
                          checked={newAutomation.send_dm_too}
                          onCheckedChange={v => setNewAutomation(prev => ({ ...prev, send_dm_too: v }))}
                        />
                        <div>
                          <Label className="cursor-pointer">Enviar DM também</Label>
                          <p className="text-xs text-muted-foreground">Além de responder, envia uma mensagem privada ao usuário.</p>
                        </div>
                      </div>
                      {newAutomation.send_dm_too && (
                        <div className="space-y-2">
                          <Label>Mensagem da DM</Label>
                          <Textarea
                            value={newAutomation.dm_message}
                            onChange={e => setNewAutomation(prev => ({ ...prev, dm_message: e.target.value }))}
                            placeholder="Oi! Vi que você comentou no nosso post. Posso te ajudar?"
                            rows={3}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
                  <Button onClick={handleCreateAutomation} disabled={!newAutomation.name || !newAutomation.response_message || (newAutomation.send_dm_too && !newAutomation.dm_message) || createAutomation.isPending}>
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

        {/* DM em Massa */}
        <TabsContent value="broadcast" className="space-y-4">
          {/* Histórico de envios */}
          <BroadcastHistory organizationId={currentOrganization?.id} />

          {/* Novo envio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Novo Envio
              </CardTitle>
              <CardDescription>
                Envie mensagens diretas para seus seguidores — todos de uma vez ou selecionando individualmente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Destinatários</Label>
                <Select value={broadcastTarget} onValueChange={(v: 'all' | 'selected') => setBroadcastTarget(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Todos os seguidores</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="selected">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        <span>Selecionar individualmente</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {broadcastTarget === 'selected' && (
                <FollowerSelector
                  selectedFollowers={selectedFollowers}
                  setSelectedFollowers={setSelectedFollowers}
                  followerSearch={followerSearch}
                  setFollowerSearch={setFollowerSearch}
                  organizationId={currentOrganization?.id}
                />
              )}

              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  placeholder="Olá! Temos uma novidade especial para você..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  {broadcastMessage.length}/1000 caracteres
                </p>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30 p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ <strong>Atenção:</strong> O envio em massa respeita os limites da API do Instagram. 
                  Mensagens são enviadas com intervalo para evitar bloqueios. 
                  {broadcastTarget === 'selected' && selectedFollowers.length > 0 && (
                    <> Serão enviadas para <strong>{selectedFollowers.length}</strong> seguidores selecionados.</>
                  )}
                </p>
              </div>

              <Button
                className="w-full gap-2"
                disabled={
                  !broadcastMessage.trim() || 
                  broadcastMessage.length > 1000 ||
                  isSendingBroadcast ||
                  (broadcastTarget === 'selected' && selectedFollowers.length === 0) ||
                  !accounts?.length
                }
                onClick={async () => {
                  const targets = broadcastTarget === 'all' ? 'todos os seguidores' : `${selectedFollowers.length} seguidores selecionados`;
                  if (!window.confirm(`Enviar DM para ${targets}? Esta ação não pode ser desfeita.`)) return;
                  if (!currentOrganization || !user || !accounts?.length) return;

                  setIsSendingBroadcast(true);
                  try {
                    const { data: broadcast, error: insertError } = await supabase
                      .from('instagram_dm_broadcasts' as any)
                      .insert({
                        organization_id: currentOrganization.id,
                        instagram_account_id: accounts[0].id,
                        message: broadcastMessage,
                        target_type: broadcastTarget,
                        total_recipients: broadcastTarget === 'selected' ? selectedFollowers.length : 0,
                        created_by: user.id,
                      } as any)
                      .select()
                      .single();

                    if (insertError) throw insertError;

                    if (broadcastTarget === 'selected' && selectedFollowers.length > 0) {
                      const recipients = selectedFollowers.map(entry => ({
                        broadcast_id: (broadcast as any).id,
                        username: entry.username,
                        instagram_user_id: entry.instagram_user_id || null,
                      }));
                      const { error: recipError } = await supabase
                        .from('instagram_dm_broadcast_recipients' as any)
                        .insert(recipients as any);
                      if (recipError) throw recipError;
                    }

                    supabase.functions.invoke('send-instagram-dm', {
                      body: { broadcast_id: (broadcast as any).id },
                    });

                    toast({
                      title: 'Envio iniciado',
                      description: `As DMs foram enfileiradas para ${targets}. Acompanhe o status acima.`,
                    });

                    setBroadcastMessage('');
                    setSelectedFollowers([]);
                    queryClient.invalidateQueries({ queryKey: ['instagram_broadcasts'] });
                  } catch (err: any) {
                    toast({
                      title: 'Erro ao criar envio',
                      description: err.message || 'Tente novamente',
                      variant: 'destructive',
                    });
                  } finally {
                    setIsSendingBroadcast(false);
                  }
                }}
              >
                {isSendingBroadcast ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="h-4 w-4" /> Enviar DMs</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

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
                <div className="flex items-center gap-2">
                  <Badge variant={account.is_active ? 'default' : 'secondary'}>
                    {account.is_active ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Conectada</> : <><XCircle className="h-3 w-3 mr-1" /> Inativa</>}
                  </Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={disconnectAccount.isPending}
                    onClick={() => {
                      if (window.confirm(`Desconectar @${account.username}? Todas as automações dessa conta serão excluídas.`)) {
                        disconnectAccount.mutate(account.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Desconectar
                  </Button>
                </div>
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
