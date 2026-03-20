import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, User, Loader2, Sparkles, MessageSquare, TrendingUp, Users, CheckSquare, X, Cpu, Zap, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useContacts } from '@/hooks/useContacts';
import { useDeals } from '@/hooks/usePipeline';
import { useTasks } from '@/hooks/useTasks';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const MODEL_CATEGORIES = [
  {
    id: 'high_performance',
    label: 'Alta Performance',
    description: 'Modelos premium para máxima qualidade',
    icon: Sparkles,
    models: [
      { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { id: 'openai/gpt-5', label: 'GPT-5' },
      { id: 'openai/gpt-5.2', label: 'GPT-5.2' },
      { id: 'google/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro' },
    ],
  },
  {
    id: 'balanced',
    label: 'Equilibrado',
    description: 'Melhor custo-benefício para uso diário',
    icon: Zap,
    models: [
      { id: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash' },
      { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
      { id: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
      { id: 'openai/gpt-5-nano', label: 'GPT-5 Nano' },
    ],
  },
];

const suggestions = [
  { icon: TrendingUp, text: 'Crie uma sequência de emails para lançamento de infoproduto' },
  { icon: Users, text: 'Me ajude a criar uma big idea para um novo curso' },
  { icon: CheckSquare, text: 'Analise essa copy e me dê sugestões de melhoria' },
  { icon: MessageSquare, text: 'Escreva um roteiro de VSL para um produto digital' },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>([
    'google/gemini-2.5-flash',
    'google/gemini-2.5-flash-lite',
    'openai/gpt-5-nano',
  ]);
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: contacts = [] } = useContacts();
  const { data: deals = [] } = useDeals();
  const { data: tasks = [] } = useTasks();

  const pendingTasks = tasks.filter(t => t.status === 'pending');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId) ? prev.filter(m => m !== modelId) : [...prev, modelId]
    );
  };

  const getModelLabel = (id: string) => {
    for (const cat of MODEL_CATEGORIES) {
      const m = cat.models.find(m => m.id === id);
      if (m) return m.label;
    }
    return id;
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Try each model in order (fallback)
    const modelsToTry = selectedModels.length > 0 ? selectedModels : ['google/gemini-3-flash-preview'];
    let success = false;

    for (const model of modelsToTry) {
      try {
        const { data, error } = await supabase.functions.invoke('ai-chat', {
          body: {
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content,
            })),
            context: {
              contactsCount: contacts.length,
              dealsCount: deals.filter(d => d.status === 'open').length,
              tasksCount: pendingTasks.length,
            },
            model,
          },
        });

        if (error) throw error;

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        success = true;
        break;
      } catch (error) {
        console.error(`Model ${model} failed:`, error);
        continue;
      }
    }

    if (!success) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Desculpe, todos os modelos falharam. Tente novamente em alguns instantes.',
        timestamp: new Date(),
      }]);
    }

    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-8rem)]">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Chat Livre</h1>
            <p className="text-sm text-muted-foreground">Converse livremente com a IA sobre qualquer assunto</p>
          </div>
        </div>

        {/* Model Selector */}
        <Popover open={modelPopoverOpen} onOpenChange={setModelPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 h-auto py-2">
              <Cpu className="h-4 w-4" />
              <span className="hidden sm:inline">Modelos de IA</span>
              <Badge variant="secondary" className="text-xs">{selectedModels.length} selecionados</Badge>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-3 space-y-3">
              {MODEL_CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <div key={cat.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{cat.label}</p>
                        <p className="text-[10px] text-muted-foreground">{cat.description}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{cat.models.length} modelos</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-6">
                      {cat.models.map(model => {
                        const isSelected = selectedModels.includes(model.id);
                        return (
                          <Badge
                            key={model.id}
                            variant={isSelected ? 'default' : 'outline'}
                            className="cursor-pointer text-xs gap-1 transition-colors"
                            onClick={() => toggleModel(model.id)}
                          >
                            {model.label}
                            {isSelected && <X className="h-3 w-3" />}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedModels.length > 0 && (
              <div className="border-t p-3">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedModels.map(id => (
                    <Badge key={id} variant="default" className="text-xs gap-1">
                      {getModelLabel(id)} <X className="h-3 w-3 cursor-pointer" onClick={() => toggleModel(id)} />
                    </Badge>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">O sistema tentará cada modelo na ordem selecionada. Se um falhar, usa o próximo automaticamente.</p>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Chat Container */}
      <Card className="flex flex-col h-[calc(100%-5rem)]">
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Como posso ajudar?</h3>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Pergunte qualquer coisa sobre copywriting, estratégia, lançamentos, conteúdo ou marketing digital.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                  {suggestions.map((suggestion, index) => {
                    const Icon = suggestion.icon;
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto py-3 px-4 text-left justify-start gap-2"
                        onClick={() => sendMessage(suggestion.text)}
                      >
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">{suggestion.text}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.role === 'assistant' && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-primary/10"><Bot className="h-4 w-4 text-primary" /></AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-secondary"><User className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/10"><Bot className="h-4 w-4 text-primary" /></AvatarFallback></Avatar>
                    <div className="bg-muted rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Pensando...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={!input.trim() || isLoading} size="icon">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
