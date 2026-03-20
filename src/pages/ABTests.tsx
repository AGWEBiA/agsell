import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useABTests, useCreateABTest, useUpdateABTest, useDeleteABTest } from '@/hooks/useABTests';
import { Plus, FlaskConical, Trash2, Trophy, BarChart3, Play, Pause, Target, Users, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const channelConfig: Record<string, { label: string; icon: typeof Mail; subjectEnabled: boolean }> = {
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, subjectEnabled: false },
  email: { label: 'E-mail', icon: Mail, subjectEnabled: true },
  instagram: { label: 'Instagram', icon: MessageSquare, subjectEnabled: false },
};

export default function ABTests() {
  const { data: tests = [], isLoading } = useABTests();
  const createTest = useCreateABTest();
  const updateTest = useUpdateABTest();
  const deleteTest = useDeleteABTest();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    channel: 'whatsapp',
    variant_a: { message: '', subject: '' },
    variant_b: { message: '', subject: '' },
  });

  const handleCreate = () => {
    if (!form.name || !form.variant_a.message || !form.variant_b.message) return;
    createTest.mutate(
      { name: form.name, channel: form.channel, variant_a: form.variant_a, variant_b: form.variant_b },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({ name: '', channel: 'whatsapp', variant_a: { message: '', subject: '' }, variant_b: { message: '', subject: '' } });
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      draft: { label: 'Rascunho', variant: 'secondary' },
      running: { label: 'Em execução', variant: 'default' },
      paused: { label: 'Pausado', variant: 'outline' },
      completed: { label: 'Concluído', variant: 'outline' },
    };
    const s = map[status] || map.draft;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const calcRate = (responses: number, sent: number) =>
    sent > 0 ? ((responses / sent) * 100).toFixed(1) + '%' : '—';

  const selectedChannel = channelConfig[form.channel] || channelConfig.whatsapp;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FlaskConical className="h-8 w-8 text-primary" />
            Testes A/B
          </h1>
          <p className="text-muted-foreground">Compare variantes de mensagens e otimize conversões</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Teste</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Criar Teste A/B</DialogTitle></DialogHeader>
            <div className="space-y-5">
              {/* Config básica */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do teste</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Teste abertura Black Friday" />
                </div>
                <div className="space-y-2">
                  <Label>Canal</Label>
                  <Select value={form.channel} onValueChange={v => setForm(f => ({
                    ...f,
                    channel: v,
                    variant_a: { ...f.variant_a, subject: '' },
                    variant_b: { ...f.variant_b, subject: '' },
                  }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Variantes lado a lado */}
              <div className="grid grid-cols-2 gap-4">
                {/* Variante A */}
                <div className="space-y-3 p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-blue-600">A</Badge>
                    <Label className="font-semibold">Variante A</Label>
                  </div>
                  {selectedChannel.subjectEnabled && (
                    <div className="space-y-1">
                      <Label className="text-xs">Assunto do e-mail</Label>
                      <Input
                        value={form.variant_a.subject}
                        onChange={e => setForm(f => ({ ...f, variant_a: { ...f.variant_a, subject: e.target.value } }))}
                        placeholder="Assunto da variante A..."
                        className="text-sm"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs">Mensagem</Label>
                    <Textarea
                      value={form.variant_a.message}
                      onChange={e => setForm(f => ({ ...f, variant_a: { ...f.variant_a, message: e.target.value } }))}
                      placeholder={`Mensagem da variante A via ${selectedChannel.label}...`}
                      rows={5}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Use {{nome}}, {{email}} para personalizar</p>
                </div>

                {/* Variante B */}
                <div className="space-y-3 p-4 border rounded-lg bg-orange-50/50 dark:bg-orange-950/20">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-orange-600">B</Badge>
                    <Label className="font-semibold">Variante B</Label>
                  </div>
                  {selectedChannel.subjectEnabled && (
                    <div className="space-y-1">
                      <Label className="text-xs">Assunto do e-mail</Label>
                      <Input
                        value={form.variant_b.subject}
                        onChange={e => setForm(f => ({ ...f, variant_b: { ...f.variant_b, subject: e.target.value } }))}
                        placeholder="Assunto da variante B..."
                        className="text-sm"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs">Mensagem</Label>
                    <Textarea
                      value={form.variant_b.message}
                      onChange={e => setForm(f => ({ ...f, variant_b: { ...f.variant_b, message: e.target.value } }))}
                      placeholder={`Mensagem da variante B via ${selectedChannel.label}...`}
                      rows={5}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Use {{nome}}, {{email}} para personalizar</p>
                </div>
              </div>

              <Button onClick={handleCreate} disabled={createTest.isPending || !form.name || !form.variant_a.message || !form.variant_b.message} className="w-full">
                {createTest.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando...</> : 'Criar Teste A/B'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">{[1, 2].map(i => <Skeleton key={i} className="h-48" />)}</div>
      ) : tests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FlaskConical className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum teste A/B</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-md">
              Crie testes A/B para comparar variantes de mensagens e descobrir qual gera mais engajamento.
            </p>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Criar Primeiro Teste</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tests.map(test => {
            const totalA = (test.sent_a || 0);
            const totalB = (test.sent_b || 0);
            const rateA = totalA > 0 ? ((test.responses_a || 0) / totalA * 100) : 0;
            const rateB = totalB > 0 ? ((test.responses_b || 0) / totalB * 100) : 0;
            const maxRate = Math.max(rateA, rateB, 1);

            return (
              <Card key={test.id}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle className="text-base">{test.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(test.status)}
                      <Badge variant="outline" className="text-xs">{channelConfig[test.channel]?.label || test.channel}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {test.status === 'draft' && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateTest.mutate({ id: test.id, status: 'running' })}>
                        <Play className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    {test.status === 'running' && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateTest.mutate({ id: test.id, status: 'paused' })}>
                        <Pause className="h-4 w-4 text-yellow-600" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteTest.mutate(test.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Variant A */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">A</Badge>
                          {test.winner === 'a' && <Trophy className="h-4 w-4 text-yellow-500" />}
                        </div>
                        <span className="text-xs text-muted-foreground">{test.sent_a} env. · {calcRate(test.responses_a, test.sent_a)} conv.</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{(test.variant_a as any).message}</p>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${maxRate > 0 ? (rateA / maxRate) * 100 : 0}%` }} />
                      </div>
                    </div>

                    {/* Variant B */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">B</Badge>
                          {test.winner === 'b' && <Trophy className="h-4 w-4 text-yellow-500" />}
                        </div>
                        <span className="text-xs text-muted-foreground">{test.sent_b} env. · {calcRate(test.responses_b, test.sent_b)} conv.</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{(test.variant_b as any).message}</p>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${maxRate > 0 ? (rateB / maxRate) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
