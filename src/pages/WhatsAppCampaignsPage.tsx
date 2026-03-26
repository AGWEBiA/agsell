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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus, Send, Clock, Play, Pause, Trash2, Eye, CheckCircle2, XCircle,
  Users, Megaphone, Calendar, Image, FileText, MessageSquare, Search,
  MoreVertical, Copy, BarChart3, Smartphone,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWhatsAppCampaigns } from '@/hooks/useWhatsAppCampaigns';
import { WhatsAppInstanceSelector } from '@/components/whatsapp/WhatsAppInstanceSelector';
import { useTags } from '@/hooks/useTags';
import { SearchableTagSelect } from '@/components/whatsapp/SearchableTagSelect';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TEMPLATE_VARS = ['{{nome}}', '{{telefone}}', '{{email}}'];

export default function WhatsAppCampaignsPage() {
  const { campaigns, isLoading, createCampaign, startCampaign, pauseCampaign, stopCampaign } = useWhatsAppCampaigns();
  const { tags } = useTags();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    message_content: '',
    media_url: '',
    message_type: 'text' as string,
    delay_between_messages: 3000,
    scheduled_at: '',
    filter_tags: [] as string[],
  });

  const filteredCampaigns = (campaigns || []).filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTab === 'running') return c.status === 'running';
    if (activeTab === 'completed') return c.status === 'completed';
    if (activeTab === 'draft') return c.status === 'draft';
    if (activeTab === 'scheduled') return c.status === 'scheduled';
    return true;
  });

  const handleCreate = () => {
    createCampaign({
      name: form.name,
      message_content: form.message_content,
      media_url: form.media_url || undefined,
      message_type: form.message_type,
      delay_between_messages: form.delay_between_messages,
      scheduled_at: form.scheduled_at || undefined,
      instance_id: selectedInstanceId || undefined,
    });
    setIsCreateOpen(false);
    setForm({
      name: '', message_content: '', media_url: '', message_type: 'text',
      delay_between_messages: 3000, scheduled_at: '', filter_tags: [],
    });
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    running: 'bg-green-500/10 text-green-400 border-green-500/20',
    paused: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    completed: 'bg-primary/10 text-primary border-primary/20',
    cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    scheduled: 'Agendado',
    running: 'Enviando',
    paused: 'Pausado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Campanhas WhatsApp 1:1
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie e programe envios de mensagens individuais para seus leads
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: campaigns?.length || 0, icon: Megaphone },
          { label: 'Ativas', value: campaigns?.filter(c => c.status === 'running').length || 0, icon: Play },
          { label: 'Agendadas', value: campaigns?.filter(c => c.status === 'scheduled').length || 0, icon: Clock },
          { label: 'Concluídas', value: campaigns?.filter(c => c.status === 'completed').length || 0, icon: CheckCircle2 },
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
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar campanha..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="draft">Rascunhos</TabsTrigger>
            <TabsTrigger value="scheduled">Agendadas</TabsTrigger>
            <TabsTrigger value="running">Ativas</TabsTrigger>
            <TabsTrigger value="completed">Concluídas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Campaign List */}
      <div className="grid gap-4">
        {filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">Nenhuma campanha encontrada</h3>
              <p className="text-muted-foreground mt-1">Crie sua primeira campanha de WhatsApp 1:1</p>
              <Button onClick={() => setIsCreateOpen(true)} className="mt-4 gap-2">
                <Plus className="h-4 w-4" /> Nova Campanha
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredCampaigns.map(campaign => (
            <Card key={campaign.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{campaign.name}</h3>
                      <p className="text-sm text-muted-foreground truncate max-w-md">
                        {campaign.message_content?.slice(0, 80)}...
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="outline" className={statusColors[campaign.status] || ''}>
                      {statusLabels[campaign.status] || campaign.status}
                    </Badge>

                    {campaign.total_recipients > 0 && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {campaign.messages_sent || 0}/{campaign.total_recipients}
                      </div>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {campaign.status === 'draft' && (
                          <DropdownMenuItem onClick={() => startCampaign(campaign.id)}>
                            <Play className="h-4 w-4 mr-2" /> Iniciar
                          </DropdownMenuItem>
                        )}
                        {campaign.status === 'running' && (
                          <DropdownMenuItem onClick={() => pauseCampaign(campaign.id)}>
                            <Pause className="h-4 w-4 mr-2" /> Pausar
                          </DropdownMenuItem>
                        )}
                        {campaign.status === 'paused' && (
                          <DropdownMenuItem onClick={() => startCampaign(campaign.id)}>
                            <Play className="h-4 w-4 mr-2" /> Retomar
                          </DropdownMenuItem>
                        )}
                        {['running', 'paused'].includes(campaign.status) && (
                          <DropdownMenuItem onClick={() => stopCampaign(campaign.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Cancelar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {campaign.scheduled_at && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Agendado para {format(new Date(campaign.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Campanha WhatsApp 1:1</DialogTitle>
            <DialogDescription>
              Configure a mensagem que será enviada individualmente para cada lead
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome da Campanha</Label>
              <Input
                placeholder="Ex: Promoção de Março"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div>
              <Label>Instância WhatsApp</Label>
              <WhatsAppInstanceSelector
                selectedInstanceId={selectedInstanceId}
                onSelect={setSelectedInstanceId}
              />
            </div>

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
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Olá {{nome}}, tudo bem?"
                value={form.message_content}
                onChange={e => setForm(f => ({ ...f, message_content: e.target.value }))}
                rows={5}
              />
              <div className="flex gap-1 mt-2 flex-wrap">
                {TEMPLATE_VARS.map(v => (
                  <Badge
                    key={v}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setForm(f => ({ ...f, message_content: f.message_content + ' ' + v }))}
                  >
                    {v}
                  </Badge>
                ))}
              </div>
            </div>

            {form.message_type !== 'text' && (
              <div>
                <Label>URL da Mídia</Label>
                <Input
                  placeholder="https://..."
                  value={form.media_url}
                  onChange={e => setForm(f => ({ ...f, media_url: e.target.value }))}
                />
              </div>
            )}

            <div>
              <Label>Intervalo entre mensagens (ms)</Label>
              <Input
                type="number"
                value={form.delay_between_messages}
                onChange={e => setForm(f => ({ ...f, delay_between_messages: Number(e.target.value) }))}
                min={1000}
                step={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recomendado: 3000ms (3s) para evitar bloqueios
              </p>
            </div>

            <div>
              <Label>Agendar Envio (opcional)</Label>
              <Input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
              />
            </div>

            <div>
              <Label>Filtrar por Tags (opcional)</Label>
              <SearchableTagSelect
                allTags={tags?.map(t => t.name) || []}
                selectedTags={form.filter_tags}
                onChange={tags => setForm(f => ({ ...f, filter_tags: tags }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Se nenhuma tag for selecionada, envia para todos os contatos com telefone válido
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.name || !form.message_content}>
              <Send className="h-4 w-4 mr-2" />
              Criar Campanha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
