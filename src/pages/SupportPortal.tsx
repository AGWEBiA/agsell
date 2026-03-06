import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Headphones, Send, Search, Hash, Clock, CheckCircle2,
  AlertTriangle, MessageCircle, Ticket, Loader2, ArrowLeft,
  Phone, Mail, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface PortalInfo {
  name: string;
  logo_url: string | null;
  slug: string;
  portal: {
    welcome_message: string;
    categories: string[];
    business_hours: string;
    chat_enabled: boolean;
    chat_whatsapp: string | null;
  };
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Aberto', variant: 'destructive' },
  in_progress: { label: 'Em andamento', variant: 'default' },
  waiting_customer: { label: 'Aguardando retorno', variant: 'secondary' },
  resolved: { label: 'Resolvido', variant: 'secondary' },
  closed: { label: 'Fechado', variant: 'outline' },
};

export default function SupportPortal() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [portalInfo, setPortalInfo] = useState<PortalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Ticket form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<any>(null);

  // Track ticket
  const [protocol, setProtocol] = useState('');
  const [trackedTicket, setTrackedTicket] = useState<any>(null);
  const [tracking, setTracking] = useState(false);
  const [trackError, setTrackError] = useState('');

  useEffect(() => {
    if (!orgSlug) return;
    fetchPortalInfo();
  }, [orgSlug]);

  const fetchPortalInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/public-support-portal?action=org-info&slug=${orgSlug}`
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Portal não disponível');
        return;
      }
      const data = await res.json();
      setPortalInfo(data);
      if (data.portal.categories?.length > 0) {
        setCategory(data.portal.categories[0]);
      }
    } catch {
      setError('Erro ao carregar portal');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/public-support-portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_slug: orgSlug,
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          priority,
        }),
      });
      if (!res.ok) throw new Error('Erro ao criar ticket');
      const ticket = await res.json();
      setCreatedTicket(ticket);
    } catch {
      alert('Erro ao enviar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async () => {
    if (!protocol.trim()) return;
    setTracking(true);
    setTrackError('');
    setTrackedTicket(null);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/public-support-portal?action=track-ticket&protocol=${encodeURIComponent(protocol.trim())}&org=${orgSlug}`
      );
      if (!res.ok) {
        setTrackError('Ticket não encontrado. Verifique o protocolo.');
        return;
      }
      const data = await res.json();
      setTrackedTicket(data);
    } catch {
      setTrackError('Erro ao buscar ticket');
    } finally {
      setTracking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !portalInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full text-center">
          <CardContent className="pt-8 pb-6 space-y-3">
            <AlertTriangle className="h-10 w-10 mx-auto text-amber-500" />
            <h2 className="text-lg font-bold">{error || 'Portal não disponível'}</h2>
            <p className="text-sm text-slate-500">
              Este portal de suporte não está acessível no momento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (createdTicket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 space-y-4 text-center">
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold">Ticket criado com sucesso!</h2>
            <p className="text-sm text-slate-500">
              Sua solicitação foi registrada. Guarde o número do protocolo abaixo para acompanhar.
            </p>
            <div className="bg-slate-100 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Protocolo</p>
              <p className="text-lg font-mono font-bold text-slate-800">{createdTicket.protocol_number}</p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCreatedTicket(null);
                  setTitle('');
                  setDescription('');
                  setName('');
                  setEmail('');
                  setPhone('');
                }}
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Novo Ticket
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(createdTicket.protocol_number);
                }}
              >
                Copiar Protocolo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {portalInfo.logo_url ? (
            <img src={portalInfo.logo_url} alt={portalInfo.name} className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center">
              <Headphones className="h-4 w-4 text-white" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-sm">{portalInfo.name}</h1>
            <p className="text-xs text-slate-500">Central de Suporte</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">{portalInfo.portal.welcome_message}</h2>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            <span>{portalInfo.portal.business_hours}</span>
          </div>
        </div>

        {/* Chat WhatsApp */}
        {portalInfo.portal.chat_enabled && portalInfo.portal.chat_whatsapp && (
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Chat ao Vivo</p>
                  <p className="text-xs text-emerald-700">Fale diretamente com nossa equipe</p>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  const num = portalInfo.portal.chat_whatsapp!.replace(/\D/g, '');
                  window.open(`https://wa.me/${num}`, '_blank');
                }}
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1" />
                WhatsApp
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="new" className="gap-1.5">
              <Ticket className="h-3.5 w-3.5" />
              Abrir Chamado
            </TabsTrigger>
            <TabsTrigger value="track" className="gap-1.5">
              <Search className="h-3.5 w-3.5" />
              Acompanhar
            </TabsTrigger>
          </TabsList>

          {/* New Ticket */}
          <TabsContent value="new" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Novo Chamado</CardTitle>
                <CardDescription className="text-xs">Preencha os campos abaixo para abrir um chamado de suporte.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1">
                      <User className="h-3 w-3" /> Nome *
                    </Label>
                    <Input
                      placeholder="Seu nome"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1">
                      <Mail className="h-3 w-3" /> E-mail
                    </Label>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Telefone / WhatsApp
                  </Label>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label className="text-xs">Assunto *</Label>
                  <Input
                    placeholder="Descreva brevemente o problema"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Categoria</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {portalInfo.portal.categories.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Prioridade</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Descrição</Label>
                  <Textarea
                    placeholder="Descreva o problema com detalhes..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="min-h-[100px] text-sm"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={submitting || !name.trim() || !title.trim()}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar Chamado
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Track Ticket */}
          <TabsContent value="track" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Acompanhar Chamado</CardTitle>
                <CardDescription className="text-xs">
                  Digite o número do protocolo para verificar o status.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="SUP-20260306-XXXXX"
                      className="pl-9 font-mono h-9 text-sm"
                      value={protocol}
                      onChange={e => setProtocol(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleTrack()}
                    />
                  </div>
                  <Button onClick={handleTrack} disabled={tracking} size="sm">
                    {tracking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                {trackError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {trackError}
                  </div>
                )}

                {trackedTicket && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{trackedTicket.title}</h3>
                      <Badge variant={statusMap[trackedTicket.status]?.variant || 'outline'}>
                        {statusMap[trackedTicket.status]?.label || trackedTicket.status}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Protocolo</span>
                        <span className="font-mono">{trackedTicket.protocol_number}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Aberto em</span>
                        <span>{format(new Date(trackedTicket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                      {trackedTicket.category && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Categoria</span>
                          <span>{trackedTicket.category}</span>
                        </div>
                      )}
                      {trackedTicket.resolved_at && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Resolvido em</span>
                          <span className="text-emerald-600 font-medium">
                            {format(new Date(trackedTicket.resolved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pt-4">
          Powered by <span className="font-semibold">AG Sell</span>
        </div>
      </div>
    </div>
  );
}
