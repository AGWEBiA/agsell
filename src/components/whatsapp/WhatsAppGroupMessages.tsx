import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
  MessageSquare,
  Plus,
  Trash2,
  UserPlus,
  UserMinus,
  Clock,
  Zap,
  RefreshCw,
  Send,
  Users,
} from 'lucide-react';
import { useWhatsAppGroups } from '@/hooks/useWhatsAppGroups';
import { WhatsAppMultiInstanceSelector } from './WhatsAppMultiInstanceSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function WhatsAppGroupMessages({ currentInstanceId }: { currentInstanceId?: string | null }) {
  const {
    groups,
    groupMessages,
    isLoadingMessages,
    createGroupMessage,
    updateGroupMessage,
    deleteGroupMessage,
  } = useWhatsAppGroups();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sendingMessageId, setSendingMessageId] = useState<string | null>(null);
  const [selectedInstanceIds, setSelectedInstanceIds] = useState<string[]>(
    currentInstanceId ? [currentInstanceId] : []
  );
  const [newMessage, setNewMessage] = useState({
    name: '',
    content: '',
    message_type: 'text',
    trigger_event: 'manual',
    is_active: true,
    target_groups: [] as string[],
  });

  const handleCreateMessage = () => {
    createGroupMessage(newMessage);
    setIsCreateDialogOpen(false);
    setNewMessage({
      name: '',
      content: '',
      message_type: 'text',
      trigger_event: 'manual',
      is_active: true,
      target_groups: [],
    });
  };

  const handleSendNow = async (message: typeof groupMessages[0]) => {
    setSendingMessageId(message.id);
    try {
      const targetGroups = message.target_groups?.length ? message.target_groups : groups.map(g => g.external_group_id).filter(Boolean);
      
      if (targetGroups.length === 0) {
        toast.error('Nenhum grupo alvo encontrado. Sincronize seus grupos primeiro.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          organization_id: groups[0]?.organization_id,
          to: targetGroups[0], // Send to the first group JID
          message: message.content,
        },
      });

      if (error) throw error;
      toast.success(`Mensagem "${message.name}" enviada para ${targetGroups.length} grupo(s)!`);
    } catch (err: any) {
      toast.error(`Erro ao enviar: ${err.message || 'Falha no envio'}`);
    } finally {
      setSendingMessageId(null);
    }
  };

  const toggleGroupSelection = (groupId: string) => {
    setNewMessage(prev => ({
      ...prev,
      target_groups: prev.target_groups.includes(groupId)
        ? prev.target_groups.filter(id => id !== groupId)
        : [...prev.target_groups, groupId],
    }));
  };

  const getTriggerBadge = (trigger: string | null) => {
    const triggers: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
      on_join: {
        icon: <UserPlus className="h-3 w-3" />,
        label: 'Ao Entrar',
        color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      },
      on_leave: {
        icon: <UserMinus className="h-3 w-3" />,
        label: 'Ao Sair',
        color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      },
      scheduled: {
        icon: <Clock className="h-3 w-3" />,
        label: 'Agendada',
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      },
      manual: {
        icon: <Zap className="h-3 w-3" />,
        label: 'Manual',
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      },
    };
    const config = triggers[trigger || 'manual'];
    return (
      <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  // Stats
  const totalMessages = groupMessages.length;
  const activeMessages = groupMessages.filter(m => m.is_active).length;
  const onJoinMessages = groupMessages.filter(m => m.trigger_event === 'on_join').length;
  const totalGroups = groups.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Mensagens para Grupos
          </h2>
          <p className="text-muted-foreground">
            Crie, programe e automatize mensagens para seus grupos de WhatsApp
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Mensagem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Mensagem para Grupo</DialogTitle>
              <DialogDescription>
                Configure uma mensagem para ser enviada aos grupos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="messageName">Nome</Label>
                <Input
                  id="messageName"
                  placeholder="Ex: Boas-vindas ao Grupo"
                  value={newMessage.name}
                  onChange={(e) => setNewMessage({ ...newMessage, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="triggerEvent">Gatilho</Label>
                <Select
                  value={newMessage.trigger_event}
                  onValueChange={(value) => setNewMessage({ ...newMessage, trigger_event: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_join">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-green-600" />
                        Quando alguém entrar
                      </div>
                    </SelectItem>
                    <SelectItem value="on_leave">
                      <div className="flex items-center gap-2">
                        <UserMinus className="h-4 w-4 text-red-600" />
                        Quando alguém sair
                      </div>
                    </SelectItem>
                    <SelectItem value="scheduled">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        Agendada
                      </div>
                    </SelectItem>
                    <SelectItem value="manual">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Envio Manual
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Instance selector */}
              <WhatsAppMultiInstanceSelector
                selectedIds={selectedInstanceIds}
                onChange={setSelectedInstanceIds}
                label="Instâncias para automação"
                currentInstanceId={currentInstanceId}
              />

              {/* Group selector */}
              <div className="space-y-2">
                <Label>Grupos alvo</Label>
                {groups.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum grupo sincronizado. Sincronize seus grupos primeiro.</p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Buscar grupos..."
                        value={groupSearch}
                        onChange={(e) => setGroupSearch(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto p-2 space-y-1">
                      {groups
                        .filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()))
                        .map(group => (
                          <label key={group.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
                            <Checkbox
                              checked={newMessage.target_groups.includes(group.external_group_id || group.id)}
                              onCheckedChange={() => toggleGroupSelection(group.external_group_id || group.id)}
                            />
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="truncate">{group.name}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{group.member_count} membros</span>
                          </label>
                        ))}
                      {groups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase())).length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">Nenhum grupo encontrado</p>
                      )}
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Deixe vazio para enviar a todos os grupos
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="messageContent">Conteúdo da Mensagem</Label>
                <Textarea
                  id="messageContent"
                  placeholder="Digite sua mensagem... Use {{nome}} para o nome do membro"
                  className="min-h-24"
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Variáveis: {'{{nome}}'}, {'{{grupo}}'}, {'{{data}}'}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Ativa</Label>
                <Switch
                  id="isActive"
                  checked={newMessage.is_active}
                  onCheckedChange={(checked) => setNewMessage({ ...newMessage, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateMessage}
                disabled={!newMessage.name || !newMessage.content}
              >
                Criar Mensagem
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{totalMessages}</p>
              <p className="text-xs text-muted-foreground">Total Mensagens</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Zap className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{activeMessages}</p>
              <p className="text-xs text-muted-foreground">Ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <UserPlus className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{onJoinMessages}</p>
              <p className="text-xs text-muted-foreground">Ao Entrar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{totalGroups}</p>
              <p className="text-xs text-muted-foreground">Grupos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages List */}
      {isLoadingMessages ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : groupMessages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhuma mensagem configurada</h3>
            <p className="text-muted-foreground mb-4">
              Crie mensagens automáticas para seus grupos
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Mensagem
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groupMessages.map((message) => (
            <Card key={message.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {message.name}
                    </CardTitle>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {getTriggerBadge(message.trigger_event)}
                      {message.target_groups && message.target_groups.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {message.target_groups.length} grupo(s)
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={message.is_active}
                      onCheckedChange={(checked) =>
                        updateGroupMessage({ id: message.id, is_active: checked })
                      }
                    />
                    <Badge variant={message.is_active ? 'default' : 'outline'} className="text-xs">
                      {message.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 bg-muted p-3 rounded-lg">
                  {message.content}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  {message.trigger_event === 'manual' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendNow(message)}
                      disabled={sendingMessageId === message.id}
                    >
                      {sendingMessageId === message.id ? (
                        <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5 mr-1" />
                      )}
                      Enviar Agora
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm('Deseja realmente excluir esta mensagem?')) {
                        deleteGroupMessage(message.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
