import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RefreshCw, Bug, Send, Loader2, X } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface LogEntry {
  timestamp: string;
  type: 'webhook' | 'routing' | 'insert' | 'error' | 'test';
  message: string;
  details?: string;
}

interface InboxDebugPanelProps {
  conversationId?: string | null;
  onClose: () => void;
}

export function InboxDebugPanel({ conversationId, onClose }: InboxDebugPanelProps) {
  const { currentOrganization } = useOrganization();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Mensagem de teste do SAC');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    const newLogs: LogEntry[] = [];

    try {
      // Fetch recent messages for this conversation
      if (conversationId) {
        const { data: messages } = await supabase
          .from('messages')
          .select('id, content, sender_type, created_at, delivery_status, external_id, message_type')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(20);

        messages?.forEach(m => {
          newLogs.push({
            timestamp: m.created_at,
            type: 'insert',
            message: `Msg ${m.sender_type}: "${(m.content || '').slice(0, 60)}"`,
            details: `ID: ${m.id} | Status: ${m.delivery_status || 'n/a'} | External: ${m.external_id || 'n/a'} | Type: ${m.message_type}`,
          });
        });
      }

      // Fetch recent conversations for this org
      const { data: convs } = await supabase
        .from('conversations')
        .select('id, channel, status, created_at, metadata, contact_id, contacts(first_name, phone, whatsapp)')
        .eq('organization_id', currentOrganization?.id || '')
        .order('created_at', { ascending: false })
        .limit(10);

      convs?.forEach(c => {
        const meta = (c.metadata && typeof c.metadata === 'object' && !Array.isArray(c.metadata)) ? c.metadata as Record<string, any> : {};
        newLogs.push({
          timestamp: c.created_at,
          type: 'routing',
          message: `Conv ${c.channel} → ${(c.contacts as any)?.first_name || 'Desconhecido'} (${c.status})`,
          details: `ID: ${c.id} | Instance: ${meta.whatsapp_instance_id || meta.whatsapp_instance_name || 'n/a'} | Phone: ${(c.contacts as any)?.whatsapp || (c.contacts as any)?.phone || 'n/a'}`,
        });
      });

      newLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(newLogs);
    } catch (err: any) {
      setLogs([{ timestamp: new Date().toISOString(), type: 'error', message: `Erro: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [conversationId]);

  const handleSendTest = async () => {
    if (!testPhone.trim()) { toast.error('Informe o número'); return; }
    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-webhook', {
        body: {
          event: 'messages.upsert',
          instance: 'Test',
          data: {
            key: {
              remoteJid: `${testPhone.replace(/\D/g, '')}@s.whatsapp.net`,
              fromMe: false,
              id: `test-${Date.now()}`,
            },
            pushName: 'Teste Debug',
            message: { conversation: testMessage },
            messageType: 'conversation',
            messageTimestamp: Math.floor(Date.now() / 1000),
          },
        },
      });
      if (error) throw error;
      toast.success('Webhook de teste enviado!');
      setLogs(prev => [{
        timestamp: new Date().toISOString(),
        type: 'test',
        message: `Teste enviado → ${testPhone}`,
        details: JSON.stringify(data).slice(0, 200),
      }, ...prev]);
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
      setLogs(prev => [{
        timestamp: new Date().toISOString(),
        type: 'error',
        message: `Falha no teste: ${err.message}`,
      }, ...prev]);
    } finally {
      setIsSendingTest(false);
    }
  };

  const typeColors: Record<string, string> = {
    webhook: 'bg-blue-500/20 text-blue-400',
    routing: 'bg-yellow-500/20 text-yellow-400',
    insert: 'bg-green-500/20 text-green-400',
    error: 'bg-red-500/20 text-red-400',
    test: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Debug SAC</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchLogs} disabled={isLoading}>
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Test Webhook */}
      <div className="p-3 border-b space-y-2 shrink-0">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Teste de Webhook</p>
        <div className="flex gap-1.5">
          <Input
            placeholder="Número (ex: 5511999999999)"
            value={testPhone}
            onChange={e => setTestPhone(e.target.value.replace(/\D/g, ''))}
            className="h-7 text-xs flex-1"
          />
        </div>
        <div className="flex gap-1.5">
          <Input
            placeholder="Mensagem de teste"
            value={testMessage}
            onChange={e => setTestMessage(e.target.value)}
            className="h-7 text-xs flex-1"
          />
          <Button size="sm" className="h-7 text-xs gap-1 shrink-0" onClick={handleSendTest} disabled={isSendingTest}>
            {isSendingTest ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Enviar
          </Button>
        </div>
      </div>

      {/* Logs */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {logs.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhum log disponível</p>
          )}
          {logs.map((log, i) => (
            <div key={i} className="rounded-md border border-border/50 p-2 text-[11px] space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Badge className={`${typeColors[log.type] || ''} text-[9px] h-4 px-1.5 border-0`}>{log.type}</Badge>
                <span className="text-muted-foreground font-mono text-[9px]">
                  {new Date(log.timestamp).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p className="font-medium">{log.message}</p>
              {log.details && <p className="text-muted-foreground font-mono text-[9px] break-all">{log.details}</p>}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
