import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Headphones, MessageCircle, Ticket, Search, Send,
  FileText, Clock, CheckCircle2, AlertCircle, ChevronRight,
  HelpCircle, BookOpen, Zap, Shield, Mail, Phone,
  Loader2, Plus, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const faqItems = [
  { q: 'Como conectar meu WhatsApp?', a: 'Vá em Canais > WhatsApp e escolha o método de conexão (QR Code ou API Oficial).', category: 'whatsapp' },
  { q: 'Como criar uma automação?', a: 'Acesse Automações no menu lateral, clique em "Nova Automação" e configure o gatilho e as ações desejadas.', category: 'automação' },
  { q: 'Como importar contatos?', a: 'Na página de Contatos, clique em "Importar" e faça upload de um arquivo CSV com os dados.', category: 'contatos' },
  { q: 'Como configurar meu domínio de e-mail?', a: 'Vá em E-mail > Domínio e siga o assistente para configurar os registros DNS.', category: 'email' },
  { q: 'Como funciona o sistema de planos?', a: 'Acesse Planos no menu lateral para ver os recursos disponíveis e fazer upgrade.', category: 'planos' },
  { q: 'Como transferir um atendimento?', a: 'No SAC, abra a conversa e use o botão de transferência no painel lateral do contato.', category: 'sac' },
];

export default function SupportCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tickets, isLoading, createTicket } = useSupportTickets();
  const [openTicketDialog, setOpenTicketDialog] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketCategory, setTicketCategory] = useState('duvida');
  const [ticketPriority, setTicketPriority] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const filteredFaq = faqSearch
    ? faqItems.filter(f => f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.a.toLowerCase().includes(faqSearch.toLowerCase()))
    : faqItems;

  const myTickets = tickets?.filter(t => t.created_by === user?.id) ?? [];
  const openCount = myTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const resolvedCount = myTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  const handleCreateTicket = async () => {
    if (!ticketTitle.trim()) { toast.error('Informe o assunto'); return; }
    if (!ticketDescription.trim()) { toast.error('Descreva o problema'); return; }
    setIsSubmitting(true);
    try {
      createTicket.mutate({
        title: ticketTitle,
        description: ticketDescription,
        category: ticketCategory,
        priority: ticketPriority as any,
      }, {
        onSuccess: () => {
          toast.success('Ticket criado com sucesso! Nossa equipe entrará em contato.');
          setOpenTicketDialog(false);
          setTicketTitle('');
          setTicketDescription('');
          setTicketCategory('duvida');
          setTicketPriority('medium');
          setIsSubmitting(false);
        },
        onError: () => setIsSubmitting(false),
      });
    } catch {
      setIsSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      open: { label: 'Aberto', variant: 'destructive' },
      in_progress: { label: 'Em andamento', variant: 'default' },
      resolved: { label: 'Resolvido', variant: 'secondary' },
      closed: { label: 'Fechado', variant: 'outline' },
    };
    const s = map[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={s.variant} className="text-[10px]">{s.label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Headphones className="h-6 w-6 text-primary" />
            Central de Atendimento
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Precisa de ajuda? Abra um ticket ou fale com nossa equipe.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/inbox')}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Falar com Atendente
          </Button>
          <Button onClick={() => setOpenTicketDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Abrir Ticket
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => setOpenTicketDialog(true)}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <Ticket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Abrir Ticket</p>
              <p className="text-xs text-muted-foreground">Relatar problema ou dúvida</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => navigate('/inbox')}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Chat ao Vivo</p>
              <p className="text-xs text-muted-foreground">Falar com um atendente</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => navigate('/help-center')}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Base de Conhecimento</p>
              <p className="text-xs text-muted-foreground">Tutoriais e guias</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => navigate('/system-guide')}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Guia do Sistema</p>
              <p className="text-xs text-muted-foreground">Documentação completa</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="faq" className="w-full">
        <TabsList>
          <TabsTrigger value="faq" className="gap-1.5">
            <HelpCircle className="h-3.5 w-3.5" />
            Perguntas Frequentes
          </TabsTrigger>
          <TabsTrigger value="tickets" className="gap-1.5">
            <Ticket className="h-3.5 w-3.5" />
            Meus Tickets
            {openCount > 0 && (
              <span className="ml-1 bg-destructive text-destructive-foreground text-[10px] rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                {openCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Perguntas Frequentes</CardTitle>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar nas perguntas..."
                  className="pl-8 h-9 text-sm"
                  value={faqSearch}
                  onChange={e => setFaqSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {filteredFaq.length === 0 ? (
                  <div className="text-center py-8">
                    <HelpCircle className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma pergunta encontrada</p>
                    <Button variant="link" size="sm" className="mt-1" onClick={() => setOpenTicketDialog(true)}>
                      Abrir um ticket de suporte
                    </Button>
                  </div>
                ) : (
                  filteredFaq.map((faq, idx) => (
                    <div key={idx} className="border rounded-lg overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                        onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                      >
                        <span className="text-sm font-medium pr-4">{faq.q}</span>
                        <ChevronRight className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expandedFaq === idx ? 'rotate-90' : ''}`} />
                      </button>
                      {expandedFaq === idx && (
                        <div className="px-3 pb-3 text-sm text-muted-foreground border-t pt-3 bg-muted/30">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <Separator className="my-4" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Não encontrou o que procura?</p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setOpenTicketDialog(true)}>
                    <Ticket className="h-3.5 w-3.5 mr-1.5" />
                    Abrir Ticket
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/inbox')}>
                    <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                    Chat ao Vivo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Meus Tickets</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {openCount} aberto{openCount !== 1 ? 's' : ''} · {resolvedCount} resolvido{resolvedCount !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setOpenTicketDialog(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Novo Ticket
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : myTickets.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Você ainda não abriu nenhum ticket</p>
                  <Button variant="link" size="sm" className="mt-1" onClick={() => setOpenTicketDialog(true)}>
                    Abrir primeiro ticket
                  </Button>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2">
                    {myTickets.map(ticket => (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate('/support')}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="shrink-0">
                            {ticket.status === 'open' ? (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            ) : ticket.status === 'in_progress' ? (
                              <Clock className="h-4 w-4 text-primary" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{ticket.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground font-mono">{ticket.protocol_number}</span>
                              {statusBadge(ticket.status)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Horário de Atendimento - Destaque */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Horários */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Horário de Atendimento</h3>
                  <p className="text-xs text-muted-foreground">Suporte humano disponível nos horários abaixo</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60 border">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Chat & WhatsApp</p>
                    <p className="text-xs text-muted-foreground">Seg a Sex · 9h às 18h</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60 border">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">E-mail & Tickets</p>
                    <p className="text-xs text-muted-foreground">24h · Resposta em até 24h úteis</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60 border">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Suporte Prioritário</p>
                    <p className="text-xs text-muted-foreground">Plano Enterprise · 8h às 20h</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60 border">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Headphones className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Fins de Semana</p>
                    <p className="text-xs text-muted-foreground">Somente tickets · Resposta na segunda</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contato Rápido */}
            <div className="flex flex-col justify-center gap-3">
              <div className="p-4 rounded-xl bg-background/80 border space-y-3">
                <h4 className="font-semibold text-sm">Contato Direto</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    suporte@agsell.com.br
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    (11) 99999-9999
                  </div>
                </div>
                <Button size="sm" className="w-full" onClick={() => navigate('/inbox')}>
                  <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                  Iniciar Chat
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Ticket Dialog */}
      <Dialog open={openTicketDialog} onOpenChange={setOpenTicketDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Abrir Ticket de Suporte
            </DialogTitle>
            <DialogDescription>
              Descreva seu problema ou dúvida e nossa equipe responderá o mais breve possível.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm">Assunto *</Label>
              <Input
                placeholder="Ex: Erro ao enviar mensagem no WhatsApp"
                value={ticketTitle}
                onChange={e => setTicketTitle(e.target.value)}
                className="h-9"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Categoria</Label>
                <Select value={ticketCategory} onValueChange={setTicketCategory}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="duvida">Dúvida</SelectItem>
                    <SelectItem value="bug">Bug / Erro</SelectItem>
                    <SelectItem value="feature">Sugestão</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="integracao">Integração</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Prioridade</Label>
                <Select value={ticketPriority} onValueChange={setTicketPriority}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Descrição *</Label>
              <Textarea
                placeholder="Descreva detalhadamente o que está acontecendo..."
                value={ticketDescription}
                onChange={e => setTicketDescription(e.target.value)}
                rows={5}
                className="text-sm resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenTicketDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateTicket} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Send className="h-4 w-4 mr-2" />
              Enviar Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
