import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Copy, Headphones, Plus, X, Save, Loader2 } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PortalConfig {
  welcome_message: string;
  categories: string[];
  business_hours: string;
  chat_enabled: boolean;
  chat_whatsapp: string;
}

const defaultConfig: PortalConfig = {
  welcome_message: 'Como podemos ajudar você?',
  categories: ['Dúvida', 'Problema técnico', 'Financeiro', 'Sugestão', 'Outro'],
  business_hours: 'Segunda a Sexta, 9h às 18h',
  chat_enabled: false,
  chat_whatsapp: '',
};

export function SupportPortalSettings() {
  const { currentOrganization } = useOrganization();
  const [config, setConfig] = useState<PortalConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const portalUrl = currentOrganization
    ? `${window.location.origin}/support-portal/${currentOrganization.slug}`
    : '';

  useEffect(() => {
    if (currentOrganization?.settings) {
      const settings = currentOrganization.settings as any;
      if (settings.support_portal) {
        setConfig({ ...defaultConfig, ...settings.support_portal });
      }
    }
  }, [currentOrganization]);

  const handleSave = async () => {
    if (!currentOrganization) return;
    setSaving(true);
    try {
      const currentSettings = (currentOrganization.settings as any) || {};
      const { error } = await supabase
        .from('organizations')
        .update({
          settings: {
            ...currentSettings,
            support_portal: config,
          },
        })
        .eq('id', currentOrganization.id);

      if (error) throw error;
      toast.success('Configurações salvas!');
    } catch {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    if (config.categories.includes(newCategory.trim())) return;
    setConfig(c => ({ ...c, categories: [...c.categories, newCategory.trim()] }));
    setNewCategory('');
  };

  const removeCategory = (cat: string) => {
    setConfig(c => ({ ...c, categories: c.categories.filter(c2 => c2 !== cat) }));
  };

  return (
    <div className="space-y-6">
      {/* Portal URL */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Portal de Suporte Público</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Compartilhe o link abaixo com seus clientes para que abram chamados de suporte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={portalUrl} readOnly className="h-9 text-sm font-mono bg-muted" />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(portalUrl);
                toast.success('Link copiado!');
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(portalUrl, '_blank')}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configurações do Portal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Mensagem de boas-vindas</Label>
            <Input
              value={config.welcome_message}
              onChange={e => setConfig(c => ({ ...c, welcome_message: e.target.value }))}
              className="h-9 text-sm"
              placeholder="Como podemos ajudar você?"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Horário de atendimento</Label>
            <Input
              value={config.business_hours}
              onChange={e => setConfig(c => ({ ...c, business_hours: e.target.value }))}
              className="h-9 text-sm"
              placeholder="Segunda a Sexta, 9h às 18h"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm">Categorias de chamados</Label>
            <div className="flex flex-wrap gap-1.5">
              {config.categories.map(cat => (
                <Badge key={cat} variant="secondary" className="gap-1 text-xs">
                  {cat}
                  <button onClick={() => removeCategory(cat)} className="ml-0.5 hover:text-destructive">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nova categoria..."
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline" onClick={addCategory} className="h-8">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Chat via WhatsApp</Label>
              <p className="text-xs text-muted-foreground">Permitir que clientes iniciem conversa direta</p>
            </div>
            <Switch
              checked={config.chat_enabled}
              onCheckedChange={v => setConfig(c => ({ ...c, chat_enabled: v }))}
            />
          </div>

          {config.chat_enabled && (
            <div className="space-y-1.5">
              <Label className="text-xs">Número do WhatsApp</Label>
              <Input
                placeholder="5511999999999"
                value={config.chat_whatsapp}
                onChange={e => setConfig(c => ({ ...c, chat_whatsapp: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
