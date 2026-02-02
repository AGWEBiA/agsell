import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
  Clock,
  CheckCheck,
} from 'lucide-react';

// Mock data
const conversations = [
  { id: 1, name: 'João Silva', lastMessage: 'Obrigado pela proposta! Vou analisar...', time: '5 min', unread: 2, channel: 'whatsapp', status: 'open' },
  { id: 2, name: 'Maria Santos', lastMessage: 'Quando podemos agendar a reunião?', time: '15 min', unread: 0, channel: 'email', status: 'pending' },
  { id: 3, name: 'Carlos Lima', lastMessage: 'Perfeito, aguardo retorno.', time: '1h', unread: 0, channel: 'whatsapp', status: 'resolved' },
  { id: 4, name: 'Ana Oliveira', lastMessage: 'Preciso de mais informações sobre...', time: '2h', unread: 1, channel: 'instagram', status: 'open' },
  { id: 5, name: 'Pedro Costa', lastMessage: 'Ok, obrigado!', time: '3h', unread: 0, channel: 'whatsapp', status: 'closed' },
];

const messages = [
  { id: 1, sender: 'contact', content: 'Olá! Vi a proposta que vocês enviaram.', time: '14:30', status: 'read' },
  { id: 2, sender: 'user', content: 'Oi João! Fico feliz que recebeu. Alguma dúvida?', time: '14:32', status: 'read' },
  { id: 3, sender: 'contact', content: 'Sim, gostaria de entender melhor os prazos de entrega.', time: '14:35', status: 'read' },
  { id: 4, sender: 'user', content: 'Claro! Nosso prazo padrão é de 30 dias úteis após a aprovação da proposta.', time: '14:38', status: 'read' },
  { id: 5, sender: 'contact', content: 'Obrigado pela proposta! Vou analisar e retorno até amanhã.', time: '14:45', status: 'delivered' },
];

const channelColors = {
  whatsapp: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  email: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  instagram: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
};

const channelIcons = {
  whatsapp: MessageSquare,
  email: Mail,
  instagram: MessageSquare,
};

export default function Inbox() {
  const selectedConversation = conversations[0];

  return (
    <div className="h-[calc(100vh-7rem)] animate-fade-in">
      <div className="flex h-full gap-4">
        {/* Conversations List */}
        <Card className="w-96 flex-shrink-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Conversas</CardTitle>
              <Badge variant="secondary">{conversations.length}</Badge>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar conversas..." className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              {conversations.map((conversation) => {
                const ChannelIcon = channelIcons[conversation.channel as keyof typeof channelIcons];
                return (
                  <div
                    key={conversation.id}
                    className={`flex items-center gap-3 p-4 hover:bg-muted cursor-pointer border-b ${
                      selectedConversation.id === conversation.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {conversation.name.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center ${
                          channelColors[conversation.channel as keyof typeof channelColors]
                        }`}
                      >
                        <ChannelIcon className="h-2.5 w-2.5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{conversation.name}</span>
                        <span className="text-xs text-muted-foreground">{conversation.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>
                    {conversation.unread > 0 && (
                      <Badge className="bg-primary">{conversation.unread}</Badge>
                    )}
                  </div>
                );
              })}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col">
          {/* Chat Header */}
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedConversation.name.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedConversation.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge
                      className={channelColors[selectedConversation.channel as keyof typeof channelColors]}
                      variant="secondary"
                    >
                      {selectedConversation.channel}
                    </Badge>
                    <span>• Online</span>
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
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                          message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        <span>{message.time}</span>
                        {message.sender === 'user' && (
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
              <Input placeholder="Digite uma mensagem..." className="flex-1" />
              <Button variant="ghost" size="icon">
                <Smile className="h-4 w-4" />
              </Button>
              <Button size="icon">
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
                {selectedConversation.name.split(' ').map((n) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4">{selectedConversation.name}</CardTitle>
            <p className="text-sm text-muted-foreground">Tech Corp</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Informações</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>joao@techcorp.com</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>(11) 99999-1234</span>
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Lead Quente</Badge>
                <Badge variant="secondary">VIP</Badge>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Score</p>
              <div className="flex items-center gap-2">
                <Badge className="bg-primary">92</Badge>
                <span className="text-sm text-muted-foreground">Lead qualificado</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
