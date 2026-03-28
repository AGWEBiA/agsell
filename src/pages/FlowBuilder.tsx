import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAutomations } from '@/hooks/useAutomations';
import { useFlowNodeAnalytics } from '@/hooks/useFlowNodeAnalytics';
import { useForms } from '@/hooks/useForms';
import { useGatewayProducts } from '@/hooks/useGatewayProducts';
import { cn } from '@/lib/utils';
import type { Json } from '@/integrations/supabase/types';
import {
  ArrowLeft, Plus, Save, Trash2,
  Zap, MessageSquare, Mail, Instagram, Send,
  Heart, Eye, UserPlus, MessageCircle, Sparkles,
  Tag, Star, Bell, Clock, CheckSquare, GitBranch,
  Settings, X, Play, Pause, MoreVertical,
  Workflow, Timer, Flame, MailCheck, Filter, Code,
  Copy, Share2, StickyNote, Volume2, Split,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  type FlowNode, type FlowConnection,
  triggerOptions, actionOptions, conditionOptions, triggerTypeMap,
  TEMPLATE_VARIABLES, WEEKDAYS, nodeCategories, flowTemplates,
} from '@/components/flow-builder/flowNodeTypes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimerNodeConfig } from '@/components/flow-builder/TimerNodeConfig';
import { WarmupNodeConfig } from '@/components/flow-builder/WarmupNodeConfig';
import { EmailNodeConfig } from '@/components/flow-builder/EmailNodeConfig';
import { TagFilterNodeConfig } from '@/components/flow-builder/TagFilterNodeConfig';
import { WhatsAppNodeConfig } from '@/components/flow-builder/WhatsAppNodeConfig';
import { WhatsAppGroupNodeConfig } from '@/components/flow-builder/WhatsAppGroupNodeConfig';
import { WhatsAppGroupAddNodeConfig } from '@/components/flow-builder/WhatsAppGroupAddNodeConfig';
import { InstagramNodeConfig } from '@/components/flow-builder/InstagramNodeConfig';
import { ConditionalNodeConfig } from '@/components/flow-builder/ConditionalNodeConfig';
import { EmailTemplateEditor } from '@/components/email/EmailTemplateEditor';
import { FlowCanvas } from '@/components/flow-builder/FlowCanvas';

import { FlowNodeAnalyticsOverlay } from '@/components/automations/FlowNodeAnalyticsOverlay';
import type { FlowNodeAnalytic } from '@/hooks/useFlowNodeAnalytics';

// ─── New Campaign Modal with Import Code support ───
function NewCampaignModal({ open, onClose, onCreate, onImportCode }: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, method: 'blank' | 'template' | 'code', templateId?: string) => void;
  onImportCode?: (name: string, code: string) => void;
}) {
  const [name, setName] = useState('');
  const [importCode, setImportCode] = useState('');
  const [showImport, setShowImport] = useState(false);

  const handleImport = () => {
    if (!importCode.trim()) return;
    try {
      const decoded = JSON.parse(atob(importCode.trim()));
      if (onImportCode) onImportCode(name || decoded.name || 'Fluxo Importado', importCode.trim());
      onClose();
    } catch {
      try {
        JSON.parse(importCode.trim());
        if (onImportCode) onImportCode(name || 'Fluxo Importado', importCode.trim());
        onClose();
      } catch {
        alert('Código inválido. Verifique e tente novamente.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova campanha</DialogTitle>
          <DialogDescription>Crie um novo fluxo de automação</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input placeholder="Nome do fluxo" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <Tabs defaultValue="create">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Criar campanha</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>
            <TabsContent value="create" className="space-y-3 mt-3">
              <button
                onClick={() => onCreate(name || 'Meu Fluxo', 'blank')}
                className="w-full flex items-center gap-3 p-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center shrink-0">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Campanha em branco</p>
                  <p className="text-xs opacity-80">Crie uma campanha nova, sem nenhuma predefinição</p>
                </div>
              </button>
              <button
                onClick={() => setShowImport(!showImport)}
                className="w-full flex items-center gap-3 p-4 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Code className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Via código</p>
                  <p className="text-xs text-muted-foreground">Cole o código de outro fluxo para duplicar</p>
                </div>
              </button>
              {showImport && (
                <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                  <Label className="text-xs">Código do fluxo</Label>
                  <Textarea rows={4} placeholder="Cole o código aqui..." value={importCode} onChange={e => setImportCode(e.target.value)} className="text-xs font-mono" />
                  <Button size="sm" className="w-full" onClick={handleImport} disabled={!importCode.trim()}>Importar Fluxo</Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="templates" className="space-y-2 mt-3">
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2 pr-2">
                  {flowTemplates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => onCreate(name || t.name, 'template', t.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-colors text-left"
                    >
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onCreate(name || 'Meu Fluxo', 'blank')}>
            <Plus className="h-4 w-4 mr-2" />Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Node Config Dialog ───
function NodeConfigDialog({ node, open, onClose, onSave }: {
  node: FlowNode | null;
  open: boolean;
  onClose: () => void;
  onSave: (config: Record<string, unknown>) => void;
}) {
  const [config, setConfig] = useState<Record<string, unknown>>(node?.config || {});
  const [showEmailEditor, setShowEmailEditor] = useState(false);
  const { forms } = useForms();
  const { automations } = useAutomations();
  const { data: gatewayProducts = [] } = useGatewayProducts(String(config.gateway || 'any'));

  useEffect(() => { if (node) setConfig(node.config); }, [node]);

  useEffect(() => {
    if (config._editing_template) {
      setShowEmailEditor(true);
      setConfig(prev => { const { _editing_template, ...rest } = prev; return rest; });
    }
  }, [config._editing_template]);
  if (!node) return null;

  const contactSources = ['website', 'landing_page', 'formulario', 'whatsapp', 'instagram', 'indicacao', 'evento', 'ads', 'importacao', 'outro'];

  const renderFields = () => {
    switch (node.subtype) {
      case 'timer':
        return <TimerNodeConfig config={config} onChange={setConfig} />;
      case 'warmup':
        return <WarmupNodeConfig config={config} onChange={setConfig} />;
      case 'send_email_marketing':
        return <EmailNodeConfig config={config} onChange={setConfig} mode="marketing" />;
      case 'send_email_performance':
        return <EmailNodeConfig config={config} onChange={setConfig} mode="performance" />;
      case 'tag_filter':
        return <TagFilterNodeConfig config={config} onChange={setConfig} />;
      case 'send_whatsapp':
      case 'send_dm':
      case 'reply_comment':
        return <WhatsAppNodeConfig config={config} onChange={setConfig} />;
      case 'send_whatsapp_group':
        return <WhatsAppGroupNodeConfig config={config} onChange={setConfig} />;
      case 'add_to_whatsapp_group':
        return <WhatsAppGroupAddNodeConfig config={config} onChange={setConfig} />;
      case 'send_instagram_dm':
      case 'send_instagram_comment_reply':
      case 'send_instagram_story_reply':
      case 'instagram_like_comment':
      case 'instagram_follow_back':
        return <InstagramNodeConfig config={config} onChange={setConfig} subtype={node.subtype} />;
      case 'conditional':
      case 'if_tag':
      case 'if_keyword':
      case 'if_score':
        return <ConditionalNodeConfig config={config} onChange={setConfig} subtype={node.subtype} />;
      case 'instagram_comment':
        return (<div className="space-y-4"><div><Label>Palavra-chave (opcional)</Label><Input placeholder="Ex: INFO, QUERO, PROMO" value={String(config.keyword || '')} onChange={e => setConfig({ ...config, keyword: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">Deixe vazio para ativar com qualquer comentário</p></div></div>);
      case 'instagram_dm':
        return (<div className="space-y-4"><div><Label>Palavra-chave (opcional)</Label><Input placeholder="Ex: INFO, QUERO, PROMO" value={String(config.keyword || '')} onChange={e => setConfig({ ...config, keyword: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">Deixe vazio para ativar com qualquer DM</p></div></div>);
      case 'instagram_dm_keyword':
        return (<div className="space-y-4"><div><Label>Palavra-chave *</Label><Input placeholder="Ex: QUERO, INFO, PREÇO" value={String(config.keyword || '')} onChange={e => setConfig({ ...config, keyword: e.target.value })} /></div><div><Label>Correspondência</Label><Select value={String(config.match_type || 'contains')} onValueChange={v => setConfig({ ...config, match_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="contains">Contém</SelectItem><SelectItem value="exact">Exata</SelectItem><SelectItem value="starts_with">Começa com</SelectItem></SelectContent></Select></div></div>);
      case 'instagram_comment_keyword':
        return (<div className="space-y-4"><div><Label>Palavra-chave *</Label><Input placeholder="Ex: EU QUERO, INFO" value={String(config.keyword || '')} onChange={e => setConfig({ ...config, keyword: e.target.value })} /></div><div><Label>Correspondência</Label><Select value={String(config.match_type || 'contains')} onValueChange={v => setConfig({ ...config, match_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="contains">Contém</SelectItem><SelectItem value="exact">Exata</SelectItem><SelectItem value="starts_with">Começa com</SelectItem></SelectContent></Select></div><div><Label>URL do Post (opcional)</Label><Input placeholder="https://www.instagram.com/p/..." value={String(config.post_url || '')} onChange={e => setConfig({ ...config, post_url: e.target.value })} /></div></div>);
      case 'instagram_specific_post':
        return (<div className="space-y-4"><div><Label>URL do Post *</Label><Input placeholder="https://www.instagram.com/p/..." value={String(config.post_url || '')} onChange={e => setConfig({ ...config, post_url: e.target.value })} /></div><div><Label>Palavra-chave (opcional)</Label><Input placeholder="Ex: QUERO" value={String(config.keyword || '')} onChange={e => setConfig({ ...config, keyword: e.target.value })} /></div></div>);
      case 'instagram_story_reply':
        return (<div className="space-y-4"><div><Label>URL do Story (opcional)</Label><Input placeholder="https://www.instagram.com/stories/..." value={String(config.story_url || '')} onChange={e => setConfig({ ...config, story_url: e.target.value })} /></div><div><Label>Tipo de resposta</Label><Select value={String(config.reply_type || 'any')} onValueChange={v => setConfig({ ...config, reply_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="any">Qualquer resposta</SelectItem><SelectItem value="text">Texto</SelectItem><SelectItem value="reaction">Reação (emoji)</SelectItem><SelectItem value="quick_reply">Resposta rápida</SelectItem></SelectContent></Select></div></div>);
      case 'instagram_story_specific':
        return (<div className="space-y-4"><div><Label>URL ou ID do Story *</Label><Input placeholder="https://www.instagram.com/stories/usuario/123..." value={String(config.story_url || '')} onChange={e => setConfig({ ...config, story_url: e.target.value })} /></div><div><Label>Tipo de interação</Label><Select value={String(config.interaction_type || 'any')} onValueChange={v => setConfig({ ...config, interaction_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="any">Qualquer interação</SelectItem><SelectItem value="reply">Resposta</SelectItem><SelectItem value="reaction">Reação</SelectItem><SelectItem value="mention">Menção</SelectItem></SelectContent></Select></div></div>);
      case 'instagram_new_follower':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Este gatilho é acionado automaticamente quando alguém começa a seguir seu perfil.</p><div><Label>Tag automática (opcional)</Label><Input placeholder="Ex: novo_seguidor" value={String(config.auto_tag || '')} onChange={e => setConfig({ ...config, auto_tag: e.target.value })} /></div></div>);
      case 'instagram_mention':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando alguém menciona seu perfil (@usuario) nos stories.</p><div><Label>Palavra-chave na menção (opcional)</Label><Input placeholder="Ex: recomendo, amei" value={String(config.keyword || '')} onChange={e => setConfig({ ...config, keyword: e.target.value })} /></div></div>);
      case 'instagram_share_dm':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando alguém compartilha seu conteúdo via DM.</p><div><Label>Tipo de conteúdo</Label><Select value={String(config.content_type || 'any')} onValueChange={v => setConfig({ ...config, content_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="any">Qualquer conteúdo</SelectItem><SelectItem value="post">Post</SelectItem><SelectItem value="reel">Reel</SelectItem><SelectItem value="story">Story</SelectItem></SelectContent></Select></div></div>);
      case 'instagram_ref_url':
        return (<div className="space-y-4"><div><Label>Ref URL *</Label><Input placeholder="https://ig.me/m/seuusuario?ref=campanha1" value={String(config.ref_url || '')} onChange={e => setConfig({ ...config, ref_url: e.target.value })} /></div><div><Label>Parâmetro REF</Label><Input placeholder="Ex: campanha1, promo_verao" value={String(config.ref_param || '')} onChange={e => setConfig({ ...config, ref_param: e.target.value })} /></div></div>);
      case 'instagram_ads':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando alguém clica em um anúncio Click-to-Instagram Direct.</p><div><Label>ID do Anúncio (opcional)</Label><Input placeholder="Ex: 23851234567890" value={String(config.ad_id || '')} onChange={e => setConfig({ ...config, ad_id: e.target.value })} /></div></div>);
      case 'whatsapp_received':
        return (<div className="space-y-4"><div><Label>Palavra-chave (opcional)</Label><Input placeholder="Ex: OLÁ, AJUDA" value={String(config.keyword || '')} onChange={e => setConfig({ ...config, keyword: e.target.value })} /></div></div>);
      case 'whatsapp_keyword':
        return (<div className="space-y-4"><div><Label>Palavra-chave *</Label><Input placeholder="Ex: INFO, QUERO, PROMO" value={String(config.keyword || '')} onChange={e => setConfig({ ...config, keyword: e.target.value })} /></div><div><Label>Correspondência</Label><Select value={String(config.match_type || 'contains')} onValueChange={v => setConfig({ ...config, match_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="contains">Contém</SelectItem><SelectItem value="exact">Exata</SelectItem><SelectItem value="starts_with">Começa com</SelectItem></SelectContent></Select></div></div>);
      case 'whatsapp_automation':
        return (<div className="space-y-4"><div><Label>Automação de origem *</Label><Select value={String(config.source_automation_id || '')} onValueChange={v => setConfig({ ...config, source_automation_id: v })}><SelectTrigger><SelectValue placeholder="Selecione uma automação" /></SelectTrigger><SelectContent>{automations.filter(a => a.trigger_type?.includes('whatsapp')).map(a => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}</SelectContent></Select></div></div>);
      case 'whatsapp_message_source':
        return (<div className="space-y-4"><div><Label>Tipo de origem</Label><Select value={String(config.message_source_type || 'organic')} onValueChange={v => setConfig({ ...config, message_source_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="organic">Orgânica</SelectItem><SelectItem value="ads">Via Anúncio (Click-to-WhatsApp)</SelectItem><SelectItem value="qr_code">QR Code</SelectItem><SelectItem value="link">Link direto (wa.me)</SelectItem></SelectContent></Select></div></div>);
      case 'contact_created':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando um novo contato é criado no CRM.</p></div>);
      case 'contact_source':
        return (<div className="space-y-4"><div><Label>Fonte do contato</Label><Select value={String(config.contact_source || '')} onValueChange={v => setConfig({ ...config, contact_source: v })}><SelectTrigger><SelectValue placeholder="Selecione a fonte" /></SelectTrigger><SelectContent>{contactSources.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select></div></div>);
      case 'form_submitted':
        return (<div className="space-y-4"><div><Label>Formulário</Label><Select value={String(config.form_id || '')} onValueChange={v => { const f = forms?.find(f => f.id === v); setConfig({ ...config, form_id: v, form_name: f?.title || '' }); }}><SelectTrigger><SelectValue placeholder="Selecione um formulário" /></SelectTrigger><SelectContent>{forms?.map(f => (<SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>)) || []}</SelectContent></Select></div></div>);
      case 'page_visited':
        return (<div className="space-y-4"><div><Label>URL da Página *</Label><Input placeholder="https://seusite.com/pagina" value={String(config.page_url || '')} onChange={e => setConfig({ ...config, page_url: e.target.value })} /></div><div><Label>Correspondência</Label><Select value={String(config.url_match || 'exact')} onValueChange={v => setConfig({ ...config, url_match: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="exact">URL Exata</SelectItem><SelectItem value="contains">Contém</SelectItem><SelectItem value="starts_with">Começa com</SelectItem></SelectContent></Select></div></div>);
      case 'site_event':
        return (<div className="space-y-4"><div><Label>Nome do Evento *</Label><Input placeholder="Ex: button_click, video_play" value={String(config.event_name || '')} onChange={e => setConfig({ ...config, event_name: e.target.value })} /></div></div>);
      case 'gateway_purchase_approved':
      case 'gateway_boleto_generated':
      case 'gateway_boleto_paid':
      case 'gateway_pix_generated':
      case 'gateway_refund':
      case 'gateway_chargeback':
      case 'gateway_subscription_canceled':
      case 'gateway_cart_abandoned':
        return (<div className="space-y-4"><div><Label>Gateway</Label><Select value={String(config.gateway || 'any')} onValueChange={v => setConfig({ ...config, gateway: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="any">Qualquer gateway</SelectItem><SelectItem value="hotmart">Hotmart</SelectItem><SelectItem value="kiwify">Kiwify</SelectItem><SelectItem value="eduzz">Eduzz</SelectItem><SelectItem value="stripe">Stripe</SelectItem><SelectItem value="shopify">Shopify</SelectItem></SelectContent></Select></div><div><Label>Produto (opcional)</Label><Select value={String(config.product_id || 'any')} onValueChange={v => setConfig({ ...config, product_id: v })}><SelectTrigger><SelectValue placeholder="Qualquer produto" /></SelectTrigger><SelectContent><SelectItem value="any">Qualquer produto</SelectItem>{gatewayProducts.map(p => (<SelectItem key={p.id} value={p.external_product_id || p.id}>{p.name}</SelectItem>))}</SelectContent></Select></div></div>);
      case 'deal_stage_changed':
        return (<div className="space-y-4"><div><Label>Etapa de destino (opcional)</Label><Input placeholder="Ex: Proposta, Negociação" value={String(config.target_stage || '')} onChange={e => setConfig({ ...config, target_stage: e.target.value })} /></div></div>);
      case 'tag_added':
      case 'tag_removed':
        return (<div className="space-y-4"><div><Label>Nome da Tag *</Label><Input placeholder="Ex: lead_quente, comprador" value={String(config.tag_name || '')} onChange={e => setConfig({ ...config, tag_name: e.target.value })} /></div></div>);
      case 'score_threshold':
        return (<div className="space-y-4"><div><Label>Score mínimo *</Label><Input type="number" min={1} value={String(config.min_score || 50)} onChange={e => setConfig({ ...config, min_score: Number(e.target.value) })} /></div></div>);
      case 'date_trigger':
        return (<div className="space-y-4"><div><Label>Campo de data</Label><Select value={String(config.date_field || 'created_at')} onValueChange={v => setConfig({ ...config, date_field: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="created_at">Data de criação</SelectItem><SelectItem value="custom_date">Campo personalizado</SelectItem></SelectContent></Select></div></div>);
      case 'inactivity_trigger':
        return (<div className="space-y-4"><div><Label>Dias de inatividade *</Label><Input type="number" min={1} value={String(config.days || 30)} onChange={e => setConfig({ ...config, days: Number(e.target.value) })} /></div></div>);
      case 'add_tag':
      case 'remove_tag':
        return (<div className="space-y-4"><div><Label>Nome da Tag</Label><Input placeholder="Ex: lead_quente" value={String(config.tag_name || '')} onChange={e => setConfig({ ...config, tag_name: e.target.value })} /></div></div>);
      case 'update_score':
        return (<div className="space-y-4"><div><Label>Operação</Label><Select value={String(config.operation || 'add')} onValueChange={v => setConfig({ ...config, operation: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="add">Adicionar</SelectItem><SelectItem value="subtract">Subtrair</SelectItem><SelectItem value="set">Definir</SelectItem></SelectContent></Select></div><div><Label>Pontos</Label><Input type="number" value={String(config.points || 10)} onChange={e => setConfig({ ...config, points: Number(e.target.value) })} /></div></div>);
      case 'send_notification':
        return (<div className="space-y-4"><div><Label>Título</Label><Input placeholder="Notificação" value={String(config.title || '')} onChange={e => setConfig({ ...config, title: e.target.value })} /></div><div><Label>Mensagem</Label><Textarea rows={2} value={String(config.message || '')} onChange={e => setConfig({ ...config, message: e.target.value })} /></div></div>);
      case 'create_task':
        return (<div className="space-y-4"><div><Label>Título da tarefa</Label><Input value={String(config.title || '')} onChange={e => setConfig({ ...config, title: e.target.value })} /></div><div><Label>Descrição</Label><Textarea rows={2} value={String(config.description || '')} onChange={e => setConfig({ ...config, description: e.target.value })} /></div></div>);
      case 'wait':
        return (<div className="space-y-4"><div><Label>Duração</Label><Input type="number" min={1} value={String(config.duration || 1)} onChange={e => setConfig({ ...config, duration: Number(e.target.value) })} /></div><div><Label>Unidade</Label><Select value={String(config.unit || 'minutes')} onValueChange={v => setConfig({ ...config, unit: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minutes">Minutos</SelectItem><SelectItem value="hours">Horas</SelectItem><SelectItem value="days">Dias</SelectItem></SelectContent></Select></div></div>);
      case 'send_sms':
        return (<div className="space-y-4"><div><Label>Mensagem SMS</Label><Textarea rows={3} maxLength={160} placeholder="Mensagem SMS (máx 160 caracteres)" value={String(config.message || '')} onChange={e => setConfig({ ...config, message: e.target.value })} /></div><p className="text-xs text-muted-foreground">{String(config.message || '').length}/160 caracteres</p></div>);
      case 'voice_torpedo':
        return (<div className="space-y-4"><div><Label>URL do Áudio (MP3)</Label><Input placeholder="https://cdn.seusite.com/audio.mp3" value={String(config.audio_url || '')} onChange={e => setConfig({ ...config, audio_url: e.target.value })} /></div><div className="flex items-center gap-2"><Switch checked={!!config.retry_on_busy} onCheckedChange={v => setConfig({ ...config, retry_on_busy: v })} /><Label>Tentar novamente se ocupado</Label></div></div>);
      case 'send_voip_call':
        return (<div className="space-y-4"><div><Label>Ação ao atender</Label><Select value={String(config.on_answer || 'play_audio')} onValueChange={v => setConfig({ ...config, on_answer: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="play_audio">Reproduzir áudio</SelectItem><SelectItem value="connect_agent">Conectar ao atendente</SelectItem></SelectContent></Select></div>{(config.on_answer || 'play_audio') === 'play_audio' && (<div><Label>URL do Áudio (MP3)</Label><Input placeholder="https://cdn.seusite.com/audio.mp3" value={String(config.audio_url || '')} onChange={e => setConfig({ ...config, audio_url: e.target.value })} /></div>)}</div>);
      case 'parallel_channels':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Dispara mensagens em múltiplos canais simultaneamente.</p><div className="space-y-2">{['whatsapp', 'email', 'sms'].map(ch => (<div key={ch} className="flex items-center gap-2"><Switch checked={((config.channels as string[]) || ['whatsapp', 'email']).includes(ch)} onCheckedChange={v => { const current = (config.channels as string[]) || ['whatsapp', 'email']; setConfig({ ...config, channels: v ? [...current, ch] : current.filter(c => c !== ch) }); }} /><Label className="capitalize">{ch}</Label></div>))}</div></div>);
      case 'note':
        return (<div className="space-y-4"><div><Label>Anotação</Label><Textarea rows={4} placeholder="Notas internas..." value={String(config.text || '')} onChange={e => setConfig({ ...config, text: e.target.value })} /></div><div><Label>Cor</Label><Select value={String(config.color || 'yellow')} onValueChange={v => setConfig({ ...config, color: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yellow">Amarelo</SelectItem><SelectItem value="blue">Azul</SelectItem><SelectItem value="green">Verde</SelectItem><SelectItem value="pink">Rosa</SelectItem></SelectContent></Select></div></div>);
      default:
        return <p className="text-sm text-muted-foreground">Nenhuma configuração adicional necessária.</p>;
    }
  };

  const dialogTitle = () => {
    const info = [...triggerOptions, ...actionOptions, ...conditionOptions].find(o => o.id === node.subtype);
    return info ? `Configurar: ${info.label}` : `Configurar: ${node.label}`;
  };

  return (
    <>
      <Dialog open={open && !showEmailEditor} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{dialogTitle()}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">{renderFields()}</div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => { onSave(config); onClose(); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showEmailEditor} onOpenChange={v => { if (!v) setShowEmailEditor(false); }}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editor de E-mail</DialogTitle>
            <DialogDescription>Edite o template visual do seu e-mail marketing.</DialogDescription>
          </DialogHeader>
          <EmailTemplateEditor content={String(config.email_html || '')} onChange={html => setConfig(prev => ({ ...prev, email_html: html }))} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailEditor(false)}>Cancelar</Button>
            <Button onClick={() => setShowEmailEditor(false)}>Salvar Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Trigger Selection (shown when canvas has no trigger) ───
function TriggerSelector({ onSelect }: { onSelect: (triggerId: string) => void }) {
  const [filter, setFilter] = useState<string>('all');
  const filtered = triggerOptions.filter(t => filter === 'all' || t.channel === filter);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-4">
          <Zap className="h-8 w-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Como o fluxo começa?</h2>
        <p className="text-muted-foreground mt-1">Escolha o gatilho que vai iniciar sua automação</p>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap justify-center">
        {([
          { key: 'all', label: 'Todos' },
          { key: 'instagram', label: '📸 Instagram' },
          { key: 'whatsapp', label: '💬 WhatsApp' },
          { key: 'crm', label: '👤 CRM' },
          { key: 'pagamento', label: '💳 Pagamentos' },
          { key: 'email', label: '📧 E-mail' },
          { key: 'voip', label: '📞 VoIP' },
          { key: 'telegram', label: '✈️ Telegram' },
        ]).map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={cn('px-4 py-2 rounded-full text-sm font-medium transition-colors', filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl">
        {filtered.map(trigger => {
          const Icon = trigger.icon;
          return (
            <button key={trigger.id} onClick={() => onSelect(trigger.id)} className="flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/50 bg-card hover:shadow-lg transition-all text-left group">
              <div className={cn('flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br text-white shrink-0', trigger.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm group-hover:text-primary transition-colors">{trigger.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{trigger.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Flow List ───
function FlowList({ onCreateNew, onEditFlow }: {
  onCreateNew: () => void;
  onEditFlow: (id: string) => void;
}) {
  const { automations, isLoading, toggleAutomation, deleteAutomation } = useAutomations();
  const flows = automations.filter(a => {
    const tc = a.trigger_config as Record<string, unknown> | null;
    return tc?.flow_builder === true;
  });

  const getTriggerLabel = (a: typeof automations[0]) => {
    const tc = a.trigger_config as Record<string, unknown> | null;
    const originalTrigger = tc?.original_trigger as string | undefined;
    return triggerOptions.find(t => t.id === originalTrigger)?.label || a.trigger_type;
  };

  const getTriggerIcon = (a: typeof automations[0]) => {
    const tc = a.trigger_config as Record<string, unknown> | null;
    return triggerOptions.find(t => t.id === (tc?.original_trigger as string));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Workflow className="h-7 w-7 text-primary" />Meus Fluxos
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie seus fluxos de automação visual</p>
        </div>
        <Button onClick={onCreateNew} size="lg"><Plus className="h-5 w-5 mr-2" />Novo Fluxo</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (<Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-24 bg-muted rounded-lg" /></CardContent></Card>))}
        </div>
      ) : flows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
              <Workflow className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Nenhum fluxo criado</h3>
            <p className="text-muted-foreground text-sm mb-6">Crie seu primeiro fluxo de automação visual</p>
            <Button onClick={onCreateNew}><Plus className="h-4 w-4 mr-2" />Criar Primeiro Fluxo</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flows.map(flow => {
            const triggerInfo = getTriggerIcon(flow);
            const TriggerIcon = triggerInfo?.icon || Zap;
            const actionCount = (flow.actions as unknown[] | null)?.length || 0;
            return (
              <Card key={flow.id} className="group hover:shadow-md transition-all cursor-pointer border-2 hover:border-primary/30" onClick={() => onEditFlow(flow.id)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn('flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br text-white', triggerInfo?.color || 'from-primary to-primary/60')}>
                      <TriggerIcon className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <Badge variant={flow.is_active ? 'default' : 'secondary'} className="text-[10px]">{flow.is_active ? 'Ativo' : 'Inativo'}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditFlow(flow.id)}><Settings className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleAutomation.mutate({ id: flow.id, isActive: !flow.is_active })}>{flow.is_active ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}{flow.is_active ? 'Desativar' : 'Ativar'}</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteAutomation.mutate(flow.id)}><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm truncate">{flow.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Gatilho: {getTriggerLabel(flow)}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">{actionCount} ações</span>
                    <span className="text-xs text-muted-foreground">{flow.executions_count || 0} execuções</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Flow Builder ───
export default function FlowBuilder() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { automations, createAutomation, updateAutomation } = useAutomations();
  const editId = searchParams.get('id');
  const isNew = searchParams.get('new') === '1';
  const { data: nodeAnalytics } = useFlowNodeAnalytics(editId || undefined);

  const [mode, setMode] = useState<'list' | 'editor'>(editId || isNew ? 'editor' : 'list');
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(editId);
  const [flowName, setFlowName] = useState(searchParams.get('name') || 'Meu Fluxo');
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [connections, setConnections] = useState<FlowConnection[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [editingNode, setEditingNode] = useState<FlowNode | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newCampaignOpen, setNewCampaignOpen] = useState(false);
  const [showTriggerSelector, setShowTriggerSelector] = useState(false);

  const hasTrigger = nodes.some(n => n.type === 'trigger');

  // Drag from sidebar
  const handleDragStart = (e: React.DragEvent, nodeType: string, subtype: string) => {
    e.dataTransfer.setData('application/flow-node', JSON.stringify({ nodeType, subtype }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Load existing flow
  useEffect(() => {
    if (currentFlowId && automations.length > 0) {
      const existing = automations.find(a => a.id === currentFlowId);
      if (existing) {
        setFlowName(existing.name);
        setIsActive(existing.is_active ?? false);
        const tc = existing.trigger_config as Record<string, unknown> | null;
        const originalTrigger = (tc?.original_trigger as string) || existing.trigger_type;
        const trigger = triggerOptions.find(t => t.id === originalTrigger);

        const triggerNode: FlowNode = {
          id: 'trigger-' + existing.id,
          type: 'trigger',
          subtype: originalTrigger,
          label: trigger?.label || originalTrigger,
          config: { keyword: tc?.keyword, post_url: tc?.post_url, story_url: tc?.story_url, form_id: tc?.form_id, form_name: tc?.form_name } as Record<string, unknown>,
          position: (tc?.position as { x: number; y: number }) || { x: 400, y: 50 },
        };

        const actionData = (existing.actions as Array<{ id: string; type: string; config: Record<string, unknown>; position?: { x: number; y: number } }>) || [];
        const loadedNodes: FlowNode[] = [triggerNode];
        const loadedConns: FlowConnection[] = [];

        actionData.forEach((a, i) => {
          const info = [...actionOptions, ...conditionOptions].find(o => o.id === a.type);
          loadedNodes.push({
            id: a.id || crypto.randomUUID(),
            type: conditionOptions.some(c => c.id === a.type) ? 'condition' as const
              : ['wait'].includes(a.type) ? 'delay' as const
              : a.type === 'timer' ? 'timer' as const
              : a.type === 'warmup' ? 'warmup' as const
              : 'action' as const,
            subtype: a.type,
            label: info?.label || a.type,
            config: a.config || {},
            position: a.position || { x: 400, y: 50 + (i + 1) * 160 },
          });
        });

        // Load connections from trigger_config or auto-generate linear
        const savedConns = (tc?.connections as FlowConnection[]) || null;
        if (savedConns && savedConns.length > 0) {
          loadedConns.push(...savedConns);
        } else {
          // Auto-generate linear connections for legacy flows
          for (let i = 0; i < loadedNodes.length - 1; i++) {
            loadedConns.push({
              id: crypto.randomUUID(),
              from: loadedNodes[i].id,
              to: loadedNodes[i + 1].id,
              fromPort: 'default',
            });
          }
        }

        setNodes(loadedNodes);
        setConnections(loadedConns);
      }
    }
  }, [currentFlowId, automations]);

  const handleSelectTrigger = (triggerId: string) => {
    const trigger = triggerOptions.find(t => t.id === triggerId);
    if (!trigger) return;
    const newNode: FlowNode = {
      id: crypto.randomUUID(),
      type: 'trigger',
      subtype: triggerId,
      label: trigger.label,
      config: {},
      position: { x: 400, y: 80 },
    };
    setNodes([newNode]);
    setShowTriggerSelector(false);
  };

  const handleEditNode = (node: FlowNode) => { setEditingNode(node); setEditDialogOpen(true); };
  const handleSaveNodeConfig = (config: Record<string, unknown>) => {
    if (!editingNode) return;
    setNodes(prev => prev.map(n => n.id === editingNode.id ? { ...n, config } : n));
    setEditingNode(null);
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
  };

  const handleSave = () => {
    const triggerNode = nodes.find(n => n.type === 'trigger');
    if (!triggerNode || nodes.length < 2) {
      toast({ title: 'Fluxo incompleto', description: 'Adicione pelo menos um gatilho e uma ação.', variant: 'destructive' });
      return;
    }

    const trigger = triggerOptions.find(t => t.id === triggerNode.subtype);
    const actionNodes = nodes.filter(n => n.type !== 'trigger');

    const actions = actionNodes.map(n => ({
      id: n.id,
      type: n.subtype,
      config: n.config as Record<string, Json>,
      position: n.position,
    })) as unknown as Json;

    const triggerConfig = {
      channel: trigger?.channel || 'instagram',
      flow_builder: true,
      original_trigger: triggerNode.subtype,
      position: triggerNode.position,
      connections: connections,
      ...triggerNode.config,
    } as Record<string, Json>;

    if (currentFlowId) {
      updateAutomation.mutate({
        id: currentFlowId,
        name: flowName,
        trigger_type: triggerTypeMap[triggerNode.subtype] || triggerNode.subtype,
        trigger_config: triggerConfig,
        actions,
        is_active: isActive,
      });
      toast({ title: '✅ Fluxo atualizado!' });
    } else {
      createAutomation.mutate({
        name: flowName,
        trigger_type: triggerTypeMap[triggerNode.subtype] || triggerNode.subtype,
        trigger_config: triggerConfig,
        actions,
        is_active: isActive,
      }, {
        onSuccess: () => {
          toast({ title: '✅ Fluxo criado!' });
          setMode('list');
          setCurrentFlowId(null);
          setNodes([]);
          setConnections([]);
          setSearchParams({});
        },
      });
      return;
    }

    setMode('list');
    setCurrentFlowId(null);
    setNodes([]);
    setConnections([]);
    setSearchParams({});
  };

  const handleCreateNew = () => { setNewCampaignOpen(true); };

  const handleCampaignCreate = (name: string) => {
    setNewCampaignOpen(false);
    setCurrentFlowId(null);
    setFlowName(name);
    setNodes([]);
    setConnections([]);
    setIsActive(false);
    setMode('editor');
    setShowTriggerSelector(true);
  };

  const handleImportCode = (name: string, code: string) => {
    try {
      let data: any;
      try { data = JSON.parse(atob(code)); } catch { data = JSON.parse(code); }
      if (data.nodes && Array.isArray(data.nodes)) {
        const importedNodes = data.nodes.map((n: any, i: number) => ({
          ...n,
          id: crypto.randomUUID(),
          position: n.position || { x: 400, y: 50 + i * 160 },
        }));
        setCurrentFlowId(null);
        setFlowName(name || data.name || 'Fluxo Importado');
        setNodes(importedNodes);
        setConnections(data.connections || []);
        setIsActive(false);
        setMode('editor');
        setShowTriggerSelector(false);
        toast({ title: '✅ Fluxo importado com sucesso!' });
      }
    } catch {
      toast({ title: 'Erro ao importar', description: 'Código inválido', variant: 'destructive' });
    }
  };

  const handleExportCode = () => {
    const exportData = {
      name: flowName,
      nodes: nodes.map(n => ({ type: n.type, subtype: n.subtype, label: n.label, config: n.config, position: n.position })),
      connections,
    };
    const code = btoa(JSON.stringify(exportData));
    navigator.clipboard.writeText(code);
    toast({ title: '📋 Código copiado!', description: 'Cole o código para duplicar este fluxo em qualquer projeto.' });
  };

  const handleEditFlow = (id: string) => {
    setCurrentFlowId(id);
    setMode('editor');
    setShowTriggerSelector(false);
  };

  const handleBackToList = () => {
    setMode('list');
    setCurrentFlowId(null);
    setNodes([]);
    setConnections([]);
    setSearchParams({});
  };

  if (mode === 'list') {
    return (
      <>
        <FlowList onCreateNew={handleCreateNew} onEditFlow={handleEditFlow} />
        <NewCampaignModal open={newCampaignOpen} onClose={() => setNewCampaignOpen(false)} onCreate={handleCampaignCreate} onImportCode={handleImportCode} />
      </>
    );
  }

  // Editor mode
  const getNodeType = (id: string): FlowNode['type'] => {
    if (id === 'timer') return 'timer';
    if (id === 'warmup') return 'warmup';
    if (id === 'wait') return 'delay';
    if (id === 'note') return 'note';
    if (id.startsWith('sequence_')) return 'sequence';
    if (id === 'conditional' || conditionOptions.some(c => c.id === id)) return 'condition';
    return 'action';
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b bg-card/50 backdrop-blur-sm px-4 py-3 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBackToList}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Input value={flowName} onChange={e => setFlowName(e.target.value)} className="font-semibold text-lg border-none bg-transparent shadow-none focus-visible:ring-0 w-[240px]" />
          {currentFlowId && <Badge variant="outline" className="text-xs">Editando</Badge>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{isActive ? 'Ativo' : 'Rascunho'}</span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
          {nodes.length > 1 && (
            <Button variant="outline" size="sm" onClick={handleExportCode}>
              <Copy className="h-4 w-4 mr-2" />Exportar
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasTrigger || nodes.length < 2}>
            <Save className="h-4 w-4 mr-2" />{currentFlowId ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with draggable nodes */}
        <div className="w-[160px] shrink-0 border-r bg-[#1a1a2e] overflow-y-auto">
          <div className="p-2">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider px-1 mb-2">Arraste para o canvas</p>

            {/* Triggers section */}
            <div className="mb-3">
              <p className="text-[9px] font-semibold text-white/30 uppercase tracking-wider px-1 mb-1">Gatilhos</p>
              <div className="grid grid-cols-2 gap-1">
                {triggerOptions.slice(0, 8).map(opt => (
                  <button
                    key={opt.id}
                    draggable
                    onDragStart={e => handleDragStart(e, 'trigger', opt.id)}
                    onClick={() => handleSelectTrigger(opt.id)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-all cursor-grab active:cursor-grabbing group"
                    title={opt.label}
                  >
                    <div className={cn('flex items-center justify-center h-8 w-8 rounded-lg shrink-0 bg-gradient-to-br text-white', opt.color)}>
                      <opt.icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[9px] text-white/60 group-hover:text-white/90 text-center leading-tight truncate w-full">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action categories */}
            {nodeCategories.map(cat => (
              <div key={cat.label} className="mb-3">
                <p className="text-[9px] font-semibold text-white/30 uppercase tracking-wider px-1 mb-1">{cat.label}</p>
                <div className="grid grid-cols-2 gap-1">
                  {cat.nodes.map(opt => (
                    <button
                      key={opt.id}
                      draggable
                      onDragStart={e => handleDragStart(e, getNodeType(opt.id), opt.id)}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-all cursor-grab active:cursor-grabbing group"
                      title={opt.label}
                    >
                      <div className={cn('flex items-center justify-center h-8 w-8 rounded-lg shrink-0', opt.color)}>
                        <opt.icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[9px] text-white/60 group-hover:text-white/90 text-center leading-tight truncate w-full">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Conditions */}
            <div className="mb-3">
              <p className="text-[9px] font-semibold text-white/30 uppercase tracking-wider px-1 mb-1">Condições</p>
              <div className="grid grid-cols-2 gap-1">
                {conditionOptions.map(opt => (
                  <button
                    key={opt.id}
                    draggable
                    onDragStart={e => handleDragStart(e, 'condition', opt.id)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-all cursor-grab active:cursor-grabbing group"
                    title={opt.label}
                  >
                    <div className={cn('flex items-center justify-center h-8 w-8 rounded-lg shrink-0', opt.color)}>
                      <opt.icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[9px] text-white/60 group-hover:text-white/90 text-center leading-tight truncate w-full">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        {!hasTrigger && showTriggerSelector ? (
          <div className="flex-1 overflow-auto bg-background">
            <TriggerSelector onSelect={handleSelectTrigger} />
          </div>
        ) : (
          <FlowCanvas
            nodes={nodes}
            connections={connections}
            onNodesChange={setNodes}
            onConnectionsChange={setConnections}
            onEditNode={handleEditNode}
            onDeleteNode={handleDeleteNode}
            analytics={nodeAnalytics}
          />
        )}
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center gap-6 border-t bg-[#1a1a2e] px-4 py-2 text-xs text-white/50 shrink-0">
        <div className="flex items-center gap-1.5">
          <span>🔗 {connections.length} conexões</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>📦 {nodes.length} nós</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Arraste nós da barra lateral • Conecte arrastando dos pontos de saída • Duplo clique para editar</span>
        </div>
      </div>

      <NodeConfigDialog node={editingNode} open={editDialogOpen} onClose={() => { setEditDialogOpen(false); setEditingNode(null); }} onSave={handleSaveNodeConfig} />
    </div>
  );
}
