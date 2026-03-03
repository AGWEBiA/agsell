import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Search, Send, Paperclip, Smile, Phone, Video,
  MessageSquare, Mail, CheckCheck, Plus, Bot, Image as ImageIcon,
  FileAudio, File as FileIcon, X, Loader2, Filter,
  AlertTriangle, Clock, Hash, ChevronLeft, UserPlus, Inbox as InboxIcon, User,
} from 'lucide-react';
import { useInbox } from '@/hooks/useInbox';
import { useContacts } from '@/hooks/useContacts';
import { useAssignmentRules } from '@/hooks/useAssignmentRules';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { SendIAButton } from '@/components/inbox/SendIAButton';
import { AudioTranscription } from '@/components/inbox/AudioTranscription';
import { ContactInfoPanel } from '@/components/inbox/ContactInfoPanel';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PhoneInput } from '@/components/ui/phone-input';

const channelColors: Record<string, string> = {
  whatsapp: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  email: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  instagram: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  telegram: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300',
};

const channelIcons: Record<string, typeof MessageSquare> = {
  whatsapp: MessageSquare,
  email: Mail,
  instagram: MessageSquare,
  telegram: MessageSquare,
};

const priorityIndicator: Record<string, string> = {
  low: '',
  medium: 'border-l-2 border-l-yellow-400',
  high: 'border-l-2 border-l-orange-500',
  urgent: 'border-l-2 border-l-destructive',
};

type QueueTab = 'fila' | 'meus' | 'todos';

export default function Inbox() {
  const { conversations, isLoading, createConversation, sendMessage, markAsRead, updateConversation } = useInbox();
  const contactsQuery = useContacts();
  const contacts = contactsQuery.data ?? [];
  const { assignConversation } = useAssignmentRules();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewContactDialogOpen, setIsNewContactDialogOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ file: File; preview?: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [queueTab, setQueueTab] = useState<QueueTab>('todos');
  const [newConversation, setNewConversation] = useState({ contact_id: '', channel: 'whatsapp' });
  const [newContact, setNewContact] = useState({ first_name: '', email: '', phone: '', channel: 'whatsapp' });
  const [isCreatingContact, setIsCreatingContact] = useState(false);

  const selectedConversation = conversations.find(c => c.id === selectedId);

  useEffect(() => {
    if (conversations.length > 0 && !selectedId) setSelectedId(conversations[0].id);
  }, [conversations, selectedId]);

  useEffect(() => {
    if (selectedConversation) markAsRead.mutate(selectedConversation.id);
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  const handleEmojiSelect = (emoji: any) => {
    setMessageInput(prev => prev + emoji.native);
    setEmojiOpen(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Arquivo muito grande. Máximo: 10MB'); return; }
    let type = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('audio/')) type = 'audio';
    const preview = type === 'image' ? URL.createObjectURL(file) : undefined;
    setPendingFile({ file, preview, type });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('inbox-attachments').upload(path, file);
    if (error) { toast.error('Erro ao fazer upload: ' + error.message); return null; }
    const { data: urlData } = supabase.storage.from('inbox-attachments').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !pendingFile) || !selectedConversation) return;
    setIsUploading(!!pendingFile);

    let mediaUrl: string | null = null;
    let messageType = 'text';
    let mediaMimeType: string | null = null;
    let fileName: string | null = null;

    if (pendingFile) {
      mediaUrl = await uploadFile(pendingFile.file);
      if (!mediaUrl) { setIsUploading(false); return; }
      messageType = pendingFile.type;
      mediaMimeType = pendingFile.file.type;
      fileName = pendingFile.file.name;
    }

    sendMessage.mutate({
      conversation_id: selectedConversation.id,
      content: messageInput || (pendingFile ? `📎 ${pendingFile.file.name}` : ''),
      sender_type: 'user',
      message_type: messageType,
      media_url: mediaUrl,
      media_mime_type: mediaMimeType,
      file_name: fileName,
    } as any);
    setMessageInput('');
    setPendingFile(null);
    setIsUploading(false);
  };

  const handleCreateConversation = () => {
    if (!newConversation.contact_id) return;
    createConversation.mutate(newConversation);
    setNewConversation({ contact_id: '', channel: 'whatsapp' });
    setIsDialogOpen(false);
  };

  const handleCreateContactAndConversation = async () => {
    if (!newContact.first_name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!user?.id) return;
    setIsCreatingContact(true);
    try {
      const contactData: any = {
        first_name: newContact.first_name.trim(),
        user_id: user.id,
        organization_id: currentOrganization?.id || null,
        source: 'sac',
      };
      if (newContact.email.trim()) contactData.email = newContact.email.trim();
      if (newContact.phone.trim()) {
        contactData.phone = newContact.phone.trim();
        contactData.whatsapp = newContact.phone.trim();
      }

      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert(contactData)
        .select()
        .single();
      if (contactError) throw contactError;

      createConversation.mutate({ contact_id: contact.id, channel: newContact.channel });
      setNewContact({ first_name: '', email: '', phone: '', channel: 'whatsapp' });
      setIsNewContactDialogOpen(false);
      toast.success('Contato criado e atendimento iniciado!');
    } catch (e: any) {
      toast.error('Erro ao criar contato: ' + e.message);
    } finally {
      setIsCreatingContact(false);
    }
  };

  const handleAssumirAtendimento = () => {
    if (!selectedConversation || !user?.id) return;
    updateConversation.mutate({ id: selectedConversation.id, assigned_to: user.id });
  };

  const getInitials = (f?: string, l?: string | null) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase() || '??';

  const getUnreadCount = (c: any) => c.messages?.filter((m: any) => !m.is_read && m.sender_type === 'contact').length || 0;

  // Queue-based filtering
  const queueFiltered = conversations.filter(c => {
    if (queueTab === 'fila') return !c.assigned_to;
    if (queueTab === 'meus') return c.assigned_to === user?.id;
    return true;
  });

  const filteredConversations = queueFiltered.filter(c => {
    const name = `${c.contacts?.first_name || ''} ${c.contacts?.last_name || ''}`.toLowerCase();
    const protocol = (c as any).protocol_number?.toLowerCase() || '';
    const matchSearch = !searchQuery || name.includes(searchQuery.toLowerCase()) || protocol.includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchChannel = channelFilter === 'all' || c.channel === channelFilter;
    return matchSearch && matchStatus && matchChannel;
  });

  // Queue counts
  const queueCounts = {
    fila: conversations.filter(c => !c.assigned_to).length,
    meus: conversations.filter(c => c.assigned_to === user?.id).length,
    todos: conversations.length,
  };

  // Count by status (within queue)
  const statusCounts = {
    all: queueFiltered.length,
    open: queueFiltered.filter(c => c.status === 'open').length,
    pending: queueFiltered.filter(c => c.status === 'pending').length,
    resolved: queueFiltered.filter(c => c.status === 'resolved').length,
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-7rem)] animate-fade-in flex gap-4">
        <Card className="w-96 flex-shrink-0"><CardHeader className="pb-3"><Skeleton className="h-6 w-24" /><Skeleton className="h-10 w-full mt-3" /></CardHeader><CardContent className="p-0">{[1,2,3].map(i => <div key={i} className="p-4 border-b"><Skeleton className="h-14 w-full" /></div>)}</CardContent></Card>
        <Card className="flex-1"><Skeleton className="h-full" /></Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)] animate-fade-in">
      <div className="flex h-full gap-0 sm:gap-2">
        {/* Conversations List */}
        <Card className={`w-full sm:w-80 md:w-96 flex-shrink-0 flex flex-col ${selectedId && 'hidden sm:flex'}`}>
          <CardHeader className="pb-2 space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">SAC</CardTitle>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs">{conversations.length}</Badge>

                {/* New contact button */}
                <Dialog open={isNewContactDialogOpen} onOpenChange={setIsNewContactDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8" title="Novo contato">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Contato + Atendimento</DialogTitle>
                      <DialogDescription>Crie um contato e inicie um atendimento diretamente.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nome *</Label>
                        <Input
                          placeholder="Nome do contato"
                          value={newContact.first_name}
                          onChange={(e) => setNewContact(p => ({ ...p, first_name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          placeholder="email@exemplo.com"
                          value={newContact.email}
                          onChange={(e) => setNewContact(p => ({ ...p, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone com DDD</Label>
                        <Input
                          placeholder="11999999999"
                          value={newContact.phone}
                          onChange={(e) => setNewContact(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Canal</Label>
                        <Select value={newContact.channel} onValueChange={(v) => setNewContact(p => ({ ...p, channel: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="telegram">Telegram</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsNewContactDialogOpen(false)}>Voltar</Button>
                      <Button onClick={handleCreateContactAndConversation} disabled={isCreatingContact}>
                        {isCreatingContact ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Salvar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Existing contact ticket */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8" title="Novo ticket"><Plus className="h-4 w-4" /></Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Novo Ticket</DialogTitle><DialogDescription>Inicie um atendimento com um contato existente.</DialogDescription></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2"><Label>Contato</Label><Select value={newConversation.contact_id} onValueChange={(v) => setNewConversation(p => ({ ...p, contact_id: v }))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}</SelectContent></Select></div>
                      <div className="space-y-2"><Label>Canal</Label><Select value={newConversation.channel} onValueChange={(v) => setNewConversation(p => ({ ...p, channel: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="instagram">Instagram</SelectItem><SelectItem value="telegram">Telegram</SelectItem></SelectContent></Select></div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button><Button onClick={handleCreateConversation}>Criar Ticket</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Queue Tabs - Fila / Meus Atendimentos / Todos */}
            <Tabs value={queueTab} onValueChange={(v) => setQueueTab(v as QueueTab)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-8">
                <TabsTrigger value="fila" className="text-xs gap-1 px-1">
                  <InboxIcon className="h-3 w-3" />
                  Fila
                  {queueCounts.fila > 0 && (
                    <Badge variant="destructive" className="text-[10px] h-4 px-1 ml-0.5">{queueCounts.fila}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="meus" className="text-xs gap-1 px-1">
                  <User className="h-3 w-3" />
                  Meus
                  {queueCounts.meus > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-0.5">{queueCounts.meus}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="todos" className="text-xs gap-1 px-1">
                  Todos
                  <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-0.5">{queueCounts.todos}</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou protocolo..." className="pl-9 h-8 text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            {/* Status filter tabs */}
            <div className="flex gap-1">
              {[
                { key: 'all', label: 'Todos' },
                { key: 'open', label: 'Abertos' },
                { key: 'pending', label: 'Pendentes' },
                { key: 'resolved', label: 'Resolvidos' },
              ].map(s => (
                <Button
                  key={s.key}
                  variant={statusFilter === s.key ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-2 flex-1"
                  onClick={() => setStatusFilter(s.key)}
                >
                  {s.label}
                  <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">
                    {statusCounts[s.key as keyof typeof statusCounts] ?? 0}
                  </Badge>
                </Button>
              ))}
            </div>
            {/* Channel filter */}
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="h-7 text-xs"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os canais</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  {queueTab === 'fila' ? 'Nenhum ticket na fila' : queueTab === 'meus' ? 'Nenhum atendimento atribuído a você' : conversations.length === 0 ? 'Nenhum ticket ainda' : 'Nenhum resultado'}
                </p>
                {conversations.length === 0 && (
                  <Button className="mt-3" size="sm" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Novo Ticket
                  </Button>
                )}
              </div>
            ) : (
              <ScrollArea className="h-full">
                {filteredConversations.map((conversation) => {
                  const ChannelIcon = channelIcons[conversation.channel] || MessageSquare;
                  const lastMessage = conversation.messages?.[conversation.messages.length - 1];
                  const unreadCount = getUnreadCount(conversation);
                  const prio = (conversation as any).priority || 'medium';
                  const isUnassigned = !conversation.assigned_to;

                  return (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedId(conversation.id)}
                      className={`flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b transition-colors ${
                        selectedId === conversation.id ? 'bg-muted' : ''
                      } ${priorityIndicator[prio] || ''}`}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(conversation.contacts?.first_name, conversation.contacts?.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center ${channelColors[conversation.channel]}`}>
                          <ChannelIcon className="h-2.5 w-2.5" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">
                            {conversation.contacts?.first_name} {conversation.contacts?.last_name}
                          </span>
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {isUnassigned && (
                              <Badge variant="outline" className="text-[9px] h-4 px-1 border-yellow-500 text-yellow-600 dark:text-yellow-400">
                                Fila
                              </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {lastMessage ? new Date(lastMessage.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Hash className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                          <span className="text-[10px] text-muted-foreground font-mono truncate">
                            {(conversation as any).protocol_number || '—'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {lastMessage?.content || 'Sem mensagens'}
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] h-5 min-w-5 flex items-center justify-center shrink-0">{unreadCount}</Badge>
                      )}
                    </div>
                  );
                })}
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Chat Area */}
        {selectedConversation ? (
          <>
            <Card className={`flex-1 flex flex-col ${!selectedId ? 'hidden sm:flex' : ''}`}>
              {/* Chat Header */}
              <CardHeader className="py-3 px-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="sm:hidden shrink-0 -ml-2 h-8 w-8" onClick={() => setSelectedId(null)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(selectedConversation.contacts?.first_name, selectedConversation.contacts?.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-sm font-semibold">
                        {selectedConversation.contacts?.first_name} {selectedConversation.contacts?.last_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge className={`${channelColors[selectedConversation.channel]} text-[10px]`} variant="secondary">
                          {selectedConversation.channel}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {(selectedConversation as any).protocol_number}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Assumir atendimento button */}
                    {!selectedConversation.assigned_to && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleAssumirAtendimento}>
                        <User className="h-3 w-3" />
                        Assumir
                      </Button>
                    )}
                    <SendIAButton
                      conversationId={selectedConversation.id}
                      contactName={`${selectedConversation.contacts?.first_name || ''} ${selectedConversation.contacts?.last_name || ''}`}
                      lastMessages={selectedConversation.messages || []}
                      onSendMessage={(content) => {
                        sendMessage.mutate({
                          conversation_id: selectedConversation.id,
                          content,
                          sender_type: 'user',
                        });
                      }}
                    />
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-[calc(100vh-22rem)] p-4">
                  <div className="space-y-3">
                    {selectedConversation.messages?.map((message: any) => {
                      const msgType = message.message_type || 'text';
                      return (
                        <div key={message.id} className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-lg p-3 ${message.sender_type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {msgType === 'image' && message.media_url && (
                              <a href={message.media_url} target="_blank" rel="noopener noreferrer">
                                <img src={message.media_url} alt={message.file_name || 'Imagem'} className="rounded-md max-w-full max-h-60 object-cover mb-1" loading="lazy" />
                              </a>
                            )}
                            {msgType === 'audio' && message.media_url && (
                              <audio controls className="max-w-full mb-1" preload="metadata">
                                <source src={message.media_url} type={message.media_mime_type || 'audio/mpeg'} />
                              </audio>
                            )}
                            {msgType === 'file' && message.media_url && (
                              <a href={message.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded border border-current/20 hover:opacity-80 mb-1">
                                <FileIcon className="h-5 w-5 shrink-0" />
                                <span className="text-sm truncate">{message.file_name || 'Arquivo'}</span>
                              </a>
                            )}
                            {message.content && !(msgType !== 'text' && message.content.startsWith('📎')) && (
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            )}
                            <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${message.sender_type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              <span>{new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                              {message.sender_type === 'user' && <CheckCheck className="h-3 w-3" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Pending file preview */}
              {pendingFile && (
                <div className="px-4 pt-2 border-t">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-muted">
                    {pendingFile.type === 'image' && pendingFile.preview ? (
                      <img src={pendingFile.preview} alt="Preview" className="h-10 w-10 rounded object-cover" />
                    ) : pendingFile.type === 'audio' ? (
                      <FileAudio className="h-6 w-6 text-muted-foreground" />
                    ) : (
                      <FileIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{pendingFile.file.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(pendingFile.file.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setPendingFile(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="p-3 border-t">
                <div className="flex items-center gap-1">
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar" onChange={handleFileSelect} />
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <AudioTranscription onTranscription={(text) => setMessageInput(prev => prev + text)} />
                  <Input placeholder="Digite uma mensagem..." className="flex-1 h-8 text-sm" value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()} />
                  <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><Smile className="h-4 w-4" /></Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="end" className="w-auto p-0 border-none shadow-xl">
                      <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="auto" locale="pt" previewPosition="none" skinTonePosition="none" />
                    </PopoverContent>
                  </Popover>
                  <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSendMessage} disabled={isUploading}>
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Contact & Ticket Info Panel */}
            <Card className="w-72 flex-shrink-0 hidden lg:flex flex-col overflow-hidden">
              <ContactInfoPanel
                conversation={selectedConversation}
                onUpdateConversation={(updates) => updateConversation.mutate({ id: selectedConversation.id, ...updates })}
                onTransfer={(userId) => assignConversation.mutate({ conversationId: selectedConversation.id, userId })}
                onInsertQuickReply={(content) => setMessageInput(content)}
              />
            </Card>
          </>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Selecione um ticket para começar</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
