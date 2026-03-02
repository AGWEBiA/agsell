import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Server, CheckCircle2, XCircle, RefreshCw, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EvolutionConfig {
  api_url: string;
  api_key: string;
  is_configured: boolean;
}

export function EvolutionAPIGlobalConfig() {
  const queryClient = useQueryClient();
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [localConfig, setLocalConfig] = useState<EvolutionConfig | null>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ['platform_settings', 'evolution_api'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'evolution_api')
        .single();
      if (error) throw error;
      return data.value as unknown as EvolutionConfig;
    },
  });

  const editConfig = localConfig ?? config;

  const saveConfig = useMutation({
    mutationFn: async (newConfig: EvolutionConfig) => {
      const val = { 
        ...newConfig, 
        is_configured: !!(newConfig.api_url && newConfig.api_key) 
      };
      const { error } = await supabase
        .from('platform_settings')
        .update({ value: val as unknown as import('@/integrations/supabase/types').Json })
        .eq('key', 'evolution_api');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform_settings'] });
      setLocalConfig(null);
      toast.success('Configuração da Evolution API salva!');
    },
    onError: (err) => toast.error('Erro ao salvar: ' + err.message),
  });

  const handleTest = async () => {
    const cfg = editConfig;
    if (!cfg?.api_url || !cfg?.api_key) {
      toast.error('Preencha URL e API Key primeiro');
      return;
    }
    setIsTesting(true);
    try {
      const res = await fetch(`${cfg.api_url}/instance/fetchInstances`, {
        headers: { apikey: cfg.api_key },
      });
      if (res.ok) {
        const data = await res.json();
        const count = Array.isArray(data) ? data.length : 0;
        toast.success(`Conexão OK! ${count} instância(s) encontrada(s).`);
      } else {
        toast.error('Erro ao conectar — verifique URL e chave.');
      }
    } catch {
      toast.error('Não foi possível conectar. Verifique a URL.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    if (!editConfig) return;
    saveConfig.mutate(editConfig);
  };

  if (isLoading) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Carregando...</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <Server className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Evolution API — Configuração Global</CardTitle>
                <CardDescription>
                  Configure uma única vez. Todas as organizações usarão esta conexão.
                </CardDescription>
              </div>
            </div>
            <Badge variant={config?.is_configured ? 'default' : 'secondary'}>
              {config?.is_configured ? (
                <><CheckCircle2 className="h-3 w-3 mr-1" /> Configurada</>
              ) : (
                <><XCircle className="h-3 w-3 mr-1" /> Não configurada</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="global-evo-url">URL da Evolution API *</Label>
            <Input
              id="global-evo-url"
              placeholder="https://evo.seudominio.com"
              value={editConfig?.api_url || ''}
              onChange={(e) =>
                setLocalConfig({ ...(editConfig || { api_url: '', api_key: '', is_configured: false }), api_url: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">URL base do seu servidor Evolution API</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="global-evo-key">API Key Global *</Label>
            <div className="relative">
              <Input
                id="global-evo-key"
                type={showKey ? 'text' : 'password'}
                placeholder="Sua chave de API global"
                value={editConfig?.api_key || ''}
                onChange={(e) =>
                  setLocalConfig({ ...(editConfig || { api_url: '', api_key: '', is_configured: false }), api_key: e.target.value })
                }
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Chave de API com permissão global para criar/gerenciar instâncias</p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saveConfig.isPending}>
              {saveConfig.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salvar Configuração
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={isTesting}>
              {isTesting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
              Testar Conexão
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como funciona</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Configure a URL e API Key do seu servidor Evolution API acima.</p>
          <p>2. As organizações só precisarão informar o <strong>nome da instância</strong> e <strong>escanear o QR Code</strong>.</p>
          <p>3. Toda comunicação WhatsApp será roteada através desta configuração central.</p>
          <Button variant="link" className="p-0 h-auto" asChild>
            <a href="https://doc.evolution-api.com" target="_blank" rel="noopener noreferrer">
              Documentação da Evolution API <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
