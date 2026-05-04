import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
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
  HelpCircle,
  Home,
  MousePointerClick,
  Sparkles,
  Target,
  FileText,
  Handshake,
  Trophy,
  ArrowRight,
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
import { useContactLastSacMessage } from '@/hooks/useSacLeads';
// SacLeadsPanel moved to Deals page
import { DealDetailDialog } from '@/components/crm/DealDetailDialog';
import { DealSourceBadge } from '@/components/pipeline/DealSourceBadge';
import { DealCard } from '@/components/pipeline/DealCard';
import { PageHeader, FormField } from '@/components/ui/help-tooltip';
const formatCurrency = (value: number | null) => {
  if (!value) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function Pipeline() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [newDeal, setNewDeal] = useState<CreateDealData>({
    title: '',
    value: 0,
    stage_id: '',
    contact_id: '',
    expected_close_date: '',
    commission_rate: 0,
    payment_link: '',
  });
  const [selectedProduct, setSelectedProduct] = useState<string>('custom');

  const { data: stages = [], isLoading: stagesLoading } = usePipelineStages();
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const { data: contacts = [] } = useContacts();
  const { currentOrganization } = useOrganization();
  const { data: productCommissions = [] } = useQuery({
    queryKey: ['product-commissions', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_commissions')
        .select('*')
        .eq('organization_id', currentOrganization?.id || '');
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganization?.id,
  });

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
    setNewDeal({ title: '', value: 0, stage_id: '', contact_id: '', expected_close_date: '', commission_rate: 0, payment_link: '' });
  };

  const handleUpdateDeal = async () => {
    if (!editingDeal) return;
    await updateDeal.mutateAsync({
      id: editingDeal.id,
      title: editingDeal.title,
      value: editingDeal.value || 0,
      commission_rate: editingDeal.commission_rate || 0,
      payment_link: editingDeal.payment_link || '',
      expected_close_date: editingDeal.expected_close_date || undefined,
      contact_id: editingDeal.contact_id || undefined,
    });
    setEditingDeal(null);
  };

  const handleMoveDeal = async (dealId: string, newStageId: string) => {
    await updateDeal.mutateAsync({ id: dealId, stage_id: newStageId });
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDealId(dealId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dealId);
    // Add drag image for better visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 50, 20);
    }
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the stage container entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      setDragOverStageId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverStageId(null);
    const dealId = e.dataTransfer.getData('text/plain');
    if (dealId) {
      const deal = deals.find(d => d.id === dealId);
      if (deal && deal.stage_id !== stageId) {
        await handleMoveDeal(dealId, stageId);
      }
    }
    setDraggedDealId(null);
  };

  const handleDragEnd = () => {
    setDraggedDealId(null);
    setDragOverStageId(null);
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
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/dashboard" className="flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Pipeline de Vendas</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <PageHeader
        title="Pipeline de Vendas"
        description="Gerencie suas oportunidades de negócio"
        helpText="Arraste os deals entre colunas ou use o menu para mover. Cada coluna representa um estágio do seu funil de vendas."
      >
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/deals">
              Ver em Lista
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setIsHelpOpen(true)}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Como funciona
          </Button>
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
              <div className="grid gap-2 border-t pt-4 mt-2">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" /> Configuração por Produto
                </Label>
                <Select
                  value={selectedProduct}
                  onValueChange={(value) => {
                    setSelectedProduct(value);
                    if (value !== 'custom') {
                      const prod = productCommissions.find(p => p.id === value);
                      if (prod) {
                        setNewDeal({
                          ...newDeal,
                          title: prod.product_name,
                          commission_rate: Number(prod.commission_rate)
                        });
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aplicar regra de produto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Valor Personalizado</SelectItem>
                    {productCommissions.map((prod) => (
                      <SelectItem key={prod.id} value={prod.id}>
                        {prod.product_name} ({prod.commission_rate}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="commission">Taxa de Comissão (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  value={newDeal.commission_rate}
                  onChange={(e) => {
                    setNewDeal({ ...newDeal, commission_rate: parseFloat(e.target.value) || 0 });
                    setSelectedProduct('custom');
                  }}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paymentLink">Link de Pagamento</Label>
                <Input
                  id="paymentLink"
                  value={newDeal.payment_link}
                  onChange={(e) => setNewDeal({ ...newDeal, payment_link: e.target.value })}
                  placeholder="https://..."
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

        {/* Edit Deal Dialog */}
        <Dialog open={!!editingDeal} onOpenChange={(open) => !open && setEditingDeal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Deal</DialogTitle>
              <DialogDescription>
                Atualize as informações desta oportunidade
              </DialogDescription>
            </DialogHeader>
            {editingDeal && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nome do Deal *</Label>
                  <Input
                    id="edit-name"
                    value={editingDeal.title}
                    onChange={(e) => setEditingDeal({ ...editingDeal, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-value">Valor</Label>
                  <Input
                    id="edit-value"
                    type="number"
                    value={editingDeal.value || 0}
                    onChange={(e) => setEditingDeal({ ...editingDeal, value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-commission">Taxa de Comissão (%)</Label>
                  <Input
                    id="edit-commission"
                    type="number"
                    value={editingDeal.commission_rate || 0}
                    onChange={(e) => setEditingDeal({ ...editingDeal, commission_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-paymentLink">Link de Pagamento</Label>
                  <Input
                    id="edit-paymentLink"
                    value={editingDeal.payment_link || ''}
                    onChange={(e) => setEditingDeal({ ...editingDeal, payment_link: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-closeDate">Previsão de Fechamento</Label>
                  <Input
                    id="edit-closeDate"
                    type="date"
                    value={editingDeal.expected_close_date || ''}
                    onChange={(e) => setEditingDeal({ ...editingDeal, expected_close_date: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingDeal(null)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdateDeal} 
                disabled={updateDeal.isPending}
              >
                {updateDeal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* SAC Leads Panel moved to /deals */}

      {/* Pipeline Kanban */}
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-3 px-3 sm:mx-0 sm:px-0 snap-x snap-mandatory sm:snap-none">
        {stages.map((stage) => {
          const stageDeals = getDealsByStage(stage.id);
          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-[280px] sm:w-80 snap-start"
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <Card className={cn(
                'h-full transition-all duration-200 border-2',
                dragOverStageId === stage.id
                  ? 'ring-2 ring-primary border-primary/50 bg-primary/5 shadow-lg'
                  : 'border-transparent'
              )}>
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
                        stageDeals.map((deal) => (
                          <DealCard
                            key={deal.id}
                            deal={deal}
                            stage={stage}
                            stages={stages}
                            isDragged={draggedDealId === deal.id}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onMove={handleMoveDeal}
                            onDelete={(id) => setDeleteId(id)}
                            onEdit={(deal) => setEditingDeal(deal)}
                            onClick={(deal) => setSelectedDealId(deal.id)}
                          />
                        ))
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

      {/* Help Dialog */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Como funciona o Pipeline de Vendas
            </DialogTitle>
            <DialogDescription>
              Aprenda a organizar suas oportunidades em cada etapa do funil
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Drag and Drop */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <MousePointerClick className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-semibold">Arrastar e soltar (Drag & Drop)</h3>
                  <p className="text-sm text-muted-foreground">
                    Clique e segure o card de um deal e arraste para a coluna do estágio desejado.
                    Solte sobre a coluna destino para mover o deal automaticamente. A coluna fica
                    destacada quando você passa o mouse sobre ela.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    💡 Dica: você também pode usar o menu (<MoreHorizontal className="inline h-3 w-3" />) no card
                    para mover entre estágios sem arrastar.
                  </p>
                </div>
              </div>
            </div>

            {/* Stages */}
            <div>
              <h3 className="font-semibold mb-3">Etapas do funil</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">1. Novo Lead</div>
                    <p className="text-xs text-muted-foreground">
                      Contatos recém-chegados que ainda não foram qualificados. Ponto de entrada de
                      oportunidades vindas de formulários, importações ou criação manual.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary shrink-0">
                    <Target className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">2. Qualificado</div>
                    <p className="text-xs text-muted-foreground">
                      Lead validado: tem perfil, interesse real e orçamento compatível. Está pronto
                      para receber uma proposta comercial.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent shrink-0">
                    <FileText className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">3. Proposta</div>
                    <p className="text-xs text-muted-foreground">
                      Proposta enviada e em análise pelo cliente. Acompanhe o tempo desde o envio
                      para fazer follow-up no momento certo.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 shrink-0">
                    <Handshake className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">4. Negociação</div>
                    <p className="text-xs text-muted-foreground">
                      Cliente interessado, ajustando termos finais (preço, prazo, condições).
                      Momento crítico que exige atenção e velocidade nas respostas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <Trophy className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">5. Ganho</div>
                    <p className="text-xs text-muted-foreground">
                      Negócio fechado! O valor entra na sua taxa de conversão e nas métricas de
                      receita. Mova para cá após a confirmação do pagamento ou contrato assinado.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-4 text-sm">
              <strong>💡 Boas práticas:</strong>
              <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
                <li>Mantenha o pipeline atualizado diariamente</li>
                <li>Defina valor estimado em todo deal para previsão de receita</li>
                <li>Adicione data esperada de fechamento para priorizar follow-ups</li>
                <li>Vincule sempre um contato ao deal para histórico completo</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsHelpOpen(false)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DealDetailDialog 
        dealId={selectedDealId} 
        onClose={() => setSelectedDealId(null)} 
      />
    </div>
  );
}
