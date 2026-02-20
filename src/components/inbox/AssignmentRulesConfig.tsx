import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAssignmentRules, type AssignmentStrategy } from '@/hooks/useAssignmentRules';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { Plus, Trash2, Users, RotateCw, UserCheck, Hand } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const strategyLabels: Record<AssignmentStrategy, { label: string; description: string; icon: typeof RotateCw }> = {
  round_robin: { label: 'Round Robin', description: 'Distribui conversas igualmente entre os agentes', icon: RotateCw },
  least_busy: { label: 'Menos Ocupado', description: 'Atribui ao agente com menos conversas ativas', icon: UserCheck },
  manual: { label: 'Manual', description: 'Apenas atribuição manual por administradores', icon: Hand },
};

const channelOptions = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'email', label: 'E-mail' },
  { id: 'instagram', label: 'Instagram' },
];

export function AssignmentRulesConfig() {
  const { rules, isLoading, createRule, updateRule, deleteRule } = useAssignmentRules();
  const { members } = useOrganizationMembers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    strategy: 'round_robin' as AssignmentStrategy,
    channels: [] as string[],
    eligible_members: [] as string[],
    max_concurrent: 10,
  });

  const handleCreate = () => {
    createRule.mutate(newRule, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setNewRule({ name: '', strategy: 'round_robin', channels: [], eligible_members: [], max_concurrent: 10 });
      },
    });
  };

  const toggleChannel = (channel: string) => {
    setNewRule(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const toggleMember = (userId: string) => {
    setNewRule(prev => ({
      ...prev,
      eligible_members: prev.eligible_members.includes(userId)
        ? prev.eligible_members.filter(m => m !== userId)
        : [...prev.eligible_members, userId],
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Regras de Atribuição Automática</h3>
          <p className="text-sm text-muted-foreground">
            Configure como as conversas são distribuídas entre os atendentes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Regra de Atribuição</DialogTitle>
              <DialogDescription>Configure como as conversas serão distribuídas automaticamente.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da Regra</Label>
                <Input
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Atribuição WhatsApp"
                />
              </div>

              <div className="space-y-2">
                <Label>Estratégia</Label>
                <Select
                  value={newRule.strategy}
                  onValueChange={(v) => setNewRule(prev => ({ ...prev, strategy: v as AssignmentStrategy }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(strategyLabels).map(([key, { label, description }]) => (
                      <SelectItem key={key} value={key}>
                        <div>
                          <div className="font-medium">{label}</div>
                          <div className="text-xs text-muted-foreground">{description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Canais</Label>
                <div className="flex gap-3">
                  {channelOptions.map(ch => (
                    <label key={ch.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={newRule.channels.includes(ch.id)}
                        onCheckedChange={() => toggleChannel(ch.id)}
                      />
                      <span className="text-sm">{ch.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Máx. Conversas Simultâneas por Agente</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={newRule.max_concurrent}
                  onChange={(e) => setNewRule(prev => ({ ...prev, max_concurrent: parseInt(e.target.value) || 10 }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Atendentes Elegíveis</Label>
                <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-3">
                  {members.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum membro encontrado</p>
                  ) : (
                    members.map(member => (
                      <label key={member.user_id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={newRule.eligible_members.includes(member.user_id)}
                          onCheckedChange={() => toggleMember(member.user_id)}
                        />
                        <span className="text-sm">
                          {member.profiles?.full_name || member.user_id.slice(0, 8)}
                        </span>
                        <Badge variant="outline" className="text-xs">{member.role}</Badge>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={!newRule.name || createRule.isPending}>
                Criar Regra
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma regra de atribuição configurada</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crie uma regra para distribuir conversas automaticamente
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map(rule => {
            const strategy = strategyLabels[rule.strategy as AssignmentStrategy] || strategyLabels.manual;
            const StrategyIcon = strategy.icon;

            return (
              <Card key={rule.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <StrategyIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{rule.name}</CardTitle>
                        <CardDescription>{strategy.label} • Máx. {rule.max_concurrent} conversas</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => updateRule.mutate({ id: rule.id, is_active: checked })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRule.mutate(rule.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {rule.channels.map(ch => (
                      <Badge key={ch} variant="secondary">{ch}</Badge>
                    ))}
                    <Badge variant="outline">
                      {rule.eligible_members.length} atendente(s)
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
