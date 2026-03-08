import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Phone, PhoneCall, TrendingUp, TrendingDown, Clock, BarChart3, Users,
  MessageSquare, SmilePlus, Frown, Meh, Loader2, FileText, Brain
} from 'lucide-react';
import { useVoip } from '@/hooks/useVoip';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const SENTIMENT_COLORS = {
  positive: '#22c55e',
  neutral: '#eab308',
  negative: '#ef4444',
};

export function CallAnalyticsDashboard() {
  const { calls } = useVoip();
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  // Fetch calls with extended data (transcript, sentiment)
  const { data: detailedCalls = [], isLoading } = useQuery({
    queryKey: ['voip-calls-detailed', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('calls')
        .select('*, contacts(first_name, last_name, email)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Calculate metrics
  const totalCalls = detailedCalls.length;
  const completedCalls = detailedCalls.filter((c: any) => c.status === 'completed').length;
  const missedCalls = detailedCalls.filter((c: any) => c.status === 'missed').length;
  const totalDuration = detailedCalls.reduce((sum: number, c: any) => sum + (c.duration_seconds || 0), 0);
  const avgDuration = completedCalls > 0 ? Math.round(totalDuration / completedCalls) : 0;
  const transcribedCalls = detailedCalls.filter((c: any) => c.transcript).length;

  // Sentiment breakdown from metadata
  const sentimentCounts = detailedCalls.reduce((acc: any, c: any) => {
    const sentiment = c.metadata?.sentiment;
    if (sentiment) acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sentimentData = [
    { name: 'Positivo', value: sentimentCounts.positive || 0, color: SENTIMENT_COLORS.positive },
    { name: 'Neutro', value: sentimentCounts.neutral || 0, color: SENTIMENT_COLORS.neutral },
    { name: 'Negativo', value: sentimentCounts.negative || 0, color: SENTIMENT_COLORS.negative },
  ].filter((d) => d.value > 0);

  // Calls per day (last 30 days)
  const callsByDay = detailedCalls.reduce((acc: any, c: any) => {
    const day = format(new Date(c.created_at), 'dd/MM');
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dailyData = Object.entries(callsByDay)
    .slice(0, 14)
    .reverse()
    .map(([day, count]) => ({ day, chamadas: count }));

  // Agent performance
  const agentStats = detailedCalls.reduce((acc: any, c: any) => {
    const userId = c.user_id;
    if (!acc[userId]) {
      acc[userId] = { user_id: userId, total: 0, completed: 0, totalDuration: 0, positive: 0 };
    }
    acc[userId].total++;
    if (c.status === 'completed') acc[userId].completed++;
    acc[userId].totalDuration += c.duration_seconds || 0;
    if (c.metadata?.sentiment === 'positive') acc[userId].positive++;
    return acc;
  }, {} as Record<string, any>);

  const agentPerformance = Object.values(agentStats) as any[];

  const formatMinutes = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Phone className="h-3.5 w-3.5" /> Total
            </div>
            <p className="text-2xl font-bold">{totalCalls}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <PhoneCall className="h-3.5 w-3.5" /> Concluídas
            </div>
            <p className="text-2xl font-bold text-green-600">{completedCalls}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingDown className="h-3.5 w-3.5" /> Perdidas
            </div>
            <p className="text-2xl font-bold text-red-500">{missedCalls}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-3.5 w-3.5" /> Duração Média
            </div>
            <p className="text-2xl font-bold">{formatMinutes(avgDuration)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <FileText className="h-3.5 w-3.5" /> Transcritas
            </div>
            <p className="text-2xl font-bold">{transcribedCalls}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Brain className="h-3.5 w-3.5" /> Com Sentimento
            </div>
            <p className="text-2xl font-bold">{sentimentData.reduce((s, d) => s + d.value, 0)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sentiment">Sentimento IA</TabsTrigger>
          <TabsTrigger value="agents">Performance Agentes</TabsTrigger>
          <TabsTrigger value="transcriptions">Transcrições</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chamadas por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="chamadas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma chamada registrada ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sentiment */}
        <TabsContent value="sentiment">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição de Sentimento</CardTitle>
                <CardDescription>Análise automática via IA das chamadas gravadas</CardDescription>
              </CardHeader>
              <CardContent>
                {sentimentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={sentimentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {sentimentData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma análise de sentimento disponível</p>
                    <p className="text-xs mt-1">As chamadas precisam ser gravadas e transcritas primeiro</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chamadas Recentes com Sentimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {detailedCalls
                    .filter((c: any) => c.metadata?.sentiment)
                    .slice(0, 8)
                    .map((call: any) => (
                      <div key={call.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {call.metadata.sentiment === 'positive' && <SmilePlus className="h-4 w-4 text-green-500" />}
                          {call.metadata.sentiment === 'neutral' && <Meh className="h-4 w-4 text-yellow-500" />}
                          {call.metadata.sentiment === 'negative' && <Frown className="h-4 w-4 text-red-500" />}
                          <span className="font-mono">{call.phone_number}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {format(new Date(call.created_at), 'dd/MM HH:mm')}
                        </span>
                      </div>
                    ))}
                  {detailedCalls.filter((c: any) => c.metadata?.sentiment).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma análise disponível</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Agent Performance */}
        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance por Agente</CardTitle>
              <CardDescription>Métricas de chamadas por membro da equipe</CardDescription>
            </CardHeader>
            <CardContent>
              {agentPerformance.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agente</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Concluídas</TableHead>
                      <TableHead className="text-center">Taxa Sucesso</TableHead>
                      <TableHead className="text-center">Tempo Total</TableHead>
                      <TableHead className="text-center">Sentimento +</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentPerformance.map((agent: any) => (
                      <TableRow key={agent.user_id}>
                        <TableCell className="font-mono text-xs">{agent.user_id.slice(0, 8)}...</TableCell>
                        <TableCell className="text-center">{agent.total}</TableCell>
                        <TableCell className="text-center">{agent.completed}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={agent.completed / agent.total > 0.8 ? 'default' : 'secondary'}>
                            {Math.round((agent.completed / agent.total) * 100)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{formatMinutes(agent.totalDuration)}</TableCell>
                        <TableCell className="text-center">
                          {agent.positive > 0 && (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                              {agent.positive}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum dado de performance disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transcriptions */}
        <TabsContent value="transcriptions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transcrições de Chamadas</CardTitle>
              <CardDescription>Chamadas gravadas e transcritas automaticamente via IA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {detailedCalls
                  .filter((c: any) => c.transcript)
                  .slice(0, 10)
                  .map((call: any) => (
                    <Card key={call.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-primary" />
                            <span className="font-mono text-sm">{call.phone_number}</span>
                            {call.contacts && (
                              <Badge variant="outline" className="text-xs">
                                {call.contacts.first_name} {call.contacts.last_name || ''}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {call.metadata?.sentiment && (
                              <Badge
                                className={
                                  call.metadata.sentiment === 'positive'
                                    ? 'bg-green-500/10 text-green-600'
                                    : call.metadata.sentiment === 'negative'
                                      ? 'bg-red-500/10 text-red-600'
                                      : 'bg-yellow-500/10 text-yellow-600'
                                }
                              >
                                {call.metadata.sentiment === 'positive' ? '😊 Positivo'
                                  : call.metadata.sentiment === 'negative' ? '😔 Negativo'
                                    : '😐 Neutro'}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(call.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {call.transcript}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                {detailedCalls.filter((c: any) => c.transcript).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma transcrição disponível</p>
                    <p className="text-xs mt-1">
                      Configure o provedor VoIP e habilite gravação + transcrição automática no painel admin
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
