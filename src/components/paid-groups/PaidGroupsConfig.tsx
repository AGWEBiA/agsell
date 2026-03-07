import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { usePaidGroupsConfig } from '@/hooks/usePaidGroups';
import { toast } from 'sonner';

const SUPPORTED_GATEWAYS = [
  'Stripe', 'Kiwify', 'Hotmart', 'Eduzz', 'Monetizze', 'PerfectPay',
  'Braip', 'Guru', 'Lastlink', 'Pepper', 'Yampi', 'Ticto', 'Kirvano',
  'Payt', 'Greenn', 'CartPanda', 'HeroSpark', 'AppMax', 'Doppus', 'Webhook Genérico',
];

export function PaidGroupsConfig() {
  const { config, isLoading, upsertConfig } = usePaidGroupsConfig();
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (config) {
      setUrl(config.evolution_api_url || '');
      setApiKey(config.evolution_api_key || '');
      setIsActive(config.is_active ?? true);
    }
  }, [config]);

  const webhookUrl = config?.webhook_secret
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paid-groups-webhook/${config.webhook_secret}/{gateway}`
    : 'Salve a configuração para gerar a URL do webhook';

  const copyWebhook = (gateway: string) => {
    const finalUrl = webhookUrl.replace('{gateway}', gateway.toLowerCase().replace(/\s+/g, ''));
    navigator.clipboard.writeText(finalUrl);
    toast.success('URL copiada!');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Evolution API</CardTitle>
          <CardDescription>Configure as credenciais da sua instância Evolution API para gerenciar participantes dos grupos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL da API</Label>
            <Input placeholder="https://sua-evolution-api.com" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="flex gap-2">
              <Input type={showKey ? 'text' : 'password'} placeholder="Sua API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
              <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)}>
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Ativo</Label>
          </div>
          <Button onClick={() => upsertConfig.mutate({ evolution_api_url: url, evolution_api_key: apiKey, is_active: isActive })} disabled={upsertConfig.isPending}>
            Salvar Configuração
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>URLs de Webhook</CardTitle>
          <CardDescription>Use essas URLs nos seus gateways de pagamento para automatizar a gestão de membros.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {config?.webhook_secret ? (
            <div className="space-y-2">
              {SUPPORTED_GATEWAYS.map((gw) => {
                const gwSlug = gw.toLowerCase().replace(/\s+/g, '').replace('é', 'e');
                const finalUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paid-groups-webhook/${config.webhook_secret}/${gwSlug}`;
                return (
                  <div key={gw} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Badge variant="outline" className="min-w-[100px] justify-center">{gw}</Badge>
                    <code className="flex-1 text-xs truncate text-muted-foreground">{finalUrl}</code>
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={() => { navigator.clipboard.writeText(finalUrl); toast.success(`URL ${gw} copiada!`); }}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Salve a configuração acima para gerar suas URLs de webhook.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
