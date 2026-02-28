import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Crown } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AssignPlanDialogProps {
  organization: { id: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignPlanDialog({ organization, open, onOpenChange }: AssignPlanDialogProps) {
  const queryClient = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const { data: plans = [] } = useQuery({
    queryKey: ['admin_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, slug, price_monthly')
        .order('price_monthly', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const assignPlanMutation = useMutation({
    mutationFn: async () => {
      if (!organization || !selectedPlanId) throw new Error('Dados incompletos');

      // Update organization plan_id
      const { error: orgError } = await supabase
        .from('organizations')
        .update({ plan_id: selectedPlanId })
        .eq('id', organization.id);
      if (orgError) throw orgError;

      // Check existing subscription
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('organization_id', organization.id)
        .maybeSingle();

      const periodDays = billingCycle === 'yearly' ? 365 : 30;
      const subData = {
        organization_id: organization.id,
        plan_id: selectedPlanId,
        status: 'active' as const,
        billing_cycle: billingCycle,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString(),
      };

      if (existingSub) {
        const { error } = await supabase
          .from('subscriptions')
          .update(subData)
          .eq('id', existingSub.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subscriptions')
          .insert(subData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_organizations'] });
      queryClient.invalidateQueries({ queryKey: ['admin_plan_distribution'] });
      queryClient.invalidateQueries({ queryKey: ['admin_org_plans'] });
      const planName = plans.find(p => p.id === selectedPlanId)?.name || 'Plano';
      toast.success(`${planName} atribuído a "${organization?.name}" com sucesso!`);
      onOpenChange(false);
      setSelectedPlanId('');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Atribuir Plano Gratuito
          </DialogTitle>
          <DialogDescription>
            Atribua um plano a <strong>{organization?.name}</strong> sem gerar cobrança.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Plano</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger><SelectValue placeholder="Selecione o plano" /></SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.price_monthly > 0 ? `(R$ ${p.price_monthly}/mês)` : '(Grátis)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ciclo</Label>
            <Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as 'monthly' | 'yearly')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensal (30 dias)</SelectItem>
                <SelectItem value="yearly">Anual (365 dias)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => assignPlanMutation.mutate()} disabled={!selectedPlanId || assignPlanMutation.isPending}>
            {assignPlanMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Atribuir Plano
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
