import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Plus, Trash2, Edit, Brain, MessageSquare, Zap, BookOpen, Loader2, BarChart3, LayoutTemplate } from 'lucide-react';
import { useAIAgents, useCreateAIAgent, useUpdateAIAgent, useDeleteAIAgent, useAIAgentKnowledge, useAddKnowledge, useDeleteKnowledge, type AIAgent } from '@/hooks/useAIAgents';
import { AgentTemplates, type AgentTemplate } from '@/components/ai-agents/AgentTemplates';
import { AgentPerformanceDashboard } from '@/components/ai-agents/AgentPerformanceDashboard';

const AVAILABLE_MODELS = [
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash (Rápido)' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (Equilibrado)' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro (Avançado)' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini (Rápido)' },
  { value: 'openai/gpt-5', label: 'GPT-5 (Avançado)' },
];

const CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'inbox', label: 'Inbox (Chat)' },
  { value: 'email', label: 'E-mail' },
];

function AgentKnowledgePanel({ agent }: { agent: AIAgent }) {
  const { data: knowledge = [], isLoading } = useAIAgentKnowledge(agent.id);
  const addKnowledge = useAddKnowledge();
  const deleteKnowledge = useDeleteKnowledge();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleAdd = () => {
    if (!title.trim() || !content.trim()) return;
    addKnowledge.mutate({ agent_id: agent.id, title, content }, {
      onSuccess: () => { setTitle(''); setContent(''); }
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Input placeholder="Título do documento" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea placeholder="Cole aqui o conteúdo que o agente deve usar como referência (FAQs, scripts, informações de produtos, políticas...)" value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
        <Button onClick={handleAdd} disabled={addKnowledge.isPending || !title.trim() || !content.trim()} size="sm">
          {addKnowledge.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          Adicionar Conhecimento
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : knowledge.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum documento adicionado ainda.</p>
      ) : (
        <ScrollArea className="max-h-64">
          <div className="space-y-2">
            {knowledge.map((k) => (
              <div key={k.id} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{k.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{k.content}</p>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 ml-2" onClick={() => deleteKnowledge.mutate({ id: k.id, agentId: agent.id })}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function AgentFormDialog({ agent, onClose, initialTemplate }: { agent?: AIAgent; onClose: () => void; initialTemplate?: AgentTemplate }) {
  const createAgent = useCreateAIAgent();
  const updateAgent = useUpdateAIAgent();
  const addKnowledge = useAddKnowledge();
  const [activeSection, setActiveSection] = useState<'basic' | 'context' | 'rules' | 'advanced'>('basic');
  const [form, setForm] = useState({
    name: agent?.name || initialTemplate?.name || '',
    description: agent?.description || initialTemplate?.description || '',
    system_prompt: agent?.system_prompt || initialTemplate?.system_prompt || 'Você é um assistente útil e profissional. Responda de forma clara e objetiva.',
    model: agent?.model || 'google/gemini-3-flash-preview',
    temperature: agent?.temperature || 0.7,
    channels: agent?.channels || initialTemplate?.channels || [],
    welcome_message: agent?.welcome_message || initialTemplate?.welcome_message || '',
    fallback_message: agent?.fallback_message || initialTemplate?.fallback_message || 'Desculpe, não consegui entender. Posso te transferir para um atendente humano?',
    max_tokens: agent?.max_tokens || 2048,
  });

  // Extended SellFlux-style config (stored in description as JSON suffix)
  const [extConfig, setExtConfig] = useState(() => {
    try {
      const parsed = agent?.knowledge_base ? JSON.parse(agent.knowledge_base) : {};
      return {
        assistant_name: parsed.assistant_name || '',
        company_name: parsed.company_name || '',
        company_website: parsed.company_website || '',
        company_email: parsed.company_email || '',
        company_phone: parsed.company_phone || '',
        company_context: parsed.company_context || '',
        departments: parsed.departments || [] as string[],
        working_hours_mode: parsed.working_hours_mode || '24h', // '24h' | 'business_only' | 'off_hours_only'
        business_start: parsed.business_start || '08:00',
        business_end: parsed.business_end || '18:00',
        business_days: parsed.business_days || [1, 2, 3, 4, 5],
        activation_keywords: parsed.activation_keywords || '',
        allow_tags: parsed.allow_tags || '',
        block_tags: parsed.block_tags || '',
        user_commands_enabled: parsed.user_commands_enabled ?? true,
        voice_response_enabled: parsed.voice_response_enabled ?? false,
        voice_name: parsed.voice_name || 'alloy',
        max_products_per_search: parsed.max_products_per_search || 3,
        max_texts_per_search: parsed.max_texts_per_search || 3,
      };
    } catch { return {
      assistant_name: '', company_name: '', company_website: '', company_email: '', company_phone: '',
      company_context: '', departments: [] as string[], working_hours_mode: '24h',
      business_start: '08:00', business_end: '18:00', business_days: [1, 2, 3, 4, 5],
      activation_keywords: '', allow_tags: '', block_tags: '',
      user_commands_enabled: true, voice_response_enabled: false, voice_name: 'alloy',
      max_products_per_search: 3, max_texts_per_search: 3,
    }; }
  });

  const toggleChannel = (ch: string) => {
    setForm(prev => ({
      ...prev,
      channels: prev.channels.includes(ch) ? prev.channels.filter(c => c !== ch) : [...prev.channels, ch]
    }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    const knowledge_base = JSON.stringify(extConfig);
    if (agent) {
      updateAgent.mutate({ id: agent.id, ...form, knowledge_base }, { onSuccess: onClose });
    } else {
      createAgent.mutate({ ...form, knowledge_base }, {
        onSuccess: (newAgent) => {
          if (initialTemplate?.knowledge_snippets?.length) {
            initialTemplate.knowledge_snippets.forEach(snippet => {
              addKnowledge.mutate({ agent_id: newAgent.id, title: snippet.title, content: snippet.content });
            });
          }
          onClose();
        }
      });
    }
  };

  const isPending = createAgent.isPending || updateAgent.isPending;
  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-4">
      {initialTemplate && (
        <Badge variant="secondary" className="mb-2">
          <LayoutTemplate className="h-3 w-3 mr-1" />
          Template: {initialTemplate.sector}
        </Badge>
      )}

      {/* Section Tabs */}
      <div className="flex gap-1 border-b pb-2">
        {[
          { id: 'basic' as const, label: 'Básico' },
          { id: 'context' as const, label: 'Empresa' },
          { id: 'rules' as const, label: 'Regras' },
          { id: 'advanced' as const, label: 'Avançado' },
        ].map(s => (
          <Button key={s.id} variant={activeSection === s.id ? 'default' : 'ghost'} size="sm" onClick={() => setActiveSection(s.id)}>{s.label}</Button>
        ))}
      </div>

      {activeSection === 'basic' && (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome da Estratégia *</Label>
              <Input placeholder="Ex: Vendas, Suporte Técnico" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>Nome do Assistente</Label>
              <Input placeholder="Nome que o bot usará ao se apresentar" value={extConfig.assistant_name} onChange={(e) => setExtConfig(p => ({ ...p, assistant_name: e.target.value }))} />
              <p className="text-xs text-muted-foreground mt-1">Nome que o assistente usará nas conversas</p>
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Input placeholder="Breve descrição do agente" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div>
            <Label>Contexto do Assistente (Personalidade) *</Label>
            <Textarea rows={5} placeholder="Defina como o assistente deve se comportar, tom de voz, linguagem e regras de interação..." value={form.system_prompt} onChange={(e) => setForm(p => ({ ...p, system_prompt: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Modelo de IA</Label>
              <Select value={form.model} onValueChange={(v) => setForm(p => ({ ...p, model: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Temperatura: {form.temperature}</Label>
              <Slider value={[form.temperature]} onValueChange={([v]) => setForm(p => ({ ...p, temperature: v }))} min={0} max={1} step={0.1} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">Menor = preciso, Maior = criativo</p>
            </div>
          </div>
          <div>
            <Label>Canais</Label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {CHANNELS.map(ch => (
                <Badge key={ch.value} variant={form.channels.includes(ch.value) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => toggleChannel(ch.value)}>
                  {ch.label}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <Label>Mensagem de Boas-vindas</Label>
            <Input placeholder="Olá! Como posso ajudar?" value={form.welcome_message} onChange={(e) => setForm(p => ({ ...p, welcome_message: e.target.value }))} />
          </div>
          <div>
            <Label>Mensagem de Fallback</Label>
            <Input placeholder="Quando o agente não conseguir responder..." value={form.fallback_message} onChange={(e) => setForm(p => ({ ...p, fallback_message: e.target.value }))} />
          </div>
        </div>
      )}

      {activeSection === 'context' && (
        <div className="grid gap-4">
          <p className="text-sm text-muted-foreground">Informações da empresa que o assistente pode usar durante os atendimentos.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome da Empresa</Label>
              <Input placeholder="AGSell" value={extConfig.company_name} onChange={(e) => setExtConfig(p => ({ ...p, company_name: e.target.value }))} />
            </div>
            <div>
              <Label>Site</Label>
              <Input placeholder="https://agsell.com" value={extConfig.company_website} onChange={(e) => setExtConfig(p => ({ ...p, company_website: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>E-mail da Empresa</Label>
              <Input placeholder="contato@empresa.com" value={extConfig.company_email} onChange={(e) => setExtConfig(p => ({ ...p, company_email: e.target.value }))} />
            </div>
            <div>
              <Label>Telefone da Empresa</Label>
              <Input placeholder="+55 11 99999-9999" value={extConfig.company_phone} onChange={(e) => setExtConfig(p => ({ ...p, company_phone: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Contexto da Empresa</Label>
            <Textarea rows={4} placeholder="História, missão, visão, valores, produtos/serviços oferecidos..." value={extConfig.company_context} onChange={(e) => setExtConfig(p => ({ ...p, company_context: e.target.value }))} />
            <p className="text-xs text-muted-foreground mt-1">Informações que o assistente usará para se comunicar de forma alinhada com a marca</p>
          </div>
          <div>
            <Label>Departamentos (separar por vírgula)</Label>
            <Input placeholder="Vendas, Suporte, Financeiro" value={extConfig.departments.join(', ')} onChange={(e) => setExtConfig(p => ({ ...p, departments: e.target.value.split(',').map(d => d.trim()).filter(Boolean) }))} />
            <p className="text-xs text-muted-foreground mt-1">Departamentos que o assistente pode atuar</p>
          </div>
        </div>
      )}

      {activeSection === 'rules' && (
        <div className="grid gap-4">
          <div>
            <Label>Horário de Funcionamento</Label>
            <Select value={extConfig.working_hours_mode} onValueChange={(v) => setExtConfig(p => ({ ...p, working_hours_mode: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 horas por dia</SelectItem>
                <SelectItem value="business_only">Apenas horário comercial</SelectItem>
                <SelectItem value="off_hours_only">Apenas fora do expediente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {extConfig.working_hours_mode !== '24h' && (
            <div className="space-y-2 p-3 border rounded-lg">
              <div className="flex gap-4">
                <div>
                  <Label className="text-xs">Início</Label>
                  <Input type="time" value={extConfig.business_start} onChange={(e) => setExtConfig(p => ({ ...p, business_start: e.target.value }))} className="h-8" />
                </div>
                <div>
                  <Label className="text-xs">Fim</Label>
                  <Input type="time" value={extConfig.business_end} onChange={(e) => setExtConfig(p => ({ ...p, business_end: e.target.value }))} className="h-8" />
                </div>
              </div>
              <div className="flex gap-1">
                {dayLabels.map((d, i) => (
                  <Badge key={i} variant={extConfig.business_days.includes(i) ? 'default' : 'outline'} className="text-xs cursor-pointer" onClick={() => {
                    setExtConfig(p => ({ ...p, business_days: p.business_days.includes(i) ? p.business_days.filter((day: number) => day !== i) : [...p.business_days, i] }));
                  }}>{d}</Badge>
                ))}
              </div>
            </div>
          )}
          <div>
            <Label>Palavras/Frases-chave de Ativação</Label>
            <Textarea rows={2} placeholder="Ex: quero comprar, orçamento, preço (uma por linha)" value={extConfig.activation_keywords} onChange={(e) => setExtConfig(p => ({ ...p, activation_keywords: e.target.value }))} />
            <p className="text-xs text-muted-foreground mt-1">O assistente será ativado quando o lead enviar uma dessas palavras</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-green-600">Tags que Permitem Atendimento</Label>
              <Input placeholder="cliente, vip" value={extConfig.allow_tags} onChange={(e) => setExtConfig(p => ({ ...p, allow_tags: e.target.value }))} />
            </div>
            <div>
              <Label className="text-red-600">Tags que Impedem Atendimento</Label>
              <Input placeholder="spam, bloqueado" value={extConfig.block_tags} onChange={(e) => setExtConfig(p => ({ ...p, block_tags: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label>Comandos do Usuário</Label>
              <p className="text-xs text-muted-foreground">Permite que leads usem comandos: "sair", "#fim", "humano"</p>
            </div>
            <Switch checked={extConfig.user_commands_enabled} onCheckedChange={(v) => setExtConfig(p => ({ ...p, user_commands_enabled: v }))} />
          </div>
        </div>
      )}

      {activeSection === 'advanced' && (
        <div className="grid gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label>Resposta por Áudio</Label>
              <p className="text-xs text-muted-foreground">Envia respostas em formato de áudio</p>
            </div>
            <Switch checked={extConfig.voice_response_enabled} onCheckedChange={(v) => setExtConfig(p => ({ ...p, voice_response_enabled: v }))} />
          </div>
          {extConfig.voice_response_enabled && (
            <div>
              <Label>Voz</Label>
              <Select value={extConfig.voice_name} onValueChange={(v) => setExtConfig(p => ({ ...p, voice_name: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alloy">Alloy (Neutra)</SelectItem>
                  <SelectItem value="echo">Echo (Masculina)</SelectItem>
                  <SelectItem value="fable">Fable (Britânica)</SelectItem>
                  <SelectItem value="onyx">Onyx (Grave)</SelectItem>
                  <SelectItem value="nova">Nova (Feminina)</SelectItem>
                  <SelectItem value="shimmer">Shimmer (Suave)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Limite de Produtos por Busca</Label>
              <Input type="number" min={1} max={10} value={extConfig.max_products_per_search} onChange={(e) => setExtConfig(p => ({ ...p, max_products_per_search: Number(e.target.value) }))} />
              <p className="text-xs text-muted-foreground mt-1">Quantos produtos da base de conhecimento usar por resposta</p>
            </div>
            <div>
              <Label>Limite de Textos por Busca</Label>
              <Input type="number" min={1} max={10} value={extConfig.max_texts_per_search} onChange={(e) => setExtConfig(p => ({ ...p, max_texts_per_search: Number(e.target.value) }))} />
              <p className="text-xs text-muted-foreground mt-1">Quantos textos da base usar por resposta</p>
            </div>
          </div>
          <div>
            <Label>Max Tokens</Label>
            <Input type="number" value={form.max_tokens} onChange={(e) => setForm(p => ({ ...p, max_tokens: Number(e.target.value) }))} />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={isPending || !form.name.trim()}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {agent ? 'Salvar' : 'Criar Agente'}
        </Button>
      </div>
    </div>
  );
}

export default function AIAgents() {
  const { data: agents = [], isLoading } = useAIAgents();
  const deleteAgent = useDeleteAIAgent();
  const updateAgent = useUpdateAIAgent();
  const [showCreate, setShowCreate] = useState(false);
  const [editAgent, setEditAgent] = useState<AIAgent | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | undefined>(undefined);

  const handleTemplateSelect = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setShowCreate(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Agentes de IA
          </h1>
          <p className="text-muted-foreground">Crie e treine agentes inteligentes para atender seus clientes 24h</p>
        </div>
        <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) setSelectedTemplate(undefined); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Agente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTemplate ? `Criar: ${selectedTemplate.name}` : 'Criar Novo Agente de IA'}</DialogTitle>
            </DialogHeader>
            <AgentFormDialog onClose={() => { setShowCreate(false); setSelectedTemplate(undefined); }} initialTemplate={selectedTemplate} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="agents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Bot className="h-4 w-4" /> Meus Agentes
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4" /> Templates
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : agents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bot className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum agente criado</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  Crie seu primeiro agente de IA para atender clientes automaticamente no WhatsApp, Instagram e outros canais.
                </p>
                <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> Criar Primeiro Agente</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <Card key={agent.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{agent.name}</CardTitle>
                          {agent.description && <CardDescription className="text-xs">{agent.description}</CardDescription>}
                        </div>
                      </div>
                      <Switch checked={agent.is_active} onCheckedChange={(checked) => updateAgent.mutate({ id: agent.id, is_active: checked })} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-1 flex-wrap">
                      {agent.channels.map(ch => (
                        <Badge key={ch} variant="secondary" className="text-xs">{ch}</Badge>
                      ))}
                      {agent.channels.length === 0 && <Badge variant="outline" className="text-xs">Sem canais</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{agent.system_prompt}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3" />
                      {AVAILABLE_MODELS.find(m => m.value === agent.model)?.label || agent.model}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedAgent(agent)}>
                        <BookOpen className="h-3 w-3 mr-1" /> Conhecimento
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setEditAgent(agent)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteAgent.mutate(agent.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates">
          <AgentTemplates onSelectTemplate={handleTemplateSelect} />
        </TabsContent>

        <TabsContent value="performance">
          <AgentPerformanceDashboard />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editAgent} onOpenChange={() => setEditAgent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Agente: {editAgent?.name}</DialogTitle></DialogHeader>
          {editAgent && <AgentFormDialog agent={editAgent} onClose={() => setEditAgent(null)} />}
        </DialogContent>
      </Dialog>

      {/* Knowledge Dialog */}
      <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Base de Conhecimento: {selectedAgent?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedAgent && <AgentKnowledgePanel agent={selectedAgent} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
