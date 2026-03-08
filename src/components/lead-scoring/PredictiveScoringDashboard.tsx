import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, RefreshCw, TrendingUp, Zap, Target, AlertTriangle } from 'lucide-react';
import { usePredictiveScores, useCalculateAllPredictiveScores } from '@/hooks/usePredictiveScoring';

export function PredictiveScoringDashboard() {
  const { data: scores, isLoading } = usePredictiveScores();
  const calculateAll = useCalculateAllPredictiveScores();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  const highScores = scores?.filter((s: any) => s.predicted_score >= 70) ?? [];
  const mediumScores = scores?.filter((s: any) => s.predicted_score >= 40 && s.predicted_score < 70) ?? [];
  const lowScores = scores?.filter((s: any) => s.predicted_score < 40) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Scoring Preditivo com IA</h3>
            <p className="text-sm text-muted-foreground">Análise comportamental automática dos seus leads</p>
          </div>
        </div>
        <Button
          onClick={() => calculateAll.mutate()}
          disabled={calculateAll.isPending}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${calculateAll.isPending ? 'animate-spin' : ''}`} />
          {calculateAll.isPending ? 'Calculando...' : 'Recalcular Todos'}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{highScores.length}</p>
                <p className="text-sm text-muted-foreground">Alta probabilidade</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-600">{mediumScores.length}</p>
                <p className="text-sm text-muted-foreground">Probabilidade média</p>
              </div>
              <Target className="h-8 w-8 text-amber-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{lowScores.length}</p>
                <p className="text-sm text-muted-foreground">Baixa probabilidade</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top predicted leads */}
      {scores && scores.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Leads por Score Preditivo</CardTitle>
            <CardDescription>Contatos com maior probabilidade de conversão segundo a IA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scores.slice(0, 15).map((score: any) => {
                const contact = score.contacts;
                const factors = (score.factors || []) as Array<{ name: string; impact: number; description: string }>;
                return (
                  <div key={score.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {contact?.first_name} {contact?.last_name || ''}
                        </p>
                        <Badge variant={score.predicted_score >= 70 ? 'default' : score.predicted_score >= 40 ? 'secondary' : 'outline'}>
                          {score.predicted_score}pts
                        </Badge>
                      </div>
                      {contact?.email && (
                        <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                      )}
                      {factors.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {factors.slice(0, 3).map((f, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] px-1.5">
                              {f.impact > 0 ? '↑' : '↓'} {f.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="w-24 shrink-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Confiança</span>
                        <span>{Math.round(score.confidence * 100)}%</span>
                      </div>
                      <Progress value={score.confidence * 100} className="h-1.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Brain className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
              <h4 className="font-medium mb-1">Nenhum score preditivo calculado</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Clique em "Recalcular Todos" para que a IA analise o comportamento dos seus contatos
              </p>
              <Button onClick={() => calculateAll.mutate()} disabled={calculateAll.isPending}>
                <Zap className="h-4 w-4 mr-2" />
                Calcular Scores
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
