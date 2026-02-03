import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Plus,
  Settings,
  Trash2,
  UserPlus,
  UserMinus,
  MessageSquare,
  RefreshCw,
  Crown,
  Clock,
} from 'lucide-react';
import { useWhatsAppGroups, WhatsAppGroup, WhatsAppGroupEvent } from '@/hooks/useWhatsAppGroups';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function WhatsAppGroupsManager() {
  const {
    groups,
    isLoadingGroups,
    createGroup,
    deleteGroup,
    fetchGroupMembers,
    fetchGroupEvents,
    isCreatingGroup,
  } = useWhatsAppGroups();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<WhatsAppGroup | null>(null);
  const [groupEvents, setGroupEvents] = useState<WhatsAppGroupEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [newGroup, setNewGroup] = useState<{
    name: string;
    description: string;
    group_type: string;
  }>({
    name: '',
    description: '',
    group_type: 'group',
  });

  const handleCreateGroup = () => {
    createGroup(newGroup);
    setIsCreateDialogOpen(false);
    setNewGroup({ name: '', description: '', group_type: 'group' });
  };

  const handleViewEvents = async (group: WhatsAppGroup) => {
    setSelectedGroup(group);
    setIsLoadingEvents(true);
    try {
      const events = await fetchGroupEvents(group.id);
      setGroupEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'join':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'leave':
      case 'remove':
        return <UserMinus className="h-4 w-4 text-red-500" />;
      case 'promote':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      default:
        return <Users className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'join':
        return 'Entrou';
      case 'leave':
        return 'Saiu';
      case 'remove':
        return 'Removido';
      case 'promote':
        return 'Promovido';
      case 'demote':
        return 'Rebaixado';
      default:
        return eventType;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Grupos e Comunidades</h2>
          <p className="text-muted-foreground">
            Gerencie seus grupos do WhatsApp e monitore entradas/saídas
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Grupo</DialogTitle>
              <DialogDescription>
                Adicione um grupo do WhatsApp para gerenciar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Nome do Grupo</Label>
                <Input
                  id="groupName"
                  placeholder="Ex: Clientes VIP"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupDescription">Descrição</Label>
                <Textarea
                  id="groupDescription"
                  placeholder="Descrição do grupo..."
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupType">Tipo</Label>
                <Select
                  value={newGroup.group_type}
                  onValueChange={(value) =>
                    setNewGroup({ ...newGroup, group_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">Grupo</SelectItem>
                    <SelectItem value="community">Comunidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateGroup} disabled={!newGroup.name || isCreatingGroup}>
                {isCreatingGroup ? 'Criando...' : 'Criar Grupo'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups Grid */}
      {isLoadingGroups ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhum grupo cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Adicione seus grupos do WhatsApp para começar a gerenciá-los
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Grupo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{group.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {group.group_type === 'community' ? 'Comunidade' : 'Grupo'}
                        </Badge>
                        {group.is_admin && (
                          <Badge variant="secondary" className="text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {group.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {group.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {group.member_count} membros
                  </span>
                  {group.synced_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Sincronizado{' '}
                      {formatDistanceToNow(new Date(group.synced_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewEvents(group)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Atividades
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteGroup(group.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Events Dialog */}
      <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Atividades do Grupo</DialogTitle>
            <DialogDescription>
              {selectedGroup?.name} - Histórico de entradas e saídas
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoadingEvents ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : groupEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum evento registrado</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEventIcon(event.event_type)}
                            <span>{getEventLabel(event.event_type)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {event.phone_number}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(event.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedGroup(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
