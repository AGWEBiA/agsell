import { Link } from 'react-router-dom';
import { WhatsAppFloatingButton } from '@/components/vendas/WhatsAppFloatingButton';
import { WhatsNewSection } from '@/components/vendas/WhatsNewSection';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight, X, Check, Zap, MessageSquare, Bot, Mail,
  BarChart3, Shield, Phone, Brain, Workflow, Instagram,
  Users, Target, Inbox, Globe, Sparkles, ChevronDown,
  AlertTriangle, DollarSign, Clock, Layers
} from 'lucide-react';

const PAIN_POINTS = [
  {
    icon: DollarSign,
    title: 'Pagando por 5+ ferramentas',
    desc: 'CRM, automação, e-mail, WhatsApp, chatbot — cada um com sua assinatura e login separado.',
  },
  {
    icon: AlertTriangle,
    title: 'Dados espalhados',
    desc: 'Informações do cliente fragmentadas entre plataformas que não se conversam.',
  },
  {
    icon: Clock,
    title: 'Horas perdidas integrando',
    desc: 'Zapier, webhooks manuais, CSV — um pesadelo para manter tudo sincronizado.',
  },
  {
    icon: X,
    title: 'Sem visão completa do cliente',
    desc: 'Impossível saber tudo que aconteceu com um lead em uma única tela.',
  },
];

const COMPARISON_ITEMS = [
  { feature: 'CRM com Pipeline Kanban', them: false, us: true },
  { feature: 'WhatsApp com QR Code + API Oficial', them: false, us: true },
  { feature: 'WhatsApp Interativo (botões, listas, enquetes, reações)', them: 'parcial', us: true },
  { feature: 'Áudio PTT, Localização, vCard e Menções @all em grupos', them: false, us: true },
  { feature: 'Formulários com visual 100% customizável', them: 'parcial', us: true },
  { feature: 'E-mail Marketing com Domínio Próprio', them: 'parcial', us: true },
  { feature: 'Inbox Unificado (WhatsApp, E-mail, Instagram, Telegram)', them: false, us: true },
  { feature: 'Flow Builder Visual com Analytics por Nó', them: false, us: true },
  { feature: 'Agentes IA com Base de Conhecimento (RAG)', them: false, us: true },
  { feature: 'Grupos Pagos no WhatsApp', them: false, us: true },
  { feature: 'Lead Scoring + Win Probability com IA', them: false, us: true },
  { feature: 'SMS Marketing Bidirecional', them: 'parcial', us: true },
  { feature: 'Portal de Suporte White-label', them: false, us: true },
  { feature: 'Testes A/B de Fluxos Completos', them: false, us: true },
  { feature: 'Modo Agência Multi-tenant', them: false, us: true },
];

const PILLARS = [
  {
    icon: Inbox,
    title: 'Comunicação Centralizada',
    desc: 'WhatsApp, E-mail, Instagram, Telegram e SMS em uma única tela. SAC com distribuição inteligente e transcrição de áudio por IA.',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
  },
  {
    icon: Workflow,
    title: 'Automação Inteligente',
    desc: 'Flow Builder drag-and-drop com 20+ ações. Sequências drip, testes A/B de fluxos e triggers por comportamento.',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
  },
  {
    icon: Brain,
    title: 'IA que Trabalha por Você',
    desc: 'Agentes com RAG, scoring preditivo, envio no melhor horário, análise de sentimento e assistente em linguagem natural.',
    color: 'text-rose-400',
    bgColor: 'bg-rose-400/10',
  },
  {
    icon: Target,
    title: 'CRM Completo',
    desc: 'Contatos ilimitados, pipeline Kanban, empresas, tarefas, gamificação de vendas e probabilidade de fechamento.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  {
    icon: BarChart3,
    title: 'Insights em Tempo Real',
    desc: 'Dashboard analítico, atribuição multi-toque, relatórios de receita e performance de equipe.',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
  },
  {
    icon: Shield,
    title: 'Controle Total',
    desc: 'Permissões granulares (RBAC), API pública, webhooks com retry, marketplace de integrações e modo agência.',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
  },
];

const REPLACES = [
  { name: 'HubSpot / RD Station', role: 'CRM' },
  { name: 'ActiveCampaign / Mailchimp', role: 'E-mail Marketing' },
  { name: 'ManyChat / SellFlux', role: 'Automação WhatsApp' },
  { name: 'Intercom / Zendesk', role: 'SAC & Suporte' },
  { name: 'ChatGPT API', role: 'Agentes IA' },
  { name: 'Hotjar / GA', role: 'Tracking & Analytics' },
];

export default function Apresentacao() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white selection:bg-primary/30">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0D0D0D]/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/"><Logo variant="red" size="md" showText /></Link>
          <Link to="/pricing">
            <Button size="sm" className="rounded-full px-5 text-xs sm:text-sm bg-primary hover:bg-primary/90">
              Ver planos <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="h-14" />

      {/* Hero */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/8 blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center max-w-4xl">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 text-xs tracking-wide">
            PLATAFORMA ALL-IN-ONE
          </Badge>
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Pare de pagar por
            <br />
            <span className="text-primary">5 ferramentas separadas.</span>
          </h1>
          <p className="text-white/60 text-base sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            CRM, WhatsApp, E-mail, Automação e IA — tudo em um só lugar.
            <br className="hidden sm:block" />
            Migre em minutos. Economize milhares por mês.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/pricing">
              <Button size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-white font-semibold text-base h-12">
                Começar agora <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#comparativo">
              <Button variant="outline" size="lg" className="rounded-full px-8 border-white/10 text-white hover:bg-white/5 text-base h-12">
                Ver comparativo <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16 md:py-24 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-3">O problema</p>
            <h2 className="text-2xl sm:text-4xl font-bold">Isso parece familiar?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {PAIN_POINTS.map((p, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-primary/20 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <p.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-2">{p.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Replaces */}
      <section className="py-16 md:py-24 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-3">A solução</p>
          <h2 className="text-2xl sm:text-4xl font-bold mb-4">
            Uma plataforma que <span className="text-primary">substitui todas</span>
          </h2>
          <p className="text-white/50 text-sm max-w-xl mx-auto mb-12">
            Chega de pagar licenças separadas, integrar APIs e perder dados entre sistemas.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-4xl mx-auto">
            {REPLACES.map((r, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center group hover:border-primary/30 transition-all">
                <p className="text-[10px] text-white/30 line-through mb-1">{r.name}</p>
                <p className="text-xs font-semibold text-primary">{r.role}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-white/40 text-xs">
            <Layers className="h-4 w-4 text-primary" />
            <span>Tudo isso por <strong className="text-white">uma única assinatura</strong></span>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-16 md:py-24 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-3">Funcionalidades</p>
            <h2 className="text-2xl sm:text-4xl font-bold">60+ recursos. Zero improviso.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {PILLARS.map((p, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-white/10 transition-colors">
                <div className={`h-10 w-10 rounded-xl ${p.bgColor} flex items-center justify-center mb-4`}>
                  <p.icon className={`h-5 w-5 ${p.color}`} />
                </div>
                <h3 className="font-semibold text-sm mb-2">{p.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/features">
              <Button variant="link" className="text-primary text-sm">
                Ver todas as funcionalidades <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Novidades — recursos recém-lançados */}
      <WhatsNewSection />

      {/* Comparison Table */}
      <section id="comparativo" className="py-16 md:py-24 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-3">Comparativo</p>
            <h2 className="text-2xl sm:text-4xl font-bold">AG Sell vs. Ferramentas avulsas</h2>
          </div>
          <div className="max-w-3xl mx-auto rounded-2xl border border-white/5 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_120px_120px] bg-white/[0.03] border-b border-white/5 px-4 sm:px-6 py-3">
              <span className="text-xs font-semibold text-white/40">Funcionalidade</span>
              <span className="text-xs font-semibold text-white/40 text-center">Outros</span>
              <span className="text-xs font-semibold text-primary text-center">AG Sell</span>
            </div>
            {COMPARISON_ITEMS.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_120px_120px] px-4 sm:px-6 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors"
              >
                <span className="text-xs text-white/70">{item.feature}</span>
                <div className="flex justify-center">
                  {item.them === false ? (
                    <X className="h-4 w-4 text-red-400/60" />
                  ) : (
                    <span className="text-[10px] text-yellow-400/60">Parcial</span>
                  )}
                </div>
                <div className="flex justify-center">
                  <Check className="h-4 w-4 text-green-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Numbers */}
      <section className="py-16 md:py-20 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
            {[
              { value: '60+', label: 'Funcionalidades' },
              { value: '8', label: 'Canais integrados' },
              { value: '20+', label: 'Gateways de pagamento' },
              { value: '100%', label: 'Brasileiro' },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-3xl sm:text-4xl font-bold text-primary">{s.value}</p>
                <p className="text-xs text-white/40 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Migration */}
      <section className="py-16 md:py-24 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-2xl">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Zap className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Migre em minutos, não em semanas</h2>
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            Central de Migração integrada: importe contatos, templates, automações e funis via <strong className="text-white">CSV, JSON, API ou Webhook</strong>. Sem dor de cabeça.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['ActiveCampaign', 'HubSpot', 'RD Station', 'SellFlux', 'Mailchimp', 'ManyChat'].map((t) => (
              <Badge key={t} variant="outline" className="border-white/10 text-white/50 text-[10px]">{t}</Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/10 blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center max-w-2xl">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight">
            Sua operação inteira.
            <br />
            <span className="text-primary">Uma só plataforma.</span>
          </h2>
          <p className="text-white/50 text-sm mb-10 max-w-md mx-auto">
            Planos flexíveis para sua operação. Sem surpresas, sem pegadinhas. Suporte dedicado desde o dia 1.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/pricing">
              <Button size="lg" className="rounded-full px-10 bg-primary hover:bg-primary/90 text-white font-semibold text-base h-13">
                Escolher meu plano <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/features">
              <Button variant="outline" size="lg" className="rounded-full px-8 border-white/10 text-white hover:bg-white/5 text-base h-13">
                Ver funcionalidades
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo variant="red" size="sm" showText />
            <div className="flex items-center gap-4 text-xs text-white/30">
              <Link to="/features" className="hover:text-white/60 transition-colors">Funcionalidades</Link>
              <Link to="/pricing" className="hover:text-white/60 transition-colors">Preços</Link>
              <Link to="/privacy-policy" className="hover:text-white/60 transition-colors">Privacidade</Link>
              <Link to="/terms-of-service" className="hover:text-white/60 transition-colors">Termos</Link>
            </div>
            <p className="text-xs text-white/20">© {new Date().getFullYear()} AG Sell</p>
          </div>
        </div>
      </footer>
      <WhatsAppFloatingButton />
    </div>
  );
}
