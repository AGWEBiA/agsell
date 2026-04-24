import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { PlatformDemoPlayer } from '@/components/vendas/PlatformDemoPlayer';
import { VendasPlansBox } from '@/components/vendas/VendasPlansBox';
import { WhatsAppFloatingButton } from '@/components/vendas/WhatsAppFloatingButton';
import { WhatsNewSection } from '@/components/vendas/WhatsNewSection';
import {
  ArrowRight, Check, Star, MessageSquare, Mail, Bot,
  BarChart3, Users, Workflow, Phone, Instagram, Send, Brain,
  Target, Inbox, Globe, Shield, Sparkles, TrendingUp, Award, Briefcase,
} from 'lucide-react';

import featCrm from '@/assets/vendas-feature-crm.jpg';
import featOmni from '@/assets/vendas-feature-omnichannel.jpg';
import featAuto from '@/assets/vendas-feature-automation.jpg';
import featAi from '@/assets/vendas-feature-ai.jpg';

import trailCrm from '@/assets/vendas-trail-crm.jpg';
import trailOmni from '@/assets/vendas-trail-omnichannel.jpg';
import trailAuto from '@/assets/vendas-trail-automation.jpg';
import trailAi from '@/assets/vendas-trail-ai.jpg';
import trailMkt from '@/assets/vendas-trail-marketing.jpg';
import trailSup from '@/assets/vendas-trail-support.jpg';

import andersonPic from '@/assets/vendas-anderson-gomes.jpg';

const STACK_ITEMS = [
  { name: 'WhatsApp', icon: MessageSquare, color: 'text-green-400' },
  { name: 'E-mail', icon: Mail, color: 'text-blue-400' },
  { name: 'Instagram', icon: Instagram, color: 'text-pink-400' },
  { name: 'Telegram', icon: Send, color: 'text-sky-400' },
  { name: 'SMS', icon: MessageSquare, color: 'text-amber-400' },
  { name: 'VoIP', icon: Phone, color: 'text-cyan-400' },
  { name: 'AI Agents', icon: Bot, color: 'text-rose-400' },
  { name: 'Flow Builder', icon: Workflow, color: 'text-purple-400' },
  { name: 'CRM', icon: Users, color: 'text-orange-400' },
  { name: 'Analytics', icon: BarChart3, color: 'text-emerald-400' },
  { name: 'Forms', icon: Inbox, color: 'text-yellow-400' },
  { name: 'Landing', icon: Globe, color: 'text-indigo-400' },
];

const FEATURES = [
  {
    title: 'CRM Inteligente',
    desc: 'Pipeline visual estilo kanban, gestão de contatos, empresas, deals e tarefas. Tudo conectado e em tempo real.',
    image: featCrm,
    bullets: ['Pipeline kanban drag-and-drop', 'Lead scoring automático', 'Tarefas e atividades centralizadas'],
  },
  {
    title: 'Inbox Omnichannel',
    desc: 'WhatsApp (QR e Oficial), E-mail, Instagram, Telegram, SMS e VoIP em uma única tela de atendimento — com botões interativos, enquetes, reações e mídia rica nativos do WhatsApp.',
    image: featOmni,
    bullets: ['Botões, listas, enquetes e reações no WhatsApp', 'Áudio PTT, vídeo, localização e vCard', 'Menções em grupos (incluindo @all) com visualização no Inbox'],
  },
  {
    title: 'Flow Builder Visual',
    desc: 'Construa automações complexas arrastando e soltando. 50+ gatilhos, condições, A/B testing e analytics por nó.',
    image: featAuto,
    bullets: ['50+ gatilhos prontos', 'Condicionais visuais e timers', 'Analytics em cada etapa'],
  },
  {
    title: 'IA Generativa',
    desc: 'Agentes IA com base de conhecimento (RAG), lead scoring preditivo, transcrição de áudio e envio inteligente.',
    image: featAi,
    bullets: ['Agentes 24/7 multicanal', 'Scoring preditivo de leads', 'Análise de sentimento'],
  },
];

const STATS = [
  { value: '+60', label: 'Funcionalidades', sub: 'Tudo que você precisa em um único lugar.' },
  { value: '8', label: 'Canais', sub: 'WhatsApp, E-mail, Instagram, SMS, VoIP e mais.' },
  { value: '+50', label: 'Gatilhos', sub: 'Automações inteligentes baseadas em comportamento.' },
  { value: '100%', label: 'Brasileiro', sub: 'Suporte e infraestrutura nacional, em português.' },
];

const TRAILS = [
  {
    title: 'CRM Completo',
    desc: 'Centralize contatos, empresas, pipeline kanban e tarefas em uma única plataforma.',
    image: trailCrm,
    icon: Users,
    color: 'text-blue-400',
  },
  {
    title: 'Comunicação Omnichannel',
    desc: 'Configure WhatsApp (QR + Oficial), E-mail com domínio próprio, Instagram, SMS e VoIP.',
    image: trailOmni,
    icon: MessageSquare,
    color: 'text-green-400',
  },
  {
    title: 'Automação Avançada',
    desc: 'Crie fluxos visuais com 50+ gatilhos, sequências drip, A/B testing e analytics por nó.',
    image: trailAuto,
    icon: Workflow,
    color: 'text-purple-400',
  },
  {
    title: 'IA Aplicada a Vendas',
    desc: 'Agentes com RAG, lead scoring preditivo, análise de sentimento e envio inteligente.',
    image: trailAi,
    icon: Brain,
    color: 'text-rose-400',
  },
  {
    title: 'Marketing & Vendas',
    desc: 'Landing pages, formulários, campanhas, atribuição multi-toque e funnel BI.',
    image: trailMkt,
    icon: Target,
    color: 'text-orange-400',
  },
  {
    title: 'Suporte & SAC',
    desc: 'Inbox unificado, distribuição inteligente, CSAT, transcrição de áudio e portal white-label.',
    image: trailSup,
    icon: Inbox,
    color: 'text-cyan-400',
  },
];

const TESTIMONIALS = [
  {
    name: 'Carla Mendes',
    role: 'CEO, AgenciaMM',
    text: 'Substituímos HubSpot, ActiveCampaign e ManyChat. Economia de R$ 4 mil/mês e dados unificados.',
    avatar: 'CM',
  },
  {
    name: 'Rafael Souza',
    role: 'Head de Vendas, NovaTech',
    text: 'O Flow Builder do AG Sell é absurdamente poderoso. Criamos jornadas que antes levavam semanas.',
    avatar: 'RS',
  },
  {
    name: 'Júlia Rocha',
    role: 'CMO, EduPlay',
    text: 'A IA de scoring preditivo dobrou nossa taxa de conversão. ROI em menos de 30 dias.',
    avatar: 'JR',
  },
];

const FAQ = [
  {
    q: 'Preciso instalar alguma coisa?',
    a: 'Não. O AG Sell é 100% web. Você acessa de qualquer navegador, em qualquer dispositivo.',
  },
  {
    q: 'Posso migrar de outras ferramentas?',
    a: 'Sim. Temos a Central de Migração com importação via CSV, JSON, API e Webhook para ActiveCampaign, HubSpot, RD Station, SellFlux e Mailchimp.',
  },
  {
    q: 'Como funciona o suporte?',
    a: 'Suporte humano em português via chat e e-mail, com SLA garantido. Agentes IA também disponíveis 24/7.',
  },
  {
    q: 'Tem período de teste?',
    a: 'Oferecemos garantia de 7 dias. Não gostou, devolvemos seu dinheiro sem perguntas.',
  },
];

export default function Vendas() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-primary/30 antialiased">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/85 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/"><Logo variant="red" size="md" showText /></Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <a href="#novidades" className="text-primary hover:text-white transition-colors font-semibold">✨ Novidades</a>
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#trilhas" className="hover:text-white transition-colors">Trilhas</a>
            <a href="#especialistas" className="hover:text-white transition-colors">Especialistas</a>
            <Link to="/pricing" className="hover:text-white transition-colors">Planos</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:block">
              <Button variant="outline" size="sm" className="rounded-full px-5 border-white/15 text-white/80 hover:bg-white/5 bg-transparent">
                Entrar
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="sm" className="rounded-full px-5 bg-primary hover:bg-primary/90 font-semibold">
                Assinar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="h-16" />

      {/* HERO */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 md:pb-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[140px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-orange-500/5 blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.04] border border-white/5 font-mono text-xs sm:text-sm mb-6">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-white/40">print(</span>
                <span className="text-primary font-semibold">"Vender mais"</span>
                <span className="text-white/40">)</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
                A maior plataforma de
                <br />
                <span className="text-primary">vendas e automação</span>
                <br />
                do Brasil
              </h1>

              <p className="text-base sm:text-lg text-white/60 leading-relaxed mb-8 max-w-xl">
                Saia do zero e venda mais com CRM, WhatsApp, E-mail, Automação e IA — tudo
                integrado em uma única plataforma. Migre em minutos, não em semanas.
              </p>

              <div className="flex items-center gap-4 mb-8">
                <div className="flex -space-x-2">
                  {['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-pink-500'].map((c, i) => (
                    <div key={i} className={`h-9 w-9 rounded-full ${c} border-2 border-[#0A0A0A] flex items-center justify-center text-xs font-bold`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-white/50">
                  <p className="italic">Junte-se a milhares de empresas</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="ml-1 text-xs text-white/40">4.9/5</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/pricing">
                  <Button size="lg" className="rounded-full px-8 h-12 bg-primary hover:bg-primary/90 font-semibold text-base w-full sm:w-auto">
                    Começar agora <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="#trilhas">
                  <Button variant="outline" size="lg" className="rounded-full px-8 h-12 border-white/15 text-white hover:bg-white/5 bg-transparent text-base w-full sm:w-auto">
                    Ver trilhas
                  </Button>
                </a>
              </div>
            </div>

            {/* Right — Presentation video */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 via-transparent to-orange-500/20 rounded-[2rem] blur-2xl opacity-60" />
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black aspect-video">
                <video
                  src="/videos/agsell-presentation.mp4"
                  controls
                  playsInline
                  preload="none"
                  poster="/videos/agsell-presentation-thumb.jpg"
                  className="w-full h-full object-cover"
                >
                  <track kind="captions" />
                </video>
              </div>
              <p className="text-center text-xs text-white/30 mt-4 italic">Apresentação oficial — narração + tour pela plataforma</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stack scroll */}
      <section id="stack" className="py-12 border-y border-white/5 bg-white/[0.015] overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 mb-6">
          <p className="text-center text-xs text-white/30 uppercase tracking-widest font-semibold">
            Tudo o que você precisa para vender — em um só lugar
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-5xl mx-auto px-4">
          {STACK_ITEMS.map((s, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
            >
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-sm text-white/80 font-medium">{s.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* O que você encontra (com imagens, estilo Asimov) */}
      <section id="funcionalidades" className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              O que você encontra no <span className="text-primary">AG Sell?</span>
            </h2>
            <p className="text-white/60 text-base sm:text-lg">
              Quatro pilares que substituem dezenas de ferramentas separadas — tudo conectado nativamente.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mb-16">
            {STATS.map((s, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:p-8 hover:border-primary/20 transition-all group"
              >
                <p className="text-4xl sm:text-5xl font-bold text-primary mb-1 group-hover:scale-105 transition-transform origin-left">
                  {s.value}
                </p>
                <p className="text-sm font-semibold text-white mb-2">{s.label}</p>
                <p className="text-xs text-white/40 leading-relaxed">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Feature blocks alternados com imagens */}
          <div className="space-y-20 md:space-y-28 max-w-6xl mx-auto">
            {FEATURES.map((f, i) => {
              const reversed = i % 2 === 1;
              return (
                <div
                  key={i}
                  className={`grid lg:grid-cols-2 gap-8 lg:gap-14 items-center ${reversed ? 'lg:[&>div:first-child]:order-2' : ''}`}
                >
                  {/* Image */}
                  <div className="relative">
                    <div className="absolute -inset-3 bg-gradient-to-br from-primary/20 via-transparent to-purple-500/10 rounded-2xl blur-2xl opacity-60" />
                    <div className="relative rounded-2xl border border-white/10 overflow-hidden bg-zinc-900 shadow-2xl">
                      <img
                        src={f.image}
                        alt={f.title}
                        className="w-full h-auto"
                        loading="lazy"
                        width={1024}
                        height={768}
                      />
                    </div>
                  </div>

                  {/* Text */}
                  <div>
                    <p className="text-xs font-mono text-primary uppercase tracking-widest mb-3">
                      {String(i + 1).padStart(2, '0')} — Módulo
                    </p>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">{f.title}</h3>
                    <p className="text-white/60 text-base leading-relaxed mb-6">{f.desc}</p>
                    <ul className="space-y-3">
                      {f.bullets.map((b, bi) => (
                        <li key={bi} className="flex items-start gap-3 text-sm text-white/75">
                          <div className="h-5 w-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="h-3 w-3 text-primary" />
                          </div>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Novidades — recursos recém-lançados */}
      <WhatsNewSection />

      {/* Trilhas (com imagens, sem "Aprenda") */}
      <section id="trilhas" className="py-20 md:py-28 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Organizado por <span className="text-primary">trilhas</span> de funcionalidades
            </h2>
            <p className="text-white/60 text-base sm:text-lg leading-relaxed">
              No AG Sell, os recursos são organizados por trilhas práticas. Defina o que você
              quer fazer e tenha exatamente o necessário para atingir seu objetivo.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {TRAILS.map((t, i) => (
              <div
                key={i}
                className="group relative rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent overflow-hidden hover:border-primary/30 transition-all cursor-pointer"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-zinc-950">
                  <img
                    src={t.image}
                    alt={t.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    width={800}
                    height={600}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    <div className="h-9 w-9 rounded-lg bg-black/60 backdrop-blur border border-white/10 flex items-center justify-center">
                      <t.icon className={`h-4 w-4 ${t.color}`} />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                    {t.title}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed mb-3">{t.desc}</p>
                  <div className="flex items-center text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Explorar trilha <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONHEÇA OS ESPECIALISTAS */}
      <section id="especialistas" className="py-20 md:py-28 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[140px]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl mb-14">
            <p className="inline-block text-xs font-mono text-primary uppercase tracking-widest mb-4 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              Conheça os especialistas
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Construído por quem <span className="text-primary">vive vendas</span> todo dia
            </h2>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.3fr] gap-10 lg:gap-16 items-center max-w-6xl mx-auto">
            {/* Foto */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 via-transparent to-orange-500/20 rounded-[2rem] blur-2xl opacity-60" />
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 aspect-[4/5] max-w-md mx-auto lg:mx-0">
                <img
                  src={andersonPic}
                  alt="Anderson Gomes"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={800}
                  height={1000}
                />
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black via-black/70 to-transparent">
                  <p className="text-xl font-bold mb-1">Anderson Gomes</p>
                  <p className="text-sm text-primary">Fundador & Líder Estratégico</p>
                </div>
              </div>
            </div>

            {/* Texto */}
            <div>
              <p className="text-base sm:text-lg text-white/75 leading-relaxed mb-6">
                A AG Sell foi pensada e desenvolvida por uma equipe focada em <span className="text-white font-semibold">escalar vendas no digital</span>,
                com mais de <span className="text-primary font-semibold">10 anos de experiência</span> e
                <span className="text-primary font-semibold"> múltiplos 8 dígitos faturados</span> somente com infoprodutos.
              </p>
              <p className="text-base sm:text-lg text-white/75 leading-relaxed mb-8">
                Essa equipe é da <span className="text-white font-semibold">AG WEBi</span>, que tem como líder
                <span className="text-white font-semibold"> Anderson Gomes</span> — especialista em estratégias de marketing,
                vendas e aceleração de negócios.
              </p>

              <div className="grid sm:grid-cols-3 gap-3 mb-8">
                {[
                  { icon: Award, value: '10+', label: 'Anos de experiência' },
                  { icon: TrendingUp, value: '8 dígitos', label: 'Faturados em infoprodutos' },
                  { icon: Briefcase, value: 'AG WEBi', label: 'Aceleradora oficial' },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <item.icon className="h-5 w-5 text-primary mb-2" />
                    <p className="text-xl font-bold mb-0.5">{item.value}</p>
                    <p className="text-xs text-white/40">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 text-sm text-white/50 italic border-l-2 border-primary/40 pl-4">
                "Cada feature da AG Sell nasceu de uma dor real de quem está vendendo todo dia.
                Não é teoria — é o que funciona na prática."
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Big CTA / Mission */}
      <section className="py-24 md:py-32 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/8 blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center max-w-3xl">
          <Sparkles className="h-10 w-10 text-primary mx-auto mb-6" />
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
            Sua operação inteira.
            <br />
            <span className="text-primary">Uma só plataforma.</span>
          </h2>
          <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
            Pare de pagar por 5+ ferramentas separadas. Substitua HubSpot, ActiveCampaign,
            ManyChat, Intercom e mais — com economia média de R$ 3.500/mês.
          </p>
          <Link to="/pricing">
            <Button size="lg" className="rounded-full px-10 h-14 bg-primary hover:bg-primary/90 font-semibold text-base">
              Quero começar agora <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Pricing Box completo */}
      <section id="planos" className="py-20 md:py-28 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-primary mb-4">
              Planos &amp; Preços
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Escolha o plano ideal para <span className="text-primary">sua operação</span>
            </h2>
            <p className="text-white/55 text-base">
              Qualquer plano AG Sell substitui pelo menos 3 ferramentas que você paga hoje.
            </p>
          </div>
          <VendasPlansBox variant="full" />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Quem usa, <span className="text-primary">recomenda</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] p-7 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Perguntas frequentes</h2>
            <p className="text-white/50 text-sm">Tudo o que você precisa saber antes de começar.</p>
          </div>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <details
                key={i}
                className="group rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-colors"
              >
                <summary className="cursor-pointer p-5 flex items-center justify-between text-sm font-medium list-none">
                  <span>{f.q}</span>
                  <span className="text-primary text-xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-5 pb-5 text-sm text-white/55 leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-10 sm:p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/15 blur-3xl" />
            </div>
            <div className="relative z-10">
              <Shield className="h-9 w-9 text-primary mx-auto mb-4" />
              <h2 className="text-2xl sm:text-4xl font-bold mb-3">Garantia de 7 dias</h2>
              <p className="text-white/60 text-sm sm:text-base mb-8 max-w-xl mx-auto">
                Teste sem riscos. Se não amar, devolvemos 100% do seu investimento. Sem perguntas, sem burocracia.
              </p>
              <Link to="/pricing">
                <Button size="lg" className="rounded-full px-10 h-13 bg-primary hover:bg-primary/90 font-semibold">
                  Ver planos e preços <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo variant="red" size="sm" showText />
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/40">
              <Link to="/features" className="hover:text-white/70 transition-colors">Funcionalidades</Link>
              <Link to="/pricing" className="hover:text-white/70 transition-colors">Preços</Link>
              <Link to="/apresentacao" className="hover:text-white/70 transition-colors">Sobre</Link>
              <Link to="/privacy-policy" className="hover:text-white/70 transition-colors">Privacidade</Link>
              <Link to="/terms-of-service" className="hover:text-white/70 transition-colors">Termos</Link>
            </div>
            <p className="text-xs text-white/30">© {new Date().getFullYear()} AG Sell</p>
          </div>
        </div>
      </footer>
      <WhatsAppFloatingButton />
    </div>
  );
}
