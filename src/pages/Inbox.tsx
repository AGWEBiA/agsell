import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  Search, Send, Paperclip, Smile, Phone, Settings,
  MessageSquare, Mail, CheckCheck, Check, Plus, Bot, Image as ImageIcon,
  FileAudio, File as FileIcon, X, Loader2,
  Hash, ChevronLeft, Inbox as InboxIcon, User, Ticket,
  BarChart3, Brain, Calendar, Users, CheckCircle2,
  ArrowDownToLine, Instagram, AlertCircle, Clock, Bug, Filter, RefreshCw,
  Reply, Zap,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useInbox } from '@/hooks/useInbox';
import { useContacts } from '@/hooks/useContacts';
import { useAssignmentRules } from '@/hooks/useAssignmentRules';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { SendIAButton } from '@/components/inbox/SendIAButton';
import { AudioTranscription } from '@/components/inbox/AudioTranscription';
import { ContactInfoPanel } from '@/components/inbox/ContactInfoPanel';
import { SacWhatsAppInstanceSelector } from '@/components/inbox/SacWhatsAppInstanceSelector';
import { InboxDebugPanel } from '@/components/inbox/InboxDebugPanel';
import { supabase } from '@/integrations/supabase/client';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { useWhatsAppInstances } from '@/hooks/useWhatsAppInstances';
import { useQuickReplies } from '@/hooks/useQuickReplies';
import { toast } from 'sonner';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';

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

const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

type QueueTab = 'fila' | 'meus' | 'todos';
type ChannelFilter = 'all' | 'whatsapp' | 'instagram' | 'email' | 'voip' | 'support';
type NcStep = 'search' | 'new' | 'device';

const getConversationMetadata = (conversation: any): Record<string, any> => {
  if (!conversation?.metadata || typeof conversation.metadata !== 'object' || Array.isArray(conversation.metadata)) {
    return {};
  }

  return conversation.metadata as Record<string, any>;
};

const renderMessageContent = (content: string, isUser: boolean) => {
  const parts = content.split(URL_REGEX);

  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        if (!part) return null;

        const isLink = URL_REGEX.test(part);
        URL_REGEX.lastIndex = 0;

        if (!isLink) {
          return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
        }

        const href = part.startsWith('http://') || part.startsWith('https://') ? part : `https://${part}`;

        return (
          <a
            key={`${href}-${index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline underline-offset-2 break-all transition-opacity hover:opacity-80 ${isUser ? 'text-foreground/90' : 'text-primary'}`}
          >
            {part}
          </a>
        );
      })}
    </p>
  );
};

export default function Inbox() {
  const { conversations, isLoading, createConversation, sendMessage, markAsRead, updateConversation } = useInbox();
  const contactsQuery = useContacts();
  const contacts = contactsQuery.data ?? [];
  const { assignConversation } = useAssignmentRules();
  const { createTicket: createSupportTicket } = useSupportTickets();
  const { instances, activeInstances } = useWhatsAppInstances();
  const { replies: quickReplies } = useQuickReplies();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ file: File; preview?: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [queueTab, setQueueTab] = useState<QueueTab>('fila');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [novaConversaOpen, setNovaConversaOpen] = useState(false);
  const [ncStep, setNcStep] = useState<NcStep>('search');
  const [ncSearch, setNcSearch] = useState('');
  const [ncSelectedContact, setNcSelectedContact] = useState<string | null>(null);
  const [ncChannel, setNcChannel] = useState('whatsapp');
  const [ncDeviceId, setNcDeviceId] = useState('');
  const [ncNewName, setNcNewName] = useState('');
  const [ncNewEmail, setNcNewEmail] = useState('');
  const [ncNewPhone, setNcNewPhone] = useState('');
  const [isCreatingContact, setIsCreatingContact] = useState(false);
  const [selectedWhatsappInstanceId, setSelectedWhatsappInstanceId] = useState('auto');
  const [instanceFilter, setInstanceFilter] = useState('all');
  const [showDebug, setShowDebug] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; content: string; sender_type: string; external_id?: string | null } | null>(null);
  const [quickReplyOpen, setQuickReplyOpen] = useState(false);
  const [shortcutSuggestions, setShortcutSuggestions] = useState<typeof quickReplies>([]);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(0);
  const [lastSentMessageId, setLastSentMessageId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSyncConversations = async (hours: number = 48) => {
    if (!currentOrganization?.id || activeInstances.length === 0) {
      toast.error('Nenhuma instância ativa para sincronizar');
      return;
    }
    setIsSyncing(true);
    try {
      let syncedCount = 0;
      for (const inst of activeInstances) {
        const instanceName = inst.instance_name || inst.name;
        if (!instanceName) continue;
        const { error } = await supabase.functions.invoke('sync-whatsapp-reconnect', {
          body: {
            instance_name: instanceName,
            state: 'open',
            hours,
          },
        });
        if (!error) syncedCount++;
      }
      toast.success(`Sincronização (${hours}h) concluída para ${syncedCount} instância(s)!`);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (e: any) {
      toast.error('Erro ao sincronizar: ' + (e.message || 'Erro desconhecido'));
    } finally {
      setIsSyncing(false);
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedId);
  const sacInstances = (activeInstances || []).filter((instance: any) => instance.config?.use_for_sac === true);
  const availableSacInstances = sacInstances.length > 0 ? sacInstances : (activeInstances || []);
  const selectedConversationMetadata = getConversationMetadata(selectedConversation);

  useEffect(() => {
    if (selectedConversation) markAsRead.mutate(selectedConversation.id);
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  useEffect(() => {
    setReplyingTo(null);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedConversation || selectedConversation.channel !== 'whatsapp') {
      setSelectedWhatsappInstanceId('auto');
      return;
    }

    const manualId = typeof selectedConversationMetadata.whatsapp_manual_instance_id === 'string'
      ? selectedConversationMetadata.whatsapp_manual_instance_id
      : null;

    setSelectedWhatsappInstanceId(manualId || 'auto');
  }, [selectedConversation?.id, selectedConversation?.channel, selectedConversation?.metadata]);

  const getInitials = (f?: string, l?: string | null) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase() || '??';
  const getUnreadCount = (c: any) => c.messages?.filter((m: any) => !m.is_read && m.sender_type === 'contact').length || 0;

  const queueFiltered = conversations.filter(c => {
    if (queueTab === 'fila') return !c.assigned_to && c.status !== 'resolved' && c.status !== 'closed';
    if (queueTab === 'meus') return c.assigned_to === user?.id && c.status !== 'resolved' && c.status !== 'closed';
    if (queueTab === 'todos') return true;
    return true;
  });

  const filteredConversations = queueFiltered.filter(c => {
    if (channelFilter !== 'all') {
      if (channelFilter === 'support') {
        if (c.channel !== 'support' && c.category !== 'support') return false;
      } else if (channelFilter === 'voip') {
        if (c.channel !== 'voip' && c.channel !== 'phone') return false;
      } else {
        if (c.channel !== channelFilter) return false;
      }
    }
    // Instance filter
    if (instanceFilter !== 'all') {
      const meta = getConversationMetadata(c);
      const convInstanceId = meta.whatsapp_instance_id || meta.whatsapp_manual_instance_id || '';
      if (convInstanceId !== instanceFilter) return false;
    }
    if (!searchQuery) return true;
    const name = `${c.contacts?.first_name || ''} ${c.contacts?.last_name || ''}`.toLowerCase();
    const protocol = (c as any).protocol_number?.toLowerCase() || '';
    const phone = c.contacts?.phone?.toLowerCase() || '';
    const whatsapp = c.contacts?.whatsapp?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();
    return name.includes(q) || protocol.includes(q) || phone.includes(q) || whatsapp.includes(q);
  });

  const channelCounts = {
    all: queueFiltered.length,
    whatsapp: queueFiltered.filter(c => c.channel === 'whatsapp').length,
    instagram: queueFiltered.filter(c => c.channel === 'instagram').length,
    email: queueFiltered.filter(c => c.channel === 'email').length,
    voip: queueFiltered.filter(c => c.channel === 'voip' || c.channel === 'phone').length,
    support: queueFiltered.filter(c => c.channel === 'support' || c.category === 'support').length,
  };

  const queueCounts = {
    fila: conversations.filter(c => !c.assigned_to && c.status !== 'resolved' && c.status !== 'closed').length,
    meus: conversations.filter(c => c.assigned_to === user?.id && c.status !== 'resolved' && c.status !== 'closed').length,
    todos: conversations.length,
  };

  const handlePuxar = (convId: string) => {
    if (!user?.id) return;
    updateConversation.mutate({ id: convId, assigned_to: user.id, status: 'open' });
    setSelectedId(convId);
    setQueueTab('meus');
    toast.success('Atendimento puxado para você!');
  };

  const handleFinalizar = () => {
    if (!selectedConversation) return;
    updateConversation.mutate({
      id: selectedConversation.id,
      status: 'resolved',
      resolved_at: new Date().toISOString(),
    });
    setSelectedId(null);
    toast.success('Atendimento finalizado!');
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

  const handleWhatsappInstanceChange = (instanceId: string) => {
    if (!selectedConversation || selectedConversation.channel !== 'whatsapp') return;

    setSelectedWhatsappInstanceId(instanceId);
    const currentMetadata = getConversationMetadata(selectedConversation);
    const nextMetadata = { ...currentMetadata };

    if (instanceId === 'auto') {
      delete nextMetadata.whatsapp_manual_instance_id;
    } else {
      nextMetadata.whatsapp_manual_instance_id = instanceId;
    }

    updateConversation.mutate({
      id: selectedConversation.id,
      metadata: nextMetadata,
    });
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
    const wasQuotedReply = !!replyingTo;
    const sentContent = messageInput;
    sendMessage.mutate({
      conversation_id: selectedConversation.id,
      content: messageInput || (pendingFile ? `📎 ${pendingFile.file.name}` : ''),
      sender_type: 'user',
      message_type: messageType,
      media_url: mediaUrl,
      media_mime_type: mediaMimeType,
      file_name: fileName,
      instance_id: selectedWhatsappInstanceId !== 'auto' ? selectedWhatsappInstanceId : undefined,
      ...(replyingTo ? {
        quoted_message_id: replyingTo.id,
        quoted_content: replyingTo.content?.slice(0, 200),
        quoted_sender_type: replyingTo.sender_type,
        quoted_external_id: replyingTo.external_id,
      } : {}),
    } as any, {
      onSuccess: (data: any) => {
        if (wasQuotedReply && data?.id) {
          setLastSentMessageId(data.id);
          toast('Resposta com citação enviada', {
            action: {
              label: 'Desfazer',
              onClick: async () => {
                await supabase.from('messages').delete().eq('id', data.id);
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
                setMessageInput(sentContent);
                toast.success('Mensagem removida');
              },
            },
            duration: 6000,
          });
        }
      },
    });
    setMessageInput('');
    setPendingFile(null);
    setIsUploading(false);
    setReplyingTo(null);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleEmojiSelect = (emoji: any) => {
    setMessageInput(prev => prev + emoji.native);
    setEmojiOpen(false);
  };

  const applyQuickReply = (template: string) => {
    let text = template;
    // Replace variables
    const contactName = selectedConversation?.contacts
      ? `${selectedConversation.contacts.first_name} ${selectedConversation.contacts.last_name || ''}`.trim()
      : 'Cliente';
    text = text.replace(/\{\{nome\}\}/gi, contactName);
    if (replyingTo?.content) {
      text = text.replace(/\{\{citação\}\}/gi, replyingTo.content.slice(0, 150));
    } else {
      text = text.replace(/\{\{citação\}\}/gi, '');
    }
    setMessageInput(text);
    setQuickReplyOpen(false);
    setShortcutSuggestions([]);
  };

  const handleInputChange = (value: string) => {
    setMessageInput(value);
    // Detect /shortcut pattern
    if (value.startsWith('/') && value.length > 1 && !value.includes(' ')) {
      const query = value.slice(1).toLowerCase();
      const matches = quickReplies.filter(r =>
        r.shortcut?.toLowerCase().startsWith(query) || r.title.toLowerCase().includes(query)
      );
      setShortcutSuggestions(matches.slice(0, 5));
      setSelectedSuggestionIdx(0);
    } else {
      setShortcutSuggestions([]);
      setSelectedSuggestionIdx(0);
    }
  };

  const ncFilteredContacts = ncSearch.trim()
    ? contacts.filter(c => {
        const s = ncSearch.toLowerCase();
        return c.first_name.toLowerCase().includes(s) ||
          (c.last_name || '').toLowerCase().includes(s) ||
          (c.phone || '').includes(s) ||
          (c.whatsapp || '').includes(s) ||
          (c.email || '').toLowerCase().includes(s);
      })
    : contacts.slice(0, 10);

  const startConversationAndOpen = async (
    payload: Parameters<typeof createConversation.mutateAsync>[0],
    successMessage = 'Atendimento iniciado!'
  ) => {
    const conversation = await createConversation.mutateAsync(payload);

    if (conversation?.id) {
      setSelectedId(conversation.id);
      setQueueTab('todos');
    }

    resetNovaConversa();
    toast.success(successMessage);
  };

  const handleNovaConversaStart = async () => {
    if (!ncSelectedContact) { toast.error('Selecione um contato'); return; }
    if (ncChannel === 'whatsapp' && availableSacInstances.length > 0 && !ncDeviceId) {
      setNcStep('device');
      return;
    }

    await startConversationAndOpen({
      contact_id: ncSelectedContact,
      channel: ncChannel,
      metadata: ncChannel === 'whatsapp' && ncDeviceId ? { whatsapp_manual_instance_id: ncDeviceId } : undefined,
    });
  };

  const handleDeviceSelected = async (deviceId: string) => {
    setNcDeviceId(deviceId);
    if (ncSelectedContact) {
      await startConversationAndOpen({
        contact_id: ncSelectedContact,
        channel: ncChannel,
        metadata: { whatsapp_manual_instance_id: deviceId },
      });
    }
  };

  const handleCreateContactAndStart = async () => {
    if (!ncNewName.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!user?.id) return;
    setIsCreatingContact(true);
    try {
      const contactData: any = {
        first_name: ncNewName.trim(),
        user_id: user.id,
        organization_id: currentOrganization?.id || null,
        source: 'sac',
      };
      if (ncNewEmail.trim()) contactData.email = ncNewEmail.trim();
      if (ncNewPhone.trim()) {
        const phone = ncNewPhone.trim().replace(/\D/g, '');
        contactData.phone = phone;
        contactData.whatsapp = phone;
      }
      const { data: contact, error } = await supabase.from('contacts').insert(contactData).select().single();
      if (error) throw error;
      setNcSelectedContact(contact.id);
      if (ncChannel === 'whatsapp' && availableSacInstances.length > 0) {
        setNcStep('device');
        toast.success('Contato criado! Selecione a instância.');
      } else {
        await startConversationAndOpen(
          { contact_id: contact.id, channel: ncChannel },
          'Contato criado e atendimento iniciado!'
        );
      }
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    } finally {
      setIsCreatingContact(false);
    }
  };

  const resetNovaConversa = () => {
    setNovaConversaOpen(false);
    setNcStep('search');
    setNcSearch('');
    setNcSelectedContact(null);
    setNcChannel('whatsapp');
    setNcDeviceId('');
    setNcNewName('');
    setNcNewEmail('');
    setNcNewPhone('');
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-7rem)] animate-fade-in flex gap-0">
        <div className="w-80 border-r flex flex-col">
          <div className="p-3 space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
          {[1,2,3].map(i => <div key={i} className="p-3 border-b"><Skeleton className="h-14 w-full" /></div>)}
        </div>
        <div className="flex-1"><Skeleton className="h-full" /></div>
      </div>
    );
  }


  return (
    <div className="h-[calc(100vh-7rem)] animate-fade-in flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold">SAC — Atendimento Central</h1>
          <Button variant="default" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setNovaConversaOpen(true)}>
            <Plus className="h-3 w-3" />
            Nova Conversa
          </Button>
        </div>
        <div className="flex items-center gap-0.5">
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link to="/inbox-reports"><BarChart3 className="h-4 w-4" /></Link>
            </Button>
          </TooltipTrigger><TooltipContent>Relatórios</TooltipContent></Tooltip>

          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link to="/ai-agents"><Brain className="h-4 w-4" /></Link>
            </Button>
          </TooltipTrigger><TooltipContent>Agentes IA</TooltipContent></Tooltip>

          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link to="/inbox-settings"><Settings className="h-4 w-4" /></Link>
            </Button>
          </TooltipTrigger><TooltipContent>Configurações</TooltipContent></Tooltip>
        </div>
      </div>

      {/* Channel Filter Tabs */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-background shrink-0 overflow-x-auto">
        {([
          { key: 'all' as ChannelFilter, label: 'Todos', color: 'bg-primary text-primary-foreground', icon: InboxIcon },
          { key: 'whatsapp' as ChannelFilter, label: 'WhatsApp', color: 'bg-green-600 text-white', icon: MessageSquare },
          { key: 'instagram' as ChannelFilter, label: 'Instagram', color: 'bg-pink-600 text-white', icon: Instagram },
          { key: 'email' as ChannelFilter, label: 'E-mail', color: 'bg-blue-600 text-white', icon: Mail },
          { key: 'voip' as ChannelFilter, label: 'VoIP', color: 'bg-violet-600 text-white', icon: Phone },
          { key: 'support' as ChannelFilter, label: 'Suporte', color: 'bg-orange-600 text-white', icon: Ticket },
        ]).map(ch => (
          <button
            key={ch.key}
            onClick={() => setChannelFilter(ch.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              channelFilter === ch.key
                ? ch.color + ' shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <ch.icon className="h-3.5 w-3.5" />
            {ch.label}
            {channelCounts[ch.key] > 0 && (
              <span className={`ml-0.5 text-[10px] min-w-4 h-4 flex items-center justify-center rounded-full px-1 ${
                channelFilter === ch.key ? 'bg-white/20' : 'bg-foreground/10'
              }`}>
                {channelCounts[ch.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar — Conversation List */}
        <div className={`w-full sm:w-80 border-r flex flex-col shrink-0 bg-background ${selectedId ? 'hidden sm:flex' : 'flex'}`}>
          {/* Queue Tabs */}
          <div className="flex border-b shrink-0">
            {([
              { key: 'fila', label: 'Fila', icon: InboxIcon, count: queueCounts.fila },
              { key: 'meus', label: 'Meus', icon: User, count: queueCounts.meus },
              { key: 'todos', label: 'Todos', icon: CheckCircle2, count: queueCounts.todos },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setQueueTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                  queueTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[10px] min-w-4 h-4 flex items-center justify-center rounded-full px-1 ${
                    tab.key === 'fila' && tab.count > 0 ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search & Instance Filter */}
          <div className="p-2 space-y-1.5 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar nome, telefone, protocolo..."
                className="pl-8 h-8 text-xs bg-muted/50 border-0 focus-visible:ring-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Select value={instanceFilter} onValueChange={setInstanceFilter}>
                <SelectTrigger className="h-7 text-[10px] flex-1 bg-muted/30 border-0">
                  <Filter className="h-3 w-3 mr-1 shrink-0" />
                  <SelectValue placeholder="Instância" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas instâncias</SelectItem>
                  {(instances || []).map((inst: any) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name || inst.instance_name || inst.phone_number || 'Sem nome'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tooltip><TooltipTrigger asChild>
                <Button
                  variant={showDebug ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => setShowDebug(!showDebug)}
                >
                  <Bug className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger><TooltipContent>Debug SAC</TooltipContent></Tooltip>
              <DropdownMenu>
                <Tooltip><TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      disabled={isSyncing}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger><TooltipContent>Puxar conversas dos dispositivos</TooltipContent></Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSyncConversations(24)}>Últimas 24 horas</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSyncConversations(48)}>Últimas 48 horas</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSyncConversations(72)}>Últimas 72 horas</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {queueTab === 'fila' ? 'Fila vazia' : queueTab === 'meus' ? 'Nenhum atendimento ativo' : 'Nenhum atendimento finalizado'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const ChannelIcon = channelIcons[conversation.channel] || MessageSquare;
                const lastMessage = conversation.messages?.[conversation.messages.length - 1];
                const unreadCount = getUnreadCount(conversation);
                const isSelected = selectedId === conversation.id;

                return (
                  <div
                    key={conversation.id}
                    className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer border-b border-border/50 transition-colors ${
                      isSelected ? 'bg-accent' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedId(conversation.id)}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(conversation.contacts?.first_name, conversation.contacts?.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center text-[8px] ${channelColors[conversation.channel]}`}>
                        <ChannelIcon className="h-2 w-2" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {conversation.contacts?.first_name} {conversation.contacts?.last_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                          {lastMessage ? new Date(lastMessage.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {lastMessage?.content || 'Sem mensagens'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-[10px] h-4.5 min-w-4.5 flex items-center justify-center rounded-full px-1 font-medium">
                          {unreadCount}
                        </span>
                      )}
                      {/* Puxar button for Fila tab */}
                      {queueTab === 'fila' && !conversation.assigned_to && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-5 text-[10px] px-1.5"
                          onClick={(e) => { e.stopPropagation(); handlePuxar(conversation.id); }}
                        >
                          <ArrowDownToLine className="h-2.5 w-2.5 mr-0.5" />
                          Puxar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className={`flex-1 flex flex-col bg-background ${!selectedId ? 'hidden sm:flex' : 'flex'}`}>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0">
              <div className="flex items-center gap-2.5">
                <Button variant="ghost" size="icon" className="sm:hidden shrink-0 h-7 w-7 -ml-1" onClick={() => setSelectedId(null)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(selectedConversation.contacts?.first_name, selectedConversation.contacts?.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-medium leading-tight">
                    {selectedConversation.contacts?.first_name} {selectedConversation.contacts?.last_name}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <Badge className={`${channelColors[selectedConversation.channel]} text-[9px] h-4 px-1`} variant="secondary">
                      {selectedConversation.channel}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {(selectedConversation as any).protocol_number}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Puxar se na fila */}
                {!selectedConversation.assigned_to && selectedConversation.status !== 'resolved' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handlePuxar(selectedConversation.id)}>
                    <ArrowDownToLine className="h-3 w-3" />
                    Puxar
                  </Button>
                )}
                {/* Finalizar */}
                {selectedConversation.assigned_to === user?.id && selectedConversation.status !== 'resolved' && selectedConversation.status !== 'closed' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-950" onClick={handleFinalizar}>
                    <CheckCircle2 className="h-3 w-3" />
                    Finalizar
                  </Button>
                )}
                {/* Ticket de suporte */}
                <Tooltip><TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      createSupportTicket.mutate({
                        title: `Suporte: ${selectedConversation.contacts?.first_name || ''} ${selectedConversation.contacts?.last_name || ''}`.trim(),
                        contact_id: selectedConversation.contact_id,
                        conversation_id: selectedConversation.id,
                      }, { onSuccess: () => navigate('/support') });
                    }}
                  >
                    <Ticket className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger><TooltipContent>Abrir Ticket</TooltipContent></Tooltip>
                {/* Seletor de instância WhatsApp */}
                {selectedConversation.channel === 'whatsapp' && availableSacInstances.length > 0 && (
                  <SacWhatsAppInstanceSelector
                    instances={availableSacInstances}
                    value={selectedWhatsappInstanceId}
                    onChange={handleWhatsappInstanceChange}
                    className="hidden sm:block"
                  />
                )}
                {/* IA */}
                <SendIAButton
                  conversationId={selectedConversation.id}
                  contactName={`${selectedConversation.contacts?.first_name || ''} ${selectedConversation.contacts?.last_name || ''}`}
                  lastMessages={selectedConversation.messages || []}
                  onSendMessage={(content) => {
                    sendMessage.mutate({ conversation_id: selectedConversation.id, content, sender_type: 'user' });
                  }}
                />
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2.5 max-w-3xl mx-auto">
                {selectedConversation.messages?.map((message: any) => {
                  const msgType = message.message_type || 'text';
                  const isUser = message.sender_type === 'user';
                  return (
                    <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} group/msg`}>
                      <div className={`max-w-[70%] rounded-xl px-3 py-2 relative ${isUser ? 'bg-emerald-900/60 text-foreground' : 'bg-muted'}`}>
                        {/* Quoted message preview */}
                        {message.quoted_content && (
                          <div className="mb-1.5 rounded-md bg-background/30 border-l-2 border-primary px-2 py-1">
                            <p className="text-[10px] font-semibold opacity-70">
                              {message.quoted_sender_type === 'user' ? 'Você' : selectedConversation.contacts?.first_name || 'Contato'}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-3">{message.quoted_content}</p>
                          </div>
                        )}
                        {isUser && message.sender_name && (
                          <p className="text-[10px] font-semibold mb-0.5 opacity-75">{message.sender_name}</p>
                        )}
                        {msgType === 'image' && message.media_url && (
                          <a href={message.media_url} target="_blank" rel="noopener noreferrer">
                            <img src={message.media_url} alt={message.file_name || 'Imagem'} className="rounded-lg max-w-full max-h-52 object-cover mb-1" loading="lazy" />
                          </a>
                        )}
                        {msgType === 'audio' && message.media_url && (
                          <audio controls className="max-w-full mb-1" preload="metadata">
                            <source src={message.media_url} type={message.media_mime_type || 'audio/mpeg'} />
                          </audio>
                        )}
                        {msgType === 'file' && message.media_url && (
                          <a href={message.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded border border-current/20 hover:opacity-80 mb-1">
                            <FileIcon className="h-4 w-4 shrink-0" />
                            <span className="text-xs truncate">{message.file_name || 'Arquivo'}</span>
                          </a>
                        )}
                        {message.content && !(msgType !== 'text' && message.content.startsWith('📎')) && (
                          renderMessageContent(message.content, isUser)
                        )}
                        <div className={`flex items-center justify-end gap-1 mt-0.5 text-[10px] text-muted-foreground`}>
                          <span>{new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          {isUser && (() => {
                            const status = message.delivery_status || 'sent';
                            const statusLabel: Record<string, string> = { failed: 'Falhou', read: 'Lida', delivered: 'Entregue', sent: 'Enviada', pending: 'Pendente' };
                            const label = statusLabel[status] || 'Pendente';
                            const icon = (() => {
                              if (status === 'failed') return <AlertCircle className="h-2.5 w-2.5 text-destructive" />;
                              if (status === 'read') return <CheckCheck className="h-2.5 w-2.5 text-blue-400" />;
                              if (status === 'delivered') return <CheckCheck className="h-2.5 w-2.5" />;
                              if (status === 'sent') return <Check className="h-2.5 w-2.5" />;
                              return <Clock className="h-2.5 w-2.5 opacity-50" />;
                            })();
                            return (
                              <Tooltip>
                                <TooltipTrigger asChild><span className="inline-flex items-center cursor-default">{icon}</span></TooltipTrigger>
                                <TooltipContent side="left" className="text-xs">{label}</TooltipContent>
                              </Tooltip>
                            );
                          })()}
                        </div>
                        {/* Reply button */}
                        <button
                          onClick={() => setReplyingTo({
                            id: message.id,
                            content: message.content,
                            sender_type: message.sender_type,
                            external_id: message.external_id,
                          })}
                          className={`absolute ${isUser ? '-left-8' : '-right-8'} top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 rounded-full hover:bg-muted`}
                          title="Responder"
                        >
                          <Reply className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Pending file preview */}
            {pendingFile && (
              <div className="px-4 pt-2 border-t shrink-0">
                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-muted">
                  {pendingFile.type === 'image' && pendingFile.preview ? (
                    <img src={pendingFile.preview} alt="Preview" className="h-10 w-10 rounded object-cover" />
                  ) : pendingFile.type === 'audio' ? (
                    <FileAudio className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <FileIcon className="h-5 w-5 text-muted-foreground" />
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

            {/* Reply preview */}
            {replyingTo && (
              <div className="px-4 pt-2 border-t shrink-0">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted border-l-2 border-primary">
                  <Reply className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-primary">
                      {replyingTo.sender_type === 'user' ? 'Você' : selectedConversation?.contacts?.first_name || 'Contato'}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{replyingTo.content}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setReplyingTo(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Shortcut suggestions */}
            {shortcutSuggestions.length > 0 && (
              <div className="px-4 pb-1 shrink-0">
                <div className="max-w-3xl mx-auto bg-popover border rounded-lg shadow-lg p-1 space-y-0.5">
                  {shortcutSuggestions.map((r, idx) => (
                    <button
                      key={r.id}
                      className={`w-full text-left px-3 py-1.5 rounded text-sm flex items-center gap-2 ${idx === selectedSuggestionIdx ? 'bg-accent' : 'hover:bg-accent'}`}
                      onClick={() => applyQuickReply(r.content)}
                    >
                      <Zap className="h-3 w-3 text-primary shrink-0" />
                      <span className="font-medium truncate">{r.title}</span>
                      {r.shortcut && <span className="text-[10px] text-muted-foreground ml-auto">/{r.shortcut}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-2.5 border-t shrink-0">
              <div className="flex items-end gap-1 max-w-3xl mx-auto">
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar" onChange={handleFileSelect} />
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-4 w-4" />
                </Button>
                <AudioTranscription onTranscription={(text) => setMessageInput(prev => prev + text)} />
                <textarea
                  ref={textareaRef}
                  placeholder="Digite /atalho ou uma mensagem..."
                  className="flex-1 min-h-[36px] max-h-[120px] py-2 text-sm rounded-2xl bg-muted/50 border-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring px-4 resize-none overflow-y-auto"
                  value={messageInput}
                  onChange={(e) => {
                    handleInputChange(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  onKeyDown={(e) => {
                    // Escape: close reply, suggestions, quick reply popover
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      if (shortcutSuggestions.length > 0) {
                        setShortcutSuggestions([]);
                        setSelectedSuggestionIdx(0);
                      } else if (quickReplyOpen) {
                        setQuickReplyOpen(false);
                      } else if (replyingTo) {
                        setReplyingTo(null);
                      }
                      return;
                    }
                    // Arrow navigation for shortcut suggestions
                    if (shortcutSuggestions.length > 0) {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setSelectedSuggestionIdx(prev => Math.min(prev + 1, shortcutSuggestions.length - 1));
                        return;
                      }
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setSelectedSuggestionIdx(prev => Math.max(prev - 1, 0));
                        return;
                      }
                    }
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (shortcutSuggestions.length > 0) {
                        applyQuickReply(shortcutSuggestions[selectedSuggestionIdx].content);
                      } else {
                        handleSendMessage();
                      }
                    }
                  }}
                  rows={1}
                />
                {/* Quick replies button */}
                <Popover open={quickReplyOpen} onOpenChange={setQuickReplyOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" title="Respostas rápidas">
                      <Zap className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="end" className="w-72 p-2 max-h-64 overflow-y-auto">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">Respostas Rápidas</p>
                    {quickReplies.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Nenhuma resposta rápida cadastrada.<br/>
                        <Link to="/inbox-settings" className="text-primary underline">Criar templates</Link>
                      </p>
                    ) : (
                      <div className="space-y-0.5">
                        {quickReplies.map(r => (
                          <button
                            key={r.id}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-accent text-sm"
                            onClick={() => applyQuickReply(r.content)}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium truncate">{r.title}</span>
                              {r.category && <Badge variant="secondary" className="text-[9px] h-4 shrink-0">{r.category}</Badge>}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{r.content.slice(0, 80)}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
                <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><Smile className="h-4 w-4" /></Button>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="end" className="w-auto p-0 border-none shadow-xl">
                    <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="auto" locale="pt" previewPosition="none" skinTonePosition="none" />
                  </PopoverContent>
                </Popover>
                <Button size="icon" className="h-9 w-9 rounded-full shrink-0" onClick={handleSendMessage} disabled={isUploading}>
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Selecione uma conversa para começar</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setNovaConversaOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Nova Conversa
              </Button>
            </div>
          </div>
        )}

        {/* Debug Panel */}
        {showDebug && (
          <div className="w-80 border-l shrink-0 hidden sm:flex flex-col overflow-hidden bg-background">
            <InboxDebugPanel conversationId={selectedId} onClose={() => setShowDebug(false)} />
          </div>
        )}

        {/* Right Panel — Contact Info (desktop only) */}
        {selectedConversation && !showDebug && (
          <div className="w-72 border-l shrink-0 hidden xl:flex flex-col overflow-hidden bg-background">
            <ContactInfoPanel
              conversation={selectedConversation}
              onUpdateConversation={(updates) => updateConversation.mutate({ id: selectedConversation.id, ...updates })}
              onTransfer={(userId) => assignConversation.mutate({ conversationId: selectedConversation.id, userId })}
              onInsertQuickReply={(content) => setMessageInput(content)}
            />
          </div>
        )}
      </div>

      {/* Nova Conversa Dialog */}
      <Dialog open={novaConversaOpen} onOpenChange={(v) => { if (!v) resetNovaConversa(); else setNovaConversaOpen(true); }}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Nova Conversa</DialogTitle>
            <DialogDescription>Busque um contato existente ou crie um novo para iniciar o atendimento.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {ncStep === 'search' && (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-sm">Buscar Contato</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Nome, telefone ou e-mail..."
                      className="pl-8 h-9 text-sm"
                      value={ncSearch}
                      onChange={e => setNcSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <ScrollArea className="max-h-40 border rounded-md">
                    {ncFilteredContacts.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Nenhum contato encontrado</p>
                    ) : (
                      ncFilteredContacts.map(c => (
                        <div
                          key={c.id}
                          className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors text-sm ${
                            ncSelectedContact === c.id ? 'bg-accent' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setNcSelectedContact(c.id)}
                        >
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {getInitials(c.first_name, c.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{c.first_name} {c.last_name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{c.phone || c.email || '—'}</p>
                          </div>
                          {ncSelectedContact === c.id && <CheckCheck className="h-4 w-4 text-primary shrink-0" />}
                        </div>
                      ))
                    )}
                  </ScrollArea>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Canal</Label>
                  <Select value={ncChannel} onValueChange={setNcChannel}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="telegram">Telegram</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />
                <Button variant="outline" size="default" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold" onClick={() => setNcStep('new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar novo contato
                </Button>
              </div>
            )}

            {ncStep === 'new' && (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-sm">Nome *</Label>
                  <Input value={ncNewName} onChange={e => setNcNewName(e.target.value)} placeholder="Nome do contato" className="h-9" autoFocus />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Email</Label>
                  <Input type="email" value={ncNewEmail} onChange={e => setNcNewEmail(e.target.value)} placeholder="email@exemplo.com" className="h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Telefone com DDD</Label>
                  <Input value={ncNewPhone} onChange={e => setNcNewPhone(e.target.value.replace(/\D/g, ''))} placeholder="11999999999" className="h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Canal</Label>
                  <Select value={ncChannel} onValueChange={setNcChannel}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="telegram">Telegram</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="link" size="sm" className="px-0 text-xs" onClick={() => setNcStep('search')}>
                  ← Voltar para busca
                </Button>
              </div>
            )}

            {ncStep === 'device' && (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Dispositivos conectados</Label>
                  <p className="text-xs text-primary">Selecione um dispositivo para iniciar a conversa</p>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Pesquisar nome ou número" className="pl-8 h-9 text-sm" />
                  </div>
                </div>
                <ScrollArea className="max-h-60">
                  <div className="space-y-1">
                    {instances?.map((inst: any) => (
                      <div
                        key={inst.id}
                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 border border-border/50"
                        onClick={() => handleDeviceSelected(inst.id)}
                      >
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{inst.name || 'Sem nome'}</p>
                          <p className="text-xs text-muted-foreground">{inst.phone_number || '—'}</p>
                        </div>
                        {inst.integration_type && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {inst.integration_type === 'evolution_api' ? 'Suporte' : 'Comercial'}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          <DialogFooter>
            {ncStep === 'device' ? (
              <>
                <Button variant="link" size="sm" onClick={() => setNcStep('search')}>Voltar</Button>
                <Button variant="outline" onClick={resetNovaConversa}>Fechar</Button>
              </>
            ) : ncStep === 'search' ? (
              <>
                <Button variant="outline" onClick={resetNovaConversa}>Cancelar</Button>
                <Button onClick={handleNovaConversaStart} disabled={!ncSelectedContact}>
                  Iniciar Atendimento
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={resetNovaConversa}>Cancelar</Button>
                <Button onClick={handleCreateContactAndStart} disabled={isCreatingContact || !ncNewName.trim()}>
                  {isCreatingContact && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Criar e Iniciar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
