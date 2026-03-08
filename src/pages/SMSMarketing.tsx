import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSms } from '@/hooks/useSms';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  MessageSquare, Send, Plus, Clock, BarChart3,
  Zap, Phone, Loader2, Wallet, TrendingUp,
  CreditCard, Package, History, ArrowUpDown, Inbox as InboxIcon,
} from 'lucide-react';

export default function SMSMarketing() {
  const { packages, credits, transactions, campaigns, isLoading, createCampaign } = useSms();
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const charCount = newMessage.length;
  const smsCount = Math.ceil(charCount / 160) || 1;

  const handleCreate = () => {
    if (!newName.trim() || !newMessage.trim()) return toast.error('Preencha todos os campos');
    createCampaign.mutate({ name: newName, message: newMessage }, {
      onSuccess: () => {
        setNewOpen(false);
        setNewName('');
        setNewMessage('');
      },
    });
  };

  const handlePurchase = async (packageId: string) => {
    try {
      setPurchasingId(packageId);
      const { data, error } = await supabase.functions.invoke('purchase-sms-credits', {
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

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

  const formatPricePerCredit = (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(cents / 100);

  const stats = {
    total_sent: campaigns.reduce((s, c) => s + c.sent_count, 0),
    total_delivered: campaigns.reduce((s, c) => s + c.delivered_count, 0),
    total_clicks: campaigns.reduce((s, c) => s + c.click_count, 0),
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Phone className="h-6 w-6 text-primary" /> SMS Marketing
          </h1>
          <p className="text-muted-foreground mt-1">Campanhas, créditos pré-pagos e mensagens bidirecionais</p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nova Campanha</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Campanha SMS</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da campanha</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Promoção de Natal" />
              </div>
              <div>
                <Label>Mensagem</Label>
                <Textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Olá {nome}! Use variáveis com {chaves}" rows={4} />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{charCount} caracteres • {smsCount} SMS(s) por contato</span>
                  <span>Variáveis: {'{nome}'}, {'{email}'}, {'{link}'}</span>
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={createCampaign.isPending}>
                {createCampaign.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Criar Campanha
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo SMS</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{credits?.balance?.toLocaleString('pt-BR') ?? '0'}</div>
            <p className="text-xs text-muted-foreground mt-1">créditos disponíveis</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">SMS Enviados</CardTitle>
            <Send className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.total_sent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">total enviados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entregues</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.total_delivered.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">confirmados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cliques</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.total_clicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">em links</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="packages" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="packages" className="gap-1.5">
            <Package className="h-4 w-4" /> Pacotes de Créditos
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5">
            <Send className="h-4 w-4" /> Campanhas
          </TabsTrigger>
          <TabsTrigger value="automations" className="gap-1.5">
            <Zap className="h-4 w-4" /> Automações
          </TabsTrigger>
          <TabsTrigger value="inbox" className="gap-1.5">
            <ArrowUpDown className="h-4 w-4" /> Recebidas
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-4 w-4" /> Transações
          </TabsTrigger>
        </TabsList>

        {/* Pacotes de Créditos */}
        <TabsContent value="packages">
          <Card>
            <CardHeader>
              <CardTitle>Comprar Créditos SMS</CardTitle>
              <CardDescription>1 crédito = 1 SMS. Quanto maior o pacote, menor o custo por mensagem.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {packages.map((pkg) => {
                  const isPopular = pkg.credits === 5000;
                  return (
                    <Card
                      key={pkg.id}
                      className={`relative transition-all hover:shadow-lg hover:border-primary/50 ${isPopular ? 'border-primary ring-1 ring-primary/20' : ''}`}
                    >
                      {isPopular && (
                        <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">Popular</Badge>
                      )}
                      <CardHeader className="text-center pb-2">
                        <CardTitle className="text-lg">{pkg.credits.toLocaleString('pt-BR')}</CardTitle>
                        <CardDescription>créditos SMS</CardDescription>
                      </CardHeader>
                      <CardContent className="text-center space-y-3">
                        <div>
                          <span className="text-2xl font-bold text-foreground">{formatCurrency(pkg.price_cents)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatPricePerCredit(pkg.price_per_credit_cents)} por SMS</p>
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
                  <li>• Cada crédito equivale a 1 SMS enviado</li>
                  <li>• Os créditos não expiram e ficam vinculados à sua organização</li>
                  <li>• O provedor SMS (Twilio, Vonage ou Zenvia) é configurado pelo administrador</li>
                  <li>• Suporte a variáveis personalizadas nas mensagens: {'{nome}'}, {'{email}'}, {'{link}'}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campanhas */}
        <TabsContent value="campaigns" className="space-y-4">
          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Send className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhuma campanha criada</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Crie sua primeira campanha SMS clicando em "Nova Campanha"</p>
              </CardContent>
            </Card>
          ) : (
            campaigns.map(c => (
              <Card key={c.id}>
                <CardContent className="flex items-center justify-between pt-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{c.name}</h3>
                      <Badge variant={c.status === 'sent' ? 'default' : c.status === 'scheduled' ? 'secondary' : 'outline'}>
                        {c.status === 'sent' ? 'Enviada' : c.status === 'scheduled' ? 'Agendada' : 'Rascunho'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{c.message}</p>
                    {c.status === 'sent' && (
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Enviados: {c.sent_count}</span>
                        <span>Entregues: {c.delivered_count}</span>
                        <span>Cliques: {c.click_count}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {c.status === 'draft' && <Button size="sm"><Send className="h-3.5 w-3.5 mr-1" /> Enviar</Button>}
                    {c.status === 'scheduled' && <Button size="sm" variant="outline"><Clock className="h-3.5 w-3.5 mr-1" /> Reagendar</Button>}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Automações */}
        <TabsContent value="automations">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Automações SMS Ativas</CardTitle>
              <CardDescription>SMS disparados automaticamente por gatilhos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: 'Boas-vindas SMS', trigger: 'Novo contato cadastrado', sends: 0, active: false },
                { name: 'Carrinho abandonado', trigger: 'Abandono de checkout', sends: 0, active: false },
                { name: 'Lembrete de renovação', trigger: '7 dias antes do vencimento', sends: 0, active: false },
              ].map((a, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{a.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3" /> {a.trigger} • {a.sends} envios
                    </p>
                  </div>
                  <Switch checked={a.active} />
                </div>
              ))}
              <div className="text-center py-4 text-sm text-muted-foreground">
                Configure automações SMS no menu <strong>Automações</strong> selecionando a ação "Enviar SMS"
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mensagens Recebidas */}
        <TabsContent value="inbox">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" /> Two-Way Messaging
              </CardTitle>
              <CardDescription>Respostas recebidas dos contatos via SMS</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <InboxIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhuma mensagem recebida</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  As respostas aparecerão aqui quando o provedor SMS estiver configurado com webhook de recebimento
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transações */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações SMS</CardTitle>
              <CardDescription>Todas as compras e consumos de créditos SMS</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhuma transação encontrada</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Compre seu primeiro pacote de créditos SMS para começar</p>
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
                            {tx.type === 'purchase' ? 'Compra' : tx.type === 'purchase_pending' ? 'Pendente' : 'Consumo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{tx.description || '-'}</TableCell>
                        <TableCell className={`text-right font-medium ${tx.type.includes('purchase') ? 'text-green-600' : 'text-red-500'}`}>
                          {tx.type.includes('purchase') ? '+' : '-'}{tx.amount.toLocaleString('pt-BR')}
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
}
