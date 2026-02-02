import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Plus,
  Zap,
  MoreHorizontal,
  Users,
  CheckCircle2,
  Trash2,
  Settings,
  Sparkles,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAutomations } from '@/hooks/useAutomations';
import { AutomationActionsEditor, Action } from '@/components/automations/AutomationActionsEditor';
import { AutomationTemplates, automationTemplates, type AutomationTemplate } from '@/components/automations/AutomationTemplates';
import type { Json } from '@/integrations/supabase/types';

const triggerTypes = [
  { value: 'form_submitted', label: 'Formulário Submetido' },
  { value: 'tag_added', label: 'Tag Adicionada' },
  { value: 'deal_stage_changed', label: 'Deal Mudou de Estágio' },
  { value: 'contact_created', label: 'Contato Criado' },
  { value: 'score_threshold', label: 'Score Atingiu Limite' },
  { value: 'email_opened', label: 'Email Aberto' },
  { value: 'email_clicked', label: 'Link Clicado no Email' },
  { value: 'whatsapp_received', label: 'WhatsApp Recebido' },
];

export default function Automations() {
  const { automations, isLoading, createAutomation, updateAutomation, toggleAutomation, deleteAutomation } = useAutomations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<typeof automations[0] | null>(null);
  const [newAutomation, setNewAutomation] = useState({
    name: '',
    trigger_type: '',
  });
  const [editActions, setEditActions] = useState<Action[]>([]);

  const handleCreate = () => {
    if (!newAutomation.name || !newAutomation.trigger_type) return;
    createAutomation.mutate({
      name: newAutomation.name,
      trigger_type: newAutomation.trigger_type,
      is_active: false,
      actions: [],
      trigger_config: {},
    });
    setNewAutomation({ name: '', trigger_type: '' });
    setIsDialogOpen(false);
  };

  const handleEdit = (automation: typeof automations[0]) => {
    setEditingAutomation(automation);
    setEditActions((automation.actions as Action[]) || []);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingAutomation) return;
    // Convert to Json-compatible format
    const actionsJson = editActions.map(action => ({
      id: action.id,
      type: action.type,
      config: action.config as Record<string, Json>,
    })) as Json;
    
    updateAutomation.mutate({
      id: editingAutomation.id,
      actions: actionsJson,
    });
    setIsEditDialogOpen(false);
    setEditingAutomation(null);
    setEditActions([]);
  };

  const handleSelectTemplate = (template: AutomationTemplate) => {
    // Convert template actions to Json-compatible format
    const actionsJson = template.actions.map(action => ({
      id: action.id,
      type: action.type,
      config: action.config as Record<string, Json>,
    })) as Json;

    createAutomation.mutate({
      name: template.name,
      trigger_type: template.trigger_type,
      trigger_config: template.trigger_config as Record<string, Json>,
      actions: actionsJson,
      is_active: false,
    });
    setIsTemplatesOpen(false);
  };

  const activeCount = automations.filter(a => a.is_active).length;
  const totalExecutions = automations.reduce((acc, a) => acc + (a.executions_count ?? 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-40" />
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
          <h1 className="text-3xl font-bold text-foreground">Automações</h1>
          <p className="text-muted-foreground">Construa fluxos automatizados para seus leads</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsTemplatesOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Automação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Automação</DialogTitle>
              <DialogDescription>
                Crie uma nova automação para processar seus leads automaticamente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Ex: Boas-vindas"
                  value={newAutomation.name}
                  onChange={(e) => setNewAutomation(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trigger">Gatilho</Label>
                <Select
                  value={newAutomation.trigger_type}
                  onValueChange={(value) => setNewAutomation(prev => ({ ...prev, trigger_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o gatilho" />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createAutomation.isPending}>
                {createAutomation.isPending ? 'Criando...' : 'Criar Automação'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Automações Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{automations.length}</p>
                <p className="text-sm text-muted-foreground">Total de Automações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalExecutions}</p>
                <p className="text-sm text-muted-foreground">Execuções Totais</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automations Grid */}
      {automations.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma automação criada ainda</p>
            <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Automação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {automations.map((automation) => {
            const triggerLabel = triggerTypes.find(t => t.value === automation.trigger_type)?.label || automation.trigger_type;
            const actionsCount = Array.isArray(automation.actions) ? automation.actions.length : 0;

            return (
              <Card key={automation.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        automation.is_active ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <Zap className={`h-5 w-5 ${automation.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{automation.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{triggerLabel}</p>
                      </div>
                    </div>
                    <Switch
                      checked={automation.is_active ?? false}
                      onCheckedChange={(checked) => toggleAutomation.mutate({ id: automation.id, isActive: checked })}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                        {automation.executions_count ?? 0} execuções
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Settings className="h-4 w-4" />
                        {actionsCount} ações
                      </div>
                    </div>
                    <Badge variant={automation.is_active ? 'default' : 'secondary'}>
                      {automation.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEdit(automation)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Configurar
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver estatísticas</DropdownMenuItem>
                        <DropdownMenuItem>Duplicar</DropdownMenuItem>
                        <DropdownMenuItem>Testar</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteAutomation.mutate(automation.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Automation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar Automação: {editingAutomation?.name}</DialogTitle>
            <DialogDescription>
              Configure as ações que serão executadas quando o gatilho for acionado.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <AutomationActionsEditor
              actions={editActions}
              onChange={setEditActions}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateAutomation.isPending}>
              {updateAutomation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Templates de Automação
            </DialogTitle>
            <DialogDescription>
              Escolha um template pronto para começar rapidamente
            </DialogDescription>
          </DialogHeader>
          <AutomationTemplates onSelectTemplate={handleSelectTemplate} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
