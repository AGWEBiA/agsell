import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { toast } from 'sonner';
import { Plus, Route, Trash2, Users, Shuffle, BarChart3 } from 'lucide-react';

export default function SalesRouting() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const queryClient = useQueryClient();
  const { members } = useOrganizationMembers();
  const [showCreate, setShowCreate] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', strategy: 'round_robin' });

  const { data: rules = [] } = useQuery({
    queryKey: ['sales-routing', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_routing_rules')
        .select('*')
        .eq('organization_id', orgId!)
        .order('priority', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!orgId,
  });

  const createRule = useMutation({
    mutationFn: async (rule: any) => {
      const { data, error } = await supabase
        .from('sales_routing_rules')
        .insert({ ...rule, organization_id: orgId } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-routing'] });
      toast.success('Regra criada!');
      setShowCreate(false);
      setNewRule({ name: '', strategy: 'round_robin' });
    },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('sales_routing_rules').update({ is_active } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales-routing'] }),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sales_routing_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-routing'] });
      toast.success('Regra excluída!');
    },
  });

  const strategies = [
    { value: 'round_robin', label: 'Round Robin', desc: 'Distribui igualmente entre os vendedores' },
    { value: 'least_busy', label: 'Menos Ocupado', desc: 'Prioriza quem tem menos deals ativos' },
    { value: 'territory', label: 'Território', desc: 'Atribui por região/estado do lead' },
    { value: 'value_based', label: 'Por Valor', desc: 'Deals de alto valor para vendedores seniores' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Routing</h1>
          <p className="text-muted-foreground">Distribua leads e negócios automaticamente para sua equipe de vendas</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nova Regra</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Regra de Roteamento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Nome da Regra</label>
                <Input value={newRule.name} onChange={e => setNewRule(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Distribuição Equipe Vendas" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Estratégia</label>
                <Select value={newRule.strategy} onValueChange={v => setNewRule(p => ({ ...p, strategy: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {strategies.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        <div>
                          <p className="font-medium">{s.label}</p>
                          <p className="text-xs text-muted-foreground">{s.desc}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => createRule.mutate(newRule)} disabled={!newRule.name || createRule.isPending} className="w-full">
                Criar Regra
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {strategies.map(s => (
          <Card key={s.value}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Shuffle className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">{s.label}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Route className="h-5 w-5" /> Regras Ativas</CardTitle>
          <CardDescription>Configure como leads e negócios são distribuídos automaticamente</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Estratégia</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map(rule => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium text-foreground">{rule.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{strategies.find(s => s.value === rule.strategy)?.label || rule.strategy}</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch checked={rule.is_active} onCheckedChange={(v) => toggleRule.mutate({ id: rule.id, is_active: v })} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{rule.priority}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteRule.mutate(rule.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma regra de roteamento configurada. Crie uma para começar a distribuir leads automaticamente.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
