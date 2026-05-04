import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { History, ArrowUpRight } from 'lucide-react';

interface DealDetailDialogProps {
  dealId: string | null;
  onClose: () => void;
}

const formatBRL = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n || 0);

export function DealDetailDialog({ dealId, onClose }: DealDetailDialogProps) {
  const { data: deal, isLoading } = useQuery({
    queryKey: ['deal-detail', dealId],
    queryFn: async () => {
      if (!dealId) return null;
      const { data, error } = await supabase
        .from('deals')
        .select('*, contact:contacts(first_name, last_name), product:product_commissions(product_name)')
        .eq('id', dealId)
        .single();
      if (error) throw error;
      
      const { data: activities } = await supabase
        .from('deal_activities')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });
        
      return { ...data, activities: activities || [] };
    },
    enabled: !!dealId,
  });

  return (
    <Dialog open={!!dealId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Venda: {deal?.title}</DialogTitle>
          <DialogDescription>
            Informações detalhadas e linha do tempo do deal.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : deal ? (
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Produto</p>
                <p className="text-sm font-bold">{(deal as any).product?.product_name || 'Personalizado'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Valor da Venda</p>
                <p className="text-lg font-bold">{formatBRL(Number(deal.value))}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Comissão</p>
                <p className="text-lg font-bold text-orange-600">{formatBRL(Number(deal.commission_value))}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Status de Pagamento</p>
                <Badge>{deal.payment_status || 'Pendente'}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Link de Pagamento</p>
                {deal.payment_link ? (
                  <a href={deal.payment_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline flex items-center gap-1">
                    Abrir Checkout <ArrowUpRight className="h-3 w-3" />
                  </a>
                ) : <span className="text-sm text-muted-foreground">Não gerado</span>}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4" /> Timeline do Status
              </h4>
              <div className="relative space-y-4 before:absolute before:inset-y-0 before:left-2.5 before:w-0.5 before:bg-muted ml-1">
                {deal.activities.length === 0 ? (
                  <p className="text-xs text-muted-foreground ml-6 italic">Sem atividades registradas.</p>
                ) : (
                  deal.activities.map((act: any) => (
                    <div key={act.id} className="relative pl-8">
                      <div className="absolute left-0 top-1.5 h-5 w-5 rounded-full border-4 border-background bg-primary" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{act.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(act.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div className="relative pl-8">
                  <div className="absolute left-0 top-1.5 h-5 w-5 rounded-full border-4 border-background bg-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Deal Criado</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(deal.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
