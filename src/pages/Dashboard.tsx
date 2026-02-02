import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  DollarSign,
  TrendingUp,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
} from 'lucide-react';
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
} from 'recharts';

// Mock data
const leadsData = [
  { name: 'Jan', leads: 45 },
  { name: 'Fev', leads: 52 },
  { name: 'Mar', leads: 61 },
  { name: 'Abr', leads: 58 },
  { name: 'Mai', leads: 72 },
  { name: 'Jun', leads: 85 },
  { name: 'Jul', leads: 91 },
];

const salesData = [
  { name: 'Jan', value: 12500 },
  { name: 'Fev', value: 18200 },
  { name: 'Mar', value: 15800 },
  { name: 'Abr', value: 22000 },
  { name: 'Mai', value: 19500 },
  { name: 'Jun', value: 28000 },
  { name: 'Jul', value: 32500 },
];

const pipelineData = [
  { name: 'Prospecção', value: 25, color: '#a70202' },
  { name: 'Qualificação', value: 18, color: '#3b82f6' },
  { name: 'Proposta', value: 12, color: '#f59e0b' },
  { name: 'Negociação', value: 8, color: '#8b5cf6' },
  { name: 'Fechado', value: 15, color: '#22c55e' },
];

const recentActivities = [
  { type: 'lead', message: 'Novo lead: João Silva', time: '5 min atrás', icon: Users },
  { type: 'deal', message: 'Deal movido para Proposta: Empresa ABC', time: '15 min atrás', icon: DollarSign },
  { type: 'email', message: 'Email enviado para Maria Santos', time: '30 min atrás', icon: Mail },
  { type: 'task', message: 'Tarefa concluída: Follow-up cliente', time: '1h atrás', icon: CheckCircle2 },
  { type: 'whatsapp', message: 'Mensagem recebida de Carlos Lima', time: '2h atrás', icon: MessageSquare },
];

const topLeads = [
  { name: 'João Silva', score: 92, company: 'Tech Corp', status: 'hot' },
  { name: 'Maria Santos', score: 85, company: 'Digital Solutions', status: 'hot' },
  { name: 'Carlos Lima', score: 78, company: 'Inovação SA', status: 'warm' },
  { name: 'Ana Oliveira', score: 72, company: 'StartUp XYZ', status: 'warm' },
  { name: 'Pedro Costa', score: 65, company: 'Empresa ABC', status: 'cold' },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu CRM</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Activity className="h-3 w-3" />
          Atualizado agora
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Contatos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.247</div>
            <div className="flex items-center text-xs text-success">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              +12% em relação ao mês passado
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deals Abertos
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 248.500</div>
            <div className="flex items-center text-xs text-success">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              +8% em relação ao mês passado
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5%</div>
            <div className="flex items-center text-xs text-destructive">
              <ArrowDownRight className="mr-1 h-3 w-3" />
              -2% em relação ao mês passado
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Meta Mensal
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <div className="w-full bg-secondary rounded-full h-2 mt-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '78%' }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Leads Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Novos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={leadsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                  <YAxis className="text-xs fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Chart */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Pipeline de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pipelineData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {pipelineData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-medium ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activities */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Leads */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Leads Mais Quentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topLeads.map((lead, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    {lead.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.company}</p>
                  </div>
                  <Badge
                    variant={lead.status === 'hot' ? 'default' : lead.status === 'warm' ? 'secondary' : 'outline'}
                    className={lead.status === 'hot' ? 'bg-primary' : ''}
                  >
                    {lead.score}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
