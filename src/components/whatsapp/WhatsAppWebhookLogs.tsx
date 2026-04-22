import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowRight, AlertTriangle, CheckCircle2, XCircle, RefreshCw, Phone, Server, MessageSquare,
} from 'lucide-react';

const statusConfig: Record<string, { icon: React.ReactNode; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  routed: { icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />, label: 'Roteado', variant: 'default' },
  discarded: { icon: <XCircle className="h-3.5 w-3.5 text-muted-foreground" />, label: 'Descartado', variant: 'secondary' },
  unknown_instance: { icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />, label: 'Instância Desconhecida', variant: 'destructive' },
};

export function WhatsAppWebhookLogs() {
  const { currentOrganization } = useOrganization();
  const { isAdmin } = useAuth();
  const orgId = currentOrganization?.id;

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-webhook-logs', orgId],
    queryFn: async () => {
      if (!orgId && !isAdmin) return [];
      const query = supabase
        .from('whatsapp_webhook_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!isAdmin && orgId) {
        query.eq('organization_id', orgId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId || isAdmin,
    refetchInterval: 15000,
  });

  const { data: unknownInstances = [] } = useQuery({
    queryKey: ['unknown-whatsapp-instances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unknown_whatsapp_instances' as any)
        .select('*')
        .eq('acknowledged', false)
        .order('last_seen_at', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: isAdmin,
  });

  return (
    <div className="space-y-4">
      {/* Unknown instances alert */}
      {isAdmin && unknownInstances.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Instâncias Não Cadastradas ({unknownInstances.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Estas instâncias estão enviando mensagens via webhook mas não estão cadastradas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unknownInstances.map((inst: any) => (
                <div key={inst.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">{inst.instance_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {inst.message_count} msg · Último: {format(new Date(inst.last_seen_at), "dd/MM HH:mm", { locale: ptBR })}
                        {inst.sample_phone && <> · <Phone className="h-3 w-3 inline" /> {inst.sample_phone}</>}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-amber-600">Cadastrar</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent webhook logs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-5 w-5" /> Mensagens Recebidas via Webhook
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Últimas mensagens processadas com status de roteamento
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => refetch()}>
              <RefreshCw className="h-3 w-3" /> Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma mensagem registrada ainda.</p>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-1.5">
                {logs.map((log: any) => {
                  const cfg = statusConfig[log.routing_status] || statusConfig.discarded;
                  const details = log.details as Record<string, unknown> | null;
                  return (
                    <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-xs">
                      {cfg.icon}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant={cfg.variant} className="text-[10px] h-4 px-1.5">
                            {cfg.label}
                          </Badge>
                          {log.instance_name && (
                            <span className="text-muted-foreground flex items-center gap-0.5">
                              <Server className="h-3 w-3" /> {log.instance_name}
                            </span>
                          )}
                          {log.phone && (
                            <span className="text-muted-foreground flex items-center gap-0.5">
                              <Phone className="h-3 w-3" /> {log.phone}
                            </span>
                          )}
                        </div>
                        {details?.text_preview && (
                          <p className="text-muted-foreground mt-0.5 truncate max-w-md">
                            {String(details.text_preview)}
                          </p>
                        )}
                        {details?.reason && (
                          <p className="text-muted-foreground mt-0.5">
                            Motivo: {String(details.reason)}
                          </p>
                        )}
                      </div>
                      <span className="text-muted-foreground whitespace-nowrap shrink-0">
                        {format(new Date(log.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
