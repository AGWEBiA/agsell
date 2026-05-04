import React, { useState, useEffect } from 'react';
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DollarSign, Trophy, TrendingUp, Clock, Target, Users, Briefcase,
  ShieldAlert, ArrowUpRight, BarChart3, PieChart as PieIcon,
  Download, FileText, AlertCircle, History, Calendar, Mail as MailIcon,
  CheckCircle2, Settings, Package, Plus, Trash2,
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
import { useSalesRepDetail } from '@/hooks/useSalesRepDetail';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { DealDetailDialog } from '@/components/crm/DealDetailDialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const formatBRL = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n || 0);

const getInitials = (name: string) =>
  name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

const SOURCE_COLORS = ['hsl(var(--primary))', '#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ec4899', '#06b6d4'];

export default function CRMAdmin() {
  const { currentOrganization, currentRole } = useOrganization();

  // Permission gate: only owner/admin of the org (or global admin) can see this
  const isOrgAdmin = currentRole === 'owner' || currentRole === 'admin';

  const [period, setPeriod] = React.useState<'day' | 'week' | 'month' | 'all'>('all');
  const overview = useCRMOverview();
  const reps = useSalesRepPerformance(period);
  const [selectedRepId, setSelectedRepId] = React.useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = React.useState<string | null>(null);


  const byStage = useDealsByStageAdmin();
  const bySource = useDealsBySource();
  const trend = useMonthlyTrend();

  const { data: productCommissions } = useQuery({
    queryKey: ['product-commissions', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_commissions')
        .select('*')
        .eq('organization_id', currentOrganization?.id || '');
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganization?.id,
  });

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
        <div className="flex items-center gap-2">
          <CRMSettingsDialog />
          <ScheduledExportDialog />
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Hoje</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>

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
              title="Metas & Performance"
              value={currentOrganization?.monthly_sales_target ? `${Math.round(((data?.wonValueThisMonth || 0) / Number(currentOrganization.monthly_sales_target)) * 100)}%` : '0%'}
              description={currentOrganization?.monthly_sales_target ? `Meta: ${formatBRL(Number(currentOrganization.monthly_sales_target))}` : 'Meta não definida'}
              trend={data?.lastMonthWonValue ? { value: data.monthlyGrowth, label: 'vs mês passado' } : undefined}
              icon={<Target className="h-5 w-5 text-primary" />}
            />
            <StatCard
              title="Taxa de Conversão"
              value={`${data?.conversionRate || 0}%`}
              description={`Ciclo médio: ${data?.avgSalesCycleDays || 0} dias`}
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      {/* Alerts / Notifications */}
      {repsData.some(r => r.wonValue === 0 && period !== 'day') && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-400">Atenção: Vendedores sem Vendas</h4>
                <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                  Existem vendedores que ainda não computaram vendas neste período. Verifique o ranking abaixo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ticket Médio"
          value={formatBRL(data?.avgDealValue || 0)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Total Comissões"
          value={formatBRL(repsData.reduce((s, r) => s + (r.commissionValue || 0), 0))}
          icon={<DollarSign className="h-5 w-5 text-orange-500" />}
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
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
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
                          <TableRow 
                            key={rep.user_id} 
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setSelectedRepId(rep.user_id)}
                          >
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

          <SalesRepDetailDialog 
            userId={selectedRepId} 
            onClose={() => setSelectedRepId(null)} 
            period={period}
          />
          <DealDetailDialog
            dealId={selectedDealId}
            onClose={() => setSelectedDealId(null)}
          />
        </TabsContent>

        {/* Products tab */}
        <TabsContent value="produtos" className="space-y-4">
          <ProductPerformanceTab productCommissions={productCommissions} />
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

        {/* Performance Comparison tab */}
        <TabsContent value="comparativo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparativo de Performance</CardTitle>
              <CardDescription>Visualização gráfica da receita gerada por cada vendedor.</CardDescription>
            </CardHeader>
            <CardContent>
              {reps.isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={repsData} layout="vertical" margin={{ left: 40, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <YAxis dataKey="full_name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: any) => formatBRL(v)} />
                    <Legend />
                    <Bar dataKey="wonValue" name="Receita Ganha" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="target_amount" name="Meta Individual" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="pipelineValue" name="Pipeline Aberto" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
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

function SalesRepDetailDialog({ userId, onClose, period }: { userId: string | null; onClose: () => void; period: 'day' | 'week' | 'month' | 'all' }) {
  const { data: rep, isLoading } = useSalesRepDetail(userId, period);

  return (
    <Dialog open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              {rep?.avatar_url && <AvatarImage src={rep.avatar_url} />}
              <AvatarFallback>{rep ? getInitials(rep.full_name) : '?'}</AvatarFallback>
            </Avatar>
            Detalhes do Vendedor: {rep?.full_name}
          </DialogTitle>
          <DialogDescription>
            Performance detalhada e histórico de vendas para o período selecionado.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : rep ? (
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Total Ganho" value={formatBRL(rep.stats.totalWon)} icon={<Trophy className="h-4 w-4" />} />
              <StatCard title="Comissões" value={formatBRL(rep.stats.totalCommission)} icon={<DollarSign className="h-4 w-4" />} />
              <StatCard title="Conversão" value={`${rep.stats.conversionRate}%`} icon={<Target className="h-4 w-4" />} />
              <StatCard title="Ticket Médio" value={formatBRL(rep.stats.avgDealValue)} icon={<TrendingUp className="h-4 w-4" />} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Evolução de Vendas (Mensal)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={rep.monthlyEvolution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => formatBRL(v)} />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Vendas Computadas</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-[10px]">
                    <Download className="h-3 w-3 mr-1" /> PDF
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[10px]">
                    <Download className="h-3 w-3 mr-1" /> CSV
                  </Button>
                </div>
              </div>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Comissão</TableHead>
                      <TableHead>Status Pgto</TableHead>
                      <TableHead>Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rep.sales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-xs">Nenhuma venda no período.</TableCell>
                      </TableRow>
                    ) : (
                      rep.sales.map((sale) => (
                        <TableRow 
                          key={sale.id} 
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedDealId(sale.id)}
                        >
                          <TableCell className="text-xs font-medium">{sale.title}</TableCell>
                          <TableCell className="text-right text-xs">{formatBRL(sale.value)}</TableCell>
                          <TableCell className="text-right text-xs text-orange-600">{formatBRL(sale.commission_value)}</TableCell>
                          <TableCell>
                            <Badge variant={sale.payment_status === 'paid' ? 'default' : 'outline'} className="text-[10px]">
                              {sale.payment_status || 'Pendente'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sale.payment_link ? (
                              <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                                <a href={sale.payment_link} target="_blank" rel="noopener noreferrer">
                                  <ArrowUpRight className="h-3 w-3" />
                                </a>
                              </Button>
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ScheduledExportDialog() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const config = (currentOrganization as any)?.scheduled_export_config || {
    enabled: false,
    frequency: 'weekly',
    format: 'pdf',
    emails: [],
  };

  const [formData, setFormData] = useState(config);
  const [emailInput, setEmailInput] = useState('');

  const updateConfig = useMutation({
    mutationFn: async (newConfig: any) => {
      const { error } = await supabase
        .from('organizations')
        .update({ scheduled_export_config: newConfig })
        .eq('id', currentOrganization?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Configuração de exportação atualizada!');
    },
  });

  const handleAddEmail = () => {
    if (emailInput && !formData.emails.includes(emailInput)) {
      setFormData({ ...formData, emails: [...formData.emails, emailInput] });
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (email: string) => {
    setFormData({ ...formData, emails: formData.emails.filter((e: string) => e !== email) });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" /> Exportação Agendada
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar Relatórios Automáticos</DialogTitle>
          <DialogDescription>
            Receba relatórios de performance diretamente no e-mail dos administradores.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="export-enabled">Ativar Relatórios Automáticos</Label>
            <Switch
              id="export-enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label>Frequência</Label>
            <Select
              value={formData.frequency}
              onValueChange={(val) => setFormData({ ...formData, frequency: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Formato</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  checked={formData.format === 'pdf'}
                  onChange={() => setFormData({ ...formData, format: 'pdf' })}
                />
                <span className="text-sm">PDF</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  checked={formData.format === 'csv'}
                  onChange={() => setFormData({ ...formData, format: 'csv' })}
                />
                <span className="text-sm">CSV</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>E-mails dos Destinatários</Label>
            <div className="flex gap-2">
              <Input
                placeholder="exemplo@email.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
              <Button type="button" onClick={handleAddEmail} size="sm">Adicionar</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.emails.map((email: string) => (
                <Badge key={email} variant="secondary" className="flex items-center gap-1">
                  {email}
                  <button onClick={() => handleRemoveEmail(email)} className="ml-1 hover:text-destructive">
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full"
            onClick={() => updateConfig.mutate(formData)}
            disabled={updateConfig.isPending}
          >
            {updateConfig.isPending ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function CRMSettingsDialog() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState(Number(currentOrganization?.monthly_sales_target) || 0);
  const [commissionRate, setCommissionRate] = useState((currentOrganization as any)?.sales_commission_rule?.default_rate || 0);
  
  const { data: members } = useQuery({
    queryKey: ['org-members-goals', currentOrganization?.id],
    queryFn: async () => {
      const { data: membersData } = await supabase
        .from('organization_members')
        .select('user_id, commission_rate')
        .eq('organization_id', currentOrganization?.id || '');
      
      const userIds = (membersData || []).map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const { data: goals } = await supabase
        .from('revenue_goals')
        .select('*')
        .eq('organization_id', currentOrganization?.id || '');
        
      return (membersData || []).map((m: any) => ({
        user_id: m.user_id,
        name: profiles?.find(p => p.user_id === m.user_id)?.full_name || 'Sem nome',
        target: goals?.find(g => g.user_id === m.user_id)?.target_amount || 0,
        goal_id: goals?.find(g => g.user_id === m.user_id)?.id,
        commission_rate: m.commission_rate || 0,
      }));
    },
    enabled: !!currentOrganization?.id,
  });

  const { data: productCommissions } = useQuery({
    queryKey: ['product-commissions', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_commissions')
        .select('*')
        .eq('organization_id', currentOrganization?.id || '');
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganization?.id,
  });

  const [repGoals, setRepGoals] = useState<{ [key: string]: number }>({});
  const [repCommissions, setRepCommissions] = useState<{ [key: string]: number }>({});
  const [products, setProducts] = useState<{ id?: string; product_name: string; commission_rate: number; monthly_target: number }[]>([]);

  useEffect(() => {
    if (members) {
      const goals: { [key: string]: number } = {};
      const commissions: { [key: string]: number } = {};
      members.forEach(m => {
        goals[m.user_id] = m.target;
        commissions[m.user_id] = m.commission_rate;
      });
      setRepGoals(goals);
      setRepCommissions(commissions);
    }
  }, [members]);

  useEffect(() => {
    if (productCommissions) {
      setProducts(productCommissions);
    }
  }, [productCommissions]);

  const addProduct = () => {
    setProducts([...products, { product_name: '', commission_rate: 0, monthly_target: 0 }]);
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: string, value: any) => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setProducts(newProducts);
  };

  const updateSettings = useMutation({
    mutationFn: async (data: { 
      target: number; 
      commissionRate: number; 
      repGoals: { [key: string]: number }; 
      repCommissions: { [key: string]: number };
      products: typeof products 
    }) => {
      // 1. Update Organization
      const { error: orgError } = await supabase
        .from('organizations')
        .update({ 
          monthly_sales_target: data.target,
          sales_commission_rule: { default_rate: data.commissionRate }
        })
        .eq('id', currentOrganization?.id);
      if (orgError) throw orgError;

      // 2. Update individual goals and seller commission rates
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());

      for (const userId in data.repGoals) {
        const goalAmount = data.repGoals[userId];
        const sellerComm = data.repCommissions[userId] || 0;
        const existing = members?.find(m => m.user_id === userId);
        
        // Update member commission rate
        await supabase
          .from('organization_members')
          .update({ commission_rate: sellerComm })
          .eq('organization_id', currentOrganization?.id || '')
          .eq('user_id', userId);

        if (existing?.goal_id) {
          await supabase
            .from('revenue_goals')
            .update({ target_amount: goalAmount })
            .eq('id', existing.goal_id);
        } else {
          await supabase
            .from('revenue_goals')
            .insert({
              organization_id: currentOrganization?.id,
              user_id: userId,
              target_amount: goalAmount,
              period_start: start.toISOString().split('T')[0],
              period_end: end.toISOString().split('T')[0],
              currency: 'BRL'
            });
        }
      }

      // 3. Update product commissions
      // First, remove ones that are no longer in the list (if they had an ID)
      const currentIds = data.products.map(p => p.id).filter(Boolean);
      if (productCommissions?.length) {
        const toDelete = productCommissions.filter(p => !currentIds.includes(p.id)).map(p => p.id);
        if (toDelete.length > 0) {
          await supabase.from('product_commissions').delete().in('id', toDelete);
        }
      }

      // Upsert current products
      for (const product of data.products) {
        if (!product.product_name) continue;
        
        const payload = {
          organization_id: currentOrganization?.id,
          product_name: product.product_name,
          commission_rate: product.commission_rate,
          monthly_target: product.monthly_target
        };

        if (product.id) {
          await supabase.from('product_commissions').update(payload).eq('id', product.id);
        } else {
          await supabase.from('product_commissions').insert(payload);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['org-members-goals'] });
      queryClient.invalidateQueries({ queryKey: ['product-commissions'] });
      toast.success('Configurações salvas!');
    },
    onError: (err: any) => {
      toast.error('Erro ao salvar: ' + err.message);
    }
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" /> Configurações CRM
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" /> Configurações Estratégicas do CRM
          </DialogTitle>
          <DialogDescription>
            Gerencie metas, comissões e performance por produto e por vendedor.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="geral" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="geral">Geral & Metas</TabsTrigger>
            <TabsTrigger value="vendedores">Vendedores</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-6 py-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" /> Meta Global
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Meta Mensal da Empresa (R$)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="number" 
                        className="pl-9"
                        value={target} 
                        onChange={e => setTarget(Number(e.target.value))} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-orange-500" /> Comissão Padrão
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Taxa Padrão (%)</Label>
                    <div className="relative">
                      <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="number" 
                        className="pl-9"
                        value={commissionRate} 
                        onChange={e => setCommissionRate(Number(e.target.value))} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vendedores" className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Metas e Comissões Individuais por Vendedor</h4>
              <Badge variant="secondary">{members?.length || 0} Membros</Badge>
            </div>
            <div className="grid gap-3">
              {members?.map(m => (
                <div key={m.user_id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border border-border/50 transition-all hover:bg-muted/50">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {m.name.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{currentOrganization?.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-32 space-y-1">
                      <Label className="text-[10px] font-bold uppercase opacity-60">Meta (R$)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                          type="number"
                          className="h-9 pl-8 text-sm"
                          placeholder="Meta R$"
                          value={repGoals[m.user_id] || 0}
                          onChange={e => setRepGoals({ ...repGoals, [m.user_id]: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    
                    <div className="w-24 space-y-1">
                      <Label className="text-[10px] font-bold uppercase opacity-60">Comissão (%)</Label>
                      <div className="relative">
                        <TrendingUp className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                          type="number"
                          className="h-9 pl-8 text-sm"
                          placeholder="Rate %"
                          value={repCommissions[m.user_id] || 0}
                          onChange={e => setRepCommissions({ ...repCommissions, [m.user_id]: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="produtos" className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">Configurações por Produto</h4>
                <p className="text-[11px] text-muted-foreground">Defina comissões e metas específicas para cada item do seu catálogo.</p>
              </div>
              <Button size="sm" onClick={addProduct} className="h-8">
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
            
            <div className="space-y-3">
              {products.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-xl">
                  <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum produto configurado ainda.</p>
                  <Button variant="link" size="sm" onClick={addProduct}>Clique para adicionar o primeiro</Button>
                </div>
              ) : (
                products.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-card p-4 rounded-xl border items-end group">
                    <div className="md:col-span-5 space-y-1.5">
                      <Label className="text-[11px] uppercase tracking-wider font-bold opacity-70">Nome do Produto</Label>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Ex: Consultoria Premium" 
                          className="pl-9"
                          value={p.product_name}
                          onChange={e => updateProduct(idx, 'product_name', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="md:col-span-3 space-y-1.5">
                      <Label className="text-[11px] uppercase tracking-wider font-bold opacity-70">Comissão (%)</Label>
                      <Input 
                        type="number" 
                        placeholder="0.00"
                        value={p.commission_rate}
                        onChange={e => updateProduct(idx, 'commission_rate', Number(e.target.value))}
                      />
                    </div>
                    <div className="md:col-span-3 space-y-1.5">
                      <Label className="text-[11px] uppercase tracking-wider font-bold opacity-70">Meta Mensal (R$)</Label>
                      <Input 
                        type="number" 
                        placeholder="0.00"
                        value={p.monthly_target}
                        onChange={e => updateProduct(idx, 'monthly_target', Number(e.target.value))}
                      />
                    </div>
                    <div className="md:col-span-1 flex justify-center pb-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => removeProduct(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-400">Dica Estratégica</p>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-500">
              Configurar metas por produto ajuda a focar o comercial nos itens de maior margem. 
              As comissões por produto têm prioridade sobre a comissão padrão da organização.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-6 gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="flex-1 rounded-lg">Cancelar</Button>
          </DialogClose>
          <Button 
            className="flex-1 rounded-lg shadow-lg shadow-primary/20" 
            onClick={() => updateSettings.mutate({ target, commissionRate, repGoals, repCommissions, products })}
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? 'Sincronizando...' : 'Salvar Estratégia'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function ProductPerformanceTab({ productCommissions }: { productCommissions: any[] | undefined }) {
  const { currentOrganization } = useOrganization();
  
  const { data: salesByProduct } = useQuery({
    queryKey: ['sales-by-product', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('product_id, value')
        .eq('organization_id', currentOrganization?.id || '')
        .eq('status', 'won');
      if (error) throw error;
      
      const stats: { [key: string]: number } = {};
      data.forEach(d => {
        if (d.product_id) {
          stats[d.product_id] = (stats[d.product_id] || 0) + (Number(d.value) || 0);
        }
      });
      return stats;
    },
    enabled: !!currentOrganization?.id,
  });

  if (!productCommissions || productCommissions.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Nenhum produto com meta configurada.</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Performance por Linha de Produto</CardTitle>
          <CardDescription>Vendas reais vs Metas definidas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {productCommissions.map((prod: any) => {
              const target = Number(prod.monthly_target) || 0;
              const sales = salesByProduct?.[prod.id] || 0;
              const progress = target > 0 ? Math.min(100, (sales / target) * 100) : 0;
              
              return (
                <div key={prod.id} className="space-y-3 p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-bold text-sm">{prod.product_name}</span>
                        <p className="text-[10px] text-muted-foreground">Taxa: {prod.commission_rate}%</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold block">{formatBRL(sales)}</span>
                      <span className="text-[10px] text-muted-foreground">Meta: {formatBRL(target)}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-medium">
                      <span>Atingimento</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-secondary" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Mix de Faturamento (Meta)</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={productCommissions}
                dataKey="monthly_target"
                nameKey="product_name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={40}
                paddingAngle={5}
              >
                {productCommissions.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => formatBRL(v)} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
