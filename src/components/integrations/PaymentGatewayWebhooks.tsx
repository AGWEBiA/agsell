import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Copy, Check, ExternalLink, Settings, Trash2, Shield, Webhook } from 'lucide-react';
import { toast } from 'sonner';
import { usePaymentGatewayIntegrations, GatewayType } from '@/hooks/usePaymentGatewayIntegrations';

export function PaymentGatewayWebhooks() {
  const {
    isLoading,
    gatewayTypes,
    gatewayInfo,
    getWebhookUrl,
    getGatewayIntegration,
    saveIntegration,
    toggleIntegration,
    removeIntegration,
  } = usePaymentGatewayIntegrations();

  const [configGateway, setConfigGateway] = useState<GatewayType | null>(null);
  const [webhookSecret, setWebhookSecret] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const copyToClipboard = (text: string, gateway: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(gateway);
    toast.success('URL copiada!');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const openConfig = (gateway: GatewayType) => {
    const existing = getGatewayIntegration(gateway);
    setWebhookSecret((existing?.config?.webhook_secret as string) || '');
    setConfigGateway(gateway);
  };

  const handleSave = () => {
    if (!configGateway) return;
    saveIntegration.mutate({ gateway: configGateway, webhookSecret });
    setConfigGateway(null);
  };

  if (isLoading) {
    return <div className="grid gap-4 md:grid-cols-2">
      {[1, 2, 3, 4].map(i => <Card key={i} className="animate-pulse h-48" />)}
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
          <Webhook className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Gateways de Pagamento</h3>
          <p className="text-sm text-muted-foreground">
            Conecte via webhook para receber eventos de vendas automaticamente
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {gatewayTypes.map((gateway) => {
          const info = gatewayInfo[gateway];
          const integration = getGatewayIntegration(gateway);
          const isConnected = !!integration?.is_active;
          const webhookUrl = getWebhookUrl(gateway);

          return (
            <Card key={gateway} className={`transition-all hover:shadow-md ${isConnected ? 'border-green-300 dark:border-green-700' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{info.icon}</span>
                    <div>
                      <CardTitle className="text-base">{info.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">{info.description}</CardDescription>
                    </div>
                  </div>
                  {isConnected && (
                    <Badge className="bg-green-500 text-white shrink-0">
                      <Check className="h-3 w-3 mr-1" />Ativo
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Webhook URL - always show */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">URL do Webhook</Label>
                  <div className="flex gap-1.5">
                    <Input
                      value={webhookUrl}
                      readOnly
                      className="text-xs font-mono bg-muted/50"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => copyToClipboard(webhookUrl, gateway)}
                    >
                      {copiedUrl === gateway ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openConfig(gateway)}>
                      <Settings className="h-3.5 w-3.5 mr-1.5" />
                      {integration ? 'Configurar' : 'Ativar'}
                    </Button>
                    {integration && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => removeIntegration.mutate(gateway)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {integration && (
                    <Switch
                      checked={!!integration.is_active}
                      onCheckedChange={(checked) => toggleIntegration.mutate({ gateway, isActive: checked })}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Config Dialog */}
      <Dialog open={!!configGateway} onOpenChange={(open) => !open && setConfigGateway(null)}>
        <DialogContent className="sm:max-w-lg">
          {configGateway && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{gatewayInfo[configGateway].icon}</span>
                  Configurar {gatewayInfo[configGateway].name}
                </DialogTitle>
                <DialogDescription>
                  Configure o webhook no painel do {gatewayInfo[configGateway].name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Instructions */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">Como configurar:</p>
                  <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                    {gatewayInfo[configGateway].instructions.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>

                {/* Webhook URL */}
                <div className="space-y-2">
                  <Label>URL do Webhook (cole no {gatewayInfo[configGateway].name})</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getWebhookUrl(configGateway)}
                      readOnly
                      className="font-mono text-xs bg-muted/50"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(getWebhookUrl(configGateway), configGateway)}
                    >
                      {copiedUrl === configGateway ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Webhook Secret */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Label>Webhook Secret / Token (opcional)</Label>
                  </div>
                  <Input
                    type="password"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder="Cole o secret/token do gateway para verificação de assinatura"
                  />
                  <p className="text-xs text-muted-foreground">
                    Se configurado, validaremos a assinatura de cada webhook recebido para garantir autenticidade.
                  </p>
                </div>

                {/* Link to docs */}
                <a
                  href={gatewayInfo[configGateway].docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir painel do {gatewayInfo[configGateway].name}
                </a>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setConfigGateway(null)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saveIntegration.isPending}>
                  {saveIntegration.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
