import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Search, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle,
  UserCheck, UserX, Eye, ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type AuditRow = {
  id: string;
  source: string;
  event_type: string;
  processed: boolean;
  processed_at: string | null;
  error_message: string | null;
  created_at: string;
  customer_email: string | null;
  customer_name: string | null;
  order_id: string | null;
  order_status: string | null;
  product_name: string | null;
  user_exists: boolean;
  user_id: string | null;
  organization_id: string | null;
  organization_name: string | null;
  has_active_subscription: boolean;
};

const ENV_LABEL = (() => {
  if (typeof window === 'undefined') return 'Desconhecido';
  const host = window.location.hostname;
  if (host.includes('lovable.app') && host.includes('preview')) return 'Test (Preview)';
  if (host.includes('lovable.app')) return 'Live (Produção)';
  if (host.includes('agsell.com.br')) return 'Live (Produção)';
  return 'Local/Dev';
})();

const ENV_VARIANT: 'default' | 'secondary' | 'destructive' =
  ENV_LABEL.startsWith('Live') ? 'default' : 'secondary';

export function WebhookAuditDashboard() {
  const [emailFilter, setEmailFilter] = useState('');
  const [emailQuery, setEmailQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<AuditRow | null>(null);

  const { data: rows, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['webhook-audit', emailQuery, sourceFilter, statusFilter],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_audit_webhook_events', {
        _email: emailQuery || null,
        _source: sourceFilter === 'all' ? null : sourceFilter,
        _processed_filter: statusFilter,
        _limit: 200,
      });
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },
  });

  const handleSearch = () => setEmailQuery(emailFilter.trim().toLowerCase());

  const stats = React.useMemo(() => {
    if (!rows) return { total: 0, processed: 0, errors: 0, pending: 0, usersCreated: 0 };
    return {
      total: rows.length,
      processed: rows.filter(r => r.processed && !r.error_message).length,
      errors: rows.filter(r => !!r.error_message).length,
      pending: rows.filter(r => !r.processed).length,
      usersCreated: rows.filter(r => r.user_exists).length,
    };
  }, [rows]);

  const renderStatus = (r: AuditRow) => {
    if (r.error_message) {
      const skipped = r.error_message.toLowerCase().includes('skipped');
      return (
        <Badge variant={skipped ? 'secondary' : 'destructive'} className="gap-1">
          {skipped ? <AlertTriangle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {skipped ? 'Ignorado' : 'Erro'}
        </Badge>
      );
    }
    if (r.processed) {
      return (
        <Badge variant="default" className="gap-1 bg-emerald-600 hover:bg-emerald-700">
          <CheckCircle2 className="h-3 w-3" /> Processado
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" /> Pendente
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Auditoria de Webhooks
              </CardTitle>
              <CardDescription>
                Investigue eventos de pagamento por email do cliente. Mostra se o usuário
                foi efetivamente criado <strong>neste ambiente</strong>.
              </CardDescription>
            </div>
            <Badge variant={ENV_VARIANT} className="text-xs">
              Ambiente: {ENV_LABEL}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-5 space-y-1.5">
              <Label htmlFor="email">Email do cliente</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  placeholder="cliente@exemplo.com"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} variant="default">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="md:col-span-3 space-y-1.5">
              <Label>Fonte</Label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="kiwify">Kiwify</SelectItem>
                  
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3 space-y-1.5">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="processed">Processados</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="error">Com erro/ignorados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1 flex items-end">
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
                title="Atualizar"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="Eventos" value={stats.total} />
            <StatCard label="Processados" value={stats.processed} variant="success" />
            <StatCard label="Pendentes" value={stats.pending} variant="warning" />
            <StatCard label="Erros/Ignorados" value={stats.errors} variant="danger" />
            <StatCard label="Usuários criados" value={stats.usersCreated} variant="info" />
          </div>

          {/* Table */}
          <ScrollArea className="h-[520px] border rounded-md">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Fonte / Evento</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usuário criado?</TableHead>
                  <TableHead>Organização</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows && rows.length > 0 ? (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(r.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.customer_email || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium capitalize">{r.source}</div>
                        <div className="text-muted-foreground">{r.event_type}</div>
                      </TableCell>
                      <TableCell className="text-xs max-w-[180px] truncate" title={r.product_name || ''}>
                        {r.product_name || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>{renderStatus(r)}</TableCell>
                      <TableCell>
                        {r.user_exists ? (
                          <Badge variant="default" className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                            <UserCheck className="h-3 w-3" /> Sim
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <UserX className="h-3 w-3" /> Não
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs max-w-[160px] truncate" title={r.organization_name || ''}>
                        {r.organization_name || <span className="text-muted-foreground">—</span>}
                        {r.has_active_subscription && (
                          <Badge variant="outline" className="ml-1 text-[10px] py-0">ativa</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelected(r)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhum evento encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Webhook</DialogTitle>
            <DialogDescription>
              {selected?.source} — {selected?.event_type}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <DetailRow label="Email" value={selected.customer_email} />
              <DetailRow label="Nome" value={selected.customer_name} />
              <DetailRow label="Order ID" value={selected.order_id} />
              <DetailRow label="Order status" value={selected.order_status} />
              <DetailRow label="Produto" value={selected.product_name} />
              <DetailRow
                label="Recebido em"
                value={format(new Date(selected.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
              />
              {selected.processed_at && (
                <DetailRow
                  label="Processado em"
                  value={format(new Date(selected.processed_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                />
              )}
              {selected.error_message && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3">
                  <div className="font-medium text-destructive mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" /> Mensagem
                  </div>
                  <code className="text-xs">{selected.error_message}</code>
                </div>
              )}
              <div className="rounded-md bg-muted p-3 space-y-1">
                <div className="font-medium mb-1">Provisionamento neste ambiente ({ENV_LABEL})</div>
                <div className="flex items-center gap-2 text-xs">
                  {selected.user_exists ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  Usuário {selected.user_exists ? 'existe' : 'NÃO existe'} em auth.users
                </div>
                {selected.organization_name && (
                  <div className="text-xs text-muted-foreground">
                    Organização: <strong>{selected.organization_name}</strong>
                  </div>
                )}
                {selected.user_id && (
                  <div className="text-xs text-muted-foreground font-mono break-all">
                    user_id: {selected.user_id}
                  </div>
                )}
              </div>
              <DetailRow label="ID do evento" value={selected.id} mono />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label, value, variant = 'default',
}: { label: string; value: number; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) {
  const colorMap = {
    default: 'text-foreground',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-destructive',
    info: 'text-primary',
  };
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold ${colorMap[variant]}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="text-muted-foreground">{label}</div>
      <div className={`col-span-2 ${mono ? 'font-mono text-xs break-all' : ''}`}>
        {value || <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}
