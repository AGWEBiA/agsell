import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  CreditCard,
  Mail,
  Crown,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PlansManagement } from '@/components/admin/PlansManagement';
import { EmailCostProjection } from '@/components/admin/EmailCostProjection';
import { EmailProviderConfig } from '@/components/admin/EmailProviderConfig';
import { UsersManagement } from '@/components/admin/UsersManagement';
import { AssignPlanDialog } from '@/components/admin/AssignPlanDialog';

export default function Admin() {
  const { user, isAdmin, loading: isCheckingAdmin } = useAuth();
  const [assignPlanOrg, setAssignPlanOrg] = useState<{ id: string; name: string } | null>(null);

  // Fetch all organizations
  const { data: organizations = [], isLoading: isLoadingOrgs } = useQuery({
    queryKey: ['admin_organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          organization_members(count),
          subscriptions(*, plans(*))
        `);
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin === true,
  });

  // Fetch global stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin_stats'],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: totalContacts },
        { count: totalDeals },
        { count: totalAutomations },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('contacts').select('*', { count: 'exact', head: true }),
        supabase.from('deals').select('*', { count: 'exact', head: true }),
        supabase.from('automations').select('*', { count: 'exact', head: true }),
      ]);

      return {
        totalUsers: totalUsers || 0,
        totalContacts: totalContacts || 0,
        totalDeals: totalDeals || 0,
        totalAutomations: totalAutomations || 0,
      };
    },
    enabled: isAdmin === true,
  });

  // Fetch plan distribution
  const { data: planDistribution = [] } = useQuery({
    queryKey: ['admin_plan_distribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plans(name)');
      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((sub: any) => {
        const planName = sub.plans?.name || 'Free';
        counts[planName] = (counts[planName] || 0) + 1;
      });

      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
    enabled: isAdmin === true,
  });

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  // Calculate MRR from subscriptions
  const mrr = organizations.reduce((total, org: any) => {
    const subscription = org.subscriptions?.[0];
    if (subscription?.status === 'active' && subscription.plans?.price_monthly) {
      return total + Number(subscription.plans.price_monthly);
    }
    return total;
  }, 0);

  // Build MRR chart from real subscription created_at dates
  const mrrData = React.useMemo(() => {
    const now = new Date();
    const months: { month: string; mrr: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      let accMrr = 0;
      organizations.forEach((org: any) => {
        const sub = org.subscriptions?.[0];
        if (sub?.status === 'active' && sub.plans?.price_monthly) {
          const subDate = new Date(sub.created_at);
          if (subDate <= new Date(d.getFullYear(), d.getMonth() + 1, 0)) {
            accMrr += Number(sub.plans.price_monthly);
          }
        }
      });
      months.push({ month: label.charAt(0).toUpperCase() + label.slice(1), mrr: accMrr });
    }
    return months;
  }, [organizations]);

  // Calculate real MRR growth percentage
  const mrrGrowth = React.useMemo(() => {
    if (mrrData.length < 2) return 0;
    const current = mrrData[mrrData.length - 1].mrr;
    const previous = mrrData[mrrData.length - 2].mrr;
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }, [mrrData]);

  if (isCheckingAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>
          <p className="text-muted-foreground">Visão global de todas as organizações</p>
        </div>
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Super Admin
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="email-costs" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Custos E-mail
          </TabsTrigger>
          <TabsTrigger value="email-provider" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Provedor E-mail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MRR</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mrr)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {mrrGrowth >= 0 ? (
                    <><TrendingUp className="inline h-3 w-3 text-green-500 mr-1" />+{mrrGrowth}% vs mês anterior</>
                  ) : (
                    <><TrendingUp className="inline h-3 w-3 text-destructive mr-1 rotate-180" />{mrrGrowth}% vs mês anterior</>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Organizações</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{organizations.length}</div>
                <p className="text-xs text-muted-foreground">
                  {organizations.filter((o: any) => o.subscriptions?.[0]?.status === 'active').length} ativas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários Totais</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">Em todas as organizações</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contatos Totais</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalContacts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalDeals || 0} deals • {stats?.totalAutomations || 0} automações
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Evolução MRR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mrrData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="mrr" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.2} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Plano</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planDistribution.length > 0 ? planDistribution : [{ name: 'Free', value: organizations.length || 1 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {(planDistribution.length > 0 ? planDistribution : [{ name: 'Free', value: 1 }]).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Organizations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Organizações</CardTitle>
              <CardDescription>Lista de todas as organizações cadastradas</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOrgs ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organização</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Membros</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organizations.map((org: any) => {
                        const subscription = org.subscriptions?.[0];
                        const plan = subscription?.plans?.name || 'Free';
                        const status = subscription?.status || 'inactive';
                        const membersCount = org.organization_members?.[0]?.count || 0;

                        return (
                          <TableRow key={org.id}>
                            <TableCell className="font-medium">{org.name}</TableCell>
                            <TableCell className="text-muted-foreground">{org.slug}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{plan}</Badge>
                            </TableCell>
                            <TableCell>
                              {status === 'active' ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Ativo
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Inativo
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{membersCount}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(org.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => setAssignPlanOrg({ id: org.id, name: org.name })} title="Atribuir plano">
                                <Crown className="h-4 w-4 text-yellow-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <UsersManagement />
        </TabsContent>

        <TabsContent value="plans">
          <PlansManagement />
        </TabsContent>

        <TabsContent value="email-costs">
          <EmailCostProjection />
        </TabsContent>

        <TabsContent value="email-provider">
          <EmailProviderConfig />
        </TabsContent>
      </Tabs>

      <AssignPlanDialog
        organization={assignPlanOrg}
        open={!!assignPlanOrg}
        onOpenChange={(open) => { if (!open) setAssignPlanOrg(null); }}
      />
    </div>
  );
}
