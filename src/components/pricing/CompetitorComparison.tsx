import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Minus, Trophy, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface ComparisonFeature {
  label: string;
  agSell: 'yes' | 'no' | 'partial';
  sellflux: 'yes' | 'no' | 'partial';
  activeCampaign: 'yes' | 'no' | 'partial';
  rdStation: 'yes' | 'no' | 'partial';
  hubspot: 'yes' | 'no' | 'partial';
}

const COMPARISON_DATA: ComparisonFeature[] = [
  { label: 'CRM Completo', agSell: 'yes', sellflux: 'partial', activeCampaign: 'yes', rdStation: 'yes', hubspot: 'yes' },
  { label: 'Pipeline de Vendas (Kanban)', agSell: 'yes', sellflux: 'partial', activeCampaign: 'yes', rdStation: 'yes', hubspot: 'yes' },
  { label: 'WhatsApp Multi-instância Nativo', agSell: 'yes', sellflux: 'yes', activeCampaign: 'no', rdStation: 'no', hubspot: 'no' },
  { label: 'WhatsApp Flows (Formulários Interativos)', agSell: 'yes', sellflux: 'no', activeCampaign: 'no', rdStation: 'no', hubspot: 'no' },
  { label: 'Campanhas em Massa WhatsApp', agSell: 'yes', sellflux: 'yes', activeCampaign: 'no', rdStation: 'no', hubspot: 'no' },
  { label: 'Gestão de Grupos WhatsApp', agSell: 'yes', sellflux: 'no', activeCampaign: 'no', rdStation: 'no', hubspot: 'no' },
  { label: 'Agentes IA com Base de Conhecimento (RAG)', agSell: 'yes', sellflux: 'partial', activeCampaign: 'partial', rdStation: 'no', hubspot: 'partial' },
  { label: 'Inbox Omnichannel (WhatsApp + Email + Instagram)', agSell: 'yes', sellflux: 'partial', activeCampaign: 'partial', rdStation: 'partial', hubspot: 'yes' },
  { label: 'Instagram DM Integrado', agSell: 'yes', sellflux: 'no', activeCampaign: 'no', rdStation: 'no', hubspot: 'partial' },
  { label: 'E-mail Marketing com Domínio Próprio', agSell: 'yes', sellflux: 'no', activeCampaign: 'yes', rdStation: 'yes', hubspot: 'yes' },
  { label: 'SMS Marketing Bidirecional', agSell: 'yes', sellflux: 'no', activeCampaign: 'yes', rdStation: 'no', hubspot: 'partial' },
  { label: 'Automações Avançadas', agSell: 'yes', sellflux: 'yes', activeCampaign: 'yes', rdStation: 'yes', hubspot: 'yes' },
  { label: 'Flow Builder Visual (Drag & Drop)', agSell: 'yes', sellflux: 'yes', activeCampaign: 'yes', rdStation: 'partial', hubspot: 'partial' },
  { label: 'Lead Scoring Automático', agSell: 'yes', sellflux: 'no', activeCampaign: 'yes', rdStation: 'yes', hubspot: 'yes' },
  { label: 'Win Probability (IA)', agSell: 'yes', sellflux: 'no', activeCampaign: 'no', rdStation: 'no', hubspot: 'partial' },
  { label: 'Análise de Sentimento (IA)', agSell: 'yes', sellflux: 'no', activeCampaign: 'no', rdStation: 'no', hubspot: 'no' },
  { label: 'Envio Preditivo (IA)', agSell: 'yes', sellflux: 'no', activeCampaign: 'yes', rdStation: 'no', hubspot: 'no' },
  { label: 'Site Tracking (Snippet JS)', agSell: 'yes', sellflux: 'no', activeCampaign: 'yes', rdStation: 'yes', hubspot: 'yes' },
  { label: 'Atribuição Multi-toque', agSell: 'yes', sellflux: 'no', activeCampaign: 'partial', rdStation: 'partial', hubspot: 'yes' },
  { label: 'Relatórios Personalizados', agSell: 'yes', sellflux: 'no', activeCampaign: 'partial', rdStation: 'partial', hubspot: 'yes' },
  { label: 'Formulários Web com Captura de Leads', agSell: 'yes', sellflux: 'partial', activeCampaign: 'yes', rdStation: 'yes', hubspot: 'yes' },
  { label: 'Testes A/B (E-mail + WhatsApp)', agSell: 'yes', sellflux: 'no', activeCampaign: 'yes', rdStation: 'partial', hubspot: 'yes' },
  { label: 'Webhooks Inbound (Receber dados externos)', agSell: 'yes', sellflux: 'partial', activeCampaign: 'partial', rdStation: 'partial', hubspot: 'yes' },
  { label: 'API Pública com Rate Limiting', agSell: 'yes', sellflux: 'partial', activeCampaign: 'yes', rdStation: 'yes', hubspot: 'yes' },
  { label: 'Multi-tenant / Modo Agência', agSell: 'yes', sellflux: 'no', activeCampaign: 'no', rdStation: 'no', hubspot: 'partial' },
  { label: 'Gamificação para Equipes de Vendas', agSell: 'yes', sellflux: 'no', activeCampaign: 'no', rdStation: 'no', hubspot: 'no' },
  { label: 'CSAT / Pesquisa de Satisfação', agSell: 'yes', sellflux: 'no', activeCampaign: 'no', rdStation: 'no', hubspot: 'partial' },
  { label: 'Transcrição de Áudio (IA)', agSell: 'yes', sellflux: 'no', activeCampaign: 'no', rdStation: 'no', hubspot: 'no' },
  { label: 'Portal de Suporte White-label', agSell: 'yes', sellflux: 'no', activeCampaign: 'no', rdStation: 'no', hubspot: 'partial' },
  { label: 'Central de Migração (CSV, JSON, API)', agSell: 'yes', sellflux: 'no', activeCampaign: 'partial', rdStation: 'partial', hubspot: 'partial' },
];

function StatusIcon({ status }: { status: 'yes' | 'no' | 'partial' }) {
  if (status === 'yes') return <Check className="h-5 w-5 text-green-500" />;
  if (status === 'partial') return <Minus className="h-5 w-5 text-yellow-500" />;
  return <X className="h-5 w-5 text-red-400" />;
}

const EXCLUSIVE_FEATURES = [
  {
    title: 'WhatsApp Flows Nativos',
    description: 'Crie formulários interativos dentro do WhatsApp, colete dados e qualifique leads sem sair da conversa — recurso exclusivo da AG Sell.',
  },
  {
    title: 'Agentes IA com RAG',
    description: 'Nossos agentes de IA acessam sua base de conhecimento personalizada para responder perguntas complexas, qualificar leads e transferir para humanos automaticamente.',
  },
  {
    title: 'Modo Agência Multi-tenant',
    description: 'Gerencie múltiplos clientes com dados isolados, permissões granulares e troca rápida de conta — sem pagar plano Enterprise.',
  },
  {
    title: 'Gamificação de Vendas',
    description: 'Motive sua equipe com pontuação, rankings e conquistas integradas ao CRM. Nenhum concorrente oferece isso nativamente.',
  },
  {
    title: 'Análise de Sentimento por IA',
    description: 'Classifique o tom das conversas automaticamente e priorize atendimentos negativos antes que virem reclamações.',
  },
  {
    title: 'Portal de Suporte White-label',
    description: 'Ofereça um portal público personalizado com sua marca para clientes abrirem e acompanharem tickets sem login.',
  },
];

// Calculate scores for chart
function calculateScores() {
  const competitors = ['agSell', 'sellflux', 'activeCampaign', 'rdStation', 'hubspot'] as const;
  const names: Record<typeof competitors[number], string> = {
    agSell: 'AG Sell',
    sellflux: 'SellFlux',
    activeCampaign: 'ActiveCampaign',
    rdStation: 'RD Station',
    hubspot: 'HubSpot',
  };

  return competitors.map((key) => {
    let score = 0;
    COMPARISON_DATA.forEach((row) => {
      if (row[key] === 'yes') score += 1;
      else if (row[key] === 'partial') score += 0.5;
    });
    return {
      name: names[key],
      score: Math.round((score / COMPARISON_DATA.length) * 100),
      key,
    };
  });
}

const CHART_COLORS: Record<string, string> = {
  agSell: 'hsl(var(--primary))',
  sellflux: '#94a3b8',
  activeCampaign: '#94a3b8',
  rdStation: '#94a3b8',
  hubspot: '#94a3b8',
};

interface CompetitorComparisonProps {
  showChart?: boolean;
}

export function CompetitorComparison({ showChart = true }: CompetitorComparisonProps) {
  const competitors = [
    { key: 'agSell' as const, name: 'AG Sell', highlight: true },
    { key: 'sellflux' as const, name: 'SellFlux', highlight: false },
    { key: 'activeCampaign' as const, name: 'ActiveCampaign', highlight: false },
    { key: 'rdStation' as const, name: 'RD Station', highlight: false },
    { key: 'hubspot' as const, name: 'HubSpot', highlight: false },
  ];

  const chartData = calculateScores();

  return (
    <div className="space-y-16">
      {/* Exclusive Features */}
      <div>
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-4">
            <Zap className="h-3 w-3 mr-1" />
            Exclusivo AG Sell
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            O que <span className="text-primary">só a AG Sell</span> oferece
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Funcionalidades que você não encontra em nenhum outro CRM do mercado
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {EXCLUSIVE_FEATURES.map((feature, i) => (
            <Card key={i} className="border-primary/20 bg-primary/5 hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Trophy className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Visual Bar Chart */}
      {showChart && (
        <div>
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-4">
              📊 Cobertura de Funcionalidades
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Quem cobre <span className="text-primary">mais funcionalidades</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Percentual de funcionalidades disponíveis (total ou parcialmente) em cada plataforma — baseado em {COMPARISON_DATA.length} recursos avaliados
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="border-border/50">
              <CardContent className="pt-6 pb-2">
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fill: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={false}
                      formatter={(value: number) => [`${value}%`, 'Cobertura']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--popover-foreground))',
                      }}
                    />
                    <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={36} activeBar={false}>
                      {chartData.map((entry) => (
                        <Cell key={entry.key} fill={CHART_COLORS[entry.key]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div>
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4">
            <Trophy className="h-3 w-3 mr-1" />
            Comparativo Completo
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            AG Sell vs <span className="text-primary">Concorrentes</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Veja como a AG Sell se compara às maiores plataformas do mercado — {COMPARISON_DATA.length} funcionalidades avaliadas
          </p>
        </div>

        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-3 text-sm font-medium text-muted-foreground w-[260px]">
                  Recurso
                </th>
                {competitors.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      'py-4 px-3 text-center text-sm font-semibold whitespace-nowrap',
                      c.highlight && 'bg-primary/5 text-primary rounded-t-lg'
                    )}
                  >
                    {c.name}
                    {c.highlight && (
                      <Badge className="ml-1.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                        ★
                      </Badge>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_DATA.map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3 text-sm font-medium">{row.label}</td>
                  {competitors.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        'py-3 px-3 text-center',
                        c.highlight && 'bg-primary/5'
                      )}
                    >
                      <div className="flex justify-center">
                        <StatusIcon status={row[c.key]} />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td className="py-4 px-3 text-sm font-bold">Total (pontuação)</td>
                {competitors.map((c) => {
                  const score = chartData.find(d => d.key === c.key)?.score ?? 0;
                  return (
                    <td
                      key={c.key}
                      className={cn(
                        'py-4 px-3 text-center font-bold text-lg',
                        c.highlight ? 'bg-primary/5 text-primary' : 'text-foreground'
                      )}
                    >
                      {score}%
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" /> Disponível
          </div>
          <div className="flex items-center gap-2">
            <Minus className="h-4 w-4 text-yellow-500" /> Parcial / Limitado
          </div>
          <div className="flex items-center gap-2">
            <X className="h-4 w-4 text-red-400" /> Não disponível
          </div>
        </div>
      </div>
    </div>
  );
}
