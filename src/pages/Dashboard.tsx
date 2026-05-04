import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  DollarSign,
  TrendingUp,
  Target,
  ArrowUpRight,
  ArrowRight,
  ArrowDownRight,
  Activity,
  CheckCircle2,
  Clock,
  Mail,
  Phone, PhoneCall, Wallet,
  MessageSquare,
  FileText,
  Calendar,
  Zap,
  UserPlus,
  Trophy,
  Flame,
  Briefcase,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from '@/lib/recharts';
import {
  useDashboardStats,
  useLeadsByMonth,
  useDealsByStage,
  useRecentActivities,
  useTopLeads,
} from '@/hooks/useDashboard';
import { useGamification } from '@/hooks/useGamification';

const activityIcons: Record<string, React.ElementType> = {
  email_sent: Mail,
  email_received: Mail,
  call: Phone,
  whatsapp: MessageSquare,
  meeting: Calendar,
  note: FileText,
  deal_created: DollarSign,
  deal_won: CheckCircle2,
  contact_created: UserPlus,
  automation: Zap,
};

export default function Dashboard() {
  const { data: stats, isLoading: loadingStats } = useDashboardStats();
  const { data: leadsData, isLoading: loadingLeads } = useLeadsByMonth();
  const { data: pipelineData, isLoading: loadingPipeline } = useDealsByStage();
  const { data: activities, isLoading: loadingActivities } = useRecentActivities();
  const { data: topLeads, isLoading: loadingTopLeads } = useTopLeads();
  const { stats: gamificationStats, getLevelTitle } = useGamification();
  const { currentOrganization, currentRole } = useOrganization();

  const { data: commCredits } = useQuery({
    queryKey: ['communication-credits', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return null;
      const { data } = await supabase
        .from('communication_credits')
        .select('balance, total_purchased, total_used')
        .eq('organization_id', currentOrganization.id)
        .maybeSingle();
      return data;
    },
    enabled: !!currentOrganization?.id,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const currentLevel = gamificationStats?.level || 1;
  const currentPoints = gamificationStats?.total_points || 0;
  const progressToNextLevel = ((currentPoints % 100) / 100) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Visão geral do seu CRM</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Gamification Mini Widget */}
          {gamificationStats && (
            <Card className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-xs sm:text-sm">
                  {currentLevel}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-medium">{getLevelTitle(currentLevel)}</p>
                  <Progress value={progressToNextLevel} className="h-1 w-20" />
                </div>
              </div>
              {gamificationStats.current_streak > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {gamificationStats.current_streak}
                </Badge>
              )}
            </Card>
          )}
          <Badge variant="outline" className="gap-1 text-xs hidden sm:flex">
            <Activity className="h-3 w-3" />
            Atualizado agora
          </Badge>
        </div>
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
            {loadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalContacts.toLocaleString('pt-BR') || 0}</div>
                <div className={`flex items-center text-xs ${(stats?.contactsGrowth || 0) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {(stats?.contactsGrowth || 0) >= 0 ? (
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3" />
                  )}
                  {stats?.contactsGrowth || 0}% em relação ao mês passado
                </div>
              </>
            )}
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
            {loadingStats ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(stats?.totalDealsValue || 0)}</div>
                <div className={`flex items-center text-xs ${(stats?.dealsGrowth || 0) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {(stats?.dealsGrowth || 0) >= 0 ? (
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3" />
                  )}
                  {stats?.dealsGrowth || 0}% em relação ao mês passado
                </div>
              </>
            )}
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
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.conversionRate || 0}%</div>
                <div className="text-xs text-muted-foreground">
                  Baseado em deals ganhos
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tarefas
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.tasksCompleted || 0} / {(stats?.tasksCompleted || 0) + (stats?.tasksPending || 0)}
                </div>
                <div className="w-full bg-secondary rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all" 
                    style={{ 
                      width: `${((stats?.tasksCompleted || 0) / Math.max(1, (stats?.tasksCompleted || 0) + (stats?.tasksPending || 0))) * 100}%` 
                    }} 
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Saldo de Créditos Unificado */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Créditos de Comunicação (SMS + VoIP)
          </CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(commCredits?.balance ?? 0).toLocaleString('pt-BR')}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              Comprados: {(commCredits?.total_purchased ?? 0).toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-muted-foreground">
              Usados: {(commCredits?.total_used ?? 0).toLocaleString('pt-BR')}
            </span>
          </div>
          {(commCredits?.total_purchased ?? 0) > 0 && (
            <Progress
              value={((commCredits?.balance ?? 0) / (commCredits?.total_purchased ?? 1)) * 100}
              className="h-1.5 mt-2"
            />
          )}
        </CardContent>
      </Card>

      {/* Sales Performance Summary for Admins */}
      {(currentRole === 'owner' || currentRole === 'admin') && (
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Performance do Time Comercial</CardTitle>
              <CardDescription>Resumo rápido das vendas e comissões do mês</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/crm-admin" className="gap-1">
                Ver completo <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Faturamento (Mês)</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(stats?.totalDealsValue || 0)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Comissões Geradas</p>
                <p className="text-2xl font-bold text-orange-500">
                  {formatCurrency((stats?.totalDealsValue || 0) * 0.1)} {/* Mocking a general 10% if not calculated yet */}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Melhor Vendedor</p>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">{stats?.topSalesRep || 'Carregando...'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        {/* Leads Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Novos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loadingLeads ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={leadsData || []}>
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
                    <Area
                      type="monotone"
                      dataKey="leads"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary) / 0.2)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Pipeline de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loadingPipeline ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-40 w-40 rounded-full mx-auto" />
                </div>
              ) : pipelineData && pipelineData.length > 0 ? (
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
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <DollarSign className="h-12 w-12 mb-2 opacity-50" />
                  <p>Nenhum deal no pipeline</p>
                </div>
              )}
            </div>
            {pipelineData && pipelineData.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {pipelineData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground truncate">{item.name}</span>
                    <span className="font-medium ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        {/* Recent Activities */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingActivities ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => {
                  const Icon = activityIcons[activity.type] || FileText;
                  return (
                    <div key={activity.id} className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma atividade registrada</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Leads */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Leads Mais Quentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTopLeads ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-10" />
                  </div>
                ))}
              </div>
            ) : topLeads && topLeads.length > 0 ? (
              <div className="space-y-4">
                {topLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {lead.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{lead.company || 'Sem empresa'}</p>
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
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum lead com score</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
