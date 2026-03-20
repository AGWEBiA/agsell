import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
  Mail, Phone, MessageSquare, Tag, Clock, AlertTriangle, CheckCircle2,
  StickyNote, Zap, MoreVertical, UserCheck, ArrowRightLeft, Hash,
  Plus, Trash2, Copy,
} from 'lucide-react';
import { useConversationNotes } from '@/hooks/useConversationNotes';
import { SoftphoneTrigger } from '@/components/voip/Softphone';
import { useQuickReplies } from '@/hooks/useQuickReplies';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useSacAgents } from '@/hooks/useSacAgents';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContactInfoPanelProps {
  conversation: any;
  onUpdateConversation: (updates: Record<string, any>) => void;
  onTransfer: (userId: string | null) => void;
  onInsertQuickReply: (content: string) => void;
}

const priorities = [
  { value: 'low', label: 'Baixa', color: 'bg-muted text-muted-foreground' },
  { value: 'medium', label: 'Média', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  { value: 'urgent', label: 'Urgente', color: 'bg-destructive/10 text-destructive' },
];

const categories = [
  { value: 'question', label: 'Dúvida' },
  { value: 'complaint', label: 'Reclamação' },
  { value: 'praise', label: 'Elogio' },
  { value: 'request', label: 'Solicitação' },
  { value: 'technical', label: 'Técnico' },
  { value: 'billing', label: 'Financeiro' },
  { value: 'other', label: 'Outro' },
];

const statuses = [
  { value: 'open', label: 'Aberto', icon: MessageSquare },
  { value: 'pending', label: 'Pendente', icon: Clock },
  { value: 'resolved', label: 'Resolvido', icon: CheckCircle2 },
  { value: 'closed', label: 'Fechado', icon: CheckCircle2 },
];

export function ContactInfoPanel({
  conversation,
  onUpdateConversation,
  onTransfer,
  onInsertQuickReply,
}: ContactInfoPanelProps) {
  const { notes, addNote, deleteNote } = useConversationNotes(conversation?.id ?? null);
  const { replies } = useQuickReplies();
  const { members } = useOrganizationMembers();
  const { agents } = useSacAgents();
  const [noteInput, setNoteInput] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [transferOpen, setTransferOpen] = useState(false);

  if (!conversation) return null;

  const contact = conversation.contacts;
  const protocol = conversation.protocol_number || '—';
  const priority = priorities.find(p => p.value === (conversation.priority || 'medium'));
  const category = categories.find(c => c.value === conversation.category);

  const getInitials = (f?: string, l?: string | null) =>
    `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase() || '??';

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    addNote.mutate(noteInput.trim());
    setNoteInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 text-center border-b">
        <Avatar className="h-16 w-16 mx-auto">
          <AvatarFallback className="bg-primary/10 text-primary text-xl">
            {getInitials(contact?.first_name, contact?.last_name)}
          </AvatarFallback>
        </Avatar>
        <h3 className="font-semibold mt-2">
          {contact?.first_name} {contact?.last_name}
        </h3>
        <div className="flex items-center justify-center gap-1 mt-1">
          <Hash className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-mono">{protocol}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => {
              navigator.clipboard.writeText(protocol);
              toast.success('Protocolo copiado!');
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="info" className="text-xs flex-1">Info</TabsTrigger>
          <TabsTrigger value="ticket" className="text-xs flex-1">Ticket</TabsTrigger>
          <TabsTrigger value="notes" className="text-xs flex-1">Notas</TabsTrigger>
          <TabsTrigger value="replies" className="text-xs flex-1">Rápidas</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Info Tab */}
          <TabsContent value="info" className="p-4 space-y-4 mt-0">
            <div className="space-y-2 text-sm">
              {contact?.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{contact.email}</span>
                </div>
              )}
              {contact?.phone && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{contact.phone}</span>
                  </div>
                  <SoftphoneTrigger
                    contactPhone={contact.phone}
                    contactName={`${contact.first_name} ${contact.last_name || ''}`}
                    contactId={contact.id}
                  />
                </div>
              )}
              {contact?.whatsapp && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span>{contact.whatsapp}</span>
                </div>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Score do Lead</p>
              <Badge className={
                (contact?.lead_score ?? 0) >= 70
                  ? 'bg-green-600'
                  : (contact?.lead_score ?? 0) >= 40
                    ? 'bg-yellow-600'
                    : 'bg-muted text-muted-foreground'
              }>
                {contact?.lead_score ?? 0}
              </Badge>
            </div>
            <Separator />
            {/* Transfer */}
            <div>
              <p className="text-sm font-medium mb-2">Atribuído a</p>
              <Select
                value={conversation.assigned_to || 'unassigned'}
                onValueChange={(v) => onTransfer(v === 'unassigned' ? null : v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <UserCheck className="h-3.5 w-3.5 mr-1" />
                  <SelectValue placeholder="Ninguém" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Não atribuído</SelectItem>
                  {members.map(m => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {(m as any).profiles?.full_name || m.user_id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setTransferOpen(true)}
            >
              <ArrowRightLeft className="h-3.5 w-3.5 mr-2" />
              Transferir Atendimento
            </Button>
          </TabsContent>

          {/* Ticket Tab */}
          <TabsContent value="ticket" className="p-4 space-y-4 mt-0">
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Status</Label>
                <Select
                  value={conversation.status || 'open'}
                  onValueChange={(v) => {
                    const updates: Record<string, any> = { status: v };
                    if (v === 'resolved') updates.resolved_at = new Date().toISOString();
                    onUpdateConversation(updates);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        <div className="flex items-center gap-2">
                          <s.icon className="h-3.5 w-3.5" />
                          {s.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Prioridade</Label>
                <Select
                  value={conversation.priority || 'medium'}
                  onValueChange={(v) => onUpdateConversation({ priority: v })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        <Badge className={`${p.color} text-xs`}>{p.label}</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select
                  value={conversation.category || ''}
                  onValueChange={(v) => onUpdateConversation({ category: v })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue placeholder="Sem categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Criado em</span>
                <span>{format(new Date(conversation.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
              </div>
              {conversation.first_response_at && (
                <div className="flex justify-between">
                  <span>1ª Resposta</span>
                  <span>{format(new Date(conversation.first_response_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                </div>
              )}
              {conversation.resolved_at && (
                <div className="flex justify-between">
                  <span>Resolvido em</span>
                  <span>{format(new Date(conversation.resolved_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="p-4 space-y-3 mt-0">
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar nota interna..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                className="text-xs h-8"
              />
              <Button size="sm" className="h-8 shrink-0" onClick={handleAddNote} disabled={addNote.isPending}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            {notes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma nota</p>
            ) : (
              <div className="space-y-2">
                {notes.map(note => (
                  <div key={note.id} className="p-2 rounded-md bg-muted/50 text-xs group relative">
                    <p>{note.content}</p>
                    <p className="text-muted-foreground mt-1">
                      {format(new Date(note.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                      onClick={() => deleteNote.mutate(note.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Quick Replies Tab */}
          <TabsContent value="replies" className="p-4 space-y-2 mt-0">
            {replies.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhuma resposta rápida cadastrada. Configure em Configurações do SAC.
              </p>
            ) : (
              replies.map(reply => (
                <div
                  key={reply.id}
                  className="p-2 rounded-md border hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => onInsertQuickReply(reply.content)}
                >
                  <p className="text-xs font-medium">{reply.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{reply.content}</p>
                  {reply.shortcut && (
                    <Badge variant="outline" className="text-[10px] mt-1">/{reply.shortcut}</Badge>
                  )}
                </div>
              ))
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Transferir Atendimento</DialogTitle>
            <DialogDescription>Escolha o membro ou departamento para receber este ticket.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-sm">Membros da equipe</Label>
            <div className="space-y-1">
              {members.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">Nenhum membro encontrado</p>
              ) : (
                members.map(m => (
                  <Button
                    key={m.user_id}
                    variant="ghost"
                    className="w-full justify-start text-sm h-9"
                    onClick={() => {
                      onUpdateConversation({ assigned_to: m.user_id, status: 'open' });
                      setTransferOpen(false);
                      toast.success('Atendimento transferido!');
                    }}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    {(m as any).profiles?.full_name || m.user_id.slice(0, 8)}
                    <Badge variant="outline" className="ml-auto text-[10px]">{m.role}</Badge>
                  </Button>
                ))
              )}
            </div>
            {agents.length > 0 && (
              <>
                <Separator />
                <Label className="text-sm">Atendentes SAC</Label>
                <div className="space-y-1">
                  {agents.filter(a => a.is_active).map(a => (
                    <Button
                      key={a.id}
                      variant="ghost"
                      className="w-full justify-start text-sm h-9"
                      onClick={() => {
                        // SAC agents have a user_id if linked to a member
                        const agentUserId = (a as any).user_id;
                        if (agentUserId) {
                          onUpdateConversation({ assigned_to: agentUserId, status: 'open' });
                          setTransferOpen(false);
                          toast.success(`Transferido para ${a.name}!`);
                        } else {
                          toast.error('Este atendente não possui um usuário vinculado');
                        }
                      }}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      {a.name}
                      {a.department && <Badge variant="secondary" className="ml-auto text-[10px]">{a.department}</Badge>}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
