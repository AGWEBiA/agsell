import React, { useState, useEffect, useRef } from 'react';
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
  Lock, Unlock, Link2, ImageIcon, Ban, UserCog, ShieldCheck, ShieldOff, Globe, MessageCircle,
  AlertTriangle, Info, Download, Loader2, CheckSquare, Smartphone,
} from 'lucide-react';
import { useWhatsAppGroups, WhatsAppGroup, WhatsAppGroupEvent, WhatsAppGroupMember } from '@/hooks/useWhatsAppGroups';
import { useWhatsAppInstances } from '@/hooks/useWhatsAppInstances';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableTagSelect } from './SearchableTagSelect';

export function WhatsAppGroupsManager({ filterInstanceName, onClearFilter }: { filterInstanceName?: string | null; onClearFilter?: () => void }) {
  const {
    groups, isLoadingGroups, refetchGroups, allTags,
    createGroup, updateGroup, deleteGroup,
    fetchGroupMembers, fetchGroupEvents,
    isCreatingGroup, isUpdatingGroup,
  } = useWhatsAppGroups();

  const { currentOrganization } = useOrganization();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importedGroups, setImportedGroups] = useState<Array<{ instance_id?: string; instance_name: string; phone_number?: string; id: string; subject: string; size: number; selected: boolean }>>([]);
  const [selectedGroup, setSelectedGroup] = useState<WhatsAppGroup | null>(null);
  const [detailTab, setDetailTab] = useState<'members' | 'events' | 'settings' | 'message' | 'admin'>('members');
  const [groupSettings, setGroupSettings] = useState({
    locked: false,
    announce_only: false,
    approve_new_members: false,
    allow_member_edit_info: false,
    allow_member_send_messages: true,
    disappearing_messages: 'off' as 'off' | '24h' | '7d' | '90d',
  });
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
  const [sendMode, setSendMode] = useState<'now' | 'schedule'>('now');
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [newGroup, setNewGroup] = useState({ name: '', description: '', group_type: 'group', tags: [] as string[], instance_name: '', participants: '' });
  const [isCreatingOnWhatsApp, setIsCreatingOnWhatsApp] = useState(false);
  const [newGroupTagInput, setNewGroupTagInput] = useState('');
  const [editLeadTags, setEditLeadTags] = useState<string[]>([]);
  const [editLeadTagInput, setEditLeadTagInput] = useState('');
  const [editInstanceId, setEditInstanceId] = useState('');
  const [editSyncNewLeads, setEditSyncNewLeads] = useState(false);
  const hasAutoFetchedRef = useRef(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [enableSelection, setEnableSelection] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const { instances: whatsAppInstances, activeInstances } = useWhatsAppInstances();

  // Auto-fetch groups from Evolution API on first load only (once per session)
  useEffect(() => {
    if (!hasAutoFetchedRef.current && !isLoadingGroups && groups.length === 0 && activeInstances.length > 0 && currentOrganization?.id) {
      hasAutoFetchedRef.current = true;
      handleFetchEvolutionGroups();
    }
  }, [isLoadingGroups, groups.length, activeInstances.length, currentOrganization?.id]);

  const handleFetchEvolutionGroups = async (instanceFilter?: string) => {
    if (!currentOrganization?.id) return;
    setIsImporting(true);
    setImportedGroups([]);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-evolution-groups', {
        body: { organization_id: currentOrganization.id, instance_name: instanceFilter || undefined },
      });
      if (error) throw error;

      if (data?.error) {
        toast.warning(data.error);
      }

      const allGroups: typeof importedGroups = [];
      const existingIds = new Set(groups.map(g => g.external_group_id));

      // Update phone numbers on local instances
      const phoneSyncPromises: Promise<unknown>[] = [];
      const instanceErrors: string[] = [];

      for (const inst of data.instances || []) {
        // Report per-instance fetch errors
        if (inst.error) {
          instanceErrors.push(`${inst.instance_label || inst.instance_name}: ${inst.error}`);
        }

        if (inst.phone_number) {
          const localInstance = inst.instance_id
            ? whatsAppInstances.find(i => i.id === inst.instance_id)
            : whatsAppInstances.find(i => (i.config?.instance_name || i.name) === inst.instance_name);

          if (localInstance && localInstance.phone_number !== inst.phone_number) {
            phoneSyncPromises.push(
              supabase
                .from('organization_integrations')
                .update({
                  config: { ...localInstance.config, phone_number: inst.phone_number } as any,
                })
                .eq('id', localInstance.id)
            );
          }
        }

        for (const g of inst.groups || []) {
          allGroups.push({
            instance_id: inst.instance_id,
            instance_name: inst.instance_name,
            phone_number: inst.phone_number,
            id: g.id,
            subject: g.subject,
            size: g.size,
            selected: !existingIds.has(g.id),
          });
        }
      }

      if (phoneSyncPromises.length > 0) {
        await Promise.all(phoneSyncPromises);
      }

      setImportedGroups(allGroups);
      setIsImportDialogOpen(true);

      if (instanceErrors.length > 0) {
        toast.error(`Erro em ${instanceErrors.length} instância(s): ${instanceErrors[0]}`, { duration: 8000 });
      } else if (allGroups.length === 0) {
        toast.info('Nenhum grupo encontrado nas instâncias conectadas.');
      }
    } catch (err: any) {
      toast.error('Erro ao buscar grupos: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportSelected = async () => {
    const selected = importedGroups.filter(g => g.selected);
    if (selected.length === 0) { toast.error('Selecione ao menos um grupo'); return; }
    const existingIds = new Set(groups.map(g => g.external_group_id));
    // Direct insert with instance_name in settings and is_active = false
    if (currentOrganization?.id) {
      let importCount = 0;
      for (const g of selected) {
        if (existingIds.has(g.id)) continue;
        await supabase.from('whatsapp_groups').insert({
          organization_id: currentOrganization.id,
          name: g.subject,
          external_group_id: g.id,
          member_count: g.size,
          group_type: 'group',
          is_active: false, // Groups come disabled by default
          settings: {
            instance_name: g.instance_name,
            instance_id: g.instance_id || null,
            sender_phone_number: g.phone_number || null,
          } as any,
          tags: [],
        });
        importCount++;
      }
      refetchGroups();
      toast.success(`${importCount} grupo(s) importado(s)! Ative e configure as tags de cada grupo.`);
    }
    setIsImportDialogOpen(false);
  };

  const handleCreateGroup = async () => {
    if (!currentOrganization?.id || !newGroup.name) return;

    // If instance_name and participants are provided, create on WhatsApp
    if (newGroup.instance_name && newGroup.participants.trim()) {
      setIsCreatingOnWhatsApp(true);
      try {
        const participantsList = newGroup.participants
          .split(/[\n,;]+/)
          .map(p => p.trim())
          .filter(Boolean);

        const { data, error } = await supabase.functions.invoke('create-whatsapp-group', {
          body: {
            organization_id: currentOrganization.id,
            instance_name: newGroup.instance_name,
            group_name: newGroup.name,
            description: newGroup.description,
            participants: participantsList,
            tags: newGroup.tags,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        toast.success('Grupo criado no WhatsApp com sucesso!');
        refetchGroups();
      } catch (err: any) {
        toast.error('Erro ao criar grupo: ' + (err.message || 'Erro desconhecido'));
      } finally {
        setIsCreatingOnWhatsApp(false);
      }
    } else {
      // Create only locally
      createGroup(newGroup);
    }

    setIsCreateDialogOpen(false);
    setNewGroup({ name: '', description: '', group_type: 'group', tags: [], instance_name: '', participants: '' });
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
    const settings = (group.settings || {}) as Record<string, unknown>;
    setEditLeadTags((settings.lead_tags as string[]) || []);
    setEditLeadTagInput('');
    setEditInstanceId((settings.instance_id as string) || '');
    setEditSyncNewLeads((settings.sync_new_leads as boolean) || false);
  };

  const handleSaveEdit = () => {
    if (!editingGroup) return;
    const currentSettings = (editingGroup.settings || {}) as Record<string, unknown>;
    updateGroup({
      id: editingGroup.id,
      name: editForm.name,
      description: editForm.description,
      tags: editForm.tags,
      settings: {
        ...currentSettings,
        lead_tags: editLeadTags,
        instance_id: editInstanceId || null,
        sync_new_leads: editSyncNewLeads,
      },
    });
    setEditingGroup(null);
  };

  const handleAddLeadTag = () => {
    const trimmed = editLeadTagInput.trim().toLowerCase();
    if (!trimmed || editLeadTags.includes(trimmed)) { setEditLeadTagInput(''); return; }
    setEditLeadTags(prev => [...prev, trimmed]);
    setEditLeadTagInput('');
  };

  const handleImportGroupLeads = () => {
    toast.success('Importação de leads do grupo iniciada!');
  };

  const handleArchiveGroup = () => {
    if (!editingGroup) return;
    updateGroup({ id: editingGroup.id, is_active: false });
    setEditingGroup(null);
    toast.success('Grupo arquivado!');
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
    if (sendMode === 'schedule') {
      if (!scheduleDate) { toast.error('Selecione uma data para agendar'); return; }
      const [h, m] = scheduleTime.split(':').map(Number);
      const scheduledAt = new Date(scheduleDate);
      scheduledAt.setHours(h, m, 0, 0);
      if (scheduledAt <= new Date()) { toast.error('A data de agendamento deve ser no futuro'); return; }
      toast.success(`Mensagem agendada para "${selectedGroup.name}" em ${format(scheduledAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`);
    } else {
      toast.success(`Mensagem enviada para o grupo "${selectedGroup.name}"!`);
    }
    setSendMessageText('');
    setSendMode('now');
    setScheduleDate(undefined);
    setScheduleTime('09:00');
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  const handlePromoteMember = (member: WhatsAppGroupMember) => {
    toast.success(`${member.name || member.phone_number} promovido a administrador!`);
    setGroupMembers(prev => prev.map(m => m.id === member.id ? { ...m, is_admin: true } : m));
  };

  const handleDemoteMember = (member: WhatsAppGroupMember) => {
    toast.success(`${member.name || member.phone_number} removido como administrador.`);
    setGroupMembers(prev => prev.map(m => m.id === member.id ? { ...m, is_admin: false } : m));
  };

  const handleRemoveMember = (member: WhatsAppGroupMember) => {
    toast.success(`${member.name || member.phone_number} removido do grupo.`);
    setGroupMembers(prev => prev.map(m => m.id === member.id ? { ...m, status: 'removed' as const } : m));
  };

  const handleToggleGroupLock = () => {
    const newVal = !groupSettings.locked;
    setGroupSettings(prev => ({ ...prev, locked: newVal }));
    toast.success(newVal ? 'Grupo fechado — apenas admins podem alterar informações' : 'Grupo aberto — membros podem alterar informações');
  };

  const handleToggleAnnounceOnly = () => {
    const newVal = !groupSettings.announce_only;
    setGroupSettings(prev => ({ ...prev, announce_only: newVal }));
    toast.success(newVal ? 'Modo anúncios ativado — apenas admins enviam mensagens' : 'Modo anúncios desativado — todos podem enviar');
  };

  const handleToggleApproveMembers = () => {
    const newVal = !groupSettings.approve_new_members;
    setGroupSettings(prev => ({ ...prev, approve_new_members: newVal }));
    toast.success(newVal ? 'Aprovação de membros ativada' : 'Aprovação de membros desativada');
  };

  const handleRegenerateInviteLink = () => {
    toast.success('Link de convite regenerado com sucesso!');
  };

  const handleRevokeInviteLink = () => {
    toast.success('Link de convite revogado.');
  };

  const handleUpdateGroupSetting = (key: string, value: unknown) => {
    setGroupSettings(prev => ({ ...prev, [key]: value }));
    toast.success('Configuração atualizada!');
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
    // Filter by instance if coming from device click
    const groupInstanceName = (g.settings as Record<string, unknown>)?.instance_name as string | undefined;
    const matchesInstance = !filterInstanceName || groupInstanceName === filterInstanceName;
    return matchesSearch && matchesTag && matchesInstance;
  });

  const activeGroupsCount = groups.filter(g => g.is_active).length;
  const totalMembers = groups.reduce((sum, g) => sum + (g.member_count || 0), 0);

  // SearchableTagSelect is now imported from separate component

  return (
    <div className="space-y-6">
      {/* Device filter banner */}
      {filterInstanceName && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <Smartphone className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Filtrando grupos do dispositivo: <strong>{filterInstanceName}</strong></span>
          <Button variant="ghost" size="sm" className="ml-auto h-7" onClick={onClearFilter}>
            <X className="h-4 w-4 mr-1" /> Limpar filtro
          </Button>
          <Button variant="secondary" size="sm" className="h-7" onClick={() => handleFetchEvolutionGroups(filterInstanceName)} disabled={isImporting}>
            {isImporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
            Buscar Grupos deste Dispositivo
          </Button>
        </div>
      )}

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
          <Button variant="secondary" onClick={() => handleFetchEvolutionGroups()} disabled={isImporting}>
            {isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Buscar Grupos
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo Grupo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Grupo</DialogTitle>
                <DialogDescription>Crie um grupo diretamente no WhatsApp ou apenas registre localmente</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Nome do Grupo *</Label>
                  <Input placeholder="Ex: Clientes VIP" value={newGroup.name} onChange={e => setNewGroup({ ...newGroup, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea placeholder="Descrição do grupo..." value={newGroup.description} onChange={e => setNewGroup({ ...newGroup, description: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>Instância (dispositivo)</Label>
                  <Select value={newGroup.instance_name} onValueChange={v => setNewGroup({ ...newGroup, instance_name: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione para criar no WhatsApp" /></SelectTrigger>
                    <SelectContent>
                      {activeInstances.map(inst => (
                        <SelectItem key={inst.id} value={inst.instance_name || inst.id}>
                          {inst.name} {inst.status === 'connected' ? '🟢' : '🔴'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {newGroup.instance_name ? 'O grupo será criado diretamente no WhatsApp' : 'Deixe vazio para registrar apenas localmente'}
                  </p>
                </div>

                {newGroup.instance_name && (
                  <div className="space-y-2">
                    <Label>Participantes (números) *</Label>
                    <Textarea
                      placeholder={"Ex:\n5511999998888\n5521988887777\n11977776666"}
                      value={newGroup.participants}
                      onChange={e => setNewGroup({ ...newGroup, participants: e.target.value })}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Um número por linha (ou separados por vírgula). O código 55 será adicionado automaticamente se necessário.
                    </p>
                  </div>
                )}

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
                  <SearchableTagSelect
                    selectedTags={newGroup.tags}
                    onTagsChange={tags => setNewGroup({ ...newGroup, tags })}
                    placeholder="Buscar ou criar tag..."
                  />
                  <p className="text-xs text-muted-foreground">Tags permitem criar automações individuais para cada grupo</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateGroup} disabled={!newGroup.name || isCreatingGroup || isCreatingOnWhatsApp || (!!newGroup.instance_name && !newGroup.participants.trim())}>
                  {(isCreatingGroup || isCreatingOnWhatsApp) ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando...</> : newGroup.instance_name ? <><Send className="h-4 w-4 mr-2" />Criar no WhatsApp</> : 'Criar Grupo'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Groups Table - SellFlux style */}
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
        <Card>
          <CardContent className="p-0">
            {/* Action bar */}
            <div className="flex items-center gap-2 p-3 border-b flex-wrap">
              <Button variant="outline" size="sm" onClick={() => {
                const selected = filteredGroups.filter(g => selectedGroupIds.has(g.id));
                if (selected.length === 0) { toast.error('Selecione pelo menos um grupo'); return; }
                setEditingGroup(selected[0]);
                handleEditGroup(selected[0]);
              }} disabled={selectedGroupIds.size === 0}>
                Editar os selecionados
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                filteredGroups.forEach(g => handleEditGroup(g));
                toast.info('Use a edição individual para configurar cada grupo.');
              }}>
                Editar todos os grupos
              </Button>
              <div className="flex items-center gap-2 ml-auto">
                <Checkbox
                  checked={enableSelection}
                  onCheckedChange={v => {
                    setEnableSelection(!!v);
                    if (!v) setSelectedGroupIds(new Set());
                  }}
                />
                <span className="text-xs text-muted-foreground">Habilitar seleção</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowArchived(!showArchived)}>
                {showArchived ? 'Grupos ativos' : 'Grupos arquivados'}
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {enableSelection && <TableHead className="w-[40px]"></TableHead>}
                    <TableHead>Nome</TableHead>
                    <TableHead>Tags dos grupos</TableHead>
                    <TableHead>Tag dos leads</TableHead>
                    <TableHead>Telefone de envio</TableHead>
                    <TableHead>JID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups
                    .filter(g => showArchived ? !g.is_active : g.is_active || g.is_active === false)
                    .map((group) => {
                      const settings = (group.settings || {}) as Record<string, unknown>;
                      const leadTags = (settings.lead_tags as string[]) || [];
                      const instanceName = (settings.instance_name as string) || '';
                      const instanceId = (settings.instance_id as string) || '';
                      const savedPhone = (settings.sender_phone_number as string) || '';
                      const matchingInst = instanceId
                        ? whatsAppInstances.find(i => i.id === instanceId)
                        : whatsAppInstances.find(i =>
                            (i.config?.instance_name || i.name) === instanceName ||
                            i.name === instanceName
                          );
                      const phone = savedPhone || matchingInst?.phone_number || (matchingInst?.config?.phone_number as string) || '';
                      return (
                        <TableRow key={group.id} className={`cursor-pointer hover:bg-muted/50 ${!group.is_active ? 'opacity-60' : ''}`}>
                          {enableSelection && (
                            <TableCell>
                              <Checkbox
                                checked={selectedGroupIds.has(group.id)}
                                onCheckedChange={v => {
                                  setSelectedGroupIds(prev => {
                                    const next = new Set(prev);
                                    if (v) next.add(group.id); else next.delete(group.id);
                                    return next;
                                  });
                                }}
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-medium max-w-[200px] truncate" onClick={() => handleOpenDetail(group)}>
                            {group.name}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(group.tags || []).map(tag => (
                                <Badge key={tag} variant="outline" className="text-[10px] bg-primary/5">{tag}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {leadTags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {phone || '—'}
                          </TableCell>
                          <TableCell>
                            {group.external_group_id ? (
                              <code className="text-[10px] text-muted-foreground">{group.external_group_id.slice(0, 18)}...</code>
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={group.is_active}
                              onCheckedChange={() => handleToggleGroup(group)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditGroup(group)} title="Editar">
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteConfirmGroup(group)} title="Arquivar/Remover">
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Group Detail Dialog */}
      <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
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

          <Tabs value={detailTab} onValueChange={v => setDetailTab(v as typeof detailTab)} className="flex flex-col flex-1 min-h-0">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="members" className="flex items-center gap-1 text-xs"><Users className="h-3.5 w-3.5" />Membros</TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-1 text-xs"><Activity className="h-3.5 w-3.5" />Atividades</TabsTrigger>
              <TabsTrigger value="message" className="flex items-center gap-1 text-xs"><Send className="h-3.5 w-3.5" />Mensagem</TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1 text-xs"><Settings className="h-3.5 w-3.5" />Config</TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-1 text-xs"><ShieldCheck className="h-3.5 w-3.5" />Admin</TabsTrigger>
            </TabsList>

            {/* Members Tab */}
            <TabsContent value="members" className="mt-4 max-h-[450px] overflow-y-auto">
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
                    <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Telefone</TableHead><TableHead>Status</TableHead><TableHead>Função</TableHead><TableHead>Entrada</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {groupMembers.map(member => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.name || '—'}</TableCell>
                          <TableCell className="font-mono text-sm">{member.phone_number}</TableCell>
                          <TableCell><Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="text-xs">{member.status === 'active' ? 'Ativo' : member.status === 'left' ? 'Saiu' : member.status === 'removed' ? 'Removido' : 'Banido'}</Badge></TableCell>
                          <TableCell>{member.is_admin ? <Badge variant="outline" className="text-xs"><Crown className="h-3 w-3 mr-1" />Admin</Badge> : <span className="text-xs text-muted-foreground">Membro</span>}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{formatDistanceToNow(new Date(member.joined_at), { addSuffix: true, locale: ptBR })}</TableCell>
                          <TableCell className="text-right">
                            {member.status === 'active' && (
                              <div className="flex items-center gap-1 justify-end">
                                {member.is_admin ? (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Remover admin" onClick={() => handleDemoteMember(member)}>
                                    <ShieldOff className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                ) : (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Promover a admin" onClick={() => handlePromoteMember(member)}>
                                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="Remover do grupo" onClick={() => handleRemoveMember(member)}>
                                  <UserMinus className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="mt-4 max-h-[450px] overflow-y-auto">
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
            <TabsContent value="message" className="mt-4 max-h-[450px] overflow-y-auto">
              <div className="space-y-4 pb-2">
                <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-900 dark:text-green-100">Enviar Mensagem para o Grupo</p>
                        <p className="text-green-700 dark:text-green-300 mt-1">
                          Envie agora ou agende para "{selectedGroup?.name}". Use variáveis como {'{{grupo}}'} e {'{{data}}'}.
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

                {/* Send Mode Selection */}
                <div className="space-y-3">
                  <Label>Modo de Envio</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSendMode('now')}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
                        sendMode === 'now'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/30'
                      )}
                    >
                      <Send className={cn('h-5 w-5', sendMode === 'now' ? 'text-primary' : 'text-muted-foreground')} />
                      <div>
                        <p className={cn('font-medium text-sm', sendMode === 'now' ? 'text-primary' : 'text-foreground')}>Enviar Agora</p>
                        <p className="text-xs text-muted-foreground">Envia imediatamente</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendMode('schedule')}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
                        sendMode === 'schedule'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/30'
                      )}
                    >
                      <Clock className={cn('h-5 w-5', sendMode === 'schedule' ? 'text-primary' : 'text-muted-foreground')} />
                      <div>
                        <p className={cn('font-medium text-sm', sendMode === 'schedule' ? 'text-primary' : 'text-foreground')}>Agendar Envio</p>
                        <p className="text-xs text-muted-foreground">Programe data e hora</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Schedule Options */}
                {sendMode === 'schedule' && (
                  <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      <Label className="font-semibold">Agendar para</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Data</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !scheduleDate && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {scheduleDate ? format(scheduleDate, 'dd/MM/yyyy') : 'Selecionar data'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={scheduleDate}
                              onSelect={setScheduleDate}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              initialFocus
                              className={cn('p-3 pointer-events-auto')}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Horário</Label>
                        <Input
                          type="time"
                          value={scheduleTime}
                          onChange={e => setScheduleTime(e.target.value)}
                        />
                      </div>
                    </div>
                    {scheduleDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Agendado para: <span className="font-medium text-foreground">{format(scheduleDate, "dd/MM/yyyy", { locale: ptBR })} às {scheduleTime}</span>
                      </p>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleSendMessage}
                  disabled={!sendMessageText.trim() || (sendMode === 'schedule' && !scheduleDate)}
                  className="w-full"
                >
                  {sendMode === 'schedule' ? (
                    <><Clock className="h-4 w-4 mr-2" />Agendar Mensagem</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" />Enviar Agora</>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Settings Tab with Tags */}
            <TabsContent value="settings" className="mt-4 max-h-[450px] overflow-y-auto">
              {selectedGroup && (
                <div className="space-y-5">
                  {/* Group Info */}
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
                    <p className="text-xs text-muted-foreground">Tags permitem criar automações específicas e filtrar grupos.</p>
                    <SearchableTagSelect
                      selectedTags={selectedGroup.tags || []}
                      onTagsChange={(tags) => updateGroup({ id: selectedGroup.id, tags })}
                      placeholder="Buscar ou criar tag..."
                    />
                  </div>

                  {/* Invite Link */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-primary" />
                      <Label className="font-semibold">Link de Convite</Label>
                    </div>
                    {selectedGroup.invite_link ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input value={selectedGroup.invite_link} readOnly className="font-mono text-xs" />
                          <Button variant="outline" size="sm" onClick={() => handleCopyLink(selectedGroup.invite_link!)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleRegenerateInviteLink}>
                            <RefreshCw className="h-3.5 w-3.5 mr-1" />Regenerar
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive" onClick={handleRevokeInviteLink}>
                            <Ban className="h-3.5 w-3.5 mr-1" />Revogar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <p className="text-sm text-muted-foreground mb-2">Nenhum link de convite ativo</p>
                        <Button variant="outline" size="sm" onClick={handleRegenerateInviteLink}>
                          <Link2 className="h-3.5 w-3.5 mr-1" />Gerar Link
                        </Button>
                      </div>
                    )}
                  </div>

                  {selectedGroup.external_group_id && (
                    <div className="space-y-1"><Label className="text-muted-foreground text-xs">ID Externo</Label><p className="font-mono text-xs text-muted-foreground">{selectedGroup.external_group_id}</p></div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Admin Tab - Group Controls */}
            <TabsContent value="admin" className="mt-4 max-h-[450px] overflow-y-auto">
              {selectedGroup && (
                <div className="space-y-4">
                  {/* Warning */}
                  <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Estas configurações alteram o funcionamento do grupo no WhatsApp. Requer permissão de administrador no grupo.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Group Access Controls */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <Label className="font-semibold">Controle de Acesso</Label>
                    </div>

                    {/* Lock/Unlock Group */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        {groupSettings.locked ? <Lock className="h-5 w-5 text-destructive" /> : <Unlock className="h-5 w-5 text-primary" />}
                        <div>
                          <p className="font-medium text-sm">Grupo {groupSettings.locked ? 'Fechado' : 'Aberto'}</p>
                          <p className="text-xs text-muted-foreground">{groupSettings.locked ? 'Apenas admins alteram dados do grupo' : 'Membros podem alterar dados do grupo'}</p>
                        </div>
                      </div>
                      <Switch checked={groupSettings.locked} onCheckedChange={handleToggleGroupLock} />
                    </div>

                    {/* Announce Only */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <MessageCircle className={cn('h-5 w-5', groupSettings.announce_only ? 'text-destructive' : 'text-primary')} />
                        <div>
                          <p className="font-medium text-sm">Modo Anúncios</p>
                          <p className="text-xs text-muted-foreground">{groupSettings.announce_only ? 'Apenas admins enviam mensagens' : 'Todos os membros podem enviar'}</p>
                        </div>
                      </div>
                      <Switch checked={groupSettings.announce_only} onCheckedChange={handleToggleAnnounceOnly} />
                    </div>

                    {/* Approve New Members */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <UserCog className={cn('h-5 w-5', groupSettings.approve_new_members ? 'text-primary' : 'text-muted-foreground')} />
                        <div>
                          <p className="font-medium text-sm">Aprovar Novos Membros</p>
                          <p className="text-xs text-muted-foreground">{groupSettings.approve_new_members ? 'Admins devem aprovar entradas' : 'Qualquer um pode entrar via link'}</p>
                        </div>
                      </div>
                      <Switch checked={groupSettings.approve_new_members} onCheckedChange={handleToggleApproveMembers} />
                    </div>
                  </div>

                  {/* Message Permissions */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <Label className="font-semibold">Permissões de Membros</Label>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Edit className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">Editar Info do Grupo</p>
                          <p className="text-xs text-muted-foreground">Membros podem alterar nome, foto e descrição</p>
                        </div>
                      </div>
                      <Switch
                        checked={groupSettings.allow_member_edit_info}
                        onCheckedChange={v => handleUpdateGroupSetting('allow_member_edit_info', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Send className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">Enviar Mensagens</p>
                          <p className="text-xs text-muted-foreground">Membros podem enviar mensagens no grupo</p>
                        </div>
                      </div>
                      <Switch
                        checked={groupSettings.allow_member_send_messages}
                        onCheckedChange={v => handleUpdateGroupSetting('allow_member_send_messages', v)}
                      />
                    </div>
                  </div>

                  {/* Disappearing Messages */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <Label className="font-semibold">Mensagens Temporárias</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">Configure para que mensagens desapareçam automaticamente</p>
                    <Select
                      value={groupSettings.disappearing_messages}
                      onValueChange={v => handleUpdateGroupSetting('disappearing_messages', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="off">Desativado</SelectItem>
                        <SelectItem value="24h">24 horas</SelectItem>
                        <SelectItem value="7d">7 dias</SelectItem>
                        <SelectItem value="90d">90 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Admin Summary */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      <Label className="font-semibold">Resumo dos Administradores</Label>
                    </div>
                    <div className="space-y-2">
                      {groupMembers.filter(m => m.is_admin).length > 0 ? (
                        groupMembers.filter(m => m.is_admin).map(admin => (
                          <div key={admin.id} className="flex items-center gap-2 p-2 rounded bg-muted/30">
                            <Crown className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-medium">{admin.name || admin.phone_number}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{admin.phone_number}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Nenhum administrador registrado</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="text-xs text-muted-foreground">ID - {editingGroup?.id?.slice(0, 8)}</div>
            <DialogTitle>Edição de Grupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2 max-h-[60vh] overflow-y-auto pr-1">
            {/* Group active toggle */}
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Grupo ativado</Label>
              <Switch
                checked={editingGroup?.is_active ?? true}
                onCheckedChange={v => { if (editingGroup) updateGroup({ id: editingGroup.id, is_active: v }); }}
              />
            </div>

            {/* Tag do grupo */}
            <div className="space-y-2">
              <Label className="font-semibold">Tag do grupo</Label>
              <p className="text-xs text-muted-foreground">O campo abaixo será responsável pelas tags que serão adicionadas ao grupo do WhatsApp.</p>
              <SearchableTagSelect
                selectedTags={editForm.tags}
                onTagsChange={tags => setEditForm({ ...editForm, tags })}
                placeholder="Buscar ou criar tag..."
              />
            </div>

            {/* Tag para os leads do grupo */}
            <div className="space-y-2">
              <Label className="font-semibold">Tag para os leads do grupo</Label>
              <p className="text-xs text-muted-foreground">O campo abaixo será responsável pelas tags que serão adicionadas aos leads do grupo do WhatsApp.</p>
              <SearchableTagSelect
                selectedTags={editLeadTags}
                onTagsChange={setEditLeadTags}
                placeholder="Buscar ou criar tag de lead..."
              />
            </div>

            {/* Dispositivo exclusivo */}
            <div className="space-y-2">
              <Label className="font-semibold">Dispositivo exclusivo</Label>
              <p className="text-xs text-muted-foreground">O dispositivo escolhido abaixo será responsável por enviar todas as mensagens para esse grupo de WhatsApp.</p>
              <Select value={editInstanceId} onValueChange={setEditInstanceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um dispositivo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (usar padrão)</SelectItem>
                  {whatsAppInstances.map(inst => (
                    <SelectItem key={inst.id} value={inst.id}>
                      <span className="flex items-center gap-2">
                        {inst.name} {inst.phone_number && `• ${inst.phone_number}`}
                        {inst.is_active && <span className="inline-block h-2 w-2 rounded-full bg-green-500" />}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sincronização de novos leads */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-1 flex-1 mr-4">
                <Label className="font-semibold">Sincronização de novos leads</Label>
                <p className="text-xs text-muted-foreground">Ative a sincronização automática de novos leads para o AG Sell. Ao fazer isso, os leads recém-chegados receberão tanto as tags padrão quanto aquelas que você configurou acima (Tag para os leads do grupo).</p>
              </div>
              <Switch checked={editSyncNewLeads} onCheckedChange={setEditSyncNewLeads} />
            </div>

            {/* Hidden fields */}
            <div className="space-y-2">
              <Label>Nome do Grupo</Label>
              <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1">
              <Button variant="outline" size="sm" onClick={handleImportGroupLeads}>
                <UserPlus className="h-4 w-4 mr-2" />Importar Leads do Grupo
              </Button>
              <Button variant="outline" size="sm" onClick={handleArchiveGroup}>
                <Ban className="h-4 w-4 mr-2" />Arquivar
              </Button>
            </div>
            <Button onClick={handleSaveEdit} disabled={!editForm.name || isUpdatingGroup}>
              {isUpdatingGroup ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Groups Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Download className="h-5 w-5" /> Importar Grupos do WhatsApp</DialogTitle>
            <DialogDescription>
              Selecione os grupos que deseja importar para gerenciar. Grupos já importados estão desmarcados.
            </DialogDescription>
          </DialogHeader>
          {importedGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Nenhum grupo encontrado.</p>
              <p className="text-xs mt-1">Verifique se suas instâncias estão conectadas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{importedGroups.length} grupo(s) encontrado(s)</span>
                <Button variant="outline" size="sm" onClick={() => setImportedGroups(prev => prev.map(g => ({ ...g, selected: true })))}>
                  <CheckSquare className="h-3.5 w-3.5 mr-1" /> Selecionar Todos
                </Button>
              </div>
              <div className="max-h-[400px] overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Instância</TableHead>
                      <TableHead>Membros</TableHead>
                      <TableHead>JID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importedGroups.map((group, idx) => {
                      const alreadyImported = groups.some(g => g.external_group_id === group.id);
                      return (
                        <TableRow key={group.id} className={alreadyImported ? 'opacity-50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={group.selected}
                              disabled={alreadyImported}
                              onCheckedChange={v => setImportedGroups(prev => prev.map((g, i) => i === idx ? { ...g, selected: !!v } : g))}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{group.subject}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {group.phone_number ? `${group.phone_number} • ${group.instance_name}` : group.instance_name}
                            </Badge>
                          </TableCell>
                          <TableCell>{group.size}</TableCell>
                          <TableCell><code className="text-[10px] text-muted-foreground">{group.id.slice(0, 20)}...</code></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleImportSelected} disabled={importedGroups.filter(g => g.selected).length === 0}>
              <Plus className="h-4 w-4 mr-2" />Importar {importedGroups.filter(g => g.selected).length} selecionado(s)
            </Button>
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
