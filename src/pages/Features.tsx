import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CompetitorComparison } from '@/components/pricing/CompetitorComparison';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import {
  ArrowRight, Users, Target, Bot, MessageSquare, Mail, BarChart3,
  Sparkles, FileText, Inbox, Globe, Zap, Shield, Phone, Layers,
  Brain, Workflow, Instagram, Headphones, Trophy, Check, Key,
  Webhook, SlidersHorizontal, ListChecks, Search, Bell, Vote,
  SplitSquareVertical, Megaphone, ArrowLeftRight, Upload, ChevronDown
} from 'lucide-react';

const ALL_FEATURES = [
  {
    category: 'CRM & Gestão de Vendas',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    features: [
      { icon: Users, name: 'CRM Completo', desc: 'Contatos ilimitados, empresas, campos customizados, timeline de atividades e visão 360° do cliente.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Target, name: 'Pipeline Kanban', desc: 'Múltiplos funis com drag-and-drop, estágios customizáveis e probabilidade de fechamento.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: ListChecks, name: 'Gestão de Tarefas', desc: 'Tarefas vinculadas a contatos e deals, calendário, lembretes e status de progresso.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Users, name: 'Empresas (Accounts)', desc: 'Cadastro de empresas com vínculo a contatos, setor, porte e domínio.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: SlidersHorizontal, name: 'Tags & Segmentação', desc: 'Tags coloridas, filtros avançados e segmentação dinâmica da base de contatos.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Trophy, name: 'Gamificação de Vendas', desc: 'Rankings, conquistas, pontuação por ações e níveis para motivar equipes.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Target, name: 'Lead Scoring', desc: 'Pontuação automática de leads com regras customizáveis por comportamento e perfil.', plans: ['professional', 'enterprise', 'agencia'] },
      { icon: Target, name: 'Win Probability (IA)', desc: 'IA calcula probabilidade de fechar cada negócio com base em dados históricos.', plans: ['professional', 'enterprise', 'agencia'] },
      { icon: SlidersHorizontal, name: 'Sales Routing', desc: 'Distribuição automática de leads: round robin, por carga, território ou especialidade.', plans: ['professional', 'enterprise', 'agencia'] },
      { icon: Target, name: 'Metas de Conversão', desc: 'Defina metas de receita, leads ou eventos e acompanhe progresso em tempo real.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
    ],
  },
  {
    category: 'Comunicação Omnichannel',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    features: [
      { icon: Inbox, name: 'Inbox Unificado', desc: 'WhatsApp, E-mail, Instagram, Telegram e SMS em uma única tela com CSAT e notas internas.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: MessageSquare, name: 'WhatsApp Multi-instância', desc: '3 modos de conexão: QR Code (gerenciado), Evolution API própria (mais estável) ou API Oficial Meta. Campanhas em massa, flows e grupos pagos.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Mail, name: 'E-mail Marketing', desc: 'Campanhas, templates HTML, domínio próprio com SPF/DKIM/DMARC e warmup automático.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Instagram, name: 'Instagram DM & Automações', desc: 'Responda DMs, comentários e stories. Automações por palavra-chave e broadcasts.', plans: ['professional', 'enterprise', 'agencia'] },
      { icon: Phone, name: 'SMS Marketing Bidirecional', desc: 'Campanhas SMS em massa, automações e respostas bidirecionais via Twilio/Vonage.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Globe, name: 'Telegram & Shopify', desc: 'Bot Telegram integrado ao CRM. Shopify com sincronização de pedidos e clientes.', plans: ['professional', 'enterprise', 'agencia'] },
      { icon: Users, name: 'Grupos Pagos (Beta)', desc: 'Automatize entrada e saída de membros em grupos WhatsApp com 20+ gateways. Dashboard de métricas (churn, crescimento, distribuição) e mapeamento híbrido de gateways.', plans: ['professional', 'enterprise', 'agencia'] },
      { icon: Headphones, name: 'SAC com Distribuição Inteligente', desc: 'Round-robin, por capacidade ou manual. Pesquisa CSAT automática e relatórios.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Sparkles, name: 'Transcrição de Áudio por IA', desc: 'Áudios do WhatsApp e Instagram transcritos automaticamente para texto.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
    ],
  },
  {
    category: 'Automação & Flows',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    features: [
      { icon: Zap, name: 'Automações Avançadas', desc: 'Triggers por webhook, formulário, tag ou evento. Ações em cadeia com condições if/else.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Workflow, name: 'Flow Builder com Analytics por Nó', desc: 'Construtor drag-and-drop com 20+ ações e métricas em tempo real por nó: entradas, saídas e conversões.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: ListChecks, name: 'Sequências (Drip Campaigns)', desc: 'Séries de mensagens (e-mail, WhatsApp, SMS) com delays configuráveis.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Vote, name: 'WhatsApp Flows (Enquetes)', desc: 'Formulários interativos dentro do WhatsApp com mapeamento de respostas e lógica condicional.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: SplitSquareVertical, name: 'Testes A/B de Fluxos Completos', desc: 'Compare fluxos inteiros de automação para descobrir qual converte mais, não apenas mensagens.', plans: ['professional', 'enterprise', 'agencia'] },
      { icon: SlidersHorizontal, name: 'Conteúdo Condicional em E-mails', desc: 'Blocos dinâmicos que mudam conforme tags, score ou status do contato.', plans: ['professional', 'enterprise', 'agencia'] },
      { icon: Globe, name: 'Site Tracking → Trigger Automático', desc: 'Dispare automações quando um contato visitar uma página específica do seu site.', plans: ['professional', 'enterprise', 'agencia'] },
      { icon: ListChecks, name: 'Histórico de Execução por Contato', desc: 'Timeline visual de cada automação e etapa por onde o contato passou.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
    ],
  },
  {
    category: 'Inteligência Artificial',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    features: [
      { icon: Sparkles, name: 'Assistente IA', desc: 'Pergunte sobre seus dados, gere relatórios e receba insights em linguagem natural.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Bot, name: 'Agentes IA com RAG', desc: 'IA que acessa sua base de conhecimento, responde clientes e transfere para humanos.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Brain, name: 'AI Builder (Brand Kit + Copy)', desc: 'Gere e-mails, automações e copy. Extraia identidade visual de sites automaticamente.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Brain, name: 'Segmentos Sugeridos por IA', desc: 'IA analisa sua base e sugere segmentações de alto impacto automaticamente.', plans: ['professional', 'enterprise', 'agencia'] },
      { icon: Brain, name: 'Scoring Preditivo com IA', desc: 'IA analisa comportamento e calcula automaticamente a probabilidade de conversão de cada lead.', plans: ['professional', 'enterprise', 'agencia'] },
      { icon: Search, name: 'Envio Preditivo', desc: 'IA determina o melhor horário de envio para cada contato individualmente.', plans: ['professional', 'enterprise', 'agencia'] },
      { icon: Brain, name: 'Análise de Sentimento', desc: 'Classifica tom das mensagens (positivo/neutro/negativo) com extração de palavras-chave.', plans: ['professional', 'enterprise', 'agencia'] },
      { icon: Target, name: 'Win Probability', desc: 'Calcula probabilidade de fechamento de cada deal com fatores explicativos.', plans: ['professional', 'enterprise', 'agencia'] },
    ],
  },
  {
    category: 'Captura & Conversão',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    features: [
      { icon: FileText, name: 'Formulários Web', desc: 'Formulários customizados embarcáveis com integração automática ao CRM.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Globe, name: 'Landing Pages', desc: 'Crie páginas de captura com editor HTML e formulários integrados ao CRM.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Megaphone, name: 'Growth Tools', desc: 'Links inteligentes, QR Codes e ferramentas de captura para redes sociais.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Globe, name: 'Site Tracking', desc: 'Snippet JS para rastrear visitantes, páginas e sessões do seu site.', plans: ['professional', 'enterprise', 'agencia'] },
      { icon: SlidersHorizontal, name: 'Preferências de Contato (Opt-out)', desc: 'Gestão de consentimento por canal conforme LGPD.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
    ],
  },
  {
    category: 'Analytics & Relatórios',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    features: [
      { icon: BarChart3, name: 'Dashboard Analítico', desc: 'Métricas de contatos, deals, receita, atividades e funil em tempo real.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: BarChart3, name: 'Relatórios de Inbox', desc: 'Tempo de resposta, volume por canal, CSAT e performance de agentes.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Target, name: 'Atribuição Multi-toque', desc: 'Rastreie jornada do cliente e atribua receita a canais e campanhas.', plans: ['professional', 'enterprise', 'agencia'] },
      { icon: BarChart3, name: 'Relatórios Personalizados', desc: 'Dashboards customizados com widgets de CRM, e-mail e WhatsApp.', plans: ['enterprise', 'agencia'] },
      { icon: BarChart3, name: 'Relatório de Receita', desc: 'Receita por canal, campanha e período com comparativos temporais.', plans: ['enterprise', 'agencia'] },
      { icon: Globe, name: 'Rastreamento de Eventos', desc: 'Tracked events de sites externos com snippet JS dedicado.', plans: ['professional', 'enterprise', 'agencia'] },
    ],
  },
  {
    category: 'Gestão & Administração',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    features: [
      { icon: Layers, name: 'Modo Agência Multi-tenant', desc: 'Gerencie múltiplos clientes com dados isolados e troca instantânea de conta.', plans: ['agencia'] },
      { icon: Shield, name: 'Permissões Granulares (RBAC)', desc: 'Papéis customizáveis por módulo e ação. Owner, Admin, Member, Viewer.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Key, name: 'API Pública REST', desc: 'API com rate limiting, autenticação por API Key e documentação completa.', plans: ['enterprise', 'agencia'] },
      { icon: Webhook, name: 'Webhooks com Retry', desc: 'Webhooks de entrada e saída com fila de entrega, retry automático, backoff exponencial e dead-letter queue.', plans: ['enterprise', 'agencia'] },
      { icon: Globe, name: 'Marketplace de Integrações', desc: 'Catálogo visual com 30+ conectores: Google Ads, Calendly, Zapier, Mercado Pago e mais.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Headphones, name: 'Portal de Suporte White-label', desc: 'Portal público com sua marca para abertura e acompanhamento de tickets.', plans: ['professional', 'enterprise', 'agencia'] },
      { icon: ArrowLeftRight, name: 'Central de Migração', desc: 'Importe contatos, templates, automações e funis via CSV, JSON, API ou Webhook.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Bell, name: 'Notificações Internas', desc: 'Sistema de notificações push, in-app e e-mail para eventos importantes.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
    ],
  },
  {
    category: 'Integrações Nativas',
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
    features: [
      { icon: Globe, name: 'Stripe', desc: 'Checkout, assinaturas, webhooks e customer portal integrados.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Globe, name: 'Hotmart / Kiwify / Eduzz', desc: 'Webhooks de compra que criam contatos, aplicam tags e disparam automações.', plans: ['professional', 'enterprise', 'agencia'] },
      { icon: Globe, name: 'Shopify', desc: 'Sincronização de pedidos, clientes e status de compra.', plans: ['professional', 'enterprise', 'agencia'] },
      { icon: Globe, name: 'Resend / SES / SendGrid', desc: 'Provedores de e-mail configuráveis com verificação de domínio.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Globe, name: 'Twilio / Vonage', desc: 'Provedores de SMS para envio e recebimento bidirecional.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
      { icon: Globe, name: 'Evolution API', desc: 'WhatsApp via QR Code com múltiplas instâncias simultâneas.', plans: ['starter', 'professional', 'enterprise', 'agencia'] },
    ],
  },
];

const PLAN_NAMES: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
  agencia: 'Agência',
};

const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-blue-500',
  professional: 'bg-primary',
  enterprise: 'bg-purple-500',
  agencia: 'bg-orange-500',
};

export default function Features() {
  const totalFeatures = ALL_FEATURES.reduce((acc, cat) => acc + cat.features.length, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/30">
        <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/"><Logo variant="red" size="md" showText /></Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">Entrar</Button>
            </Link>
            <Link to="/pricing">
              <Button size="sm" className="rounded-full px-4 sm:px-5 text-xs sm:text-sm">Começar agora</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="h-14 sm:h-16" />

      {/* Hero */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary">
            {totalFeatures}+ funcionalidades
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            Todas as funcionalidades
            <br />
            <span className="text-primary">em uma única plataforma</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Conheça em detalhes tudo que a AG Sell oferece — CRM, automação, IA, comunicação omnichannel e muito mais.
          </p>

          {/* Plan legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            {Object.entries(PLAN_NAMES).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs">
                <div className={cn('h-2.5 w-2.5 rounded-full', PLAN_COLORS[key])} />
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          <a href="#features">
            <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground">
              Ver funcionalidades <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </a>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="pb-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="space-y-16 max-w-6xl mx-auto">
            {ALL_FEATURES.map((cat, ci) => (
              <div key={ci}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', cat.bgColor)}>
                    {React.createElement(cat.features[0].icon, { className: cn('h-4 w-4', cat.color) })}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{cat.category}</h2>
                    <p className="text-xs text-muted-foreground">{cat.features.length} funcionalidades</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {cat.features.map((feat, fi) => (
                    <div
                      key={fi}
                      className="group rounded-xl border border-border/50 bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', cat.bgColor)}>
                          <feat.icon className={cn('h-4 w-4', cat.color)} />
                        </div>
                        <div className="flex gap-1">
                          {Object.keys(PLAN_NAMES).map((plan) => (
                            <div
                              key={plan}
                              className={cn(
                                'h-2 w-2 rounded-full transition-all',
                                feat.plans.includes(plan) ? PLAN_COLORS[plan] : 'bg-muted'
                              )}
                              title={feat.plans.includes(plan) ? `Incluído no ${PLAN_NAMES[plan]}` : `Não incluído no ${PLAN_NAMES[plan]}`}
                            />
                          ))}
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{feat.name}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="border-t border-border/40">
        <div className="container mx-auto px-4 sm:px-6 py-16 md:py-24">
          <CompetitorComparison />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/40">
        <div className="container mx-auto px-4 sm:px-6 py-16 md:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Pronto para começar?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Escolha o plano ideal e comece a usar todas as funcionalidades hoje mesmo.
          </p>
          <Link to="/pricing">
            <Button size="lg" className="rounded-full px-8">
              Ver planos e preços <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo variant="red" size="sm" showText />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacidade</Link>
              <Link to="/terms-of-service" className="hover:text-foreground transition-colors">Termos</Link>
              <Link to="/pricing" className="hover:text-foreground transition-colors">Preços</Link>
            </div>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} AG Sell</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
