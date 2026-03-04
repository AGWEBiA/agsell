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
  Phone, Star, Layers, Award, ChevronRight, Brain, Loader2,
  Workflow, Vote, SplitSquareVertical, CreditCard, Tag, X,
  Instagram, Headphones, Trophy, Flame, DollarSign, Replace,
  CheckCircle2, ArrowDown, MousePointerClick, Gauge, Lock,
  Megaphone, PieChart, Hash
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';


// ─── Hero ───────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative py-20 md:py-28 lg:py-36 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full bg-primary/3 blur-3xl" />
        <div className="absolute top-20 right-[10%] w-20 h-20 rounded-2xl border border-primary/10 rotate-12 animate-pulse" />
        <div className="absolute top-40 right-[25%] w-12 h-12 rounded-full border border-primary/15 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 right-[15%] w-16 h-16 rounded-xl bg-primary/5 rotate-45 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            CRM + WhatsApp + E-mail + Instagram + IA — Tudo em uma única plataforma
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95] mb-6">
            Pare de pagar por
            <br />
            <span className="text-primary">5 ferramentas separadas.</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mb-4 leading-relaxed mx-auto">
            A AG Sell substitui seu CRM, plataforma de e-mail, ferramenta de WhatsApp, 
            automação de marketing e chatbot de IA — tudo integrado, por uma fração do custo.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" />Setup em minutos</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" />Suporte dedicado</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" />Cancele quando quiser</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <Link to="/pricing">
              <Button size="lg" className="h-12 sm:h-14 px-8 sm:px-10 text-sm sm:text-base font-semibold rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all w-full sm:w-auto">
                Começar agora
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <a href="#comparativo">
              <Button size="lg" variant="ghost" className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base rounded-full text-muted-foreground hover:text-foreground w-full sm:w-auto">
                Comparar com concorrentes
                <ArrowDown className="ml-1 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Tool Replacement Section ───────────────────────────────
const REPLACED_TOOLS = [
  { name: 'HubSpot', function: 'CRM', price: 'R$ 400/mês', icon: Users },
  { name: 'ActiveCampaign', function: 'E-mail Marketing', price: 'R$ 300/mês', icon: Mail },
  { name: 'SellFlux', function: 'WhatsApp', price: 'R$ 250/mês', icon: MessageSquare },
  { name: 'ManyChat', function: 'Chatbot / Flows', price: 'R$ 150/mês', icon: Workflow },
  { name: 'Intercom', function: 'Inbox Omnichannel', price: 'R$ 350/mês', icon: Inbox },
  { name: 'ChatGPT API', function: 'Agentes IA', price: 'R$ 200/mês', icon: Brain },
];

function ToolReplacementSection() {
  return (
    <section className="relative border-y border-border/40 bg-muted/20 overflow-hidden">
      <div className="absolute -top-20 right-0 w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-3xl pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 py-16 md:py-24 relative z-10">
        <div className="max-w-xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-4">
            <Replace className="h-3 w-3" />
            Substitua tudo
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Uma plataforma que <span className="text-primary">substitui 6 ferramentas</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            Chega de pagar separado por cada funcionalidade. Na AG Sell, está tudo integrado.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto mb-10">
          {REPLACED_TOOLS.map((tool, i) => (
            <div key={i} className="relative rounded-xl border border-border/50 bg-card p-5 hover:border-destructive/30 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <tool.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="text-xs font-mono text-destructive/70 line-through">{tool.price}</span>
              </div>
              <p className="font-semibold text-sm mb-0.5">{tool.name}</p>
              <p className="text-xs text-muted-foreground">{tool.function}</p>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-4 w-4 text-destructive/50" />
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 sm:p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Logo variant="red" size="sm" showText />
            </div>
            <p className="text-sm text-muted-foreground mb-2">Tudo isso junto + funcionalidades exclusivas</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary">A partir de R$ 197</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Economize mais de <strong className="text-foreground">R$ 1.650/mês</strong> comparado a contratar cada ferramenta separadamente
            </p>
            <Link to="/pricing" className="inline-block mt-4">
              <Button className="rounded-full">
                Ver planos <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Stats ──────────────────────────────────────────────────
const STATS = [
  { value: '20+', label: 'Funcionalidades integradas' },
  { value: '6', label: 'Ferramentas substituídas' },
  { value: '50%', label: 'Mais conversões' },
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

// ─── Complete Feature Showcase ──────────────────────────────
const FEATURE_CATEGORIES = [
  {
    category: 'CRM & Vendas',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    items: [
      { icon: Users, title: 'CRM Completo', desc: 'Contatos, empresas, negociações — visão 360° do cliente com histórico de todas as interações.' },
      { icon: Target, title: 'Pipeline Kanban', desc: 'Arraste e solte negócios entre etapas. Múltiplos funis personalizados por produto ou equipe.' },
      { icon: Trophy, title: 'Gamificação de Vendas', desc: 'Rankings, conquistas e pontuação para motivar vendedores. Exclusivo da AG Sell.' },
      { icon: PieChart, title: 'Lead Scoring', desc: 'Pontue leads automaticamente com base em comportamento e perfil para priorizar oportunidades.' },
    ]
  },
  {
    category: 'Comunicação Omnichannel',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    items: [
      { icon: MessageSquare, title: 'WhatsApp Multi-instância', desc: 'Conecte múltiplos números via QR Code. Campanhas em massa, grupos e flows interativos.' },
      { icon: Mail, title: 'E-mail Marketing', desc: 'Campanhas, templates, domínio próprio com SPF/DKIM/DMARC e warmup automático.' },
      { icon: Instagram, title: 'Instagram DM', desc: 'Responda DMs, comentários e stories diretamente do inbox integrado.' },
      { icon: Inbox, title: 'Inbox Unificado', desc: 'WhatsApp + E-mail + Instagram em uma única tela. CSAT, transcrição de áudio e notas internas.' },
    ]
  },
  {
    category: 'Automação & IA',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    items: [
      { icon: Workflow, title: 'Flow Builder Visual', desc: 'Construtor drag-and-drop com 20+ ações: timers, condições, aquecimento, tags, e-mail e WhatsApp.' },
      { icon: Bot, title: 'Agentes IA com RAG', desc: 'IA que acessa sua base de conhecimento, responde clientes, qualifica leads e transfere para humanos.' },
      { icon: Zap, title: 'Automações Avançadas', desc: 'Triggers por webhook, formulário, tag ou evento. Ações em cadeia com condições if/else.' },
      { icon: Sparkles, title: 'Assistente IA', desc: 'Pergunte sobre seus dados, gere relatórios e receba insights de vendas em linguagem natural.' },
    ]
  },
  {
    category: 'Gestão & Integrações',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    items: [
      { icon: Layers, title: 'Modo Agência Multi-tenant', desc: 'Gerencie múltiplos clientes com dados isolados, permissões granulares e troca rápida de conta.' },
      { icon: Globe, title: 'API Pública + Webhooks', desc: 'API REST com rate limiting, webhooks inbound e outbound para integrar com qualquer sistema.' },
      { icon: FileText, title: 'Formulários Web', desc: 'Capture leads com formulários customizados embarcáveis no seu site com integração ao CRM.' },
      { icon: Shield, title: 'Permissões Granulares (RBAC)', desc: 'Controle quem vê e faz o quê. Papéis customizáveis por módulo e ação.' },
    ]
  },
];

function FeatureShowcase() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 py-16 md:py-24 relative z-10">
        <div className="max-w-xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-4">
            <Layers className="h-3 w-3" />
            +20 funcionalidades
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Tudo que você precisa,
            <br />
            <span className="text-primary">em um só lugar</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            De CRM a agentes de IA, cada funcionalidade foi pensada para times que querem vender mais com menos ferramentas.
          </p>
        </div>

        <div className="space-y-12 max-w-6xl mx-auto">
          {FEATURE_CATEGORIES.map((cat, ci) => (
            <div key={ci}>
              <div className="flex items-center gap-3 mb-5">
                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', cat.bgColor)}>
                  <Hash className={cn('h-4 w-4', cat.color)} />
                </div>
                <h3 className="text-lg font-bold">{cat.category}</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cat.items.map((item, i) => (
                  <div
                    key={i}
                    className="group relative rounded-xl border border-border/50 bg-card p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                  >
                    <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center mb-3', cat.bgColor)}>
                      <item.icon className={cn('h-4 w-4', cat.color)} />
                    </div>
                    <h4 className="font-semibold text-sm mb-1.5">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Exclusive Differentials ────────────────────────────────
const EXCLUSIVE_DIFFERENTIALS = [
  {
    icon: MessageSquare,
    title: 'WhatsApp Nativo Multi-instância',
    description: 'Conecte quantos números quiser via QR Code. Campanhas em massa, gestão de grupos, flows interativos (formulários dentro do WhatsApp) e respostas automáticas. Nenhum concorrente tem tudo isso nativo.',
    badge: 'Exclusivo',
    span: 'md:col-span-2',
  },
  {
    icon: Bot,
    title: 'Agentes IA com Base de Conhecimento (RAG)',
    description: 'Seus agentes de IA acessam documentos, FAQs e bases próprias para responder clientes com precisão. Qualificam leads e transferem para humanos automaticamente.',
    badge: 'Exclusivo',
    span: '',
  },
  {
    icon: Workflow,
    title: 'Flow Builder com 20+ Ações',
    description: 'Construtor visual drag-and-drop com timers, aquecimento, condicionais, tags, WhatsApp, e-mail, SMS, pixel e muito mais. Mais completo que ManyChat e SellFlux.',
    badge: 'Mais completo',
    span: '',
  },
  {
    icon: Layers,
    title: 'Modo Agência Multi-tenant',
    description: 'Gerencie múltiplos clientes com dados 100% isolados, permissões por conta e troca instantânea. Sem pagar plano Enterprise como nos concorrentes.',
    badge: 'Exclusivo',
    span: 'md:col-span-2',
  },
  {
    icon: Trophy,
    title: 'Gamificação de Vendas',
    description: 'Rankings, conquistas e pontuação integrados ao CRM. Motive sua equipe de vendas de forma única. Nenhum CRM do mercado oferece isso.',
    badge: 'Exclusivo',
    span: '',
  },
  {
    icon: Inbox,
    title: 'Inbox Omnichannel Completo',
    description: 'WhatsApp, e-mail e Instagram DM em uma única tela. Com CSAT, transcrição de áudio por IA, notas internas e distribuição automática de atendimentos.',
    badge: 'Mais completo',
    span: 'md:col-span-2',
  },
  {
    icon: Headphones,
    title: 'SAC com Distribuição Inteligente',
    description: 'Round-robin, por capacidade ou manual. Respostas rápidas, pesquisa de satisfação automática e relatórios detalhados de atendimento.',
    badge: 'Integrado',
    span: '',
  },
];

function DifferentialsSection() {
  return (
    <section className="relative container mx-auto px-4 sm:px-6 py-16 md:py-24 overflow-hidden">
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="max-w-xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-4">
            <Award className="h-3 w-3" />
            Diferenciais exclusivos
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
            O que <span className="text-primary">só a AG Sell</span> oferece
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            Funcionalidades que você não encontra em HubSpot, ActiveCampaign, RD Station ou SellFlux.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 max-w-6xl mx-auto">
          {EXCLUSIVE_DIFFERENTIALS.map((d, i) => (
            <div
              key={i}
              className={cn(
                'group relative rounded-2xl border border-primary/20 bg-primary/[0.02] p-6 sm:p-7 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300',
                d.span
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <d.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                </div>
                <Badge variant="outline" className="text-[10px] text-primary border-primary/20">
                  {d.badge}
                </Badge>
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">{d.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{d.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Why AG Sell Section ────────────────────────────────────
const WHY_REASONS = [
  {
    icon: DollarSign,
    title: 'Economize +R$ 1.650/mês',
    desc: 'Substitua 6 ferramentas pagas por uma única plataforma com tudo integrado.',
  },
  {
    icon: Gauge,
    title: 'Setup em minutos',
    desc: 'Conecte seu WhatsApp via QR Code, configure automações e comece a vender em menos de 10 minutos.',
  },
  {
    icon: Lock,
    title: 'Dados integrados e seguros',
    desc: 'Sem APIs frágeis entre ferramentas. Tudo conectado nativamente com RLS e permissões.',
  },
  {
    icon: Flame,
    title: 'Feito para o mercado brasileiro',
    desc: 'WhatsApp nativo, suporte a PIX, boleto, integrações com Hotmart, Kiwify, Eduzz e Shopify.',
  },
];

function WhySection() {
  return (
    <section className="bg-muted/20 border-y border-border/40">
      <div className="container mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="max-w-xl mx-auto text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Por que a AG Sell é a <span className="text-primary">melhor escolha</span>?
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
          {WHY_REASONS.map((r, i) => (
            <div key={i} className="flex gap-4 p-5 rounded-xl border border-border/50 bg-card hover:shadow-md transition-all">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <r.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{r.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
              </div>
            </div>
          ))}
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
  max_emails_per_month: number;
  max_whatsapp_messages: number;
  max_automations: number;
  max_forms: number;
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
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', organizationName: '', couponCode: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCouponField, setShowCouponField] = useState(false);

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
          max_ai_requests_per_month: p.max_ai_requests_per_month || 0,
          max_emails_per_month: p.max_emails_per_month || 0,
          max_whatsapp_messages: p.max_whatsapp_messages || 0,
          max_automations: p.max_automations || 0,
          max_forms: p.max_forms || 0,
        })));
      }
      setIsLoading(false);
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowCheckout(true);
    setFormData({ name: '', email: '', organizationName: '', couponCode: '' });
    setShowCouponField(false);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !formData.name || !formData.email || !formData.organizationName) {
      toast.error('Preencha todos os campos');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('guest-checkout', {
        body: {
          planId: selectedPlan.id,
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
        setShowCheckout(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Erro ao processar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkoutPrice = selectedPlan
    ? billingCycle === 'monthly' ? selectedPlan.price_monthly : selectedPlan.price_yearly
    : 0;
  const isFree = selectedPlan?.price_monthly === 0;

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
                      <span>{plan.max_users === -1 ? 'Usuários ilimitados' : `${plan.max_users} usuário${plan.max_users > 1 ? 's' : ''}`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary shrink-0" />
                      <span>{plan.max_contacts === -1 ? 'Contatos ilimitados' : `${plan.max_contacts.toLocaleString()} contatos`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary shrink-0" />
                      <span>{plan.max_emails_per_month === -1 ? 'E-mails ilimitados' : plan.max_emails_per_month === 0 ? 'Sem e-mail marketing' : `${plan.max_emails_per_month.toLocaleString()} e-mails/mês`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                      <span>{plan.features.includes('whatsapp') ? 'WhatsApp ilimitado' : 'WhatsApp não incluso'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary shrink-0" />
                      <span>{plan.max_ai_requests_per_month === -1 ? 'IA ilimitada' : `${plan.max_ai_requests_per_month.toLocaleString()} req. IA/mês`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary shrink-0" />
                      <span>{plan.max_automations === -1 ? 'Automações ilimitadas' : plan.max_automations === 0 ? 'Sem automações' : `${plan.max_automations} automações`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span>{plan.max_forms === -1 ? 'Formulários ilimitados' : plan.max_forms === 0 ? 'Sem formulários' : `${plan.max_forms} formulários`}</span>
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
                  <Button
                    className="w-full h-10 text-sm"
                    variant={isPro ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {plan.price_monthly === 0 ? 'Começar' : 'Assinar'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <div className="max-w-2xl mx-auto mt-8 text-center">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <MessageSquare className="inline h-3 w-3 mr-1 align-middle" />
          <strong>WhatsApp via API Oficial (Meta):</strong> as mensagens são cobradas diretamente pela Meta conforme o uso. Via Evolution API (QR Code), não há custos adicionais por mensagem.
        </p>
      </div>

      {selectedPlan && (
        <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {isFree ? 'Criar Conta Gratuita' : `Assinar ${selectedPlan.name}`}
              </DialogTitle>
              <DialogDescription>
                {isFree
                  ? 'Preencha seus dados para criar sua conta gratuita'
                  : 'Preencha seus dados para continuar com o pagamento'
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="idx-name">Seu Nome</Label>
                <Input id="idx-name" placeholder="João Silva" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="idx-email">E-mail</Label>
                <Input id="idx-email" type="email" placeholder="joao@empresa.com" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="idx-org">Nome da Empresa/Organização</Label>
                <Input id="idx-org" placeholder="Minha Empresa LTDA" value={formData.organizationName} onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))} required />
              </div>

              {!isFree && (
                <>
                  {!showCouponField ? (
                    <button type="button" onClick={() => setShowCouponField(true)} className="flex items-center gap-1 text-sm text-primary hover:underline">
                      <Tag className="h-3 w-3" />
                      Tenho um cupom de desconto
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="idx-coupon">Cupom de Desconto</Label>
                      <Input id="idx-coupon" placeholder="Digite o código do cupom" value={formData.couponCode} onChange={(e) => setFormData(prev => ({ ...prev, couponCode: e.target.value.toUpperCase() }))} />
                      <p className="text-xs text-muted-foreground">O desconto será aplicado na próxima etapa</p>
                    </div>
                  )}

                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{selectedPlan.name}</span>
                      <span className="font-bold">R$ {checkoutPrice}/{billingCycle === 'monthly' ? 'mês' : 'ano'}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {billingCycle === 'yearly' ? 'Cobrança anual com 17% de desconto' : 'Cobrança mensal recorrente'}
                    </p>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-4 w-4" />
                {isFree ? 'Seus dados estão protegidos' : 'Pagamento seguro processado pelo Stripe'}
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCheckout(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isFree ? 'Criar Conta' : 'Continuar para Pagamento'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}

// ─── Testimonials ───────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: 'Marcos Silva',
    role: 'CEO, Digital Solutions',
    text: 'A AG Sell substituiu 4 ferramentas que usávamos. WhatsApp integrado + IA nos fizeram converter 50% mais leads com metade do custo.',
  },
  {
    name: 'Ana Beatriz Costa',
    role: 'Gerente Comercial, TechStart',
    text: 'Testei ActiveCampaign, RD Station e HubSpot. Nenhuma tem WhatsApp nativo, gamificação e flow builder tão completo quanto a AG Sell.',
  },
  {
    name: 'Ricardo Mendes',
    role: 'Fundador, Agência Scale',
    text: 'O modo agência é fantástico. Gerencio 12 clientes com dados isolados, cada um com seu WhatsApp e automações próprias.',
  },
  {
    name: 'Juliana Ferreira',
    role: 'Head de Marketing, E-commerce Pro',
    text: 'A integração com Hotmart e Kiwify é perfeita. Cada compra já cria o contato, aplica tag e dispara a sequência de onboarding pelo WhatsApp.',
  },
];

function TestimonialsSection() {
  return (
    <section className="relative bg-muted/20 border-y border-border/40 overflow-hidden">
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 py-16 md:py-24 relative z-10">
        <div className="max-w-xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-4">
            <Star className="h-3 w-3" />
            Aprovado por líderes
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            Quem usa, recomenda
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="relative rounded-2xl border border-border/50 bg-card p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-background/3 pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-background mb-4 tracking-tight">
            Pare de pagar por 5 ferramentas.
            <br />
            <span className="text-primary">Comece com a AG Sell.</span>
          </h2>
          <p className="text-background/60 text-base sm:text-lg max-w-lg mx-auto mb-8">
            CRM, WhatsApp, E-mail, Instagram, Automações e IA — tudo integrado em uma única plataforma.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/pricing">
              <Button size="lg" className="h-12 sm:h-14 px-8 sm:px-10 text-sm sm:text-base font-semibold rounded-full w-full sm:w-auto">
                Começar agora
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
              <Button size="sm" className="rounded-full px-4 sm:px-5 text-xs sm:text-sm">Começar agora</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="h-14 sm:h-16" />

      <HeroSection />
      <StatsBar />
      <ToolReplacementSection />

      <div id="diferenciais">
        <DifferentialsSection />
      </div>

      <div id="recursos">
        <FeatureShowcase />
      </div>

      <WhySection />

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
