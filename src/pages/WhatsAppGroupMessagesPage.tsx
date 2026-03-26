import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus, Send, Clock, Trash2, Users, MessageSquare, Search,
  MoreVertical, Zap, UserPlus, UserMinus, Calendar, Image, Edit,
  CheckCircle2, Power,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWhatsAppGroups, WhatsAppGroupMessage } from '@/hooks/useWhatsAppGroups';
import { SearchableTagSelect } from '@/components/whatsapp/SearchableTagSelect';

const TEMPLATE_VARS = ['{{nome}}', '{{grupo}}'];

export default function WhatsAppGroupMessagesPage() {
  const {
    groups, groupMessages, isLoadingMessages, createGroupMessage, allTags,
  } = useWhatsAppGroups();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    name: '',
    content: '',
    message_type: 'text' as string,
    trigger_event: 'manual' as string,
    is_active: true,
    target_groups: [] as string[],
    scheduled_at: '',
  });

  const filteredMessages = (groupMessages || []).filter(m => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTab === 'active') return m.is_active;
    if (activeTab === 'inactive') return !m.is_active;
    if (activeTab === 'on_join') return m.trigger_event === 'on_join';
    if (activeTab === 'scheduled') return m.trigger_event === 'scheduled';
    if (activeTab === 'manual') return m.trigger_event === 'manual';
    return true;
  });

  const handleCreate = () => {
    createGroupMessage({
      name: form.name,
      content: form.content,
      message_type: form.message_type,
      trigger_event: form.trigger_event,
      is_active: form.is_active,
      target_groups: form.target_groups,
    });
    setIsCreateOpen(false);
    setForm({ name: '', content: '', message_type: 'text', trigger_event: 'manual', is_active: true, target_groups: [], scheduled_at: '' });
  };

  const triggerLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    manual: { label: 'Manual', icon: <Send className="h-3.5 w-3.5" />, color: 'bg-muted text-muted-foreground' },
    on_join: { label: 'Ao Entrar', icon: <UserPlus className="h-3.5 w-3.5" />, color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    on_leave: { label: 'Ao Sair', icon: <UserMinus className="h-3.5 w-3.5" />, color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    scheduled: { label: 'Agendado', icon: <Clock className="h-3.5 w-3.5" />, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Mensagens para Grupos
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie, programe e automatize mensagens para seus grupos de WhatsApp
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Mensagem
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Mensagens', value: groupMessages?.length || 0, icon: MessageSquare },
          { label: 'Ativas', value: groupMessages?.filter(m => m.is_active).length || 0, icon: CheckCircle2 },
          { label: 'Ao Entrar', value: groupMessages?.filter(m => m.trigger_event === 'on_join').length || 0, icon: UserPlus },
          { label: 'Grupos', value: groups?.length || 0, icon: Users },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar mensagem..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="active">Ativas</TabsTrigger>
            <TabsTrigger value="on_join">Ao Entrar</TabsTrigger>
            <TabsTrigger value="scheduled">Agendadas</TabsTrigger>
            <TabsTrigger value="manual">Manuais</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Messages List */}
      <div className="grid gap-4">
        {filteredMessages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">Nenhuma mensagem encontrada</h3>
              <p className="text-muted-foreground mt-1">Crie mensagens automáticas ou manuais para seus grupos</p>
              <Button onClick={() => setIsCreateOpen(true)} className="mt-4 gap-2">
                <Plus className="h-4 w-4" /> Nova Mensagem
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredMessages.map(msg => {
            const trigger = triggerLabels[msg.trigger_event || 'manual'] || triggerLabels.manual;
            const targetCount = msg.target_groups?.length || 0;
            return (
              <Card key={msg.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${msg.is_active ? 'bg-green-500/10' : 'bg-muted'}`}>
                        <MessageSquare className={`h-5 w-5 ${msg.is_active ? 'text-green-400' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{msg.name}</h3>
                        <p className="text-sm text-muted-foreground truncate max-w-md">
                          {msg.content?.slice(0, 80)}...
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="outline" className={`${trigger.color} flex items-center gap-1`}>
                        {trigger.icon}
                        {trigger.label}
                      </Badge>

                      {targetCount > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {targetCount} grupo{targetCount > 1 ? 's' : ''}
                        </Badge>
                      )}

                      <Badge variant={msg.is_active ? 'default' : 'secondary'}>
                        {msg.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Mensagem para Grupos</DialogTitle>
            <DialogDescription>
              Configure a mensagem e defina quando ela será disparada nos grupos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome da Mensagem</Label>
              <Input
                placeholder="Ex: Boas-vindas novo membro"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div>
              <Label>Gatilho de Envio</Label>
              <Select value={form.trigger_event} onValueChange={v => setForm(f => ({ ...f, trigger_event: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual (envio sob demanda)</SelectItem>
                  <SelectItem value="on_join">Ao Entrar no Grupo</SelectItem>
                  <SelectItem value="on_leave">Ao Sair do Grupo</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.trigger_event === 'scheduled' && (
              <div>
                <Label>Data e Hora do Envio</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                />
              </div>
            )}

            <div>
              <Label>Tipo de Mensagem</Label>
              <Select value={form.message_type} onValueChange={v => setForm(f => ({ ...f, message_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="image">Imagem + Texto</SelectItem>
                  <SelectItem value="video">Vídeo + Texto</SelectItem>
                  <SelectItem value="document">Documento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Conteúdo da Mensagem</Label>
              <Textarea
                placeholder="Bem-vindo ao grupo, {{nome}}! 🎉"
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={5}
              />
              <div className="flex gap-1 mt-2 flex-wrap">
                {TEMPLATE_VARS.map(v => (
                  <Badge
                    key={v}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setForm(f => ({ ...f, content: f.content + ' ' + v }))}
                  >
                    {v}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Grupos Alvo</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 mt-1">
                {groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum grupo encontrado. Importe grupos na página de WhatsApp.
                  </p>
                ) : (
                  groups.map(group => (
                    <label key={group.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1.5 rounded">
                      <Checkbox
                        checked={form.target_groups.includes(group.id)}
                        onCheckedChange={(checked) => {
                          setForm(f => ({
                            ...f,
                            target_groups: checked
                              ? [...f.target_groups, group.id]
                              : f.target_groups.filter(id => id !== group.id),
                          }));
                        }}
                      />
                      <span className="text-sm text-foreground">{group.name}</span>
                      {group.member_count > 0 && (
                        <Badge variant="outline" className="text-xs ml-auto">
                          {group.member_count} membros
                        </Badge>
                      )}
                    </label>
                  ))
                )}
              </div>
              {form.target_groups.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {form.target_groups.length} grupo{form.target_groups.length > 1 ? 's' : ''} selecionado{form.target_groups.length > 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))}
              />
              <Label>Ativar imediatamente</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.name || !form.content}>
              <Send className="h-4 w-4 mr-2" />
              Criar Mensagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
