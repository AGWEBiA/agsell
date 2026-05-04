import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GripVertical, DollarSign, Calendar, MoreHorizontal, MessageSquareText, Percent, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Deal, PipelineStage } from '@/hooks/usePipeline';
import { useContactLastSacMessage } from '@/hooks/useSacLeads';
import { DealSourceBadge } from './DealSourceBadge';

const formatCurrency = (value: number | null) => {
  if (!value) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

interface DealCardProps {
  deal: Deal;
  stage: PipelineStage;
  stages: PipelineStage[];
  isDragged: boolean;
  onDragStart: (e: React.DragEvent, dealId: string) => void;
  onDragEnd: () => void;
  onMove: (dealId: string, stageId: string) => void;
  onDelete: (dealId: string) => void;
  onEdit: (deal: Deal) => void;
}

export function DealCard({
  deal,
  stage,
  stages,
  isDragged,
  onDragStart,
  onDragEnd,
  onMove,
  onDelete,
  onEdit,
}: DealCardProps) {
  const contactName = deal.contact
    ? `${deal.contact.first_name} ${deal.contact.last_name || ''}`.trim()
    : null;
  const { data: lastMsg } = useContactLastSacMessage(deal.contact?.id);

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      onDragEnd={onDragEnd}
      className={cn(
        'cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-2 border-transparent',
        isDragged ? 'opacity-40 scale-95 border-primary/30' : 'opacity-100'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm truncate">{deal.title}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(deal)}>Editar</DropdownMenuItem>
              {stages
                .filter((s) => s.id !== stage.id)
                .map((s) => (
                  <DropdownMenuItem key={s.id} onClick={() => onMove(deal.id, s.id)}>
                    Mover para {s.name}
                  </DropdownMenuItem>
                ))}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(deal.id)}
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

          {(deal.commission_rate || 0) > 0 && (
            <div className="flex items-center gap-2 text-xs text-orange-600 font-medium">
              <Percent className="h-3 w-3" />
              Comissão: {deal.commission_rate}% ({formatCurrency(deal.commission_value)})
            </div>
          )}

          {deal.payment_link && (
            <a 
              href={deal.payment_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-2.5 w-2.5" />
              Link de Pagamento
            </a>
          )}

          {/* Source badge — origem do lead */}
          {(deal.contact?.source || lastMsg?.channel) && (
            <DealSourceBadge source={deal.contact?.source} channel={lastMsg?.channel} />
          )}

          {contactName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px]">
                  {getInitials(contactName)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{contactName}</span>
            </div>
          )}

          {/* Última mensagem do SAC — facilita qualificação */}
          {lastMsg?.content && (
            <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground italic border-l-2 border-primary/30 pl-2 py-0.5">
              <MessageSquareText className="h-3 w-3 mt-0.5 shrink-0" />
              <span className="line-clamp-2">"{lastMsg.content}"</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {deal.company && <span className="truncate">{deal.company.name}</span>}
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
}
