import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft, ChevronRight, Users, GitBranch, Sparkles, Database,
  ListFilter, Copy, TrendingUp, Building2, Workflow, Brain, ShieldCheck,
  MessageSquare, ArrowRight, Check, Target, Layers, Zap, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import agsellLogo from '@/assets/agsell-logo-full-white.png';

interface Slide {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  body: React.ReactNode;
  accent?: 'red' | 'amber' | 'emerald' | 'sky' | 'violet' | 'rose';
}

const accentMap: Record<NonNullable<Slide['accent']>, string> = {
  red: 'from-red-600 to-red-900',
  amber: 'from-amber-500 to-orange-700',
  emerald: 'from-emerald-500 to-emerald-800',
  sky: 'from-sky-500 to-indigo-700',
  violet: 'from-violet-500 to-purple-800',
  rose: 'from-rose-500 to-pink-700',
};

function FeatureRow({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="shrink-0 w-10 h-10 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="font-semibold text-white">{title}</div>
        <div className="text-sm text-white/70 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-5">
      <div className="text-3xl md:text-4xl font-bold text-white">{value}</div>
      <div className="text-xs uppercase tracking-wider text-white/60 mt-1">{label}</div>
    </div>
  );
}

const slides: Slide[] = [
  {
    id: 'capa',
    eyebrow: 'AG Sell',
    title: 'CRM Inteligente para times que vendem todos os dias',
    subtitle: 'Centralize contatos, automatize o pipeline e use IA para fechar mais negócios — em uma única plataforma.',
    accent: 'red',
    body: (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
        <StatCard value="360°" label="Visão do contato" />
        <StatCard value="8" label="Módulos integrados" />
        <StatCard value="IA" label="Next Best Action" />
        <StatCard value="∞" label="Campos customizados" />
      </div>
    ),
  },
  {
    id: 'visao-360',
    eyebrow: 'Módulo 1',
    title: 'Visão 360° do Contato',
    subtitle: 'Tudo que você precisa saber sobre um lead em um único painel lateral.',
    accent: 'sky',
    body: (
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <FeatureRow icon={MessageSquare} title="Timeline omnichannel">
          WhatsApp, Email, SMS, Instagram e Inbox em ordem cronológica — toda interação visível em um clique.
        </FeatureRow>
        <FeatureRow icon={Target} title="Deals, tarefas e notas">
          Negócios em aberto, próximas atividades e anotações da equipe agregados ao contato.
        </FeatureRow>
        <FeatureRow icon={Activity} title="Lead Score em tempo real">
          Pontuação automática baseada em comportamento e engajamento.
        </FeatureRow>
        <FeatureRow icon={Sparkles} title="Sugestão de próxima ação por IA">
          Gemini analisa o contexto e propõe o próximo passo: follow-up, ligação ou nutrição.
        </FeatureRow>
      </div>
    ),
  },
  {
    id: 'pipeline',
    eyebrow: 'Módulo 2',
    title: 'Pipeline Inteligente',
    subtitle: 'Pare de perder negócios esquecidos no funil.',
    accent: 'amber',
    body: (
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <FeatureRow icon={Activity} title="Rotting Alert">
          Identifica deals parados por X dias em qualquer estágio. Configure o limite por etapa.
        </FeatureRow>
        <FeatureRow icon={GitBranch} title="Histórico de movimentações">
          Cada mudança de estágio é registrada — entenda padrões, gargalos e velocidade do funil.
        </FeatureRow>
        <FeatureRow icon={TrendingUp} title="Tempo médio por estágio">
          Métricas de quanto tempo cada deal leva em cada coluna. Decisões baseadas em dados reais.
        </FeatureRow>
        <FeatureRow icon={Target} title="Forecast ponderado">
          Receita prevista = valor × probabilidade. Veja o que realmente vai entrar no caixa.
        </FeatureRow>
      </div>
    ),
  },
  {
    id: 'campos',
    eyebrow: 'Módulo 3',
    title: 'Campos Customizados',
    subtitle: 'Adapte o CRM ao SEU negócio — sem precisar de desenvolvedor.',
    accent: 'violet',
    body: (
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <FeatureRow icon={Database} title="8 tipos de campo">
          Texto, número, data, booleano, seleção, multi-seleção, URL, e-mail. Todos exibidos automaticamente.
        </FeatureRow>
        <FeatureRow icon={Layers} title="Por entidade">
          Crie campos diferentes para Contatos, Empresas e Deals. Cada um com sua estrutura.
        </FeatureRow>
        <FeatureRow icon={ListFilter} title="Filtragem nativa">
          Campos customizados aparecem em filtros, listagens e Smart Lists automaticamente.
        </FeatureRow>
        <FeatureRow icon={ShieldCheck} title="Obrigatórios e validados">
          Marque campos como obrigatórios para garantir qualidade dos dados na entrada.
        </FeatureRow>
      </div>
    ),
  },
  {
    id: 'smart-lists',
    eyebrow: 'Módulo 4',
    title: 'Smart Lists & Filtros Salvos',
    subtitle: 'Segmentações dinâmicas que se atualizam sozinhas.',
    accent: 'emerald',
    body: (
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <FeatureRow icon={ListFilter} title="Filtros avançados">
          10 operadores: igual, diferente, contém, começa com, maior, menor, é nulo, não nulo, e mais.
        </FeatureRow>
        <FeatureRow icon={Zap} title="Atualização automática">
          Crie uma vez "Hot Leads SP" e a lista se atualiza sozinha conforme novos contatos batem o critério.
        </FeatureRow>
        <FeatureRow icon={Target} title="Listas fixadas">
          Pin nas listas mais usadas para acesso rápido na barra lateral.
        </FeatureRow>
        <FeatureRow icon={Users} title="Compartilhamento na equipe">
          Listas podem ser privadas ou compartilhadas com toda a organização.
        </FeatureRow>
      </div>
    ),
  },
  {
    id: 'duplicatas',
    eyebrow: 'Módulo 5',
    title: 'Detecção & Merge de Duplicatas',
    subtitle: 'Base limpa, decisões certas.',
    accent: 'rose',
    body: (
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <FeatureRow icon={Copy} title="Matching automático">
          Detecta duplicatas por e-mail e telefone normalizado (BR: ignora 9º dígito).
        </FeatureRow>
        <FeatureRow icon={Check} title="Merge em 1 clique">
          Une todos os dados, conversas e deals em um único contato — sem perder histórico.
        </FeatureRow>
        <FeatureRow icon={ShieldCheck} title="Auditoria">
          Todo merge fica registrado: quem, quando e quais registros foram fundidos.
        </FeatureRow>
        <FeatureRow icon={Database} title="Multi-tenant seguro">
          Detecção sempre dentro da sua organização. Dados de outras contas nunca são misturados.
        </FeatureRow>
      </div>
    ),
  },
  {
    id: 'forecast',
    eyebrow: 'Módulo 6',
    title: 'Forecast & Metas de Receita',
    subtitle: 'Saiba hoje quanto você vai faturar amanhã.',
    accent: 'amber',
    body: (
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <FeatureRow icon={TrendingUp} title="Previsão ponderada">
          Cada deal entra na previsão multiplicado pela probabilidade do seu estágio.
        </FeatureRow>
        <FeatureRow icon={Target} title="Metas mensais e por owner">
          Defina objetivos individuais ou de equipe. Veja em tempo real o gap entre meta e realizado.
        </FeatureRow>
        <FeatureRow icon={Activity} title="Breakdown por estágio">
          Visualize onde o dinheiro está parado: proposta, negociação, fechamento.
        </FeatureRow>
        <FeatureRow icon={Sparkles} title="Comparativo histórico">
          Compare períodos para entender sazonalidade e ajustar estratégia.
        </FeatureRow>
      </div>
    ),
  },
  {
    id: 'next-best-action',
    eyebrow: 'Módulo 7',
    title: 'Next Best Action com IA',
    subtitle: 'Seu vendedor sempre sabe qual o próximo passo certo.',
    accent: 'violet',
    body: (
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <FeatureRow icon={Brain} title="Análise contextual">
          Gemini 2.5 Flash analisa todo o histórico do contato e recomenda a ação ideal.
        </FeatureRow>
        <FeatureRow icon={Sparkles} title="Sugestões priorizadas">
          "Enviar follow-up por WhatsApp", "Agendar ligação", "Mover para nutrição" — em ordem de impacto.
        </FeatureRow>
        <FeatureRow icon={Zap} title="Execução em 1 clique">
          Aceitou a sugestão? Cria a tarefa, dispara a mensagem ou move o deal automaticamente.
        </FeatureRow>
        <FeatureRow icon={Activity} title="Aprende com o time">
          Quanto mais ações você executa, mais inteligente ficam as recomendações.
        </FeatureRow>
      </div>
    ),
  },
  {
    id: 'hierarquia',
    eyebrow: 'Módulo 8',
    title: 'Hierarquia de Empresas',
    subtitle: 'Para quem vende B2B em estruturas complexas.',
    accent: 'sky',
    body: (
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <FeatureRow icon={Building2} title="Matriz e filiais">
          Organize empresas em árvore: holding → matriz → filiais → unidades.
        </FeatureRow>
        <FeatureRow icon={Layers} title="Rollup automático">
          Visualize deals e contatos agregados na empresa-mãe sem perder o detalhe das filiais.
        </FeatureRow>
        <FeatureRow icon={GitBranch} title="Visão em árvore">
          UI clara mostrando toda a hierarquia com indentação visual e contadores.
        </FeatureRow>
        <FeatureRow icon={Users} title="Atribuição inteligente">
          Conheça quem é o decisor em cada nível da estrutura corporativa.
        </FeatureRow>
      </div>
    ),
  },
  {
    id: 'integracoes',
    eyebrow: 'Tudo conectado',
    title: 'Integrado com TODO o ecossistema AG Sell',
    subtitle: 'O CRM não vive sozinho — ele puxa dados de todos os canais.',
    accent: 'red',
    body: (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        {[
          ['WhatsApp', 'Oficial + Evolution'],
          ['Instagram', 'DMs e comentários'],
          ['E-mail', 'Resend / SES / SendGrid'],
          ['SMS', 'Zenvia'],
          ['Inbox', 'Omnichannel'],
          ['Forms', 'Captura de leads'],
          ['Webhooks', 'Stripe / Kiwify'],
          ['Automações', 'Flow Builder'],
        ].map(([name, desc]) => (
          <div key={name} className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="font-semibold text-white">{name}</div>
            <div className="text-xs text-white/60 mt-1">{desc}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'diferenciais',
    eyebrow: 'Por que AG Sell',
    title: 'Diferenciais que ninguém oferece',
    accent: 'emerald',
    body: (
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <FeatureRow icon={Workflow} title="Tudo em um só lugar">
          CRM + Inbox + Automação + IA + WhatsApp Oficial. Sem precisar plugar 5 ferramentas.
        </FeatureRow>
        <FeatureRow icon={Brain} title="IA nativa, sem custo extra">
          Gemini integrado de forma nativa. Sem chave de API e sem precisar contratar serviços externos.
        </FeatureRow>
        <FeatureRow icon={ShieldCheck} title="LGPD by design">
          Exportação JSON, hard delete, unsubscribe granular e auditoria completa.
        </FeatureRow>
        <FeatureRow icon={Zap} title="Multi-conta para agências">
          Gerencie vários clientes em uma única plataforma com isolamento total.
        </FeatureRow>
      </div>
    ),
  },
  {
    id: 'cta',
    eyebrow: 'Próximo passo',
    title: 'Pronto para vender mais com menos esforço?',
    subtitle: 'Teste o AG Sell e veja na prática como o CRM Inteligente transforma seu time comercial.',
    accent: 'red',
    body: (
      <div className="mt-10 flex flex-col md:flex-row gap-4 items-center">
        <a
          href="https://agsell.lovable.app/pricing"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-red-700 font-bold text-lg hover:bg-white/90 transition"
        >
          Ver Planos <ArrowRight className="w-5 h-5" />
        </a>
        <a
          href="https://agsell.lovable.app/register"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 border border-white/30 text-white font-semibold hover:bg-white/15 transition"
        >
          Começar agora
        </a>
      </div>
    ),
  },
];

export default function ApresentacaoCRM() {
  const [idx, setIdx] = useState(0);

  const next = useCallback(() => setIdx((i) => Math.min(i + 1, slides.length - 1)), []);
  const prev = useCallback(() => setIdx((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  const slide = slides[idx];
  const accent = accentMap[slide.accent || 'red'];

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Background gradient */}
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-30', accent)} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_50%)]" />

      {/* Top bar */}
      <header className="relative z-10 px-6 md:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={agsellLogo} alt="AG Sell" className="h-8 md:h-9 w-auto object-contain" />
          <div className="hidden sm:block h-8 w-px bg-white/20" />
          <div className="hidden sm:block text-xs uppercase tracking-[0.2em] text-white/60">Apresentação CRM</div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://agsell.lovable.app/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-zinc-900 text-sm font-semibold hover:bg-white/90 transition"
          >
            Ver Planos <ArrowRight className="w-4 h-4" />
          </a>
          <Badge variant="outline" className="border-white/20 text-white/80">
            {idx + 1} / {slides.length}
          </Badge>
        </div>
      </header>

      {/* Watermark logo - presente em todos os slides */}
      <div className="fixed bottom-24 right-6 md:right-10 z-10 opacity-20 pointer-events-none hidden md:block">
        <img src={agsellLogo} alt="" className="h-10 w-auto object-contain" />
      </div>

      {/* Slide content */}
      <main className="relative z-10 px-6 md:px-16 pb-32 pt-6 max-w-6xl mx-auto" data-slide={slide.id}>
        <div className="text-xs uppercase tracking-[0.2em] text-white/60 mb-3">{slide.eyebrow}</div>
        <h1 className="text-3xl md:text-5xl font-bold leading-tight">{slide.title}</h1>
        {slide.subtitle && (
          <p className="text-lg md:text-xl text-white/70 mt-4 max-w-3xl leading-relaxed">{slide.subtitle}</p>
        )}
        <div>{slide.body}</div>
      </main>

      {/* Bottom controls */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 backdrop-blur-md bg-black/40 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Button variant="ghost" onClick={prev} disabled={idx === 0} className="text-white hover:bg-white/10">
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>

          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === idx ? 'w-8 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'
                )}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          <Button onClick={next} disabled={idx === slides.length - 1} className="bg-white text-zinc-900 hover:bg-white/90">
            Próximo <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
