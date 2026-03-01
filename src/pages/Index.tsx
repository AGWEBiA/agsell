import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Logo } from '@/components/ui/Logo';
import { CompetitorComparison } from '@/components/pricing/CompetitorComparison';
import {
  ArrowRight, Check, Users, Target, Bot, MessageSquare, Mail, BarChart3,
  Sparkles, FileText, Calendar, Inbox, Globe, Clock, Zap, Shield,
  Phone, Star, TrendingUp, Layers, Award, ChevronRight, Crown, Brain, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import heroDashboard from '@/assets/hero-dashboard.png';

// ─── Hero ───────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              CRM + WhatsApp + IA em uma única plataforma
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95] mb-6">
              Venda mais.
              <br />
              <span className="text-primary">Pense menos.</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
              O CRM que une WhatsApp nativo, automações e agentes de IA para sua equipe
              fechar mais negócios — com menos esforço.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-3">
              <Link to="/pricing">
                <Button size="lg" className="h-12 sm:h-14 px-8 sm:px-10 text-sm sm:text-base font-semibold rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all w-full sm:w-auto">
                  Começar agora
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="ghost" className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base rounded-full text-muted-foreground hover:text-foreground w-full sm:w-auto">
                  Ver planos
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-border/40 bg-card">
              <img
                src={heroDashboard}
                alt="Painel do AG Sell CRM mostrando pipeline de vendas, analytics e integrações"
                className="w-full h-auto"
                loading="eager"
              />
            </div>
            {/* Decorative blobs */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Stats ──────────────────────────────────────────────────
const STATS = [
  { value: '10k+', label: 'Leads gerenciados' },
  { value: '50%', label: 'Mais conversões' },
  { value: '3x', label: 'Mais produtividade' },
  { value: '24/7', label: 'IA trabalhando por você' },
];

function StatsBar() {
  return (
    <section className="border-y border-border/40">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/40">
          {STATS.map((s, i) => (
            <div key={i} className="py-8 md:py-12 text-center px-3">
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-1">{s.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Differentials – Bento Grid ─────────────────────────────
const DIFFERENTIALS = [
  {
    icon: MessageSquare,
    title: 'WhatsApp Nativo',
    description: 'Múltiplos números via QR Code. Campanhas em massa, grupos e flows interativos — direto no CRM.',
    span: 'md:col-span-2',
  },
  {
    icon: Bot,
    title: 'Agentes IA com RAG',
    description: 'IA que acessa sua base de conhecimento, qualifica leads e transfere para humanos automaticamente.',
    span: '',
  },
  {
    icon: Layers,
    title: 'Modo Agência',
    description: 'Multi-tenant com dados isolados e troca rápida de conta.',
    span: '',
  },
  {
    icon: Award,
    title: 'Gamificação de Vendas',
    description: 'Rankings, conquistas e pontuação para motivar sua equipe.',
    span: '',
  },
  {
    icon: Inbox,
    title: 'Inbox Omnichannel',
    description: 'WhatsApp, e-mail e Instagram DM em uma única tela com CSAT e transcrição de áudio.',
    span: 'md:col-span-2',
  },
];

function DifferentialsSection() {
  return (
    <section className="container mx-auto px-4 sm:px-6 py-16 md:py-24">
      <div className="max-w-xl mb-12">
        <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase">Diferenciais</p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Por que escolher a AG Sell?
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg">
          Recursos exclusivos que nenhum outro CRM oferece.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {DIFFERENTIALS.map((d, i) => (
          <div
            key={i}
            className={cn(
              'group relative rounded-2xl border border-border/50 bg-card p-6 sm:p-8 hover:border-primary/30 transition-all duration-300',
              d.span
            )}
          >
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
              <d.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
            </div>
            <h3 className="font-semibold text-base sm:text-lg mb-2">{d.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{d.description}</p>
            <Badge variant="outline" className="mt-4 text-[10px] text-primary border-primary/20">
              Exclusivo
            </Badge>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Features ───────────────────────────────────────────────
const FEATURES_LEFT = [
  { icon: Users, title: 'CRM Completo' },
  { icon: Target, title: 'Pipeline Kanban' },
  { icon: Mail, title: 'E-mail Marketing' },
  { icon: BarChart3, title: 'Analytics em Tempo Real' },
  { icon: FileText, title: 'Formulários Web' },
  { icon: Calendar, title: 'Gestão de Tarefas' },
];

const FEATURES_RIGHT = [
  { icon: Globe, title: 'API & Webhooks' },
  { icon: Clock, title: 'Histórico Completo' },
  { icon: Phone, title: 'Instagram DM' },
  { icon: Shield, title: 'Permissões Granulares' },
  { icon: Sparkles, title: 'Assistente IA' },
  { icon: Star, title: 'CSAT Integrado' },
];

function FeaturesSection() {
  return (
    <section className="bg-muted/20 border-y border-border/40">
      <div className="container mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase">Plataforma Completa</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Tudo em um só lugar
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto">
            Substitua 5 ferramentas diferentes por uma única plataforma.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-0 max-w-3xl mx-auto divide-y sm:divide-y-0 sm:divide-x divide-border/40">
          <div className="space-y-0">
            {FEATURES_LEFT.map((f, i) => (
              <div key={i} className="flex items-center gap-4 py-3 sm:py-4 px-4 sm:px-6 group hover:bg-card/60 transition-colors">
                <f.icon className="h-5 w-5 text-primary shrink-0" />
                <span className="font-medium text-sm">{f.title}</span>
              </div>
            ))}
          </div>
          <div className="space-y-0">
            {FEATURES_RIGHT.map((f, i) => (
              <div key={i} className="flex items-center gap-4 py-3 sm:py-4 px-4 sm:px-6 group hover:bg-card/60 transition-colors">
                <f.icon className="h-5 w-5 text-primary shrink-0" />
                <span className="font-medium text-sm">{f.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Plans Section ──────────────────────────────────────────
interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_contacts: number;
  max_ai_requests_per_month: number;
  features: string[];
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

function PlansSection() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (!error && data) {
        setPlans(data.map(p => ({
          ...p,
          features: Array.isArray(p.features) ? p.features as string[] : [],
          price_monthly: p.price_monthly || 0,
          price_yearly: p.price_yearly || 0,
          max_users: p.max_users || 1,
          max_contacts: p.max_contacts || 100,
          max_ai_requests_per_month: (p as any).max_ai_requests_per_month || 0,
        })));
      }
      setIsLoading(false);
    };
    fetchPlans();
  }, []);

  return (
    <section className="container mx-auto px-4 sm:px-6 py-16 md:py-24">
      <div className="text-center mb-12">
        <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase">Planos</p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Escolha o plano ideal
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto mb-8">
          Comece a transformar seus resultados hoje mesmo.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center rounded-full border border-border/60 bg-card p-1 mb-10">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              'px-5 py-2 rounded-full text-sm font-medium transition-all',
              billingCycle === 'monthly' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={cn(
              'px-5 py-2 rounded-full text-sm font-medium transition-all',
              billingCycle === 'yearly' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Anual
            <Badge className="ml-2 bg-green-500/10 text-green-600 border-0 text-[10px]">-17%</Badge>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Planos sendo configurados. Visite a <Link to="/pricing" className="text-primary underline">página de preços</Link> para mais detalhes.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isPro = plan.slug === 'professional';
            const price = billingCycle === 'monthly' ? plan.price_monthly : Math.round(plan.price_yearly / 12);

            return (
              <Card key={plan.id} className={cn(
                'relative transition-all hover:shadow-lg hover:-translate-y-1 duration-300',
                isPro && 'border-primary border-2 shadow-md lg:scale-105',
              )}>
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2 pt-6">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {plan.description && (
                    <CardDescription className="text-xs">{plan.description}</CardDescription>
                  )}
                </CardHeader>

                <CardContent className="text-center">
                  <div className="mb-4">
                    {plan.price_monthly === 0 ? (
                      <span className="text-3xl font-bold">Grátis</span>
                    ) : (
                      <>
                        <span className="text-3xl sm:text-4xl font-bold">R$ {price}</span>
                        <span className="text-muted-foreground text-sm">/mês</span>
                      </>
                    )}
                  </div>

                  <div className="space-y-2 text-left text-xs">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary shrink-0" />
                      <span>{plan.max_users === -1 ? 'Ilimitados' : `${plan.max_users} usuário${plan.max_users > 1 ? 's' : ''}`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary shrink-0" />
                      <span>{plan.max_contacts === -1 ? 'Contatos ilimitados' : `${plan.max_contacts.toLocaleString()} contatos`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary shrink-0" />
                      <span>{plan.max_ai_requests_per_month === -1 ? 'IA ilimitada' : `${plan.max_ai_requests_per_month.toLocaleString()} req. IA/mês`}</span>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-border/40 space-y-1.5 text-left">
                    {(plan.features || []).slice(0, 5).map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-xs">
                        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        <span>{FEATURE_LABELS[feature] || feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="pb-6">
                  <Link to="/pricing" className="w-full">
                    <Button
                      className="w-full h-10 text-sm"
                      variant={isPro ? 'default' : 'outline'}
                    >
                      {plan.price_monthly === 0 ? 'Começar' : 'Assinar'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Testimonials ───────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: 'Marcos Silva',
    role: 'CEO, Digital Solutions',
    text: 'A AG Sell transformou nosso processo de vendas. O WhatsApp integrado e os agentes de IA nos fizeram converter 50% mais leads.',
  },
  {
    name: 'Ana Beatriz Costa',
    role: 'Gerente Comercial, TechStart',
    text: 'Testei ActiveCampaign, RD Station e HubSpot. Nenhuma tem o WhatsApp nativo e a gamificação que a AG Sell oferece.',
  },
  {
    name: 'Ricardo Mendes',
    role: 'Fundador, Agência Scale',
    text: 'O modo agência é fantástico. Gerencio 12 clientes com dados isolados e tudo centralizado.',
  },
];

function TestimonialsSection() {
  return (
    <section className="bg-muted/20 border-y border-border/40">
      <div className="container mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="max-w-xl mb-12">
          <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase">Depoimentos</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            Quem usa, recomenda
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="relative rounded-2xl border border-border/50 bg-card p-6 sm:p-8">
              <div className="text-3xl font-serif text-primary/20 leading-none mb-3">"</div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{t.text}</p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{t.name[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="container mx-auto px-4 sm:px-6 py-16 md:py-24">
      <div className="relative rounded-3xl bg-foreground overflow-hidden px-6 sm:px-8 py-12 sm:py-16 md:py-20 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-background/5 pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-background mb-4 tracking-tight">
            Pronto para vender mais?
          </h2>
          <p className="text-background/60 text-base sm:text-lg max-w-md mx-auto mb-8">
            Escolha o plano ideal e comece a transformar seus resultados hoje.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/pricing">
              <Button size="lg" className="h-12 sm:h-14 px-8 sm:px-10 text-sm sm:text-base font-semibold rounded-full w-full sm:w-auto">
                Ver Planos e Assinar
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="ghost" className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base rounded-full text-background/70 hover:text-background hover:bg-background/10 w-full sm:w-auto">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Main Landing Page ──────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/30">
        <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Logo variant="red" size="md" showText />
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#diferenciais" className="text-muted-foreground hover:text-foreground transition-colors">Diferenciais</a>
            <a href="#recursos" className="text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#planos" className="text-muted-foreground hover:text-foreground transition-colors">Planos</a>
            <a href="#comparativo" className="text-muted-foreground hover:text-foreground transition-colors">Comparativo</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs sm:text-sm">Entrar</Button>
            </Link>
            <Link to="/pricing">
              <Button size="sm" className="rounded-full px-4 sm:px-5 text-xs sm:text-sm">Criar Conta</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="h-14 sm:h-16" />

      <HeroSection />
      <StatsBar />

      <div id="diferenciais">
        <DifferentialsSection />
      </div>

      <div id="recursos">
        <FeaturesSection />
      </div>

      <div id="planos">
        <PlansSection />
      </div>

      <TestimonialsSection />

      <div id="comparativo">
        <section className="border-y border-border/40">
          <div className="container mx-auto px-4 sm:px-6 py-16 md:py-24">
            <CompetitorComparison />
          </div>
        </section>
      </div>

      <CTASection />

      <footer className="border-t border-border/40">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo variant="red" size="sm" showText />
            <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacidade</Link>
              <Link to="/terms-of-service" className="hover:text-foreground transition-colors">Termos</Link>
              <Link to="/pricing" className="hover:text-foreground transition-colors">Preços</Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} AG Sell
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
