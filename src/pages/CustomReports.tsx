import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  BarChart3, Plus, LayoutDashboard, Download, Trash2, Eye,
  TrendingUp, Users, DollarSign, Mail, MessageSquare, Target,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';

interface CustomReport {
  id: string;
  name: string;
  metrics: string[];
  chart_type: 'bar' | 'line' | 'pie';
  period: string;
  created_at: string;
}

const METRIC_OPTIONS = [
  { id: 'contacts_created', label: 'Contatos Criados', icon: Users, category: 'CRM' },
  { id: 'deals_won', label: 'Deals Ganhos', icon: DollarSign, category: 'CRM' },
  { id: 'deals_value', label: 'Valor de Deals', icon: TrendingUp, category: 'CRM' },
  { id: 'emails_sent', label: 'E-mails Enviados', icon: Mail, category: 'Marketing' },
  { id: 'emails_opened', label: 'E-mails Abertos', icon: Mail, category: 'Marketing' },
  { id: 'whatsapp_sent', label: 'WhatsApp Enviados', icon: MessageSquare, category: 'Marketing' },
  { id: 'automations_triggered', label: 'Automações Executadas', icon: Target, category: 'Marketing' },
  { id: 'forms_submitted', label: 'Formulários Enviados', icon: LayoutDashboard, category: 'Marketing' },
];

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const mockData = [
  { name: 'Jan', contacts_created: 45, deals_won: 12, emails_sent: 890, deals_value: 34500 },
  { name: 'Fev', contacts_created: 62, deals_won: 18, emails_sent: 1230, deals_value: 52000 },
  { name: 'Mar', contacts_created: 78, deals_won: 15, emails_sent: 1540, deals_value: 41000 },
  { name: 'Abr', contacts_created: 55, deals_won: 22, emails_sent: 980, deals_value: 68000 },
  { name: 'Mai', contacts_created: 91, deals_won: 28, emails_sent: 2100, deals_value: 85000 },
  { name: 'Jun', contacts_created: 103, deals_won: 31, emails_sent: 2450, deals_value: 92000 },
];

export default function CustomReports() {
  const [reports, setReports] = useState<CustomReport[]>([
    { id: '1', name: 'Performance Geral', metrics: ['contacts_created', 'deals_won', 'emails_sent'], chart_type: 'bar', period: 'last_6_months', created_at: new Date().toISOString() },
    { id: '2', name: 'Funil de Vendas', metrics: ['deals_won', 'deals_value'], chart_type: 'line', period: 'last_3_months', created_at: new Date().toISOString() },
  ]);
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMetrics, setNewMetrics] = useState<string[]>([]);
  const [newChartType, setNewChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [viewReport, setViewReport] = useState<CustomReport | null>(null);

  const handleCreate = () => {
    if (!newName.trim() || newMetrics.length === 0) return toast.error('Nome e pelo menos 1 métrica obrigatórios');
    const report: CustomReport = {
      id: Date.now().toString(), name: newName, metrics: newMetrics,
      chart_type: newChartType, period: 'last_6_months', created_at: new Date().toISOString(),
    };
    setReports(prev => [report, ...prev]);
    setNewOpen(false);
    setNewName('');
    setNewMetrics([]);
    toast.success('Relatório criado');
  };

  const toggleMetric = (id: string) => {
    setNewMetrics(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const renderChart = (report: CustomReport) => {
    const data = mockData;
    if (report.chart_type === 'pie') {
      const pieData = report.metrics.map(m => ({
        name: METRIC_OPTIONS.find(o => o.id === m)?.label || m,
        value: data.reduce((s, d) => s + ((d as any)[m] || 0), 0),
      }));
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    const ChartComp = report.chart_type === 'line' ? LineChart : BarChart;
    return (
      <ResponsiveContainer width="100%" height={300}>
        <ChartComp data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" className="text-muted-foreground" tick={{ fontSize: 12 }} />
          <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
          <Tooltip />
          {report.metrics.map((m, i) =>
            report.chart_type === 'line'
              ? <Line key={m} type="monotone" dataKey={m} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} />
              : <Bar key={m} dataKey={m} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
          )}
        </ChartComp>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" /> Relatórios Personalizados
          </h1>
          <p className="text-muted-foreground">Crie dashboards combinando métricas de CRM, marketing e automações</p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Relatório</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Relatório Personalizado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do relatório</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Performance Mensal" />
              </div>
              <div>
                <Label>Tipo de gráfico</Label>
                <Select value={newChartType} onValueChange={v => setNewChartType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Barras</SelectItem>
                    <SelectItem value="line">Linhas</SelectItem>
                    <SelectItem value="pie">Pizza</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Métricas</Label>
                <div className="grid grid-cols-2 gap-2">
                  {METRIC_OPTIONS.map(m => (
                    <label key={m.id} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-accent">
                      <Checkbox checked={newMetrics.includes(m.id)} onCheckedChange={() => toggleMetric(m.id)} />
                      <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-foreground">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full">Criar Relatório</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {viewReport ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">{viewReport.name}</h2>
            <Button variant="outline" onClick={() => setViewReport(null)}>Voltar</Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              {renderChart(viewReport)}
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {viewReport.metrics.map(m => {
              const opt = METRIC_OPTIONS.find(o => o.id === m);
              const total = mockData.reduce((s, d) => s + ((d as any)[m] || 0), 0);
              return (
                <Card key={m}>
                  <CardContent className="flex items-center gap-3 pt-6">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {opt && <opt.icon className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground">{total.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{opt?.label}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map(r => (
            <Card key={r.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{r.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setViewReport(r)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setReports(prev => prev.filter(p => p.id !== r.id))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {r.metrics.map(m => METRIC_OPTIONS.find(o => o.id === m)?.label).join(', ')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderChart(r)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
