import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Mail,
  MousePointer,
  Download,
  BarChart3,
  PieChartIcon,
} from 'lucide-react';
import {
  useAnalyticsOverview,
  useLeadsOverTime,
  useChannelDistribution,
  useConversionFunnel,
  useSalesReport,
  useEmailMetrics,
} from '@/hooks/useAnalytics';

export default function Analytics() {
  const [period, setPeriod] = useState('30');
  const days = parseInt(period);

  const { data: overview, isLoading: loadingOverview } = useAnalyticsOverview(days);
  const { data: leadsData, isLoading: loadingLeads } = useLeadsOverTime();
  const { data: channelData, isLoading: loadingChannels } = useChannelDistribution();
  const { data: funnelData, isLoading: loadingFunnel } = useConversionFunnel();
  const { data: salesData, isLoading: loadingSales } = useSalesReport();
  const { data: emailMetrics, isLoading: loadingEmail } = useEmailMetrics();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground text-sm">Relatórios e métricas do seu CRM</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36 sm:w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Novos Leads</p>
                {loadingOverview ? (
                  <Skeleton className="h-8 w-20 mt-1" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">{overview?.totalLeads.toLocaleString('pt-BR')}</p>
                    <div className={`flex items-center text-xs mt-1 ${(overview?.leadsGrowth || 0) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {(overview?.leadsGrowth || 0) >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {overview?.leadsGrowth || 0}% vs período anterior
                    </div>
                  </>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                {loadingOverview ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">{overview?.conversionRate}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Deals ganhos / total</p>
                  </>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                {loadingOverview ? (
                  <Skeleton className="h-8 w-28 mt-1" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">{formatCurrency(overview?.totalRevenue || 0)}</p>
                    <div className={`flex items-center text-xs mt-1 ${(overview?.revenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {(overview?.revenueGrowth || 0) >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {overview?.revenueGrowth || 0}% vs período anterior
                    </div>
                  </>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score Médio</p>
                {loadingOverview ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">{overview?.avgLeadScore}</p>
                    <p className="text-xs text-muted-foreground mt-1">Média dos leads</p>
                  </>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <BarChart3 className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Visão Geral</TabsTrigger>
          <TabsTrigger value="sales" className="text-xs sm:text-sm">Vendas</TabsTrigger>
          <TabsTrigger value="channels" className="text-xs sm:text-sm">Canais</TabsTrigger>
          <TabsTrigger value="email" className="text-xs sm:text-sm">Email</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Leads Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução de Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {loadingLeads ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={leadsData || []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs fill-muted-foreground" />
                        <YAxis className="text-xs fill-muted-foreground" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} name="Leads" />
                        <Area type="monotone" dataKey="customers" stroke="#22c55e" fill="rgba(34, 197, 94, 0.2)" strokeWidth={2} name="Clientes" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Channel Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Origem dos Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {loadingChannels ? (
                    <Skeleton className="h-full w-full" />
                  ) : channelData && channelData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={channelData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                          {channelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <PieChartIcon className="h-12 w-12 opacity-50" />
                    </div>
                  )}
                </div>
                {channelData && channelData.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {channelData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 text-sm">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="font-medium ml-auto">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Funil de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {loadingFunnel ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs fill-muted-foreground" />
                      <YAxis dataKey="stage" type="category" width={100} className="text-xs fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number, name: string, props: any) => [
                          `${value} (${props.payload.percentage}%)`,
                          'Quantidade'
                        ]}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                {loadingSales ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="won" fill="#22c55e" name="Ganhos" radius={4} />
                      <Bar dataKey="lost" fill="#ef4444" name="Perdidos" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              {salesData && salesData.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {salesData.reduce((sum, s) => sum + s.won, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Ganhos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {salesData.reduce((sum, s) => sum + s.lost, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Perdidos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(salesData.reduce((sum, s) => sum + s.revenue, 0))}
                    </p>
                    <p className="text-sm text-muted-foreground">Receita Total</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Canal</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingChannels ? (
                <Skeleton className="h-[300px] w-full" />
              ) : channelData && channelData.length > 0 ? (
                <div className="space-y-4">
                  {channelData.map((channel) => (
                    <div key={channel.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{channel.name}</span>
                        <span className="text-muted-foreground">{channel.value}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${channel.value}%`, backgroundColor: channel.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum dado de origem disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    {loadingEmail ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <>
                        <p className="text-2xl font-bold">{emailMetrics?.totalSent.toLocaleString('pt-BR') || 0}</p>
                        <p className="text-sm text-muted-foreground">Emails Enviados</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    {loadingEmail ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <>
                        <p className="text-2xl font-bold">{emailMetrics?.openRate || 0}%</p>
                        <p className="text-sm text-muted-foreground">Taxa de Abertura</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                    <MousePointer className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    {loadingEmail ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <>
                        <p className="text-2xl font-bold">{emailMetrics?.clickRate || 0}%</p>
                        <p className="text-sm text-muted-foreground">Taxa de Clique</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance de Email</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEmail ? (
                <Skeleton className="h-[200px] w-full" />
              ) : emailMetrics && emailMetrics.totalSent > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Enviados</span>
                      <span className="font-medium">{emailMetrics.totalSent}</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Abertos</span>
                      <span className="font-medium">{emailMetrics.totalOpened} ({emailMetrics.openRate}%)</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${emailMetrics.openRate}%` }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Clicados</span>
                      <span className="font-medium">{emailMetrics.totalClicked} ({emailMetrics.clickRate}%)</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${emailMetrics.clickRate}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma campanha de email enviada ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
