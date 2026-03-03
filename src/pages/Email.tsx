import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Plus, Send, Eye, MousePointerClick, MoreHorizontal, Trash2, Edit, Users, Filter, Tag, GitBranch, Copy,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEmailCampaigns } from '@/hooks/useEmailCampaigns';
import { EmailTemplateEditor } from '@/components/email/EmailTemplateEditor';
import { PageHeader, EmptyState, FormField } from '@/components/ui/help-tooltip';
import { useTags } from '@/hooks/useTags';
import { usePipelineStages, useDeals } from '@/hooks/usePipeline';
import { useContacts } from '@/hooks/useContacts';
import { useOrganization } from '@/contexts/OrganizationContext';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  sending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  sent: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  paused: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  sending: 'Enviando',
  sent: 'Enviado',
  paused: 'Pausado',
};

type TargetType = 'all' | 'tags' | 'funnel' | 'manual';

export default function Email() {
  const { campaigns, isLoading, createCampaign, updateCampaign, deleteCampaign, sendCampaign } = useEmailCampaigns();
  const { data: tags } = useTags();
  const { data: stages } = usePipelineStages();
  const { data: deals } = useDeals();
  const { data: contacts } = useContacts();
  const { currentOrganization } = useOrganization();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<typeof campaigns[0] | null>(null);
  const [newCampaign, setNewCampaign] = useState({ name: '', subject: '' });
  const [editorContent, setEditorContent] = useState('[]');

  // Recipient filtering state
  const [targetType, setTargetType] = useState<TargetType>('all');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [contactSearch, setContactSearch] = useState('');

  const contactsWithEmail = useMemo(() =>
    (contacts || []).filter(c => c.email),
    [contacts]
  );

  const filteredContacts = useMemo(() => {
    if (!contactSearch) return contactsWithEmail;
    const q = contactSearch.toLowerCase();
    return contactsWithEmail.filter(c =>
      c.first_name.toLowerCase().includes(q) ||
      (c.last_name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  }, [contactsWithEmail, contactSearch]);

  const recipientCount = useMemo(() => {
    if (targetType === 'all') return contactsWithEmail.length;
    if (targetType === 'manual') return selectedContactIds.length;
    if (targetType === 'tags') return selectedTagIds.length > 0 ? '(filtrado por tags)' : 0;
    if (targetType === 'funnel') return selectedStageId ? '(filtrado por funil)' : 0;
    return 0;
  }, [targetType, contactsWithEmail, selectedContactIds, selectedTagIds, selectedStageId]);

  const handleCreate = () => {
    if (!newCampaign.name || !newCampaign.subject) return;
    createCampaign.mutate({
      name: newCampaign.name,
      subject: newCampaign.subject,
      content: null,
      status: 'draft',
    });
    setNewCampaign({ name: '', subject: '' });
    setTargetType('all');
    setSelectedTagIds([]);
    setSelectedStageId('');
    setSelectedContactIds([]);
    setIsDialogOpen(false);
  };

  const handleOpenEditor = (campaign: typeof campaigns[0]) => {
    setEditingCampaign(campaign);
    setEditorContent(campaign.content || '[]');
    setIsEditorOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!editingCampaign) return;
    updateCampaign.mutate({ id: editingCampaign.id, content: editorContent });
    setIsEditorOpen(false);
    setEditingCampaign(null);
  };

  const toggleTag = (id: string) =>
    setSelectedTagIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  const toggleContact = (id: string) =>
    setSelectedContactIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  const totalSent = campaigns.reduce((acc, c) => acc + (c.sent_count ?? 0), 0);
  const totalOpened = campaigns.reduce((acc, c) => acc + (c.open_count ?? 0), 0);
  const totalClicked = campaigns.reduce((acc, c) => acc + (c.click_count ?? 0), 0);
  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0';
  const clickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : '0';

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

  if (isEditorOpen && editingCampaign) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Editor de Template</h1>
            <p className="text-muted-foreground">Campanha: {editingCampaign.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveTemplate} disabled={updateCampaign.isPending}>
              {updateCampaign.isPending ? 'Salvando...' : 'Salvar Template'}
            </Button>
          </div>
        </div>
        <EmailTemplateEditor content={editorContent} onChange={setEditorContent} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="E-mail Marketing"
        description="Crie campanhas broadcast e envie para segmentos específicos"
        helpText="Crie campanhas, selecione destinatários por tag, funil ou manualmente, edite templates visuais e acompanhe métricas."
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nova Campanha</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Nova Campanha de E-mail</DialogTitle>
              <DialogDescription>Configure o conteúdo e selecione os destinatários.</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="content" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="recipients" className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />Destinatários
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Campanha</Label>
                  <Input id="name" placeholder="Ex: Black Friday 2026" value={newCampaign.name}
                    onChange={e => setNewCampaign(prev => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto do Email</Label>
                  <Input id="subject" placeholder="Ex: Ofertas Imperdíveis!" value={newCampaign.subject}
                    onChange={e => setNewCampaign(prev => ({ ...prev, subject: e.target.value }))} />
                </div>
              </TabsContent>

              <TabsContent value="recipients" className="mt-4 flex-1 overflow-hidden flex flex-col space-y-4">
                {/* Target type selector */}
                <div className="space-y-2">
                  <Label>Tipo de Segmentação</Label>
                  <Select value={targetType} onValueChange={v => setTargetType(v as TargetType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2"><Users className="h-4 w-4" />Todos os contatos com e-mail</div>
                      </SelectItem>
                      <SelectItem value="tags">
                        <div className="flex items-center gap-2"><Tag className="h-4 w-4" />Por Tags</div>
                      </SelectItem>
                      <SelectItem value="funnel">
                        <div className="flex items-center gap-2"><GitBranch className="h-4 w-4" />Por Funil (Estágio)</div>
                      </SelectItem>
                      <SelectItem value="manual">
                        <div className="flex items-center gap-2"><Filter className="h-4 w-4" />Seleção Manual</div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* All contacts */}
                {targetType === 'all' && (
                  <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">{contactsWithEmail.length} contatos com e-mail</p>
                          <p className="text-xs text-muted-foreground">Todos receberão esta campanha</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tags filter */}
                {targetType === 'tags' && (
                  <div className="space-y-2">
                    <Label>Selecione as Tags</Label>
                    <ScrollArea className="h-48 border rounded-md p-3">
                      {tags && tags.length > 0 ? (
                        <div className="space-y-2">
                          {tags.map(tag => (
                            <div key={tag.id} className="flex items-center gap-2">
                              <Checkbox checked={selectedTagIds.includes(tag.id)}
                                onCheckedChange={() => toggleTag(tag.id)} />
                              <div className="flex items-center gap-2">
                                {tag.color && <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />}
                                <span className="text-sm">{tag.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tag encontrada</p>
                      )}
                    </ScrollArea>
                    {selectedTagIds.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectedTagIds.map(id => {
                          const tag = tags?.find(t => t.id === id);
                          return tag ? <Badge key={id} variant="secondary" className="text-xs">{tag.name}</Badge> : null;
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Funnel filter */}
                {targetType === 'funnel' && (
                  <div className="space-y-2">
                    <Label>Estágio do Funil</Label>
                    <Select value={selectedStageId} onValueChange={setSelectedStageId}>
                      <SelectTrigger><SelectValue placeholder="Selecione um estágio" /></SelectTrigger>
                      <SelectContent>
                        {stages?.map(stage => (
                          <SelectItem key={stage.id} value={stage.id}>
                            <div className="flex items-center gap-2">
                              {stage.color && <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} />}
                              {stage.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedStageId && (
                      <p className="text-xs text-muted-foreground">
                        Contatos vinculados a deals neste estágio receberão o e-mail.
                      </p>
                    )}
                  </div>
                )}

                {/* Manual selection */}
                {targetType === 'manual' && (
                  <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between">
                      <Label>Selecione os Contatos</Label>
                      <Badge variant="outline" className="text-xs">{selectedContactIds.length} selecionados</Badge>
                    </div>
                    <Input placeholder="Buscar por nome ou e-mail..." value={contactSearch}
                      onChange={e => setContactSearch(e.target.value)} />
                    <ScrollArea className="flex-1 min-h-0 max-h-48 border rounded-md">
                      <div className="p-2 space-y-1">
                        {filteredContacts.map(contact => (
                          <div key={contact.id}
                            className="flex items-center gap-2 p-2 rounded hover:bg-accent/50 cursor-pointer"
                            onClick={() => toggleContact(contact.id)}>
                            <Checkbox checked={selectedContactIds.includes(contact.id)}
                              onCheckedChange={() => toggleContact(contact.id)} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {contact.first_name} {contact.last_name || ''}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                            </div>
                          </div>
                        ))}
                        {filteredContacts.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">Nenhum contato encontrado</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={createCampaign.isPending}>
                {createCampaign.isPending ? 'Criando...' : 'Criar Campanha'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Send className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSent.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Emails Enviados</p>
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
                <p className="text-2xl font-bold">{openRate}%</p>
                <p className="text-sm text-muted-foreground">Taxa de Abertura</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <MousePointerClick className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clickRate}%</p>
                <p className="text-sm text-muted-foreground">Taxa de Cliques</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <Send className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{campaigns.length}</p>
                <p className="text-sm text-muted-foreground">Campanhas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <EmptyState
              icon={<Send className="h-8 w-8 text-muted-foreground" />}
              title="Nenhuma campanha criada ainda"
              description="Campanhas de email permitem enviar mensagens em massa para seus contatos com templates visuais personalizados."
              action={
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />Criar Primeira Campanha
                </Button>
              }
              tips={[
                "Dê um nome e assunto para criar a campanha",
                "Selecione destinatários por tag, funil ou manualmente",
                "Use o editor visual para montar o template",
                "Agende o envio para o melhor horário"
              ]}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enviados</TableHead>
                  <TableHead>Abertos</TableHead>
                  <TableHead>Cliques</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const campaignOpenRate = (campaign.sent_count ?? 0) > 0
                    ? (((campaign.open_count ?? 0) / (campaign.sent_count ?? 1)) * 100).toFixed(1) : '0';
                  const campaignClickRate = (campaign.open_count ?? 0) > 0
                    ? (((campaign.click_count ?? 0) / (campaign.open_count ?? 1)) * 100).toFixed(1) : '0';

                  return (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[campaign.status ?? 'draft']} variant="secondary">
                          {statusLabels[campaign.status ?? 'draft']}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Send className="h-4 w-4 text-muted-foreground" />
                          {(campaign.sent_count ?? 0).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span>{(campaign.open_count ?? 0).toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">({campaignOpenRate}%)</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                          <span>{(campaign.click_count ?? 0).toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">({campaignClickRate}%)</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEditor(campaign)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEditor(campaign)}>
                                <Edit className="mr-2 h-4 w-4" />Editar Template
                              </DropdownMenuItem>
                              {campaign.status === 'draft' && (
                                <DropdownMenuItem onClick={() => sendCampaign.mutate(campaign.id)}>
                                  <Send className="mr-2 h-4 w-4" />Enviar Agora
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => {
                                createCampaign.mutate({
                                  name: `${campaign.name} (cópia)`,
                                  subject: campaign.subject,
                                  content: campaign.content,
                                  status: 'draft',
                                });
                              }}>
                                <Copy className="mr-2 h-4 w-4" />Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive"
                                onClick={() => deleteCampaign.mutate(campaign.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
