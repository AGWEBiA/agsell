import React, { useState } from 'react';
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
  User,
  Calendar,
  GripVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock data
const pipelineStages = [
  { id: 1, name: 'Prospecção', color: '#a70202', deals: [
    { id: 1, name: 'Website Novo', value: 15000, contact: 'João Silva', company: 'Tech Corp', dueDate: '2026-02-15' },
    { id: 2, name: 'Sistema ERP', value: 45000, contact: 'Maria Santos', company: 'Digital Solutions', dueDate: '2026-02-20' },
  ]},
  { id: 2, name: 'Qualificação', color: '#3b82f6', deals: [
    { id: 3, name: 'App Mobile', value: 28000, contact: 'Carlos Lima', company: 'Inovação SA', dueDate: '2026-02-18' },
  ]},
  { id: 3, name: 'Proposta', color: '#f59e0b', deals: [
    { id: 4, name: 'Consultoria Marketing', value: 12000, contact: 'Ana Oliveira', company: 'StartUp XYZ', dueDate: '2026-02-12' },
    { id: 5, name: 'Integração API', value: 8500, contact: 'Pedro Costa', company: 'Empresa ABC', dueDate: '2026-02-25' },
  ]},
  { id: 4, name: 'Negociação', color: '#8b5cf6', deals: [
    { id: 6, name: 'Plataforma E-commerce', value: 65000, contact: 'Lucas Ferreira', company: 'Varejo Online', dueDate: '2026-02-10' },
  ]},
  { id: 5, name: 'Fechado', color: '#22c55e', deals: [
    { id: 7, name: 'Dashboard Analytics', value: 22000, contact: 'Fernanda Alves', company: 'Data Corp', dueDate: '2026-01-30' },
  ]},
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function Pipeline() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({ name: '', value: '', contact: '', stage: '' });

  const getTotalValue = (deals: typeof pipelineStages[0]['deals']) => {
    return deals.reduce((acc, deal) => acc + deal.value, 0);
  };

  const handleCreateDeal = () => {
    console.log('Creating deal:', newDeal);
    setIsDialogOpen(false);
    setNewDeal({ name: '', value: '', contact: '', stage: '' });
  };

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
                <Label htmlFor="name">Nome do Deal</Label>
                <Input
                  id="name"
                  value={newDeal.name}
                  onChange={(e) => setNewDeal({ ...newDeal, name: e.target.value })}
                  placeholder="Nome da oportunidade"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="value">Valor</Label>
                <Input
                  id="value"
                  type="number"
                  value={newDeal.value}
                  onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact">Contato</Label>
                <Input
                  id="contact"
                  value={newDeal.contact}
                  onChange={(e) => setNewDeal({ ...newDeal, contact: e.target.value })}
                  placeholder="Nome do contato"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stage">Estágio</Label>
                <Select
                  value={newDeal.stage}
                  onValueChange={(value) => setNewDeal({ ...newDeal, stage: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estágio" />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelineStages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id.toString()}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateDeal}>Criar Deal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pipeline Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipelineStages.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-80">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <CardTitle className="text-base font-semibold">{stage.name}</CardTitle>
                    <Badge variant="secondary" className="ml-1">
                      {stage.deals.length}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(getTotalValue(stage.deals))}
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <div className="space-y-3 pr-3">
                    {stage.deals.map((deal) => (
                      <Card
                        key={deal.id}
                        className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{deal.name}</span>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Editar</DropdownMenuItem>
                                <DropdownMenuItem>Mover</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
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

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[10px]">
                                  {deal.contact.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span>{deal.contact}</span>
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{deal.company}</span>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(deal.dueDate).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
