import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  Mail,
  MousePointerClick,
  Eye,
  FileText,
  MessageSquare,
  Globe,
  Tag,
  DollarSign,
  Plus,
  Trash2,
} from 'lucide-react';
import { useLeadScoring } from '@/hooks/useLeadScoring';
import { PredictiveScoringDashboard } from '@/components/lead-scoring/PredictiveScoringDashboard';

const eventTypes = [
  { value: 'email_opened', label: 'Email Aberto', icon: Eye },
  { value: 'email_clicked', label: 'Email Clicado', icon: MousePointerClick },
  { value: 'form_submitted', label: 'Formulário Submetido', icon: FileText },
  { value: 'whatsapp_received', label: 'WhatsApp Respondido', icon: MessageSquare },
  { value: 'page_visited', label: 'Página Visitada', icon: Globe },
  { value: 'tag_added', label: 'Tag Aplicada', icon: Tag },
  { value: 'purchase', label: 'Compra Realizada', icon: DollarSign },
];

export default function LeadScoring() {
  const { rules, segments, topLeads, isLoading, createRule, updateRule, toggleRule, deleteRule } = useLeadScoring();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    event_type: '',
    points: 10,
  });

  const handleCreate = () => {
    if (!newRule.name || !newRule.event_type) return;
    createRule.mutate({
      name: newRule.name,
      event_type: newRule.event_type,
      points: newRule.points,
      is_active: true,
    });
    setNewRule({ name: '', event_type: '', points: 10 });
    setIsDialogOpen(false);
  };

  const handlePointsChange = (ruleId: string, points: number) => {
    updateRule.mutate({ id: ruleId, points });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lead Scoring</h1>
          <p className="text-muted-foreground">Configure regras de pontuação e scoring preditivo com IA</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Regra de Pontuação</DialogTitle>
              <DialogDescription>
                Defina uma nova regra para pontuar seus leads automaticamente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Regra</Label>
                <Input
                  id="name"
                  placeholder="Ex: Email Aberto"
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event">Evento</Label>
                <Select
                  value={newRule.event_type}
                  onValueChange={(value) => setNewRule(prev => ({ ...prev, event_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(e => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="points">Pontos</Label>
                <Input
                  id="points"
                  type="number"
                  value={newRule.points}
                  onChange={(e) => setNewRule(prev => ({ ...prev, points: Number(e.target.value) }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createRule.isPending}>
                {createRule.isPending ? 'Criando...' : 'Criar Regra'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList>
          <TabsTrigger value="rules">Regras Manuais</TabsTrigger>
          <TabsTrigger value="predictive">🧠 Scoring Preditivo (IA)</TabsTrigger>
        </TabsList>
        <TabsContent value="rules" className="space-y-6">

      {/* Segments Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold">{segments.cold}</p>
                <p className="text-sm text-muted-foreground">Leads Frios</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Score: 0-30</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold">{segments.warm}</p>
                <p className="text-sm text-muted-foreground">Leads Mornos</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Score: 31-70</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold">{segments.hot}</p>
                <p className="text-sm text-muted-foreground">Leads Quentes</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Score: 71-100</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Scoring Rules */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Regras de Pontuação</CardTitle>
                <CardDescription>
                  Defina quantos pontos cada ação adiciona ao score do lead
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma regra criada ainda</p>
                  <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Regra
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {rules.map((rule) => {
                    const eventConfig = eventTypes.find(e => e.value === rule.event_type);
                    const Icon = eventConfig?.icon || Target;
                    return (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            rule.is_active ? 'bg-primary/10' : 'bg-muted'
                          }`}>
                            <Icon className={`h-5 w-5 ${rule.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <p className="font-medium">{rule.name}</p>
                            <p className="text-sm text-muted-foreground">{eventConfig?.label || rule.event_type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`points-${rule.id}`} className="text-sm text-muted-foreground">
                              Pontos:
                            </Label>
                            <Input
                              id={`points-${rule.id}`}
                              type="number"
                              value={rule.points}
                              className="w-20"
                              disabled={!rule.is_active}
                              onChange={(e) => handlePointsChange(rule.id, Number(e.target.value))}
                            />
                          </div>
                          <Switch
                            checked={rule.is_active ?? false}
                            onCheckedChange={(checked) => toggleRule.mutate({ id: rule.id, isActive: checked })}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => deleteRule.mutate(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Top Leads</CardTitle>
            <CardDescription>Leads com maior pontuação</CardDescription>
          </CardHeader>
          <CardContent>
            {topLeads.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">Nenhum lead com score ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topLeads.map((lead, index) => (
                  <div key={lead.id} className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{lead.first_name} {lead.last_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(lead.companies as any)?.name || 'Sem empresa'}
                      </p>
                    </div>
                    <Badge
                      className={(lead.lead_score ?? 0) >= 80 ? 'bg-red-500' : (lead.lead_score ?? 0) >= 50 ? 'bg-yellow-500' : 'bg-blue-500'}
                    >
                      {lead.lead_score ?? 0}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </TabsContent>
        <TabsContent value="predictive">
          <PredictiveScoringDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
