import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft, Plus, Trash2, Pause, Play, Settings, MousePointerClick,
  Copy, Pencil, CheckCircle2, XCircle, ChevronDown, ExternalLink, Link as LinkIcon, Tag
} from 'lucide-react';
import { useGroupRotator } from '@/hooks/useGroupRotator';
import { useTags } from '@/hooks/useTags';
import { toast } from 'sonner';

interface Props {
  campaignId: string;
  onBack: () => void;
}

export function GroupRotatorEntries({ campaignId, onBack }: Props) {
  const { campaigns, createEntry, updateEntry, deleteEntry, fetchEntries, updateCampaign } = useGroupRotator();
  const { data: tags = [] } = useTags();
  const campaign = campaigns.find((c: any) => c.id === campaignId);

  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const [slugDialogOpen, setSlugDialogOpen] = useState(false);
  const [routesDialogOpen, setRoutesDialogOpen] = useState(false);
  const [editEntryDialogOpen, setEditEntryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);

  // New link fields
  const [newName, setNewName] = useState('');
  const [newInviteLink, setNewInviteLink] = useState('');
  const [newMaxCapacity, setNewMaxCapacity] = useState('250');

  // Slug editing
  const [editSlug, setEditSlug] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  // Campaign settings
  const [clickLimit, setClickLimit] = useState('1000');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if (campaign) {
      setClickLimit(String(campaign.click_limit || 1000));
      setSelectedTags(campaign.tags || []);
    }
  }, [campaign]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await fetchEntries(campaignId);
      setEntries(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEntries(); }, [campaignId]);

  const publicLink = campaign ? `${window.location.origin}/r/${campaign.slug}` : '';

  const handleAddLink = () => {
    if (!newName || !newInviteLink) return;
    createEntry.mutate({
      campaign_id: campaignId,
      name: newName,
      invite_link: newInviteLink,
      max_capacity: parseInt(newMaxCapacity) || 0,
      max_clicks: 0,
      sort_order: entries.length,
    }, {
      onSuccess: () => {
        setAddLinkOpen(false);
        setNewName('');
        setNewInviteLink('');
        setNewMaxCapacity('250');
        loadEntries();
      },
    });
  };

  const handleCheckSlug = async () => {
    if (!editSlug) return;
    setCheckingSlug(true);
    try {
      const { data } = await (await import('@/integrations/supabase/client')).supabase
        .from('group_rotator_campaigns' as any)
        .select('id')
        .eq('slug', editSlug)
        .neq('id', campaignId)
        .limit(1);
      setSlugAvailable(!data || data.length === 0);
    } catch {
      setSlugAvailable(null);
    } finally {
      setCheckingSlug(false);
    }
  };

  const handleSaveSlug = () => {
    if (!slugAvailable || !editSlug) return;
    updateCampaign.mutate({ id: campaignId, slug: editSlug } as any, {
      onSuccess: () => {
        setSlugDialogOpen(false);
        setSlugAvailable(null);
      },
    });
  };

  const handleSaveCampaign = () => {
    updateCampaign.mutate({
      id: campaignId,
      click_limit: parseInt(clickLimit) || 1000,
      tags: selectedTags,
    } as any);
  };

  const openEditEntry = (entry: any) => {
    setEditingEntry({ ...entry });
    setEditEntryDialogOpen(true);
  };

  const handleSaveEntry = () => {
    if (!editingEntry) return;
    updateEntry.mutate({
      id: editingEntry.id,
      name: editingEntry.name,
      invite_link: editingEntry.invite_link,
      max_capacity: editingEntry.max_capacity,
      max_clicks: editingEntry.max_clicks,
    }, {
      onSuccess: () => {
        setEditEntryDialogOpen(false);
        setEditingEntry(null);
        loadEntries();
      },
    });
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              LINK || {campaign?.name || 'Campanha'}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Adicione os links de todos os seus grupos de WhatsApp para serem enchidos sequencialmente baseado no total de cliques que o link recebeu para um dado grupo.
          </p>
        </div>
      </div>

      {/* Main card */}
      <Card className="border-border">
        <CardContent className="pt-6 space-y-5">
          {/* Slug bar */}
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { setEditSlug(campaign?.slug || ''); setSlugAvailable(null); setSlugDialogOpen(true); }}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <code className="text-sm flex-1 truncate">/{campaign?.slug}</code>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => setRoutesDialogOpen(true)}>
              <Copy className="h-3.5 w-3.5" /> COPIAR LINK
            </Button>
          </div>

          {/* Click limit + Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Limite de Cliques</Label>
              <Input
                type="number"
                value={clickLimit}
                onChange={e => setClickLimit(e.target.value)}
                className="h-9"
              />
              <p className="text-[11px] text-muted-foreground">Quantidade de cliques antes de passar para o próximo grupo</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tag(s) do sistema</Label>
              <div className="flex flex-wrap gap-1.5 min-h-[36px] border rounded-md p-2 bg-background">
                {selectedTags.map(tagId => {
                  const tag = tags.find((t: any) => t.id === tagId);
                  return tag ? (
                    <Badge key={tagId} variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => handleToggleTag(tagId)}>
                      {tag.name} <XCircle className="h-3 w-3" />
                    </Badge>
                  ) : null;
                })}
                <Select onValueChange={handleToggleTag}>
                  <SelectTrigger className="h-6 w-6 p-0 border-none shadow-none">
                    <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.filter((t: any) => !selectedTags.includes(t.id)).map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-[11px] text-muted-foreground">Tags aplicadas aos leads que acessam o link</p>
            </div>
          </div>

          {/* Links list */}
          <div className="border rounded-lg">
            <div className="flex items-center justify-between p-3 border-b">
              <div>
                <p className="text-sm font-medium">Lista de links</p>
                <p className="text-[11px] text-muted-foreground">As rotas que estão vinculadas ao link</p>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAddLinkOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> NOVO LINK
              </Button>
            </div>

            <div className="divide-y">
              {loading ? (
                <p className="text-sm text-muted-foreground p-4">Carregando...</p>
              ) : entries.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">Nenhum grupo adicionado. Clique em "NOVO LINK" para começar.</p>
              ) : (
                entries.map((entry: any, idx: number) => {
                  const isFull = (entry.max_capacity > 0 && entry.member_count >= entry.max_capacity) ||
                    (entry.max_clicks > 0 && entry.click_count >= entry.max_clicks);
                  return (
                    <div key={entry.id} className={`flex items-center gap-3 p-3 ${entry.is_paused || isFull ? 'opacity-50' : ''}`}>
                      {/* Click count badge */}
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                        <span className="text-sm font-bold text-primary">{entry.click_count}</span>
                      </div>

                      {/* Group info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{entry.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{entry.invite_link}</p>
                        {isFull && <Badge variant="destructive" className="mt-1 text-[10px]">Lotado</Badge>}
                        {entry.is_paused && !isFull && <Badge variant="secondary" className="mt-1 text-[10px]">Pausado</Badge>}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                          updateEntry.mutate({ id: entry.id, is_paused: !entry.is_paused }, { onSuccess: loadEntries });
                        }}>
                          {entry.is_paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditEntry(entry)}>
                          <Settings className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                          deleteEntry.mutate(entry.id, { onSuccess: loadEntries });
                        }}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Advanced settings */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                Configurações avançadas
                <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Campanha ativa</Label>
                  <p className="text-xs text-muted-foreground">Desativar impede novos redirecionamentos</p>
                </div>
                <Switch
                  checked={campaign?.is_active ?? true}
                  onCheckedChange={(checked) => updateCampaign.mutate({ id: campaignId, is_active: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label>Estratégia de rotação</Label>
                <Select defaultValue="round-robin">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round-robin">Round-robin (sequencial)</SelectItem>
                    <SelectItem value="random">Aleatório</SelectItem>
                    <SelectItem value="least-members">Menos membros primeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Save button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveCampaign} className="gap-1.5">
              💾 SALVAR
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Slug Edit Dialog */}
      <Dialog open={slugDialogOpen} onOpenChange={setSlugDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edição do Slug do Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Slug</Label>
              <p className="text-xs text-muted-foreground">É o código do link que acompanha o domínio</p>
              <div className="flex items-center gap-2">
                {slugAvailable === true && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                {slugAvailable === false && <XCircle className="h-5 w-5 text-destructive shrink-0" />}
                <div className="flex items-center flex-1 border rounded-md overflow-hidden">
                  <span className="px-2 text-sm text-muted-foreground bg-muted border-r">/</span>
                  <Input
                    value={editSlug}
                    onChange={e => { setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); setSlugAvailable(null); }}
                    className="border-0 rounded-none"
                    placeholder="seu-slug"
                  />
                </div>
                <Button size="sm" onClick={handleCheckSlug} disabled={checkingSlug || !editSlug} className="gap-1 shrink-0">
                  🔍 VERIFICAR
                </Button>
              </div>
              {slugAvailable === true && <p className="text-xs text-green-600">Slug disponível!</p>}
              {slugAvailable === false && <p className="text-xs text-destructive">Slug já em uso. Escolha outro.</p>}
            </div>
            <Button onClick={handleSaveSlug} disabled={!slugAvailable} className="gap-1.5">
              💾 SALVAR
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Routes/Copy Link Dialog */}
      <Dialog open={routesDialogOpen} onOpenChange={setRoutesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rotas</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Primary route */}
            <div className="border rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <code className="text-sm truncate flex-1">{publicLink}</code>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { navigator.clipboard.writeText(publicLink); toast.success('Link copiado!'); }}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="text-[11px] text-green-600">ativo</span>
              </div>
            </div>

            {/* API route */}
            <div className="border rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <code className="text-sm truncate flex-1">{import.meta.env.VITE_SUPABASE_URL}/functions/v1/group-rotator/{campaign?.slug}</code>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => {
                  navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/group-rotator/${campaign?.slug}`);
                  toast.success('Link da API copiado!');
                }}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="text-[11px] text-green-600">ativo</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={() => setRoutesDialogOpen(false)}>
              VOLTAR
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Link Dialog */}
      <Dialog open={addLinkOpen} onOpenChange={setAddLinkOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Grupo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Grupo</Label>
              <Input placeholder="Ex: Grupo VIP 1" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Link de Convite do WhatsApp</Label>
              <Input placeholder="https://chat.whatsapp.com/..." value={newInviteLink} onChange={e => setNewInviteLink(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Capacidade Máxima</Label>
              <Input type="number" value={newMaxCapacity} onChange={e => setNewMaxCapacity(e.target.value)} />
              <p className="text-xs text-muted-foreground">0 = sem limite</p>
            </div>
            <Button onClick={handleAddLink} disabled={createEntry.isPending || !newName || !newInviteLink} className="w-full">
              Adicionar Grupo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={editEntryDialogOpen} onOpenChange={setEditEntryDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Grupo</DialogTitle></DialogHeader>
          {editingEntry && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Grupo</Label>
                <Input value={editingEntry.name} onChange={e => setEditingEntry({ ...editingEntry, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Link de Convite</Label>
                <Input value={editingEntry.invite_link} onChange={e => setEditingEntry({ ...editingEntry, invite_link: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Capacidade Máx.</Label>
                  <Input type="number" value={editingEntry.max_capacity} onChange={e => setEditingEntry({ ...editingEntry, max_capacity: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Máx. Cliques</Label>
                  <Input type="number" value={editingEntry.max_clicks} onChange={e => setEditingEntry({ ...editingEntry, max_clicks: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Cliques atuais: <strong>{editingEntry.click_count}</strong> · Membros: <strong>{editingEntry.member_count}</strong>
              </div>
              <Button onClick={handleSaveEntry} className="w-full">💾 Salvar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
