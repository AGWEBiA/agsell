import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  FileText,
  Zap,
  Trash2,
  BarChart3,
  Clock,
  AlertCircle,
  Eye,
  ListChecks,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { useWhatsAppFlows, useCreateWhatsAppFlow, useUpdateWhatsAppFlow, useDeleteWhatsAppFlow, type FlowField } from '@/hooks/useWhatsAppFlows';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fieldTypes = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'select', label: 'Seleção' },
  { value: 'date', label: 'Data' },
];

export default function WhatsAppFlowsPage() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { data: flows, isLoading } = useWhatsAppFlows();
  const createFlow = useCreateWhatsAppFlow();
  const updateFlow = useUpdateWhatsAppFlow();
  const deleteFlow = useDeleteWhatsAppFlow();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFlow, setNewFlow] = useState({
    name: '',
    description: '',
    trigger_keywords: '',
    collect_as_contact: true,
    fields: [{ id: '1', type: 'text' as const, label: '', placeholder: '', required: true }] as FlowField[],
  });

  const addField = () => {
    setNewFlow(prev => ({
      ...prev,
      fields: [...prev.fields, { id: String(prev.fields.length + 1), type: 'text', label: '', placeholder: '', required: false }],
    }));
  };

  const updateField = (index: number, updates: Partial<FlowField>) => {
    setNewFlow(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? { ...f, ...updates } : f),
    }));
  };

  const removeField = (index: number) => {
    setNewFlow(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const handleCreate = () => {
    if (!currentOrganization || !user) return;

    createFlow.mutate({
      organization_id: currentOrganization.id,
      name: newFlow.name,
      description: newFlow.description,
      trigger_keywords: newFlow.trigger_keywords.split(',').map(k => k.trim()).filter(Boolean),
      collect_as_contact: newFlow.collect_as_contact,
      flow_json: {
        screens: [{
          id: 'main',
          title: newFlow.name,
          fields: newFlow.fields.filter(f => f.label),
        }],
      },
      created_by: user.id,
    } as any, {
      onSuccess: () => {
        setShowCreateDialog(false);
        setNewFlow({
          name: '', description: '', trigger_keywords: '', collect_as_contact: true,
          fields: [{ id: '1', type: 'text', label: '', placeholder: '', required: true }],
        });
      },
    });
  };

  const activeFlows = flows?.filter(f => f.is_active).length || 0;
  const totalSubmissions = flows?.reduce((sum, f) => sum + (f.submissions_count || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ListChecks className="h-8 w-8 text-green-500" />
            WhatsApp Flows
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie formulários interativos para coletar dados via WhatsApp
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flows Ativos</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeFlows}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Flows</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flows?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Respostas Coletadas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="flows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="flows">Flows</TabsTrigger>
          <TabsTrigger value="submissions">Respostas</TabsTrigger>
        </TabsList>

        <TabsContent value="flows" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Formulários Interativos</h2>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Flow
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar WhatsApp Flow</DialogTitle>
                  <DialogDescription>
                    Configure um formulário interativo para coletar dados via WhatsApp.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome do Flow</Label>
                    <Input
                      value={newFlow.name}
                      onChange={e => setNewFlow(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Cadastro de Lead"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      value={newFlow.description}
                      onChange={e => setNewFlow(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição opcional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Palavras-chave de Ativação (separadas por vírgula)</Label>
                    <Input
                      value={newFlow.trigger_keywords}
                      onChange={e => setNewFlow(prev => ({ ...prev, trigger_keywords: e.target.value }))}
                      placeholder="Ex: cadastro, formulário, inscrição"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="collect_contact"
                      checked={newFlow.collect_as_contact}
                      onCheckedChange={(v) => setNewFlow(prev => ({ ...prev, collect_as_contact: !!v }))}
                    />
                    <Label htmlFor="collect_contact">Salvar respostas como contato no CRM</Label>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Campos do Formulário</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addField}>
                        <Plus className="h-3 w-3 mr-1" /> Adicionar Campo
                      </Button>
                    </div>
                    {newFlow.fields.map((field, index) => (
                      <Card key={index} className="p-3">
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Input
                                value={field.label}
                                onChange={e => updateField(index, { label: e.target.value })}
                                placeholder="Nome do campo"
                              />
                            </div>
                            <Select
                              value={field.type}
                              onValueChange={v => updateField(index, { type: v as FlowField['type'] })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {fieldTypes.map(t => (
                                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {newFlow.fields.length > 1 && (
                              <Button variant="ghost" size="icon" onClick={() => removeField(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <Input
                              value={field.placeholder || ''}
                              onChange={e => updateField(index, { placeholder: e.target.value })}
                              placeholder="Placeholder (opcional)"
                              className="flex-1"
                            />
                            <div className="flex items-center space-x-1">
                              <Checkbox
                                checked={field.required}
                                onCheckedChange={v => updateField(index, { required: !!v })}
                              />
                              <Label className="text-xs">Obrigatório</Label>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!newFlow.name || !newFlow.fields.some(f => f.label) || createFlow.isPending}
                  >
                    {createFlow.isPending ? 'Criando...' : 'Criar Flow'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : flows?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ListChecks className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum flow criado</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Crie seu primeiro formulário interativo para coletar dados via WhatsApp.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {flows?.map(flow => {
                const screens = (flow.flow_json as any)?.screens || [];
                const totalFields = screens.reduce((sum: number, s: any) => sum + (s.fields?.length || 0), 0);
                return (
                  <Card key={flow.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                          <ListChecks className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{flow.name}</h3>
                            <Badge variant={flow.is_active ? 'default' : 'secondary'}>
                              {flow.status === 'draft' ? 'Rascunho' : flow.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {totalFields} campos • {flow.submissions_count} respostas
                          </p>
                          {flow.trigger_keywords?.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {flow.trigger_keywords.map((kw, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={flow.is_active}
                          onCheckedChange={() => updateFlow.mutate({ id: flow.id, is_active: !flow.is_active } as any)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => deleteFlow.mutate(flow.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma resposta ainda</h3>
              <p className="text-muted-foreground">
                As respostas dos formulários aparecerão aqui quando seus flows começarem a receber submissões.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
