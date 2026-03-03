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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus, FileText, Eye, Users, Percent, MoreHorizontal, ExternalLink, Copy, Trash2, Pencil, List, Code, LayoutTemplate,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useForms } from '@/hooks/useForms';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Json } from '@/integrations/supabase/types';
import { FormFieldEditor, type FormField } from '@/components/forms/FormFieldEditor';
import { FormIntegrationDialog } from '@/components/forms/FormIntegrationDialog';
import { FormTemplates, DEFAULT_SETTINGS, type FormSettings, type FormTemplate } from '@/components/forms/FormTemplates';
import { FormStyleEditor } from '@/components/forms/FormStyleEditor';

export default function Forms() {
  const { forms, isLoading, createForm, updateForm, toggleForm, deleteForm, getFormSubmissions } = useForms();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createTab, setCreateTab] = useState<'templates' | 'blank'>('templates');
  const [newForm, setNewForm] = useState<{ name: string; description: string; fields: FormField[]; settings: FormSettings }>({
    name: '', description: '', fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
    ],
    settings: { ...DEFAULT_SETTINGS },
  });

  const [editingForm, setEditingForm] = useState<{ id: string; name: string; description: string; fields: FormField[]; settings: FormSettings } | null>(null);
  const [submissionsData, setSubmissionsData] = useState<{ formName: string; items: any[] } | null>(null);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [integrationForm, setIntegrationForm] = useState<{ id: string; name: string } | null>(null);

  const handleSelectTemplate = (template: FormTemplate) => {
    setNewForm({
      name: template.name,
      description: template.description,
      fields: [...template.fields],
      settings: { ...template.settings },
    });
    setCreateTab('blank'); // switch to editor to customize
  };

  const handleCreate = () => {
    if (!newForm.name) return;
    createForm.mutate({
      name: newForm.name,
      description: newForm.description || null,
      is_active: true,
      fields: newForm.fields as unknown as Json,
      settings: newForm.settings as unknown as Json,
    });
    setNewForm({
      name: '', description: '', fields: [
        { name: 'name', label: 'Nome', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
      ],
      settings: { ...DEFAULT_SETTINGS },
    });
    setIsCreateOpen(false);
    setCreateTab('templates');
  };

  const handleEdit = () => {
    if (!editingForm) return;
    updateForm.mutate({
      id: editingForm.id,
      name: editingForm.name,
      description: editingForm.description || null,
      fields: editingForm.fields as unknown as Json,
      settings: editingForm.settings as unknown as Json,
    });
    setEditingForm(null);
  };

  const handleViewSubmissions = async (formId: string, formName: string) => {
    setLoadingSubs(true);
    try {
      const items = await getFormSubmissions(formId);
      setSubmissionsData({ formName, items });
    } catch (e: any) {
      toast.error('Erro ao carregar submissões: ' + e.message);
    } finally {
      setLoadingSubs(false);
    }
  };

  const copyEmbedCode = (formId: string) => {
    const code = `<iframe src="${window.location.origin}/forms/${formId}" width="100%" height="400" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(code);
    toast.success('Código de embed copiado!');
  };

  const handlePreview = (formId: string) => {
    window.open(`${window.location.origin}/forms/${formId}`, '_blank');
  };

  const totalSubmissions = forms.reduce((acc, f) => acc + (f.submissions_count ?? 0), 0);

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
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Formulários</h1>
          <p className="text-muted-foreground">Crie formulários adaptáveis para qualquer página</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Formulário</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Formulário</DialogTitle>
              <DialogDescription>Escolha um modelo ou crie do zero com personalização completa.</DialogDescription>
            </DialogHeader>

            <Tabs value={createTab} onValueChange={(v) => setCreateTab(v as any)} className="mt-2">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="templates" className="gap-1.5">
                  <LayoutTemplate className="h-4 w-4" />Modelos Prontos
                </TabsTrigger>
                <TabsTrigger value="blank" className="gap-1.5">
                  <Pencil className="h-4 w-4" />Editor
                </TabsTrigger>
              </TabsList>

              <TabsContent value="templates" className="mt-4">
                <FormTemplates onSelect={handleSelectTemplate} />
              </TabsContent>

              <TabsContent value="blank" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" placeholder="Ex: Formulário de Contato" value={newForm.name} onChange={(e) => setNewForm(prev => ({ ...prev, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Input id="description" placeholder="Descreva o objetivo" value={newForm.description} onChange={(e) => setNewForm(prev => ({ ...prev, description: e.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <FormFieldEditor
                      fields={newForm.fields}
                      onChange={(fields) => setNewForm(prev => ({ ...prev, fields }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Aparência & Layout</Label>
                    <FormStyleEditor
                      settings={newForm.settings}
                      onChange={(settings) => setNewForm(prev => ({ ...prev, settings }))}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={createForm.isPending || !newForm.name}>
                {createForm.isPending ? 'Criando...' : 'Criar Formulário'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{forms.length}</p>
                <p className="text-sm text-muted-foreground">Formulários</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{forms.filter(f => f.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSubmissions}</p>
                <p className="text-sm text-muted-foreground">Submissões</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <Percent className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{forms.length > 0 ? Math.round(totalSubmissions / forms.length) : 0}</p>
                <p className="text-sm text-muted-foreground">Média/Form</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>Meus Formulários</CardTitle></CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum formulário criado ainda</p>
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />Criar Primeiro Formulário
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Formulário</TableHead>
                  <TableHead>Layout</TableHead>
                  <TableHead>Campos</TableHead>
                  <TableHead>Submissões</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => {
                  const fieldsCount = Array.isArray(form.fields) ? form.fields.length : 0;
                  const formSettings = form.settings as unknown as Partial<FormSettings> | null;
                  const layout = formSettings?.layout || 'single';
                  const layoutLabels: Record<string, string> = {
                    'single': 'Coluna única',
                    'two-columns': 'Duas colunas',
                    'multi-step': 'Multi-step',
                    'inline': 'Inline',
                  };
                  return (
                    <TableRow key={form.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{form.name}</p>
                            <p className="text-sm text-muted-foreground">{form.description || 'Sem descrição'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{layoutLabels[layout] || layout}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{fieldsCount} campos</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {form.submissions_count ?? 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={form.is_active ?? false}
                          onCheckedChange={(checked) => toggleForm.mutate({ id: form.id, isActive: checked })}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handlePreview(form.id)}>
                              <ExternalLink className="mr-2 h-4 w-4" />Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => copyEmbedCode(form.id)}>
                              <Copy className="mr-2 h-4 w-4" />Copiar embed
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIntegrationForm({ id: form.id, name: form.name }); }}>
                              <Code className="mr-2 h-4 w-4" />Integração avançada
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => {
                              e.preventDefault();
                              const formFields = Array.isArray(form.fields) ? (form.fields as unknown as FormField[]) : [];
                              const formSettings = form.settings ? { ...DEFAULT_SETTINGS, ...(form.settings as unknown as Partial<FormSettings>) } : { ...DEFAULT_SETTINGS };
                              setEditingForm({ id: form.id, name: form.name, description: form.description || '', fields: formFields, settings: formSettings });
                            }}>
                              <Pencil className="mr-2 h-4 w-4" />Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleViewSubmissions(form.id, form.name); }}>
                              <List className="mr-2 h-4 w-4" />Ver submissões
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onSelect={() => deleteForm.mutate(form.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingForm} onOpenChange={(open) => !open && setEditingForm(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Formulário</DialogTitle>
            <DialogDescription>Atualize campos, layout e aparência do formulário.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={editingForm?.name ?? ''} onChange={(e) => setEditingForm(prev => prev ? { ...prev, name: e.target.value } : null)} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={editingForm?.description ?? ''} onChange={(e) => setEditingForm(prev => prev ? { ...prev, description: e.target.value } : null)} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <FormFieldEditor
                  fields={editingForm?.fields ?? []}
                  onChange={(fields) => setEditingForm(prev => prev ? { ...prev, fields } : null)}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-3 block">Aparência & Layout</Label>
                <FormStyleEditor
                  settings={editingForm?.settings ?? DEFAULT_SETTINGS}
                  onChange={(settings) => setEditingForm(prev => prev ? { ...prev, settings } : null)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingForm(null)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={updateForm.isPending}>
              {updateForm.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={!!submissionsData} onOpenChange={(open) => !open && setSubmissionsData(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submissões — {submissionsData?.formName}</DialogTitle>
            <DialogDescription>{submissionsData?.items.length ?? 0} submissões recebidas</DialogDescription>
          </DialogHeader>
          {loadingSubs ? (
            <Skeleton className="h-32 w-full" />
          ) : submissionsData?.items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma submissão ainda.</p>
          ) : (
            <div className="space-y-3">
              {submissionsData?.items.map((sub) => (
                <Card key={sub.id}>
                  <CardContent className="pt-4 text-sm">
                    <p className="text-xs text-muted-foreground mb-2">{format(new Date(sub.created_at), 'dd/MM/yyyy HH:mm')}</p>
                    <pre className="whitespace-pre-wrap break-all bg-muted p-2 rounded text-xs">
                      {JSON.stringify(sub.data, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Integration Dialog */}
      {integrationForm && (
        <FormIntegrationDialog
          open={!!integrationForm}
          onOpenChange={(open) => !open && setIntegrationForm(null)}
          formId={integrationForm.id}
          formName={integrationForm.name}
        />
      )}
    </div>
  );
}
