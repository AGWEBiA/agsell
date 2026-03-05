import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, ShoppingCart, Loader2, Check, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GatewaySettings {
  stripe_enabled: boolean;
  kiwify_enabled: boolean;
  default_gateway: 'stripe' | 'kiwify';
}

const DEFAULT_SETTINGS: GatewaySettings = {
  stripe_enabled: true,
  kiwify_enabled: false,
  default_gateway: 'stripe',
};

export function PaymentGatewayConfig() {
  const queryClient = useQueryClient();

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
    // If disabling the default gateway, switch default to the other
    if (!enabled && current.default_gateway === gateway) {
      const other = gateway === 'stripe' ? 'kiwify' : 'stripe';
      if (updated[`${other}_enabled` as keyof GatewaySettings]) {
        updated.default_gateway = other;
      }
    }
    // At least one must be enabled
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

  return (
    <div className="space-y-6">
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
                      <p className="text-xs text-muted-foreground">Cartão internacional, Apple Pay, Google Pay</p>
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
                      <p className="text-xs text-muted-foreground">PIX, Boleto, Cartão nacional</p>
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
              <Badge variant={current.stripe_enabled ? 'default' : 'secondary'}>
                {current.stripe_enabled ? 'Ativo' : 'Desativado'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Kiwify</span>
              <Badge variant={current.kiwify_enabled ? 'default' : 'secondary'}>
                {current.kiwify_enabled ? 'Ativo' : 'Desativado'}
              </Badge>
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
