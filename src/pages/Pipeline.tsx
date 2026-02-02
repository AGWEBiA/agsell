import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Plus,
  MoreHorizontal,
  DollarSign,
  Calendar,
  GripVertical,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  usePipelineStages,
  useDeals,
  useCreateDeal,
  useUpdateDeal,
  useDeleteDeal,
  useInitializeDefaultStages,
  type CreateDealData,
  type Deal,
} from '@/hooks/usePipeline';
import { useContacts } from '@/hooks/useContacts';

const formatCurrency = (value: number | null) => {
  if (!value) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function Pipeline() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newDeal, setNewDeal] = useState<CreateDealData>({
    title: '',
    value: 0,
    stage_id: '',
    contact_id: '',
    expected_close_date: '',
  });

  const { data: stages = [], isLoading: stagesLoading } = usePipelineStages();
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const { data: contacts = [] } = useContacts();
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();
  const initializeStages = useInitializeDefaultStages();

  // Initialize default stages if empty
  useEffect(() => {
    if (!stagesLoading && stages.length === 0) {
      initializeStages.mutate();
    }
  }, [stagesLoading, stages.length]);

  const isLoading = stagesLoading || dealsLoading;

  const getDealsByStage = (stageId: string) => {
    return deals.filter((deal) => deal.stage_id === stageId);
  };

  const getTotalValue = (stageDeals: Deal[]) => {
    return stageDeals.reduce((acc, deal) => acc + (deal.value || 0), 0);
  };

  const handleCreateDeal = async () => {
    if (!newDeal.title || !newDeal.stage_id) return;
    await createDeal.mutateAsync({
      ...newDeal,
      contact_id: newDeal.contact_id || undefined,
    });
    setIsDialogOpen(false);
    setNewDeal({ title: '', value: 0, stage_id: '', contact_id: '', expected_close_date: '' });
  };

  const handleMoveDeal = async (dealId: string, newStageId: string) => {
    await updateDeal.mutateAsync({ id: dealId, stage_id: newStageId });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteDeal.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getContactName = (deal: Deal) => {
    if (!deal.contact) return null;
    return `${deal.contact.first_name} ${deal.contact.last_name || ''}`.trim();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pipeline de Vendas</h1>
          <p className="text-muted-foreground">Gerencie suas oportunidades de negócio</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Deal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Deal</DialogTitle>
              <DialogDescription>
                Adicione uma nova oportunidade ao pipeline
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Deal *</Label>
                <Input
                  id="name"
                  value={newDeal.title}
                  onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                  placeholder="Nome da oportunidade"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="value">Valor</Label>
                <Input
                  id="value"
                  type="number"
                  value={newDeal.value}
                  onChange={(e) => setNewDeal({ ...newDeal, value: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact">Contato</Label>
                <Select
                  value={newDeal.contact_id}
                  onValueChange={(value) => setNewDeal({ ...newDeal, contact_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um contato" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stage">Estágio *</Label>
                <Select
                  value={newDeal.stage_id}
                  onValueChange={(value) => setNewDeal({ ...newDeal, stage_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estágio" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="closeDate">Previsão de Fechamento</Label>
                <Input
                  id="closeDate"
                  type="date"
                  value={newDeal.expected_close_date}
                  onChange={(e) => setNewDeal({ ...newDeal, expected_close_date: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateDeal} 
                disabled={createDeal.isPending || !newDeal.title || !newDeal.stage_id}
              >
                {createDeal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Deal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pipeline Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = getDealsByStage(stage.id);
          return (
            <div key={stage.id} className="flex-shrink-0 w-80">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: stage.color || '#3b82f6' }}
                      />
                      <CardTitle className="text-base font-semibold">{stage.name}</CardTitle>
                      <Badge variant="secondary" className="ml-1">
                        {stageDeals.length}
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => {
                        setNewDeal({ ...newDeal, stage_id: stage.id });
                        setIsDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(getTotalValue(stageDeals))}
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-320px)]">
                    <div className="space-y-3 pr-3">
                      {stageDeals.length === 0 ? (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          Nenhum deal
                        </div>
                      ) : (
                        stageDeals.map((deal) => {
                          const contactName = getContactName(deal);
                          return (
                            <Card
                              key={deal.id}
                              className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-sm">{deal.title}</span>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <MoreHorizontal className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem disabled>Editar</DropdownMenuItem>
                                      {stages.filter(s => s.id !== stage.id).map(s => (
                                        <DropdownMenuItem 
                                          key={s.id}
                                          onClick={() => handleMoveDeal(deal.id, s.id)}
                                        >
                                          Mover para {s.name}
                                        </DropdownMenuItem>
                                      ))}
                                      <DropdownMenuItem 
                                        className="text-destructive"
                                        onClick={() => setDeleteId(deal.id)}
                                      >
                                        Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                    <DollarSign className="h-4 w-4" />
                                    {formatCurrency(deal.value)}
                                  </div>

                                  {contactName && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Avatar className="h-5 w-5">
                                        <AvatarFallback className="text-[10px]">
                                          {getInitials(contactName)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span>{contactName}</span>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    {deal.company && <span>{deal.company.name}</span>}
                                    {deal.expected_close_date && (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(deal.expected_close_date).toLocaleDateString('pt-BR')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir deal?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O deal será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
