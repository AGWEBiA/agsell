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
  type FlowNode,
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

import { FlowNodeAnalyticsOverlay } from '@/components/automations/FlowNodeAnalyticsOverlay';
import type { FlowNodeAnalytic } from '@/hooks/useFlowNodeAnalytics';

// ─── Node Component ───
function FlowNodeCard({ node, onEdit, onDelete, onAddAfter, analytics }: {
  node: FlowNode;
  onEdit: () => void;
  onDelete: () => void;
  onAddAfter: () => void;
  analytics?: FlowNodeAnalytic;
}) {
  const getTriggerInfo = () => triggerOptions.find(t => t.id === node.subtype);
  const getActionInfo = () => [...actionOptions, ...conditionOptions].find(a => a.id === node.subtype);

  const getNodeSummary = () => {
    const c = node.config;
    switch (node.subtype) {
      case 'timer':
        if (c.timer_mode === 'specific_date' && c.specific_date) return `Data: ${String(c.specific_date)}`;
        return `${c.duration || 1} ${c.unit === 'hours' ? 'h' : c.unit === 'days' ? 'dias' : 'min'}`;
      case 'warmup':
        return `${c.leads_per_minute || 1} leads/min`;
      case 'send_email_marketing':
      case 'send_email_performance':
        return c.subject ? `"${String(c.subject)}"` : c.message ? `"${String(c.message).slice(0, 40)}..."` : '';
      case 'tag_filter':
        const entryTags = (c.entry_tags as string[]) || [];
        return entryTags.length > 0 ? `Tags: ${entryTags.join(', ')}` : '';
      case 'conditional':
      case 'if_tag':
      case 'if_keyword':
      case 'if_score': {
        const conditions = (c.conditions as Array<{ field: string; value: string }>) || [];
        if (conditions.length > 0) {
          return conditions.map(cond => `${cond.field}${cond.value ? `: ${cond.value}` : ''}`).join(', ');
        }
        return '';
      }
      case 'add_to_whatsapp_group':
        return c.group_name ? `→ ${String(c.group_name)}` : '';
      case 'voice_torpedo':
        return c.audio_url ? 'Áudio configurado' : '';
      case 'parallel_channels':
        return ((c.channels as string[]) || []).join(' + ').toUpperCase() || 'WA + Email';
      case 'edit_whatsapp_group':
        return c.new_name ? `→ ${String(c.new_name)}` : '';
      case 'link_split':
        return `${((c.links as any[]) || []).length} links`;
      case 'note':
        return c.text ? `"${String(c.text).slice(0, 40)}..."` : '';
      default:
        return '';
    }
  };

  if (node.type === 'trigger') {
    const info = getTriggerInfo();
    if (!info) return null;
    const Icon = info.icon;
    return (
      <div className="flex flex-col items-center">
        <div
          className={cn('relative w-full max-w-[340px] rounded-2xl p-[2px] cursor-pointer group', `bg-gradient-to-r ${info.color}`)}
          onClick={onEdit}
        >
          <div className="bg-card rounded-[14px] p-4">
            <div className="flex items-center gap-3">
              <div className={cn('flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br text-white', info.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">GATILHO</Badge>
                  <span className="text-xs text-muted-foreground">{info.channel.toUpperCase()}</span>
                </div>
                <p className="font-semibold text-sm mt-0.5">{info.label}</p>
                {node.config.keyword && <p className="text-xs text-muted-foreground mt-0.5">Palavra: "{String(node.config.keyword)}"</p>}
                {node.config.post_url && <p className="text-xs text-muted-foreground mt-0.5 truncate">Post: {String(node.config.post_url)}</p>}
                {node.config.story_url && <p className="text-xs text-muted-foreground mt-0.5 truncate">Story: {String(node.config.story_url)}</p>}
                {node.config.form_name && <p className="text-xs text-muted-foreground mt-0.5">Formulário: {String(node.config.form_name)}</p>}
              </div>
              <Settings className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-6 bg-border" />
          <button onClick={onAddAfter} className="flex items-center justify-center h-7 w-7 rounded-full border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/10 transition-all group">
            <Plus className="h-3.5 w-3.5 text-primary/60 group-hover:text-primary" />
          </button>
          <div className="w-0.5 h-6 bg-border" />
        </div>
      </div>
    );
  }

  const info = getActionInfo();
  if (!info) return null;
  const Icon = info.icon;
  const summary = getNodeSummary();

  const getTypeLabel = () => {
    if (['timer', 'warmup'].includes(node.subtype)) return node.subtype === 'timer' ? 'TIMER' : 'AQUECIMENTO';
    if (['tag_filter'].includes(node.subtype)) return 'FILTRO';
    if (['send_email_marketing', 'send_email_performance'].includes(node.subtype)) return 'EMAIL';
    if (node.subtype === 'parallel_channels') return 'PARALELO';
    if (node.subtype === 'voice_torpedo') return 'VOZ';
    if (node.subtype === 'link_split') return 'SPLIT';
    if (node.subtype === 'note') return 'NOTA';
    if (node.subtype === 'edit_whatsapp_group') return 'GRUPO';
    if (node.type === 'condition') return 'CONDIÇÃO';
    if (node.type === 'delay') return 'ESPERA';
    return 'AÇÃO';
  };

  // Special rendering for note nodes
  if (node.subtype === 'note') {
    const noteColors: Record<string, string> = {
      yellow: 'bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700',
      blue: 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700',
      green: 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700',
      pink: 'bg-pink-50 border-pink-300 dark:bg-pink-900/20 dark:border-pink-700',
    };
    return (
      <div className="flex flex-col items-center">
        <div className={cn('relative w-[340px] rounded-xl border-2 p-4 cursor-pointer group transition-colors', noteColors[(node.config.color as string) || 'yellow'])} onClick={onEdit}>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
            <X className="h-3 w-3" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <StickyNote className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">NOTA</Badge>
          </div>
          <p className="text-xs text-foreground/80">{node.config.text ? String(node.config.text).slice(0, 120) : 'Clique para adicionar uma anotação...'}</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-6 bg-border" />
          <button onClick={onAddAfter} className="flex items-center justify-center h-7 w-7 rounded-full border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/10 transition-all group">
            <Plus className="h-3.5 w-3.5 text-primary/60 group-hover:text-primary" />
          </button>
          <div className="w-0.5 h-6 bg-border" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[340px] rounded-xl border-2 border-border hover:border-primary/40 bg-card p-4 cursor-pointer group transition-colors" onClick={onEdit}>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
          <X className="h-3 w-3" />
        </button>
        <div className="flex items-center gap-3">
          <div className={cn('flex items-center justify-center h-10 w-10 rounded-lg', info.color)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{getTypeLabel()}</Badge>
            <p className="font-medium text-sm mt-0.5">{info.label}</p>
            {summary && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[240px]">{summary}</p>}
            {!summary && node.config.message && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[240px]">"{String(node.config.message)}"</p>}
            {node.config.tag_name && <p className="text-xs text-muted-foreground mt-0.5">Tag: {String(node.config.tag_name)}</p>}
            {node.config.duration && !['timer', 'warmup'].includes(node.subtype) && <p className="text-xs text-muted-foreground mt-0.5">{String(node.config.duration)} {node.config.unit === 'minutes' ? 'min' : node.config.unit === 'hours' ? 'h' : 'dias'}</p>}
            {/* Timer weekday badges */}
            {node.subtype === 'timer' && node.config.has_weekday_filter && (
              <div className="flex gap-0.5 mt-1">
                {WEEKDAYS.map(d => {
                  const selected = ((node.config.selected_days as string[]) || WEEKDAYS.map(w => w.key)).includes(d.key);
                  return <Badge key={d.key} variant={selected ? 'default' : 'outline'} className="text-[9px] px-1 py-0">{d.label}</Badge>;
                })}
              </div>
            )}
          </div>
          <Settings className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {node.type === 'condition' && (
          <div className="mt-3 flex gap-2 text-xs">
            <div className="flex-1 rounded-md bg-green-50 dark:bg-green-900/20 p-2 text-center text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">✅ Sim</div>
            <div className="flex-1 rounded-md bg-red-50 dark:bg-red-900/20 p-2 text-center text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">❌ Não</div>
          </div>
        )}
        <FlowNodeAnalyticsOverlay analytics={analytics} />
      </div>
      <div className="flex flex-col items-center">
        <div className="w-0.5 h-6 bg-border" />
        <button onClick={onAddAfter} className="flex items-center justify-center h-7 w-7 rounded-full border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/10 transition-all group">
          <Plus className="h-3.5 w-3.5 text-primary/60 group-hover:text-primary" />
        </button>
        <div className="w-0.5 h-6 bg-border" />
      </div>
    </div>
  );
}

// ─── Add Step Dialog (Sidebar-style like SellFlux) ───
function AddStepDialog({ open, onClose, onAdd }: {
  open: boolean;
  onClose: () => void;
  onAdd: (type: 'action' | 'condition' | 'delay' | 'timer' | 'warmup' | 'note', subtype: string) => void;
}) {
  const getNodeType = (id: string): FlowNode['type'] => {
    if (id === 'timer') return 'timer';
    if (id === 'warmup') return 'warmup';
    if (id === 'wait') return 'delay';
    if (id === 'note') return 'note';
    if (id === 'conditional' || conditionOptions.some(c => c.id === id)) return 'condition';
    return 'action';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Adicionar Passo</DialogTitle>
          <DialogDescription>Escolha o tipo de nó para adicionar ao fluxo</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-2">
          <div className="space-y-4">
            {nodeCategories.map(cat => (
              <div key={cat.label}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat.label}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {cat.nodes.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { onAdd(getNodeType(opt.id) as any, opt.id); onClose(); }}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all text-left"
                    >
                      <div className={cn('flex items-center justify-center h-8 w-8 rounded-md shrink-0', opt.color)}>
                        <opt.icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Condições</p>
              <div className="grid grid-cols-2 gap-1.5">
                {conditionOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { onAdd('condition', opt.id); onClose(); }}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all text-left"
                  >
                    <div className={cn('flex items-center justify-center h-8 w-8 rounded-md shrink-0', opt.color)}>
                      <opt.icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

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
      // Try raw JSON
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
  const { forms } = useForms();
  const { automations } = useAutomations();
  const { data: gatewayProducts = [] } = useGatewayProducts(String(config.gateway || 'any'));

  useEffect(() => { if (node) setConfig(node.config); }, [node]);
  if (!node) return null;

  const contactSources = ['website', 'landing_page', 'formulario', 'whatsapp', 'instagram', 'indicacao', 'evento', 'ads', 'importacao', 'outro'];

  const renderFields = () => {
    switch (node.subtype) {
      // ── New enhanced nodes ──
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

      // ── Instagram triggers ──
      case 'instagram_comment':
        return (<div className="space-y-4"><div><Label>Palavra-chave (opcional)</Label><Input placeholder="Ex: INFO, QUERO, PROMO" value={String(config.keyword || '')} onChange={e => setConfig({ ...config, keyword: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">Deixe vazio para ativar com qualquer comentário</p></div></div>);
      case 'instagram_dm':
        return (<div className="space-y-4"><div><Label>Palavra-chave (opcional)</Label><Input placeholder="Ex: INFO, QUERO, PROMO" value={String(config.keyword || '')} onChange={e => setConfig({ ...config, keyword: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">Deixe vazio para ativar com qualquer DM</p></div></div>);
      case 'instagram_dm_keyword':
        return (<div className="space-y-4"><div><Label>Palavra-chave *</Label><Input placeholder="Ex: QUERO, INFO, PREÇO" value={String(config.keyword || '')} onChange={e => setConfig({ ...config, keyword: e.target.value })} /></div><div><Label>Correspondência</Label><Select value={String(config.match_type || 'contains')} onValueChange={v => setConfig({ ...config, match_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="contains">Contém</SelectItem><SelectItem value="exact">Exata</SelectItem><SelectItem value="starts_with">Começa com</SelectItem></SelectContent></Select></div></div>);
      case 'instagram_comment_keyword':
        return (<div className="space-y-4"><div><Label>Palavra-chave *</Label><Input placeholder="Ex: EU QUERO, INFO" value={String(config.keyword || '')} onChange={e => setConfig({ ...config, keyword: e.target.value })} /></div><div><Label>Correspondência</Label><Select value={String(config.match_type || 'contains')} onValueChange={v => setConfig({ ...config, match_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="contains">Contém</SelectItem><SelectItem value="exact">Exata</SelectItem><SelectItem value="starts_with">Começa com</SelectItem></SelectContent></Select></div><div><Label>URL do Post (opcional)</Label><Input placeholder="https://www.instagram.com/p/..." value={String(config.post_url || '')} onChange={e => setConfig({ ...config, post_url: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">Deixe vazio para monitorar todos os posts</p></div></div>);
      case 'instagram_specific_post':
        return (<div className="space-y-4"><div><Label>URL do Post *</Label><Input placeholder="https://www.instagram.com/p/..." value={String(config.post_url || '')} onChange={e => setConfig({ ...config, post_url: e.target.value })} /></div><div><Label>Palavra-chave (opcional)</Label><Input placeholder="Ex: QUERO" value={String(config.keyword || '')} onChange={e => setConfig({ ...config, keyword: e.target.value })} /></div></div>);
      case 'instagram_story_reply':
        return (<div className="space-y-4"><div><Label>URL do Story (opcional)</Label><Input placeholder="https://www.instagram.com/stories/..." value={String(config.story_url || '')} onChange={e => setConfig({ ...config, story_url: e.target.value })} /></div><div><Label>Tipo de resposta</Label><Select value={String(config.reply_type || 'any')} onValueChange={v => setConfig({ ...config, reply_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="any">Qualquer resposta</SelectItem><SelectItem value="text">Texto</SelectItem><SelectItem value="reaction">Reação (emoji)</SelectItem><SelectItem value="quick_reply">Resposta rápida</SelectItem></SelectContent></Select></div></div>);
      case 'instagram_story_specific':
        return (<div className="space-y-4"><div><Label>URL ou ID do Story *</Label><Input placeholder="https://www.instagram.com/stories/usuario/123..." value={String(config.story_url || '')} onChange={e => setConfig({ ...config, story_url: e.target.value })} /></div><div><Label>ID do Story (opcional)</Label><Input placeholder="Ex: 3210987654321" value={String(config.story_id || '')} onChange={e => setConfig({ ...config, story_id: e.target.value })} /></div><div><Label>Tipo de interação</Label><Select value={String(config.interaction_type || 'any')} onValueChange={v => setConfig({ ...config, interaction_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="any">Qualquer interação</SelectItem><SelectItem value="reply">Resposta</SelectItem><SelectItem value="reaction">Reação</SelectItem><SelectItem value="mention">Menção</SelectItem></SelectContent></Select></div></div>);
      case 'instagram_new_follower':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Este gatilho é acionado automaticamente quando alguém começa a seguir seu perfil.</p><div><Label>Tag automática (opcional)</Label><Input placeholder="Ex: novo_seguidor" value={String(config.auto_tag || '')} onChange={e => setConfig({ ...config, auto_tag: e.target.value })} /></div></div>);
      case 'instagram_mention':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando alguém menciona seu perfil (@usuario) nos stories.</p><div><Label>Palavra-chave na menção (opcional)</Label><Input placeholder="Ex: recomendo, amei" value={String(config.keyword || '')} onChange={e => setConfig({ ...config, keyword: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">Deixe vazio para ativar com qualquer menção</p></div><div><Label>Resposta automática</Label><Select value={String(config.auto_response || 'dm')} onValueChange={v => setConfig({ ...config, auto_response: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="dm">Enviar DM de agradecimento</SelectItem><SelectItem value="none">Apenas registrar</SelectItem></SelectContent></Select></div></div>);
      case 'instagram_share_dm':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando alguém compartilha seu conteúdo (post, reel ou story) via DM.</p><div><Label>Tipo de conteúdo</Label><Select value={String(config.content_type || 'any')} onValueChange={v => setConfig({ ...config, content_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="any">Qualquer conteúdo</SelectItem><SelectItem value="post">Post</SelectItem><SelectItem value="reel">Reel</SelectItem><SelectItem value="story">Story</SelectItem></SelectContent></Select></div></div>);
      case 'instagram_ref_url':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando alguém clica em um link de referência que direciona para uma conversa no Instagram.</p><div><Label>Ref URL *</Label><Input placeholder="https://ig.me/m/seuusuario?ref=campanha1" value={String(config.ref_url || '')} onChange={e => setConfig({ ...config, ref_url: e.target.value })} /></div><div><Label>Parâmetro REF</Label><Input placeholder="Ex: campanha1, promo_verao" value={String(config.ref_param || '')} onChange={e => setConfig({ ...config, ref_param: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">Identifica a origem do clique para segmentação</p></div></div>);
      case 'instagram_ads':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando alguém clica em um anúncio Click-to-Instagram Direct (CTD).</p><div><Label>ID do Anúncio (opcional)</Label><Input placeholder="Ex: 23851234567890" value={String(config.ad_id || '')} onChange={e => setConfig({ ...config, ad_id: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">Deixe vazio para ativar com qualquer anúncio CTD</p></div><div><Label>Campanha (opcional)</Label><Input placeholder="Ex: Black Friday 2026" value={String(config.campaign_name || '')} onChange={e => setConfig({ ...config, campaign_name: e.target.value })} /></div></div>);
      // ── WhatsApp triggers ──
      case 'whatsapp_received':
        return (<div className="space-y-4"><div><Label>Palavra-chave (opcional)</Label><Input placeholder="Ex: OLÁ, AJUDA" value={String(config.keyword || '')} onChange={e => setConfig({ ...config, keyword: e.target.value })} /></div></div>);
      case 'whatsapp_keyword':
        return (<div className="space-y-4"><div><Label>Palavra-chave *</Label><Input placeholder="Ex: INFO, QUERO, PROMO" value={String(config.keyword || '')} onChange={e => setConfig({ ...config, keyword: e.target.value })} /></div><div><Label>Correspondência</Label><Select value={String(config.match_type || 'contains')} onValueChange={v => setConfig({ ...config, match_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="contains">Contém</SelectItem><SelectItem value="exact">Exata</SelectItem><SelectItem value="starts_with">Começa com</SelectItem></SelectContent></Select></div></div>);
      case 'whatsapp_automation':
        return (<div className="space-y-4"><div><Label>Automação de origem *</Label><Select value={String(config.source_automation_id || '')} onValueChange={v => setConfig({ ...config, source_automation_id: v })}><SelectTrigger><SelectValue placeholder="Selecione uma automação" /></SelectTrigger><SelectContent>{automations.filter(a => a.trigger_type?.includes('whatsapp')).map(a => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}{automations.filter(a => a.trigger_type?.includes('whatsapp')).length === 0 && (<SelectItem value="_none" disabled>Nenhuma automação WhatsApp encontrada</SelectItem>)}</SelectContent></Select></div></div>);
      case 'whatsapp_message_source':
        return (<div className="space-y-4"><div><Label>Tipo de mensagem de origem</Label><Select value={String(config.message_source_type || 'any')} onValueChange={v => setConfig({ ...config, message_source_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="any">Qualquer origem</SelectItem><SelectItem value="campaign">Campanha</SelectItem><SelectItem value="group">Grupo</SelectItem><SelectItem value="broadcast">Lista de transmissão</SelectItem><SelectItem value="direct">Mensagem direta</SelectItem></SelectContent></Select></div><div><Label>Palavra-chave (opcional)</Label><Input placeholder="Ex: COMPRAR" value={String(config.keyword || '')} onChange={e => setConfig({ ...config, keyword: e.target.value })} /></div></div>);

      // ── CRM triggers ──
      case 'contact_created':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando um novo contato é criado no CRM.</p><div><Label>Fonte do contato (opcional)</Label><Select value={String(config.contact_source || 'any')} onValueChange={v => setConfig({ ...config, contact_source: v, ...(v !== 'formulario' ? { form_id: undefined, form_name: undefined } : {}) })}><SelectTrigger><SelectValue placeholder="Qualquer fonte" /></SelectTrigger><SelectContent><SelectItem value="any">Qualquer fonte</SelectItem>{contactSources.map(s => (<SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</SelectItem>))}</SelectContent></Select></div>{config.contact_source === 'formulario' && (<div><Label>Formulário (opcional)</Label><Select value={String(config.form_id || '')} onValueChange={v => { const form = forms.find(f => f.id === v); setConfig({ ...config, form_id: v, form_name: form?.name || '' }); }}><SelectTrigger><SelectValue placeholder="Qualquer formulário" /></SelectTrigger><SelectContent>{forms.map(f => (<SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>))}{forms.length === 0 && (<SelectItem value="_none" disabled>Nenhum formulário criado</SelectItem>)}</SelectContent></Select></div>)}</div>);
      case 'contact_source':
        return (<div className="space-y-4"><div><Label>Fonte do contato *</Label><Select value={String(config.contact_source || '')} onValueChange={v => setConfig({ ...config, contact_source: v, ...(v !== 'formulario' ? { form_id: undefined, form_name: undefined } : {}) })}><SelectTrigger><SelectValue placeholder="Selecione a fonte" /></SelectTrigger><SelectContent>{contactSources.map(s => (<SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</SelectItem>))}</SelectContent></Select></div>{config.contact_source === 'formulario' && (<div><Label>Formulário *</Label><Select value={String(config.form_id || '')} onValueChange={v => { const form = forms.find(f => f.id === v); setConfig({ ...config, form_id: v, form_name: form?.name || '' }); }}><SelectTrigger><SelectValue placeholder="Selecione um formulário" /></SelectTrigger><SelectContent>{forms.map(f => (<SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>))}{forms.length === 0 && (<SelectItem value="_none" disabled>Nenhum formulário criado</SelectItem>)}</SelectContent></Select></div>)}</div>);
      case 'form_submitted':
        return (<div className="space-y-4"><div><Label>Formulário *</Label><Select value={String(config.form_id || '')} onValueChange={v => { const form = forms.find(f => f.id === v); setConfig({ ...config, form_id: v, form_name: form?.name || '' }); }}><SelectTrigger><SelectValue placeholder="Selecione um formulário" /></SelectTrigger><SelectContent>{forms.map(f => (<SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>))}{forms.length === 0 && (<SelectItem value="_none" disabled>Nenhum formulário criado</SelectItem>)}</SelectContent></Select></div></div>);

      // ── Payment gateway triggers ──
      case 'gateway_purchase_approved':
      case 'gateway_boleto_generated':
      case 'gateway_boleto_paid':
      case 'gateway_pix_generated':
      case 'gateway_refund':
      case 'gateway_chargeback':
      case 'gateway_subscription_canceled':
      case 'gateway_cart_abandoned':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Este gatilho é acionado automaticamente quando o evento correspondente é recebido via webhook do gateway de pagamento.</p><div><Label>Gateway</Label><Select value={String(config.gateway || 'any')} onValueChange={v => setConfig({ ...config, gateway: v, product_id: undefined, product_name: undefined, external_product_id: undefined })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="any">Qualquer gateway</SelectItem><SelectItem value="hotmart">Hotmart</SelectItem><SelectItem value="kiwify">Kiwify</SelectItem><SelectItem value="eduzz">Eduzz</SelectItem><SelectItem value="shopify">Shopify</SelectItem></SelectContent></Select></div><div><Label>Produto</Label><Select value={String(config.product_id || 'any')} onValueChange={v => { if (v === 'any') { setConfig({ ...config, product_id: undefined, product_name: undefined, external_product_id: undefined }); } else if (v === '_manual') { setConfig({ ...config, product_id: '_manual', product_name: '', external_product_id: '' }); } else { const prod = gatewayProducts.find(p => p.id === v); setConfig({ ...config, product_id: v, product_name: prod?.product_name || '', external_product_id: prod?.external_product_id || '' }); }}}><SelectTrigger><SelectValue placeholder="Qualquer produto" /></SelectTrigger><SelectContent><SelectItem value="any">Qualquer produto</SelectItem><SelectItem value="_manual">✏️ Inserir ID manualmente</SelectItem>{gatewayProducts.map(p => (<SelectItem key={p.id} value={p.id}>{p.product_name}{p.price ? ` — R$ ${Number(p.price).toFixed(2)}` : ''}<span className="text-xs text-muted-foreground ml-1">({p.gateway})</span></SelectItem>))}</SelectContent></Select>{(config.product_id === '_manual' || (config.external_product_id && !gatewayProducts.find(p => p.id === config.product_id))) && (<div className="space-y-2 mt-2 p-3 border rounded-md bg-muted/30"><div><Label className="text-xs">ID do Produto no Gateway *</Label><Input placeholder="Ex: 123456 ou prod_abc123" value={String(config.external_product_id || '')} onChange={e => setConfig({ ...config, external_product_id: e.target.value, product_id: '_manual' })} /></div><div><Label className="text-xs">Nome do Produto (opcional)</Label><Input placeholder="Ex: Curso de Marketing Digital" value={String(config.product_name || '')} onChange={e => setConfig({ ...config, product_name: e.target.value })} /></div><p className="text-xs text-muted-foreground">Insira o ID do produto exatamente como aparece no painel do gateway (Hotmart, Kiwify, etc).</p></div>)}{gatewayProducts.length > 0 && config.product_id !== '_manual' && (<p className="text-xs text-muted-foreground mt-1">Produtos sincronizados automaticamente via webhooks recebidos.</p>)}{gatewayProducts.length === 0 && config.product_id !== '_manual' && (<p className="text-xs text-muted-foreground mt-1">Nenhum produto recebido via webhook ainda. Selecione "Inserir ID manualmente" para configurar antes do primeiro webhook.</p>)}</div></div>);

      // ── Pipeline triggers ──
      case 'deal_stage_changed':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando um negócio muda de etapa no pipeline.</p><div><Label>Etapa de destino (opcional)</Label><Input placeholder="Nome da etapa" value={String(config.target_stage || '')} onChange={e => setConfig({ ...config, target_stage: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">Deixe vazio para qualquer mudança de etapa</p></div></div>);
      case 'deal_won':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado automaticamente quando um negócio é marcado como ganho.</p><div><Label>Valor mínimo (opcional)</Label><Input type="number" placeholder="Ex: 1000" value={String(config.min_value || '')} onChange={e => setConfig({ ...config, min_value: e.target.value })} /></div></div>);
      case 'deal_lost':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado automaticamente quando um negócio é marcado como perdido.</p><div><Label>Motivo (opcional)</Label><Input placeholder="Filtrar por motivo de perda" value={String(config.loss_reason || '')} onChange={e => setConfig({ ...config, loss_reason: e.target.value })} /></div></div>);

      // ── Tag/Score triggers ──
      case 'tag_added':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando uma tag específica é adicionada a um contato.</p><div><Label>Nome da Tag *</Label><Input placeholder="Ex: cliente_vip, comprador" value={String(config.tag_name || '')} onChange={e => setConfig({ ...config, tag_name: e.target.value })} /></div></div>);
      case 'tag_removed':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando uma tag é removida de um contato.</p><div><Label>Nome da Tag *</Label><Input placeholder="Ex: inadimplente" value={String(config.tag_name || '')} onChange={e => setConfig({ ...config, tag_name: e.target.value })} /></div></div>);
      case 'score_threshold':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando o score do contato atinge ou ultrapassa um valor.</p><div><Label>Score mínimo *</Label><Input type="number" placeholder="Ex: 80" value={String(config.min_score || '')} onChange={e => setConfig({ ...config, min_score: e.target.value })} /></div><div><Label>Direção</Label><Select value={String(config.direction || 'up')} onValueChange={v => setConfig({ ...config, direction: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="up">Subiu para o valor</SelectItem><SelectItem value="down">Desceu para o valor</SelectItem></SelectContent></Select></div></div>);

      // ── Email triggers ──
      case 'email_opened':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando o contato abre um e-mail enviado por uma campanha ou automação.</p><div><Label>Campanha (opcional)</Label><Input placeholder="Nome ou ID da campanha" value={String(config.campaign_name || '')} onChange={e => setConfig({ ...config, campaign_name: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">Deixe vazio para qualquer e-mail</p></div></div>);
      case 'email_clicked':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando o contato clica em um link dentro do e-mail.</p><div><Label>URL do link (opcional)</Label><Input placeholder="https://..." value={String(config.link_url || '')} onChange={e => setConfig({ ...config, link_url: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">Deixe vazio para qualquer link clicado</p></div></div>);
      case 'email_bounced':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando um e-mail retorna como bounce (hard ou soft).</p><div><Label>Tipo de bounce</Label><Select value={String(config.bounce_type || 'any')} onValueChange={v => setConfig({ ...config, bounce_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="any">Qualquer bounce</SelectItem><SelectItem value="hard">Hard bounce</SelectItem><SelectItem value="soft">Soft bounce</SelectItem></SelectContent></Select></div></div>);

      // ── Date/Inactivity triggers ──
      case 'date_trigger':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado em uma data específica do contato (aniversário, vencimento, etc).</p><div><Label>Campo de data *</Label><Select value={String(config.date_field || 'birthday')} onValueChange={v => setConfig({ ...config, date_field: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="birthday">Aniversário</SelectItem><SelectItem value="created_at">Data de cadastro</SelectItem><SelectItem value="custom">Campo personalizado</SelectItem></SelectContent></Select></div>{config.date_field === 'custom' && (<div><Label>Nome do campo</Label><Input placeholder="Ex: data_vencimento" value={String(config.custom_field || '')} onChange={e => setConfig({ ...config, custom_field: e.target.value })} /></div>)}<div><Label>Dias antes/depois</Label><Input type="number" placeholder="0 = no dia, -3 = 3 dias antes" value={String(config.days_offset || '0')} onChange={e => setConfig({ ...config, days_offset: e.target.value })} /></div></div>);
      case 'inactivity_trigger':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando o contato fica sem interação por um período definido.</p><div><Label>Dias de inatividade *</Label><Input type="number" placeholder="Ex: 30" value={String(config.inactivity_days || '')} onChange={e => setConfig({ ...config, inactivity_days: e.target.value })} /></div><div><Label>Canal de referência</Label><Select value={String(config.inactivity_channel || 'any')} onValueChange={v => setConfig({ ...config, inactivity_channel: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="any">Qualquer canal</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="email">E-mail</SelectItem><SelectItem value="instagram">Instagram</SelectItem></SelectContent></Select></div></div>);

      // ── VoIP triggers ──
      case 'call_completed':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando uma chamada VoIP é completada com sucesso.</p><div><Label>Duração mínima (segundos)</Label><Input type="number" placeholder="Ex: 30" value={String(config.min_duration || '')} onChange={e => setConfig({ ...config, min_duration: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">Deixe vazio para qualquer duração</p></div></div>);
      case 'call_missed':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando uma chamada é perdida ou não atendida.</p></div>);

      // ── Telegram triggers ──
      case 'telegram_message':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando uma mensagem é recebida no Telegram.</p></div>);
      case 'telegram_keyword':
        return (<div className="space-y-4"><div><Label>Palavra-chave *</Label><Input placeholder="Ex: INFO, COMPRAR" value={String(config.keyword || '')} onChange={e => setConfig({ ...config, keyword: e.target.value })} /></div><div><Label>Correspondência</Label><Select value={String(config.match_type || 'contains')} onValueChange={v => setConfig({ ...config, match_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="contains">Contém</SelectItem><SelectItem value="exact">Exata</SelectItem><SelectItem value="starts_with">Começa com</SelectItem></SelectContent></Select></div></div>);

      // ── WhatsApp group triggers ──
      case 'whatsapp_group_join':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando alguém entra em um grupo do WhatsApp.</p><div><Label>Nome do grupo (opcional)</Label><Input placeholder="Filtrar por grupo específico" value={String(config.group_name || '')} onChange={e => setConfig({ ...config, group_name: e.target.value })} /></div></div>);
      case 'whatsapp_group_leave':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Acionado quando alguém sai de um grupo do WhatsApp.</p><div><Label>Nome do grupo (opcional)</Label><Input placeholder="Filtrar por grupo específico" value={String(config.group_name || '')} onChange={e => setConfig({ ...config, group_name: e.target.value })} /></div></div>);

      // ── Simple actions ──
      // ── New node types ──
      case 'send_whatsapp_oficial':
        return <WhatsAppNodeConfig config={config} onChange={setConfig} />;
      case 'send_whatsapp_group':
        return <WhatsAppGroupNodeConfig config={config} onChange={setConfig} />;
      case 'add_to_whatsapp_group':
        return <WhatsAppGroupAddNodeConfig config={config} onChange={setConfig} />;
      case 'send_sms':
        return (<div className="space-y-4"><div><Label>Mensagem SMS</Label><Textarea placeholder="Digite a mensagem SMS..." rows={3} maxLength={160} value={String(config.message || '')} onChange={e => setConfig({ ...config, message: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">{String(config.message || '').length}/160 caracteres</p></div></div>);
      case 'list_tag':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Lista todas as tags do lead para uso em condições subsequentes.</p><div><Label>Filtrar por prefixo (opcional)</Label><Input placeholder="Ex: campanha_" value={String(config.tag_prefix || '')} onChange={e => setConfig({ ...config, tag_prefix: e.target.value })} /></div></div>);
      case 'full_page':
        return (<div className="space-y-4"><div><Label>URL da página</Label><Input placeholder="https://suapagina.com/obrigado" value={String(config.page_url || '')} onChange={e => setConfig({ ...config, page_url: e.target.value })} /></div><div><Label>Tempo de exibição (segundos)</Label><Input type="number" min={1} value={String(config.display_seconds || 10)} onChange={e => setConfig({ ...config, display_seconds: parseInt(e.target.value) || 10 })} /></div></div>);
      case 'pixel':
        return (<div className="space-y-4"><div><Label>Evento do Pixel</Label><Select value={String(config.pixel_event || 'PageView')} onValueChange={v => setConfig({ ...config, pixel_event: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PageView">PageView</SelectItem><SelectItem value="Lead">Lead</SelectItem><SelectItem value="Purchase">Purchase</SelectItem><SelectItem value="InitiateCheckout">InitiateCheckout</SelectItem><SelectItem value="AddToCart">AddToCart</SelectItem><SelectItem value="CompleteRegistration">CompleteRegistration</SelectItem><SelectItem value="custom">Personalizado</SelectItem></SelectContent></Select></div>{config.pixel_event === 'custom' && (<div><Label>Nome do evento</Label><Input placeholder="meu_evento" value={String(config.custom_event || '')} onChange={e => setConfig({ ...config, custom_event: e.target.value })} /></div>)}</div>);
      case 'abandonment':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Detecta leads que abandonaram o fluxo sem converter.</p><div className="flex gap-2"><div className="flex-1"><Label>Tempo de inatividade</Label><Input type="number" min={1} value={String(config.inactivity_duration || 30)} onChange={e => setConfig({ ...config, inactivity_duration: parseInt(e.target.value) || 30 })} /></div><div className="flex-1"><Label>Unidade</Label><Select value={String(config.inactivity_unit || 'minutes')} onValueChange={v => setConfig({ ...config, inactivity_unit: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minutes">Minutos</SelectItem><SelectItem value="hours">Horas</SelectItem><SelectItem value="days">Dias</SelectItem></SelectContent></Select></div></div></div>);
      case 'conditional':
      case 'if_tag':
      case 'if_keyword':
      case 'if_score':
        return <ConditionalNodeConfig config={config} onChange={setConfig} />;

      // ── Simple actions ──
      case 'send_email':
        return (<div className="space-y-4"><div><Label>Assunto</Label><Input placeholder="Assunto do email" value={String(config.subject || '')} onChange={e => setConfig({ ...config, subject: e.target.value })} /></div><div><Label>Conteúdo</Label><Textarea placeholder="Conteúdo do email..." rows={4} value={String(config.content || '')} onChange={e => setConfig({ ...config, content: e.target.value })} /></div></div>);
      case 'add_tag': case 'remove_tag':
        return (<div><Label>Nome da Tag</Label><Input placeholder="Ex: Lead Quente" value={String(config.tag_name || '')} onChange={e => setConfig({ ...config, tag_name: e.target.value })} /></div>);
      case 'update_score':
        return (<div className="space-y-4"><div><Label>Operação</Label><Select value={String(config.operation || 'add')} onValueChange={v => setConfig({ ...config, operation: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="add">Adicionar</SelectItem><SelectItem value="subtract">Subtrair</SelectItem><SelectItem value="set">Definir</SelectItem></SelectContent></Select></div><div><Label>Pontos</Label><Input type="number" placeholder="10" value={String(config.points || '')} onChange={e => setConfig({ ...config, points: parseInt(e.target.value) || 0 })} /></div></div>);
      case 'send_notification':
        return (<div className="space-y-4"><div><Label>Título</Label><Input placeholder="Nova interação!" value={String(config.title || '')} onChange={e => setConfig({ ...config, title: e.target.value })} /></div><div><Label>Mensagem</Label><Textarea placeholder="Detalhes..." rows={3} value={String(config.message || '')} onChange={e => setConfig({ ...config, message: e.target.value })} /></div></div>);
      case 'create_task':
        return (<div className="space-y-4"><div><Label>Título da Tarefa</Label><Input placeholder="Follow-up com lead" value={String(config.title || '')} onChange={e => setConfig({ ...config, title: e.target.value })} /></div><div><Label>Prazo (dias)</Label><Input type="number" placeholder="3" value={String(config.due_days || '')} onChange={e => setConfig({ ...config, due_days: parseInt(e.target.value) || 0 })} /></div></div>);
      case 'wait':
        return (<div className="flex gap-2"><div className="flex-1"><Label>Tempo</Label><Input type="number" placeholder="1" value={String(config.duration || '')} onChange={e => setConfig({ ...config, duration: parseInt(e.target.value) || 0 })} /></div><div className="flex-1"><Label>Unidade</Label><Select value={String(config.unit || 'hours')} onValueChange={v => setConfig({ ...config, unit: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minutes">Minutos</SelectItem><SelectItem value="hours">Horas</SelectItem><SelectItem value="days">Dias</SelectItem></SelectContent></Select></div></div>);
      case 'send_instagram_dm':
        return <InstagramNodeConfig config={config} onChange={setConfig} type="dm" />;
      case 'send_instagram_comment_reply':
        return <InstagramNodeConfig config={config} onChange={setConfig} type="comment_reply" />;
      case 'send_instagram_story_reply':
        return <InstagramNodeConfig config={config} onChange={setConfig} type="dm" />;
      case 'instagram_like_comment':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Curte automaticamente o comentário que acionou o gatilho.</p><div className="flex items-center gap-2"><Switch checked={config.only_keyword !== false} onCheckedChange={v => setConfig({ ...config, only_keyword: v })} /><Label>Curtir apenas comentários com palavra-chave</Label></div></div>);
      case 'instagram_follow_back':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Segue automaticamente o usuário que interagiu com seu perfil.</p><div className="flex items-center gap-2"><Switch checked={!!config.add_tag_on_follow} onCheckedChange={v => setConfig({ ...config, add_tag_on_follow: v })} /><Label>Adicionar tag ao seguir</Label></div>{config.add_tag_on_follow && (<div><Label>Nome da Tag</Label><Input placeholder="Ex: seguido_de_volta" value={String(config.follow_tag || '')} onChange={e => setConfig({ ...config, follow_tag: e.target.value })} /></div>)}</div>);
      // ── New node types ──
      case 'voice_torpedo':
        return (<div className="space-y-4"><div><Label>URL do Áudio (MP3)</Label><Input placeholder="https://cdn.seusite.com/audio.mp3" value={String(config.audio_url || '')} onChange={e => setConfig({ ...config, audio_url: e.target.value })} /></div><div><Label>Mensagem de texto (fallback)</Label><Textarea rows={2} placeholder="Caso não consiga ouvir..." value={String(config.fallback_message || '')} onChange={e => setConfig({ ...config, fallback_message: e.target.value })} /></div><div className="flex items-center gap-2"><Switch checked={!!config.wait_answer} onCheckedChange={v => setConfig({ ...config, wait_answer: v })} /><Label>Aguardar resposta do usuário</Label></div></div>);
      case 'parallel_channels':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Dispara mensagens em múltiplos canais simultaneamente. Se um canal falhar, os outros continuam.</p>
          <div className="space-y-2">
            {['whatsapp', 'email', 'sms'].map(ch => (
              <div key={ch} className="flex items-center gap-2">
                <Switch checked={((config.channels as string[]) || ['whatsapp', 'email']).includes(ch)} onCheckedChange={v => {
                  const current = (config.channels as string[]) || ['whatsapp', 'email'];
                  setConfig({ ...config, channels: v ? [...current, ch] : current.filter(c => c !== ch) });
                }} />
                <Label className="capitalize">{ch}</Label>
              </div>
            ))}
          </div>
          <div><Label>Mensagem WhatsApp</Label><Textarea rows={2} value={String(config.whatsapp_message || '')} onChange={e => setConfig({ ...config, whatsapp_message: e.target.value })} /></div>
          <div><Label>Assunto Email</Label><Input value={String(config.email_subject || '')} onChange={e => setConfig({ ...config, email_subject: e.target.value })} /></div>
          <div><Label>Conteúdo Email</Label><Textarea rows={2} value={String(config.email_content || '')} onChange={e => setConfig({ ...config, email_content: e.target.value })} /></div>
          <div><Label>Mensagem SMS</Label><Textarea rows={2} maxLength={160} value={String(config.sms_message || '')} onChange={e => setConfig({ ...config, sms_message: e.target.value })} /></div>
        </div>);
      case 'edit_whatsapp_group':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Edita automaticamente o nome, descrição ou foto do grupo.</p><div><Label>JID do Grupo</Label><Input placeholder="123456789@g.us" value={String(config.group_jid || '')} onChange={e => setConfig({ ...config, group_jid: e.target.value })} /></div><div><Label>Novo Nome (opcional)</Label><Input value={String(config.new_name || '')} onChange={e => setConfig({ ...config, new_name: e.target.value })} /></div><div><Label>Nova Descrição (opcional)</Label><Textarea rows={2} value={String(config.new_description || '')} onChange={e => setConfig({ ...config, new_description: e.target.value })} /></div><div><Label>URL Nova Foto (opcional)</Label><Input placeholder="https://..." value={String(config.new_photo_url || '')} onChange={e => setConfig({ ...config, new_photo_url: e.target.value })} /></div></div>);
      case 'link_split':
        return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Distribui tráfego entre múltiplos links por percentual.</p>
          {((config.links as Array<{url: string; percentage: number}>) || [{url: '', percentage: 50}, {url: '', percentage: 50}]).map((link, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1"><Label className="text-xs">URL {i + 1}</Label><Input value={link.url} onChange={e => { const links = [...((config.links as any[]) || [{url:'',percentage:50},{url:'',percentage:50}])]; links[i] = {...links[i], url: e.target.value}; setConfig({...config, links}); }} placeholder="https://..." /></div>
              <div className="w-20"><Label className="text-xs">%</Label><Input type="number" min={0} max={100} value={link.percentage} onChange={e => { const links = [...((config.links as any[]) || [{url:'',percentage:50},{url:'',percentage:50}])]; links[i] = {...links[i], percentage: parseInt(e.target.value) || 0}; setConfig({...config, links}); }} /></div>
              {i > 1 && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { const links = ((config.links as any[]) || []).filter((_: any, j: number) => j !== i); setConfig({...config, links}); }}><X className="h-3 w-3" /></Button>}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setConfig({...config, links: [...((config.links as any[]) || [{url:'',percentage:50},{url:'',percentage:50}]), {url:'', percentage:0}]})}><Plus className="h-3 w-3 mr-1" />Adicionar Link</Button>
        </div>);
      case 'note':
        return (<div className="space-y-4"><div><Label>Anotação da equipe</Label><Textarea rows={4} placeholder="Notas internas sobre este ponto do fluxo..." value={String(config.text || '')} onChange={e => setConfig({ ...config, text: e.target.value })} /></div><div><Label>Cor</Label><Select value={String(config.color || 'yellow')} onValueChange={v => setConfig({ ...config, color: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yellow">Amarelo</SelectItem><SelectItem value="blue">Azul</SelectItem><SelectItem value="green">Verde</SelectItem><SelectItem value="pink">Rosa</SelectItem></SelectContent></Select></div></div>);
      default:
        return <p className="text-sm text-muted-foreground">Nenhuma configuração adicional necessária.</p>;
    }
  };

  const dialogTitle = () => {
    const titles: Record<string, string> = {
      timer: 'Configurar Timer',
      warmup: 'Aquecimento',
      send_email_marketing: 'Configurar Email Marketing',
      send_email_performance: 'Configurar Email Performance',
      tag_filter: 'Configurar Tag',
      send_whatsapp: 'Configurar WhatsApp',
      send_whatsapp_oficial: 'Configurar WhatsApp Oficial',
      send_dm: 'Configurar DM',
      send_sms: 'Configurar SMS',
      pixel: 'Configurar Pixel',
      full_page: 'Configurar Full Page',
      abandonment: 'Configurar Abandono',
      conditional: 'Condicional',
      list_tag: 'Listar Tag',
      voice_torpedo: 'Torpedo de Voz',
      parallel_channels: 'Espinha de Peixe',
      edit_whatsapp_group: 'Editar Grupo WhatsApp',
      link_split: 'Link Split',
      note: 'Anotação',
    };
    return titles[node.subtype] || `Configurar: ${node.label}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{dialogTitle()}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">{renderFields()}</div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => { onSave(config); onClose(); }}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Trigger Selection Screen ───
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
            <p className="text-muted-foreground text-sm mb-6">Crie seu primeiro fluxo de automação visual estilo ManyChat</p>
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
  const editId2 = searchParams.get('id');
  const { data: nodeAnalytics } = useFlowNodeAnalytics(editId2 || undefined);

  const editId = searchParams.get('id');
  const isNew = searchParams.get('new') === '1';
  const [mode, setMode] = useState<'list' | 'editor'>(editId || isNew ? 'editor' : 'list');
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(editId);

  const [flowName, setFlowName] = useState(searchParams.get('name') || 'Meu Fluxo');
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [addStepOpen, setAddStepOpen] = useState(false);
  const [addAfterIndex, setAddAfterIndex] = useState<number>(-1);
  const [editingNode, setEditingNode] = useState<FlowNode | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newCampaignOpen, setNewCampaignOpen] = useState(false);

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
          config: { keyword: tc?.keyword, post_url: tc?.post_url, story_url: tc?.story_url, story_id: tc?.story_id, form_id: tc?.form_id, form_name: tc?.form_name, contact_source: tc?.contact_source, source_automation_id: tc?.source_automation_id, message_source_type: tc?.message_source_type, reply_type: tc?.reply_type, interaction_type: tc?.interaction_type, match_type: tc?.match_type, auto_tag: tc?.auto_tag } as Record<string, unknown>,
        };
        const actionData = (existing.actions as Array<{ id: string; type: string; config: Record<string, unknown> }>) || [];
        const actionNodes: FlowNode[] = actionData.map(a => {
          const info = [...actionOptions, ...conditionOptions].find(o => o.id === a.type);
          return {
            id: a.id || crypto.randomUUID(),
            type: conditionOptions.some(c => c.id === a.type) ? 'condition' as const
              : ['wait'].includes(a.type) ? 'delay' as const
              : a.type === 'timer' ? 'timer' as const
              : a.type === 'warmup' ? 'warmup' as const
              : 'action' as const,
            subtype: a.type,
            label: info?.label || a.type,
            config: a.config || {},
          };
        });
        setNodes([triggerNode, ...actionNodes]);
      }
    }
  }, [currentFlowId, automations]);

  const hasTrigger = nodes.length > 0 && nodes[0].type === 'trigger';

  const handleSelectTrigger = (triggerId: string) => {
    const trigger = triggerOptions.find(t => t.id === triggerId);
    if (!trigger) return;
    setNodes([{ id: crypto.randomUUID(), type: 'trigger', subtype: triggerId, label: trigger.label, config: {} }]);
  };

  const handleAddStep = (type: FlowNode['type'], subtype: string) => {
    const info = [...actionOptions, ...conditionOptions].find(a => a.id === subtype);
    if (!info) return;
    const newNode: FlowNode = { id: crypto.randomUUID(), type, subtype, label: info.label, config: {} };
    setNodes(prev => {
      const copy = [...prev];
      copy.splice(addAfterIndex + 1, 0, newNode);
      return copy;
    });
  };

  const handleDeleteNode = (index: number) => {
    if (index === 0) { setNodes([]); return; }
    setNodes(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditNode = (node: FlowNode) => { setEditingNode(node); setEditDialogOpen(true); };
  const handleSaveNodeConfig = (config: Record<string, unknown>) => {
    if (!editingNode) return;
    setNodes(prev => prev.map(n => n.id === editingNode.id ? { ...n, config } : n));
    setEditingNode(null);
  };

  const handleSave = () => {
    if (!hasTrigger || nodes.length < 2) {
      toast({ title: 'Fluxo incompleto', description: 'Adicione pelo menos um gatilho e uma ação.', variant: 'destructive' });
      return;
    }

    const triggerNode = nodes[0];
    const trigger = triggerOptions.find(t => t.id === triggerNode.subtype);
    const actionNodes = nodes.slice(1);

    const actions = actionNodes.map(n => ({
      id: n.id,
      type: n.subtype,
      config: n.config as Record<string, Json>,
    })) as Json;

    const triggerConfig = {
      channel: trigger?.channel || 'instagram',
      flow_builder: true,
      original_trigger: triggerNode.subtype,
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
      });
      toast({ title: '✅ Fluxo criado!' });
    }

    setMode('list');
    setCurrentFlowId(null);
    setNodes([]);
    setSearchParams({});
  };

  const handleCreateNew = () => {
    setNewCampaignOpen(true);
  };

  const handleCampaignCreate = (name: string, _method: string, _templateId?: string) => {
    setNewCampaignOpen(false);
    setCurrentFlowId(null);
    setFlowName(name);
    setNodes([]);
    setIsActive(false);
    setMode('editor');
  };

  const handleImportCode = (name: string, code: string) => {
    try {
      let data: any;
      try { data = JSON.parse(atob(code)); } catch { data = JSON.parse(code); }
      if (data.nodes && Array.isArray(data.nodes)) {
        setCurrentFlowId(null);
        setFlowName(name || data.name || 'Fluxo Importado');
        setNodes(data.nodes.map((n: any) => ({ ...n, id: crypto.randomUUID() })));
        setIsActive(false);
        setMode('editor');
        toast({ title: '✅ Fluxo importado com sucesso!' });
      }
    } catch {
      toast({ title: 'Erro ao importar', description: 'Código inválido', variant: 'destructive' });
    }
  };

  const handleExportCode = () => {
    const exportData = { name: flowName, nodes: nodes.map(n => ({ type: n.type, subtype: n.subtype, label: n.label, config: n.config })) };
    const code = btoa(JSON.stringify(exportData));
    navigator.clipboard.writeText(code);
    toast({ title: '📋 Código copiado!', description: 'Cole o código para duplicar este fluxo em qualquer projeto.' });
  };

  const handleEditFlow = (id: string) => {
    setCurrentFlowId(id);
    setMode('editor');
  };

  const handleBackToList = () => {
    setMode('list');
    setCurrentFlowId(null);
    setNodes([]);
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

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col animate-fade-in">
      <div className="flex items-center justify-between border-b bg-card/50 backdrop-blur-sm px-4 py-3 sticky top-0 z-10">
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
            <Button variant="outline" size="sm" onClick={handleExportCode} title="Exportar código do fluxo">
              <Copy className="h-4 w-4 mr-2" />Exportar Código
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasTrigger || nodes.length < 2}>
            <Save className="h-4 w-4 mr-2" />{currentFlowId ? 'Atualizar' : 'Salvar'} Fluxo
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col items-center py-10 px-4 min-h-[60vh]">
          {!hasTrigger ? (
            <TriggerSelector onSelect={handleSelectTrigger} />
          ) : (
            <>
              {nodes.map((node, index) => (
                <FlowNodeCard
                  key={node.id}
                  node={node}
                  onEdit={() => handleEditNode(node)}
                  onDelete={() => handleDeleteNode(index)}
                  onAddAfter={() => { setAddAfterIndex(index); setAddStepOpen(true); }}
                  analytics={nodeAnalytics?.find(a => a.node_id === node.id)}
                />
              ))}
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground font-medium">FIM</span>
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      <AddStepDialog open={addStepOpen} onClose={() => setAddStepOpen(false)} onAdd={handleAddStep} />
      <NodeConfigDialog node={editingNode} open={editDialogOpen} onClose={() => { setEditDialogOpen(false); setEditingNode(null); }} onSave={handleSaveNodeConfig} />
    </div>
  );
}
