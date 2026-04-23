import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Inbox, Plus, Search, Loader2, MessageSquareDashed, Sparkles } from 'lucide-react';
import { useSacLeadsWithoutDeal, type SacLead } from '@/hooks/useSacLeads';
import { useCreateDeal } from '@/hooks/usePipeline';
import { DealSourceBadge } from './DealSourceBadge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SacLeadsPanelProps {
  defaultStageId?: string;
}

export function SacLeadsPanel({ defaultStageId }: SacLeadsPanelProps) {
  const [search, setSearch] = useState('');
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const { data: leads = [], isLoading, refetch } = useSacLeadsWithoutDeal(30);
  const createDeal = useCreateDeal();

  const filtered = leads.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.first_name?.toLowerCase().includes(q) ||
      l.last_name?.toLowerCase().includes(q) ||
      l.phone?.includes(q) ||
      l.whatsapp?.includes(q) ||
      l.last_message_content?.toLowerCase().includes(q)
    );
  });

  const handleCreate = async (lead: SacLead) => {
    setCreatingId(lead.contact_id);
    try {
      await createDeal.mutateAsync({
        title: `${lead.first_name} ${lead.last_name || ''}`.trim() + ' — SAC',
        contact_id: lead.contact_id,
        stage_id: defaultStageId,
        value: 0,
      });
      await refetch();
    } finally {
      setCreatingId(null);
    }
  };

  const getInitials = (l: SacLead) =>
    `${l.first_name?.[0] || ''}${l.last_name?.[0] || ''}`.toUpperCase() || '??';

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Inbox className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Leads do SAC sem deal
                <Badge variant="secondary">{leads.length}</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Contatos atendidos no SAC que ainda não viraram oportunidade
              </p>
            </div>
          </div>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar lead, mensagem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm">Carregando leads do SAC...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <MessageSquareDashed className="h-8 w-8 mx-auto mb-2 opacity-50" />
            {search ? 'Nenhum lead encontrado para a busca.' : 'Todos os leads do SAC já estão no pipeline! 🎉'}
          </div>
        ) : (
          <ScrollArea className="max-h-[320px]">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pr-3">
              {filtered.map((lead) => {
                const fullName = `${lead.first_name} ${lead.last_name || ''}`.trim();
                const isCreating = creatingId === lead.contact_id;
                return (
                  <div
                    key={lead.contact_id}
                    className="rounded-lg border bg-card p-3 hover:border-primary/50 transition-colors flex flex-col gap-2"
                  >
                    <div className="flex items-start gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[11px] bg-primary/10 text-primary">
                          {getInitials(lead)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{fullName || 'Sem nome'}</p>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          <DealSourceBadge source={lead.source} channel={lead.channel} />
                          {(lead.lead_score ?? 0) > 0 && (
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <Sparkles className="h-2.5 w-2.5" />
                              {lead.lead_score}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {lead.last_message_content && (
                      <p className="text-xs text-muted-foreground line-clamp-2 italic border-l-2 border-primary/30 pl-2">
                        "{lead.last_message_content}"
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 mt-auto">
                      <span className="text-[10px] text-muted-foreground">
                        {lead.last_message_at
                          ? formatDistanceToNow(new Date(lead.last_message_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })
                          : '—'}
                      </span>
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs"
                        onClick={() => handleCreate(lead)}
                        disabled={isCreating || createDeal.isPending}
                      >
                        {isCreating ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-3 w-3 mr-1" />
                            Criar deal
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
