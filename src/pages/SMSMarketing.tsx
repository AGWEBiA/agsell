import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  MessageSquare, Send, Plus, Clock, Users, BarChart3,
  Zap, ArrowUpDown, Phone, Loader2, Inbox as InboxIcon,
} from 'lucide-react';

interface SMSCampaign {
  id: string;
  name: string;
  message: string;
  status: 'draft' | 'scheduled' | 'sent';
  sent_count: number;
  delivered_count: number;
  click_count: number;
  scheduled_at?: string;
  created_at: string;
}

export default function SMSMarketing() {
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([
    {
      id: '1', name: 'Promoção Flash 50%', message: 'Olá {nome}! Só hoje: 50% OFF em todos os planos. Acesse: {link}',
      status: 'sent', sent_count: 1250, delivered_count: 1180, click_count: 340,
      created_at: new Date().toISOString(),
    },
    {
      id: '2', name: 'Lembrete de Agendamento', message: 'Olá {nome}, confirmamos seu agendamento para amanhã às {horario}.',
      status: 'scheduled', sent_count: 0, delivered_count: 0, click_count: 0,
      scheduled_at: new Date(Date.now() + 86400000).toISOString(), created_at: new Date().toISOString(),
    },
  ]);
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [twoWayMessages] = useState([
    { id: '1', from: '+5511999887766', message: 'Gostaria de saber mais sobre o plano Pro', time: '14:32', status: 'unread' },
    { id: '2', from: '+5521988776655', message: 'Obrigado pelo atendimento!', time: '13:15', status: 'read' },
    { id: '3', from: '+5531977665544', message: 'Quero cancelar', time: '12:48', status: 'unread' },
  ]);

  const charCount = newMessage.length;
  const smsCount = Math.ceil(charCount / 160) || 1;

  const handleCreate = () => {
    if (!newName.trim() || !newMessage.trim()) return toast.error('Preencha todos os campos');
    setCampaigns(prev => [{
      id: Date.now().toString(), name: newName, message: newMessage,
      status: 'draft', sent_count: 0, delivered_count: 0, click_count: 0,
      created_at: new Date().toISOString(),
    }, ...prev]);
    setNewOpen(false);
    setNewName('');
    setNewMessage('');
    toast.success('Campanha SMS criada');
  };

  const stats = {
    total_sent: campaigns.reduce((s, c) => s + c.sent_count, 0),
    total_delivered: campaigns.reduce((s, c) => s + c.delivered_count, 0),
    total_clicks: campaigns.reduce((s, c) => s + c.click_count, 0),
    delivery_rate: 94.4,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Phone className="h-8 w-8 text-primary" /> SMS Marketing
          </h1>
          <p className="text-muted-foreground">Broadcast, automações e mensagens bidirecionais por SMS</p>
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
                  <span>{charCount} caracteres • {smsCount} SMS(s)</span>
                  <span>Variáveis: {'{nome}'}, {'{email}'}, {'{link}'}</span>
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full"><Send className="h-4 w-4 mr-2" /> Criar Campanha</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'SMS Enviados', value: stats.total_sent.toLocaleString(), icon: Send },
          { label: 'Entregues', value: stats.total_delivered.toLocaleString(), icon: MessageSquare },
          { label: 'Cliques', value: stats.total_clicks.toLocaleString(), icon: BarChart3 },
          { label: 'Taxa de Entrega', value: `${stats.delivery_rate}%`, icon: Zap },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="p-3 rounded-lg bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="automations">Automações SMS</TabsTrigger>
          <TabsTrigger value="inbox">Mensagens Recebidas</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          {campaigns.map(c => (
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
          ))}
        </TabsContent>

        <TabsContent value="automations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Automações SMS Ativas</CardTitle>
              <CardDescription>SMS disparados automaticamente por gatilhos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: 'Boas-vindas SMS', trigger: 'Novo contato cadastrado', sends: 458, active: true },
                { name: 'Carrinho abandonado', trigger: 'Abandono de checkout', sends: 123, active: true },
                { name: 'Lembrete de renovação', trigger: '7 dias antes do vencimento', sends: 67, active: false },
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inbox" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" /> Two-Way Messaging
              </CardTitle>
              <CardDescription>Respostas recebidas dos contatos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {twoWayMessages.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="p-2 rounded-full bg-primary/10">
                    <InboxIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground text-sm">{m.from}</span>
                      <span className="text-xs text-muted-foreground">{m.time}</span>
                      {m.status === 'unread' && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Novo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{m.message}</p>
                  </div>
                  <Button size="sm" variant="outline">Responder</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
