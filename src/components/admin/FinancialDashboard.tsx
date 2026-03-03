import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  CreditCard,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Pause,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function FinancialDashboard() {
  // Fetch all subscriptions with plan details
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['admin_financial_subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plans(*), organizations(name, slug)');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all plans for reference
  const { data: plans = [] } = useQuery({
    queryKey: ['admin_financial_plans'],
    queryFn: async () => {
      const { data, error } = await supabase.from('plans').select('*').order('price_monthly');
      if (error) throw error;
      return data || [];
    },
  });

  // Compute metrics
  const metrics = React.useMemo(() => {
    const active = subscriptions.filter((s: any) => s.status === 'active');
    const trialing = subscriptions.filter((s: any) => s.status === 'trialing');
    const canceled = subscriptions.filter((s: any) => s.status === 'canceled');
    const pastDue = subscriptions.filter((s: any) => s.status === 'past_due');
    const paused = subscriptions.filter((s: any) => s.status === 'paused');

    const expired = subscriptions.filter((s: any) => {
      if (!s.current_period_end) return false;
      return new Date(s.current_period_end) < new Date() && s.status !== 'canceled';
    });

    const mrr = active.reduce((sum: number, s: any) => {
      const price = s.billing_cycle === 'yearly'
        ? (Number(s.plans?.price_monthly || 0))
        : Number(s.plans?.price_monthly || 0);
      return sum + price;
    }, 0);

    const arr = mrr * 12;

    const monthlyRevenue = active.reduce((sum: number, s: any) => {
      if (s.billing_cycle === 'yearly') {
        return sum + Number(s.plans?.price_yearly || 0) / 12;
      }
      return sum + Number(s.plans?.price_monthly || 0);
    }, 0);

    const cancelingCount = active.filter((s: any) => s.cancel_at_period_end).length;

    return {
      mrr,
      arr,
      monthlyRevenue,
      total: subscriptions.length,
      active: active.length,
      trialing: trialing.length,
      canceled: canceled.length,
      pastDue: pastDue.length,
      paused: paused.length,
      expired: expired.length,
      canceling: cancelingCount,
      churnRate: subscriptions.length > 0
        ? ((canceled.length / subscriptions.length) * 100).toFixed(1)
        : '0',
    };
  }, [subscriptions]);

  // MRR evolution (last 6 months)
  const mrrEvolution = React.useMemo(() => {
    const now = new Date();
    const months: { month: string; mrr: number; newSubs: number; churned: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

      let accMrr = 0;
      let newSubs = 0;
      let churned = 0;

      subscriptions.forEach((s: any) => {
        const createdAt = new Date(s.created_at);
        const price = Number(s.plans?.price_monthly || 0);

        // Count as MRR if active by end of this month
        if (s.status === 'active' && createdAt <= endOfMonth) {
          accMrr += price;
        }

        // New subscriptions this month
        if (
          createdAt.getMonth() === d.getMonth() &&
          createdAt.getFullYear() === d.getFullYear()
        ) {
          newSubs++;
        }

        // Churned this month (updated_at in this month and status canceled)
        if (s.status === 'canceled') {
          const updatedAt = new Date(s.updated_at);
          if (
            updatedAt.getMonth() === d.getMonth() &&
            updatedAt.getFullYear() === d.getFullYear()
          ) {
            churned++;
          }
        }
      });

      months.push({
        month: label.charAt(0).toUpperCase() + label.slice(1),
        mrr: accMrr,
        newSubs,
        churned,
      });
    }
    return months;
  }, [subscriptions]);

  // Revenue by plan
  const revenueByPlan = React.useMemo(() => {
    const map: Record<string, { name: string; revenue: number; count: number }> = {};
    subscriptions
      .filter((s: any) => s.status === 'active')
      .forEach((s: any) => {
        const planName = s.plans?.name || 'Free';
        if (!map[planName]) map[planName] = { name: planName, revenue: 0, count: 0 };
        map[planName].revenue += Number(s.plans?.price_monthly || 0);
        map[planName].count++;
      });
    return Object.values(map);
  }, [subscriptions]);

  // Status distribution for pie chart
  const statusDistribution = React.useMemo(() => {
    const map: Record<string, number> = {};
    subscriptions.forEach((s: any) => {
      const label = statusLabel(s.status);
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [subscriptions]);

  const mrrGrowth = React.useMemo(() => {
    if (mrrEvolution.length < 2) return 0;
    const cur = mrrEvolution[mrrEvolution.length - 1].mrr;
    const prev = mrrEvolution[mrrEvolution.length - 2].mrr;
    if (prev === 0) return cur > 0 ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 100);
  }, [mrrEvolution]);

  const PIE_COLORS = [
    'hsl(var(--success))',
    'hsl(var(--info))',
    'hsl(var(--warning))',
    'hsl(var(--destructive))',
    'hsl(var(--muted-foreground))',
  ];

  const BAR_COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Row 1 - Revenue */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="MRR (Receita Mensal Recorrente)"
          value={fmt(metrics.mrr)}
          icon={<DollarSign className="h-4 w-4" />}
          trend={mrrGrowth}
          subtitle="vs mês anterior"
        />
        <KpiCard
          title="ARR (Receita Anual)"
          value={fmt(metrics.arr)}
          icon={<TrendingUp className="h-4 w-4" />}
          subtitle="Projeção anual"
        />
        <KpiCard
          title="Receita Efetiva/Mês"
          value={fmt(metrics.monthlyRevenue)}
          icon={<BarChart3 className="h-4 w-4" />}
          subtitle="Considerando ciclos anuais"
        />
        <KpiCard
          title="Churn Rate"
          value={`${metrics.churnRate}%`}
          icon={<XCircle className="h-4 w-4" />}
          subtitle={`${metrics.canceled} canceladas de ${metrics.total}`}
          negative
        />
      </div>

      {/* KPI Row 2 - Subscriptions Status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <MiniKpi label="Ativas" value={metrics.active} icon={<CheckCircle className="h-4 w-4 text-green-500" />} />
        <MiniKpi label="Trial" value={metrics.trialing} icon={<Clock className="h-4 w-4 text-blue-500" />} />
        <MiniKpi label="Em atraso" value={metrics.pastDue} icon={<AlertTriangle className="h-4 w-4 text-yellow-500" />} />
        <MiniKpi label="Canceladas" value={metrics.canceled} icon={<XCircle className="h-4 w-4 text-destructive" />} />
        <MiniKpi label="Pausadas" value={metrics.paused} icon={<Pause className="h-4 w-4 text-muted-foreground" />} />
        <MiniKpi label="Cancelando" value={metrics.canceling} icon={<ArrowDownRight className="h-4 w-4 text-orange-500" />} />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* MRR Evolution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Evolução do MRR
            </CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mrrEvolution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'mrr' ? fmt(value) : value,
                      name === 'mrr' ? 'MRR' : name === 'newSubs' ? 'Novas' : 'Canceladas',
                    ]}
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mrr"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Receita por Plano
            </CardTitle>
            <CardDescription>Distribuição do MRR ativo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByPlan} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(v) => `R$${v}`} className="text-xs" />
                  <YAxis type="category" dataKey="name" className="text-xs" width={100} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? fmt(value) : value,
                      name === 'revenue' ? 'Receita' : 'Assinaturas',
                    ]}
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {revenueByPlan.map((_, index) => (
                      <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution + New/Churn Chart */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status das Assinaturas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution.length > 0 ? statusDistribution : [{ name: 'Nenhuma', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {statusDistribution.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* New vs Churned */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-green-500" />
              Novas vs Canceladas
            </CardTitle>
            <CardDescription>Movimentação mensal de assinaturas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mrrEvolution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="newSubs" name="Novas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="churned" name="Canceladas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profit Margin per Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Margem de Lucro por Plano
          </CardTitle>
          <CardDescription>Análise de custos operacionais e margem líquida estimada</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-right">Preço Mensal</TableHead>
                  <TableHead className="text-right">Assin. Ativas</TableHead>
                  <TableHead className="text-right">Custo E-mail (est.)</TableHead>
                  <TableHead className="text-right">Custo IA (est.)</TableHead>
                  <TableHead className="text-right">Custo Infra (est.)</TableHead>
                  <TableHead className="text-right">Custo Total</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                  <TableHead className="text-right">Margem %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  // Estimated costs per plan based on resource limits
                  const costEstimates: Record<string, { emailCost: number; aiCost: number; infraCost: number }> = {
                    starter: { emailCost: 5, aiCost: 3, infraCost: 10 },
                    professional: { emailCost: 15, aiCost: 10, infraCost: 20 },
                    enterprise: { emailCost: 40, aiCost: 25, infraCost: 40 },
                    agencia: { emailCost: 80, aiCost: 40, infraCost: 60 },
                  };

                  return plans
                    .filter((p: any) => p.is_active && p.price_monthly > 0)
                    .map((plan: any) => {
                      const activeCount = subscriptions.filter(
                        (s: any) => s.status === 'active' && s.plan_id === plan.id
                      ).length;
                      const costs = costEstimates[plan.slug] || { emailCost: 5, aiCost: 5, infraCost: 10 };
                      const totalCost = costs.emailCost + costs.aiCost + costs.infraCost;
                      const margin = plan.price_monthly - totalCost;
                      const marginPct = plan.price_monthly > 0 ? ((margin / plan.price_monthly) * 100) : 0;
                      const totalRevenue = activeCount * plan.price_monthly;
                      const totalProfit = activeCount * margin;

                      return (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">
                            <Badge variant="outline">{plan.name}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{fmt(plan.price_monthly)}</TableCell>
                          <TableCell className="text-right">{activeCount}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{fmt(costs.emailCost)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{fmt(costs.aiCost)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{fmt(costs.infraCost)}</TableCell>
                          <TableCell className="text-right font-medium text-destructive">{fmt(totalCost)}</TableCell>
                          <TableCell className="text-right font-bold text-green-600 dark:text-green-400">{fmt(margin)}</TableCell>
                          <TableCell className="text-right">
                            <Badge className={cn(
                              marginPct >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              marginPct >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-destructive/10 text-destructive'
                            )}>
                              {marginPct.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    });
                })()}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Resumo de Lucratividade</h4>
            <div className="grid grid-cols-3 gap-4">
              {(() => {
                const costEstimates: Record<string, { emailCost: number; aiCost: number; infraCost: number }> = {
                  starter: { emailCost: 5, aiCost: 3, infraCost: 10 },
                  professional: { emailCost: 15, aiCost: 10, infraCost: 20 },
                  enterprise: { emailCost: 40, aiCost: 25, infraCost: 40 },
                  agencia: { emailCost: 80, aiCost: 40, infraCost: 60 },
                };
                let totalRevenue = 0;
                let totalCosts = 0;
                plans.filter((p: any) => p.is_active && p.price_monthly > 0).forEach((plan: any) => {
                  const activeCount = subscriptions.filter((s: any) => s.status === 'active' && s.plan_id === plan.id).length;
                  const costs = costEstimates[plan.slug] || { emailCost: 5, aiCost: 5, infraCost: 10 };
                  totalRevenue += activeCount * plan.price_monthly;
                  totalCosts += activeCount * (costs.emailCost + costs.aiCost + costs.infraCost);
                });
                const totalProfit = totalRevenue - totalCosts;
                const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

                return (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Receita Total/Mês</p>
                      <p className="text-lg font-bold">{fmt(totalRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Custos Totais/Mês</p>
                      <p className="text-lg font-bold text-destructive">{fmt(totalCosts)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Lucro Líquido Est.</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">{fmt(totalProfit)} ({avgMargin.toFixed(1)}%)</p>
                    </div>
                  </>
                );
              })()}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              * Custos estimados baseados em uso médio. Custos reais variam conforme consumo de API (Resend, IA).
              WhatsApp não tem custo de envio (API não oficial) ou o custo é do cliente (API oficial).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento de Assinaturas</CardTitle>
          <CardDescription>Todas as assinaturas do sistema com status detalhado</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organização</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Valor/Mês</TableHead>
                  <TableHead>Período Atual</TableHead>
                  <TableHead>Cancelamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhuma assinatura encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptions.map((s: any) => {
                    const isExpired = s.current_period_end && new Date(s.current_period_end) < new Date();
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          {s.organizations?.name || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{s.plans?.name || '—'}</Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={s.status} isExpired={!!isExpired} />
                        </TableCell>
                        <TableCell className="capitalize">{s.billing_cycle === 'yearly' ? 'Anual' : 'Mensal'}</TableCell>
                        <TableCell className="font-medium">{fmt(Number(s.plans?.price_monthly || 0))}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {s.current_period_start
                            ? `${new Date(s.current_period_start).toLocaleDateString('pt-BR')} - ${new Date(s.current_period_end).toLocaleDateString('pt-BR')}`
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {s.cancel_at_period_end ? (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              Cancela ao fim do período
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper components
function KpiCard({
  title,
  value,
  icon,
  trend,
  subtitle,
  negative,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
  subtitle?: string;
  negative?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(trend !== undefined || subtitle) && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend !== undefined && (
              <>
                {trend >= 0 ? (
                  <TrendingUp className="inline h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="inline h-3 w-3 text-destructive mr-1" />
                )}
                {trend >= 0 ? '+' : ''}
                {trend}%{' '}
              </>
            )}
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function MiniKpi({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4 px-4">
        {icon}
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status, isExpired }: { status: string; isExpired: boolean }) {
  if (isExpired && status !== 'canceled') {
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/30">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Expirada
      </Badge>
    );
  }
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="h-3 w-3 mr-1" />
          Ativa
        </Badge>
      );
    case 'trialing':
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          <Clock className="h-3 w-3 mr-1" />
          Trial
        </Badge>
      );
    case 'past_due':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Em atraso
        </Badge>
      );
    case 'canceled':
      return (
        <Badge variant="secondary">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelada
        </Badge>
      );
    case 'paused':
      return (
        <Badge variant="outline">
          <Pause className="h-3 w-3 mr-1" />
          Pausada
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Ativas';
    case 'trialing': return 'Trial';
    case 'past_due': return 'Em atraso';
    case 'canceled': return 'Canceladas';
    case 'paused': return 'Pausadas';
    default: return status;
  }
}
