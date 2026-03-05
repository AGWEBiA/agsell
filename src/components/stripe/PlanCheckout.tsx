import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Loader2, Check, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  kiwify_checkout_url?: string | null;
  kiwify_checkout_url_yearly?: string | null;
}

interface PlanCheckoutProps {
  plan: Plan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PaymentProvider = 'stripe' | 'kiwify';

export function PlanCheckout({ plan, open, onOpenChange }: PlanCheckoutProps) {
  const { currentOrganization } = useOrganization();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  // Read platform gateway settings
  const { data: gatewaySettings } = useQuery({
    queryKey: ['platform_settings', 'payment_gateway'],
    queryFn: async () => {
      const { data } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'payment_gateway')
        .maybeSingle();
      return data?.value as { stripe_enabled: boolean; kiwify_enabled: boolean; default_gateway: 'stripe' | 'kiwify' } | null;
    },
    enabled: open,
  });

  const stripeEnabled = gatewaySettings?.stripe_enabled ?? true;
  const kiwifyEnabled = gatewaySettings?.kiwify_enabled ?? false;
  const defaultGateway = gatewaySettings?.default_gateway ?? 'stripe';

  const hasKiwifyUrls = !!(plan.kiwify_checkout_url || plan.kiwify_checkout_url_yearly);
  const showStripe = stripeEnabled;
  const showKiwify = kiwifyEnabled && hasKiwifyUrls;
  const showProviderSelection = showStripe && showKiwify;

  // Determine initial provider based on platform config
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>(defaultGateway);
  // Update when settings load
  React.useEffect(() => {
    if (gatewaySettings) {
      if (gatewaySettings.default_gateway === 'kiwify' && showKiwify) {
        setPaymentProvider('kiwify');
      } else if (gatewaySettings.default_gateway === 'stripe' && showStripe) {
        setPaymentProvider('stripe');
      }
    }
  }, [gatewaySettings, showKiwify, showStripe]);

  const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
  const monthlyEquivalent = billingCycle === 'yearly' ? plan.price_yearly / 12 : plan.price_monthly;
  const savings = billingCycle === 'yearly' ? (plan.price_monthly * 12) - plan.price_yearly : 0;

  const handleCheckout = async () => {
    if (!currentOrganization) {
      toast.error('Organização não encontrada');
      return;
    }

    setIsLoading(true);
    try {
      if (paymentProvider === 'kiwify') {
        const { data, error } = await supabase.functions.invoke('create-kiwify-checkout', {
          body: {
            planId: plan.id,
            billingCycle,
          },
        });
        if (error) throw error;
        if (data?.url) {
          window.open(data.url, '_blank');
          toast.info('Você será redirecionado para a Kiwify para completar o pagamento.');
          onOpenChange(false);
        } else {
          throw new Error(data?.error || 'Erro ao gerar link Kiwify');
        }
      } else {
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: {
            organizationId: currentOrganization.id,
            planId: plan.id,
            billingCycle,
          },
        });
        if (error) throw error;
        if (data?.url) {
          window.location.href = data.url;
        } else {
          toast.success('Plano atualizado com sucesso!');
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Erro ao processar pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Assinar {plan.name}
          </DialogTitle>
          <DialogDescription>
            Selecione o ciclo de cobrança e forma de pagamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Billing Cycle Selection */}
          <RadioGroup 
            value={billingCycle} 
            onValueChange={(v) => setBillingCycle(v as 'monthly' | 'yearly')}
            className="grid grid-cols-2 gap-4"
          >
            <div className="relative">
              <RadioGroupItem value="monthly" id="monthly" className="peer sr-only" />
              <Label
                htmlFor="monthly"
                className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <span className="text-sm font-medium">Mensal</span>
                <span className="text-2xl font-bold mt-2">
                  R$ {plan.price_monthly.toFixed(0)}
                </span>
                <span className="text-xs text-muted-foreground">/mês</span>
              </Label>
            </div>

            <div className="relative">
              <RadioGroupItem value="yearly" id="yearly" className="peer sr-only" />
              <Label
                htmlFor="yearly"
                className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                {savings > 0 && (
                  <Badge className="absolute -top-2 right-2 bg-green-500">
                    Economize R${savings.toFixed(0)}
                  </Badge>
                )}
                <span className="text-sm font-medium">Anual</span>
                <span className="text-2xl font-bold mt-2">
                  R$ {monthlyEquivalent.toFixed(0)}
                </span>
                <span className="text-xs text-muted-foreground">/mês (cobrado anualmente)</span>
              </Label>
            </div>
          </RadioGroup>

          {/* Payment Provider Selection */}
          {showProviderSelection && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Forma de Pagamento</Label>
              <RadioGroup
                value={paymentProvider}
                onValueChange={(v) => setPaymentProvider(v as PaymentProvider)}
                className="grid grid-cols-2 gap-3"
              >
                <div className="relative">
                  <RadioGroupItem value="stripe" id="pay-stripe" className="peer sr-only" />
                  <Label
                    htmlFor="pay-stripe"
                    className="flex flex-col items-center gap-2 rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span className="text-sm font-medium">Cartão / Stripe</span>
                    <span className="text-xs text-muted-foreground">Crédito internacional</span>
                  </Label>
                </div>

                <div className="relative">
                  <RadioGroupItem value="kiwify" id="pay-kiwify" className="peer sr-only" />
                  <Label
                    htmlFor="pay-kiwify"
                    className="flex flex-col items-center gap-2 rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <span className="text-lg font-bold text-green-600">K</span>
                    <span className="text-sm font-medium">Kiwify</span>
                    <span className="text-xs text-muted-foreground">PIX, Boleto, Cartão</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Features */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-3">Incluso no plano:</p>
            <ul className="space-y-2">
              {(plan.features || []).slice(0, 5).map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Security Note */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            Pagamento seguro processado {paymentProvider === 'kiwify' ? 'pela Kiwify' : 'pelo Stripe'}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCheckout} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assinar por R$ {price.toFixed(0)}/{billingCycle === 'monthly' ? 'mês' : 'ano'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
