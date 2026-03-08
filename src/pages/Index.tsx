import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Logo } from '@/components/ui/Logo';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  ArrowRight, Check, Users, Target, Bot, MessageSquare, Mail, BarChart3,
  Sparkles, FileText, Calendar, Inbox, Globe, Clock, Zap, Shield,
  Phone, Star, Layers, Award, ChevronRight, Brain, Loader2,
  Workflow, CreditCard, Tag, X,
  Instagram, Headphones, Trophy, Flame, DollarSign, Replace,
  CheckCircle2, ArrowDown, Gauge, Lock,
  Megaphone, PieChart, Hash, ArrowLeftRight, Upload,
  Ticket, PhoneCall,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// ─── SECTION 1: Navbar ──────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
        scrolled
          ? 'bg-[hsl(0,0%,5%)]/90 backdrop-blur-xl border-[hsl(0,0%,16%)]'
          : 'bg-transparent border-transparent'
      )}
      role="banner"
    >
      <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Logo variant="red" size="md" showText />
        <nav className="hidden md:flex items-center gap-6 text-sm" aria-label="Navegação principal">
          <a href="#funcionalidades" className="text-[hsl(0,0%,63%)] hover:text-white transition-colors">Funcionalidades</a>
          <a href="#diferenciais" className="text-[hsl(0,0%,63%)] hover:text-white transition-colors">Diferenciais</a>
          <a href="#comparativo" className="text-[hsl(0,0%,63%)] hover:text-white transition-colors">Comparativo</a>
          <a href="#planos" className="text-[hsl(0,0%,63%)] hover:text-white transition-colors">Planos</a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="text-white/90 hover:text-white hover:bg-white/10 font-medium text-xs sm:text-sm rounded-full px-4">Entrar</Button>
          </Link>
          <a href="#planos" className="hidden sm:block">
            <Button size="sm" className="rounded-full px-4 sm:px-5 text-xs sm:text-sm bg-[hsl(2,76%,53%)] hover:bg-[hsl(2,76%,45%)] text-white">
              Começar agora
            </Button>
          </a>
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[hsl(0,0%,5%)]/95 backdrop-blur-xl border-t border-[hsl(0,0%,16%)] animate-fade-in">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
            <a href="#funcionalidades" onClick={() => setMobileMenuOpen(false)} className="text-[hsl(0,0%,63%)] hover:text-white transition-colors py-2 text-sm">Funcionalidades</a>
            <a href="#diferenciais" onClick={() => setMobileMenuOpen(false)} className="text-[hsl(0,0%,63%)] hover:text-white transition-colors py-2 text-sm">Diferenciais</a>
            <a href="#comparativo" onClick={() => setMobileMenuOpen(false)} className="text-[hsl(0,0%,63%)] hover:text-white transition-colors py-2 text-sm">Comparativo</a>
            <a href="#planos" onClick={() => setMobileMenuOpen(false)} className="text-[hsl(0,0%,63%)] hover:text-white transition-colors py-2 text-sm">Planos</a>
            <div className="flex gap-2 pt-2 border-t border-[hsl(0,0%,16%)]">
              <Link to="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full text-white/90 hover:text-white hover:bg-white/10 font-medium text-xs rounded-full">Entrar</Button>
              </Link>
              <a href="#planos" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full rounded-full text-xs bg-[hsl(2,76%,53%)] hover:bg-[hsl(2,76%,45%)] text-white">
                  Começar agora
                </Button>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

// ─── SECTION 2: Hero ────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative py-16 md:py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[hsl(2,76%,53%)]/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full bg-[hsl(2,76%,53%)]/3 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(2,76%,53%)]/20 bg-[hsl(2,76%,53%)]/10 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-[hsl(2,76%,53%)] mb-6">
            🇧🇷 Feito para o mercado brasileiro
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[64px] font-bold tracking-tight leading-[1.1] mb-6 text-white">
            Sua equipe vende mais quando não precisa gerenciar{' '}
            <span className="text-[hsl(2,76%,53%)]">6 ferramentas</span> ao mesmo tempo.
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[hsl(0,0%,63%)] max-w-2xl mb-6 leading-relaxed mx-auto">
            A AG Sell une CRM, WhatsApp, e-mail, Instagram e IA em uma única plataforma — para você atender mais rápido, fechar mais negócios e pagar menos do que você paga hoje.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-[hsl(0,0%,63%)] mb-8">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />Comece a vender em menos de 10 minutos</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />Suporte em português, sem fila</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />Sem contrato anual, sem multa</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center mb-6 px-2 sm:px-0">
            <a href="#planos" className="w-full sm:w-auto">
              <Button size="lg" className="h-12 sm:h-14 px-6 sm:px-10 text-sm sm:text-base font-semibold rounded-full bg-[hsl(2,76%,53%)] hover:bg-[hsl(2,76%,45%)] text-white shadow-lg shadow-[hsl(2,76%,53%)]/20 w-full">
                Começar agora — a partir de R$ 197/mês
                <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5 shrink-0" />
              </Button>
            </a>
            <a href="#comparativo" className="w-full sm:w-auto">
              <Button size="lg" variant="ghost" className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base rounded-full border border-[hsl(0,0%,25%)] bg-transparent text-white hover:bg-white/10 hover:text-white hover:border-[hsl(0,0%,40%)] transition-all w-full">
                Ver quanto você economiza
                <ArrowDown className="ml-1 h-4 w-4 shrink-0" />
              </Button>
            </a>
          </div>

          <p className="text-xs text-[hsl(0,0%,40%)]">
            Substitui HubSpot + ActiveCampaign + SellFlux + ManyChat + Intercom — por uma fração do custo
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 3: Metrics ─────────────────────────────────────
const METRICS = [
  { value: '+R$ 1.650/mês', label: 'economizados em média' },
  { value: '6 plataformas', label: 'substituídas por 1' },
  { value: '50% mais', label: 'conversões com IA nativa' },
  { value: '24/7', label: 'sem contratar mais pessoas' },
];

function MetricsSection() {
  return (
    <section className="border-y border-[hsl(0,0%,16%)] bg-[hsl(0,0%,7%)]">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[hsl(0,0%,16%)]">
          {METRICS.map((m, i) => (
            <div key={i} className="py-10 md:py-14 text-center px-3">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-1">{m.value}</p>
              <p className="text-xs sm:text-sm text-[hsl(0,0%,63%)]">{m.label}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-[hsl(0,0%,40%)] pb-6">
          Comparado a contratar HubSpot + ActiveCampaign + SellFlux + ManyChat + Intercom + ChatGPT API separadamente
        </p>
      </div>
    </section>
  );
}

// ─── SECTION 4: Cost Comparison ─────────────────────────────
const REPLACED_TOOLS = [
  { name: 'HubSpot', fn: 'CRM', price: 'R$ 400/mês', note: '+ Suporte apenas em inglês', icon: Users },
  { name: 'ActiveCampaign', fn: 'E-mail Marketing', price: 'R$ 300/mês', note: '+ Cobrado em dólar', icon: Mail },
  { name: 'SellFlux', fn: 'WhatsApp', price: 'R$ 250/mês', note: '+ Sem CRM integrado', icon: MessageSquare },
  { name: 'ManyChat', fn: 'Chatbot / Flows', price: 'R$ 150/mês', note: '+ Sem WhatsApp nativo', icon: Workflow },
  { name: 'Intercom', fn: 'Inbox Omnichannel', price: 'R$ 350/mês', note: '+ Cobrado em dólar', icon: Inbox },
  { name: 'ChatGPT API', fn: 'Agentes IA', price: 'R$ 200/mês', note: '+ Sem integração nativa', icon: Brain },
];

function CostComparisonSection() {
  return (
    <section id="comparativo" className="relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-16 relative z-10">
        <div className="max-w-xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(2,76%,53%)]/20 bg-[hsl(2,76%,53%)]/10 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-[hsl(2,76%,53%)] mb-4">
            <Replace className="h-3 w-3" />
            Substitua tudo
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
            Você está pagando caro demais — e ainda assim{' '}
            <span className="text-[hsl(2,76%,53%)]">não tem tudo integrado</span>
          </h2>
          <p className="text-[hsl(0,0%,63%)] text-base sm:text-lg">
            HubSpot, ActiveCampaign, Intercom e ManyChat cobram em dólar. Cada atualização do câmbio aumenta sua fatura. Com a AG Sell, você paga em real, com preço fixo, sem surpresas.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto mb-10">
          {REPLACED_TOOLS.map((tool, i) => (
            <div key={i} className="relative rounded-xl border border-[hsl(0,0%,16%)] bg-[hsl(0,0%,10%)] p-5 hover:border-[hsl(2,76%,53%)]/30 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-[hsl(0,0%,16%)] flex items-center justify-center">
                  <tool.icon className="h-5 w-5 text-[hsl(0,0%,63%)]" />
                </div>
                <span className="text-xs font-mono text-red-400 line-through">{tool.price}</span>
              </div>
              <p className="font-semibold text-sm text-white mb-0.5">{tool.name}</p>
              <p className="text-xs text-[hsl(0,0%,63%)]">{tool.fn}</p>
              <p className="text-[10px] text-[hsl(0,0%,40%)] mt-1">{tool.note}</p>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border-2 border-[hsl(2,76%,53%)]/30 bg-[hsl(2,76%,53%)]/5 p-6 sm:p-8 text-center">
            <Logo variant="red" size="sm" showText />
            <p className="text-sm text-[hsl(0,0%,63%)] mb-2 mt-3">Tudo isso junto + funcionalidades exclusivas</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-[hsl(2,76%,53%)]">A partir de R$ 197</span>
              <span className="text-[hsl(0,0%,63%)]">/mês</span>
            </div>
            <p className="text-xs text-[hsl(0,0%,63%)] mt-2">
              Economize mais de <strong className="text-white">R$ 1.650/mês</strong> — em real, sem surpresas
            </p>
            <a href="#planos" className="inline-block mt-4">
              <Button className="rounded-full bg-[hsl(2,76%,53%)] hover:bg-[hsl(2,76%,45%)] text-white">
                Ver planos completos <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 5: Comparison Table ────────────────────────────
const TABLE_ROWS = [
  { feature: 'CRM Completo', ag: true, hub: true, ac: true, rd: true, sf: false },
  { feature: 'WhatsApp Nativo Multi-instância', ag: true, hub: false, ac: false, rd: false, sf: true },
  { feature: 'E-mail Marketing', ag: true, hub: true, ac: true, rd: true, sf: false },
  { feature: 'SMS Bidirecional com Créditos', ag: true, hub: false, ac: false, rd: false, sf: false },
  { feature: 'VoIP com Créditos', ag: true, hub: false, ac: false, rd: false, sf: false },
  { feature: 'Instagram DM', ag: true, hub: false, ac: false, rd: false, sf: false },
  { feature: 'Agentes IA com RAG', ag: true, hub: false, ac: false, rd: false, sf: false },
  { feature: 'Flow Builder Visual (20+ ações)', ag: true, hub: true, ac: true, rd: true, sf: true },
  { feature: 'Analytics por Nó no Flow Builder', ag: true, hub: false, ac: false, rd: false, sf: false },
  { feature: 'Scoring Preditivo com IA', ag: true, hub: false, ac: true, rd: false, sf: false },
  { feature: 'Site Tracking → Trigger Automático', ag: true, hub: true, ac: true, rd: false, sf: false },
  { feature: 'A/B de Fluxos Completos', ag: true, hub: false, ac: false, rd: false, sf: false },
  { feature: 'Marketplace de 30+ Integrações', ag: true, hub: true, ac: true, rd: false, sf: false },
  { feature: 'Conteúdo Condicional em E-mails', ag: true, hub: true, ac: true, rd: false, sf: false },
  { feature: 'Webhooks com Retry + Dead-letter', ag: true, hub: true, ac: false, rd: false, sf: false },
  { feature: 'Gamificação de Vendas', ag: true, hub: false, ac: false, rd: false, sf: false },
  { feature: 'Modo Agência Multi-tenant', ag: true, hub: false, ac: false, rd: false, sf: false },
  { feature: 'Portal de Suporte White-label', ag: true, hub: false, ac: false, rd: false, sf: false },
  { feature: 'Inbox Omnichannel (WA+Email+IG+SMS+VoIP)', ag: true, hub: false, ac: false, rd: false, sf: false },
  { feature: 'Suporte em Português', ag: true, hub: false, ac: false, rd: true, sf: true },
  { feature: 'Preço em Real (sem dólar)', ag: true, hub: false, ac: false, rd: true, sf: true },
  { feature: 'Integrações BR (Hotmart, Kiwify, PIX)', ag: true, hub: false, ac: false, rd: true, sf: true },
  { feature: 'Migração Completa em Minutos', ag: true, hub: false, ac: false, rd: false, sf: false },
];

function ComparisonTableSection() {
  return (
    <section className="border-y border-[hsl(0,0%,16%)] bg-[hsl(0,0%,7%)]">
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-16">
        <div className="max-w-xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(2,76%,53%)]/20 bg-[hsl(2,76%,53%)]/10 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-[hsl(2,76%,53%)] mb-4">
            Comparativo
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
            AG Sell vs. Concorrentes: <span className="text-[hsl(2,76%,53%)]">Veja a diferença lado a lado</span>
          </h2>
          <p className="text-[hsl(0,0%,63%)] text-base sm:text-lg">
            Compare as funcionalidades e o custo. A escolha vai ser óbvia.
          </p>
        </div>

        <div className="overflow-x-auto max-w-6xl mx-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-[hsl(0,0%,16%)]">
                <th className="text-left py-3 px-4 text-[hsl(0,0%,63%)] font-medium">Funcionalidade</th>
                <th className="py-3 px-3 text-center">
                  <span className="font-bold text-[hsl(2,76%,53%)]">AG Sell</span>
                </th>
                <th className="py-3 px-3 text-center text-[hsl(0,0%,63%)]">HubSpot</th>
                <th className="py-3 px-3 text-center text-[hsl(0,0%,63%)]">ActiveCampaign</th>
                <th className="py-3 px-3 text-center text-[hsl(0,0%,63%)]">RD Station</th>
                <th className="py-3 px-3 text-center text-[hsl(0,0%,63%)]">SellFlux</th>
              </tr>
            </thead>
            <tbody>
              {TABLE_ROWS.map((row, i) => (
                <tr key={i} className={cn('border-b border-[hsl(0,0%,16%)]/50', i % 2 === 0 && 'bg-[hsl(0,0%,8%)]')}>
                  <td className="py-3 px-4 text-white text-xs sm:text-sm">{row.feature}</td>
                  <td className="py-3 px-3 text-center bg-[hsl(2,76%,53%)]/5">
                    {row.ag ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-[hsl(0,0%,27%)] mx-auto" />}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.hub ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-[hsl(0,0%,27%)] mx-auto" />}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.ac ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-[hsl(0,0%,27%)] mx-auto" />}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.rd ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-[hsl(0,0%,27%)] mx-auto" />}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.sf ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-[hsl(0,0%,27%)] mx-auto" />}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-[hsl(0,0%,16%)]">
                <td className="py-3 px-4 text-white font-semibold">Preço inicial</td>
                <td className="py-3 px-3 text-center bg-[hsl(2,76%,53%)]/5 font-bold text-[hsl(2,76%,53%)]">R$ 197/mês</td>
                <td className="py-3 px-3 text-center text-[hsl(0,0%,63%)]">~R$ 400/mês</td>
                <td className="py-3 px-3 text-center text-[hsl(0,0%,63%)]">~R$ 300/mês</td>
                <td className="py-3 px-3 text-center text-[hsl(0,0%,63%)]">~R$ 250/mês</td>
                <td className="py-3 px-3 text-center text-[hsl(0,0%,63%)]">~R$ 250/mês</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-center text-xs text-[hsl(0,0%,40%)] mt-4">
          *Preços dos concorrentes em estimativa de câmbio. Sujeitos a variação.
        </p>

        <div className="text-center mt-8">
          <a href="#planos">
            <Button className="rounded-full bg-[hsl(2,76%,53%)] hover:bg-[hsl(2,76%,45%)] text-white">
              Começar agora <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 6: Exclusive Differentials ─────────────────────
const DIFFERENTIALS = [
  {
    icon: MessageSquare, title: 'WhatsApp Nativo Multi-instância', badge: 'EXCLUSIVO', badgeColor: 'bg-[hsl(2,76%,53%)]/15 text-[hsl(2,76%,53%)] border-[hsl(2,76%,53%)]/30',
    desc: 'Gerencie toda a sua operação de WhatsApp sem pagar por ferramentas separadas. Conecte múltiplos números, dispare campanhas em massa, crie fluxos interativos e automatize respostas — tudo nativo, sem APIs de terceiros.',
  },
  {
    icon: Bot, title: 'Agentes IA com Base de Conhecimento (RAG)', badge: 'EXCLUSIVO', badgeColor: 'bg-[hsl(2,76%,53%)]/15 text-[hsl(2,76%,53%)] border-[hsl(2,76%,53%)]/30',
    desc: 'Seu cliente faz uma pergunta às 2h da manhã. A IA responde com precisão, usando seus próprios documentos e FAQs. Se precisar de um humano, a transferência acontece automaticamente.',
  },
  {
    icon: Workflow, title: 'Flow Builder com Analytics por Nó', badge: 'MAIS COMPLETO', badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    desc: 'Construtor visual com 20+ ações, timers, condicionais e aquecimento. Agora com analytics em tempo real: veja entradas, saídas e conversões diretamente em cada nó do fluxo.',
  },
  {
    icon: Brain, title: 'Scoring Preditivo com IA', badge: 'NOVO', badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    desc: 'A IA analisa o comportamento de cada lead — e-mails abertos, mensagens respondidas, páginas visitadas — e calcula automaticamente a probabilidade de conversão. Sem regras manuais.',
  },
  {
    icon: Globe, title: 'Site Tracking → Trigger Automático', badge: 'NOVO', badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    desc: 'Visitou sua página de preços? O fluxo dispara. Abandonou o checkout? Recebe WhatsApp em 30 minutos. Conecte comportamento no site a automações inteligentes.',
  },
  {
    icon: Layers, title: 'Modo Agência Multi-tenant', badge: 'EXCLUSIVO', badgeColor: 'bg-[hsl(2,76%,53%)]/15 text-[hsl(2,76%,53%)] border-[hsl(2,76%,53%)]/30',
    desc: 'Gerencie múltiplos clientes com dados 100% isolados, permissões por conta e troca instantânea entre clientes. Sem pagar plano Enterprise como nos concorrentes.',
  },
  {
    icon: Trophy, title: 'Gamificação de Vendas', badge: 'EXCLUSIVO', badgeColor: 'bg-[hsl(2,76%,53%)]/15 text-[hsl(2,76%,53%)] border-[hsl(2,76%,53%)]/30',
    desc: 'Vendedor motivado vende mais. Rankings, conquistas e pontuação integrados nativamente — sua equipe compete de forma saudável e você acompanha tudo em tempo real.',
  },
  {
    icon: Inbox, title: 'Inbox Omnichannel Completo', badge: 'MAIS COMPLETO', badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    desc: 'WhatsApp, e-mail, Instagram DM, SMS e VoIP em uma única tela. Com CSAT automático, transcrição de áudio por IA, notas internas e distribuição automática.',
  },
  {
    icon: Phone, title: 'SMS Bidirecional com Créditos', badge: 'EXCLUSIVO', badgeColor: 'bg-[hsl(2,76%,53%)]/15 text-[hsl(2,76%,53%)] border-[hsl(2,76%,53%)]/30',
    desc: 'Envie campanhas SMS em massa, receba respostas automáticas e converse via SMS — tudo integrado ao CRM. Compre créditos conforme precisar, sem contratos longos.',
  },
  {
    icon: PhoneCall, title: 'VoIP com Créditos', badge: 'EXCLUSIVO', badgeColor: 'bg-[hsl(2,76%,53%)]/15 text-[hsl(2,76%,53%)] border-[hsl(2,76%,53%)]/30',
    desc: 'Faça e receba chamadas VoIP diretamente do CRM. Grave chamadas e acesse o histórico de cada cliente. Compre créditos sob demanda — pague apenas pelo que usar.',
  },
  {
    icon: ArrowLeftRight, title: 'Migração Completa em Minutos', badge: 'EXCLUSIVO', badgeColor: 'bg-[hsl(2,76%,53%)]/15 text-[hsl(2,76%,53%)] border-[hsl(2,76%,53%)]/30',
    desc: 'Em menos de 2 horas, seus contatos, automações, templates e funis estão na AG Sell. Sem perder nada. Sem downtime. Com suporte ao vivo durante todo o processo.',
  },
  {
    icon: Ticket, title: 'Portal de Suporte White-label', badge: 'EXCLUSIVO', badgeColor: 'bg-[hsl(2,76%,53%)]/15 text-[hsl(2,76%,53%)] border-[hsl(2,76%,53%)]/30',
    desc: 'Ofereça aos seus clientes um portal público de atendimento com a sua marca. Abertura e acompanhamento de tickets por protocolo, chat via WhatsApp — sem exigir login.',
  },
];

function DifferentialsSection() {
  return (
    <section id="diferenciais" className="relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-16 relative z-10">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(2,76%,53%)]/20 bg-[hsl(2,76%,53%)]/10 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-[hsl(2,76%,53%)] mb-4">
            <Award className="h-3 w-3" />
            Diferenciais exclusivos
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
            Enquanto os concorrentes cobram em dólar por funcionalidades separadas, a AG Sell entrega{' '}
            <span className="text-[hsl(2,76%,53%)]">tudo em uma única plataforma</span>
          </h2>
          <p className="text-[hsl(0,0%,63%)] text-base sm:text-lg">
            Funcionalidades que você não encontra em nenhum concorrente. Nem no HubSpot. Nem no ActiveCampaign. Nem no SellFlux.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 max-w-5xl mx-auto">
          {DIFFERENTIALS.map((d, i) => (
            <div
              key={i}
              className="group rounded-xl border border-[hsl(0,0%,16%)] bg-[hsl(0,0%,10%)] p-6 hover:border-[hsl(2,76%,53%)]/40 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-[hsl(2,76%,53%)]/10 flex items-center justify-center group-hover:bg-[hsl(2,76%,53%)] transition-colors duration-300">
                  <d.icon className="h-5 w-5 text-[hsl(2,76%,53%)] group-hover:text-white transition-colors duration-300" />
                </div>
                <span className={cn('text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full border', d.badgeColor)}>
                  {d.badge}
                </span>
              </div>
              <h3 className="font-semibold text-base text-white mb-2">{d.title}</h3>
              <p className="text-sm text-[hsl(0,0%,63%)] leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 7: Features (30+) ──────────────────────────────
const FEATURE_TABS = [
  {
    id: 'crm', label: 'CRM & Vendas',
    items: [
      { icon: Users, title: 'CRM Completo', desc: 'Contatos, empresas, negociações — visão 360° do cliente.' },
      { icon: Target, title: 'Pipeline Kanban', desc: 'Arraste e solte negócios entre etapas.' },
      { icon: Trophy, title: 'Gamificação de Vendas', desc: 'Rankings, conquistas e pontuação.' },
      { icon: PieChart, title: 'Lead Scoring', desc: 'Pontue leads automaticamente.' },
    ]
  },
  {
    id: 'omnichannel', label: 'Comunicação Omnichannel',
    items: [
      { icon: MessageSquare, title: 'WhatsApp Multi-instância', desc: 'Múltiplos números, campanhas em massa, flows interativos.' },
      { icon: Mail, title: 'E-mail Marketing', desc: 'Campanhas, templates, domínio próprio com SPF/DKIM/DMARC.' },
      { icon: Instagram, title: 'Instagram DM', desc: 'Responda DMs, comentários e stories do inbox.' },
      { icon: Phone, title: 'SMS Bidirecional', desc: 'Campanhas SMS, respostas automáticas, integrado ao CRM.' },
      { icon: PhoneCall, title: 'VoIP com Créditos', desc: 'Chamadas VoIP, gravação, histórico, créditos flexíveis.' },
      { icon: Inbox, title: 'Inbox Unificado', desc: 'Todos os 5 canais em uma única tela com CSAT e IA.' },
    ]
  },
  {
    id: 'automacao', label: 'Automação & IA',
    items: [
      { icon: Workflow, title: 'Flow Builder com Analytics', desc: '20+ ações com métricas por nó: entradas, saídas e conversões.' },
      { icon: Bot, title: 'Agentes IA com RAG', desc: 'IA que acessa sua base e responde clientes.' },
      { icon: Zap, title: 'Automações Avançadas', desc: 'Triggers por webhook, formulário, tag, página visitada ou evento.' },
      { icon: Sparkles, title: 'Scoring Preditivo (IA)', desc: 'IA calcula probabilidade de conversão de cada lead.' },
      { icon: Globe, title: 'Site Tracking → Trigger', desc: 'Visitou uma página? Automação dispara.' },
      { icon: BarChart3, title: 'A/B de Fluxos Completos', desc: 'Compare fluxos inteiros e descubra qual converte mais.' },
    ]
  },
  {
    id: 'gestao', label: 'Gestão & Integrações',
    items: [
      { icon: Layers, title: 'Modo Agência', desc: 'Multi-tenant com dados isolados.' },
      { icon: Globe, title: 'Marketplace 30+ Integrações', desc: 'Google Ads, Calendly, Zapier, Mercado Pago e mais.' },
      { icon: Globe, title: 'Webhooks com Retry', desc: 'Fila de entrega com backoff e dead-letter.' },
      { icon: Shield, title: 'Permissões RBAC', desc: 'Controle quem vê e faz o quê.' },
    ]
  },
  {
    id: 'analytics', label: 'Inteligência & Analytics',
    items: [
      { icon: Brain, title: 'AI Builder', desc: 'Gere e-mails e copy com IA.' },
      { icon: Target, title: 'Win Probability', desc: 'IA calcula probabilidade de fechamento.' },
      { icon: BarChart3, title: 'Atribuição Multi-toque', desc: 'Descubra quais canais geram mais receita.' },
      { icon: Mail, title: 'Conteúdo Condicional', desc: 'Blocos dinâmicos em e-mails por tags e score.' },
    ]
  },
];

function FeaturesSection() {
  const [activeTab, setActiveTab] = useState('crm');
  const activeCat = FEATURE_TABS.find(t => t.id === activeTab) || FEATURE_TABS[0];

  return (
    <section id="funcionalidades" className="relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-16 relative z-10">
        <div className="max-w-xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(2,76%,53%)]/20 bg-[hsl(2,76%,53%)]/10 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-[hsl(2,76%,53%)] mb-4">
            <Layers className="h-3 w-3" />
            +30 funcionalidades
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
            Tudo que você precisa para vender mais —{' '}
            <span className="text-[hsl(2,76%,53%)]">sem precisar de mais ferramentas</span>
          </h2>
          <p className="text-[hsl(0,0%,63%)] text-base sm:text-lg">
            Cada funcionalidade foi construída para trabalhar junto. Não são peças separadas — é um sistema completo.
          </p>
        </div>

        <div className="flex overflow-x-auto pb-2 sm:flex-wrap sm:justify-center gap-2 mb-10 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
          {FEATURE_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all border whitespace-nowrap shrink-0',
                activeTab === tab.id
                  ? 'bg-[hsl(2,76%,53%)] text-white border-[hsl(2,76%,53%)]'
                  : 'bg-[hsl(0,0%,10%)] text-[hsl(0,0%,63%)] border-[hsl(0,0%,16%)] hover:border-[hsl(0,0%,30%)]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {activeCat.items.map((item, i) => (
            <div key={i} className="rounded-xl border border-[hsl(0,0%,16%)] bg-[hsl(0,0%,10%)] p-5 hover:border-[hsl(2,76%,53%)]/30 transition-all">
              <div className="h-9 w-9 rounded-lg bg-[hsl(2,76%,53%)]/10 flex items-center justify-center mb-3">
                <item.icon className="h-4 w-4 text-[hsl(2,76%,53%)]" />
              </div>
              <h4 className="font-semibold text-sm text-white mb-1.5">{item.title}</h4>
              <p className="text-xs text-[hsl(0,0%,63%)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 8: Brazilian Market ────────────────────────────
const BR_FEATURES = [
  { emoji: '💬', label: 'WhatsApp nativo' },
  { emoji: '📱', label: 'SMS com créditos' },
  { emoji: '☎️', label: 'VoIP com créditos' },
  { emoji: '💰', label: 'PIX e boleto' },
  { emoji: '🛒', label: 'Hotmart, Kiwify, Eduzz' },
  { emoji: '🛍️', label: 'Shopify integrado' },
  { emoji: '🇧🇷', label: 'Suporte em português' },
];

function BrazilSection() {
  return (
    <section className="border-y border-[hsl(0,0%,16%)] bg-[hsl(0,0%,7%)]">
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-16">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(2,76%,53%)]/20 bg-[hsl(2,76%,53%)]/10 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-[hsl(2,76%,53%)] mb-4">
            🇧🇷 Feito para o Brasil
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-6 text-white">
            A única plataforma all-in-one construída para o{' '}
            <span className="text-[hsl(2,76%,53%)]">mercado brasileiro</span>
          </h2>
          <p className="text-[hsl(0,0%,63%)] text-base leading-relaxed mb-4">
            HubSpot, ActiveCampaign, Intercom e ManyChat foram criados para o mercado americano. Cobram em dólar. Têm suporte apenas em inglês. Não têm integração nativa com WhatsApp, PIX, Hotmart ou Kiwify.
          </p>
          <p className="text-[hsl(0,0%,63%)] text-base leading-relaxed">
            A AG Sell foi construída para o Brasil. Preço em real, suporte em português, integração nativa com as ferramentas que você já usa — e tudo isso por uma fração do que você paga hoje.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
          {BR_FEATURES.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-full border border-[hsl(0,0%,16%)] bg-[hsl(0,0%,10%)] px-5 py-3 hover:border-[hsl(2,76%,53%)]/30 transition-all">
              <span className="text-lg">{f.emoji}</span>
              <span className="text-sm text-white font-medium">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 9: Migration ───────────────────────────────────
const MIGRATION_ITEMS = [
  { icon: Users, label: 'Contatos & Tags', desc: 'CSV, API ou Webhook' },
  { icon: Mail, label: 'Templates de E-mail', desc: 'HTML bruto ou JSON' },
  { icon: Zap, label: 'Automações', desc: 'Triggers e ações completas' },
  { icon: Workflow, label: 'Funis & Sequências', desc: 'Conteúdo dos e-mails + delays' },
];

function MigrationSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-16 relative z-10">
        <div className="max-w-xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(2,76%,53%)]/20 bg-[hsl(2,76%,53%)]/10 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-[hsl(2,76%,53%)] mb-4">
            <ArrowLeftRight className="h-3 w-3" />
            Migração sem fricção
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
            Migre sem medo. <span className="text-[hsl(2,76%,53%)]">Seus dados chegam inteiros.</span>
          </h2>
          <p className="text-[hsl(0,0%,63%)] text-base sm:text-lg">
            Em menos de 2 horas, seus contatos, automações, templates e funis estão na AG Sell. Sem perder nada. Sem downtime. Com suporte ao vivo.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto mb-10">
          {MIGRATION_ITEMS.map((item, i) => (
            <div key={i} className="rounded-xl border border-[hsl(0,0%,16%)] bg-[hsl(0,0%,10%)] p-4 text-center hover:border-[hsl(2,76%,53%)]/30 transition-all">
              <div className="h-10 w-10 rounded-lg bg-[hsl(2,76%,53%)]/10 flex items-center justify-center mx-auto mb-3">
                <item.icon className="h-5 w-5 text-[hsl(2,76%,53%)]" />
              </div>
              <p className="font-semibold text-sm text-white mb-0.5">{item.label}</p>
              <p className="text-xs text-[hsl(0,0%,63%)]">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto mb-6">
          {['ActiveCampaign', 'RD Station', 'SellFlux', 'Mailchimp', 'HubSpot', 'ManyChat'].map(name => (
            <div key={name} className="flex items-center gap-2 rounded-full border border-[hsl(0,0%,16%)] bg-[hsl(0,0%,10%)] px-4 py-2">
              <div className="h-6 w-6 rounded-full bg-[hsl(2,76%,53%)]/20 flex items-center justify-center text-[10px] font-bold text-[hsl(2,76%,53%)]">
                {name[0]}
              </div>
              <span className="text-sm text-white">{name}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 rounded-full border border-dashed border-[hsl(0,0%,25%)] px-4 py-2">
            <Upload className="h-4 w-4 text-[hsl(0,0%,63%)]" />
            <span className="text-sm text-[hsl(0,0%,63%)]">Qualquer plataforma via CSV/JSON</span>
          </div>
        </div>

        <div className="max-w-xl mx-auto rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-center mb-8">
          <p className="text-sm text-green-400 font-medium">
            🛡️ Se você perder qualquer dado durante a migração, devolvemos o valor do primeiro mês. Sem perguntas.
          </p>
        </div>

        <div className="text-center">
          <a href="#planos">
            <Button className="rounded-full bg-[hsl(2,76%,53%)] hover:bg-[hsl(2,76%,45%)] text-white" size="lg">
              Migrar agora <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 10: Plans ──────────────────────────────────────
interface Plan {
  id: string; name: string; slug: string; description: string | null;
  price_monthly: number; price_yearly: number;
  max_users: number; max_contacts: number; max_ai_requests_per_month: number;
  max_emails_per_month: number; max_whatsapp_messages: number;
  max_automations: number; max_forms: number; features: string[];
}

const FEATURE_LABELS: Record<string, string> = {
  crm_basico: 'CRM Básico', pipeline: 'Pipeline de Vendas', tarefas: 'Gestão de Tarefas',
  automacoes: 'Automações', email_marketing: 'E-mail Marketing', analytics: 'Analytics Avançado',
  lead_scoring: 'Lead Scoring', whatsapp: 'WhatsApp Business', integrações: 'Integrações',
  api: 'API Pública', white_label: 'White Label', suporte_prioritario: 'Suporte Prioritário',
};

const PLAN_REPLACES: Record<string, string> = {
  starter: 'Substitui: HubSpot + ActiveCampaign básico',
  professional: 'Substitui: HubSpot + ActiveCampaign + SellFlux + ManyChat',
  enterprise: 'Substitui: HubSpot + ActiveCampaign + SellFlux + ManyChat + Intercom + ChatGPT API',
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
      const { data, error } = await supabase.from('plans').select('*').eq('is_active', true).order('price_monthly', { ascending: true });
      if (!error && data) {
        setPlans(data.map(p => ({ ...p, features: Array.isArray(p.features) ? p.features as string[] : [], price_monthly: p.price_monthly || 0, price_yearly: p.price_yearly || 0, max_users: p.max_users || 1, max_contacts: p.max_contacts || 100, max_ai_requests_per_month: p.max_ai_requests_per_month || 0, max_emails_per_month: p.max_emails_per_month || 0, max_whatsapp_messages: p.max_whatsapp_messages || 0, max_automations: p.max_automations || 0, max_forms: p.max_forms || 0 })));
      }
      setIsLoading(false);
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = (plan: Plan) => { setSelectedPlan(plan); setShowCheckout(true); setFormData({ name: '', email: '', organizationName: '', couponCode: '' }); setShowCouponField(false); };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !formData.name || !formData.email || !formData.organizationName) { toast.error('Preencha todos os campos'); return; }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('guest-checkout', { body: { planId: selectedPlan.id, billingCycle, name: formData.name, email: formData.email, organizationName: formData.organizationName, couponCode: formData.couponCode || undefined } });
      if (error) throw error;
      if (data?.url) { window.location.href = data.url; }
      else if (data?.success) { toast.success('Conta criada! Verifique seu e-mail.'); setShowCheckout(false); }
    } catch { toast.error('Erro ao processar. Tente novamente.'); }
    finally { setIsSubmitting(false); }
  };

  const checkoutPrice = selectedPlan ? billingCycle === 'monthly' ? selectedPlan.price_monthly : selectedPlan.price_yearly : 0;
  const isFree = selectedPlan?.price_monthly === 0;

  return (
    <section id="planos" className="border-y border-[hsl(0,0%,16%)] bg-[hsl(0,0%,7%)]">
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(2,76%,53%)]/20 bg-[hsl(2,76%,53%)]/10 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-[hsl(2,76%,53%)] mb-4">
            PLANOS
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
            Escolha seu plano — e <span className="text-[hsl(2,76%,53%)]">comece a economizar hoje</span>
          </h2>
          <p className="text-[hsl(0,0%,63%)] text-base sm:text-lg max-w-lg mx-auto mb-8">
            Qualquer plano da AG Sell já substitui pelo menos 3 ferramentas que você paga hoje.
          </p>

          <div className="inline-flex items-center rounded-full border border-[hsl(0,0%,16%)] bg-[hsl(0,0%,10%)] p-1 mb-10">
            <button onClick={() => setBillingCycle('monthly')} className={cn('px-5 py-2 rounded-full text-sm font-medium transition-all', billingCycle === 'monthly' ? 'bg-[hsl(2,76%,53%)] text-white shadow-sm' : 'text-[hsl(0,0%,63%)] hover:text-white')}>
              Mensal
            </button>
            <button onClick={() => setBillingCycle('yearly')} className={cn('px-5 py-2 rounded-full text-sm font-medium transition-all', billingCycle === 'yearly' ? 'bg-[hsl(2,76%,53%)] text-white shadow-sm' : 'text-[hsl(0,0%,63%)] hover:text-white')}>
              Anual <span className="ml-1 text-xs text-green-400 font-bold">-17%</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[hsl(2,76%,53%)]" /></div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 text-[hsl(0,0%,63%)]">
            <p>Planos sendo configurados. Visite a <Link to="/pricing" className="text-[hsl(2,76%,53%)] underline">página de preços</Link>.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const isPro = plan.slug === 'professional';
              const price = billingCycle === 'monthly' ? plan.price_monthly : Math.round(plan.price_yearly / 12);

              return (
                <div key={plan.id} className={cn(
                  'relative rounded-2xl border p-6 transition-all hover:-translate-y-1 duration-300',
                  isPro ? 'border-[hsl(2,76%,53%)] bg-[hsl(2,76%,53%)]/5 shadow-lg shadow-[hsl(2,76%,53%)]/10 lg:scale-105' : 'border-[hsl(0,0%,16%)] bg-[hsl(0,0%,10%)]',
                )}>
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-[hsl(2,76%,53%)] text-white px-3 py-0.5 text-xs font-bold rounded-full flex items-center gap-1">
                        <Zap className="h-3 w-3" /> MAIS POPULAR
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    {plan.description && <p className="text-xs text-[hsl(0,0%,63%)] mt-1">{plan.description}</p>}
                  </div>

                  <div className="text-center mb-5">
                    {plan.price_monthly === 0 ? (
                      <span className="text-3xl font-bold text-white">Grátis</span>
                    ) : (
                      <>
                        <span className="text-3xl sm:text-4xl font-bold text-white">R$ {price}</span>
                        <span className="text-[hsl(0,0%,63%)] text-sm">/mês</span>
                      </>
                    )}
                  </div>

                  <div className="space-y-2 text-xs mb-4">
                    <div className="flex items-center gap-2 text-white"><Users className="h-4 w-4 text-[hsl(2,76%,53%)] shrink-0" />{plan.max_users === -1 ? 'Usuários ilimitados' : `${plan.max_users} usuário${plan.max_users > 1 ? 's' : ''}`}</div>
                    <div className="flex items-center gap-2 text-white"><Users className="h-4 w-4 text-[hsl(2,76%,53%)] shrink-0" />{plan.max_contacts === -1 ? 'Contatos ilimitados' : `${plan.max_contacts.toLocaleString()} contatos`}</div>
                    <div className="flex items-center gap-2 text-white"><Mail className="h-4 w-4 text-[hsl(2,76%,53%)] shrink-0" />{plan.max_emails_per_month === -1 ? 'E-mails ilimitados' : plan.max_emails_per_month === 0 ? 'Sem e-mail' : `${plan.max_emails_per_month.toLocaleString()} e-mails/mês`}</div>
                    <div className="flex items-center gap-2 text-white"><MessageSquare className="h-4 w-4 text-[hsl(2,76%,53%)] shrink-0" />{plan.features.includes('whatsapp') ? 'WhatsApp ilimitado' : 'WhatsApp não incluso'}</div>
                    <div className="flex items-center gap-2 text-white"><Brain className="h-4 w-4 text-[hsl(2,76%,53%)] shrink-0" />{plan.max_ai_requests_per_month === -1 ? 'IA ilimitada' : `${plan.max_ai_requests_per_month.toLocaleString()} req. IA/mês`}</div>
                    <div className="flex items-center gap-2 text-white"><Zap className="h-4 w-4 text-[hsl(2,76%,53%)] shrink-0" />{plan.max_automations === -1 ? 'Automações ilimitadas' : `${plan.max_automations} automações`}</div>
                  </div>

                  <div className="pt-3 border-t border-[hsl(0,0%,16%)] space-y-1.5 mb-5">
                    {(plan.features || []).slice(0, 5).map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs text-white">
                        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        {FEATURE_LABELS[f] || f}
                      </div>
                    ))}
                  </div>

                  {PLAN_REPLACES[plan.slug] && (
                    <p className="text-[10px] text-[hsl(0,0%,40%)] text-center mb-4 italic">{PLAN_REPLACES[plan.slug]}</p>
                  )}

                  <Button
                    className={cn('w-full h-10 text-sm rounded-full', isPro ? 'bg-[hsl(2,76%,53%)] hover:bg-[hsl(2,76%,45%)] text-white' : 'bg-white/10 text-white hover:bg-white/20 border border-[hsl(0,0%,25%)]')}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {plan.price_monthly === 0 ? 'Começar' : `Começar com ${plan.name}`}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4 text-sm text-[hsl(0,0%,63%)] mt-8">
          <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" />Sem cartão de crédito</span>
          <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" />Cancele quando quiser</span>
        </div>

        {/* Checkout Dialog */}
        {selectedPlan && (
          <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[hsl(2,76%,53%)]" />
                  {isFree ? 'Criar Conta Gratuita' : `Assinar ${selectedPlan.name}`}
                </DialogTitle>
                <DialogDescription>
                  {isFree ? 'Preencha seus dados para criar sua conta' : 'Preencha seus dados para continuar com o pagamento'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCheckoutSubmit} className="space-y-4 py-4">
                <div className="space-y-2"><Label htmlFor="idx-name">Seu Nome</Label><Input id="idx-name" placeholder="João Silva" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required /></div>
                <div className="space-y-2"><Label htmlFor="idx-email">E-mail</Label><Input id="idx-email" type="email" placeholder="joao@empresa.com" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required /></div>
                <div className="space-y-2"><Label htmlFor="idx-org">Nome da Empresa</Label><Input id="idx-org" placeholder="Minha Empresa LTDA" value={formData.organizationName} onChange={e => setFormData(p => ({ ...p, organizationName: e.target.value }))} required /></div>
                {!isFree && (
                  <>
                    {!showCouponField ? (
                      <button type="button" onClick={() => setShowCouponField(true)} className="flex items-center gap-1 text-sm text-[hsl(2,76%,53%)] hover:underline"><Tag className="h-3 w-3" />Tenho um cupom</button>
                    ) : (
                      <div className="space-y-2"><Label htmlFor="idx-coupon">Cupom</Label><Input id="idx-coupon" placeholder="CODIGO" value={formData.couponCode} onChange={e => setFormData(p => ({ ...p, couponCode: e.target.value.toUpperCase() }))} /></div>
                    )}
                    <div className="bg-[hsl(0,0%,16%)] rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{selectedPlan.name}</span>
                        <span className="font-bold">R$ {checkoutPrice}/{billingCycle === 'monthly' ? 'mês' : 'ano'}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{billingCycle === 'yearly' ? 'Cobrança anual com 17% de desconto' : 'Cobrança mensal recorrente'}</p>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Shield className="h-4 w-4" />{isFree ? 'Seus dados estão protegidos' : 'Pagamento seguro via Stripe'}</div>
                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCheckout(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isFree ? 'Criar Conta' : 'Continuar para Pagamento'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </section>
  );
}

// ─── SECTION 11: FAQ ────────────────────────────────────────
const FAQ_ITEMS = [
  { q: 'Preciso cancelar meu contrato atual com outras ferramentas?', a: 'Não. Você pode testar a AG Sell sem cancelar nada. Quando decidir migrar, a Central de Migração importa tudo automaticamente — contatos, automações, templates e funis.' },
  { q: 'E se eu precisar de uma funcionalidade que a AG Sell não tem?', a: 'A AG Sell tem API pública e Webhooks para integrar com qualquer sistema. Nossa equipe de produto lança novas funcionalidades toda semana. Você pode sugerir funcionalidades diretamente no nosso roadmap.' },
  { q: 'Meus dados ficam seguros?', a: 'Sim. Todos os dados são armazenados com RLS (Row Level Security) e permissões granulares. Seus dados nunca se misturam com os de outros clientes. Backup automático diário.' },
  { q: 'O suporte é bom?', a: 'Suporte em português, disponível via WhatsApp e chat. Sem fila de espera. Sem suporte apenas em inglês. Tempo médio de resposta: menos de 2 horas.' },
  { q: 'Funciona para agências?', a: 'Sim. O Modo Agência Multi-tenant permite gerenciar múltiplos clientes com dados 100% isolados, sem pagar plano Enterprise. Troca instantânea entre contas de clientes.' },
  { q: 'Quanto tempo leva para configurar?', a: 'Menos de 10 minutos para conectar o WhatsApp e criar as primeiras automações. A Central de Migração importa seus dados em menos de 2 horas.' },
];

function FAQSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-16 relative z-10">
        <div className="max-w-xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(2,76%,53%)]/20 bg-[hsl(2,76%,53%)]/10 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-[hsl(2,76%,53%)] mb-4">
            Dúvidas frequentes
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
            Respostas para as dúvidas mais comuns
          </h2>
        </div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-[hsl(0,0%,16%)] rounded-xl bg-[hsl(0,0%,10%)] px-5 overflow-hidden">
                <AccordionTrigger className="text-sm font-semibold text-white hover:no-underline py-4">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-[hsl(0,0%,63%)] leading-relaxed pb-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 12: CTA Final ──────────────────────────────────
function CTASection() {
  return (
    <section className="container mx-auto px-4 sm:px-6 py-10 md:py-16">
      <div className="relative rounded-3xl overflow-hidden px-6 sm:px-8 py-12 sm:py-16 md:py-20 text-center"
        style={{ background: 'linear-gradient(135deg, hsl(0,0%,8%) 0%, hsl(2,76%,15%) 100%)' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/3 pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            Pare de pagar por 6 ferramentas que não se falam.
          </h2>
          <p className="text-white/60 text-base sm:text-lg max-w-lg mx-auto mb-8">
            Comece hoje com a AG Sell e economize mais de R$ 1.650/mês — com mais integração, mais velocidade e mais vendas.
          </p>
          <a href="#planos" className="inline-block w-full sm:w-auto px-4 sm:px-0">
            <Button size="lg" className="h-12 sm:h-14 px-6 sm:px-10 text-sm sm:text-base font-semibold rounded-full bg-[hsl(2,76%,53%)] hover:bg-[hsl(2,76%,45%)] text-white shadow-lg shadow-[hsl(2,76%,53%)]/20 w-full sm:w-auto">
              Começar agora — a partir de R$ 197/mês
              <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5 shrink-0" />
            </Button>
          </a>
          <p className="text-xs text-white/40 mt-4">
            Mais de 100 empresas brasileiras já migraram para a AG Sell
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 13: Footer ─────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-[hsl(0,0%,16%)]" role="contentinfo">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <Logo variant="red" size="sm" showText />
          <nav className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-[hsl(0,0%,63%)]" aria-label="Links do rodapé">
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#diferenciais" className="hover:text-white transition-colors">Diferenciais</a>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
            <a href="#comparativo" className="hover:text-white transition-colors">Comparativo</a>
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacidade</Link>
            <Link to="/terms-of-service" className="hover:text-white transition-colors">Termos</Link>
          </nav>
          <p className="text-xs text-[hsl(0,0%,40%)]">
            © {new Date().getFullYear()} AG Sell. Todos os direitos reservados.
          </p>
        </div>

        <div className="sr-only" aria-hidden="true">
          <p>AG Sell é uma plataforma brasileira de CRM e automação de marketing all-in-one. Substitui HubSpot, ActiveCampaign, SellFlux, ManyChat, Intercom e ChatGPT API. CRM, WhatsApp multi-instância, e-mail marketing, agentes IA com RAG, inbox omnichannel, SMS, VoIP e automação — tudo integrado a partir de R$ 197/mês.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Floating Support Widget (mantido) ──────────────────────
function FloatingSupportWidget() {
  const [open, setOpen] = useState(false);
  const [waConfig, setWaConfig] = useState<{ phone_number: string; message: string }>({ phone_number: '', message: 'Olá, preciso de ajuda com a AG Sell' });

  useEffect(() => {
    supabase.from('platform_settings').select('value').eq('key', 'support_whatsapp').maybeSingle().then(({ data }) => {
      if (data?.value) {
        const val = data.value as any;
        setWaConfig({ phone_number: val.phone_number || '', message: val.message || 'Olá, preciso de ajuda com a AG Sell' });
      }
    });
  }, []);

  const waLink = waConfig.phone_number ? `https://wa.me/${waConfig.phone_number}?text=${encodeURIComponent(waConfig.message)}` : null;

  return (
    <>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      {open && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-72 rounded-2xl border border-[hsl(0,0%,16%)] bg-[hsl(0,0%,10%)] shadow-xl animate-fade-in">
          <div className="p-4 border-b border-[hsl(0,0%,16%)]">
            <h3 className="font-semibold text-sm text-white flex items-center gap-2"><Headphones className="h-4 w-4 text-[hsl(2,76%,53%)]" />Como podemos ajudar?</h3>
            <p className="text-xs text-[hsl(0,0%,63%)] mt-1">Escolha o melhor canal de atendimento</p>
          </div>
          <div className="p-2 space-y-1">
            {waLink ? (
              <a href={waLink} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0"><MessageSquare className="h-4 w-4 text-green-500" /></div>
                <div><p className="text-sm font-medium text-white">WhatsApp</p><p className="text-[10px] text-[hsl(0,0%,63%)]">Fale com nossa equipe agora</p></div>
              </a>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl opacity-50 cursor-not-allowed">
                <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0"><MessageSquare className="h-4 w-4 text-green-500" /></div>
                <div><p className="text-sm font-medium text-white">WhatsApp</p><p className="text-[10px] text-[hsl(0,0%,63%)]">Em breve disponível</p></div>
              </div>
            )}
            <a href="mailto:suporte@agsell.com.br?subject=Preciso%20de%20ajuda" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
              <div className="h-9 w-9 rounded-lg bg-[hsl(2,76%,53%)]/10 flex items-center justify-center shrink-0"><Mail className="h-4 w-4 text-[hsl(2,76%,53%)]" /></div>
              <div><p className="text-sm font-medium text-white">E-mail</p><p className="text-[10px] text-[hsl(0,0%,63%)]">suporte@agsell.com.br</p></div>
            </a>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-4 right-4 sm:right-6 z-50 h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300',
          'bg-[hsl(2,76%,53%)] text-white hover:scale-105 hover:shadow-xl',
          open && 'rotate-45'
        )}
        aria-label="Suporte"
      >
        {open ? <X className="h-6 w-6" /> : <Headphones className="h-6 w-6" />}
      </button>
    </>
  );
}

// ─── Main Landing Page ──────────────────────────────────────
export default function LandingPage() {
  useEffect(() => {
    document.title = 'AG Sell — CRM com WhatsApp, E-mail, IA e Automação | Plataforma All-in-One';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'AG Sell é a plataforma all-in-one que substitui HubSpot, ActiveCampaign, ManyChat, Intercom e ChatGPT. CRM, WhatsApp multi-instância, e-mail, agentes IA, inbox omnichannel, SMS, VoIP e automação — tudo integrado a partir de R$ 197/mês.');
    }
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(0,0%,5%)', color: 'white' }}>
      <Navbar />
      <div className="h-14 sm:h-16" />

      <main role="main">
        <HeroSection />
        <MetricsSection />
        <CostComparisonSection />
        <ComparisonTableSection />
        <DifferentialsSection />
        <FeaturesSection />
        <BrazilSection />
        <MigrationSection />
        <PlansSection />
        <FAQSection />
        <CTASection />
      </main>

      <Footer />
      <FloatingSupportWidget />
    </div>
  );
}
