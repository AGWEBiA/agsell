import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign, Trophy, TrendingUp, Clock, Target, Users, Briefcase,
  ShieldAlert, ArrowUpRight, BarChart3, PieChart as PieIcon,
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  useCRMOverview, useSalesRepPerformance, useDealsByStageAdmin,
  useDealsBySource, useMonthlyTrend,
} from '@/hooks/useCRMAdmin';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line,
} from '@/lib/recharts';

const formatBRL = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n || 0);

const getInitials = (name: string) =>
  name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

const SOURCE_COLORS = ['hsl(var(--primary))', '#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ec4899', '#06b6d4'];

export default function CRMAdmin() {
  const { currentOrganization, currentRole } = useOrganization();

  // Permission gate: only owner/admin of the org (or global admin) can see this
  const isOrgAdmin = currentRole === 'owner' || currentRole === 'admin';

  const overview = useCRMOverview();
  const reps = useSalesRepPerformance();
  const byStage = useDealsByStageAdmin();
  const bySource = useDealsBySource();
  const trend = useMonthlyTrend();

  if (!isOrgAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Acesso restrito</CardTitle>
            <CardDescription>
              Esta área é exclusiva para administradores da conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/dashboard">Voltar ao Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = overview.data;
  const repsData = reps.data || [];
  const totalWonByReps = repsData.reduce((s, r) => s + r.wonValue, 0);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-primary" />
            Painel CRM — Admin
          </h1>
          <p className="text-sm text-muted-foreground">
            Visão consolidada de deals, vendedores e performance da operação de {currentOrganization?.name || 'sua conta'}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/pipeline">Ver Pipeline</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/revenue-reporting">
              <BarChart3 className="h-4 w-4 mr-2" /> Relatório de Receita
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {overview.isLoading ? (
          <>
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </>
        ) : (
          <>
            <StatCard
              title="Pipeline Aberto"
              value={formatBRL(data?.totalPipelineValue || 0)}
              description={`${data?.openDeals || 0} deals em aberto`}
              icon={<DollarSign className="h-5 w-5" />}
            />
            <StatCard
              title="Receita Ganha (total)"
              value={formatBRL(data?.wonValue || 0)}
              description={`${data?.wonDeals || 0} deals fechados`}
              icon={<Trophy className="h-5 w-5" />}
            />
            <StatCard
              title="Receita do Mês"
              value={formatBRL(data?.wonValueThisMonth || 0)}
              description={`${data?.wonThisMonth || 0} ganhos este mês`}
              trend={data?.lastMonthWonValue ? { value: data.monthlyGrowth, label: 'vs mês passado' } : undefined}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              title="Taxa de Conversão"
              value={`${data?.conversionRate || 0}%`}
              description={`Ciclo médio: ${data?.avgSalesCycleDays || 0} dias`}
              icon={<Target className="h-5 w-5" />}
            />
            <StatCard
              title="Total Comissões"
              value={formatBRL(repsData.reduce((s, r) => s + (r.commissionValue || 0), 0))}
              description="Soma das comissões de deals ganhos"
              icon={<DollarSign className="h-5 w-5 text-orange-500" />}
            />
          </>
        )}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ticket Médio"
          value={formatBRL(data?.avgDealValue || 0)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Novos Deals (mês)"
          value={data?.newDealsThisMonth || 0}
          icon={<ArrowUpRight className="h-5 w-5" />}
        />
        <StatCard
          title="Total Vendedores"
          value={repsData.length}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Deals Perdidos"
          value={data?.lostDeals || 0}
          icon={<ShieldAlert className="h-5 w-5" />}
        />
      </div>

      <Tabs defaultValue="reps" className="w-full">
        <TabsList>
          <TabsTrigger value="reps">Vendedores</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="origens">Origens</TabsTrigger>
          <TabsTrigger value="tendencia">Tendência</TabsTrigger>
        </TabsList>

        {/* Sales reps tab */}
        <TabsContent value="reps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Vendedor</CardTitle>
              <CardDescription>
                Ranking ordenado por receita ganha. Inclui pipeline aberto, ganhos e taxa de conversão.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reps.isLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : repsData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum membro encontrado nesta organização.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendedor</TableHead>
                        <TableHead className="text-right">Pipeline</TableHead>
                        <TableHead className="text-right">Ganho</TableHead>
                        <TableHead className="text-right">Comissão</TableHead>
                        <TableHead className="text-right">Deals</TableHead>
                        <TableHead className="text-right">Conv.</TableHead>
                        <TableHead className="text-right">Ticket Médio</TableHead>
                        <TableHead className="text-right">Interações</TableHead>
                        <TableHead className="text-right">Reuniões</TableHead>
                        <TableHead className="text-right">Contatos</TableHead>
                        <TableHead className="text-right">Tarefas ✓</TableHead>
                        <TableHead className="min-w-[140px]">% do Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {repsData.map((rep, idx) => {
                        const share = totalWonByReps > 0 ? (rep.wonValue / totalWonByReps) * 100 : 0;
                        return (
                          <TableRow key={rep.user_id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-muted-foreground w-5">{idx + 1}º</span>
                                <Avatar className="h-8 w-8">
                                  {rep.avatar_url && <AvatarImage src={rep.avatar_url} />}
                                  <AvatarFallback className="text-xs">{getInitials(rep.full_name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm leading-tight">{rep.full_name}</p>
                                  <Badge variant="outline" className="text-[10px] mt-0.5 capitalize">{rep.role}</Badge>
                                </div>
                              </div>
                            </TableCell>
                             <TableCell className="text-right text-sm">{formatBRL(rep.pipelineValue)}</TableCell>
                            <TableCell className="text-right text-sm font-semibold text-green-600 dark:text-green-400">
                              {formatBRL(rep.wonValue)}
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium text-orange-600 dark:text-orange-400">
                              {formatBRL(rep.commissionValue)}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              <span className="text-green-600 dark:text-green-400">{rep.wonDeals}</span>
                              <span className="text-muted-foreground"> / </span>
                              <span className="text-red-500">{rep.lostDeals}</span>
                            </TableCell>
                            <TableCell className="text-right text-sm">{rep.conversionRate}%</TableCell>
                            <TableCell className="text-right text-sm">{formatBRL(rep.avgDealValue)}</TableCell>
                            <TableCell className="text-right text-sm font-medium">{rep.interactionsCount}</TableCell>
                            <TableCell className="text-right text-sm font-medium">{rep.meetingsCount}</TableCell>
                            <TableCell className="text-right text-sm">{rep.contactsOwned}</TableCell>
                            <TableCell className="text-right text-sm">{rep.tasksCompleted}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={share} className="h-2" />
                                <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(share)}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline tab */}
        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição do Pipeline por Estágio</CardTitle>
              <CardDescription>Volume e valor de oportunidades em aberto por estágio.</CardDescription>
            </CardHeader>
            <CardContent>
              {byStage.isLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={byStage.data || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      formatter={(value: any, name: string) => name === 'Valor (R$)' ? formatBRL(value) : value}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" name="Qtd. Deals" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    <Bar yAxisId="right" dataKey="value" name="Valor (R$)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sources tab */}
        <TabsContent value="origens" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieIcon className="h-5 w-5" /> Deals por Origem do Lead
                </CardTitle>
                <CardDescription>Distribuição da quantidade de deals por canal de origem.</CardDescription>
              </CardHeader>
              <CardContent>
                {bySource.isLoading ? (
                  <Skeleton className="h-72 w-full" />
                ) : (bySource.data || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">Sem dados ainda.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={bySource.data}
                        dataKey="count"
                        nameKey="source"
                        outerRadius={100}
                        label={(e: any) => `${e.source}: ${e.count}`}
                      >
                        {(bySource.data || []).map((_, i) => (
                          <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receita por Origem</CardTitle>
                <CardDescription>Valor total dos deals agrupados por origem.</CardDescription>
              </CardHeader>
              <CardContent>
                {bySource.isLoading ? (
                  <Skeleton className="h-72 w-full" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Origem</TableHead>
                        <TableHead className="text-right">Deals</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(bySource.data || []).map(s => (
                        <TableRow key={s.source}>
                          <TableCell className="capitalize text-sm">{s.source.replace(/_/g, ' ')}</TableCell>
                          <TableCell className="text-right text-sm">{s.count}</TableCell>
                          <TableCell className="text-right text-sm font-medium">{formatBRL(s.value)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trend tab */}
        <TabsContent value="tendencia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendência dos Últimos 6 Meses</CardTitle>
              <CardDescription>Deals criados vs. deals ganhos por mês.</CardDescription>
            </CardHeader>
            <CardContent>
              {trend.isLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={trend.data || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="created" name="Criados" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="won" name="Ganhos" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Receita Ganha por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              {trend.isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={trend.data || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      formatter={(value: any) => formatBRL(value)}
                    />
                    <Bar dataKey="wonValue" name="Receita Ganha" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
