import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Webhook, Plus, Copy, Trash2, RefreshCw, Send, Eye, EyeOff,
  CheckCircle2, XCircle, Clock, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApiWebhooks, useWebhookDeliveries, type ApiWebhookSubscription } from '@/hooks/useApiWebhooks';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AVAILABLE_EVENTS = [
  { value: 'message_sent', label: 'Mensagem enviada', description: 'Disparado ao criar uma mensagem outbound' },
  { value: 'delivered', label: 'Mensagem entregue', description: 'Provedor confirmou entrega' },
  { value: 'read', label: 'Mensagem lida', description: 'Destinatário leu a mensagem' },
  { value: 'failed', label: 'Falha no envio', description: 'Mensagem não pôde ser entregue' },
  { value: 'tag_added', label: 'Tag adicionada', description: 'Tag aplicada a um contato' },
  { value: 'tag_removed', label: 'Tag removida', description: 'Tag removida de um contato' },
  { value: 'tag_created', label: 'Tag criada', description: 'Nova tag criada na organização' },
  { value: 'tag_deleted', label: 'Tag excluída', description: 'Tag removida da organização' },
];

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string; icon: any }> = {
    delivered: { label: 'Entregue', cls: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle2 },
    failed: { label: 'Falhou', cls: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
    retrying: { label: 'Reenviando', cls: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: RefreshCw },
    pending: { label: 'Pendente', cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Clock },
  };
  const cfg = map[status] || { label: status, cls: 'bg-muted text-muted-foreground', icon: AlertCircle };
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cfg.cls}>
      <Icon className="h-3 w-3 mr-1" />
      {cfg.label}
    </Badge>
  );
};

export default function ApiWebhooks() {
  const { subscriptions, isLoading, create, update, remove, rotateSecret, sendTest } = useApiWebhooks();
  const [isOpen, setIsOpen] = useState(false);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<ApiWebhookSubscription | null>(null);
  const [form, setForm] = useState({
    name: '',
    url: '',
    events: ['message_sent', 'delivered', 'failed'] as string[],
  });

  const { data: deliveries = [], isLoading: loadingDeliveries } = useWebhookDeliveries(selected?.id);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado');
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.url.trim()) {
      toast.error('Preencha nome e URL');
      return;
    }
    try { new URL(form.url); } catch { toast.error('URL inválida'); return; }
    if (form.events.length === 0) {
      toast.error('Selecione pelo menos um evento');
      return;
    }
    await create.mutateAsync(form);
    setIsOpen(false);
    setForm({ name: '', url: '', events: ['message_sent', 'delivered', 'failed'] });
  };

  const toggleEvent = (ev: string) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(ev) ? f.events.filter((e) => e !== ev) : [...f.events, ev],
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="h-6 w-6" /> Webhooks de Saída
          </h1>
          <p className="text-muted-foreground mt-1">
            Receba notificações em tempo real de eventos da plataforma. Cada entrega é assinada com HMAC-SHA256 e tentada novamente em caso de falha.
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Webhook</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastrar Webhook</DialogTitle>
              <DialogDescription>Informe a URL que receberá os eventos selecionados.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  placeholder="Ex: Integração CRM"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label>URL de destino</Label>
                <Input
                  placeholder="https://meu-sistema.com/webhook"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-2 block">Eventos</Label>
                <div className="space-y-2 border rounded-md p-3">
                  {AVAILABLE_EVENTS.map((ev) => (
                    <label key={ev.value} className="flex items-start gap-2 cursor-pointer">
                      <Checkbox
                        checked={form.events.includes(ev.value)}
                        onCheckedChange={() => toggleEvent(ev.value)}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{ev.label}</div>
                        <div className="text-xs text-muted-foreground">{ev.description}</div>
                      </div>
                      <code className="text-xs text-muted-foreground">{ev.value}</code>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={create.isPending}>Cadastrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : subscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Webhook className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum webhook configurado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {subscriptions.map((sub) => (
            <Card key={sub.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {sub.name}
                      {sub.is_active ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Ativo</Badge>
                      ) : (
                        <Badge variant="outline">Pausado</Badge>
                      )}
                      {sub.failure_count > 0 && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                          {sub.failure_count} falha{sub.failure_count > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="break-all mt-1">{sub.url}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={sub.is_active}
                      onCheckedChange={(v) => update.mutate({ id: sub.id, is_active: v })}
                    />
                    <Button size="sm" variant="outline" onClick={() => sendTest.mutate(sub)} disabled={sendTest.isPending}>
                      <Send className="h-4 w-4 mr-1" /> Testar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelected(sub)}>
                      <Eye className="h-4 w-4 mr-1" /> Logs
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover webhook?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove.mutate(sub.id)}>Remover</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {sub.events.map((ev) => (
                    <Badge key={ev} variant="secondary" className="text-xs">{ev}</Badge>
                  ))}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Segredo de assinatura (HMAC-SHA256)</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded font-mono truncate">
                      {showSecret[sub.id] ? sub.secret : '••••••••••••••••••••••••'}
                    </code>
                    <Button size="sm" variant="ghost" onClick={() => setShowSecret((s) => ({ ...s, [sub.id]: !s[sub.id] }))}>
                      {showSecret[sub.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => sub.secret && copy(sub.secret)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => rotateSecret.mutate(sub.id)}>
                      <RefreshCw className="h-4 w-4 mr-1" /> Rotacionar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Verifique o cabeçalho <code>X-Webhook-Signature</code> nas requisições recebidas.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Logs dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Logs de entrega — {selected?.name}</DialogTitle>
            <DialogDescription>Últimas 100 entregas. Atualiza automaticamente.</DialogDescription>
          </DialogHeader>
          {loadingDeliveries ? (
            <Skeleton className="h-40" />
          ) : deliveries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma entrega ainda. Use o botão "Testar" para disparar uma.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead>HTTP</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatDistanceToNow(new Date(d.created_at), { addSuffix: true, locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-xs">
                      <code>{d.payload?.event || '-'}</code>
                    </TableCell>
                    <TableCell><StatusBadge status={d.status} /></TableCell>
                    <TableCell className="text-xs">{d.attempts} / {d.max_attempts}</TableCell>
                    <TableCell className="text-xs">{d.last_status_code || '-'}</TableCell>
                    <TableCell className="text-xs text-red-600 max-w-xs truncate" title={d.last_error || ''}>
                      {d.last_error || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como verificar a assinatura</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto"><code>{`// Node.js
const crypto = require('crypto');
const signature = req.headers['x-webhook-signature'];
const expected = crypto.createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');
if (signature !== expected) return res.status(401).end();`}</code></pre>
        </CardContent>
      </Card>
    </div>
  );
}
