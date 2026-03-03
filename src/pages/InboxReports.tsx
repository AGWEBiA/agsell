import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart3, Clock, CheckCircle2, MessageSquare, Star, Users, TrendingUp, AlertTriangle,
} from 'lucide-react';
import { useInboxReports } from '@/hooks/useInboxReports';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, LineChart, Line } from 'recharts';

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: '#25d366',
  email: '#3b82f6',
  instagram: '#e1306c',
  telegram: '#0088cc',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#94a3b8',
  medium: '#f59e0b',
  high: '#f97316',
  urgent: '#ef4444',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

function formatMinutes(min: number | null): string {
  if (min === null) return '—';
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function InboxReports() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useInboxReports(days);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const kpiCards = [
    { label: 'Total de Tickets', value: data.totalTickets, icon: MessageSquare, color: 'text-primary' },
    { label: 'Abertos', value: data.openTickets, icon: AlertTriangle, color: 'text-amber-500' },
    { label: 'Resolvidos', value: data.resolvedTickets, icon: CheckCircle2, color: 'text-green-500' },
    { label: 'CSAT Médio', value: data.csatAvg !== null ? `${data.csatAvg}/5` : '—', icon: Star, color: 'text-yellow-500', sub: data.csatTotal > 0 ? `${data.csatTotal} respostas` : undefined },
  ];

  const kpiCards2 = [
    { label: 'Tempo Médio 1ª Resposta', value: formatMinutes(data.avgFirstResponseMin), icon: Clock, color: 'text-blue-500' },
    { label: 'Tempo Médio Resolução', value: formatMinutes(data.avgResolutionMin), icon: TrendingUp, color: 'text-purple-500' },
  ];

  const channelData = data.ticketsByChannel.map(c => ({
    ...c,
    channelLabel: c.channel.charAt(0).toUpperCase() + c.channel.slice(1),
    fill: CHANNEL_COLORS[c.channel] || '#94a3b8',
  }));

  const priorityData = data.ticketsByPriority.map(p => ({
    ...p,
    label: PRIORITY_LABELS[p.priority] || p.priority,
    fill: PRIORITY_COLORS[p.priority] || '#94a3b8',
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Relatórios do SAC</h1>
          <p className="text-muted-foreground text-sm mt-1">Métricas e KPIs de atendimento</p>
        </div>
        <Select value={String(days)} onValueChange={v => setDays(Number(v))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="15">Últimos 15 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="60">Últimos 60 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">{kpi.label}</span>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              {kpi.sub && <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-2 gap-4">
        {kpiCards2.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">{kpi.label}</span>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Tickets per day */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tickets por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            {data.ticketsPerDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.ticketsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Tickets" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados no período</p>
            )}
          </CardContent>
        </Card>

        {/* By channel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tickets por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            {channelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={channelData} dataKey="count" nameKey="channelLabel" cx="50%" cy="50%" outerRadius={80} label={({ channelLabel, count }) => `${channelLabel}: ${count}`}>
                    {channelData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Priority chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tickets por Prioridade</CardTitle>
        </CardHeader>
        <CardContent>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={60} />
                <Tooltip />
                <Bar dataKey="count" name="Tickets" radius={[0, 4, 4, 0]}>
                  {priorityData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p>
          )}
        </CardContent>
      </Card>

      {/* Agent performance */}
      {data.agentPerformance.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Performance dos Atendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Atendente</TableHead>
                  <TableHead className="text-center">Atribuídos</TableHead>
                  <TableHead className="text-center">Resolvidos</TableHead>
                  <TableHead className="text-center">Taxa Resolução</TableHead>
                  <TableHead className="text-center">Tempo Médio Resposta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.agentPerformance.map(agent => (
                  <TableRow key={agent.agent_id}>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell className="text-center">{agent.assigned}</TableCell>
                    <TableCell className="text-center">{agent.resolved}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={agent.assigned > 0 && agent.resolved / agent.assigned >= 0.7 ? 'default' : 'secondary'}>
                        {agent.assigned > 0 ? `${Math.round(agent.resolved / agent.assigned * 100)}%` : '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{formatMinutes(agent.avgResponseMin)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
