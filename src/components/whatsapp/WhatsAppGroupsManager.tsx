import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users, Plus, Trash2, UserPlus, UserMinus, MessageSquare, RefreshCw, Crown, Clock,
  Search, Settings, Copy, Shield, Activity, Eye, ToggleLeft, ToggleRight, Edit, Tag, Send, X,
} from 'lucide-react';
import { useWhatsAppGroups, WhatsAppGroup, WhatsAppGroupEvent, WhatsAppGroupMember } from '@/hooks/useWhatsAppGroups';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function WhatsAppGroupsManager() {
  const {
    groups, isLoadingGroups, refetchGroups, allTags,
    createGroup, updateGroup, deleteGroup,
    fetchGroupMembers, fetchGroupEvents,
    isCreatingGroup, isUpdatingGroup,
  } = useWhatsAppGroups();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<WhatsAppGroup | null>(null);
  const [detailTab, setDetailTab] = useState<'members' | 'events' | 'settings' | 'message'>('members');
  const [groupMembers, setGroupMembers] = useState<WhatsAppGroupMember[]>([]);
  const [groupEvents, setGroupEvents] = useState<WhatsAppGroupEvent[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [deleteConfirmGroup, setDeleteConfirmGroup] = useState<WhatsAppGroup | null>(null);
  const [editingGroup, setEditingGroup] = useState<WhatsAppGroup | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', tags: [] as string[] });
  const [newTagInput, setNewTagInput] = useState('');
  const [editTagInput, setEditTagInput] = useState('');
  const [sendMessageText, setSendMessageText] = useState('');
  const [newGroup, setNewGroup] = useState({ name: '', description: '', group_type: 'group', tags: [] as string[] });
  const [newGroupTagInput, setNewGroupTagInput] = useState('');

  const handleCreateGroup = () => {
    createGroup(newGroup);
    setIsCreateDialogOpen(false);
    setNewGroup({ name: '', description: '', group_type: 'group', tags: [] });
  };

  const handleOpenDetail = async (group: WhatsAppGroup) => {
    setSelectedGroup(group);
    setDetailTab('members');
    setSendMessageText('');
    setIsLoadingMembers(true);
    setIsLoadingEvents(true);
    try {
      const [members, events] = await Promise.all([
        fetchGroupMembers(group.id),
        fetchGroupEvents(group.id),
      ]);
      setGroupMembers(members);
      setGroupEvents(events);
    } catch (error) {
      console.error('Error fetching group details:', error);
    } finally {
      setIsLoadingMembers(false);
      setIsLoadingEvents(false);
    }
  };

  const handleToggleGroup = (group: WhatsAppGroup) => {
    updateGroup({ id: group.id, is_active: !group.is_active });
  };

  const handleEditGroup = (group: WhatsAppGroup) => {
    setEditingGroup(group);
    setEditForm({ name: group.name, description: group.description || '', tags: group.tags || [] });
    setEditTagInput('');
  };

  const handleSaveEdit = () => {
    if (!editingGroup) return;
    updateGroup({ id: editingGroup.id, name: editForm.name, description: editForm.description, tags: editForm.tags });
    setEditingGroup(null);
  };

  const handleAddTag = (tag: string, target: 'new' | 'edit') => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed) return;
    if (target === 'new') {
      if (!newGroup.tags.includes(trimmed)) setNewGroup({ ...newGroup, tags: [...newGroup.tags, trimmed] });
      setNewGroupTagInput('');
    } else {
      if (!editForm.tags.includes(trimmed)) setEditForm({ ...editForm, tags: [...editForm.tags, trimmed] });
      setEditTagInput('');
    }
  };

  const handleRemoveTag = (tag: string, target: 'new' | 'edit') => {
    if (target === 'new') setNewGroup({ ...newGroup, tags: newGroup.tags.filter(t => t !== tag) });
    else setEditForm({ ...editForm, tags: editForm.tags.filter(t => t !== tag) });
  };

  const handleAddTagToGroup = (group: WhatsAppGroup) => {
    const tag = newTagInput.trim().toLowerCase();
    if (!tag || (group.tags || []).includes(tag)) { setNewTagInput(''); return; }
    updateGroup({ id: group.id, tags: [...(group.tags || []), tag] });
    setNewTagInput('');
  };

  const handleRemoveTagFromGroup = (group: WhatsAppGroup, tag: string) => {
    updateGroup({ id: group.id, tags: (group.tags || []).filter(t => t !== tag) });
  };

  const handleSendMessage = () => {
    if (!selectedGroup || !sendMessageText.trim()) return;
    toast.success(`Mensagem enviada para o grupo "${selectedGroup.name}"!`);
    setSendMessageText('');
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'join': return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'leave': case 'remove': return <UserMinus className="h-4 w-4 text-red-500" />;
      case 'promote': return <Crown className="h-4 w-4 text-yellow-500" />;
      default: return <Users className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventLabel = (eventType: string) => {
    const labels: Record<string, string> = { join: 'Entrou', leave: 'Saiu', remove: 'Removido', promote: 'Promovido', demote: 'Rebaixado' };
    return labels[eventType] || eventType;
  };

  const filteredGroups = groups.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = filterTag === 'all' || (g.tags || []).includes(filterTag);
    return matchesSearch && matchesTag;
  });

  const activeGroupsCount = groups.filter(g => g.is_active).length;
  const totalMembers = groups.reduce((sum, g) => sum + (g.member_count || 0), 0);

  // Tag input component
  const TagInput = ({ tags, onAdd, onRemove, inputValue, setInputValue, placeholder }: {
    tags: string[]; onAdd: () => void; onRemove: (t: string) => void;
    inputValue: string; setInputValue: (v: string) => void; placeholder?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder || "Digite uma tag..."}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={onAdd} disabled={!inputValue.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs gap-1">
              <Tag className="h-3 w-3" />{tag}
              <button onClick={() => onRemove(tag)} className="ml-0.5 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900"><Users className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold">{groups.length}</p><p className="text-xs text-muted-foreground">Total de Grupos</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900"><Activity className="h-5 w-5 text-emerald-600" /></div><div><p className="text-2xl font-bold">{activeGroupsCount}</p><p className="text-xs text-muted-foreground">Grupos Ativos</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900"><UserPlus className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{totalMembers}</p><p className="text-xs text-muted-foreground">Total de Membros</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900"><Tag className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{allTags.length}</p><p className="text-xs text-muted-foreground">Tags Criadas</p></div></div></CardContent></Card>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Grupos e Comunidades</h2>
          <p className="text-muted-foreground">Gerencie seus grupos, envie mensagens e configure automações por tag</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar grupos..." className="pl-9 w-full sm:w-[200px]" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          {allTags.length > 0 && (
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Filtrar tag" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as tags</SelectItem>
                {allTags.map(tag => (<SelectItem key={tag} value={tag}>{tag}</SelectItem>))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="icon" onClick={() => refetchGroups()}><RefreshCw className="h-4 w-4" /></Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo Grupo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Grupo</DialogTitle>
                <DialogDescription>Adicione um grupo do WhatsApp para gerenciar</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome do Grupo</Label>
                  <Input placeholder="Ex: Clientes VIP" value={newGroup.name} onChange={e => setNewGroup({ ...newGroup, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea placeholder="Descrição do grupo..." value={newGroup.description} onChange={e => setNewGroup({ ...newGroup, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={newGroup.group_type} onValueChange={v => setNewGroup({ ...newGroup, group_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="group">Grupo</SelectItem>
                      <SelectItem value="community">Comunidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <TagInput
                    tags={newGroup.tags}
                    onAdd={() => handleAddTag(newGroupTagInput, 'new')}
                    onRemove={t => handleRemoveTag(t, 'new')}
                    inputValue={newGroupTagInput}
                    setInputValue={setNewGroupTagInput}
                    placeholder="Ex: vip, clientes, leads"
                  />
                  <p className="text-xs text-muted-foreground">Tags permitem criar automações individuais para cada grupo</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateGroup} disabled={!newGroup.name || isCreatingGroup}>
                  {isCreatingGroup ? 'Criando...' : 'Criar Grupo'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Groups Grid */}
      {isLoadingGroups ? (
        <div className="flex items-center justify-center py-12"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : filteredGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">{searchQuery || filterTag !== 'all' ? 'Nenhum grupo encontrado' : 'Nenhum grupo cadastrado'}</h3>
            <p className="text-muted-foreground mb-4">{searchQuery || filterTag !== 'all' ? 'Tente outro filtro' : 'Adicione seus grupos do WhatsApp para gerenciá-los'}</p>
            {!searchQuery && filterTag === 'all' && <Button onClick={() => setIsCreateDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Adicionar Grupo</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group) => (
            <Card key={group.id} className={`hover:shadow-md transition-shadow cursor-pointer ${!group.is_active ? 'opacity-60' : ''}`} onClick={() => handleOpenDetail(group)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${group.is_active ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'}`}>
                      <Users className={`h-5 w-5 ${group.is_active ? 'text-green-600' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{group.name}</CardTitle>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">{group.group_type === 'community' ? 'Comunidade' : 'Grupo'}</Badge>
                        {group.is_admin && <Badge variant="secondary" className="text-xs"><Crown className="h-3 w-3 mr-1" />Admin</Badge>}
                        {!group.is_active && <Badge variant="destructive" className="text-xs">Inativo</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {group.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{group.description}</p>}
                {/* Tags */}
                {group.tags && group.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {group.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-[10px] gap-1 bg-primary/5">
                        <Tag className="h-2.5 w-2.5" />{tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" />{group.member_count} membros</span>
                  {group.synced_at && (
                    <span className="flex items-center gap-1 text-xs"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(group.synced_at), { addSuffix: true, locale: ptBR })}</span>
                  )}
                </div>
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenDetail(group)}>
                    <Eye className="h-4 w-4 mr-2" />Detalhes
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEditGroup(group)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => handleToggleGroup(group)}>
                    {group.is_active ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmGroup(group)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Group Detail Dialog */}
      <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900"><Users className="h-4 w-4 text-green-600" /></div>
              {selectedGroup?.name}
              {selectedGroup?.is_admin && <Badge variant="secondary" className="text-xs"><Crown className="h-3 w-3 mr-1" />Admin</Badge>}
            </DialogTitle>
            <DialogDescription>
              {selectedGroup?.description || 'Sem descrição'} • {selectedGroup?.member_count} membros
              {selectedGroup?.invite_link && (
                <Button variant="link" size="sm" className="ml-2 h-auto p-0" onClick={() => handleCopyLink(selectedGroup.invite_link!)}>
                  <Copy className="h-3 w-3 mr-1" />Copiar link
                </Button>
              )}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={detailTab} onValueChange={v => setDetailTab(v as typeof detailTab)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="members" className="flex items-center gap-1 text-xs"><Users className="h-3.5 w-3.5" />Membros</TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-1 text-xs"><Activity className="h-3.5 w-3.5" />Atividades</TabsTrigger>
              <TabsTrigger value="message" className="flex items-center gap-1 text-xs"><Send className="h-3.5 w-3.5" />Mensagem</TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1 text-xs"><Settings className="h-3.5 w-3.5" />Config</TabsTrigger>
            </TabsList>

            {/* Members Tab */}
            <TabsContent value="members" className="mt-4">
              {isLoadingMembers ? (
                <div className="flex items-center justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : groupMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Nenhum membro registrado</p>
                  <p className="text-xs mt-1">Os membros serão sincronizados automaticamente</p>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Telefone</TableHead><TableHead>Status</TableHead><TableHead>Função</TableHead><TableHead>Entrada</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {groupMembers.map(member => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.name || '—'}</TableCell>
                          <TableCell className="font-mono text-sm">{member.phone_number}</TableCell>
                          <TableCell><Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="text-xs">{member.status === 'active' ? 'Ativo' : member.status === 'left' ? 'Saiu' : member.status === 'removed' ? 'Removido' : 'Banido'}</Badge></TableCell>
                          <TableCell>{member.is_admin && <Badge variant="outline" className="text-xs"><Crown className="h-3 w-3 mr-1" />Admin</Badge>}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{formatDistanceToNow(new Date(member.joined_at), { addSuffix: true, locale: ptBR })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="mt-4">
              {isLoadingEvents ? (
                <div className="flex items-center justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : groupEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground"><Clock className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Nenhum evento registrado</p></div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {groupEvents.map(event => (
                    <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                      {getEventIcon(event.event_type)}
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium">{event.phone_number} <span className="text-muted-foreground font-normal">{getEventLabel(event.event_type).toLowerCase()}</span></p></div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ptBR })}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Send Message Tab */}
            <TabsContent value="message" className="mt-4">
              <div className="space-y-4">
                <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-900 dark:text-green-100">Enviar Mensagem para o Grupo</p>
                        <p className="text-green-700 dark:text-green-300 mt-1">
                          Envie uma mensagem diretamente para "{selectedGroup?.name}". Use variáveis como {'{{grupo}}'} e {'{{data}}'}.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="space-y-2">
                  <Label>Mensagem</Label>
                  <Textarea
                    placeholder="Digite a mensagem para enviar ao grupo..."
                    rows={5}
                    value={sendMessageText}
                    onChange={e => setSendMessageText(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Variáveis: {'{{grupo}}'}, {'{{data}}'}, {'{{total_membros}}'}</p>
                </div>
                <Button onClick={handleSendMessage} disabled={!sendMessageText.trim()} className="w-full">
                  <Send className="h-4 w-4 mr-2" />Enviar Mensagem
                </Button>
              </div>
            </TabsContent>

            {/* Settings Tab with Tags */}
            <TabsContent value="settings" className="mt-4">
              {selectedGroup && (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1"><Label className="text-muted-foreground text-xs">Tipo</Label><p className="font-medium">{selectedGroup.group_type === 'community' ? 'Comunidade' : 'Grupo'}</p></div>
                    <div className="space-y-1"><Label className="text-muted-foreground text-xs">Status</Label><p className="font-medium">{selectedGroup.is_active ? 'Ativo' : 'Inativo'}</p></div>
                    <div className="space-y-1"><Label className="text-muted-foreground text-xs">Membros</Label><p className="font-medium">{selectedGroup.member_count}</p></div>
                    <div className="space-y-1"><Label className="text-muted-foreground text-xs">Criado em</Label><p className="font-medium">{format(new Date(selectedGroup.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p></div>
                  </div>

                  {/* Tags Section */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <Label className="font-semibold">Tags do Grupo</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">Tags permitem criar automações específicas e filtrar grupos. Cada tag pode ser usada como gatilho no Flow Builder.</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Adicionar tag..."
                        value={newTagInput}
                        onChange={e => setNewTagInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTagToGroup(selectedGroup); } }}
                        className="flex-1"
                      />
                      <Button variant="outline" size="sm" onClick={() => handleAddTagToGroup(selectedGroup)} disabled={!newTagInput.trim()}>
                        <Plus className="h-4 w-4 mr-1" />Adicionar
                      </Button>
                    </div>
                    {(selectedGroup.tags || []).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedGroup.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                            <Tag className="h-3 w-3" />{tag}
                            <button onClick={() => handleRemoveTagFromGroup(selectedGroup, tag)} className="ml-0.5 hover:text-destructive"><X className="h-3 w-3" /></button>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Nenhuma tag adicionada</p>
                    )}
                  </div>

                  {selectedGroup.invite_link && (
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Link de Convite</Label>
                      <div className="flex items-center gap-2">
                        <Input value={selectedGroup.invite_link} readOnly className="font-mono text-xs" />
                        <Button variant="outline" size="sm" onClick={() => handleCopyLink(selectedGroup.invite_link!)}><Copy className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  )}
                  {selectedGroup.external_group_id && (
                    <div className="space-y-1"><Label className="text-muted-foreground text-xs">ID Externo</Label><p className="font-mono text-xs text-muted-foreground">{selectedGroup.external_group_id}</p></div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Grupo</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nome do Grupo</Label><Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <TagInput
                tags={editForm.tags}
                onAdd={() => handleAddTag(editTagInput, 'edit')}
                onRemove={t => handleRemoveTag(t, 'edit')}
                inputValue={editTagInput}
                setInputValue={setEditTagInput}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGroup(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={!editForm.name || isUpdatingGroup}>{isUpdatingGroup ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteConfirmGroup} onOpenChange={() => setDeleteConfirmGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover grupo?</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja remover o grupo "{deleteConfirmGroup?.name}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteConfirmGroup) { deleteGroup(deleteConfirmGroup.id); setDeleteConfirmGroup(null); } }}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
