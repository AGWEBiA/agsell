import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Phone, PhoneCall, CreditCard, History, TrendingUp, Wallet, Package, Clock, Loader2 } from 'lucide-react';
import { useVoip } from '@/hooks/useVoip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VoIP = () => {
  const { packages, credits, transactions, calls, isLoading } = useVoip();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
  };

  const handlePurchase = async (packageId: string) => {
    try {
      setPurchasingId(packageId);
      const { data, error } = await supabase.functions.invoke('purchase-voip-credits', {
        body: { packageId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('Nenhuma URL de checkout retornada');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao iniciar compra');
    } finally {
      setPurchasingId(null);
    }
  };

  const formatPricePerCredit = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Phone className="h-6 w-6 text-primary" />
          VoIP & Ligações
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seus créditos de ligação e acompanhe o histórico de chamadas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Atual</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {credits?.balance?.toLocaleString('pt-BR') ?? '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">créditos disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Comprado</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {credits?.total_purchased?.toLocaleString('pt-BR') ?? '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">créditos adquiridos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ligações Realizadas</CardTitle>
            <PhoneCall className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {calls.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">chamadas registradas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="packages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="packages" className="gap-1.5">
            <Package className="h-4 w-4" />
            Pacotes de Créditos
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-4 w-4" />
            Histórico de Compras
          </TabsTrigger>
          <TabsTrigger value="calls" className="gap-1.5">
            <PhoneCall className="h-4 w-4" />
            Histórico de Ligações
          </TabsTrigger>
        </TabsList>

        {/* Pacotes de Créditos */}
        <TabsContent value="packages">
          <Card>
            <CardHeader>
              <CardTitle>Comprar Créditos de Voz</CardTitle>
              <CardDescription>
                Escolha o pacote ideal para sua operação. Quanto maior o pacote, menor o custo por crédito.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {packages.map((pkg) => {
                  const isPopular = pkg.credits === 5000;
                  return (
                    <Card
                      key={pkg.id}
                      className={`relative transition-all hover:shadow-lg hover:border-primary/50 ${
                        isPopular ? 'border-primary ring-1 ring-primary/20' : ''
                      }`}
                    >
                      {isPopular && (
                        <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                          Popular
                        </Badge>
                      )}
                      <CardHeader className="text-center pb-2">
                        <CardTitle className="text-lg">{pkg.credits.toLocaleString('pt-BR')}</CardTitle>
                        <CardDescription>créditos</CardDescription>
                      </CardHeader>
                      <CardContent className="text-center space-y-3">
                        <div>
                          <span className="text-2xl font-bold text-foreground">
                            {formatCurrency(pkg.price_cents)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatPricePerCredit(pkg.price_per_credit_cents)} por crédito
                        </p>
                        <Button
                          className="w-full"
                          variant={isPopular ? 'default' : 'outline'}
                          onClick={() => handlePurchase(pkg.id)}
                          disabled={purchasingId === pkg.id}
                        >
                          {purchasingId === pkg.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CreditCard className="h-4 w-4 mr-2" />
                          )}
                          {purchasingId === pkg.id ? 'Processando...' : 'Comprar'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                <h4 className="font-medium text-foreground text-sm mb-2">💡 Como funciona?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Cada crédito equivale a 1 minuto de ligação ou 1 torpedo de voz</li>
                  <li>• Os créditos não expiram e ficam vinculados à sua organização</li>
                  <li>• Na <strong>Fase 2</strong>, você poderá ligar diretamente do sistema via WebRTC</li>
                  <li>• Atualmente, o botão "Ligar" abre o discador nativo do seu dispositivo</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico de Compras */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>Todas as compras e consumos de créditos</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhuma transação encontrada</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Compre seu primeiro pacote de créditos para começar
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Créditos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm">
                          {format(new Date(tx.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={tx.type === 'purchase' ? 'default' : 'secondary'}>
                            {tx.type === 'purchase' ? 'Compra' : 'Consumo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {tx.description || '-'}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${tx.type === 'purchase' ? 'text-green-600' : 'text-red-500'}`}>
                          {tx.type === 'purchase' ? '+' : '-'}{tx.amount.toLocaleString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico de Ligações */}
        <TabsContent value="calls">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Ligações</CardTitle>
              <CardDescription>Registro de todas as chamadas realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              {calls.length === 0 ? (
                <div className="text-center py-12">
                  <PhoneCall className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhuma ligação registrada</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Clique em "Ligar" no perfil de um contato para começar
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead>Direção</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calls.map((call) => (
                      <TableRow key={call.id}>
                        <TableCell className="text-sm">
                          {format(new Date(call.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{call.phone_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {call.direction === 'outbound' ? '📞 Saída' : '📲 Entrada'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={call.status === 'completed' ? 'default' : 'secondary'}>
                            {call.status === 'completed' ? 'Concluída' : call.status === 'missed' ? 'Perdida' : call.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}:${String(call.duration_seconds % 60).padStart(2, '0')}` : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {call.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VoIP;
