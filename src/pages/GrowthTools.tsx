import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useGrowthTools, useCreateGrowthTool, useDeleteGrowthTool, useUpdateGrowthTool } from '@/hooks/useGrowthTools';
import { Plus, Rocket, Trash2, Link as LinkIcon, QrCode, Copy, ExternalLink, MousePointerClick } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function GrowthTools() {
  const { data: tools = [], isLoading } = useGrowthTools();
  const createTool = useCreateGrowthTool();
  const deleteTool = useDeleteGrowthTool();
  const updateTool = useUpdateGrowthTool();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    tool_type: 'link',
    channel: 'whatsapp',
    phone_number: '',
    prefilled_message: '',
  });

  const handleCreate = () => {
    if (!form.name) return;
    createTool.mutate(
      { name: form.name, tool_type: form.tool_type, channel: form.channel, phone_number: form.phone_number || null, prefilled_message: form.prefilled_message || null },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({ name: '', tool_type: 'link', channel: 'whatsapp', phone_number: '', prefilled_message: '' });
        },
      }
    );
  };

  const generateLink = (tool: any) => {
    if (tool.channel === 'whatsapp' && tool.phone_number) {
      const msg = tool.prefilled_message ? `&text=${encodeURIComponent(tool.prefilled_message)}` : '';
      return `https://wa.me/${tool.phone_number.replace(/\D/g, '')}${msg ? '?' + msg.slice(1) : ''}`;
    }
    if (tool.channel === 'instagram' && tool.phone_number) {
      // phone_number field stores the Instagram username for Instagram tools
      return `https://ig.me/m/${tool.phone_number.replace('@', '')}`;
    }
    return '#';
  };

  const copyLink = (tool: any) => {
    const link = generateLink(tool);
    navigator.clipboard.writeText(link);
    toast({ title: 'Link copiado!' });
  };

  const toolTypeIcon = (type: string) => {
    switch (type) {
      case 'qrcode': return <QrCode className="h-4 w-4" />;
      default: return <LinkIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Rocket className="h-8 w-8 text-primary" />
            Growth Tools
          </h1>
          <p className="text-muted-foreground">Links, QR Codes e widgets para captar leads</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nova Tool</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Growth Tool</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Link bio Instagram" />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.tool_type} onValueChange={v => setForm(f => ({ ...f, tool_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Link Direto</SelectItem>
                    <SelectItem value="qrcode">QR Code</SelectItem>
                    <SelectItem value="widget">Widget</SelectItem>
                    <SelectItem value="landing">Landing Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Canal</Label>
                <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{form.channel === 'instagram' ? 'Username do Instagram' : 'Número WhatsApp (com DDI)'}</Label>
                <Input value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} placeholder={form.channel === 'instagram' ? '@seuperfil' : '5511999999999'} />
              </div>
              <div>
                <Label>Mensagem pré-preenchida</Label>
                <Textarea
                  value={form.prefilled_message}
                  onChange={e => setForm(f => ({ ...f, prefilled_message: e.target.value }))}
                  placeholder="Olá! Vi seu anúncio e..."
                  rows={2}
                />
              </div>
              <Button onClick={handleCreate} disabled={createTool.isPending} className="w-full">
                {createTool.isPending ? 'Criando...' : 'Criar Tool'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : tools.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Rocket className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma growth tool</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-md">
              Crie links, QR codes e widgets para captar leads diretamente no WhatsApp ou Instagram.
            </p>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Criar Primeira Tool</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map(tool => (
            <Card key={tool.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-2">
                  {toolTypeIcon(tool.tool_type)}
                  <CardTitle className="text-base">{tool.name}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={tool.is_active}
                    onCheckedChange={checked => updateTool.mutate({ id: tool.id, is_active: checked })}
                  />
                  <Button variant="ghost" size="icon" onClick={() => deleteTool.mutate(tool.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{tool.channel}</Badge>
                  <Badge variant="secondary">{tool.tool_type}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MousePointerClick className="h-3.5 w-3.5" />
                  {tool.clicks_count} cliques • {tool.conversions_count} conversões
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => copyLink(tool)}>
                    <Copy className="h-3.5 w-3.5 mr-1" />Copiar Link
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(generateLink(tool), '_blank')}>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
