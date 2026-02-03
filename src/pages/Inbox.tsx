import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  MessageSquare,
  Mail,
  CheckCheck,
  Plus,
  Bot,
} from 'lucide-react';
import { useInbox } from '@/hooks/useInbox';
import { useContacts, type Contact } from '@/hooks/useContacts';
import { SendIAButton } from '@/components/inbox/SendIAButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const channelColors: Record<string, string> = {
  whatsapp: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  email: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  instagram: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
};

const channelIcons: Record<string, typeof MessageSquare> = {
  whatsapp: MessageSquare,
  email: Mail,
  instagram: MessageSquare,
};

export default function Inbox() {
  const { conversations, isLoading, createConversation, sendMessage, markAsRead } = useInbox();
  const contactsQuery = useContacts();
  const contacts = contactsQuery.data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newConversation, setNewConversation] = useState({
    contact_id: '',
    channel: 'email',
  });

  const selectedConversation = conversations.find(c => c.id === selectedId);

  useEffect(() => {
    if (conversations.length > 0 && !selectedId) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  useEffect(() => {
    if (selectedConversation) {
      markAsRead.mutate(selectedConversation.id);
    }
  }, [selectedId]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    sendMessage.mutate({
      conversation_id: selectedConversation.id,
      content: messageInput,
      sender_type: 'user',
    });
    setMessageInput('');
  };

  const handleCreateConversation = () => {
    if (!newConversation.contact_id) return;
    createConversation.mutate({
      contact_id: newConversation.contact_id,
      channel: newConversation.channel,
    });
    setNewConversation({ contact_id: '', channel: 'email' });
    setIsDialogOpen(false);
  };

  const getInitials = (firstName?: string, lastName?: string | null) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '??';
  };

  const getUnreadCount = (conversation: typeof conversations[0]) => {
    return conversation.messages?.filter(m => !m.is_read && m.sender_type === 'contact').length || 0;
  };

  const filteredConversations = conversations.filter(c => {
    const contactName = `${c.contacts?.first_name || ''} ${c.contacts?.last_name || ''}`.toLowerCase();
    return contactName.includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-7rem)] animate-fade-in">
        <div className="flex h-full gap-4">
          <Card className="w-96 flex-shrink-0">
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-10 w-full mt-3" />
            </CardHeader>
            <CardContent className="p-0">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 border-b">
                  <Skeleton className="h-14 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="flex-1">
            <Skeleton className="h-full" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)] animate-fade-in">
      <div className="flex h-full gap-4">
        {/* Conversations List */}
        <Card className="w-96 flex-shrink-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Conversas</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{conversations.length}</Badge>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nova Conversa</DialogTitle>
                      <DialogDescription>Inicie uma nova conversa com um contato.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Contato</Label>
                        <Select
                          value={newConversation.contact_id}
                          onValueChange={(value) => setNewConversation(prev => ({ ...prev, contact_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um contato" />
                          </SelectTrigger>
                          <SelectContent>
                            {contacts.map(c => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.first_name} {c.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Canal</Label>
                        <Select
                          value={newConversation.channel}
                          onValueChange={(value) => setNewConversation(prev => ({ ...prev, channel: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                      <Button onClick={handleCreateConversation}>Criar Conversa</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar conversas..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma conversa ainda</p>
                <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Iniciar Conversa
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-16rem)]">
                {filteredConversations.map((conversation) => {
                  const ChannelIcon = channelIcons[conversation.channel] || MessageSquare;
                  const lastMessage = conversation.messages?.[conversation.messages.length - 1];
                  const unreadCount = getUnreadCount(conversation);

                  return (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedId(conversation.id)}
                      className={`flex items-center gap-3 p-4 hover:bg-muted cursor-pointer border-b ${
                        selectedId === conversation.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="relative">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(conversation.contacts?.first_name, conversation.contacts?.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center ${
                            channelColors[conversation.channel]
                          }`}
                        >
                          <ChannelIcon className="h-2.5 w-2.5" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">
                            {conversation.contacts?.first_name} {conversation.contacts?.last_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {lastMessage ? new Date(lastMessage.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {lastMessage?.content || 'Sem mensagens'}
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <Badge className="bg-primary">{unreadCount}</Badge>
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
            <Card className="flex-1 flex flex-col">
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(selectedConversation.contacts?.first_name, selectedConversation.contacts?.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {selectedConversation.contacts?.first_name} {selectedConversation.contacts?.last_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge
                          className={channelColors[selectedConversation.channel]}
                          variant="secondary"
                        >
                          {selectedConversation.channel}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-[calc(100vh-22rem)] p-4">
                  <div className="space-y-4">
                    {selectedConversation.messages?.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.sender_type === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                              message.sender_type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}
                          >
                            <span>{new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            {message.sender_type === 'user' && (
                              <CheckCheck className="h-3 w-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Digite uma mensagem..."
                    className="flex-1"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button variant="ghost" size="icon">
                    <Smile className="h-4 w-4" />
                  </Button>
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
                  <Button size="icon" onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Contact Info */}
            <Card className="w-80 flex-shrink-0">
              <CardHeader className="text-center">
                <Avatar className="h-20 w-20 mx-auto">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {getInitials(selectedConversation.contacts?.first_name, selectedConversation.contacts?.last_name)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="mt-4">
                  {selectedConversation.contacts?.first_name} {selectedConversation.contacts?.last_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Informações</p>
                  <div className="space-y-2 text-sm">
                    {selectedConversation.contacts?.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{selectedConversation.contacts.email}</span>
                      </div>
                    )}
                    {selectedConversation.contacts?.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{selectedConversation.contacts.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Score</p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary">{selectedConversation.contacts?.lead_score ?? 0}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {(selectedConversation.contacts?.lead_score ?? 0) >= 70 ? 'Lead qualificado' : 'Em desenvolvimento'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Selecione uma conversa para começar</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
