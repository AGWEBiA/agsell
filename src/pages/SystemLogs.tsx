import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, RefreshCw, AlertCircle, Info, ShieldAlert, Bug, 
  ExternalLink, ChevronLeft, ChevronRight, Activity, Terminal
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';

export default function SystemLogs() {
  const { currentOrganization } = useOrganization();
  const [level, setLevel] = useState<string>('all');
  const [source, setSource] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['system-logs', currentOrganization?.id, level, source, search, page],
    queryFn: async () => {
      let query = supabase
        .from('system_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (level !== 'all') {
        query = query.eq('level', level);
      }
      if (source) {
        query = query.ilike('source', `%${source}%`);
      }
      if (search) {
        query = query.or(`message.ilike.%${search}%,event.ilike.%${search}%`);
      }
      if (currentOrganization?.id) {
        query = query.eq('organization_id', currentOrganization.id);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data, count };
    },
    enabled: !!currentOrganization?.id,
  });

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'error': return <Badge variant="destructive" className="gap-1"><ShieldAlert className="h-3 w-3" /> Erro</Badge>;
      case 'warning': return <Badge variant="outline" className="text-amber-600 border-amber-600 gap-1 bg-amber-50"><AlertCircle className="h-3 w-3" /> Aviso</Badge>;
      case 'debug': return <Badge variant="secondary" className="gap-1 font-mono"><Bug className="h-3 w-3" /> Debug</Badge>;
      default: return <Badge variant="outline" className="text-blue-600 border-blue-600 gap-1 bg-blue-50"><Info className="h-3 w-3" /> Info</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Terminal className="h-8 w-8 text-primary" />
            Logs do Sistema
          </h1>
          <p className="text-muted-foreground">Monitore a execução de webhooks, automações e eventos do core.</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Nível</label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os níveis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os níveis</SelectItem>
                  <SelectItem value="info">Informação</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Origem</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Ex: webhook-kiwify" 
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Busca</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar na mensagem ou evento..." 
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2 flex flex-col justify-end">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSource('kiwify')} className="text-[10px] h-7 px-2">Kiwify</Button>
                <Button variant="outline" size="sm" onClick={() => setSource('wa-sync')} className="text-[10px] h-7 px-2">WhatsApp</Button>
                <Button variant="outline" size="sm" onClick={() => {setSource(''); setLevel('all'); setSearch('');}} className="text-[10px] h-7 px-2">Limpar</Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Data</TableHead>
                  <TableHead className="w-[100px]">Nível</TableHead>
                  <TableHead className="w-[150px]">Origem</TableHead>
                  <TableHead className="w-[150px]">Evento</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Carregando logs...</TableCell>
                  </TableRow>
                ) : logs?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Nenhum log encontrado.</TableCell>
                  </TableRow>
                ) : (
                  logs?.data?.map((log) => (
                    <TableRow key={log.id} className="text-sm">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{getLevelBadge(log.level)}</TableCell>
                      <TableCell className="font-medium text-xs">{log.source}</TableCell>
                      <TableCell className="text-xs">{log.event}</TableCell>
                      <TableCell className="max-w-md truncate" title={log.message}>
                        {log.message}
                      </TableCell>
                      <TableCell>
                        {log.payload && (
                          <Button variant="ghost" size="icon" onClick={() => console.log(log.payload)}>
                            <Activity className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {logs?.data?.length || 0} de {logs?.count || 0} logs
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!logs?.count || (page + 1) * pageSize >= logs.count}
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
