import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2, RotateCcw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePlans } from '@/hooks/usePlans';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { helpArticles } from '@/data/helpCenterData';
import { useNavigate } from 'react-router-dom';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Build a condensed knowledge base from help center articles
function buildKnowledgeBase(): string {
  return helpArticles
    .map((a) => `### ${a.title}\n${a.content.substring(0, 600)}`)
    .join('\n\n');
}

export function SupportAgentChat() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { currentPlan } = usePlans();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Create session on first open
  const ensureSession = useCallback(async () => {
    if (sessionId || !user?.id) return sessionId;
    const { data, error } = await supabase
      .from('support_chat_sessions' as any)
      .insert({
        user_id: user.id,
        organization_id: currentOrganization?.id || null,
      })
      .select('id')
      .single();
    if (error) {
      console.warn('Session creation failed:', error);
      return null;
    }
    const id = (data as any).id;
    setSessionId(id);
    return id;
  }, [sessionId, user?.id, currentOrganization?.id]);

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content:
            'Olá! 👋 Sou o **Agente de Suporte AG Sell**. Estou aqui para ajudar com qualquer dúvida sobre a plataforma, resolver problemas ou guiar você em configurações.\n\nComo posso ajudar?',
        },
      ]);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const sid = await ensureSession();

    let assistantSoFar = '';
    const knowledgeBase = buildKnowledgeBase();

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-agent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            session_id: sid,
            knowledge_base: knowledgeBase,
            user_context: {
              plan_name: currentPlan?.name,
              org_name: currentOrganization?.name,
              user_name: user?.user_metadata?.full_name,
            },
          }),
        }
      );

      if (!resp.ok) {
        if (resp.status === 429) {
          toast.error('Limite de requisições excedido. Tente novamente em instantes.');
        } else if (resp.status === 402) {
          toast.error('Créditos de IA insuficientes.');
        } else {
          toast.error('Erro ao conectar com o agente de suporte.');
        }
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error('No stream body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant' && prev.length > newMessages.length) {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: 'assistant', content: assistantSoFar }];
        });
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsert(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Save assistant message
      if (sid && assistantSoFar) {
        await supabase.from('support_chat_messages' as any).insert({
          session_id: sid,
          role: 'assistant',
          content: assistantSoFar,
        });
      }
    } catch (e) {
      console.error('Support agent error:', e);
      toast.error('Erro ao processar mensagem do agente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleReset = async () => {
    setMessages([]);
    setSessionId(null);
    handleOpen();
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  // Render markdown-like bold and links
  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\(\/[a-z-]+\))/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      const pathMatch = part.match(/^\((\/[a-z-]+)\)$/);
      if (pathMatch) {
        return (
          <button
            key={i}
            onClick={() => handleNavigate(pathMatch[1])}
            className="text-primary hover:underline inline-flex items-center gap-0.5 font-medium"
          >
            {pathMatch[1]} <ExternalLink className="h-3 w-3" />
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (!user) return null;

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-40 flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform md:h-14 md:w-14"
          aria-label="Abrir suporte AG Sell"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className={cn(
            'fixed z-50 bg-background border border-border rounded-xl shadow-2xl flex flex-col transition-all duration-200',
            isExpanded
              ? 'bottom-4 right-4 w-[520px] h-[680px]'
              : 'bottom-20 right-4 w-[380px] h-[520px]',
            'max-h-[90vh] max-w-[95vw]'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5 rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Suporte AG Sell</p>
                <p className="text-xs text-muted-foreground">Agente IA • Online</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReset} title="Nova conversa">
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? 'Minimizar' : 'Expandir'}>
                {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)} title="Fechar">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  )}
                >
                  {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl px-3.5 py-2.5 rounded-bl-sm">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {[
                'Como conectar o WhatsApp?',
                'Como criar uma automação?',
                'Tenho um bug para reportar',
                'Como configurar meu plano?',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-2.5 py-1.5 rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-1 border-t border-border">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua dúvida..."
                className="min-h-[40px] max-h-[100px] resize-none text-sm"
                rows={1}
              />
              <Button
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
              Agente IA de suporte • Para problemas complexos,{' '}
              <button onClick={() => handleNavigate('/support-center')} className="text-primary hover:underline">
                abra um ticket
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
