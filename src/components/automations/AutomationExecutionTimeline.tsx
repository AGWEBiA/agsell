import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Zap, Mail, MessageSquare, Tag, Bell, Clock, CheckCircle, XCircle,
  Star, GitBranch, Timer, AlertTriangle,
} from 'lucide-react';
import { useAutomationTimeline } from '@/hooks/useAutomationTimeline';

const actionIcons: Record<string, React.ReactNode> = {
  send_email: <Mail className="h-3.5 w-3.5" />,
  send_email_marketing: <Mail className="h-3.5 w-3.5" />,
  send_email_performance: <Mail className="h-3.5 w-3.5" />,
  send_whatsapp: <MessageSquare className="h-3.5 w-3.5" />,
  add_tag: <Tag className="h-3.5 w-3.5" />,
  remove_tag: <Tag className="h-3.5 w-3.5" />,
  send_notification: <Bell className="h-3.5 w-3.5" />,
  update_score: <Star className="h-3.5 w-3.5" />,
  wait: <Clock className="h-3.5 w-3.5" />,
  timer: <Timer className="h-3.5 w-3.5" />,
  conditional: <GitBranch className="h-3.5 w-3.5" />,
  trigger: <Zap className="h-3.5 w-3.5" />,
};

const statusColors: Record<string, string> = {
  completed: 'bg-green-500',
  running: 'bg-blue-500',
  failed: 'bg-red-500',
  skipped: 'bg-gray-400',
  waiting: 'bg-amber-500',
};

interface Props {
  contactId: string;
}

export function AutomationExecutionTimeline({ contactId }: Props) {
  const { data: timeline, isLoading } = useAutomationTimeline(contactId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Histórico de Automações</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Histórico de Automações</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Zap className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhuma automação executada para este contato</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Histórico de Automações</CardTitle>
          <Badge variant="secondary">{timeline.length} eventos</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-2">
          <div className="relative pl-6">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
            {timeline.map((entry) => {
              const icon = actionIcons[entry.action_type] || <Zap className="h-3.5 w-3.5" />;
              const statusColor = statusColors[entry.status] || 'bg-gray-400';
              const StatusIcon = entry.status === 'completed' ? CheckCircle
                : entry.status === 'failed' ? XCircle
                : entry.status === 'waiting' ? Clock
                : AlertTriangle;

              return (
                <div key={entry.id} className="relative mb-4 last:mb-0">
                  <div className={`absolute -left-6 top-1 h-5 w-5 rounded-full ${statusColor} flex items-center justify-center text-white`}>
                    {icon}
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${
                          entry.status === 'completed' ? 'text-green-500' :
                          entry.status === 'failed' ? 'text-red-500' :
                          'text-amber-500'
                        }`} />
                        <span className="text-sm font-medium truncate">
                          {entry.node_label || entry.action_type}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    {entry.automations?.name && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Zap className="h-3 w-3" /> {entry.automations.name}
                      </p>
                    )}
                    {entry.details && Object.keys(entry.details).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {JSON.stringify(entry.details).slice(0, 80)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
