import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus, Search, Trash2, Edit, Eye, Clock, CheckCircle, XCircle, AlertCircle,
  FileText, Link as LinkIcon, MessageSquare, Phone, RefreshCw, Send,
} from 'lucide-react';
import { useWhatsAppTemplates, WhatsAppTemplate, TemplateButton, TemplateVariable } from '@/hooks/useWhatsAppTemplates';
import { useWhatsAppInstances } from '@/hooks/useWhatsAppInstances';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CATEGORIES = [
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'UTILITY', label: 'Utility' },
  { value: 'AUTHENTICATION', label: 'Authentication' },
];

const LANGUAGES = [
  { value: 'pt_BR', label: 'Português (BR)' },
  { value: 'en_US', label: 'English (US)' },
  { value: 'es', label: 'Español' },
];

const HEADER_TYPES = [
  { value: 'none', label: 'Sem cabeçalho' },
  { value: 'text', label: 'Texto' },
  { value: 'image', label: 'Imagem' },
  { value: 'video', label: 'Vídeo' },
  { value: 'document', label: 'Documento' },
];

const BUTTON_TYPES = [
  { value: 'url', label: 'Link externo' },
  { value: 'quick_reply', label: 'Resposta rápida' },
  { value: 'phone', label: 'Telefone' },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  in_review: { label: 'Em análise', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: AlertCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || statusConfig.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function TemplatePreview({ template }: { template: { content: string; footer_text?: string | null; buttons?: TemplateButton[]; header_type?: string | null; header_content?: string | null } }) {
  return (
    <div className="bg-[#e5ddd5] dark:bg-[#0b141a] rounded-lg p-4 max-w-xs mx-auto">
      <div className="bg-white dark:bg-[#1f2c34] rounded-lg shadow-sm overflow-hidden">
        {template.header_type === 'text' && template.header_content && (
          <div className="px-3 pt-3 font-bold text-sm text-foreground">{template.header_content}</div>
        )}
        {template.header_type === 'image' && (
          <div className="h-32 bg-muted flex items-center justify-center text-muted-foreground text-xs">[Imagem]</div>
        )}
        <div className="px-3 py-2 text-sm text-foreground whitespace-pre-wrap">{template.content || 'Corpo da mensagem...'}</div>
        {template.footer_text && (
          <div className="px-3 pb-1 text-xs text-muted-foreground">{template.footer_text}</div>
        )}
        {template.buttons && template.buttons.length > 0 && (
          <div className="border-t border-border/50">
            {template.buttons.map((btn, i) => (
              <div key={i} className="text-center py-2 text-sm text-primary font-medium border-b last:border-b-0 border-border/30">
                {btn.text || 'Botão'}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial?: WhatsAppTemplate | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const { activeInstances } = useWhatsAppInstances();
  const [name, setName] = useState(initial?.name || '');
  const [language, setLanguage] = useState(initial?.language || 'pt_BR');
  const [category, setCategory] = useState(initial?.category || 'MARKETING');
  const [headerType, setHeaderType] = useState(initial?.header_type || 'none');
  const [headerContent, setHeaderContent] = useState(initial?.header_content || '');
  const [content, setContent] = useState(initial?.content || '');
  const [footerText, setFooterText] = useState(initial?.footer_text || '');
  const [buttons, setButtons] = useState<TemplateButton[]>(initial?.buttons || []);
  const [variables, setVariables] = useState<TemplateVariable[]>(initial?.variables || []);

  const addButton = () => {
    if (buttons.length >= 3) return;
    setButtons([...buttons, { type: 'url', text: '' }]);
  };

  const updateButton = (idx: number, updates: Partial<TemplateButton>) => {
    setButtons(buttons.map((b, i) => (i === idx ? { ...b, ...updates } : b)));
  };

  const removeButton = (idx: number) => setButtons(buttons.filter((_, i) => i !== idx));

  const addVariable = () => {
    const nextKey = `{{${variables.length + 1}}}`;
    setVariables([...variables, { key: nextKey, example: '', parameter: 'primeiro_nome' }]);
    setContent(prev => prev + ` ${nextKey}`);
  };

  const updateVariable = (idx: number, updates: Partial<TemplateVariable>) => {
    setVariables(variables.map((v, i) => (i === idx ? { ...v, ...updates } : v)));
  };

  const handleSave = () => {
    if (!name.trim() || !content.trim()) return;
    onSave({
      name: name.trim(),
      language,
      category,
      content: content.trim(),
      header_type: headerType === 'none' ? null : headerType,
      header_content: headerType !== 'none' ? headerContent : null,
      footer_text: footerText.trim() || null,
      buttons,
      variables,
    });
  };

  const preview = { content, footer_text: footerText, buttons, header_type: headerType, header_content: headerContent };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <ScrollArea className="max-h-[70vh]">
        <div className="space-y-5 pr-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do template *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="ex: boas_vindas_01" maxLength={512} />
              <p className="text-xs text-muted-foreground">Limite de caracteres: {name.length}/512</p>
            </div>
            <div className="space-y-2">
              <Label>Idioma *</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dispositivo</Label>
              <Select defaultValue="">
                <SelectTrigger><SelectValue placeholder="Selecionar dispositivo" /></SelectTrigger>
                <SelectContent>
                  {activeInstances.map(inst => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                  ))}
                  {activeInstances.length === 0 && (
                    <SelectItem value="_none" disabled>Nenhum dispositivo</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Cabeçalho do template</Label>
            <Select value={headerType} onValueChange={setHeaderType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {HEADER_TYPES.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {headerType === 'text' && (
              <Input className="mt-2" placeholder="Texto do cabeçalho" value={headerContent} onChange={e => setHeaderContent(e.target.value)} />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Corpo do template *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addVariable}>
                <Plus className="h-3 w-3 mr-1" /> Adicionar variável
              </Button>
            </div>
            <Textarea
              rows={6}
              maxLength={1024}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Olá {{1}}, sua vaga está reservada..."
            />
            <p className="text-xs text-muted-foreground">Limite de caracteres: {content.length}/1024</p>
          </div>

          <div className="space-y-2">
            <Label>Rodapé do template (Opcional)</Label>
            <Input value={footerText} onChange={e => setFooterText(e.target.value)} placeholder="Equipe de atendimento" maxLength={60} />
            <p className="text-xs text-muted-foreground">Limite de caracteres: {footerText.length}/60</p>
          </div>

          <Separator />

          {/* Buttons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Botões do template</Label>
              <Button type="button" variant="outline" size="sm" onClick={addButton} disabled={buttons.length >= 3}>
                <Plus className="h-3 w-3 mr-1" /> Adicionar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Máximo de 3 botões por template</p>
            {buttons.map((btn, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1 mr-2">
                    <Label className="text-xs">Tipo do botão</Label>
                    <Select value={btn.type} onValueChange={v => updateButton(i, { type: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BUTTON_TYPES.map(bt => <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeButton(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Texto do botão *</Label>
                  <Input value={btn.text} onChange={e => updateButton(i, { text: e.target.value })} maxLength={25} className="h-8" />
                  <p className="text-xs text-muted-foreground">{btn.text.length}/25 caracteres</p>
                </div>
                {btn.type === 'url' && (
                  <div className="space-y-1">
                    <Label className="text-xs">URL do botão *</Label>
                    <Input value={btn.url || ''} onChange={e => updateButton(i, { url: e.target.value })} placeholder="https://..." className="h-8" />
                  </div>
                )}
                {btn.type === 'phone' && (
                  <div className="space-y-1">
                    <Label className="text-xs">Telefone *</Label>
                    <Input value={btn.phone || ''} onChange={e => updateButton(i, { phone: e.target.value })} placeholder="+55..." className="h-8" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <Separator />

          {/* Variables */}
          {variables.length > 0 && (
            <div className="space-y-3">
              <Label>Parâmetros do template</Label>
              <p className="text-xs text-muted-foreground">Parâmetros do corpo {variables.length}</p>
              {variables.map((v, i) => (
                <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Chave - {v.key}</span>
                    <Badge variant="secondary" className="text-xs">{v.parameter}</Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Exemplo</Label>
                    <Input value={v.example} onChange={e => updateVariable(i, { example: e.target.value })} className="h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Parâmetro</Label>
                    <Select value={v.parameter} onValueChange={val => updateVariable(i, { parameter: val })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primeiro_nome">Primeiro nome</SelectItem>
                        <SelectItem value="nome_completo">Nome completo</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="telefone">Telefone</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving || !name.trim() || !content.trim()}>
              {isSaving ? 'Salvando...' : initial ? 'Atualizar' : 'Criar Template'}
            </Button>
          </div>
        </div>
      </ScrollArea>

      {/* Preview */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Prévia do template</Label>
        <TemplatePreview template={preview} />
      </div>
    </div>
  );
}

export default function WhatsAppTemplatesPage() {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, submitToMeta, syncFromMeta, checkStatus } = useWhatsAppTemplates();
  const { activeInstances } = useWhatsAppInstances();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<WhatsAppTemplate | null>(null);
  const [showSync, setShowSync] = useState(false);
  const [syncFilters, setSyncFilters] = useState<{ name: string; category: string; language: string; status: string }>({ name: '', category: '', language: '', status: '' });

  const filtered = templates.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const handleSync = () => {
    const f: Record<string, string> = {};
    if (syncFilters.name) f.name = syncFilters.name;
    if (syncFilters.category) f.category = syncFilters.category;
    if (syncFilters.language) f.language = syncFilters.language;
    if (syncFilters.status) f.status = syncFilters.status;
    syncFromMeta.mutate(Object.keys(f).length ? f : undefined, { onSuccess: () => setShowSync(false) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Templates API Oficial</h1>
          <p className="text-sm text-muted-foreground">
            Crie templates de mensagens para reutilização nos disparos via API oficial.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSync(true)} disabled={syncFromMeta.isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncFromMeta.isPending ? 'animate-spin' : ''}`} /> Sincronizar
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" /> Novo template API Oficial
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar template..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="rejected">Rejeitado</SelectItem>
            <SelectItem value="in_review">Em análise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 space-y-3">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Nenhum template encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">Crie seu primeiro template ou sincronize da Meta.</p>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowSync(true)}>
                <RefreshCw className="h-4 w-4 mr-2" /> Sincronizar da Meta
              </Button>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" /> Criar template
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <Card key={t.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm truncate">{t.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                      <span className="text-[10px] text-muted-foreground">{t.language}</span>
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">{t.content}</p>
                {t.buttons.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {t.buttons.map((btn, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {btn.type === 'url' ? <LinkIcon className="h-2.5 w-2.5 mr-1" /> : btn.type === 'phone' ? <Phone className="h-2.5 w-2.5 mr-1" /> : <MessageSquare className="h-2.5 w-2.5 mr-1" />}
                        {btn.text}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-muted-foreground">
                    há {format(new Date(t.created_at), "d 'de' MMM", { locale: ptBR })}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!t.external_template_id && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" title="Enviar para Meta" onClick={() => submitToMeta.mutate(t.id)} disabled={submitToMeta.isPending}>
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {t.external_template_id && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Atualizar status" onClick={() => checkStatus.mutate(t.id)} disabled={checkStatus.isPending}>
                        <RefreshCw className={`h-3.5 w-3.5 ${checkStatus.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewTemplate(t)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingTemplate(t)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTemplate.mutate(t.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate || !!editingTemplate} onOpenChange={v => { if (!v) { setShowCreate(false); setEditingTemplate(null); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Editar template' : 'Criar Novo Template'}</DialogTitle>
            <DialogDescription>
              {editingTemplate ? 'Atualize as informações do template' : 'Escolha como você gostaria de criar seu template WhatsApp'}
            </DialogDescription>
          </DialogHeader>
          <TemplateForm
            initial={editingTemplate}
            isSaving={createTemplate.isPending || updateTemplate.isPending}
            onCancel={() => { setShowCreate(false); setEditingTemplate(null); }}
            onSave={(data) => {
              if (editingTemplate) {
                updateTemplate.mutate({ id: editingTemplate.id, ...data }, { onSuccess: () => setEditingTemplate(null) });
              } else {
                createTemplate.mutate(data, { onSuccess: () => setShowCreate(false) });
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Sync Dialog */}
      <Dialog open={showSync} onOpenChange={setShowSync}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sincronizar Templates</DialogTitle>
            <DialogDescription>Importe templates existentes da API Oficial da Meta.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do template</Label>
              <Input placeholder="Digite o nome do template" value={syncFilters.name} onChange={e => setSyncFilters(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={syncFilters.category} onValueChange={v => setSyncFilters(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Todas as categorias" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as categorias</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Idioma</Label>
              <Select value={syncFilters.language} onValueChange={v => setSyncFilters(p => ({ ...p, language: v }))}>
                <SelectTrigger><SelectValue placeholder="Todos os idiomas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os idiomas</SelectItem>
                  {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dispositivo *</Label>
              <Select defaultValue="">
                <SelectTrigger><SelectValue placeholder="Selecionar dispositivo" /></SelectTrigger>
                <SelectContent>
                  {activeInstances.filter(i => i.integration_type === 'whatsapp_business').map(inst => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                  ))}
                  {activeInstances.filter(i => i.integration_type === 'whatsapp_business').length === 0 && (
                    <SelectItem value="_none" disabled>Nenhum dispositivo API Oficial</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={syncFilters.status} onValueChange={v => setSyncFilters(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue placeholder="Todos os status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="APPROVED">Aprovado</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="REJECTED">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
              Importante: A sincronização pode demorar alguns minutos dependendo da quantidade de templates. Não feche esta janela durante o processo.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSync(false)}>Cancelar</Button>
              <Button onClick={handleSync} disabled={syncFromMeta.isPending}>
                {syncFromMeta.isPending ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={v => { if (!v) setPreviewTemplate(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Prévia: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              <StatusBadge status={previewTemplate?.status || 'pending'} />
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && <TemplatePreview template={previewTemplate} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
