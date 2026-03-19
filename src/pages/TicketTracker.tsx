import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Ticket, Search, Hash, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logoRed from '@/assets/agsell-logo-red.png';

const statuses: Record<string, { label: string; color: string; icon: typeof Ticket }> = {
  open: { label: 'Aberto', color: 'bg-blue-100 text-blue-800', icon: Ticket },
  in_progress: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  waiting_customer: { label: 'Aguardando Retorno', color: 'bg-orange-100 text-orange-800', icon: Clock },
  resolved: { label: 'Resolvido', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  closed: { label: 'Fechado', color: 'bg-muted text-muted-foreground', icon: CheckCircle2 },
};

const priorities: Record<string, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente',
};

export default function TicketTracker() {
  const [protocol, setProtocol] = useState('');
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!protocol.trim()) return;
    setLoading(true);
    setError('');
    setTicket(null);

    const { data, error: err } = await supabase
      .rpc('get_ticket_by_protocol', { _protocol: protocol.trim().toUpperCase() })
      .maybeSingle();

    setLoading(false);
    if (err || !data) {
      setError('Ticket não encontrado. Verifique o número do protocolo.');
    } else {
      setTicket(data);
    }
  };

  const st = ticket ? statuses[ticket.status] || statuses.open : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img src={logoRed} alt="AG Sell" className="h-10 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Acompanhar Ticket</h1>
          <p className="text-muted-foreground text-sm mt-1">Digite o número do protocolo para verificar o status</p>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="SUP-20260306-XXXXX"
              className="pl-9 font-mono"
              value={protocol}
              onChange={e => setProtocol(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <Card className="border-destructive/50">
            <CardContent className="pt-4 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-2" />
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {ticket && st && (
          <Card className="animate-fade-in">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <st.icon className="h-5 w-5" />
                <CardTitle className="text-base">{ticket.title}</CardTitle>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{ticket.protocol_number}</span>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={st.color}>{st.label}</Badge>
                <Badge variant="outline">{priorities[ticket.priority] || ticket.priority}</Badge>
                {ticket.category && <Badge variant="secondary">{ticket.category}</Badge>}
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aberto em</span>
                  <span>{format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                </div>
                {ticket.sla_deadline_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Previsão de resolução</span>
                    <span>{format(new Date(ticket.sla_deadline_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                )}
                {ticket.resolved_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resolvido em</span>
                    <span className="text-green-600 font-medium">{format(new Date(ticket.resolved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
