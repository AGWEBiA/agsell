import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Star, Check } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_contacts: number;
  max_emails_per_month: number;
  max_whatsapp_messages: number;
  max_automations: number;
  max_forms: number;
  features: string[];
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

interface PlanFormData {
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_contacts: number;
  max_emails_per_month: number;
  max_whatsapp_messages: number;
  max_automations: number;
  max_forms: number;
  features: string;
  is_active: boolean;
  is_default: boolean;
}

const defaultFormData: PlanFormData = {
  name: '',
  slug: '',
  description: '',
  price_monthly: 0,
  price_yearly: 0,
  max_users: 1,
  max_contacts: 100,
  max_emails_per_month: 500,
  max_whatsapp_messages: 100,
  max_automations: 5,
  max_forms: 3,
  features: '',
  is_active: true,
  is_default: false,
};

export function PlansManagement() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(defaultFormData);

  // Fetch all plans (including inactive for admin)
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['admin_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      return data as Plan[];
    },
  });

  // Create plan mutation
  const createPlan = useMutation({
    mutationFn: async (data: PlanFormData) => {
      const features = data.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const { error } = await supabase.from('plans').insert({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        price_monthly: data.price_monthly,
        price_yearly: data.price_yearly,
        max_users: data.max_users,
        max_contacts: data.max_contacts,
        max_emails_per_month: data.max_emails_per_month,
        max_whatsapp_messages: data.max_whatsapp_messages,
        max_automations: data.max_automations,
        max_forms: data.max_forms,
        features: features,
        is_active: data.is_active,
        is_default: data.is_default,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_plans'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Plano criado com sucesso!');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error('Erro ao criar plano: ' + error.message);
    },
  });

  // Update plan mutation
  const updatePlan = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PlanFormData }) => {
      const features = data.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const { error } = await supabase
        .from('plans')
        .update({
          name: data.name,
          slug: data.slug,
          description: data.description || null,
          price_monthly: data.price_monthly,
          price_yearly: data.price_yearly,
          max_users: data.max_users,
          max_contacts: data.max_contacts,
          max_emails_per_month: data.max_emails_per_month,
          max_whatsapp_messages: data.max_whatsapp_messages,
          max_automations: data.max_automations,
          max_forms: data.max_forms,
          features: features,
          is_active: data.is_active,
          is_default: data.is_default,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_plans'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Plano atualizado com sucesso!');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error('Erro ao atualizar plano: ' + error.message);
    },
  });

  // Delete plan mutation
  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_plans'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Plano removido com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover plano: ' + error.message);
    },
  });

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      max_users: plan.max_users,
      max_contacts: plan.max_contacts,
      max_emails_per_month: plan.max_emails_per_month,
      max_whatsapp_messages: plan.max_whatsapp_messages,
      max_automations: plan.max_automations,
      max_forms: plan.max_forms,
      features: (plan.features || []).join('\n'),
      is_active: plan.is_active,
      is_default: plan.is_default,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPlan(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug) {
      toast.error('Nome e slug são obrigatórios');
      return;
    }

    if (editingPlan) {
      updatePlan.mutate({ id: editingPlan.id, data: formData });
    } else {
      createPlan.mutate(formData);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatLimit = (value: number) => {
    if (value === -1) return 'Ilimitado';
    return value.toLocaleString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciar Planos</CardTitle>
          <CardDescription>
            Configure os planos disponíveis para assinatura
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}
                </DialogTitle>
                <DialogDescription>
                  {editingPlan
                    ? 'Atualize as informações do plano'
                    : 'Preencha as informações do novo plano'}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Ex: Professional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                        })
                      }
                      placeholder="Ex: professional"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Descrição do plano..."
                    rows={2}
                  />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price_monthly">Preço Mensal (R$)</Label>
                    <Input
                      id="price_monthly"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price_monthly}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          price_monthly: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price_yearly">Preço Anual (R$)</Label>
                    <Input
                      id="price_yearly"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price_yearly}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          price_yearly: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Limits */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Limites (-1 = ilimitado)</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="max_users" className="text-xs text-muted-foreground">
                        Usuários
                      </Label>
                      <Input
                        id="max_users"
                        type="number"
                        min="-1"
                        value={formData.max_users}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            max_users: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="max_contacts" className="text-xs text-muted-foreground">
                        Contatos
                      </Label>
                      <Input
                        id="max_contacts"
                        type="number"
                        min="-1"
                        value={formData.max_contacts}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            max_contacts: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="max_emails_per_month" className="text-xs text-muted-foreground">
                        E-mails/mês
                      </Label>
                      <Input
                        id="max_emails_per_month"
                        type="number"
                        min="-1"
                        value={formData.max_emails_per_month}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            max_emails_per_month: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="max_whatsapp_messages" className="text-xs text-muted-foreground">
                        WhatsApp msgs
                      </Label>
                      <Input
                        id="max_whatsapp_messages"
                        type="number"
                        min="-1"
                        value={formData.max_whatsapp_messages}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            max_whatsapp_messages: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="max_automations" className="text-xs text-muted-foreground">
                        Automações
                      </Label>
                      <Input
                        id="max_automations"
                        type="number"
                        min="-1"
                        value={formData.max_automations}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            max_automations: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="max_forms" className="text-xs text-muted-foreground">
                        Formulários
                      </Label>
                      <Input
                        id="max_forms"
                        type="number"
                        min="-1"
                        value={formData.max_forms}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            max_forms: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <Label htmlFor="features">
                    Features (uma por linha)
                  </Label>
                  <Textarea
                    id="features"
                    value={formData.features}
                    onChange={e =>
                      setFormData({ ...formData, features: e.target.value })
                    }
                    placeholder="Suporte por e-mail&#10;Dashboard avançado&#10;Relatórios personalizados"
                    rows={4}
                  />
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={checked =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">Ativo</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_default"
                      checked={formData.is_default}
                      onCheckedChange={checked =>
                        setFormData({ ...formData, is_default: checked })
                      }
                    />
                    <Label htmlFor="is_default">Plano padrão (Free)</Label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createPlan.isPending || updatePlan.isPending}
                >
                  {editingPlan ? 'Atualizar' : 'Criar'} Plano
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plano</TableHead>
              <TableHead>Preço Mensal</TableHead>
              <TableHead>Limites</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map(plan => (
              <TableRow key={plan.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {plan.name}
                        {plan.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Padrão
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{plan.slug}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{formatCurrency(plan.price_monthly)}</div>
                    <div className="text-xs text-muted-foreground">
                      Anual: {formatCurrency(plan.price_yearly)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs space-y-0.5">
                    <div>{formatLimit(plan.max_users)} usuários</div>
                    <div>{formatLimit(plan.max_contacts)} contatos</div>
                    <div>{formatLimit(plan.max_automations)} automações</div>
                  </div>
                </TableCell>
                <TableCell>
                  {plan.is_active ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <Check className="h-3 w-3 mr-1" />
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(plan)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Plano</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o plano "{plan.name}"? Esta ação
                            não pode ser desfeita e afetará organizações que usam este plano.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deletePlan.mutate(plan.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {plans.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum plano cadastrado. Clique em "Novo Plano" para criar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
