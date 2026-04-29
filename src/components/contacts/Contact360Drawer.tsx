import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Mail, Phone, MessageSquare, Building2, TrendingUp, Calendar,
  Sparkles, CheckCircle2, X, Clock, Briefcase, FileText, Tag as TagIcon, Loader2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Contact } from '@/hooks/useContacts';
import { ContactTagsManager } from './ContactTagsManager';
import { CustomFieldsRenderer } from './CustomFieldsRenderer';
import { useNextActions, useGenerateNextAction, useUpdateNextAction } from '@/hooks/useCRMIntelligence';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Contact360DrawerProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function useContactTimeline(contactId?: string) {
  return useQuery({
    queryKey: ['contact-timeline', contactId],
    queryFn: async () => {
      if (!contactId) return { messages: [], activities: [], deals: [], tasks: [] };
      const [{ data: convs }, { data: activities }, { data: deals }, { data: tasks }] = await Promise.all([
        supabase.from('conversations').select('id,channel').eq('contact_id', contactId),
        supabase.from('activities').select('id,type,description,created_at').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(20),
        supabase.from('deals').select('id,title,value,status,stage_id,created_at').eq('contact_id', contactId).order('created_at', { ascending: false }),
        supabase.from('tasks').select('id,title,status,due_date,created_at').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(10),
      ]);
      const convIds = (convs || []).map(c => c.id);
      let messages: any[] = [];
      if (convIds.length) {
        const { data: msgs } = await supabase.from('messages').select('id,content,sender_type,created_at,conversation_id,message_type').in('conversation_id', convIds).order('created_at', { ascending: false }).limit(30);
        const channelMap = new Map((convs || []).map(c => [c.id, c.channel]));
        messages = (msgs || []).map(m => ({ ...m, channel: channelMap.get(m.conversation_id) }));
      }
      return { messages, activities: activities || [], deals: deals || [], tasks: tasks || [] };
    },
    enabled: !!contactId,
  });
}

export function Contact360Drawer({ contact, open, onOpenChange }: Contact360DrawerProps) {
  const { data: timeline, isLoading } = useContactTimeline(contact?.id);
  const { data: nextActions } = useNextActions(contact?.id);
  const generateAction = useGenerateNextAction();
  const updateAction = useUpdateNextAction();

  if (!contact) return null;

  const initials = `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`.toUpperCase();
  const fullName = `${contact.first_name} ${contact.last_name || ''}`.trim();

  const channelIcon: Record<string, JSX.Element> = {
    whatsapp: <MessageSquare className="h-3 w-3 text-green-500" />,
    email: <Mail className="h-3 w-3 text-blue-500" />,
    sms: <MessageSquare className="h-3 w-3 text-orange-500" />,
    instagram: <MessageSquare className="h-3 w-3 text-pink-500" />,
  };

  const priorityColor: Record<string, string> = {
    urgent: 'bg-red-500/10 text-red-600 border-red-500/30',
    high: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    medium: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    low: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg truncate">{fullName}</SheetTitle>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                {contact.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{contact.email}</span>}
                {contact.whatsapp && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{contact.whatsapp}</span>}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[10px]">Score {contact.lead_score ?? 0}</Badge>
                {contact.status && <Badge variant="secondary" className="text-[10px]">{contact.status}</Badge>}
                {contact.source && <Badge variant="outline" className="text-[10px]">{contact.source}</Badge>}
              </div>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Next Best Action */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Próxima Ação Sugerida (IA)</h3>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => generateAction.mutate(contact.id)} disabled={generateAction.isPending}>
                    {generateAction.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    Gerar
                  </Button>
                </div>
                {nextActions && nextActions.length > 0 ? (
                  <div className="space-y-2">
                    {nextActions.slice(0, 2).map(a => (
                      <div key={a.id} className="p-3 rounded-md bg-background border">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Badge className={`text-[10px] ${priorityColor[a.priority]}`}>{a.priority}</Badge>
                              {a.channel && <Badge variant="outline" className="text-[10px]">{a.channel}</Badge>}
                            </div>
                            <p className="font-medium text-sm">{a.title}</p>
                            {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                            {a.reasoning && <p className="text-[11px] italic text-muted-foreground mt-2">💡 {a.reasoning}</p>}
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateAction.mutate({ id: a.id, status: 'done' })}>
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateAction.mutate({ id: a.id, status: 'dismissed' })}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Clique em "Gerar" para criar uma sugestão personalizada com base no histórico do contato.</p>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TagIcon className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Tags</h3>
              </div>
              <ContactTagsManager contactId={contact.id} />
            </div>

            <Separator />

            {/* Custom Fields */}
            <CustomFieldsRenderer entityType="contact" entityId={contact.id} />

            <Separator />

            {/* Tabs */}
            <Tabs defaultValue="timeline">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="timeline">Linha do tempo</TabsTrigger>
                <TabsTrigger value="deals">Deals ({timeline?.deals.length || 0})</TabsTrigger>
                <TabsTrigger value="tasks">Tarefas ({timeline?.tasks.length || 0})</TabsTrigger>
                <TabsTrigger value="info">Detalhes</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="mt-4 space-y-2">
                {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />}
                {!isLoading && timeline?.messages.length === 0 && timeline?.activities.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem atividades ainda</p>
                )}
                {timeline?.messages.slice(0, 15).map(m => (
                  <div key={m.id} className="flex gap-3 p-3 rounded-md bg-muted/40 hover:bg-muted/70 transition-colors">
                    <div className="mt-0.5">{channelIcon[m.channel] || <MessageSquare className="h-3 w-3" />}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                        <span>{m.sender_type === 'contact' ? '⬅️ recebida' : '➡️ enviada'}</span>
                        <span>·</span>
                        <span>{formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: ptBR })}</span>
                      </div>
                      <p className="text-sm line-clamp-2">{m.content || `[${m.message_type}]`}</p>
                    </div>
                  </div>
                ))}
                {timeline?.activities.slice(0, 5).map(a => (
                  <div key={a.id} className="flex gap-3 p-3 rounded-md bg-muted/20">
                    <Clock className="h-3 w-3 mt-1 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-muted-foreground">{a.type} · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}</p>
                      <p className="text-sm">{a.description}</p>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="deals" className="mt-4 space-y-2">
                {timeline?.deals.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sem deals associados</p>}
                {timeline?.deals.map(d => (
                  <Card key={d.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{d.title}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(d.created_at), 'dd/MM/yy')}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">R$ {Number(d.value || 0).toLocaleString('pt-BR')}</p>
                        <Badge variant={d.status === 'won' ? 'default' : d.status === 'lost' ? 'destructive' : 'outline'} className="text-[10px]">{d.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="tasks" className="mt-4 space-y-2">
                {timeline?.tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sem tarefas</p>}
                {timeline?.tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/40">
                    <CheckCircle2 className={`h-4 w-4 ${t.status === 'done' ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{t.title}</p>
                      {t.due_date && <p className="text-[11px] text-muted-foreground">Vence: {format(new Date(t.due_date), 'dd/MM/yy')}</p>}
                    </div>
                    <Badge variant="outline" className="text-[10px]">{t.status}</Badge>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="info" className="mt-4 space-y-3 text-sm">
                <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={contact.email} />
                <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Telefone" value={contact.phone} />
                <InfoRow icon={<MessageSquare className="h-3.5 w-3.5" />} label="WhatsApp" value={contact.whatsapp} />
                <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="Cargo" value={contact.position} />
                <InfoRow icon={<TrendingUp className="h-3.5 w-3.5" />} label="Origem" value={contact.source} />
                <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Cliente desde" value={format(new Date(contact.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} />
                {contact.notes && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1"><FileText className="h-3 w-3" /> Notas</div>
                    <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}
