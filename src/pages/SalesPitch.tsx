import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WhatsAppFloatingButton } from '@/components/vendas/WhatsAppFloatingButton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import {
  ArrowRight, ArrowLeft, ChevronRight, ChevronLeft,
  Check, X, Zap, MessageSquare, Bot, Mail,
  BarChart3, Shield, Phone, Brain, Workflow, Instagram,
  Users, Target, Inbox, Globe, Sparkles, DollarSign,
  Layers, Award, Maximize2, Minimize2,
  MousePointerClick, Clock, TrendingUp, HeartHandshake,
  Send, Rocket, Star, Play, Pause
} from 'lucide-react';

// ─── Slide Data ──────────────────────────────────────────────

const SLIDES: SlideConfig[] = [
  { id: 'cover', type: 'cover' },
  { id: 'problem', type: 'problem' },
  { id: 'cost', type: 'cost' },
  { id: 'solution', type: 'solution' },
  { id: 'features', type: 'features' },
  { id: 'channels', type: 'channels' },
  { id: 'ai', type: 'ai' },
  { id: 'comparison', type: 'comparison' },
  { id: 'migration', type: 'migration' },
  { id: 'testimonials', type: 'testimonials' },
  { id: 'cta', type: 'cta' },
];

interface SlideConfig {
  id: string;
  type: string;
}

// ─── Main Component ─────────────────────────────────────────

export default function SalesPitch() {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const total = SLIDES.length;

  const goTo = useCallback((index: number, dir?: 'next' | 'prev') => {
    if (isAnimating || index < 0 || index >= total) return;
    setDirection(dir || (index > current ? 'next' : 'prev'));
    setIsAnimating(true);
    setCurrent(index);
    setTimeout(() => setIsAnimating(false), 600);
  }, [current, total, isAnimating]);

  const next = useCallback(() => goTo(current + 1, 'next'), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1, 'prev'), [current, goTo]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'Escape' && isFullscreen) exitFullscreen();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, isFullscreen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Touch support
  const touchStart = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) { diff > 0 ? next() : prev(); }
    touchStart.current = null;
  };

  const slideComponents: Record<string, React.FC<{ active: boolean }>> = {
    cover: CoverSlide,
    problem: ProblemSlide,
    cost: CostSlide,
    solution: SolutionSlide,
    features: FeaturesSlide,
    channels: ChannelsSlide,
    ai: AISlide,
    comparison: ComparisonSlide,
    migration: MigrationSlide,
    testimonials: TestimonialsSlide,
    cta: CTASlide,
  };

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen bg-[hsl(0,0%,4%)] text-white overflow-hidden relative select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar */}
      <div className={cn(
        "absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3 transition-opacity duration-500",
        isFullscreen ? "opacity-0 hover:opacity-100" : "opacity-100"
      )}>
        <Link to="/">
          <Logo variant="red" size="sm" showText />
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-white/30 font-mono tabular-nums mr-2">
            {String(current + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
          </span>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
            title="Tela cheia (F)"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-40 h-[2px] bg-white/5">
        <div
          className="h-full bg-[hsl(2,76%,53%)] transition-all duration-500 ease-out"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>

      {/* Slides */}
      <div className="h-full w-full relative">
        {SLIDES.map((slide, i) => {
          const SlideComponent = slideComponents[slide.type];
          return (
            <div
              key={slide.id}
              className={cn(
                "absolute inset-0 transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]",
                i === current
                  ? "opacity-100 translate-x-0 scale-100 z-10"
                  : i < current
                  ? "opacity-0 -translate-x-[8%] scale-[0.96] z-0 pointer-events-none"
                  : "opacity-0 translate-x-[8%] scale-[0.96] z-0 pointer-events-none"
              )}
            >
              <SlideComponent active={i === current} />
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className={cn(
        "absolute bottom-6 left-0 right-0 z-50 flex items-center justify-center gap-3 transition-opacity duration-500",
        isFullscreen ? "opacity-0 hover:opacity-100" : "opacity-100"
      )}>
        <button
          onClick={prev}
          disabled={current === 0}
          className="p-2.5 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-400",
                i === current
                  ? "w-6 bg-[hsl(2,76%,53%)]"
                  : "w-1.5 bg-white/15 hover:bg-white/30"
              )}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={current === total - 1}
          className="p-2.5 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Keyboard hint */}
      {current === 0 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 text-[10px] text-white/20 flex items-center gap-2 animate-pulse">
          <span className="border border-white/10 rounded px-1.5 py-0.5 font-mono">←</span>
          <span className="border border-white/10 rounded px-1.5 py-0.5 font-mono">→</span>
          <span>ou deslize para navegar</span>
          <span className="ml-2 border border-white/10 rounded px-1.5 py-0.5 font-mono">F</span>
          <span>tela cheia</span>
        </div>
      )}
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────

function SlideContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("h-full w-full flex items-center justify-center p-6 sm:p-12 md:p-16 lg:p-20", className)}>
      {children}
    </div>
  );
}

function AnimatedItem({ children, delay = 0, active, className }: { children: React.ReactNode; delay?: number; active: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        active ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-4 blur-[2px]",
        className
      )}
      style={{ transitionDelay: active ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

const accent = "text-[hsl(2,76%,53%)]";
const accentBg = "bg-[hsl(2,76%,53%)]";
const accentBgSoft = "bg-[hsl(2,76%,53%)]/10";

// ─── SLIDE: Cover ───────────────────────────────────────────

function CoverSlide({ active }: { active: boolean }) {
  return (
    <SlideContainer>
      <div className="max-w-4xl w-full text-center">
        <AnimatedItem active={active} delay={0}>
          <div className="flex justify-center mb-8">
            <Logo variant="red" size="2xl" />
          </div>
        </AnimatedItem>

        <AnimatedItem active={active} delay={150}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[76px] font-bold tracking-tight leading-[0.95] mb-6">
            <span className="text-white/90">Venda mais.</span>
            <br />
            <span className="text-white/90">Gaste menos.</span>
            <br />
            <span className={accent}>Simplifique tudo.</span>
          </h1>
        </AnimatedItem>

        <AnimatedItem active={active} delay={300}>
          <p className="text-white/40 text-base sm:text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            A plataforma all-in-one que substitui 6 ferramentas — e custa menos que uma delas.
          </p>
        </AnimatedItem>

        <AnimatedItem active={active} delay={450}>
          <div className="mt-10 flex items-center justify-center gap-6 text-white/20 text-[11px] tracking-widest uppercase">
            <span>CRM</span>
            <span className="w-1 h-1 rounded-full bg-[hsl(2,76%,53%)]" />
            <span>WhatsApp</span>
            <span className="w-1 h-1 rounded-full bg-[hsl(2,76%,53%)]" />
            <span>E-mail</span>
            <span className="w-1 h-1 rounded-full bg-[hsl(2,76%,53%)]" />
            <span>IA</span>
            <span className="w-1 h-1 rounded-full bg-[hsl(2,76%,53%)]" />
            <span>Automação</span>
          </div>
        </AnimatedItem>
      </div>
    </SlideContainer>
  );
}

// ─── SLIDE: Problem ─────────────────────────────────────────

function ProblemSlide({ active }: { active: boolean }) {
  const items = [
    { icon: DollarSign, text: 'R$ 1.650+/mês em assinaturas separadas' },
    { icon: Layers, text: '6 logins diferentes todo santo dia' },
    { icon: Clock, text: 'Horas perdidas integrando via Zapier' },
    { icon: X, text: 'Dados do cliente espalhados em 5 plataformas' },
  ];
  return (
    <SlideContainer>
      <div className="max-w-4xl w-full">
        <AnimatedItem active={active} delay={0}>
          <p className={cn("text-sm font-semibold tracking-widest uppercase mb-4", accent)}>O problema</p>
        </AnimatedItem>
        <AnimatedItem active={active} delay={100}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-12 leading-tight">
            Sua operação está <span className={accent}>fragmentada</span> — e isso custa caro.
          </h2>
        </AnimatedItem>
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((item, i) => (
            <AnimatedItem key={i} active={active} delay={200 + i * 100}>
              <div className="flex items-start gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className={cn("shrink-0 h-10 w-10 rounded-xl flex items-center justify-center", accentBgSoft)}>
                  <item.icon className={cn("h-5 w-5", accent)} />
                </div>
                <p className="text-white/70 text-sm sm:text-base leading-relaxed pt-1.5">{item.text}</p>
              </div>
            </AnimatedItem>
          ))}
        </div>
      </div>
    </SlideContainer>
  );
}

// ─── SLIDE: Cost ────────────────────────────────────────────

function CostSlide({ active }: { active: boolean }) {
  const tools = [
    { name: 'HubSpot', price: 'R$ 400', cat: 'CRM' },
    { name: 'ActiveCampaign', price: 'R$ 300', cat: 'E-mail' },
    { name: 'SellFlux', price: 'R$ 250', cat: 'WhatsApp' },
    { name: 'ManyChat', price: 'R$ 150', cat: 'Chatbot' },
    { name: 'Intercom', price: 'R$ 350', cat: 'Inbox' },
    { name: 'ChatGPT API', price: 'R$ 200', cat: 'IA' },
  ];
  return (
    <SlideContainer>
      <div className="max-w-5xl w-full">
        <AnimatedItem active={active} delay={0}>
          <p className={cn("text-sm font-semibold tracking-widest uppercase mb-4", accent)}>Comparativo de custos</p>
        </AnimatedItem>

        <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-6 items-center">
          <AnimatedItem active={active} delay={100}>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-4">Hoje você paga</p>
              <div className="space-y-2.5">
                {tools.map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                    <div>
                      <span className="text-white/60 text-sm">{t.name}</span>
                      <span className="text-white/25 text-xs ml-2">({t.cat})</span>
                    </div>
                    <span className="text-white/50 text-sm font-mono tabular-nums">{t.price}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-white/40 text-xs uppercase tracking-wider">Total mensal</span>
                <span className="text-2xl font-bold text-red-400 font-mono tabular-nums">R$ 1.650</span>
              </div>
            </div>
          </AnimatedItem>

          <AnimatedItem active={active} delay={300}>
            <div className="flex lg:flex-col items-center gap-2 py-4">
              <div className="h-px lg:h-auto lg:w-px w-12 lg:h-12 bg-white/10" />
              <span className="text-white/20 text-xs font-semibold">VS</span>
              <div className="h-px lg:h-auto lg:w-px w-12 lg:h-12 bg-white/10" />
            </div>
          </AnimatedItem>

          <AnimatedItem active={active} delay={200}>
            <div className={cn("rounded-2xl border-2 border-[hsl(2,76%,53%)]/30 p-6 relative overflow-hidden", accentBgSoft)}>
              <div className="absolute top-0 right-0 px-3 py-1 bg-[hsl(2,76%,53%)] text-white text-[10px] font-bold rounded-bl-lg">
                ECONOMIA DE 88%
              </div>
              <div className="flex items-center gap-3 mb-6">
                <Logo variant="red" size="md" />
                <div>
                  <p className="font-bold text-lg">AG Sell</p>
                  <p className="text-white/40 text-xs">Tudo incluso. Uma assinatura.</p>
                </div>
              </div>
              <div className="space-y-2 mb-6">
                {['CRM Completo', 'WhatsApp + Instagram', 'E-mail Marketing', 'Automação & Flows', 'Inbox Omnichannel', 'Agentes IA', 'Lead Scoring', 'Portal de Suporte'].map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-green-400 shrink-0" />
                    <span className="text-white/70 text-sm">{f}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-[hsl(2,76%,53%)]/20">
                <p className="text-white/40 text-xs mb-1">A partir de</p>
                <p className="text-3xl font-bold font-mono tabular-nums">
                  R$ <span className={accent}>197</span><span className="text-base text-white/40">/mês</span>
                </p>
              </div>
            </div>
          </AnimatedItem>
        </div>
      </div>
    </SlideContainer>
  );
}

// ─── SLIDE: Solution ────────────────────────────────────────

function SolutionSlide({ active }: { active: boolean }) {
  return (
    <SlideContainer>
      <div className="max-w-4xl w-full text-center">
        <AnimatedItem active={active} delay={0}>
          <p className={cn("text-sm font-semibold tracking-widest uppercase mb-4", accent)}>A solução</p>
        </AnimatedItem>
        <AnimatedItem active={active} delay={100}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-8">
            Uma plataforma.
            <br />
            <span className={accent}>Toda a sua operação.</span>
          </h2>
        </AnimatedItem>
        <AnimatedItem active={active} delay={250}>
          <p className="text-white/50 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-12">
            CRM, comunicação multicanal, automação inteligente e IA trabalhando juntos —
            sem integrações quebradas, sem dados perdidos, sem complicação.
          </p>
        </AnimatedItem>
        <AnimatedItem active={active} delay={400}>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 max-w-2xl mx-auto">
            {[
              { icon: Users, label: 'CRM' },
              { icon: MessageSquare, label: 'WhatsApp' },
              { icon: Mail, label: 'E-mail' },
              { icon: Workflow, label: 'Automação' },
              { icon: Brain, label: 'IA' },
              { icon: Inbox, label: 'Inbox' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                <item.icon className={cn("h-5 w-5", accent)} />
                <span className="text-[11px] text-white/50">{item.label}</span>
              </div>
            ))}
          </div>
        </AnimatedItem>
      </div>
    </SlideContainer>
  );
}

// ─── SLIDE: Features ────────────────────────────────────────

function FeaturesSlide({ active }: { active: boolean }) {
  const features = [
    { icon: Target, title: 'CRM com Pipeline Kanban', desc: 'Contatos ilimitados, empresas, tarefas e gamificação.' },
    { icon: Workflow, title: 'Flow Builder Visual', desc: '20+ ações, testes A/B e analytics por nó.' },
    { icon: BarChart3, title: 'Analytics Avançado', desc: 'Atribuição multi-toque e relatórios de receita.' },
    { icon: Shield, title: 'Permissões RBAC', desc: 'Controle granular por função e recurso.' },
    { icon: Globe, title: 'API Pública & Webhooks', desc: 'Integre com qualquer sistema externo.' },
    { icon: Award, title: 'Modo Agência', desc: 'Multi-tenant com gestão centralizada.' },
  ];
  return (
    <SlideContainer>
      <div className="max-w-5xl w-full">
        <AnimatedItem active={active} delay={0}>
          <p className={cn("text-sm font-semibold tracking-widest uppercase mb-4", accent)}>60+ Recursos</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-10">
            Cada detalhe <span className={accent}>pensado</span> para vender mais.
          </h2>
        </AnimatedItem>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <AnimatedItem key={i} active={active} delay={150 + i * 80}>
              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-[hsl(2,76%,53%)]/20 transition-colors h-full">
                <f.icon className={cn("h-5 w-5 mb-3", accent)} />
                <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
                <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
              </div>
            </AnimatedItem>
          ))}
        </div>
      </div>
    </SlideContainer>
  );
}

// ─── SLIDE: Channels ────────────────────────────────────────

function ChannelsSlide({ active }: { active: boolean }) {
  const channels = [
    { icon: MessageSquare, name: 'WhatsApp', desc: 'QR Code + API Oficial, multi-instância, campanhas em massa, grupos pagos.' },
    { icon: Mail, name: 'E-mail', desc: 'Domínio próprio, templates drag-and-drop, warmup automático.' },
    { icon: Instagram, name: 'Instagram', desc: 'DMs automatizadas, lookup de perfis, integração nativa.' },
    { icon: Phone, name: 'Telefonia VoIP', desc: 'Softphone integrado, gravação, transcrição por IA.' },
    { icon: Send, name: 'SMS', desc: 'Marketing bidirecional com créditos acessíveis.' },
    { icon: Globe, name: 'Telegram', desc: 'Bot integrado com resposta automática.' },
  ];
  return (
    <SlideContainer>
      <div className="max-w-5xl w-full">
        <AnimatedItem active={active} delay={0}>
          <p className={cn("text-sm font-semibold tracking-widest uppercase mb-4", accent)}>Comunicação</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-10">
            <span className={accent}>8 canais.</span> Uma caixa de entrada.
          </h2>
        </AnimatedItem>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((c, i) => (
            <AnimatedItem key={i} active={active} delay={150 + i * 80}>
              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", accentBgSoft)}>
                    <c.icon className={cn("h-4.5 w-4.5", accent)} />
                  </div>
                  <h3 className="font-semibold text-sm">{c.name}</h3>
                </div>
                <p className="text-white/40 text-xs leading-relaxed">{c.desc}</p>
              </div>
            </AnimatedItem>
          ))}
        </div>
      </div>
    </SlideContainer>
  );
}

// ─── SLIDE: AI ──────────────────────────────────────────────

function AISlide({ active }: { active: boolean }) {
  const capabilities = [
    'Agentes IA com base de conhecimento (RAG)',
    'Lead Scoring preditivo com machine learning',
    'Envio no melhor horário por contato',
    'Análise de sentimento em tempo real',
    'Transcrição automática de áudio',
    'Assistente em linguagem natural',
    'Win Probability por negócio',
    'Sugestões inteligentes de segmentação',
  ];
  return (
    <SlideContainer>
      <div className="max-w-4xl w-full grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <AnimatedItem active={active} delay={0}>
            <p className={cn("text-sm font-semibold tracking-widest uppercase mb-4", accent)}>Inteligência Artificial</p>
          </AnimatedItem>
          <AnimatedItem active={active} delay={100}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
              IA que <span className={accent}>trabalha</span> enquanto você dorme.
            </h2>
          </AnimatedItem>
          <AnimatedItem active={active} delay={200}>
            <p className="text-white/50 text-sm leading-relaxed">
              Não é só um chatbot. É uma equipe de IA integrada ao seu CRM, automações e comunicação — 24 horas por dia.
            </p>
          </AnimatedItem>
        </div>
        <div className="space-y-2.5">
          {capabilities.map((cap, i) => (
            <AnimatedItem key={i} active={active} delay={250 + i * 60}>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                <Check className="h-4 w-4 text-green-400 shrink-0" />
                <span className="text-white/70 text-sm">{cap}</span>
              </div>
            </AnimatedItem>
          ))}
        </div>
      </div>
    </SlideContainer>
  );
}

// ─── SLIDE: Comparison ──────────────────────────────────────

function ComparisonSlide({ active }: { active: boolean }) {
  const rows = [
    { feature: 'CRM com Pipeline Kanban', them: false, us: true },
    { feature: 'WhatsApp QR + API Oficial', them: false, us: true },
    { feature: 'E-mail com Domínio Próprio', them: '~', us: true },
    { feature: 'Inbox Unificado (6+ canais)', them: false, us: true },
    { feature: 'Flow Builder com A/B Test', them: false, us: true },
    { feature: 'Agentes IA com RAG', them: false, us: true },
    { feature: 'Grupos Pagos no WhatsApp', them: false, us: true },
    { feature: 'Lead Scoring + Win Probability', them: false, us: true },
    { feature: 'Portal de Suporte White-label', them: false, us: true },
    { feature: 'Modo Agência Multi-tenant', them: false, us: true },
  ];
  return (
    <SlideContainer>
      <div className="max-w-3xl w-full">
        <AnimatedItem active={active} delay={0}>
          <p className={cn("text-sm font-semibold tracking-widest uppercase mb-4", accent)}>Comparativo</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-8">
            AG Sell vs. <span className="text-white/30">ferramentas avulsas</span>
          </h2>
        </AnimatedItem>
        <AnimatedItem active={active} delay={150}>
          <div className="rounded-2xl border border-white/5 overflow-hidden">
            <div className="grid grid-cols-[1fr_80px_80px] bg-white/[0.03] border-b border-white/5 px-5 py-3">
              <span className="text-[11px] font-semibold text-white/30 uppercase tracking-wider">Recurso</span>
              <span className="text-[11px] font-semibold text-white/30 uppercase tracking-wider text-center">Outros</span>
              <span className={cn("text-[11px] font-semibold uppercase tracking-wider text-center", accent)}>AG Sell</span>
            </div>
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_80px] px-5 py-2.5 border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors">
                <span className="text-xs text-white/60">{r.feature}</span>
                <div className="flex justify-center">
                  {r.them === false ? <X className="h-3.5 w-3.5 text-red-400/50" /> : <span className="text-[10px] text-yellow-400/50">Parcial</span>}
                </div>
                <div className="flex justify-center">
                  <Check className="h-3.5 w-3.5 text-green-400" />
                </div>
              </div>
            ))}
          </div>
        </AnimatedItem>
      </div>
    </SlideContainer>
  );
}

// ─── SLIDE: Migration ───────────────────────────────────────

function MigrationSlide({ active }: { active: boolean }) {
  return (
    <SlideContainer>
      <div className="max-w-4xl w-full text-center">
        <AnimatedItem active={active} delay={0}>
          <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6", accentBgSoft)}>
            <Zap className={cn("h-8 w-8", accent)} />
          </div>
        </AnimatedItem>
        <AnimatedItem active={active} delay={100}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
            Migre em <span className={accent}>minutos</span>, não em semanas.
          </h2>
        </AnimatedItem>
        <AnimatedItem active={active} delay={200}>
          <p className="text-white/50 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            Central de Migração integrada com importação via CSV, JSON, API e Webhook.
            Traga contatos, templates, automações e funis de qualquer plataforma.
          </p>
        </AnimatedItem>
        <AnimatedItem active={active} delay={350}>
          <div className="flex flex-wrap justify-center gap-2">
            {['ActiveCampaign', 'HubSpot', 'RD Station', 'SellFlux', 'Mailchimp', 'ManyChat', 'Intercom', 'Zendesk'].map((t) => (
              <span key={t} className="px-3 py-1.5 rounded-full border border-white/10 text-white/40 text-xs">
                {t}
              </span>
            ))}
          </div>
        </AnimatedItem>
      </div>
    </SlideContainer>
  );
}

// ─── SLIDE: Testimonials ────────────────────────────────────

function TestimonialsSlide({ active }: { active: boolean }) {
  const stats = [
    { value: '60+', label: 'Funcionalidades', icon: Sparkles },
    { value: '8', label: 'Canais integrados', icon: Inbox },
    { value: '88%', label: 'Economia média', icon: TrendingUp },
    { value: '100%', label: 'Brasileiro', icon: HeartHandshake },
  ];
  return (
    <SlideContainer>
      <div className="max-w-4xl w-full">
        <AnimatedItem active={active} delay={0}>
          <p className={cn("text-sm font-semibold tracking-widest uppercase mb-4 text-center", accent)}>Por que escolher a AG Sell</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-12 text-center leading-tight">
            Números que <span className={accent}>falam por si.</span>
          </h2>
        </AnimatedItem>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <AnimatedItem key={i} active={active} delay={200 + i * 100}>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-3", accent)} />
                <p className="text-3xl sm:text-4xl font-bold font-mono tabular-nums mb-1">{s.value}</p>
                <p className="text-white/40 text-xs">{s.label}</p>
              </div>
            </AnimatedItem>
          ))}
        </div>
        <AnimatedItem active={active} delay={600}>
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {[
              { text: 'Suporte em português, sem fila', icon: HeartHandshake },
              { text: 'Sem contrato anual, sem multa', icon: Shield },
              { text: 'Setup guiado — funciona no mesmo dia', icon: Rocket },
            ].map((g, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <g.icon className={cn("h-4 w-4 shrink-0", accent)} />
                <span className="text-white/60 text-xs">{g.text}</span>
              </div>
            ))}
          </div>
        </AnimatedItem>
      </div>
    </SlideContainer>
  );
}

// ─── SLIDE: CTA ─────────────────────────────────────────────

function CTASlide({ active }: { active: boolean }) {
  return (
    <SlideContainer className="relative overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-[hsl(2,76%,53%)]/8 blur-[120px]" />
      </div>

      <div className="max-w-3xl w-full text-center relative z-10">
        <AnimatedItem active={active} delay={0}>
          <Logo variant="red" size="xl" className="mx-auto mb-8" />
        </AnimatedItem>
        <AnimatedItem active={active} delay={150}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
            Pronto para <span className={accent}>simplificar</span> sua operação?
          </h2>
        </AnimatedItem>
        <AnimatedItem active={active} delay={300}>
          <p className="text-white/50 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10">
            Planos a partir de R$ 197/mês. Suporte dedicado desde o primeiro dia.
            Migração assistida sem custo adicional.
          </p>
        </AnimatedItem>
        <AnimatedItem active={active} delay={450}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/pricing">
              <Button size="lg" className={cn("rounded-full px-10 text-white font-semibold text-base h-14 shadow-lg shadow-[hsl(2,76%,53%)]/20", accentBg, "hover:bg-[hsl(2,76%,45%)]")}>
                Escolher meu plano <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/features">
              <Button variant="outline" size="lg" className="rounded-full px-8 border-white/10 text-white hover:bg-white/5 text-base h-14">
                Ver funcionalidades
              </Button>
            </Link>
          </div>
        </AnimatedItem>
        <AnimatedItem active={active} delay={600}>
          <p className="mt-8 text-white/20 text-xs">
            Sem contrato anual · Sem surpresas · Cancele quando quiser
          </p>
        </AnimatedItem>
      </div>
      <WhatsAppFloatingButton />
    </SlideContainer>
  );
}
