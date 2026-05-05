import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Mail, MailOpen, Search, RefreshCw, Star, Archive,
  Clock, User, Send, ChevronLeft, AlertCircle, Inbox,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type EmailConversation = {
  id: string;
  status: string | null;
  last_message_at: string | null;
  created_at: string;
  metadata: Record<string, any> | null;
  contact_id: string | null;
  contacts: {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
  } | null;
  messages: {
    id: string;
    content: string;
    sender_type: string;
    is_read: boolean;
    created_at: string;
  }[];
};

export default function EmailInbox() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');
  const [replyText, setReplyText] = useState('');

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['email-inbox', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id, status, last_message_at, created_at, metadata, contact_id,
          contacts (id, first_name, last_name, email),
          messages (id, content, sender_type, is_read, created_at)
        `)
        .eq('channel', 'email')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false })
        .order('created_at', { referencedTable: 'messages', ascending: true });
      if (error) throw error;
      return (data ?? []) as EmailConversation[];
    },
    enabled: !!user?.id,
  });

  // Realtime
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('email-inbox-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' },
        () => queryClient.invalidateQueries({ queryKey: ['email-inbox'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' },
        () => queryClient.invalidateQueries({ queryKey: ['email-inbox'] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const markRead = useMutation({
    mutationFn: async (convId: string) => {
      await supabase.from('messages').update({ is_read: true })
        .eq('conversation_id', convId).eq('is_read', false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['email-inbox'] }),
  });

  const sendReply = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        content,
        sender_type: 'user',
        is_read: true,
      });
      if (error) throw error;
      await supabase.from('conversations').update({
        last_message_at: new Date().toISOString(),
      }).eq('id', conversationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-inbox'] });
      setReplyText('');
      toast.success('Resposta enviada!');
    },
    onError: (e) => toast.error('Erro ao responder: ' + e.message),
  });

  const archiveConversation = useMutation({
    mutationFn: async (convId: string) => {
      const { error } = await supabase.from('conversations')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', convId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-inbox'] });
      setSelected(null);
      toast.success('E-mail arquivado!');
    },
  });

  const filtered = useMemo(() => {
    let list = conversations;
    if (filter === 'unread') {
      list = list.filter(c => c.messages.some(m => !m.is_read && m.sender_type === 'contact'));
    } else if (filter === 'archived') {
      list = list.filter(c => c.status === 'resolved');
    } else {
      list = list.filter(c => c.status !== 'resolved');
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => {
        const subject = (c.metadata as any)?.email_subject || '';
        const sender = (c.metadata as any)?.email_sender || '';
        const name = `${c.contacts?.first_name || ''} ${c.contacts?.last_name || ''}`;
        return subject.toLowerCase().includes(q) || sender.toLowerCase().includes(q) || name.toLowerCase().includes(q);
      });
    }
    return list;
  }, [conversations, filter, search]);

  const selectedConv = conversations.find(c => c.id === selected);
  const unreadCount = conversations.filter(c =>
    c.status !== 'resolved' && c.messages.some(m => !m.is_read && m.sender_type === 'contact')
  ).length;

  const handleSelect = (convId: string) => {
    setSelected(convId);
    const conv = conversations.find(c => c.id === convId);
    if (conv?.messages.some(m => !m.is_read && m.sender_type === 'contact')) {
      markRead.mutate(convId);
    }
  };

  if (!currentOrganization) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Nenhuma organização selecionada</h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Caixa de Entrada
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1">{unreadCount}</Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">E-mails recebidos no seu domínio</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['email-inbox'] })}>
          <RefreshCw className="h-4 w-4 mr-2" />Atualizar
        </Button>
      </div>

      <div className="flex flex-1 border rounded-lg overflow-hidden bg-card">
        {/* Sidebar - Email list */}
        <div className={cn(
          "w-full md:w-96 border-r flex flex-col",
          selected ? "hidden md:flex" : "flex"
        )}>
          {/* Search + filters */}
          <div className="p-3 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar e-mails..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'unread', 'archived'] as const).map(f => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'Todos' : f === 'unread' ? 'Não lidos' : 'Arquivados'}
                </Button>
              ))}
            </div>
          </div>

          {/* Email list */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-3 space-y-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  {filter === 'unread' ? 'Nenhum e-mail não lido' : filter === 'archived' ? 'Nenhum e-mail arquivado' : 'Nenhum e-mail recebido'}
                </p>
              </div>
            ) : (
              filtered.map(conv => {
                const meta = conv.metadata as any;
                const subject = meta?.email_subject || '(sem assunto)';
                const sender = meta?.email_sender || conv.contacts?.email || 'Desconhecido';
                const contactName = conv.contacts ? `${conv.contacts.first_name} ${conv.contacts.last_name || ''}`.trim() : sender.split('@')[0];
                const hasUnread = conv.messages.some(m => !m.is_read && m.sender_type === 'contact');
                const lastMsg = conv.messages[conv.messages.length - 1];
                const preview = lastMsg?.content?.replace(/\*\*/g, '').slice(0, 100) || '';

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelect(conv.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 border-b hover:bg-accent/50 transition-colors",
                      selected === conv.id && "bg-accent",
                      hasUnread && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {hasUnread ? (
                          <Mail className="h-4 w-4 text-primary" />
                        ) : (
                          <MailOpen className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={cn("text-sm truncate", hasUnread && "font-semibold")}>
                            {contactName}
                          </span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                            {conv.last_message_at
                              ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true, locale: ptBR })
                              : ''}
                          </span>
                        </div>
                        <p className={cn("text-xs truncate mt-0.5", hasUnread ? "font-medium text-foreground" : "text-muted-foreground")}>
                          {subject}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{preview}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </ScrollArea>
        </div>

        {/* Detail panel */}
        <div className={cn(
          "flex-1 flex flex-col",
          !selected ? "hidden md:flex" : "flex"
        )}>
          {!selectedConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Mail className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Selecione um e-mail para visualizar</p>
            </div>
          ) : (
            <>
              {/* Email header */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-2 mb-2">
                  <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSelected(null)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg font-semibold flex-1 truncate">
                    {(selectedConv.metadata as any)?.email_subject || '(sem assunto)'}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => archiveConversation.mutate(selectedConv.id)}
                    disabled={selectedConv.status === 'resolved'}
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    {selectedConv.status === 'resolved' ? 'Arquivado' : 'Arquivar'}
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>
                    {selectedConv.contacts
                      ? `${selectedConv.contacts.first_name} ${selectedConv.contacts.last_name || ''}`
                      : (selectedConv.metadata as any)?.email_sender || 'Desconhecido'}
                  </span>
                  <span className="text-xs">
                    &lt;{(selectedConv.metadata as any)?.email_sender || selectedConv.contacts?.email}&gt;
                  </span>
                  <span className="ml-auto text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(selectedConv.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 max-w-3xl">
                  {selectedConv.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={cn(
                        "rounded-lg p-4",
                        msg.sender_type === 'contact'
                          ? "bg-muted"
                          : "bg-primary/10 ml-8"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={msg.sender_type === 'contact' ? 'secondary' : 'default'} className="text-[10px]">
                          {msg.sender_type === 'contact' ? 'Recebido' : 'Enviado'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Reply area */}
              {selectedConv.status !== 'resolved' && (
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Escreva sua resposta..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      disabled={!replyText.trim() || sendReply.isPending}
                      onClick={() => sendReply.mutate({ conversationId: selectedConv.id, content: replyText })}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Responder
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
