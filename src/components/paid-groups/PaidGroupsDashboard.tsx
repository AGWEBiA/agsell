import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users2, UserPlus, UserMinus, TrendingUp, DollarSign, ShieldCheck, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { usePaidGroupMembers, usePaidGroups, usePaidGroupProducts } from '@/hooks/usePaidGroups';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#f59e0b',
  '#06b6d4',
  '#8b5cf6',
];

export function PaidGroupsDashboard() {
  const { members, isLoading: membersLoading } = usePaidGroupMembers();
  const { groups, isLoading: groupsLoading } = usePaidGroups();
  const { products, isLoading: productsLoading } = usePaidGroupProducts();
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const isLoading = membersLoading || groupsLoading || productsLoading;

  const filteredMembers = useMemo(() => {
    if (selectedGroup === 'all') return members;
    return members.filter(m => m.group_id === selectedGroup);
  }, [members, selectedGroup]);

  const activeMembers = filteredMembers.filter(m => m.status === 'active');
  const removedMembers = filteredMembers.filter(m => m.status === 'removed');
  const last7days = subDays(new Date(), 7);
  const last30days = subDays(new Date(), 30);

  const addedLast7 = filteredMembers.filter(m => m.added_at && isAfter(parseISO(m.added_at), last7days) && m.status === 'active').length;
  const removedLast7 = filteredMembers.filter(m => m.removed_at && isAfter(parseISO(m.removed_at), last7days)).length;
  const addedLast30 = filteredMembers.filter(m => m.added_at && isAfter(parseISO(m.added_at), last30days) && m.status === 'active').length;
  const removedLast30 = filteredMembers.filter(m => m.removed_at && isAfter(parseISO(m.removed_at), last30days)).length;

  const churnRate = activeMembers.length + removedMembers.length > 0
    ? ((removedMembers.length / (activeMembers.length + removedMembers.length)) * 100).toFixed(1)
    : '0';

  // Members per group chart data
  const membersPerGroup = useMemo(() => {
    if (selectedGroup !== 'all') return [];
    const map = new Map<string, { active: number; removed: number; name: string }>();
    groups.forEach(g => map.set(g.id, { active: 0, removed: 0, name: g.name }));
    members.forEach(m => {
      const entry = map.get(m.group_id);
      if (entry) {
        if (m.status === 'active') entry.active++;
        else entry.removed++;
      }
    });
    return Array.from(map.values()).filter(v => v.active > 0 || v.removed > 0);
  }, [groups, members, selectedGroup]);

  // Gateway distribution
  const gatewayDistribution = useMemo(() => {
    const map = new Map<string, number>();
    filteredMembers.forEach(m => {
      const gw = m.gateway_source || 'Desconhecido';
      map.set(gw, (map.get(gw) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredMembers]);

  // Daily additions over last 30 days
  const dailyActivity = useMemo(() => {
    const days: { date: string; adições: number; remoções: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const label = format(day, 'dd/MM', { locale: ptBR });
      const added = filteredMembers.filter(m => m.added_at && m.added_at.startsWith(dayStr)).length;
      const removed = filteredMembers.filter(m => m.removed_at && m.removed_at.startsWith(dayStr)).length;
      days.push({ date: label, adições: added, remoções: removed });
    }
    return days;
  }, [filteredMembers]);

  // Products ranking
  const productRanking = useMemo(() => {
    const map = new Map<string, number>();
    filteredMembers.forEach(m => {
      if (m.product_id) {
        map.set(m.product_id, (map.get(m.product_id) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([id, count]) => ({
        name: products.find(p => p.id === id)?.name || id.slice(0, 8),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredMembers, products]);

  const selectedGroupName = selectedGroup === 'all'
    ? 'Todos os Grupos'
    : groups.find(g => g.id === selectedGroup)?.name || 'Grupo';

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Carregando métricas...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Métricas</h2>
        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Selecione um grupo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">🌐 Todos os Grupos (Global)</SelectItem>
            {groups.map(g => (
              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="ml-auto">{selectedGroupName}</Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Membros Ativos</p>
                <p className="text-3xl font-bold">{activeMembers.length}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3">
                <Users2 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Novos (7 dias)</p>
                <p className="text-3xl font-bold text-primary">{addedLast7}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> {addedLast30} nos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Removidos (7 dias)</p>
                <p className="text-3xl font-bold text-destructive">{removedLast7}</p>
              </div>
              <div className="rounded-full bg-destructive/10 p-3">
                <UserMinus className="h-5 w-5 text-destructive" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3" /> {removedLast30} nos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Churn</p>
                <p className="text-3xl font-bold">{churnRate}%</p>
              </div>
              <div className="rounded-full bg-warning/10 p-3">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {removedMembers.length} de {activeMembers.length + removedMembers.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Atividade Diária (30 dias)</CardTitle>
            <CardDescription>Adições e remoções de membros por dia</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyActivity.some(d => d.adições > 0 || d.remoções > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" fontSize={10} tickLine={false} />
                  <YAxis allowDecimals={false} fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="adições" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="remoções" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Sem atividade nos últimos 30 dias</p>
            )}
          </CardContent>
        </Card>

        {/* Gateway Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Gateway</CardTitle>
            <CardDescription>Origem dos membros por plataforma de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            {gatewayDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={gatewayDistribution} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                    {gatewayDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados de gateway</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members per Group (global only) */}
        {selectedGroup === 'all' && membersPerGroup.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Membros por Grupo</CardTitle>
              <CardDescription>Distribuição de membros ativos e removidos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={membersPerGroup}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" fontSize={10} tickLine={false} />
                  <YAxis allowDecimals={false} fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="active" name="Ativos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="removed" name="Removidos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Product Ranking */}
        <Card className={selectedGroup === 'all' && membersPerGroup.length > 0 ? '' : 'lg:col-span-2'}>
          <CardHeader>
            <CardTitle className="text-base">Ranking de Produtos</CardTitle>
            <CardDescription>Produtos com mais membros vinculados</CardDescription>
          </CardHeader>
          <CardContent>
            {productRanking.length > 0 ? (
              <div className="space-y-3">
                {productRanking.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Badge variant="outline" className="w-7 h-7 flex items-center justify-center shrink-0 text-xs font-bold">
                      {i + 1}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <div className="h-2 rounded-full bg-muted mt-1 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(100, (p.count / (productRanking[0]?.count || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">{p.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados de produtos</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Total de Grupos</p>
            <p className="text-2xl font-bold">{selectedGroup === 'all' ? groups.length : 1}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Produtos Ativos</p>
            <p className="text-2xl font-bold">{products.filter(p => p.is_active).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Gateways Usados</p>
            <p className="text-2xl font-bold">{gatewayDistribution.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Total Histórico</p>
            <p className="text-2xl font-bold">{filteredMembers.length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
