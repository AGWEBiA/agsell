import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3, Mail,
  MessageSquare, Zap, ArrowUpRight, Target,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

const revenueByMonth = [
  { month: 'Jan', revenue: 28500, campaigns: 3200, automations: 18700, organic: 6600 },
  { month: 'Fev', revenue: 35200, campaigns: 5400, automations: 21300, organic: 8500 },
  { month: 'Mar', revenue: 42100, campaigns: 8900, automations: 24500, organic: 8700 },
  { month: 'Abr', revenue: 38700, campaigns: 6100, automations: 23100, organic: 9500 },
  { month: 'Mai', revenue: 51300, campaigns: 12400, automations: 28200, organic: 10700 },
  { month: 'Jun', revenue: 58900, campaigns: 15600, automations: 31400, organic: 11900 },
];

const channelROI = [
  { channel: 'E-mail', invested: 450, revenue: 15600, roi: 3367 },
  { channel: 'WhatsApp', invested: 320, revenue: 8900, roi: 2681 },
  { channel: 'SMS', invested: 280, revenue: 4200, roi: 1400 },
  { channel: 'Automações', invested: 200, revenue: 31400, roi: 15600 },
];

const topCampaigns = [
  { name: 'Black Friday 2026', channel: 'email', revenue: 12400, sent: 5200, conversion: 4.2 },
  { name: 'Lançamento Pro', channel: 'whatsapp', revenue: 8900, sent: 1200, conversion: 6.8 },
  { name: 'Reativação Q1', channel: 'email', revenue: 5600, sent: 3800, conversion: 2.1 },
  { name: 'Upsell Enterprise', channel: 'email', revenue: 4300, sent: 450, conversion: 8.4 },
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function RevenueReporting() {
  const [period, setPeriod] = useState('6m');
  const totalRevenue = revenueByMonth.reduce((s, m) => s + m.revenue, 0);
  const prevTotal = 185000;
  const growth = ((totalRevenue - prevTotal) / prevTotal * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-primary" /> Revenue Reporting
          </h1>
          <p className="text-muted-foreground">Receita gerada por campanha, automação e canal com ROI</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">Último mês</SelectItem>
            <SelectItem value="3m">3 meses</SelectItem>
            <SelectItem value="6m">6 meses</SelectItem>
            <SelectItem value="12m">12 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Receita Total', value: `R$ ${(totalRevenue / 1000).toFixed(1)}k`, change: `+${growth}%`, up: true, icon: DollarSign },
          { label: 'Receita Campanhas', value: `R$ ${(revenueByMonth.reduce((s, m) => s + m.campaigns, 0) / 1000).toFixed(1)}k`, change: '+18.3%', up: true, icon: Mail },
          { label: 'Receita Automações', value: `R$ ${(revenueByMonth.reduce((s, m) => s + m.automations, 0) / 1000).toFixed(1)}k`, change: '+24.1%', up: true, icon: Zap },
          { label: 'ROI Médio', value: '5,762%', change: '+12%', up: true, icon: TrendingUp },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <kpi.icon className="h-5 w-5 text-primary" />
                </div>
                <Badge variant={kpi.up ? 'default' : 'destructive'} className="text-xs">
                  {kpi.up ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                  {kpi.change}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="roi">ROI por Canal</TabsTrigger>
          <TabsTrigger value="campaigns">Top Campanhas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Receita ao Longo do Tempo</CardTitle>
              <CardDescription>Breakdown por fonte de receita</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                  <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="automations" stackId="1" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.6} name="Automações" />
                  <Area type="monotone" dataKey="campaigns" stackId="1" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.6} name="Campanhas" />
                  <Area type="monotone" dataKey="organic" stackId="1" stroke={COLORS[2]} fill={COLORS[2]} fillOpacity={0.6} name="Orgânico" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>ROI por Canal</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={channelROI} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="channel" type="category" className="text-muted-foreground" tick={{ fontSize: 12 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="roi" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="ROI %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Distribuição de Receita</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={channelROI} dataKey="revenue" nameKey="channel" cx="50%" cy="50%" outerRadius={100} label>
                      {channelROI.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campanhas com Maior Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topCampaigns.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{c.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px]">{c.channel}</Badge>
                          <span>{c.sent} envios</span>
                          <span>•</span>
                          <span>{c.conversion}% conversão</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-foreground">R$ {c.revenue.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
