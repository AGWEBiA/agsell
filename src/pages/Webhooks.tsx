import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Webhook, 
  Plus, 
  Copy, 
  Trash2, 
  RefreshCw, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Code,
  ExternalLink,
  Play,
  Loader2,
} from 'lucide-react';
import { useWebhooks, useWebhookLogs, type InboundWebhook } from '@/hooks/useWebhooks';
import { useAutomations } from '@/hooks/useAutomations';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TARGET_ACTIONS = [
  { value: 'create_contact', label: 'Criar Contato', description: 'Cria um novo contato a partir dos dados recebidos' },
  { value: 'update_contact', label: 'Atualizar Contato', description: 'Atualiza contato existente (por email)' },
  { value: 'create_deal', label: 'Criar Negócio', description: 'Cria um novo deal/negócio' },
  { value: 'log_only', label: 'Apenas Registrar', description: 'Apenas salva os dados no log' },
];

export default function Webhooks() {
  const { webhooks, isLoading, createWebhook, updateWebhook, deleteWebhook, regenerateToken } = useWebhooks();
  const { automations } = useAutomations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<InboundWebhook | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_action: 'create_contact',
    automation_id: '' as string,
    field_mapping: '{\n  "first_name": "nome",\n  "email": "email",\n  "phone": "telefone"\n}',
  });

  const webhookBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-inbound`;
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);

  const handleTestWebhook = async (webhook: InboundWebhook) => {
    setTestingWebhookId(webhook.id);
    const testPayload: Record<string, string> = {
      first_name: 'Teste',
      last_name: 'Webhook',
      email: `teste-${Date.now()}@webhook-test.com`,
      phone: '(11) 99999-0000',
      whatsapp: '5511999990000',
    };

    // Apply reverse field mapping so the payload matches what the webhook expects
    const mapping = webhook.field_mapping || {};
    const mappedPayload: Record<string, string> = {};
    for (const [systemField, externalField] of Object.entries(mapping)) {
      if (testPayload[systemField]) {
        mappedPayload[externalField] = testPayload[systemField];
      }
    }
    const finalPayload = Object.keys(mappedPayload).length > 0 ? mappedPayload : testPayload;

    try {
      const res = await fetch(`${webhookBaseUrl}/${webhook.endpoint_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhook.secret_token,
        },
        body: JSON.stringify(finalPayload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        toast.success('Teste bem-sucedido! Webhook recebeu e processou os dados.', {
          description: `Ação: ${result.action}${result.contact_id ? ` | Contato: ${result.contact_id.substring(0, 8)}...` : ''}${result.automation_triggered ? ' | Automação disparada ✓' : ''}`,
          duration: 6000,
        });
      } else {
        toast.error('Falha no teste do webhook', {
          description: result.error || 'Erro desconhecido',
        });
      }
    } catch (err) {
      toast.error('Erro de conexão ao testar webhook', {
        description: err instanceof Error ? err.message : 'Não foi possível conectar',
      });
    } finally {
      setTestingWebhookId(null);
    }
  };

  const handleCreate = async () => {
    let mapping = {};
    try {
      mapping = JSON.parse(formData.field_mapping);
    } catch {
      toast.error('Mapeamento de campos inválido (deve ser JSON válido)');
      return;
    }

    await createWebhook.mutateAsync({
      name: formData.name,
      description: formData.description,
      target_action: formData.target_action,
      field_mapping: mapping,
      automation_id: formData.automation_id || null,
    });

    setFormData({
      name: '',
      description: '',
      target_action: 'create_contact',
      automation_id: '',
      field_mapping: '{\n  "first_name": "nome",\n  "email": "email",\n  "phone": "telefone"\n}',
    });
    setIsDialogOpen(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para área de transferência');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Erro</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Processando</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">Receba dados de sistemas externos automaticamente</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Webhook</DialogTitle>
              <DialogDescription>
                Crie um endpoint para receber dados de sistemas externos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  placeholder="Ex: Hotmart Compras"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Input
                  placeholder="Recebe notificações de compras..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ação ao Receber</Label>
                <Select
                  value={formData.target_action}
                  onValueChange={(value) => setFormData({ ...formData, target_action: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_ACTIONS.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        <div>
                          <span className="font-medium">{action.label}</span>
                          <span className="text-muted-foreground text-sm ml-2">{action.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Automação Vinculada (opcional)</Label>
                <Select
                  value={formData.automation_id}
                  onValueChange={(value) => setFormData({ ...formData, automation_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhuma automação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma automação</SelectItem>
                    {automations.map((auto) => (
                      <SelectItem key={auto.id} value={auto.id}>
                        {auto.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Ao receber um contato, a automação selecionada será disparada automaticamente
                </p>
              </div>
              <div className="space-y-2">
                <Label>Mapeamento de Campos (JSON)</Label>
                <Textarea
                  className="font-mono text-sm"
                  rows={5}
                  placeholder='{"first_name": "nome", "email": "email"}'
                  value={formData.field_mapping}
                  onChange={(e) => setFormData({ ...formData, field_mapping: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Mapeia campos do payload recebido para os campos do sistema
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={!formData.name || createWebhook.isPending}>
                {createWebhook.isPending ? 'Criando...' : 'Criar Webhook'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Documentation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Como Usar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Formato do Request</Label>
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`POST {webhook_url}
Content-Type: application/json
X-Webhook-Secret: {seu_token_secreto}

{
  "nome": "João Silva",
  "email": "joao@email.com",
  "telefone": "(11) 99999-9999"
}`}
            </pre>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>• O header <code>X-Webhook-Secret</code> é opcional mas recomendado</p>
            <p>• Suporta <code>application/json</code> e <code>application/x-www-form-urlencoded</code></p>
            <p>• Use o mapeamento de campos para adaptar qualquer payload</p>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Seus Webhooks
          </CardTitle>
          <CardDescription>
            {webhooks.length} {webhooks.length === 1 ? 'webhook' : 'webhooks'} configurado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-8">
              <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum webhook configurado ainda</p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro Webhook
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <Card key={webhook.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{webhook.name}</h3>
                          <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                            {webhook.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Badge variant="outline">
                            {TARGET_ACTIONS.find(a => a.value === webhook.target_action)?.label}
                          </Badge>
                          {webhook.automation_id && (
                            <Badge variant="outline" className="border-primary text-primary">
                              ⚡ {automations.find(a => a.id === webhook.automation_id)?.name || 'Automação'}
                            </Badge>
                          )}
                        </div>
                        {webhook.description && (
                          <p className="text-sm text-muted-foreground">{webhook.description}</p>
                        )}
                        <div className="space-y-1">
                          <Label className="text-xs">URL do Endpoint</Label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 p-2 bg-muted rounded text-xs truncate">
                              {webhookBaseUrl}/{webhook.endpoint_id}
                            </code>
                            <Button 
                              size="icon" 
                              variant="outline"
                              onClick={() => copyToClipboard(`${webhookBaseUrl}/${webhook.endpoint_id}`)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{webhook.requests_count} requisições</span>
                          {webhook.last_request_at && (
                            <span>
                              Última: {formatDistanceToNow(new Date(webhook.last_request_at), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={webhook.is_active}
                          onCheckedChange={(checked) => 
                            updateWebhook.mutate({ id: webhook.id, is_active: checked })
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={testingWebhookId === webhook.id || !webhook.is_active}
                          onClick={() => handleTestWebhook(webhook)}
                          title={!webhook.is_active ? 'Ative o webhook para testar' : 'Enviar payload de teste'}
                        >
                          {testingWebhookId === webhook.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-1" />
                          )}
                          Testar
                        </Button>
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedWebhook(webhook)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Logs
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-[600px] sm:max-w-[600px]">
                            <SheetHeader>
                              <SheetTitle>Logs do Webhook</SheetTitle>
                              <SheetDescription>{webhook.name}</SheetDescription>
                            </SheetHeader>
                            <WebhookLogsPanel webhookId={webhook.id} />
                          </SheetContent>
                        </Sheet>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => regenerateToken.mutate(webhook.id)}
                          title="Regenerar Token"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover Webhook?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O endpoint deixará de funcionar imediatamente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteWebhook.mutate(webhook.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    {/* Secret Token Section */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Token Secreto</Label>
                        <code className="flex-1 p-2 bg-muted rounded text-xs font-mono">
                          {webhook.secret_token.substring(0, 8)}...{webhook.secret_token.substring(webhook.secret_token.length - 8)}
                        </code>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(webhook.secret_token)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function WebhookLogsPanel({ webhookId }: { webhookId: string }) {
  const { logs, isLoading } = useWebhookLogs(webhookId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Erro</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Processando</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="py-8"><Skeleton className="h-32 w-full" /></div>;
  }

  if (logs.length === 0) {
    return (
      <div className="py-8 text-center">
        <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Nenhum log ainda</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)] mt-4">
      <div className="space-y-4">
        {logs.map((log) => (
          <Card key={log.id} className="border">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                {getStatusBadge(log.status)}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              {log.error_message && (
                <p className="text-sm text-destructive">{log.error_message}</p>
              )}
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Ver payload
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                  {JSON.stringify(log.request_body, null, 2)}
                </pre>
              </details>
              {log.response_body && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Ver resposta
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                    {JSON.stringify(log.response_body, null, 2)}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
