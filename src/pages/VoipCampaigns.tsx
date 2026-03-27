import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Volume2, Plus, Play, Pause, Trash2, Clock, Users, Phone,
  CheckCircle2, XCircle, Loader2, Calendar, Tag, Upload, BarChart3,
  FileAudio, X,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTags } from '@/hooks/useTags';
import { useCommunicationCredits } from '@/hooks/useCommunicationCredits';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SearchableTagSelect } from '@/components/whatsapp/SearchableTagSelect';

interface VoipCampaign {
  id: string;
  organization_id: string;
  user_id: string;
  name: string;
  audio_url: string;
  fallback_message: string | null;
  status: string;
  target_tags: string[];
  target_count: number;
  sent_count: number;
  answered_count: number;
  failed_count: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  credits_per_call: number;
  created_at: string;
}

const VoipCampaigns = () => {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { tags } = useTags();
  const { credits } = useCommunicationCredits();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [audioFileName, setAudioFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    audio_url: '',
    fallback_message: '',
    target_tags: [] as string[],
    scheduled_at: '',
    credits_per_call: 1,
  });

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato não suportado. Use MP3, WAV, OGG ou M4A.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 20MB.');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'mp3';
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('voip-audio')
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('voip-audio')
        .getPublicUrl(filePath);

      setCampaignForm(f => ({ ...f, audio_url: urlData.publicUrl }));
      setAudioFileName(file.name);
      toast.success('Áudio enviado com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar áudio');
    } finally {
      setUploading(false);
    }
  };

  // Fetch campaigns
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['voip-campaigns', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('voip_campaigns')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as VoipCampaign[];
    },
    enabled: !!orgId,
  });

  // Count contacts by tags
  const { data: contactCount = 0 } = useQuery({
    queryKey: ['voip-campaign-contact-count', orgId, campaignForm.target_tags],
    queryFn: async () => {
      if (!orgId || campaignForm.target_tags.length === 0) return 0;
      const { count, error } = await supabase
        .from('contact_tags')
        .select('contact_id', { count: 'exact', head: true })
        .in('tag_id', campaignForm.target_tags);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!orgId && campaignForm.target_tags.length > 0,
  });

  // Create campaign
  const estimatedCredits = contactCount * campaignForm.credits_per_call;
  const hasEnoughCredits = (credits?.balance ?? 0) >= estimatedCredits;

  const createCampaign = useMutation({
    mutationFn: async () => {
      if (!user || !orgId) throw new Error('Não autenticado');
      if (!hasEnoughCredits) throw new Error(`Saldo insuficiente. Necessário: ${estimatedCredits} créditos, disponível: ${credits?.balance ?? 0}`);
      const { data, error } = await supabase
        .from('voip_campaigns')
        .insert({
          organization_id: orgId,
          user_id: user.id,
          name: campaignForm.name,
          audio_url: campaignForm.audio_url,
          fallback_message: campaignForm.fallback_message || null,
          target_tags: campaignForm.target_tags,
          target_count: contactCount,
          credits_per_call: campaignForm.credits_per_call,
          scheduled_at: campaignForm.scheduled_at || null,
          status: campaignForm.scheduled_at ? 'scheduled' : 'draft',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voip-campaigns'] });
      setShowCreateDialog(false);
      setCampaignForm({ name: '', audio_url: '', fallback_message: '', target_tags: [], scheduled_at: '', credits_per_call: 1 });
      toast.success('Campanha de torpedo de voz criada!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Start campaign
  const startCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from('voip_campaigns')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', campaignId);
      if (error) throw error;

      // Trigger edge function to process
      await supabase.functions.invoke('process-voip-campaign', {
        body: { campaignId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voip-campaigns'] });
      toast.success('Campanha iniciada!');
    },
    onError: () => toast.error('Erro ao iniciar campanha'),
  });

  // Delete campaign
  const deleteCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from('voip_campaigns')
        .delete()
        .eq('id', campaignId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voip-campaigns'] });
      toast.success('Campanha excluída!');
    },
    onError: () => toast.error('Erro ao excluir campanha'),
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      draft: { label: 'Rascunho', variant: 'secondary' },
      scheduled: { label: 'Agendada', variant: 'outline' },
      processing: { label: 'Enviando...', variant: 'default' },
      completed: { label: 'Concluída', variant: 'default' },
      paused: { label: 'Pausada', variant: 'secondary' },
      failed: { label: 'Falhou', variant: 'destructive' },
    };
    const info = map[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Volume2 className="h-6 w-6 text-primary" />
            Torpedo de Voz
          </h1>
          <p className="text-muted-foreground mt-1">
            Envie mensagens de áudio em massa para listas de leads
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova Campanha
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Campanhas</CardTitle>
            <Volume2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Enviados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.reduce((a, c) => a + (c.sent_count || 0), 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Atendidas</CardTitle>
            <Phone className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.reduce((a, c) => a + (c.answered_count || 0), 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo VoIP</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{credits?.balance?.toLocaleString('pt-BR') ?? '0'}</div>
            <p className="text-xs text-muted-foreground">créditos disponíveis</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campanhas</CardTitle>
          <CardDescription>Gerencie suas campanhas de torpedo de voz</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Volume2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">Nenhuma campanha criada</h3>
              <p className="text-sm text-muted-foreground mb-4">Crie sua primeira campanha de torpedo de voz para enviar áudio em massa para leads.</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" /> Criar Campanha
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Enviados</TableHead>
                  <TableHead>Atendidas</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{getStatusBadge(c.status)}</TableCell>
                    <TableCell>{c.target_count}</TableCell>
                    <TableCell>{c.sent_count}</TableCell>
                    <TableCell>{c.answered_count}</TableCell>
                    <TableCell>
                      <div className="w-24">
                        <Progress value={c.target_count > 0 ? (c.sent_count / c.target_count) * 100 : 0} className="h-2" />
                        <span className="text-xs text-muted-foreground">
                          {c.target_count > 0 ? Math.round((c.sent_count / c.target_count) * 100) : 0}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(c.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {(c.status === 'draft' || c.status === 'scheduled') && (
                          <Button size="sm" variant="outline" onClick={() => startCampaign.mutate(c.id)}>
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                        {c.status !== 'processing' && (
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteCampaign.mutate(c.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" />
              Nova Campanha de Torpedo de Voz
            </DialogTitle>
            <DialogDescription>Configure o envio de áudio em massa para seus leads</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome da Campanha *</Label>
              <Input
                placeholder="Ex: Promoção de Janeiro"
                value={campaignForm.name}
                onChange={e => setCampaignForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div>
              <Label>Áudio da Campanha *</Label>
              
              {/* Upload Section */}
              <div className="mt-2 space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/x-m4a"
                  className="hidden"
                  onChange={handleAudioUpload}
                />
                
                {campaignForm.audio_url ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-accent/30">
                    <FileAudio className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {audioFileName || 'Áudio selecionado'}
                      </p>
                      <audio controls className="w-full mt-1 h-8" src={campaignForm.audio_url}>
                        <track kind="captions" />
                      </audio>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="shrink-0 h-7 w-7"
                      onClick={() => {
                        setCampaignForm(f => ({ ...f, audio_url: '' }));
                        setAudioFileName('');
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-20 border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Enviando...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Clique para enviar áudio (MP3, WAV, OGG — até 20MB)
                        </span>
                      </div>
                    )}
                  </Button>
                )}

                {/* Manual URL option */}
                {!campaignForm.audio_url && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ou cole uma URL diretamente:</p>
                    <Input
                      placeholder="https://cdn.seusite.com/audio-campanha.mp3"
                      onChange={e => setCampaignForm(f => ({ ...f, audio_url: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Mensagem de Fallback (SMS)</Label>
              <Textarea
                rows={2}
                placeholder="Caso o lead não atenda, enviar este SMS..."
                value={campaignForm.fallback_message}
                onChange={e => setCampaignForm(f => ({ ...f, fallback_message: e.target.value }))}
              />
            </div>

            <div>
              <Label className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> Filtrar por Tags *
              </Label>
              <SearchableTagSelect
                tags={tags}
                selectedTags={campaignForm.target_tags}
                onTagsChange={t => setCampaignForm(f => ({ ...f, target_tags: t }))}
              />
              {campaignForm.target_tags.length > 0 && (
                <p className="text-sm text-primary mt-1 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {contactCount} contatos encontrados com estas tags
                </p>
              )}
            </div>

            <div>
              <Label className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Agendar Envio (opcional)
              </Label>
              <Input
                type="datetime-local"
                value={campaignForm.scheduled_at}
                onChange={e => setCampaignForm(f => ({ ...f, scheduled_at: e.target.value }))}
              />
            </div>

            <div>
              <Label>Créditos por Chamada</Label>
              <Select
                value={String(campaignForm.credits_per_call)}
                onValueChange={v => setCampaignForm(f => ({ ...f, credits_per_call: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 crédito (até 1 min)</SelectItem>
                  <SelectItem value="2">2 créditos (até 2 min)</SelectItem>
                  <SelectItem value="3">3 créditos (até 3 min)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cost Estimate */}
            <Card className={!hasEnoughCredits ? 'border-destructive' : ''}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Estimativa de créditos:</span>
                  <span className="font-bold text-lg">
                    {estimatedCredits.toLocaleString('pt-BR')} créditos
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-muted-foreground">Saldo atual:</span>
                  <span className={!hasEnoughCredits ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                    {(credits?.balance ?? 0).toLocaleString('pt-BR')} créditos
                  </span>
                </div>
                {!hasEnoughCredits && estimatedCredits > 0 && (
                  <p className="text-xs text-destructive mt-2">
                    ⚠️ Saldo insuficiente. Adquira mais créditos em VoIP & Ligações.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button
              onClick={() => createCampaign.mutate()}
              disabled={!campaignForm.name || !campaignForm.audio_url || campaignForm.target_tags.length === 0 || createCampaign.isPending || (estimatedCredits > 0 && !hasEnoughCredits)}
            >
              {createCampaign.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Volume2 className="h-4 w-4 mr-2" />
              )}
              {campaignForm.scheduled_at ? 'Agendar Campanha' : 'Criar Campanha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VoipCampaigns;
