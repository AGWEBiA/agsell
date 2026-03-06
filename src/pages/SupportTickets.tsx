import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Plus, Search, Ticket, Clock, CheckCircle2, AlertTriangle, BarChart3,
  Hash, Trash2, StickyNote, ChevronRight, ArrowLeft, UserCheck, Link as LinkIcon,
  Send, MessageSquareReply,
} from 'lucide-react';
import { useSupportTickets, useSupportTicketNotes, SupportTicket } from '@/hooks/useSupportTickets';
import { useTicketReplies } from '@/hooks/useTicketReplies';
import { useContacts } from '@/hooks/useContacts';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const priorities = [
  { value: 'low', label: 'Baixa', color: 'bg-muted text-muted-foreground' },
  { value: 'medium', label: 'Média', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  { value: 'urgent', label: 'Urgente', color: 'bg-destructive/10 text-destructive' },
];

const statuses = [
  { value: 'open', label: 'Aberto', icon: Ticket, color: 'text-blue-600' },
  { value: 'in_progress', label: 'Em Andamento', icon: Clock, color: 'text-yellow-600' },
  { value: 'waiting_customer', label: 'Aguardando Cliente', icon: Clock, color: 'text-orange-600' },
  { value: 'resolved', label: 'Resolvido', icon: CheckCircle2, color: 'text-green-600' },
  { value: 'closed', label: 'Fechado', icon: CheckCircle2, color: 'text-muted-foreground' },
];

const categories = [
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Funcionalidade' },
  { value: 'billing', label: 'Financeiro' },
  { value: 'technical', label: 'Técnico' },
  { value: 'question', label: 'Dúvida' },
  { value: 'other', label: 'Outro' },
];

export default function SupportTickets() {
  const { tickets, isLoading, createTicket, updateTicket, deleteTicket } = useSupportTickets();
  const { data: contacts = [] } = useContacts();
  const { members } = useOrganizationMembers();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newCategory, setNewCategory] = useState('');
  const [newContactId, setNewContactId] = useState('');
  const [newSlaHours, setNewSlaHours] = useState('24');

  const filteredTickets = tickets.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return t.title.toLowerCase().includes(s) ||
        t.protocol_number.toLowerCase().includes(s) ||
        t.contacts?.first_name?.toLowerCase().includes(s) ||
        t.description?.toLowerCase().includes(s);
    }
    return true;
  });

  // Dashboard metrics
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const slaBreached = tickets.filter(t => {
    if (t.status === 'resolved' || t.status === 'closed') return false;
    return t.sla_deadline_at && new Date(t.sla_deadline_at) < new Date();
  }).length;

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createTicket.mutate({
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      priority: newPriority,
      category: newCategory || undefined,
      contact_id: newContactId || undefined,
      sla_hours: parseInt(newSlaHours) || 24,
    }, {
      onSuccess: () => {
        setCreateOpen(false);
        setNewTitle(''); setNewDesc(''); setNewPriority('medium'); setNewCategory(''); setNewContactId(''); setNewSlaHours('24');
      },
    });
  };

  if (selectedTicket) {
    return (
      <TicketDetailView
        ticket={selectedTicket}
        tickets={tickets}
        members={members}
        onBack={() => setSelectedTicket(null)}
        onUpdate={(updates) => updateTicket.mutate({ id: selectedTicket.id, ...updates }, {
          onSuccess: () => {
            const updated = { ...selectedTicket, ...updates };
            setSelectedTicket(updated as SupportTicket);
          },
        })}
        onDelete={() => { deleteTicket.mutate(selectedTicket.id); setSelectedTicket(null); }}
        onCreateSubTicket={(title) => createTicket.mutate({
          title,
          parent_ticket_id: selectedTicket.id,
          contact_id: selectedTicket.contact_id,
          priority: selectedTicket.priority,
        })}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suporte</h1>
          <p className="text-muted-foreground mt-1">Gerencie tickets de suporte independentes do SAC</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Ticket
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4">
          <div className="text-2xl font-bold text-blue-600">{openCount}</div>
          <p className="text-xs text-muted-foreground">Abertos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-2xl font-bold text-yellow-600">{inProgressCount}</div>
          <p className="text-xs text-muted-foreground">Em Andamento</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-2xl font-bold text-green-600">{resolvedCount}</div>
          <p className="text-xs text-muted-foreground">Resolvidos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-2xl font-bold text-destructive">{slaBreached}</div>
          <p className="text-xs text-muted-foreground">SLA Estourado</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar tickets..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
            <TabsTrigger value="open" className="text-xs">Abertos</TabsTrigger>
            <TabsTrigger value="in_progress" className="text-xs">Andamento</TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs">Resolvidos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Ticket List */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : filteredTickets.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhum ticket encontrado</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filteredTickets.map(ticket => {
            const priority = priorities.find(p => p.value === ticket.priority);
            const status = statuses.find(s => s.value === ticket.status);
            const StatusIcon = status?.icon || Ticket;
            const isSlaBreached = ticket.sla_deadline_at && new Date(ticket.sla_deadline_at) < new Date() && ticket.status !== 'resolved' && ticket.status !== 'closed';
            return (
              <Card key={ticket.id} className="hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelectedTicket(ticket)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`h-5 w-5 shrink-0 ${status?.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{ticket.title}</span>
                        {isSlaBreached && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground font-mono">{ticket.protocol_number}</span>
                        {ticket.contacts && (
                          <span className="text-xs text-muted-foreground">• {ticket.contacts.first_name} {ticket.contacts.last_name}</span>
                        )}
                        {ticket.sub_tickets && ticket.sub_tickets.length > 0 && (
                          <Badge variant="outline" className="text-[10px]">{ticket.sub_tickets.length} sub</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-[10px] ${priority?.color}`}>{priority?.label}</Badge>
                      {ticket.assigned_profile && (
                        <Badge variant="outline" className="text-[10px]">{ticket.assigned_profile.full_name}</Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(ticket.created_at), 'dd/MM', { locale: ptBR })}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Ticket de Suporte</DialogTitle>
            <DialogDescription>Crie um ticket independente do SAC</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-sm">Título *</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Descreva o problema..." />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Descrição</Label>
              <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Detalhes do ticket..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">Prioridade</Label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {priorities.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Categoria</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">Contato</Label>
                <Select value={newContactId} onValueChange={setNewContactId}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    {contacts.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">SLA (horas)</Label>
                <Input type="number" value={newSlaHours} onChange={e => setNewSlaHours(e.target.value)} min="1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createTicket.isPending || !newTitle.trim()}>Criar Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Ticket Detail View Component
function TicketDetailView({ ticket, tickets, members, onBack, onUpdate, onDelete, onCreateSubTicket }: {
  ticket: SupportTicket;
  tickets: SupportTicket[];
  members: any[];
  onBack: () => void;
  onUpdate: (updates: Record<string, any>) => void;
  onDelete: () => void;
  onCreateSubTicket: (title: string) => void;
}) {
  const { notes, addNote, deleteNote } = useSupportTicketNotes(ticket.id);
  const { replies, sendReply, deleteReply } = useTicketReplies(ticket.id);
  const [noteInput, setNoteInput] = useState('');
  const [replyInput, setReplyInput] = useState('');
  const [subTicketTitle, setSubTicketTitle] = useState('');
  const [showSubForm, setShowSubForm] = useState(false);

  const priority = priorities.find(p => p.value === ticket.priority);
  const status = statuses.find(s => s.value === ticket.status);
  const isSlaBreached = ticket.sla_deadline_at && new Date(ticket.sla_deadline_at) < new Date() && ticket.status !== 'resolved' && ticket.status !== 'closed';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{ticket.title}</h1>
            {isSlaBreached && <Badge variant="destructive" className="text-[10px]">SLA Estourado</Badge>}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Hash className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-mono">{ticket.protocol_number}</span>
            {ticket.conversation_id && (
              <Badge variant="outline" className="text-[10px] gap-1"><LinkIcon className="h-2.5 w-2.5" />Vinculado ao SAC</Badge>
            )}
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={onDelete}><Trash2 className="h-3.5 w-3.5 mr-1" />Excluir</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {ticket.description && (
            <Card><CardContent className="pt-4">
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
            </CardContent></Card>
          )}

          {/* Notes / History */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><StickyNote className="h-4 w-4" />Histórico & Notas</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar nota..."
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && noteInput.trim()) {
                      addNote.mutate(noteInput.trim());
                      setNoteInput('');
                    }
                  }}
                  className="text-sm h-9"
                />
                <Button size="sm" className="h-9" disabled={addNote.isPending || !noteInput.trim()} onClick={() => {
                  addNote.mutate(noteInput.trim());
                  setNoteInput('');
                }}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <ScrollArea className="max-h-80">
                {notes.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Nenhuma nota ainda</p>
                ) : (
                  <div className="space-y-2">
                    {notes.map(note => (
                      <div key={note.id} className="p-3 rounded-md bg-muted/50 text-sm group relative">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-xs">{note.profile_name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(note.created_at), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-xs">{note.content}</p>
                        <Button
                          variant="ghost" size="icon"
                          className="h-5 w-5 absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                          onClick={() => deleteNote.mutate(note.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Replies to requester */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><MessageSquareReply className="h-4 w-4" />Respostas ao Solicitante</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="space-y-2">
                <Textarea
                  placeholder="Escreva sua resposta para o solicitante..."
                  value={replyInput}
                  onChange={e => setReplyInput(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    disabled={sendReply.isPending || !replyInput.trim()}
                    onClick={() => {
                      sendReply.mutate({ content: replyInput.trim() });
                      setReplyInput('');
                    }}
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Enviar Resposta
                  </Button>
                </div>
              </div>
              <ScrollArea className="max-h-80">
                {replies.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Nenhuma resposta enviada</p>
                ) : (
                  <div className="space-y-2">
                    {replies.map(reply => (
                      <div key={reply.id} className="p-3 rounded-md border bg-primary/5 text-sm group relative">
                        <div className="flex items-center gap-2 mb-1">
                          <Send className="h-3 w-3 text-primary" />
                          <span className="font-medium text-xs">{reply.profile_name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(reply.created_at), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-xs whitespace-pre-wrap">{reply.content}</p>
                        <Button
                          variant="ghost" size="icon"
                          className="h-5 w-5 absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                          onClick={() => deleteReply.mutate(reply.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Sub-tickets */}
          <Card>
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Sub-tickets</CardTitle>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowSubForm(!showSubForm)}>
                  <Plus className="h-3 w-3 mr-1" />Sub-ticket
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {showSubForm && (
                <div className="flex gap-2 mb-3">
                  <Input placeholder="Título do sub-ticket..." value={subTicketTitle} onChange={e => setSubTicketTitle(e.target.value)} className="text-sm h-8" />
                  <Button size="sm" className="h-8" onClick={() => {
                    if (subTicketTitle.trim()) { onCreateSubTicket(subTicketTitle.trim()); setSubTicketTitle(''); setShowSubForm(false); }
                  }}>Criar</Button>
                </div>
              )}
              {(!ticket.sub_tickets || ticket.sub_tickets.length === 0) ? (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum sub-ticket</p>
              ) : (
                <div className="space-y-1">
                  {ticket.sub_tickets.map(st => {
                    const stStatus = statuses.find(s => s.value === st.status);
                    const StIcon = stStatus?.icon || Ticket;
                    return (
                      <div key={st.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 text-sm">
                        <StIcon className={`h-4 w-4 ${stStatus?.color}`} />
                        <span className="flex-1 truncate">{st.title}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{st.protocol_number}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={ticket.status} onValueChange={v => onUpdate({ status: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Prioridade</Label>
                <Select value={ticket.priority} onValueChange={v => onUpdate({ priority: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {priorities.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Categoria</Label>
                <Select value={ticket.category || ''} onValueChange={v => onUpdate({ category: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Sem categoria" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Atribuído a</Label>
                <Select value={ticket.assigned_to || 'unassigned'} onValueChange={v => onUpdate({ assigned_to: v === 'unassigned' ? null : v })}>
                  <SelectTrigger className="h-8 text-xs"><UserCheck className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Não atribuído</SelectItem>
                    {members.map((m: any) => (
                      <SelectItem key={m.user_id} value={m.user_id}>{(m as any).profiles?.full_name || m.user_id.slice(0, 8)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Criado em</span>
                  <span>{format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                </div>
                {ticket.sla_deadline_at && (
                  <div className="flex justify-between">
                    <span>Prazo SLA</span>
                    <span className={isSlaBreached ? 'text-destructive font-medium' : ''}>
                      {format(new Date(ticket.sla_deadline_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                )}
                {ticket.resolved_at && (
                  <div className="flex justify-between">
                    <span>Resolvido em</span>
                    <span>{format(new Date(ticket.resolved_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                  </div>
                )}
              </div>
              {ticket.contacts && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-xs">Contato</Label>
                    <p className="text-sm font-medium mt-1">{ticket.contacts.first_name} {ticket.contacts.last_name}</p>
                    {ticket.contacts.email && <p className="text-xs text-muted-foreground">{ticket.contacts.email}</p>}
                    {ticket.contacts.phone && <p className="text-xs text-muted-foreground">{ticket.contacts.phone}</p>}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
