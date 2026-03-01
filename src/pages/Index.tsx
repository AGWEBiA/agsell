import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/Logo';
import { CompetitorComparison } from '@/components/pricing/CompetitorComparison';
import {
  ArrowRight, Check, Users, Target, Bot, MessageSquare, Mail, BarChart3,
  Sparkles, FileText, Calendar, Inbox, Globe, Clock, Zap, Shield,
  Phone, Play, Star, TrendingUp, Layers, Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Hero Section ───────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10 pointer-events-none" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none hidden md:block" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none hidden md:block" />

      <div className="container mx-auto px-4 pt-20 pb-24 md:pt-32 md:pb-32 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Plataforma #1 em CRM + WhatsApp do Brasil
          </Badge>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Venda mais com
            <span className="text-primary block mt-1">inteligência artificial</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            CRM completo com WhatsApp nativo, automações inteligentes, agentes de IA
            e tudo que sua equipe precisa para converter leads em clientes — em um só lugar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link to="/pricing">
              <Button size="lg" className="h-14 px-8 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                Começar Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="h-14 px-8 text-base">
                <Play className="mr-2 h-4 w-4" />
                Ver Planos
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> Sem cartão de crédito</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> Setup em 2 minutos</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> Suporte humanizado</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Stats Section ──────────────────────────────────────────
const STATS = [
  { value: '10k+', label: 'Leads gerenciados' },
  { value: '50%', label: 'Mais conversões' },
  { value: '3x', label: 'Mais produtividade' },
  { value: '24/7', label: 'IA atendendo por você' },
];

function StatsSection() {
  return (
    <section className="border-y bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary mb-1">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Differentials Section ──────────────────────────────────
const DIFFERENTIALS = [
  {
    icon: MessageSquare,
    title: 'WhatsApp Multi-instância Nativo',
    description: 'Conecte múltiplos números via QR Code. Envie campanhas em massa, gerencie grupos e crie WhatsApp Flows interativos — tudo dentro do CRM.',
    badge: 'Exclusivo',
  },
  {
    icon: Bot,
    title: 'Agentes de IA com RAG',
    description: 'Atendentes virtuais que acessam sua base de conhecimento, respondem perguntas complexas, qualificam leads e transferem para humanos automaticamente.',
    badge: 'Exclusivo',
  },
  {
    icon: Layers,
    title: 'Modo Agência Multi-tenant',
    description: 'Gerencie múltiplos clientes com dados isolados, permissões granulares e troca rápida de conta — sem precisar de plano Enterprise.',
    badge: 'Exclusivo',
  },
  {
    icon: Award,
    title: 'Gamificação de Vendas',
    description: 'Motive sua equipe com pontuação, rankings e conquistas integradas ao CRM. Transforme metas em jogos e aumente a produtividade.',
    badge: 'Exclusivo',
  },
  {
    icon: Inbox,
    title: 'Inbox Omnichannel',
    description: 'WhatsApp, e-mail e Instagram DM centralizados em uma única tela com atribuição automática, CSAT e transcrição de áudio por IA.',
    badge: null,
  },
  {
    icon: TrendingUp,
    title: 'Lead Scoring + Automações',
    description: 'Pontue leads automaticamente com base em comportamento e acione automações inteligentes para nutrir e converter no momento certo.',
    badge: null,
  },
];

function DifferentialsSection() {
  return (
    <section className="container mx-auto px-4 py-20 md:py-28">
      <div className="text-center mb-14">
        <Badge variant="secondary" className="mb-4">
          <Zap className="h-3 w-3 mr-1" />
          Diferenciais
        </Badge>
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Por que escolher a <span className="text-primary">AG Sell</span>?
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Funcionalidades que nenhum outro CRM oferece — integradas nativamente para você vender mais
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {DIFFERENTIALS.map((d, i) => (
          <Card key={i} className="group relative border hover:border-primary/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            {d.badge && (
              <Badge className="absolute top-4 right-4 bg-primary/10 text-primary border-primary/20 text-[10px]">
                {d.badge}
              </Badge>
            )}
            <CardContent className="pt-8 pb-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <d.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{d.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{d.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

// ─── All Features Grid ──────────────────────────────────────
const ALL_FEATURES = [
  { icon: Users, title: 'CRM Completo', desc: 'Visão 360° de contatos, empresas e negociações.' },
  { icon: Target, title: 'Pipeline Kanban', desc: 'Funil de vendas visual com drag & drop.' },
  { icon: Mail, title: 'E-mail Marketing', desc: 'Campanhas, templates e domínio próprio.' },
  { icon: BarChart3, title: 'Analytics em Tempo Real', desc: 'Dashboards de vendas e performance.' },
  { icon: FileText, title: 'Formulários Web', desc: 'Capture leads com formulários integrados.' },
  { icon: Calendar, title: 'Gestão de Tarefas', desc: 'Organize follow-ups e atividades.' },
  { icon: Globe, title: 'API & Webhooks', desc: 'Integre com qualquer sistema externo.' },
  { icon: Clock, title: 'Histórico Completo', desc: 'Timeline de todas as interações.' },
  { icon: Phone, title: 'Instagram DM', desc: 'Gerencie DMs direto do CRM.' },
  { icon: Shield, title: 'Permissões Granulares', desc: 'Controle de acesso por funcionalidade.' },
  { icon: Sparkles, title: 'Assistente IA', desc: 'Chat com IA para insights e ações.' },
  { icon: Star, title: 'CSAT Integrado', desc: 'Pesquisas de satisfação automáticas.' },
];

function AllFeaturesSection() {
  return (
    <section className="bg-muted/30 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Plataforma Completa
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Tudo em <span className="text-primary">um só lugar</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pare de pagar por 5 ferramentas diferentes. A AG Sell substitui todas elas.
          </p>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-6xl mx-auto">
          {ALL_FEATURES.map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-card border hover:shadow-md transition-all">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <f.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-0.5">{f.title}</h4>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Social Proof / Testimonials ────────────────────────────
const TESTIMONIALS = [
  {
    name: 'Marcos Silva',
    role: 'CEO, Digital Solutions',
    text: 'A AG Sell transformou nosso processo de vendas. O WhatsApp integrado e os agentes de IA nos fizeram converter 50% mais leads.',
    stars: 5,
  },
  {
    name: 'Ana Beatriz Costa',
    role: 'Gerente Comercial, TechStart',
    text: 'Testei ActiveCampaign, RD Station e HubSpot. Nenhuma tem o WhatsApp nativo e a gamificação que a AG Sell oferece.',
    stars: 5,
  },
  {
    name: 'Ricardo Mendes',
    role: 'Fundador, Agência Scale',
    text: 'O modo agência é fantástico. Gerencio 12 clientes com dados isolados e tudo centralizado. Não preciso de plano Enterprise.',
    stars: 5,
  },
];

function TestimonialsSection() {
  return (
    <section className="container mx-auto px-4 py-20 md:py-28">
      <div className="text-center mb-14">
        <Badge variant="secondary" className="mb-4">
          <Star className="h-3 w-3 mr-1" />
          Depoimentos
        </Badge>
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Quem usa, <span className="text-primary">recomenda</span>
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {TESTIMONIALS.map((t, i) => (
          <Card key={i} className="border hover:shadow-lg transition-all">
            <CardContent className="pt-6">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed italic">"{t.text}"</p>
              <div>
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

// ─── CTA Section ────────────────────────────────────────────
function CTASection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 py-20 md:py-24 relative z-10 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4">
          Pronto para vender mais?
        </h2>
        <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto mb-8">
          Comece grátis hoje mesmo. Sem cartão de crédito, sem compromisso.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/pricing">
            <Button size="lg" variant="secondary" className="h-14 px-8 text-base font-semibold shadow-lg">
              Começar Grátis Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="ghost" className="h-14 px-8 text-base text-primary-foreground border border-primary-foreground/20 hover:bg-primary-foreground/10">
              Já tenho conta
            </Button>
          </Link>
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
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo variant="red" size="md" showText />
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#diferenciais" className="text-muted-foreground hover:text-foreground transition-colors">Diferenciais</a>
            <a href="#recursos" className="text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#comparativo" className="text-muted-foreground hover:text-foreground transition-colors">Comparativo</a>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Preços</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/pricing">
              <Button size="sm">Criar Conta</Button>
            </Link>
          </div>
        </div>
      </header>

      <HeroSection />
      <StatsSection />

      <div id="diferenciais">
        <DifferentialsSection />
      </div>

      <div id="recursos">
        <AllFeaturesSection />
      </div>

      <TestimonialsSection />

      <div id="comparativo">
        <section className="container mx-auto px-4 py-20 md:py-28">
          <CompetitorComparison />
        </section>
      </div>

      <CTASection />

      {/* Footer */}
      <footer className="border-t py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo variant="red" size="sm" showText />
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacidade</Link>
              <Link to="/terms-of-service" className="hover:text-foreground transition-colors">Termos</Link>
              <Link to="/pricing" className="hover:text-foreground transition-colors">Preços</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AG Sell. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
