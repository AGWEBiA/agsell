import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Save, Loader2, ExternalLink, Copy, CheckCircle, AlertTriangle, 
  Info, ShoppingCart, Link2, Webhook, Key, BookOpen 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function KiwifyConfig() {
  const queryClient = useQueryClient();
  const [webhookToken, setWebhookToken] = useState('');
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [tokenSaved, setTokenSaved] = useState(false);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['admin_kiwify_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, slug, price_monthly, price_yearly, kiwify_product_id, kiwify_checkout_url, kiwify_product_id_yearly, kiwify_checkout_url_yearly, is_active')
        .order('price_monthly', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Check if webhook secret is already configured
  useQuery({
    queryKey: ['kiwify_webhook_secret_check'],
    queryFn: async () => {
      // We can't read the secret value, but we can check edge function behavior
      // For now, just show the field as editable
      setTokenSaved(false);
      return null;
    },
  });

  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    kiwify_product_id: string;
    kiwify_checkout_url: string;
    kiwify_product_id_yearly: string;
    kiwify_checkout_url_yearly: string;
  }>({
    kiwify_product_id: '',
    kiwify_checkout_url: '',
    kiwify_product_id_yearly: '',
    kiwify_checkout_url_yearly: '',
  });

  const saveMutation = useMutation({
    mutationFn: async ({ planId, values }: { planId: string; values: typeof editValues }) => {
      const { error } = await supabase
        .from('plans')
        .update({
          kiwify_product_id: values.kiwify_product_id || null,
          kiwify_checkout_url: values.kiwify_checkout_url || null,
          kiwify_product_id_yearly: values.kiwify_product_id_yearly || null,
          kiwify_checkout_url_yearly: values.kiwify_checkout_url_yearly || null,
        })
        .eq('id', planId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_kiwify_plans'] });
      toast.success('Configuração Kiwify salva!');
      setEditingPlan(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSaveToken = async () => {
    if (!webhookToken.trim()) {
      toast.error('Insira o token do webhook');
      return;
    }
    setIsTokenLoading(true);
    try {
      // Save as a Supabase secret via edge function
      const { error } = await supabase.functions.invoke('admin-manage-users', {
        body: {
          action: 'save_secret',
          secret_name: 'KIWIFY_WEBHOOK_SECRET',
          secret_value: webhookToken.trim(),
        },
      });
      if (error) throw error;
      toast.success('Token do webhook salvo com sucesso!');
      setTokenSaved(true);
      setWebhookToken('');
    } catch (error) {
      console.error('Error saving token:', error);
      toast.error('Erro ao salvar token. Configure manualmente nos segredos do backend.');
    } finally {
      setIsTokenLoading(false);
    }
  };

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-kiwify`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const startEditing = (plan: any) => {
    setEditingPlan(plan.id);
    setEditValues({
      kiwify_product_id: plan.kiwify_product_id || '',
      kiwify_checkout_url: plan.kiwify_checkout_url || '',
      kiwify_product_id_yearly: plan.kiwify_product_id_yearly || '',
      kiwify_checkout_url_yearly: plan.kiwify_checkout_url_yearly || '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          Configuração Kiwify
        </h2>
        <p className="text-muted-foreground">
          Configure a Kiwify como meio de pagamento alternativo ao Stripe para os planos do AG Sell.
        </p>
      </div>

      {/* Step-by-step Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Guia de Configuração Passo a Passo
          </CardTitle>
          <CardDescription>
            Siga estas etapas para habilitar a Kiwify como opção de pagamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
            <div className="space-y-2">
              <h4 className="font-semibold">Criar os Produtos na Kiwify</h4>
              <p className="text-sm text-muted-foreground">
                Acesse o painel da Kiwify e crie um produto para cada plano do AG Sell (Starter, Professional, Enterprise, Agência). 
                Configure como <strong>assinatura recorrente</strong> com os mesmos preços da sua tabela.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Defina o nome do produto igual ao nome do plano (ex: "AG Sell - Professional")</li>
                <li>Configure o tipo como <strong>Assinatura</strong></li>
                <li>Defina o preço mensal/anual conforme sua tabela de planos</li>
                <li>Salve e copie o <strong>ID do produto</strong> que aparece na URL ou nas configurações</li>
              </ul>
              <Button variant="outline" size="sm" asChild>
                <a href="https://dashboard.kiwify.com.br" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Kiwify Dashboard
                </a>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
            <div className="space-y-2">
              <h4 className="font-semibold">Configurar o Webhook na Kiwify</h4>
              <p className="text-sm text-muted-foreground">
                Na Kiwify, vá em <strong>Configurações → Webhooks</strong> e adicione a URL abaixo. 
                Isso permite que o AG Sell receba notificações de pagamento automaticamente.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-sm break-all">
                  {webhookUrl}
                </div>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookUrl)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Alert>
                <Webhook className="h-4 w-4" />
                <AlertTitle>Eventos para ativar</AlertTitle>
                <AlertDescription>
                  Marque todos os eventos de <strong>Assinatura</strong>: pagamento aprovado, reembolso, cancelamento e chargeback.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          <Separator />

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
            <div className="space-y-2">
              <h4 className="font-semibold">Copiar a URL de Checkout de cada Produto</h4>
              <p className="text-sm text-muted-foreground">
                Para cada produto criado na Kiwify, copie a <strong>URL de checkout</strong> (link de venda). 
                Geralmente fica em <strong>Produto → Oferta → Link de Checkout</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                Exemplo de URL: <code className="bg-muted px-2 py-0.5 rounded">https://pay.kiwify.com.br/XXXXXXX</code>
              </p>
            </div>
          </div>

          <Separator />

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">4</div>
            <div className="space-y-2">
              <h4 className="font-semibold">Preencher os IDs e URLs na Tabela Abaixo</h4>
              <p className="text-sm text-muted-foreground">
                Cole o <strong>ID do produto</strong> e a <strong>URL de checkout</strong> de cada plano na tabela abaixo. 
                Após salvar, a opção Kiwify aparecerá automaticamente no checkout dos planos configurados.
              </p>
            </div>
          </div>

          <Separator />

          {/* Step 5 - Webhook Token */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">5</div>
            <div className="space-y-3 flex-1">
              <h4 className="font-semibold">Configurar Token de Segurança do Webhook</h4>
              <p className="text-sm text-muted-foreground">
                Na Kiwify, vá em <strong>Configurações → Webhooks → Seu Webhook</strong> e copie o <strong>Token de Verificação</strong>. 
                Cole abaixo para que o sistema valide a autenticidade de cada requisição recebida.
              </p>
              <div className="flex items-end gap-3">
                <div className="flex-1 max-w-md">
                  <Label htmlFor="webhook-token" className="text-sm">Token do Webhook (KIWIFY_WEBHOOK_SECRET)</Label>
                  <Input
                    id="webhook-token"
                    type="password"
                    value={webhookToken}
                    onChange={(e) => setWebhookToken(e.target.value)}
                    placeholder="Cole o token de verificação da Kiwify"
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleSaveToken} disabled={isTokenLoading || !webhookToken.trim()}>
                  {isTokenLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Key className="h-4 w-4 mr-2" />
                  )}
                  Salvar Token
                </Button>
              </div>
              {tokenSaved && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Token salvo com sucesso! As requisições do webhook agora serão validadas.
                </div>
              )}
              <Alert>
                <Key className="h-4 w-4" />
                <AlertTitle>Segurança</AlertTitle>
                <AlertDescription>
                  Com o token configurado, o sistema verifica a assinatura HMAC-SHA256 de cada requisição, 
                  rejeitando automaticamente qualquer chamada não autorizada. <strong>Altamente recomendado</strong> para produção.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans Configuration Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Vincular Planos aos Produtos Kiwify
          </CardTitle>
          <CardDescription>
            Associe cada plano do AG Sell ao respectivo produto na Kiwify
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plano</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Kiwify Product ID</TableHead>
                  <TableHead>Kiwify Checkout URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan: any) => {
                  const isEditing = editingPlan === plan.id;
                  const isMonthlyConfigured = !!plan.kiwify_product_id && !!plan.kiwify_checkout_url;
                  const isYearlyConfigured = !!plan.kiwify_product_id_yearly && !!plan.kiwify_checkout_url_yearly;

                  return (
                    <React.Fragment key={plan.id}>
                      {/* Monthly Row */}
                      <TableRow>
                        <TableCell className="font-medium" rowSpan={2}>
                          {plan.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Mensal</Badge>
                        </TableCell>
                        <TableCell>R$ {plan.price_monthly}/mês</TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editValues.kiwify_product_id}
                              onChange={(e) => setEditValues(prev => ({ ...prev, kiwify_product_id: e.target.value }))}
                              placeholder="Ex: prod_xxxxx"
                              className="max-w-[200px]"
                            />
                          ) : (
                            <span className="font-mono text-xs text-muted-foreground">
                              {plan.kiwify_product_id || '—'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editValues.kiwify_checkout_url}
                              onChange={(e) => setEditValues(prev => ({ ...prev, kiwify_checkout_url: e.target.value }))}
                              placeholder="https://pay.kiwify.com.br/..."
                              className="max-w-[250px]"
                            />
                          ) : (
                            <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px] block">
                              {plan.kiwify_checkout_url || '—'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isMonthlyConfigured ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              OK
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right" rowSpan={2}>
                          {isEditing ? (
                            <div className="flex flex-col gap-2 items-end">
                              <Button
                                size="sm"
                                onClick={() => saveMutation.mutate({ planId: plan.id, values: editValues })}
                                disabled={saveMutation.isPending}
                              >
                                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                                Salvar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingPlan(null)}>
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => startEditing(plan)}>
                              Editar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {/* Yearly Row */}
                      <TableRow>
                        <TableCell>
                          <Badge variant="outline" className="border-primary/50">Anual</Badge>
                        </TableCell>
                        <TableCell>R$ {plan.price_yearly}/ano</TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editValues.kiwify_product_id_yearly}
                              onChange={(e) => setEditValues(prev => ({ ...prev, kiwify_product_id_yearly: e.target.value }))}
                              placeholder="Ex: prod_xxxxx_anual"
                              className="max-w-[200px]"
                            />
                          ) : (
                            <span className="font-mono text-xs text-muted-foreground">
                              {plan.kiwify_product_id_yearly || '—'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editValues.kiwify_checkout_url_yearly}
                              onChange={(e) => setEditValues(prev => ({ ...prev, kiwify_checkout_url_yearly: e.target.value }))}
                              placeholder="https://pay.kiwify.com.br/..."
                              className="max-w-[250px]"
                            />
                          ) : (
                            <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px] block">
                              {plan.kiwify_checkout_url_yearly || '—'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isYearlyConfigured ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              OK
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Como funciona</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            Quando um plano tem a <strong>URL de checkout da Kiwify</strong> configurada, os clientes verão a opção 
            de pagar via Kiwify (PIX, Boleto, Cartão) além do Stripe na tela de checkout.
          </p>
          <p>
            O webhook da Kiwify processa automaticamente: criação de conta, ativação de assinatura, 
            cancelamentos e reembolsos. O e-mail de boas-vindas é enviado automaticamente.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
