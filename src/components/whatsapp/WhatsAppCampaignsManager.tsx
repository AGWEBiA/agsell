import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Send,
  Plus,
  Pause,
  Play,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  Settings,
  RefreshCw,
  Users,
  Mail,
  BarChart3,
  Server,
  Smartphone,
} from 'lucide-react';
import { useWhatsAppCampaigns, WhatsAppCampaign } from '@/hooks/useWhatsAppCampaigns';
import { useWhatsAppInstances } from '@/hooks/useWhatsAppInstances';
import { WhatsAppInstanceSelector, WhatsAppInstanceBadge } from './WhatsAppInstanceSelector';
import { WhatsAppMultiInstanceSelector } from './WhatsAppMultiInstanceSelector';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function WhatsAppCampaignsManager({ currentInstanceId }: { currentInstanceId?: string | null }) {
  const {
    campaigns,
    isLoadingCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    startCampaign,
    pauseCampaign,
    getCampaignStats,
    isCreatingCampaign,
  } = useWhatsAppCampaigns();

  const { activeInstances, defaultInstance } = useWhatsAppInstances();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<WhatsAppCampaign | null>(null);
  const [newCampaign, setNewCampaign] = useState<{
    name: string;
    description: string;
    message_content: string;
    message_type: string;
    target_type: string;
    messages_per_minute: number;
    delay_between_messages: number;
    daily_limit: number;
    whatsapp_instance_id: string;
    whatsapp_instance_ids: string[];
  }>({
    name: '',
    description: '',
    message_content: '',
    message_type: 'text',
    target_type: 'contacts',
    messages_per_minute: 20,
    delay_between_messages: 3000,
    daily_limit: 1000,
    whatsapp_instance_id: defaultInstance?.id || '',
    whatsapp_instance_ids: currentInstanceId ? [currentInstanceId] : defaultInstance?.id ? [defaultInstance.id] : [],
  });

  const handleCreateCampaign = () => {
    createCampaign({
      ...newCampaign,
      whatsapp_instance_id: newCampaign.whatsapp_instance_ids[0] || newCampaign.whatsapp_instance_id,
    });
    setIsCreateDialogOpen(false);
    setNewCampaign({
      name: '',
      description: '',
      message_content: '',
      message_type: 'text',
      target_type: 'contacts',
      messages_per_minute: 20,
      delay_between_messages: 3000,
      daily_limit: 1000,
      whatsapp_instance_id: defaultInstance?.id || '',
      whatsapp_instance_ids: currentInstanceId ? [currentInstanceId] : defaultInstance?.id ? [defaultInstance.id] : [],
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      draft: { variant: 'outline', label: 'Rascunho' },
      scheduled: { variant: 'secondary', label: 'Agendada' },
      running: { variant: 'default', label: 'Em Execução' },
      paused: { variant: 'outline', label: 'Pausada' },
      completed: { variant: 'secondary', label: 'Concluída' },
      cancelled: { variant: 'destructive', label: 'Cancelada' },
    };
    const config = variants[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campanhas em Massa</h2>
          <p className="text-muted-foreground">
            Envie mensagens 1-a-1 seguindo as boas práticas do WhatsApp
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Campanha</DialogTitle>
              <DialogDescription>
                Configure sua campanha de envio em massa seguindo as boas práticas
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="content" className="py-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="targeting">Segmentação</TabsTrigger>
                <TabsTrigger value="settings">Configurações</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="campaignName">Nome da Campanha</Label>
                  <Input
                    id="campaignName"
                    placeholder="Ex: Promoção de Natal 2024"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaignDescription">Descrição (opcional)</Label>
                  <Input
                    id="campaignDescription"
                    placeholder="Descrição interna da campanha"
                    value={newCampaign.description}
                    onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="messageContent">Mensagem</Label>
                  <Textarea
                    id="messageContent"
                    placeholder="Digite sua mensagem aqui... Use {{nome}} para personalização"
                    className="min-h-32"
                    value={newCampaign.message_content}
                    onChange={(e) => setNewCampaign({ ...newCampaign, message_content: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Variáveis disponíveis: {'{{nome}}'}, {'{{telefone}}'}, {'{{email}}'}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="targeting" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Público Alvo</Label>
                  <Select
                    value={newCampaign.target_type}
                    onValueChange={(value) =>
                      setNewCampaign({ ...newCampaign, target_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contacts">Contatos Selecionados</SelectItem>
                      <SelectItem value="tags">Por Tags</SelectItem>
                      <SelectItem value="groups">Membros de Grupos</SelectItem>
                      <SelectItem value="all">Todos os Contatos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                  <CardContent className="pt-4">
                    <div className="flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                          Boas Práticas do WhatsApp
                        </p>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-yellow-700 dark:text-yellow-300">
                          <li>Envie apenas para contatos que aceitaram receber mensagens</li>
                          <li>Evite palavras spam como "GRÁTIS", "GANHE", etc.</li>
                          <li>Respeite os limites de envio do WhatsApp</li>
                          <li>Inclua opção de opt-out na mensagem</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 mt-4">
                <div className="space-y-4">
                  {/* WhatsApp Instance Selector */}
                  {activeInstances.length > 0 && (
                    <WhatsAppMultiInstanceSelector
                      selectedIds={newCampaign.whatsapp_instance_ids}
                      onChange={(ids) =>
                        setNewCampaign({ ...newCampaign, whatsapp_instance_ids: ids, whatsapp_instance_id: ids[0] || '' })
                      }
                      label="Instâncias de Envio"
                      currentInstanceId={currentInstanceId}
                    />
                  )}

                  <div className="space-y-2">
                    <Label>Mensagens por Minuto: {newCampaign.messages_per_minute}</Label>
                    <Slider
                      value={[newCampaign.messages_per_minute]}
                      onValueChange={([value]) =>
                        setNewCampaign({ ...newCampaign, messages_per_minute: value })
                      }
                      max={60}
                      min={5}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Recomendado: 15-30 mensagens por minuto para evitar bloqueios
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Intervalo entre Mensagens: {newCampaign.delay_between_messages / 1000}s</Label>
                    <Slider
                      value={[newCampaign.delay_between_messages]}
                      onValueChange={([value]) =>
                        setNewCampaign({ ...newCampaign, delay_between_messages: value })
                      }
                      max={10000}
                      min={1000}
                      step={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      Recomendado: 2-5 segundos entre cada mensagem
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Limite Diário: {newCampaign.daily_limit} mensagens</Label>
                    <Slider
                      value={[newCampaign.daily_limit]}
                      onValueChange={([value]) =>
                        setNewCampaign({ ...newCampaign, daily_limit: value })
                      }
                      max={5000}
                      min={100}
                      step={100}
                    />
                    <p className="text-xs text-muted-foreground">
                      Contas novas devem começar com limites baixos (200-500)
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateCampaign}
                disabled={!newCampaign.name || !newCampaign.message_content || isCreatingCampaign}
              >
                {isCreatingCampaign ? 'Criando...' : 'Criar Campanha'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns List */}
      {isLoadingCampaigns ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhuma campanha criada</h3>
            <p className="text-muted-foreground mb-4">
              Crie sua primeira campanha de envio em massa
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Campanha
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const stats = getCampaignStats(campaign);
            const progress = stats.total > 0 ? ((stats.sent + stats.failed) / stats.total) * 100 : 0;

            return (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{campaign.name}</h3>
                        {getStatusBadge(campaign.status)}
                      </div>
                      {campaign.description && (
                        <p className="text-sm text-muted-foreground">{campaign.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {campaign.status === 'draft' && (
                        <Button size="sm" onClick={() => startCampaign(campaign.id)}>
                          <Play className="h-4 w-4 mr-1" />
                          Iniciar
                        </Button>
                      )}
                      {campaign.status === 'running' && (
                        <Button size="sm" variant="outline" onClick={() => pauseCampaign(campaign.id)}>
                          <Pause className="h-4 w-4 mr-1" />
                          Pausar
                        </Button>
                      )}
                      {campaign.status === 'paused' && (
                        <Button size="sm" onClick={() => startCampaign(campaign.id)}>
                          <Play className="h-4 w-4 mr-1" />
                          Retomar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteCampaign(campaign.id)}
                        disabled={campaign.status === 'running'}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress */}
                  {stats.total > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">
                          {stats.sent + stats.failed} / {stats.total}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-5 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <Users className="h-4 w-4" />
                        <span className="text-xs">Total</span>
                      </div>
                      <p className="font-semibold">{stats.total}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                        <Send className="h-4 w-4" />
                        <span className="text-xs">Enviadas</span>
                      </div>
                      <p className="font-semibold">{stats.sent}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs">Entregues</span>
                      </div>
                      <p className="font-semibold">{stats.delivered}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                        <Eye className="h-4 w-4" />
                        <span className="text-xs">Lidas</span>
                      </div>
                      <p className="font-semibold">{stats.read}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs">Falhas</span>
                      </div>
                      <p className="font-semibold">{stats.failed}</p>
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-muted-foreground">
                    <span>
                      Criada{' '}
                      {formatDistanceToNow(new Date(campaign.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Settings className="h-4 w-4" />
                        {campaign.messages_per_minute}/min
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4" />
                        {stats.deliveryRate}% entrega
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
