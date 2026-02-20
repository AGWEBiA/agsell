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
import { Bot, Plus, Trash2, Edit, Brain, MessageSquare, Zap, BookOpen, Loader2 } from 'lucide-react';
import { useAIAgents, useCreateAIAgent, useUpdateAIAgent, useDeleteAIAgent, useAIAgentKnowledge, useAddKnowledge, useDeleteKnowledge } from '@/hooks/useAIAgents';
import type { AIAgent } from '@/hooks/useAIAgents';

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

function AgentFormDialog({ agent, onClose }: { agent?: AIAgent; onClose: () => void }) {
  const createAgent = useCreateAIAgent();
  const updateAgent = useUpdateAIAgent();
  const [form, setForm] = useState({
    name: agent?.name || '',
    description: agent?.description || '',
    system_prompt: agent?.system_prompt || 'Você é um assistente útil e profissional. Responda de forma clara e objetiva.',
    model: agent?.model || 'google/gemini-3-flash-preview',
    temperature: agent?.temperature || 0.7,
    channels: agent?.channels || [],
    welcome_message: agent?.welcome_message || '',
    fallback_message: agent?.fallback_message || 'Desculpe, não consegui entender. Posso te transferir para um atendente humano?',
    max_tokens: agent?.max_tokens || 2048,
  });

  const toggleChannel = (ch: string) => {
    setForm(prev => ({
      ...prev,
      channels: prev.channels.includes(ch) ? prev.channels.filter(c => c !== ch) : [...prev.channels, ch]
    }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (agent) {
      updateAgent.mutate({ id: agent.id, ...form }, { onSuccess: onClose });
    } else {
      createAgent.mutate(form, { onSuccess: onClose });
    }
  };

  const isPending = createAgent.isPending || updateAgent.isPending;

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div>
          <Label>Nome do Agente *</Label>
          <Input placeholder="Ex: Vendas, Suporte Técnico, SAC" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div>
          <Label>Descrição</Label>
          <Input placeholder="Breve descrição do agente" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>
        <div>
          <Label>Prompt do Sistema (Personalidade) *</Label>
          <Textarea rows={5} placeholder="Defina a personalidade, tom de voz e regras do agente..." value={form.system_prompt} onChange={(e) => setForm(p => ({ ...p, system_prompt: e.target.value }))} />
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
            <p className="text-xs text-muted-foreground mt-1">Menor = mais preciso, Maior = mais criativo</p>
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
      <div className="flex justify-end gap-2">
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
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Agente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Criar Novo Agente de IA</DialogTitle></DialogHeader>
            <AgentFormDialog onClose={() => setShowCreate(false)} />
          </DialogContent>
        </Dialog>
      </div>

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
