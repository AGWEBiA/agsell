import React, { useState, useEffect } from 'react';
import { WhatsAppFloatingButton } from '@/components/vendas/WhatsAppFloatingButton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Check, Crown, Zap, Users, Mail, MessageSquare, Bot, FileText, Loader2, ArrowRight, Shield, CreditCard,
  BarChart3, Target, Workflow, Globe, Clock, Sparkles, Phone, Calendar, Inbox, PieChart, Tag, Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link, useSearchParams } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { CompetitorComparison } from '@/components/pricing/CompetitorComparison';

// Features do sistema
const SYSTEM_FEATURES = [
  {
    icon: Users,
    title: 'CRM Completo',
    description: 'Gerencie contatos, empresas e negociações em um só lugar com visão 360° do cliente.'
  },
  {
    icon: Target,
    title: 'Pipeline de Vendas',
    description: 'Visualize e gerencie todo seu funil de vendas com drag & drop intuitivo.'
  },
  {
    icon: Bot,
    title: 'Automações Inteligentes',
    description: 'Automatize tarefas repetitivas, follow-ups e nutrição de leads automaticamente.'
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Integrado',
    description: 'Envie mensagens, receba notificações e gerencie conversas diretamente no CRM.'
  },
  {
    icon: Mail,
    title: 'E-mail Marketing',
    description: 'Crie campanhas, templates personalizados e acompanhe métricas de engajamento.'
  },
  {
    icon: BarChart3,
    title: 'Analytics Avançado',
    description: 'Dashboards em tempo real com métricas de vendas, conversão e performance.'
  },
  {
    icon: Sparkles,
    title: 'Lead Scoring',
    description: 'Pontue leads automaticamente e foque nos contatos com maior potencial.'
  },
  {
    icon: FileText,
    title: 'Formulários Web',
    description: 'Capture leads com formulários personalizados integrados ao seu site.'
  },
  {
    icon: Calendar,
    title: 'Gestão de Tarefas',
    description: 'Organize atividades, defina prioridades e nunca perca um follow-up.'
  },
  {
    icon: Inbox,
    title: 'Inbox Unificada',
    description: 'Todas as conversas de e-mail e WhatsApp centralizadas em uma só tela.'
  },
  {
    icon: Globe,
    title: 'API & Integrações',
    description: 'Conecte com outras ferramentas via API REST ou webhooks customizados.'
  },
  {
    icon: Clock,
    title: 'Histórico Completo',
    description: 'Timeline de atividades com todo o histórico de interações com cada contato.'
  },
];

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_contacts: number;
  max_emails_per_month: number;
  max_whatsapp_messages: number;
  max_automations: number;
  max_forms: number;
  max_ai_requests_per_month: number;
  features: string[];
  kiwify_checkout_url?: string | null;
}

const FEATURE_LABELS: Record<string, string> = {
  crm_basico: 'CRM Básico',
  pipeline: 'Pipeline de Vendas',
  tarefas: 'Gestão de Tarefas',
  automacoes: 'Automações',
  email_marketing: 'E-mail Marketing',
  analytics: 'Analytics Avançado',
  lead_scoring: 'Lead Scoring',
  whatsapp: 'WhatsApp Business',
  integrações: 'Integrações',
  api: 'API Pública',
  white_label: 'White Label',
  suporte_prioritario: 'Suporte Prioritário',
};

function PricingCard({ 
  plan, 
  billingCycle, 
  onSelect 
}: { 
  plan: Plan; 
  billingCycle: 'monthly' | 'yearly';
  onSelect: () => void;
}) {
  const isPro = plan.slug === 'professional';
  const isEnterprise = plan.slug === 'enterprise';
  const isFree = plan.price_monthly === 0;
  
  const price = billingCycle === 'monthly' ? plan.price_monthly : Math.round(plan.price_yearly / 12);
  const totalPrice = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

  return (
    <Card className={cn(
      'relative transition-all hover:shadow-xl hover:-translate-y-1 duration-300 flex flex-col',
      isPro && 'border-primary border-2 shadow-lg lg:scale-105',
    )}>
      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs whitespace-nowrap">
            <Zap className="h-3 w-3 mr-1" />
            Mais Popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-2 pt-7 px-4 sm:px-6">
        {isEnterprise && <Crown className="h-9 w-9 mx-auto mb-2 text-yellow-500" />}
        <CardTitle className="text-xl sm:text-2xl">{plan.name}</CardTitle>
        <CardDescription className="text-sm sm:text-base line-clamp-2 min-h-[40px]">{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="text-center px-4 sm:px-6 flex-1 flex flex-col">
        <div className="mb-5">
          {isFree ? (
            <span className="text-4xl sm:text-5xl font-bold">Grátis</span>
          ) : (
            <>
              <span className="text-4xl sm:text-5xl font-bold">R$ {price}</span>
              <span className="text-muted-foreground text-base sm:text-lg">/mês</span>
            </>
          )}
        </div>

        {!isFree && billingCycle === 'yearly' && (
          <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mb-4 font-medium">
            Cobrado R$ {totalPrice}/ano (economize 17%)
          </p>
        )}

        <div className="space-y-2.5 text-left mb-5">
          <div className="flex items-center gap-2.5 text-sm">
            <Users className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{plan.max_users === -1 ? 'Usuários ilimitados' : `${plan.max_users} usuário${plan.max_users > 1 ? 's' : ''}`}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <Users className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{plan.max_contacts === -1 ? 'Contatos ilimitados' : `${plan.max_contacts.toLocaleString()} contatos`}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <Mail className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{plan.max_emails_per_month === -1 ? 'E-mails ilimitados' : `${plan.max_emails_per_month.toLocaleString()} e-mails/mês`}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <MessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
            <span>WhatsApp ilimitado</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <Bot className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{plan.max_automations === -1 ? 'Automações ilimitadas' : `${plan.max_automations} automações`}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <Brain className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{plan.max_ai_requests_per_month === -1 ? 'IA ilimitada' : `${plan.max_ai_requests_per_month.toLocaleString()} req. IA/mês`}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <FileText className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{plan.max_forms === -1 ? 'Formulários ilimitados' : `${plan.max_forms} formulários`}</span>
          </div>
        </div>

        <div className="pt-4 border-t space-y-2 mt-auto">
          {(plan.features || []).map((feature) => (
            <div key={feature} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-left">{FEATURE_LABELS[feature] || feature}</span>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="pb-6 px-4 sm:px-6">
        <Button 
          className={cn(
            "w-full h-11 sm:h-12 text-sm sm:text-base",
            isPro && "bg-primary hover:bg-primary/90"
          )}
          variant={isPro ? 'default' : 'outline'}
          onClick={onSelect}
        >
          {isFree ? 'Começar' : 'Assinar Agora'}
          <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

interface CheckoutFormData {
  name: string;
  email: string;
  organizationName: string;
  couponCode: string;
  paymentProvider: 'stripe' | 'kiwify';
}

function GuestCheckoutDialog({ 
  plan, 
  billingCycle,
  open, 
  onOpenChange 
}: { 
  plan: Plan | null; 
  billingCycle: 'monthly' | 'yearly';
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '',
    email: '',
    organizationName: '',
    couponCode: '',
    paymentProvider: 'stripe',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showCouponField, setShowCouponField] = useState(false);

  if (!plan) return null;

  const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
  const isFree = plan.price_monthly === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.organizationName) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      if (formData.paymentProvider === 'kiwify') {
        // Kiwify checkout
        const { data, error } = await supabase.functions.invoke('create-kiwify-checkout', {
          body: {
            planId: plan.id,
            billingCycle,
            name: formData.name,
            email: formData.email,
            organizationName: formData.organizationName,
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
        // Stripe checkout (original flow)
        const { data, error } = await supabase.functions.invoke('guest-checkout', {
          body: {
            planId: plan.id,
            billingCycle,
            name: formData.name,
            email: formData.email,
            organizationName: formData.organizationName,
            couponCode: formData.couponCode || undefined,
          },
        });

        if (error) throw error;

        if (data?.url) {
          window.location.href = data.url;
        } else if (data?.success) {
          toast.success('Conta criada! Verifique seu e-mail para as credenciais de acesso.');
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Erro ao processar. Tente novamente.');
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
            {isFree ? 'Criar Conta Gratuita' : `Assinar ${plan.name}`}
          </DialogTitle>
          <DialogDescription>
            {isFree 
              ? 'Preencha seus dados para criar sua conta gratuita' 
              : 'Preencha seus dados para continuar com o pagamento'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Seu Nome</Label>
            <Input
              id="name"
              placeholder="João Silva"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="joao@empresa.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizationName">Nome da Empresa/Organização</Label>
            <Input
              id="organizationName"
              placeholder="Minha Empresa LTDA"
              value={formData.organizationName}
              onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
              required
            />
          </div>

          {!isFree && (
            <>
              {/* Payment Provider Selection */}
              {plan.kiwify_checkout_url && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Forma de Pagamento</Label>
                  <RadioGroup
                    value={formData.paymentProvider}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, paymentProvider: v as 'stripe' | 'kiwify' }))}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div className="relative">
                      <RadioGroupItem value="stripe" id="guest-pay-stripe" className="peer sr-only" />
                      <Label
                        htmlFor="guest-pay-stripe"
                        className="flex flex-col items-center gap-1 rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <CreditCard className="h-5 w-5" />
                        <span className="text-sm font-medium">Stripe</span>
                        <span className="text-xs text-muted-foreground">Crédito internacional</span>
                      </Label>
                    </div>
                    <div className="relative">
                      <RadioGroupItem value="kiwify" id="guest-pay-kiwify" className="peer sr-only" />
                      <Label
                        htmlFor="guest-pay-kiwify"
                        className="flex flex-col items-center gap-1 rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <span className="text-lg font-bold text-primary">K</span>
                        <span className="text-sm font-medium">Kiwify</span>
                        <span className="text-xs text-muted-foreground">PIX, Boleto ou Cartão</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Coupon Field (only for Stripe) */}
              {formData.paymentProvider === 'stripe' && (
                <>
                  {!showCouponField ? (
                    <button
                      type="button"
                      onClick={() => setShowCouponField(true)}
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Tag className="h-3 w-3" />
                      Tenho um cupom de desconto
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="couponCode">Cupom de Desconto</Label>
                      <Input
                        id="couponCode"
                        placeholder="Digite o código do cupom"
                        value={formData.couponCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        O desconto será aplicado na próxima etapa
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{plan.name}</span>
                  <span className="font-bold">
                    R$ {price}/{billingCycle === 'monthly' ? 'mês' : 'ano'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {billingCycle === 'yearly' 
                    ? 'Cobrança anual com 17% de desconto' 
                    : 'Cobrança mensal recorrente'
                  }
                </p>
              </div>
            </>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            {isFree 
              ? 'Seus dados estão protegidos' 
              : `Pagamento seguro processado ${formData.paymentProvider === 'kiwify' ? 'pela Kiwify' : 'pelo Stripe'}`
            }
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isFree ? 'Criar Conta' : 'Continuar para Pagamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Pricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from('plans_public' as any)
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) {
        console.error('Error fetching plans:', error);
        toast.error('Erro ao carregar planos');
      } else {
        setPlans(((data as any[]) || [])
          .filter((p: any) => p.is_active === true)
          .map((p: any) => ({
            ...p,
            features: Array.isArray(p.features) ? p.features as string[] : [],
            price_monthly: p.price_monthly || 0,
            price_yearly: p.price_yearly || 0,
            max_users: p.max_users || 1,
            max_contacts: p.max_contacts || 100,
            max_emails_per_month: p.max_emails_per_month || 500,
            max_whatsapp_messages: p.max_whatsapp_messages || 100,
            max_automations: p.max_automations || 5,
            max_forms: p.max_forms || 3,
            max_ai_requests_per_month: (p as any).max_ai_requests_per_month || 0,
            kiwify_checkout_url: (p as any).kiwify_checkout_url || null,
          })));
      }
      setIsLoading(false);
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Pagamento confirmado! Verifique seu e-mail para as credenciais de acesso.');
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Pagamento cancelado.');
    }
  }, [searchParams]);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo variant="red" size="md" showText />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button>Criar Conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge variant="secondary" className="mb-4">
          <Zap className="h-3 w-3 mr-1" />
          CRM & Automação de Vendas
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Transforme leads em <span className="text-primary">clientes fiéis</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Plataforma completa de CRM com automações inteligentes, WhatsApp integrado, 
          e-mail marketing e analytics para acelerar suas vendas.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500" />
            <span>Setup em 2 minutos</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500" />
            <span>Suporte humanizado</span>
          </div>
        </div>
      </section>

      {/* Pricing Section Header */}
      <section className="container mx-auto px-4 pb-8 text-center">
        <Badge variant="secondary" className="mb-4">
          <PieChart className="h-3 w-3 mr-1" />
          Planos & Preços
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Escolha o plano ideal para seu <span className="text-primary">negócio</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Escolha o plano ideal e escale conforme sua equipe cresce
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center gap-4 bg-muted p-1 rounded-full">
          <button
            className={cn(
              "px-6 py-2 rounded-full transition-all",
              billingCycle === 'monthly' 
                ? "bg-background shadow-sm font-medium" 
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setBillingCycle('monthly')}
          >
            Mensal
          </button>
          <button
            className={cn(
              "px-6 py-2 rounded-full transition-all flex items-center gap-2",
              billingCycle === 'yearly' 
                ? "bg-background shadow-sm font-medium" 
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setBillingCycle('yearly')}
          >
            Anual
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              -17%
            </Badge>
          </button>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-20 pt-6">
        <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              onSelect={() => handleSelectPlan(plan)}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Recursos Poderosos
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tudo que você precisa para <span className="text-primary">vender mais</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa de CRM e automação de vendas para impulsionar seus resultados
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto">
          {SYSTEM_FEATURES.map((feature, index) => (
            <Card key={index} className="border bg-card/50 hover:bg-card hover:shadow-md transition-all">
              <CardContent className="pt-5 sm:pt-6 px-5 sm:px-6">
                <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="container mx-auto px-4 pb-20">
        <CompetitorComparison />
      </section>

      {/* Trust Badges */}
      <section className="container mx-auto px-4 pb-20">
        <div className="flex flex-wrap justify-center gap-8 text-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-5 w-5" />
            <span>Pagamento 100% seguro</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Check className="h-5 w-5" />
            <span>Cancele quando quiser</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-5 w-5" />
            <span>Suporte por e-mail</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} AG Sell. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Checkout Dialog */}
      <GuestCheckoutDialog
        plan={selectedPlan}
        billingCycle={billingCycle}
        open={showCheckout}
        onOpenChange={setShowCheckout}
      />
      <WhatsAppFloatingButton />
    </div>
  );
}
