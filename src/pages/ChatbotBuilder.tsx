import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Bot, Plus, Trash2, Settings, MessageSquare, ArrowRight, GitBranch,
  Phone, Mail, Tag, Clock, Users, Shield, X, ChevronDown, ChevronUp,
  Copy, Save, Loader2, PlayCircle, PauseCircle, GripVertical,
  MessageCircle, UserPlus, PhoneForwarded, XCircle, Zap, Brain,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Chatbot Node Types ───
type ChatbotNodeType =
  | 'welcome' | 'text_message' | 'menu' | 'ask_input'
  | 'condition' | 'transfer_department' | 'transfer_agent'
  | 'add_tag' | 'remove_tag' | 'close_conversation'
  | 'webhook' | 'delay' | 'ai_response'
  | 'ai_mission' | 'no_interaction' | 'transfer_human';

interface ChatbotNode {
  id: string;
  type: ChatbotNodeType;
  label: string;
  config: Record<string, unknown>;
  connections: { label: string; targetId: string | null }[];
}

interface ChatbotRule {
  id: string;
  name: string;
  departments: string[];
  officeHours: { enabled: boolean; start: string; end: string; days: number[] };
  includeTags: string[];
  excludeTags: string[];
  channels: string[];
  isActive: boolean;
}

interface Chatbot {
  id: string;
  name: string;
  description: string;
  nodes: ChatbotNode[];
  rules: ChatbotRule[];
  isActive: boolean;
  channel: string;
}

const nodeTypes: { type: ChatbotNodeType; label: string; icon: typeof Bot; color: string; category: string }[] = [
  { type: 'welcome', label: 'Boas-vindas', icon: MessageCircle, color: 'bg-green-500', category: 'Mensagens' },
  { type: 'text_message', label: 'Mensagem Pré-definida', icon: MessageSquare, color: 'bg-blue-500', category: 'Mensagens' },
  { type: 'menu', label: 'Menu de Opções', icon: GitBranch, color: 'bg-purple-500', category: 'Mensagens' },
  { type: 'ask_input', label: 'Solicitar Dados', icon: UserPlus, color: 'bg-cyan-500', category: 'Mensagens' },
  { type: 'no_interaction', label: 'Mensagem sem Interação', icon: MessageSquare, color: 'bg-slate-500', category: 'Mensagens' },
  { type: 'ai_response', label: 'Resposta IA (Simples)', icon: Bot, color: 'bg-amber-500', category: 'IA' },
  { type: 'ai_mission', label: 'Mensagem por IA', icon: Brain, color: 'bg-violet-500', category: 'IA' },
  { type: 'condition', label: 'Condição', icon: GitBranch, color: 'bg-yellow-500', category: 'Lógica' },
  { type: 'delay', label: 'Aguardar', icon: Clock, color: 'bg-orange-500', category: 'Lógica' },
  { type: 'transfer_department', label: 'Transferir Depto', icon: Users, color: 'bg-indigo-500', category: 'Ações' },
  { type: 'transfer_agent', label: 'Transferir Agente', icon: PhoneForwarded, color: 'bg-teal-500', category: 'Ações' },
  { type: 'transfer_human', label: 'Transferir p/ Humano', icon: Phone, color: 'bg-blue-600', category: 'Ações' },
  { type: 'add_tag', label: 'Adicionar Tag', icon: Tag, color: 'bg-pink-500', category: 'Ações' },
  { type: 'remove_tag', label: 'Remover Tag', icon: Tag, color: 'bg-rose-500', category: 'Ações' },
  { type: 'close_conversation', label: 'Encerrar', icon: XCircle, color: 'bg-red-500', category: 'Ações' },
  { type: 'webhook', label: 'Webhook', icon: Zap, color: 'bg-violet-500', category: 'Ações' },
];

const defaultNodeConfig = (type: ChatbotNodeType): Record<string, unknown> => {
  switch (type) {
    case 'welcome': return { message: 'Olá! 👋 Como posso ajudá-lo hoje?', afterHoursMessage: 'No momento estamos fora do horário de atendimento.', delay_ms: 0 };
    case 'text_message': return { message: '', delay_ms: 1500, buttons: [] };
    case 'no_interaction': return { message: '', delay_ms: 0 };
    case 'menu': return { message: 'Escolha uma opção:', options: [{ label: 'Opção 1', value: '1' }, { label: 'Opção 2', value: '2' }], fallback_message: 'Não entendi. Por favor, escolha uma das opções.' };
    case 'ask_input': return { field: 'name', prompt: 'Qual seu nome?', validation: 'text' };
    case 'ai_response': return { systemPrompt: '', maxTokens: 500 };
    case 'ai_mission': return {
      mission: '',
      validation_prompt: '',
      repeat_validation: 3,
      block_context: '',
      voice_response: false,
      voice_word_limit: 100,
      next_block_default: null,
    };
    case 'condition': return { field: 'keyword', operator: 'contains', value: '' };
    case 'delay': return { seconds: 5 };
    case 'transfer_department': return { department: '' };
    case 'transfer_agent': return { agentId: '' };
    case 'transfer_human': return { message: 'Transferindo para um atendente humano...' };
    case 'add_tag': return { tagName: '' };
    case 'remove_tag': return { tagName: '' };
    case 'close_conversation': return { message: 'Obrigado pelo contato! 😊' };
    case 'webhook': return { url: '', method: 'POST' };
    default: return {};
  }
};

const defaultConnections = (type: ChatbotNodeType): { label: string; targetId: string | null }[] => {
  switch (type) {
    case 'menu': return [{ label: 'Opção 1', targetId: null }, { label: 'Opção 2', targetId: null }];
    case 'condition': return [{ label: 'Verdadeiro', targetId: null }, { label: 'Falso', targetId: null }];
    default: return [{ label: 'Próximo', targetId: null }];
  }
};

// ─── Node Config Editor ───
function NodeConfigEditor({ node, onUpdate, allNodes }: { node: ChatbotNode; onUpdate: (n: ChatbotNode) => void; allNodes: ChatbotNode[] }) {
  const c = node.config;
  const updateConfig = (data: Record<string, unknown>) => onUpdate({ ...node, config: { ...c, ...data } });

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Rótulo do Bloco</Label>
        <Input value={node.label} onChange={e => onUpdate({ ...node, label: e.target.value })} className="h-8 text-xs" />
      </div>
      <Separator />

      {(node.type === 'welcome' || node.type === 'text_message') && (
        <div>
          <Label className="text-xs">Mensagem</Label>
          <Textarea rows={4} value={(c.message as string) || ''} onChange={e => updateConfig({ message: e.target.value })} className="text-xs" />
        </div>
      )}

      {node.type === 'welcome' && (
        <div>
          <Label className="text-xs">Mensagem Fora do Horário</Label>
          <Textarea rows={2} value={(c.afterHoursMessage as string) || ''} onChange={e => updateConfig({ afterHoursMessage: e.target.value })} className="text-xs" />
        </div>
      )}

      {node.type === 'menu' && (
        <>
          <div>
            <Label className="text-xs">Mensagem do Menu</Label>
            <Textarea rows={2} value={(c.message as string) || ''} onChange={e => updateConfig({ message: e.target.value })} className="text-xs" />
          </div>
          <Label className="text-xs">Opções</Label>
          {((c.options as any[]) || []).map((opt: any, i: number) => (
            <div key={i} className="flex gap-1">
              <Input value={opt.label} onChange={e => { const opts = [...(c.options as any[])]; opts[i] = { ...opt, label: e.target.value }; updateConfig({ options: opts }); }} className="h-7 text-xs" />
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => {
                const opts = (c.options as any[]).filter((_: any, j: number) => j !== i);
                const conns = node.connections.filter((_, j) => j !== i);
                onUpdate({ ...node, config: { ...c, options: opts }, connections: conns });
              }}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => {
            const opts = [...(c.options as any[]), { label: `Opção ${(c.options as any[]).length + 1}`, value: String((c.options as any[]).length + 1) }];
            const conns = [...node.connections, { label: `Opção ${opts.length}`, targetId: null }];
            onUpdate({ ...node, config: { ...c, options: opts }, connections: conns });
          }}><Plus className="h-3 w-3 mr-1" />Adicionar Opção</Button>
        </>
      )}

      {node.type === 'ask_input' && (
        <>
          <div>
            <Label className="text-xs">Campo a solicitar</Label>
            <Select value={(c.field as string) || 'name'} onValueChange={v => updateConfig({ field: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="phone">Telefone</SelectItem>
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Mensagem de Solicitação</Label>
            <Input value={(c.prompt as string) || ''} onChange={e => updateConfig({ prompt: e.target.value })} className="h-8 text-xs" />
          </div>
        </>
      )}

      {node.type === 'condition' && (
        <>
          <div>
            <Label className="text-xs">Campo</Label>
            <Select value={(c.field as string) || 'keyword'} onValueChange={v => updateConfig({ field: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="keyword">Palavra-chave</SelectItem>
                <SelectItem value="tag">Tag</SelectItem>
                <SelectItem value="department">Departamento</SelectItem>
                <SelectItem value="channel">Canal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Valor</Label>
            <Input value={(c.value as string) || ''} onChange={e => updateConfig({ value: e.target.value })} className="h-8 text-xs" />
          </div>
        </>
      )}

      {node.type === 'delay' && (
        <div>
          <Label className="text-xs">Segundos de espera</Label>
          <Input type="number" value={(c.seconds as number) || 5} onChange={e => updateConfig({ seconds: Number(e.target.value) })} className="h-8 text-xs" />
        </div>
      )}

      {(node.type === 'transfer_department') && (
        <div>
          <Label className="text-xs">Departamento</Label>
          <Input value={(c.department as string) || ''} onChange={e => updateConfig({ department: e.target.value })} className="h-8 text-xs" placeholder="Ex: Vendas, Suporte" />
        </div>
      )}

      {(node.type === 'add_tag' || node.type === 'remove_tag') && (
        <div>
          <Label className="text-xs">Nome da Tag</Label>
          <Input value={(c.tagName as string) || ''} onChange={e => updateConfig({ tagName: e.target.value })} className="h-8 text-xs" />
        </div>
      )}

      {node.type === 'close_conversation' && (
        <div>
          <Label className="text-xs">Mensagem de Encerramento</Label>
          <Input value={(c.message as string) || ''} onChange={e => updateConfig({ message: e.target.value })} className="h-8 text-xs" />
        </div>
      )}

      {node.type === 'ai_response' && (
        <>
          <div>
            <Label className="text-xs">System Prompt</Label>
            <Textarea rows={3} value={(c.systemPrompt as string) || ''} onChange={e => updateConfig({ systemPrompt: e.target.value })} className="text-xs" placeholder="Instruções para a IA..." />
          </div>
          <div>
            <Label className="text-xs">Max Tokens</Label>
            <Input type="number" value={(c.maxTokens as number) || 500} onChange={e => updateConfig({ maxTokens: Number(e.target.value) })} className="h-8 text-xs" />
          </div>
        </>
      )}

      {node.type === 'ai_mission' && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium text-violet-600">Missão do Assistente *</Label>
            <Textarea rows={3} value={(c.mission as string) || ''} onChange={e => updateConfig({ mission: e.target.value })} className="text-xs" placeholder="Ex: Dê boas-vindas ao cliente e apresente-se como assistente virtual..." />
            <p className="text-[10px] text-muted-foreground mt-1">O que o assistente deve executar neste bloco</p>
          </div>
          <div>
            <Label className="text-xs">Prompt de Validação</Label>
            <Textarea rows={2} value={(c.validation_prompt as string) || ''} onChange={e => updateConfig({ validation_prompt: e.target.value })} className="text-xs" placeholder="Ex: O cliente já foi recebido com boas-vindas?" />
            <p className="text-[10px] text-muted-foreground mt-1">Pergunta SIM/NÃO para validar se a missão foi cumprida</p>
          </div>
          <div>
            <Label className="text-xs">Repetir Validação (tentativas)</Label>
            <Input type="number" min={1} max={10} value={(c.repeat_validation as number) || 3} onChange={e => updateConfig({ repeat_validation: Number(e.target.value) })} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Contexto do Bloco (opcional)</Label>
            <Textarea rows={2} value={(c.block_context as string) || ''} onChange={e => updateConfig({ block_context: e.target.value })} className="text-xs" placeholder="Informações específicas deste bloco..." />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Enviar resposta como áudio</Label>
            <Switch checked={(c.voice_response as boolean) || false} onCheckedChange={v => updateConfig({ voice_response: v })} />
          </div>
          {(c.voice_response as boolean) && (
            <div>
              <Label className="text-xs">Limite de palavras</Label>
              <Input type="number" value={(c.voice_word_limit as number) || 100} onChange={e => updateConfig({ voice_word_limit: Number(e.target.value) })} className="h-8 text-xs" />
            </div>
          )}
        </div>
      )}

      {node.type === 'no_interaction' && (
        <div>
          <Label className="text-xs">Mensagem (sem esperar resposta)</Label>
          <Textarea rows={3} value={(c.message as string) || ''} onChange={e => updateConfig({ message: e.target.value })} className="text-xs" placeholder="Mensagem enviada sem aguardar interação do lead..." />
          <p className="text-[10px] text-muted-foreground mt-1">O fluxo avança automaticamente após o envio</p>
        </div>
      )}

      {node.type === 'transfer_human' && (
        <div>
          <Label className="text-xs">Mensagem de Transferência</Label>
          <Input value={(c.message as string) || ''} onChange={e => updateConfig({ message: e.target.value })} className="h-8 text-xs" placeholder="Transferindo para atendente..." />
        </div>
      )}

      {(node.type === 'text_message') && (
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Delay entre blocos (ms)</Label>
            <Input type="number" value={(c.delay_ms as number) || 0} onChange={e => updateConfig({ delay_ms: Number(e.target.value) })} className="h-8 text-xs" />
            <p className="text-[10px] text-muted-foreground mt-1">Simula tempo de digitação</p>
          </div>
        </div>
      )}

      {node.type === 'webhook' && (
        <>
          <div>
            <Label className="text-xs">URL</Label>
            <Input value={(c.url as string) || ''} onChange={e => updateConfig({ url: e.target.value })} className="h-8 text-xs" placeholder="https://..." />
          </div>
          <div>
            <Label className="text-xs">Método</Label>
            <Select value={(c.method as string) || 'POST'} onValueChange={v => updateConfig({ method: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <Separator />
      <Label className="text-xs font-medium">Conexões</Label>
      {node.connections.map((conn, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] shrink-0">{conn.label}</Badge>
          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
          <Select value={conn.targetId || '_none'} onValueChange={v => {
            const conns = [...node.connections];
            conns[i] = { ...conn, targetId: v === '_none' ? null : v };
            onUpdate({ ...node, connections: conns });
          }}>
            <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Nenhum</SelectItem>
              {allNodes.filter(n => n.id !== node.id).map(n => (
                <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}

// ─── Rules Editor ───
function RulesEditor({ rules, onUpdate }: { rules: ChatbotRule[]; onUpdate: (rules: ChatbotRule[]) => void }) {
  const addRule = () => {
    onUpdate([...rules, {
      id: crypto.randomUUID(),
      name: `Regra ${rules.length + 1}`,
      departments: [],
      officeHours: { enabled: false, start: '08:00', end: '18:00', days: [1, 2, 3, 4, 5] },
      includeTags: [],
      excludeTags: [],
      channels: ['whatsapp'],
      isActive: true,
    }]);
  };

  const updateRule = (id: string, data: Partial<ChatbotRule>) => {
    onUpdate(rules.map(r => r.id === id ? { ...r, ...data } : r));
  };

  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-4">
      {rules.map(rule => (
        <Card key={rule.id} className="border">
          <CardHeader className="pb-2 pt-3 px-3">
            <div className="flex items-center justify-between">
              <Input value={rule.name} onChange={e => updateRule(rule.id, { name: e.target.value })} className="h-7 text-xs font-medium border-0 p-0 focus-visible:ring-0" />
              <div className="flex items-center gap-2">
                <Switch checked={rule.isActive} onCheckedChange={v => updateRule(rule.id, { isActive: v })} />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onUpdate(rules.filter(r => r.id !== rule.id))}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-3">
            <div>
              <Label className="text-xs">Canais</Label>
              <div className="flex gap-1 mt-1">
                {['whatsapp', 'instagram', 'email', 'telegram'].map(ch => (
                  <Badge key={ch} variant={rule.channels.includes(ch) ? 'default' : 'outline'} className="text-[10px] cursor-pointer" onClick={() => {
                    const channels = rule.channels.includes(ch) ? rule.channels.filter(c => c !== ch) : [...rule.channels, ch];
                    updateRule(rule.id, { channels });
                  }}>{ch}</Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">Departamentos (separar por vírgula)</Label>
              <Input value={rule.departments.join(', ')} onChange={e => updateRule(rule.id, { departments: e.target.value.split(',').map(d => d.trim()).filter(Boolean) })} className="h-7 text-xs" placeholder="Vendas, Suporte" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Switch checked={rule.officeHours.enabled} onCheckedChange={v => updateRule(rule.id, { officeHours: { ...rule.officeHours, enabled: v } })} />
                <Label className="text-xs">Horário de Atendimento</Label>
              </div>
              {rule.officeHours.enabled && (
                <div className="space-y-2 ml-6">
                  <div className="flex gap-2">
                    <div>
                      <Label className="text-[10px]">Início</Label>
                      <Input type="time" value={rule.officeHours.start} onChange={e => updateRule(rule.id, { officeHours: { ...rule.officeHours, start: e.target.value } })} className="h-7 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px]">Fim</Label>
                      <Input type="time" value={rule.officeHours.end} onChange={e => updateRule(rule.id, { officeHours: { ...rule.officeHours, end: e.target.value } })} className="h-7 text-xs" />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {dayLabels.map((d, i) => (
                      <Badge key={i} variant={rule.officeHours.days.includes(i) ? 'default' : 'outline'} className="text-[10px] cursor-pointer px-1.5" onClick={() => {
                        const days = rule.officeHours.days.includes(i) ? rule.officeHours.days.filter(day => day !== i) : [...rule.officeHours.days, i];
                        updateRule(rule.id, { officeHours: { ...rule.officeHours, days } });
                      }}>{d}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs text-green-600">Tags Inclusão (vírgula)</Label>
              <Input value={rule.includeTags.join(', ')} onChange={e => updateRule(rule.id, { includeTags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} className="h-7 text-xs" placeholder="cliente, vip" />
            </div>
            <div>
              <Label className="text-xs text-red-600">Tags Exclusão (vírgula)</Label>
              <Input value={rule.excludeTags.join(', ')} onChange={e => updateRule(rule.id, { excludeTags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} className="h-7 text-xs" placeholder="spam, bloqueado" />
            </div>
          </CardContent>
        </Card>
      ))}
      <Button size="sm" variant="outline" className="w-full" onClick={addRule}><Plus className="h-4 w-4 mr-1" />Adicionar Regra</Button>
    </div>
  );
}

// ─── Chatbot Visual Builder ───
function ChatbotVisualBuilder({ chatbot, onSave, onClose }: { chatbot: Chatbot; onSave: (c: Chatbot) => void; onClose: () => void }) {
  const [nodes, setNodes] = useState<ChatbotNode[]>(chatbot.nodes);
  const [rules, setRules] = useState<ChatbotRule[]>(chatbot.rules);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'nodes' | 'rules'>('nodes');
  const [name, setName] = useState(chatbot.name);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const addNode = (type: ChatbotNodeType) => {
    const nodeType = nodeTypes.find(t => t.type === type)!;
    const newNode: ChatbotNode = {
      id: crypto.randomUUID(),
      type,
      label: nodeType.label,
      config: defaultNodeConfig(type),
      connections: defaultConnections(type),
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const updateNode = (updated: ChatbotNode) => {
    setNodes(prev => prev.map(n => n.id === updated.id ? updated : n));
  };

  const removeNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id).map(n => ({
      ...n,
      connections: n.connections.map(c => c.targetId === id ? { ...c, targetId: null } : c),
    })));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const moveNode = (id: string, dir: 'up' | 'down') => {
    const idx = nodes.findIndex(n => n.id === id);
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === nodes.length - 1)) return;
    const arr = [...nodes];
    const newIdx = dir === 'up' ? idx - 1 : idx + 1;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setNodes(arr);
  };

  const handleSave = () => {
    onSave({ ...chatbot, name, nodes, rules });
    toast.success('Chatbot salvo!');
  };

  const categories = [...new Set(nodeTypes.map(n => n.category))];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
          <Bot className="h-5 w-5 text-primary" />
          <Input value={name} onChange={e => setName(e.target.value)} className="h-7 text-sm font-semibold border-0 p-0 focus-visible:ring-0 w-60" />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{nodes.length} blocos</Badge>
          <Badge variant="secondary">{rules.length} regras</Badge>
          <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" />Salvar</Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Palette & Rules */}
        <div className="w-56 border-r flex flex-col shrink-0">
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="flex flex-col h-full">
            <TabsList className="mx-2 mt-2 shrink-0">
              <TabsTrigger value="nodes" className="text-xs flex-1">Blocos</TabsTrigger>
              <TabsTrigger value="rules" className="text-xs flex-1">Regras</TabsTrigger>
            </TabsList>
            <ScrollArea className="flex-1">
              <TabsContent value="nodes" className="p-2 mt-0 space-y-3">
                {categories.map(cat => (
                  <div key={cat}>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1 px-1">{cat}</p>
                    <div className="space-y-1">
                      {nodeTypes.filter(n => n.category === cat).map(({ type, label, icon: Icon, color }) => (
                        <Button key={type} variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8" onClick={() => addNode(type)}>
                          <div className={`h-4 w-4 rounded flex items-center justify-center ${color}`}>
                            <Icon className="h-2.5 w-2.5 text-white" />
                          </div>
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="rules" className="p-2 mt-0">
                <RulesEditor rules={rules} onUpdate={setRules} />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Center: Flow Canvas */}
        <div className="flex-1 overflow-hidden flex flex-col bg-muted/30">
          <ScrollArea className="flex-1">
            <div className="max-w-[600px] mx-auto py-6 px-4">
              {nodes.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <Bot className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">Adicione blocos para construir o fluxo do chatbot</p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => addNode('welcome')}><MessageCircle className="h-4 w-4 mr-1" />Boas-vindas</Button>
                    <Button variant="outline" size="sm" onClick={() => addNode('menu')}><GitBranch className="h-4 w-4 mr-1" />Menu</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {nodes.map((node, idx) => {
                    const nodeType = nodeTypes.find(t => t.type === node.type);
                    const Icon = nodeType?.icon || Bot;
                    return (
                      <div key={node.id}>
                        <div
                          className={`group relative rounded-lg border-2 p-3 cursor-pointer transition-all ${selectedNodeId === node.id ? 'border-primary ring-1 ring-primary/20' : 'border-border hover:border-primary/40'} bg-card`}
                          onClick={() => setSelectedNodeId(node.id)}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`h-7 w-7 rounded flex items-center justify-center ${nodeType?.color || 'bg-muted'}`}>
                              <Icon className="h-3.5 w-3.5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{node.label}</p>
                              <p className="text-[10px] text-muted-foreground">{nodeType?.label}</p>
                            </div>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={e => { e.stopPropagation(); moveNode(node.id, 'up'); }}><ChevronUp className="h-3 w-3" /></Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={e => { e.stopPropagation(); moveNode(node.id, 'down'); }}><ChevronDown className="h-3 w-3" /></Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={e => { e.stopPropagation(); removeNode(node.id); }}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          </div>
                          {/* Show connections */}
                          {node.connections.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {node.connections.map((conn, ci) => (
                                <Badge key={ci} variant="outline" className="text-[9px]">
                                  {conn.label} → {conn.targetId ? nodes.find(n => n.id === conn.targetId)?.label || '?' : '...'}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {idx < nodes.length - 1 && (
                          <div className="flex justify-center py-1">
                            <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Properties */}
        <div className="w-64 border-l shrink-0 flex flex-col">
          <div className="p-3 border-b shrink-0">
            <p className="font-medium text-sm">Propriedades</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3">
              {selectedNode ? (
                <NodeConfigEditor node={selectedNode} onUpdate={updateNode} allNodes={nodes} />
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground">Selecione um bloco para editar</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function ChatbotBuilderPage() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const [editingChatbot, setEditingChatbot] = useState<Chatbot | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newBot, setNewBot] = useState({ name: '', channel: 'whatsapp', description: '' });

  const { data: chatbots = [], isLoading } = useQuery({
    queryKey: ['chatbots', orgId],
    queryFn: async (): Promise<Chatbot[]> => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        channel: row.channel,
        nodes: (row.nodes as ChatbotNode[]) || [],
        rules: (row.rules as ChatbotRule[]) || [],
        isActive: row.is_active,
      }));
    },
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: { name: string; channel: string; description: string }) => {
      if (!orgId) throw new Error('Organização não selecionada');
      const { data: { user } } = await supabase.auth.getUser();
      const initialNode: ChatbotNode = {
        id: crypto.randomUUID(),
        type: 'welcome',
        label: 'Boas-vindas',
        config: defaultNodeConfig('welcome'),
        connections: defaultConnections('welcome'),
      };
      const { data, error } = await supabase
        .from('chatbots')
        .insert({
          organization_id: orgId,
          name: input.name,
          description: input.description,
          channel: input.channel,
          nodes: [initialNode] as any,
          rules: [] as any,
          is_active: false,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (row: any) => {
      queryClient.invalidateQueries({ queryKey: ['chatbots', orgId] });
      setNewBot({ name: '', channel: 'whatsapp', description: '' });
      setShowCreate(false);
      setEditingChatbot({
        id: row.id,
        name: row.name,
        description: row.description || '',
        channel: row.channel,
        nodes: (row.nodes as ChatbotNode[]) || [],
        rules: (row.rules as ChatbotRule[]) || [],
        isActive: row.is_active,
      });
      toast.success('Chatbot criado!');
    },
    onError: (e: any) => toast.error(`Erro ao criar: ${e.message}`),
  });

  const saveMutation = useMutation({
    mutationFn: async (updated: Chatbot) => {
      const { error } = await supabase
        .from('chatbots')
        .update({
          name: updated.name,
          description: updated.description,
          channel: updated.channel,
          nodes: updated.nodes as any,
          rules: updated.rules as any,
          is_active: updated.isActive,
        })
        .eq('id', updated.id);
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots', orgId] });
      toast.success('Chatbot salvo!');
    },
    onError: (e: any) => toast.error(`Erro ao salvar: ${e.message}`),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from('chatbots').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chatbots', orgId] }),
    onError: (e: any) => toast.error(`Erro: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('chatbots').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots', orgId] });
      toast.success('Chatbot excluído');
    },
    onError: (e: any) => toast.error(`Erro: ${e.message}`),
  });

  const handleCreate = () => {
    if (!newBot.name) return toast.error('Nome é obrigatório');
    createMutation.mutate(newBot);
  };

  if (editingChatbot) {
    return (
      <ChatbotVisualBuilder
        chatbot={editingChatbot}
        onSave={(c) => saveMutation.mutate(c)}
        onClose={() => setEditingChatbot(null)}
        isSaving={saveMutation.isPending}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chatbot Builder</h1>
          <p className="text-muted-foreground">Construa árvores de decisão visuais para atendimento automatizado</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Chatbot</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Chatbot</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={newBot.name} onChange={e => setNewBot(p => ({ ...p, name: e.target.value }))} placeholder="Atendimento WhatsApp" /></div>
              <div>
                <Label>Canal</Label>
                <Select value={newBot.channel} onValueChange={v => setNewBot(p => ({ ...p, channel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="telegram">Telegram</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Descrição</Label><Textarea value={newBot.description} onChange={e => setNewBot(p => ({ ...p, description: e.target.value }))} /></div>
              <Button onClick={handleCreate} className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Chatbot
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : chatbots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Bot className="h-16 w-16 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold text-foreground">Nenhum chatbot criado</h3>
            <p className="text-muted-foreground text-center max-w-md">Crie chatbots com árvore de decisão visual, menus interativos e regras de atendimento por departamento e horário.</p>
            <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />Criar Primeiro Chatbot</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chatbots.map(bot => (
            <Card key={bot.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setEditingChatbot(bot)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{bot.name}</CardTitle>
                      <CardDescription className="text-xs">{bot.channel}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <Switch
                      checked={bot.isActive}
                      onCheckedChange={v => toggleActiveMutation.mutate({ id: bot.id, isActive: v })}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => { if (confirm(`Excluir "${bot.name}"?`)) deleteMutation.mutate(bot.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{bot.nodes.length} blocos</Badge>
                  <Badge variant="secondary">{bot.rules.length} regras</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
