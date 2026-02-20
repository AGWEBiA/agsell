import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCsat } from '@/hooks/useCsat';
import { Plus, Trash2, Star, TrendingUp, MessageSquareHeart, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

const channelOptions = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'email', label: 'E-mail' },
  { id: 'instagram', label: 'Instagram' },
];

export function CsatConfig() {
  const {
    surveys, responses, isLoading,
    averageRating, satisfactionRate, totalResponses,
    createSurvey, updateSurvey, deleteSurvey,
  } = useCsat();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSurvey, setNewSurvey] = useState({
    name: 'Pesquisa de Satisfação',
    question: 'Como você avalia o atendimento?',
    auto_send: true,
    channels: ['whatsapp', 'email'] as string[],
  });

  const handleCreate = () => {
    createSurvey.mutate(newSurvey, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setNewSurvey({ name: 'Pesquisa de Satisfação', question: 'Como você avalia o atendimento?', auto_send: true, channels: ['whatsapp', 'email'] });
      },
    });
  };

  const toggleChannel = (channel: string) => {
    setNewSurvey(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  // Rating distribution
  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: responses.filter(r => r.rating === rating).length,
    percentage: totalResponses > 0 ? (responses.filter(r => r.rating === rating).length / totalResponses) * 100 : 0,
  }));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CSAT Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Nota Média</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <span className="text-3xl font-bold">{averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">/5</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taxa de Satisfação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-3xl font-bold">{satisfactionRate.toFixed(0)}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Notas 4 e 5</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Respostas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="text-3xl font-bold">{totalResponses}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      {totalResponses > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição das Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ratingDistribution.reverse().map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium">{rating}</span>
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-16 text-right">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Surveys Management */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pesquisas CSAT</h3>
          <p className="text-sm text-muted-foreground">
            Configure as pesquisas de satisfação enviadas após o atendimento
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Pesquisa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Pesquisa CSAT</DialogTitle>
              <DialogDescription>Configure uma pesquisa de satisfação pós-atendimento.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={newSurvey.name}
                  onChange={(e) => setNewSurvey(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Pergunta</Label>
                <Textarea
                  value={newSurvey.question}
                  onChange={(e) => setNewSurvey(prev => ({ ...prev, question: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={newSurvey.auto_send}
                  onCheckedChange={(checked) => setNewSurvey(prev => ({ ...prev, auto_send: checked }))}
                />
                <Label>Enviar automaticamente ao fechar conversa</Label>
              </div>
              <div className="space-y-2">
                <Label>Canais</Label>
                <div className="flex gap-3">
                  {channelOptions.map(ch => (
                    <label key={ch.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={newSurvey.channels.includes(ch.id)}
                        onCheckedChange={() => toggleChannel(ch.id)}
                      />
                      <span className="text-sm">{ch.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={!newSurvey.name || createSurvey.isPending}>
                Criar Pesquisa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {surveys.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquareHeart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma pesquisa configurada</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crie uma pesquisa para avaliar a satisfação dos clientes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {surveys.map(survey => (
            <Card key={survey.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{survey.name}</CardTitle>
                    <CardDescription className="mt-1">"{survey.question}"</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={survey.is_active}
                      onCheckedChange={(checked) => updateSurvey.mutate({ id: survey.id, is_active: checked })}
                    />
                    <Button variant="ghost" size="icon" onClick={() => deleteSurvey.mutate(survey.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {survey.channels.map(ch => (
                    <Badge key={ch} variant="secondary">{ch}</Badge>
                  ))}
                  {survey.auto_send && (
                    <Badge variant="outline">Envio automático</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
