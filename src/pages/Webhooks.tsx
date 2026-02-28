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
  Pencil,
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
  const [editingWebhook, setEditingWebhook] = useState<InboundWebhook | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<InboundWebhook | null>(null);
  const defaultFormData = {
    name: '',
    description: '',
    target_action: 'create_contact',
    automation_id: '' as string,
    field_mapping: '{\n  "first_name": "nome",\n  "email": "email",\n  "phone": "telefone"\n}',
  };
  const [formData, setFormData] = useState(defaultFormData);

  const webhookBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-inbound`;
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [testDialogWebhook, setTestDialogWebhook] = useState<InboundWebhook | null>(null);
  const [testPayloadInput, setTestPayloadInput] = useState('');
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; data?: Record<string, unknown>; error?: string }>({ status: 'idle' });

  const getDefaultTestPayload = (webhook: InboundWebhook) => {
    const mapping = webhook.field_mapping || {};
    const reversePayload: Record<string, string> = {};
    const defaults: Record<string, string> = {
      first_name: 'Teste',
      last_name: 'Webhook',
      email: `teste-${Date.now()}@webhook-test.com`,
      phone: '(11) 99999-0000',
      whatsapp: '5511999990000',
      title: 'Deal de Teste',
      value: '100',
      name: 'Lead Teste',
    };
    if (Object.keys(mapping).length > 0) {
      for (const [systemField, externalField] of Object.entries(mapping)) {
        if (defaults[systemField]) {
          reversePayload[externalField] = defaults[systemField];
        }
      }
      return JSON.stringify(reversePayload, null, 2);
    }
    return JSON.stringify({ nome: 'Teste', email: `teste-${Date.now()}@webhook-test.com`, telefone: '(11) 99999-0000' }, null, 2);
  };

  const openTestDialog = (webhook: InboundWebhook) => {
    setTestDialogWebhook(webhook);
    setTestPayloadInput(getDefaultTestPayload(webhook));
    setTestResult({ status: 'idle' });
  };

  const handleTestWebhook = async () => {
    if (!testDialogWebhook) return;
    const webhook = testDialogWebhook;

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(testPayloadInput);
    } catch {
      toast.error('JSON inválido no payload de teste');
      return;
    }

    setTestResult({ status: 'loading' });
    setTestingWebhookId(webhook.id);

    try {
      const res = await fetch(`${webhookBaseUrl}/${webhook.endpoint_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhook.secret_token,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setTestResult({ status: 'success', data: result });
        toast.success('Webhook recebeu e processou os dados com sucesso!');
      } else {
        setTestResult({ status: 'error', error: result.error || 'Erro desconhecido', data: result });
        toast.error('Falha no teste', { description: result.error });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível conectar';
      setTestResult({ status: 'error', error: message });
      toast.error('Erro de conexão', { description: message });
    } finally {
      setTestingWebhookId(null);
    }
  };

  const openEditDialog = (webhook: InboundWebhook) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      description: webhook.description || '',
      target_action: webhook.target_action,
      automation_id: webhook.automation_id || '',
      field_mapping: JSON.stringify(webhook.field_mapping || {}, null, 2),
    });
    setIsDialogOpen(true);
  };

  const resetAndCloseDialog = () => {
    setFormData(defaultFormData);
    setEditingWebhook(null);
    setIsDialogOpen(false);
  };

  const handleSave = async () => {
    let mapping = {};
    try {
      mapping = JSON.parse(formData.field_mapping);
    } catch {
      toast.error('Mapeamento de campos inválido (deve ser JSON válido)');
      return;
    }

    if (editingWebhook) {
      await updateWebhook.mutateAsync({
        id: editingWebhook.id,
        name: formData.name,
        description: formData.description,
        target_action: formData.target_action,
        field_mapping: mapping,
        automation_id: formData.automation_id || null,
      });
    } else {
      await createWebhook.mutateAsync({
        name: formData.name,
        description: formData.description,
        target_action: formData.target_action,
        field_mapping: mapping,
        automation_id: formData.automation_id || null,
      });
    }

    resetAndCloseDialog();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground text-sm">Receba dados de sistemas externos automaticamente</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetAndCloseDialog(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingWebhook(null); setFormData(defaultFormData); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingWebhook ? 'Editar Webhook' : 'Novo Webhook'}</DialogTitle>
              <DialogDescription>
                {editingWebhook ? 'Edite as configurações do webhook' : 'Crie um endpoint para receber dados de sistemas externos'}
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
              <Button variant="outline" onClick={resetAndCloseDialog}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!formData.name || createWebhook.isPending || updateWebhook.isPending}>
                {(createWebhook.isPending || updateWebhook.isPending) ? 'Salvando...' : editingWebhook ? 'Salvar Alterações' : 'Criar Webhook'}
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
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{webhook.name}</h3>
                          <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                            {webhook.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Badge variant="outline" className="hidden sm:inline-flex">
                            {TARGET_ACTIONS.find(a => a.value === webhook.target_action)?.label}
                          </Badge>
                          {webhook.automation_id && (
                            <Badge variant="outline" className="border-primary text-primary hidden sm:inline-flex">
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
                            <code className="flex-1 p-2 bg-muted rounded text-xs truncate block overflow-hidden">
                              {webhookBaseUrl}/{webhook.endpoint_id}
                            </code>
                            <Button 
                              size="icon" 
                              variant="outline"
                              className="shrink-0"
                              onClick={() => copyToClipboard(`${webhookBaseUrl}/${webhook.endpoint_id}`)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <Switch
                          checked={webhook.is_active}
                          onCheckedChange={(checked) => 
                            updateWebhook.mutate({ id: webhook.id, is_active: checked })
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(webhook)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={testingWebhookId === webhook.id || !webhook.is_active}
                          onClick={() => openTestDialog(webhook)}
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
      {/* Test Webhook Dialog */}
      <Dialog open={!!testDialogWebhook} onOpenChange={(open) => { if (!open) setTestDialogWebhook(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Testar Webhook
            </DialogTitle>
            <DialogDescription>
              {testDialogWebhook?.name} — Envie um payload customizado para verificar se o webhook está recebendo e processando corretamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>URL do Endpoint</Label>
              <code className="block p-2 bg-muted rounded text-xs break-all">
                {testDialogWebhook ? `${webhookBaseUrl}/${testDialogWebhook.endpoint_id}` : ''}
              </code>
            </div>
            <div className="space-y-2">
              <Label>Payload JSON</Label>
              <Textarea
                className="font-mono text-sm"
                rows={8}
                value={testPayloadInput}
                onChange={(e) => setTestPayloadInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Edite o JSON acima para simular o payload que seu sistema externo enviará
              </p>
            </div>

            {testResult.status === 'success' && (
              <div className="p-3 rounded-lg border border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-800 space-y-2">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Webhook funcionando corretamente!
                </div>
                <pre className="text-xs overflow-x-auto bg-muted/50 p-2 rounded">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
            )}

            {testResult.status === 'error' && (
              <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/10 space-y-2">
                <div className="flex items-center gap-2 text-destructive font-medium text-sm">
                  <XCircle className="h-4 w-4" />
                  Falha no teste
                </div>
                <p className="text-xs text-destructive">{testResult.error}</p>
                {testResult.data && (
                  <pre className="text-xs overflow-x-auto bg-muted/50 p-2 rounded">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogWebhook(null)}>Fechar</Button>
            <Button onClick={handleTestWebhook} disabled={testResult.status === 'loading'}>
              {testResult.status === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Enviar Teste
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
