import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CreditCard, ShoppingCart, Loader2, Check, Info, Wifi, WifiOff, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GatewaySettings {
  stripe_enabled: boolean;
  kiwify_enabled: boolean;
  default_gateway: 'stripe' | 'kiwify';
}

const DEFAULT_SETTINGS: GatewaySettings = {
  stripe_enabled: false,
  kiwify_enabled: true,
  default_gateway: 'kiwify',
};

interface ConnectionStatus {
  connected: boolean;
  message: string;
  details?: string[];
  checking: boolean;
}

export function PaymentGatewayConfig() {
  const queryClient = useQueryClient();
  const [stripeStatus, setStripeStatus] = useState<ConnectionStatus>({ connected: false, message: 'Não verificado', checking: false });
  const [kiwifyStatus, setKiwifyStatus] = useState<ConnectionStatus>({ connected: false, message: 'Não verificado', checking: false });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['platform_settings', 'payment_gateway'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'payment_gateway')
        .maybeSingle();
      if (error) throw error;
      return (data?.value as unknown as GatewaySettings) ?? DEFAULT_SETTINGS;
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['gateway_plans_check'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, is_active, kiwify_checkout_url, kiwify_product_id, kiwify_checkout_url_yearly, kiwify_product_id_yearly, stripe_price_id_monthly, stripe_price_id_yearly')
        .eq('is_active', true)
        .order('price_monthly');
      if (error) throw error;
      return data || [];
    },
  });

  const checkStripeConnection = useCallback(async () => {
    setStripeStatus({ connected: false, message: 'Verificando...', checking: true });
    try {
      const { data, error } = await supabase.functions.invoke('test-stripe-connection', {
        body: { action: 'test' },
      });
      if (error) throw error;
      
      const plansWithStripe = plans.filter((p: any) => p.stripe_price_id_monthly || p.stripe_price_id_yearly);
      const details: string[] = [];
      
      if (data?.connected) {
        details.push(`Conta: ${data.account_name || data.account_id || 'OK'}`);
        details.push(`${plansWithStripe.length}/${plans.length} planos com Price ID configurado`);
        if (data.livemode !== undefined) {
          details.push(data.livemode ? '🟢 Modo Produção' : '🟡 Modo Teste');
        }
      }

      setStripeStatus({
        connected: !!data?.connected,
        message: data?.connected ? 'Conectado' : (data?.error || 'Falha na conexão'),
        details,
        checking: false,
      });
    } catch (err: any) {
      setStripeStatus({
        connected: false,
        message: 'Erro ao verificar: chave não configurada ou inválida',
        checking: false,
      });
    }
  }, [plans]);

  const checkKiwifyConnection = useCallback(async () => {
    setKiwifyStatus({ connected: false, message: 'Verificando...', checking: true });
    try {
      const activePlans = plans.filter((p: any) => p.is_active);
      const plansWithKiwify = activePlans.filter(
        (p: any) => (p.kiwify_checkout_url && p.kiwify_product_id) || (p.kiwify_checkout_url_yearly && p.kiwify_product_id_yearly)
      );
      
      const details: string[] = [];
      const hasAnyConfig = plansWithKiwify.length > 0;
      
      details.push(`${plansWithKiwify.length}/${activePlans.length} planos configurados`);
      
      // Check if webhook URL is reachable
      let webhookOk = false;
      try {
        const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-kiwify`;
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({}),
        });
        webhookOk = res.ok;
        details.push(webhookOk ? 'Webhook endpoint: ativo' : 'Webhook endpoint: erro');
      } catch {
        details.push('Webhook endpoint: inacessível');
      }

      // Validate checkout URLs
      let urlsValid = true;
      for (const p of plansWithKiwify) {
        const url = (p as any).kiwify_checkout_url;
        if (url && !url.startsWith('https://')) {
          urlsValid = false;
          details.push(`⚠️ URL inválida no plano: ${(p as any).name}`);
        }
      }
      if (urlsValid && plansWithKiwify.length > 0) {
        details.push('URLs de checkout: válidas');
      }

      const connected = hasAnyConfig && webhookOk;

      setKiwifyStatus({
        connected,
        message: connected 
          ? 'Conectado' 
          : !hasAnyConfig 
            ? 'Nenhum plano configurado' 
            : 'Configuração incompleta',
        details,
        checking: false,
      });
    } catch {
      setKiwifyStatus({
        connected: false,
        message: 'Erro ao verificar',
        checking: false,
      });
    }
  }, [plans]);

  const saveMutation = useMutation({
    mutationFn: async (newSettings: GatewaySettings) => {
      const { data: existing } = await supabase
        .from('platform_settings')
        .select('id')
        .eq('key', 'payment_gateway')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('platform_settings')
          .update({ value: newSettings as unknown as Record<string, never>, updated_at: new Date().toISOString() })
          .eq('key', 'payment_gateway');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('platform_settings')
          .insert([{
            key: 'payment_gateway',
            description: 'Configuração dos gateways de pagamento da plataforma',
            value: newSettings as unknown as Record<string, never>,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform_settings', 'payment_gateway'] });
      toast.success('Configuração de gateway salva com sucesso!');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const current = settings ?? DEFAULT_SETTINGS;

  const handleToggle = (gateway: 'stripe' | 'kiwify', enabled: boolean) => {
    const updated = { ...current, [`${gateway}_enabled`]: enabled };
    if (!enabled && current.default_gateway === gateway) {
      const other = gateway === 'stripe' ? 'kiwify' : 'stripe';
      if (updated[`${other}_enabled` as keyof GatewaySettings]) {
        updated.default_gateway = other;
      }
    }
    if (!updated.stripe_enabled && !updated.kiwify_enabled) {
      toast.error('Pelo menos um gateway deve estar ativo.');
      return;
    }
    saveMutation.mutate(updated);
  };

  const handleDefaultChange = (value: string) => {
    const gateway = value as 'stripe' | 'kiwify';
    if (!current[`${gateway}_enabled` as keyof GatewaySettings]) {
      toast.error('Ative o gateway antes de defini-lo como padrão.');
      return;
    }
    saveMutation.mutate({ ...current, default_gateway: gateway });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const StatusIcon = ({ status }: { status: ConnectionStatus }) => {
    if (status.checking) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    if (status.message === 'Não verificado') return <WifiOff className="h-5 w-5 text-muted-foreground" />;
    if (status.connected) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-destructive" />;
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card className="border-2 border-dashed">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-primary" />
                Status de Conexão dos Gateways
              </CardTitle>
              <CardDescription>
                Verifique se os gateways estão corretamente configurados e acessíveis
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { checkStripeConnection(); checkKiwifyConnection(); }}
              disabled={stripeStatus.checking || kiwifyStatus.checking}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(stripeStatus.checking || kiwifyStatus.checking) ? 'animate-spin' : ''}`} />
              Testar Conexões
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Stripe Status */}
            <div className={`rounded-xl border-2 p-4 space-y-3 transition-colors ${
              stripeStatus.connected ? 'border-green-500/40 bg-green-500/5' : 
              stripeStatus.message === 'Não verificado' ? 'border-muted' : 'border-destructive/40 bg-destructive/5'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Stripe</p>
                    <p className="text-xs text-muted-foreground">Gateway Internacional</p>
                  </div>
                </div>
                <StatusIcon status={stripeStatus} />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={stripeStatus.connected ? 'default' : stripeStatus.message === 'Não verificado' ? 'secondary' : 'destructive'}>
                  {stripeStatus.message}
                </Badge>
              </div>
              {stripeStatus.details && stripeStatus.details.length > 0 && (
                <ul className="text-xs text-muted-foreground space-y-1">
                  {stripeStatus.details.map((d, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              )}
              <Button variant="ghost" size="sm" onClick={checkStripeConnection} disabled={stripeStatus.checking} className="w-full">
                {stripeStatus.checking ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                Testar Stripe
              </Button>
            </div>

            {/* Kiwify Status */}
            <div className={`rounded-xl border-2 p-4 space-y-3 transition-colors ${
              kiwifyStatus.connected ? 'border-green-500/40 bg-green-500/5' : 
              kiwifyStatus.message === 'Não verificado' ? 'border-muted' : 'border-destructive/40 bg-destructive/5'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <ShoppingCart className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Kiwify</p>
                    <p className="text-xs text-muted-foreground">Gateway Nacional</p>
                  </div>
                </div>
                <StatusIcon status={kiwifyStatus} />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={kiwifyStatus.connected ? 'default' : kiwifyStatus.message === 'Não verificado' ? 'secondary' : 'destructive'}>
                  {kiwifyStatus.message}
                </Badge>
              </div>
              {kiwifyStatus.details && kiwifyStatus.details.length > 0 && (
                <ul className="text-xs text-muted-foreground space-y-1">
                  {kiwifyStatus.details.map((d, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              )}
              <Button variant="ghost" size="sm" onClick={checkKiwifyConnection} disabled={kiwifyStatus.checking} className="w-full">
                {kiwifyStatus.checking ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                Testar Kiwify
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Gateways de Pagamento
          </CardTitle>
          <CardDescription>
            Ative os gateways disponíveis e defina qual será o prioritário no checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Gateway toggles */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Stripe */}
            <Card className={`border-2 transition-colors ${current.stripe_enabled ? 'border-primary' : 'border-muted'}`}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Stripe</p>
                      <p className="text-xs text-muted-foreground">Crédito internacional, Apple Pay, Google Pay</p>
                    </div>
                  </div>
                  <Switch
                    checked={current.stripe_enabled}
                    onCheckedChange={(v) => handleToggle('stripe', v)}
                    disabled={saveMutation.isPending}
                  />
                </div>
                {current.default_gateway === 'stripe' && current.stripe_enabled && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <Check className="h-3 w-3 mr-1" /> Gateway Padrão
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Kiwify */}
            <Card className={`border-2 transition-colors ${current.kiwify_enabled ? 'border-green-500' : 'border-muted'}`}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <ShoppingCart className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Kiwify</p>
                      <p className="text-xs text-muted-foreground">PIX, Boleto ou Cartão</p>
                    </div>
                  </div>
                  <Switch
                    checked={current.kiwify_enabled}
                    onCheckedChange={(v) => handleToggle('kiwify', v)}
                    disabled={saveMutation.isPending}
                  />
                </div>
                {current.default_gateway === 'kiwify' && current.kiwify_enabled && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    <Check className="h-3 w-3 mr-1" /> Gateway Padrão
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Default gateway selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Gateway Prioritário no Checkout</Label>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              O gateway padrão aparece pré-selecionado na tela de pagamento. Se ambos estiverem ativos, o cliente pode escolher.
            </p>
            <RadioGroup
              value={current.default_gateway}
              onValueChange={handleDefaultChange}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="stripe" id="default-stripe" disabled={!current.stripe_enabled} />
                <Label htmlFor="default-stripe" className={!current.stripe_enabled ? 'text-muted-foreground' : ''}>
                  Stripe
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="kiwify" id="default-kiwify" disabled={!current.kiwify_enabled} />
                <Label htmlFor="default-kiwify" className={!current.kiwify_enabled ? 'text-muted-foreground' : ''}>
                  Kiwify
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Status summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo da Configuração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Stripe</span>
              <div className="flex items-center gap-2">
                {stripeStatus.connected && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                <Badge variant={current.stripe_enabled ? 'default' : 'secondary'}>
                  {current.stripe_enabled ? 'Ativo' : 'Desativado'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Kiwify</span>
              <div className="flex items-center gap-2">
                {kiwifyStatus.connected && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                <Badge variant={current.kiwify_enabled ? 'default' : 'secondary'}>
                  {current.kiwify_enabled ? 'Ativo' : 'Desativado'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Gateway Padrão</span>
              <Badge variant="outline" className="capitalize">{current.default_gateway}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Comportamento no Checkout</span>
              <span className="text-muted-foreground">
                {current.stripe_enabled && current.kiwify_enabled
                  ? 'Cliente escolhe (padrão: ' + current.default_gateway + ')'
                  : current.stripe_enabled
                    ? 'Apenas Stripe'
                    : 'Apenas Kiwify'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
