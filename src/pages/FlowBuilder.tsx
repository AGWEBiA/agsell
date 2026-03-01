import React, { useState, useCallback } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAutomations } from '@/hooks/useAutomations';
import { cn } from '@/lib/utils';
import type { Json } from '@/integrations/supabase/types';
import {
  ArrowLeft, Plus, Save, Play, Pause, Trash2,
  Zap, MessageSquare, Mail, Instagram, Send,
  Heart, Eye, UserPlus, MessageCircle, Sparkles,
  Tag, Star, Bell, Clock, CheckSquare, GitBranch,
  ArrowDown, Settings, GripVertical, X, Copy,
} from 'lucide-react';

// ─── Types ───
interface FlowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay';
  subtype: string;
  label: string;
  config: Record<string, unknown>;
  children?: string[]; // IDs of next nodes
  conditionTrue?: string; // For condition nodes
  conditionFalse?: string;
}

interface FlowData {
  nodes: FlowNode[];
}

// ─── Trigger definitions ───
const triggerOptions = [
  { id: 'instagram_comment', label: 'Comentário no Post', icon: Heart, channel: 'instagram', color: 'from-pink-500 to-purple-500', description: 'Quando alguém comenta em qualquer post' },
  { id: 'instagram_specific_post', label: 'Post Específico', icon: Instagram, channel: 'instagram', color: 'from-purple-500 to-pink-500', description: 'Quando alguém comenta em um post específico' },
  { id: 'instagram_dm', label: 'DM Recebida', icon: MessageCircle, channel: 'instagram', color: 'from-purple-500 to-orange-400', description: 'Quando alguém envia uma DM' },
  { id: 'instagram_story_reply', label: 'Resposta ao Story', icon: Eye, channel: 'instagram', color: 'from-pink-400 to-orange-400', description: 'Quando alguém responde ou reage ao seu story' },
  { id: 'instagram_new_follower', label: 'Novo Seguidor', icon: UserPlus, channel: 'instagram', color: 'from-purple-400 to-pink-400', description: 'Quando alguém começa a seguir você' },
  { id: 'whatsapp_received', label: 'Mensagem WhatsApp', icon: MessageSquare, channel: 'whatsapp', color: 'from-green-500 to-emerald-500', description: 'Quando receber uma mensagem no WhatsApp' },
  { id: 'whatsapp_keyword', label: 'Palavra-chave WhatsApp', icon: Sparkles, channel: 'whatsapp', color: 'from-emerald-500 to-teal-500', description: 'Quando mensagem contém palavra-chave' },
  { id: 'contact_created', label: 'Contato Criado', icon: UserPlus, channel: 'crm', color: 'from-blue-500 to-indigo-500', description: 'Quando um novo contato é adicionado' },
  { id: 'form_submitted', label: 'Formulário Enviado', icon: CheckSquare, channel: 'crm', color: 'from-indigo-500 to-blue-500', description: 'Quando um formulário é preenchido' },
];

// ─── Action definitions ───
const actionOptions = [
  { id: 'send_dm', label: 'Enviar DM', icon: Send, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
  { id: 'reply_comment', label: 'Responder Comentário', icon: Heart, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { id: 'send_whatsapp', label: 'Enviar WhatsApp', icon: MessageSquare, color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  { id: 'send_email', label: 'Enviar E-mail', icon: Mail, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { id: 'add_tag', label: 'Adicionar Tag', icon: Tag, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { id: 'remove_tag', label: 'Remover Tag', icon: Tag, color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  { id: 'update_score', label: 'Atualizar Score', icon: Star, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  { id: 'send_notification', label: 'Notificar Equipe', icon: Bell, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  { id: 'create_task', label: 'Criar Tarefa', icon: CheckSquare, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
];

const delayOptions = [
  { id: 'wait', label: 'Aguardar', icon: Clock, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
];

const conditionOptions = [
  { id: 'if_tag', label: 'Se tem Tag', icon: GitBranch, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { id: 'if_keyword', label: 'Se contém palavra', icon: GitBranch, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { id: 'if_score', label: 'Se score ≥', icon: GitBranch, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
];

// ─── Node Component ───
function FlowNodeCard({ node, onEdit, onDelete, onAddAfter, isFirst }: {
  node: FlowNode;
  onEdit: () => void;
  onDelete: () => void;
  onAddAfter: () => void;
  isFirst?: boolean;
}) {
  const getTriggerInfo = () => triggerOptions.find(t => t.id === node.subtype);
  const getActionInfo = () => [...actionOptions, ...delayOptions, ...conditionOptions].find(a => a.id === node.subtype);

  if (node.type === 'trigger') {
    const info = getTriggerInfo();
    if (!info) return null;
    const Icon = info.icon;
    return (
      <div className="flex flex-col items-center">
        <div 
          className={cn(
            'relative w-[340px] rounded-2xl p-[2px] cursor-pointer group',
            `bg-gradient-to-r ${info.color}`
          )}
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
                {node.config.keyword && (
                  <p className="text-xs text-muted-foreground mt-0.5">Palavra: "{String(node.config.keyword)}"</p>
                )}
                {node.config.post_url && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">Post: {String(node.config.post_url)}</p>
                )}
              </div>
              <Settings className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
        {/* Connector */}
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-6 bg-border" />
          <button
            onClick={onAddAfter}
            className="flex items-center justify-center h-7 w-7 rounded-full border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/10 transition-all group"
          >
            <Plus className="h-3.5 w-3.5 text-primary/60 group-hover:text-primary" />
          </button>
          <div className="w-0.5 h-6 bg-border" />
        </div>
      </div>
    );
  }

  // Action / Delay / Condition node
  const info = getActionInfo();
  if (!info) return null;
  const Icon = info.icon;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-[340px] rounded-xl border-2 border-border hover:border-primary/40 bg-card p-4 cursor-pointer group transition-colors"
        onClick={onEdit}
      >
        {/* Delete button */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        >
          <X className="h-3 w-3" />
        </button>

        <div className="flex items-center gap-3">
          <div className={cn('flex items-center justify-center h-10 w-10 rounded-lg', info.color)}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {node.type === 'condition' ? 'CONDIÇÃO' : node.type === 'delay' ? 'ESPERA' : 'AÇÃO'}
              </Badge>
            </div>
            <p className="font-medium text-sm mt-0.5">{info.label}</p>
            {/* Config summary */}
            {node.config.message && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[240px]">"{String(node.config.message)}"</p>
            )}
            {node.config.tag_name && (
              <p className="text-xs text-muted-foreground mt-0.5">Tag: {String(node.config.tag_name)}</p>
            )}
            {node.config.duration && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {String(node.config.duration)} {node.config.unit === 'minutes' ? 'min' : node.config.unit === 'hours' ? 'h' : 'dias'}
              </p>
            )}
          </div>
          <Settings className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {node.type === 'condition' && (
          <div className="mt-3 flex gap-2 text-xs">
            <div className="flex-1 rounded-md bg-green-50 dark:bg-green-900/20 p-2 text-center text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
              ✅ Sim
            </div>
            <div className="flex-1 rounded-md bg-red-50 dark:bg-red-900/20 p-2 text-center text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
              ❌ Não
            </div>
          </div>
        )}
      </div>
      {/* Connector */}
      <div className="flex flex-col items-center">
        <div className="w-0.5 h-6 bg-border" />
        <button
          onClick={onAddAfter}
          className="flex items-center justify-center h-7 w-7 rounded-full border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/10 transition-all group"
        >
          <Plus className="h-3.5 w-3.5 text-primary/60 group-hover:text-primary" />
        </button>
        <div className="w-0.5 h-6 bg-border" />
      </div>
    </div>
  );
}

// ─── Add Step Dialog ───
function AddStepDialog({ open, onClose, onAdd }: {
  open: boolean;
  onClose: () => void;
  onAdd: (type: 'action' | 'condition' | 'delay', subtype: string) => void;
}) {
  const [tab, setTab] = useState<'actions' | 'conditions' | 'delay'>('actions');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Passo</DialogTitle>
          <DialogDescription>Escolha o que acontece a seguir no seu fluxo</DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-2 mb-4">
          {[
            { key: 'actions' as const, label: 'Ações', icon: Zap },
            { key: 'conditions' as const, label: 'Condições', icon: GitBranch },
            { key: 'delay' as const, label: 'Espera', icon: Clock },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                tab === t.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
          {tab === 'actions' && actionOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => { onAdd('action', opt.id); onClose(); }}
              className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all text-left"
            >
              <div className={cn('flex items-center justify-center h-9 w-9 rounded-lg', opt.color)}>
                <opt.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
          {tab === 'conditions' && conditionOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => { onAdd('condition', opt.id); onClose(); }}
              className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all text-left"
            >
              <div className={cn('flex items-center justify-center h-9 w-9 rounded-lg', opt.color)}>
                <opt.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
          {tab === 'delay' && delayOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => { onAdd('delay', opt.id); onClose(); }}
              className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all text-left"
            >
              <div className={cn('flex items-center justify-center h-9 w-9 rounded-lg', opt.color)}>
                <opt.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
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

  React.useEffect(() => {
    if (node) setConfig(node.config);
  }, [node]);

  if (!node) return null;

  const renderFields = () => {
    switch (node.subtype) {
      case 'instagram_comment':
      case 'instagram_dm':
      case 'whatsapp_keyword':
        return (
          <div className="space-y-4">
            <div>
              <Label>Palavra-chave (opcional)</Label>
              <Input
                placeholder="Ex: INFO, QUERO, PROMO"
                value={String(config.keyword || '')}
                onChange={e => setConfig({ ...config, keyword: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">Deixe vazio para ativar com qualquer mensagem</p>
            </div>
          </div>
        );
      case 'instagram_specific_post':
        return (
          <div className="space-y-4">
            <div>
              <Label>URL do Post</Label>
              <Input
                placeholder="https://www.instagram.com/p/..."
                value={String(config.post_url || '')}
                onChange={e => setConfig({ ...config, post_url: e.target.value })}
              />
            </div>
            <div>
              <Label>Palavra-chave (opcional)</Label>
              <Input
                placeholder="Ex: QUERO"
                value={String(config.keyword || '')}
                onChange={e => setConfig({ ...config, keyword: e.target.value })}
              />
            </div>
          </div>
        );
      case 'send_dm':
      case 'reply_comment':
      case 'send_whatsapp':
        return (
          <div className="space-y-4">
            <div>
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Olá! Obrigado pelo seu interesse..."
                rows={4}
                value={String(config.message || '')}
                onChange={e => setConfig({ ...config, message: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">Use {'{{nome}}'} para personalizar com o nome do contato</p>
            </div>
          </div>
        );
      case 'send_email':
        return (
          <div className="space-y-4">
            <div>
              <Label>Assunto</Label>
              <Input
                placeholder="Assunto do email"
                value={String(config.subject || '')}
                onChange={e => setConfig({ ...config, subject: e.target.value })}
              />
            </div>
            <div>
              <Label>Conteúdo</Label>
              <Textarea
                placeholder="Conteúdo do email..."
                rows={4}
                value={String(config.content || '')}
                onChange={e => setConfig({ ...config, content: e.target.value })}
              />
            </div>
          </div>
        );
      case 'add_tag':
      case 'remove_tag':
        return (
          <div>
            <Label>Nome da Tag</Label>
            <Input
              placeholder="Ex: Lead Quente"
              value={String(config.tag_name || '')}
              onChange={e => setConfig({ ...config, tag_name: e.target.value })}
            />
          </div>
        );
      case 'update_score':
        return (
          <div className="space-y-4">
            <div>
              <Label>Operação</Label>
              <Select value={String(config.operation || 'add')} onValueChange={v => setConfig({ ...config, operation: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Adicionar pontos</SelectItem>
                  <SelectItem value="subtract">Subtrair pontos</SelectItem>
                  <SelectItem value="set">Definir valor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pontos</Label>
              <Input type="number" placeholder="10" value={String(config.points || '')} onChange={e => setConfig({ ...config, points: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
        );
      case 'send_notification':
        return (
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input placeholder="Nova interação!" value={String(config.title || '')} onChange={e => setConfig({ ...config, title: e.target.value })} />
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea placeholder="Detalhes da notificação..." rows={3} value={String(config.message || '')} onChange={e => setConfig({ ...config, message: e.target.value })} />
            </div>
          </div>
        );
      case 'create_task':
        return (
          <div className="space-y-4">
            <div>
              <Label>Título da Tarefa</Label>
              <Input placeholder="Follow-up com lead" value={String(config.title || '')} onChange={e => setConfig({ ...config, title: e.target.value })} />
            </div>
            <div>
              <Label>Prazo (dias)</Label>
              <Input type="number" placeholder="3" value={String(config.due_days || '')} onChange={e => setConfig({ ...config, due_days: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
        );
      case 'wait':
        return (
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Tempo</Label>
              <Input type="number" placeholder="1" value={String(config.duration || '')} onChange={e => setConfig({ ...config, duration: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex-1">
              <Label>Unidade</Label>
              <Select value={String(config.unit || 'hours')} onValueChange={v => setConfig({ ...config, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutos</SelectItem>
                  <SelectItem value="hours">Horas</SelectItem>
                  <SelectItem value="days">Dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'if_tag':
        return (
          <div>
            <Label>Tag para verificar</Label>
            <Input placeholder="Ex: Lead Quente" value={String(config.tag_name || '')} onChange={e => setConfig({ ...config, tag_name: e.target.value })} />
          </div>
        );
      case 'if_keyword':
        return (
          <div>
            <Label>Palavra para verificar</Label>
            <Input placeholder="Ex: comprar" value={String(config.keyword || '')} onChange={e => setConfig({ ...config, keyword: e.target.value })} />
          </div>
        );
      case 'if_score':
        return (
          <div>
            <Label>Score mínimo</Label>
            <Input type="number" placeholder="50" value={String(config.min_score || '')} onChange={e => setConfig({ ...config, min_score: parseInt(e.target.value) || 0 })} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar: {node.label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {renderFields()}
        </div>
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
  const [filter, setFilter] = useState<'all' | 'instagram' | 'whatsapp' | 'crm'>('all');

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

      <div className="flex gap-2 mb-6">
        {[
          { key: 'all' as const, label: 'Todos' },
          { key: 'instagram' as const, label: '📸 Instagram' },
          { key: 'whatsapp' as const, label: '💬 WhatsApp' },
          { key: 'crm' as const, label: '👤 CRM' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl">
        {filtered.map(trigger => {
          const Icon = trigger.icon;
          return (
            <button
              key={trigger.id}
              onClick={() => onSelect(trigger.id)}
              className="flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/50 bg-card hover:shadow-lg transition-all text-left group"
            >
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

// ─── Main Flow Builder ───
export default function FlowBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { createAutomation } = useAutomations();

  const [flowName, setFlowName] = useState(searchParams.get('name') || 'Meu Fluxo');
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [addStepOpen, setAddStepOpen] = useState(false);
  const [addAfterIndex, setAddAfterIndex] = useState<number>(-1);
  const [editingNode, setEditingNode] = useState<FlowNode | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const hasTrigger = nodes.length > 0 && nodes[0].type === 'trigger';

  const handleSelectTrigger = (triggerId: string) => {
    const trigger = triggerOptions.find(t => t.id === triggerId);
    if (!trigger) return;
    setNodes([{
      id: crypto.randomUUID(),
      type: 'trigger',
      subtype: triggerId,
      label: trigger.label,
      config: {},
    }]);
  };

  const handleAddStep = (type: 'action' | 'condition' | 'delay', subtype: string) => {
    const info = [...actionOptions, ...delayOptions, ...conditionOptions].find(a => a.id === subtype);
    if (!info) return;
    
    const newNode: FlowNode = {
      id: crypto.randomUUID(),
      type,
      subtype,
      label: info.label,
      config: {},
    };

    setNodes(prev => {
      const copy = [...prev];
      copy.splice(addAfterIndex + 1, 0, newNode);
      return copy;
    });
  };

  const handleDeleteNode = (index: number) => {
    if (index === 0) {
      // Resetting trigger resets everything
      setNodes([]);
      return;
    }
    setNodes(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditNode = (node: FlowNode) => {
    setEditingNode(node);
    setEditDialogOpen(true);
  };

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

    // Map to automation format
    const triggerTypeMap: Record<string, string> = {
      instagram_comment: 'instagram_comment',
      instagram_specific_post: 'instagram_comment',
      instagram_dm: 'instagram_dm',
      instagram_story_reply: 'instagram_comment',
      instagram_new_follower: 'contact_created',
      whatsapp_received: 'whatsapp_received',
      whatsapp_keyword: 'whatsapp_received',
      contact_created: 'contact_created',
      form_submitted: 'form_submitted',
    };

    const actions = actionNodes.map(n => ({
      id: n.id,
      type: n.subtype,
      config: n.config as Record<string, Json>,
    })) as Json;

    createAutomation.mutate({
      name: flowName,
      trigger_type: triggerTypeMap[triggerNode.subtype] || triggerNode.subtype,
      trigger_config: {
        channel: trigger?.channel || 'instagram',
        flow_builder: true,
        original_trigger: triggerNode.subtype,
        ...triggerNode.config,
      } as Record<string, Json>,
      actions,
      is_active: isActive,
    });

    toast({ title: '✅ Fluxo salvo!', description: 'Sua automação foi criada com sucesso.' });
    navigate('/automations');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b bg-card/50 backdrop-blur-sm px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/automations')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Input
            value={flowName}
            onChange={e => setFlowName(e.target.value)}
            className="font-semibold text-lg border-none bg-transparent shadow-none focus-visible:ring-0 w-[240px]"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {isActive ? 'Ativo' : 'Rascunho'}
            </span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <Button onClick={handleSave} disabled={!hasTrigger || nodes.length < 2}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Fluxo
          </Button>
        </div>
      </div>

      {/* Canvas */}
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
                  isFirst={index === 0}
                  onEdit={() => handleEditNode(node)}
                  onDelete={() => handleDeleteNode(index)}
                  onAddAfter={() => {
                    setAddAfterIndex(index);
                    setAddStepOpen(true);
                  }}
                />
              ))}

              {/* End marker */}
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground font-medium">FIM</span>
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Dialogs */}
      <AddStepDialog
        open={addStepOpen}
        onClose={() => setAddStepOpen(false)}
        onAdd={handleAddStep}
      />

      <NodeConfigDialog
        node={editingNode}
        open={editDialogOpen}
        onClose={() => { setEditDialogOpen(false); setEditingNode(null); }}
        onSave={handleSaveNodeConfig}
      />
    </div>
  );
}
