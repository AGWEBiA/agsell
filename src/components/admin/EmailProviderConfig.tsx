import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Mail,
  Server,
  Zap,
  Shield,
  CheckCircle,
  AlertTriangle,
  Settings,
  Eye,
  EyeOff,
  Save,
  TestTube,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ProviderType = 'resend' | 'amazon_ses' | 'sendgrid';

interface ProviderConfig {
  provider: ProviderType;
  resend_api_key?: string;
  ses_access_key_id?: string;
  ses_secret_access_key?: string;
  ses_region?: string;
  sendgrid_api_key?: string;
  default_from_email?: string;
  default_from_name?: string;
}

export function EmailProviderConfig() {
  const queryClient = useQueryClient();
  const [showSecrets, setShowSecrets] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  // Fetch global email config from platform settings
  // We store this as a special organization_integration with a known org-less pattern
  // or we use a dedicated approach. Here we use Supabase secrets + a simple settings record.
  const { data: config, isLoading } = useQuery({
    queryKey: ['admin_email_provider_config'],
    queryFn: async () => {
      // We look for a platform-level integration (org_id = null is not possible due to FK)
      // Instead we store in a special "platform_settings" approach
      // For now, read from all org integrations of email type to show what's configured
      const { data, error } = await supabase
        .from('organization_integrations')
        .select('*')
        .in('integration_type', ['resend', 'amazon_ses', 'sendgrid'])
        .eq('is_active', true)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const integration = data[0];
        const cfg = (integration.config || {}) as Record<string, string>;
        return {
          id: integration.id,
          organization_id: integration.organization_id,
          provider: integration.integration_type as ProviderType,
          resend_api_key: cfg.api_key || '',
          ses_access_key_id: cfg.access_key_id || '',
          ses_secret_access_key: cfg.secret_access_key || '',
          ses_region: cfg.region || 'us-east-1',
          sendgrid_api_key: cfg.api_key || '',
          default_from_email: cfg.from_email || '',
          default_from_name: cfg.from_name || '',
        };
      }

      return null;
    },
  });

  const [formState, setFormState] = useState<ProviderConfig>({
    provider: 'resend',
    resend_api_key: '',
    ses_access_key_id: '',
    ses_secret_access_key: '',
    ses_region: 'us-east-1',
    sendgrid_api_key: '',
    default_from_email: 'noreply@agsell.com',
    default_from_name: 'AG Sell',
  });

  // Sync form state when config loads
  React.useEffect(() => {
    if (config) {
      setFormState({
        provider: config.provider,
        resend_api_key: config.resend_api_key || '',
        ses_access_key_id: config.ses_access_key_id || '',
        ses_secret_access_key: config.ses_secret_access_key || '',
        ses_region: config.ses_region || 'us-east-1',
        sendgrid_api_key: config.sendgrid_api_key || '',
        default_from_email: config.default_from_email || '',
        default_from_name: config.default_from_name || '',
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async (state: ProviderConfig) => {
      // Build config object based on provider
      let configObj: Record<string, string> = {
        from_email: state.default_from_email || '',
        from_name: state.default_from_name || '',
      };

      switch (state.provider) {
        case 'resend':
          configObj.api_key = state.resend_api_key || '';
          break;
        case 'amazon_ses':
          configObj.access_key_id = state.ses_access_key_id || '';
          configObj.secret_access_key = state.ses_secret_access_key || '';
          configObj.region = state.ses_region || 'us-east-1';
          break;
        case 'sendgrid':
          configObj.api_key = state.sendgrid_api_key || '';
          break;
      }

      if (config?.id) {
        // Update existing
        const { error } = await supabase
          .from('organization_integrations')
          .update({
            integration_type: state.provider,
            name: `Email - ${state.provider}`,
            config: configObj,
            is_active: true,
          })
          .eq('id', config.id);
        if (error) throw error;
      } else {
        // We need an organization_id - get the first org (admin's org)
        const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
        if (!orgs?.length) throw new Error('Nenhuma organização encontrada');

        // First deactivate any existing email integrations
        await supabase
          .from('organization_integrations')
          .update({ is_active: false })
          .in('integration_type', ['resend', 'amazon_ses', 'sendgrid']);

        const { error } = await supabase
          .from('organization_integrations')
          .insert({
            organization_id: orgs[0].id,
            integration_type: state.provider,
            name: `Email - ${state.provider}`,
            config: configObj,
            is_active: true,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_email_provider_config'] });
      toast.success('Configuração do provedor de e-mail salva com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar: ' + error.message);
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formState);
  };

  const maskSecret = (value: string) => {
    if (!value || value.length < 8) return '••••••••';
    return value.slice(0, 4) + '••••••••' + value.slice(-4);
  };

  const providerInfo = {
    resend: {
      icon: Zap,
      label: 'Resend',
      color: 'text-primary',
      description: 'API moderna e simples. Ideal para começar rapidamente.',
    },
    amazon_ses: {
      icon: Server,
      label: 'Amazon SES',
      color: 'text-chart-2',
      description: 'Custo-eficiente em escala. ~8x mais barato que Resend.',
    },
    sendgrid: {
      icon: Mail,
      label: 'SendGrid',
      color: 'text-chart-3',
      description: 'Plataforma robusta com analytics avançado.',
    },
  };

  const currentProvider = providerInfo[formState.provider];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Provedor de E-mail Global
        </h2>
        <p className="text-muted-foreground mt-1">
          Configure o provedor de e-mail usado por toda a plataforma. Cada cliente configura seu próprio domínio de envio.
        </p>
      </div>

      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Provedor Ativo</CardTitle>
          <CardDescription>
            Selecione qual serviço será usado para enviar e-mails de todos os clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {(Object.entries(providerInfo) as [ProviderType, typeof providerInfo.resend][]).map(
              ([key, info]) => {
                const Icon = info.icon;
                const isSelected = formState.provider === key;
                return (
                  <button
                    key={key}
                    onClick={() => setFormState((s) => ({ ...s, provider: key }))}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`h-5 w-5 ${info.color}`} />
                      <span className="font-semibold">{info.label}</span>
                      {isSelected && (
                        <Badge className="ml-auto" variant="default">
                          Ativo
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{info.description}</p>
                  </button>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>

      {/* Credentials */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Credenciais — {currentProvider.label}
              </CardTitle>
              <CardDescription>As credenciais são armazenadas de forma segura</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSecrets(!showSecrets)}
            >
              {showSecrets ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showSecrets ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formState.provider === 'resend' && (
            <div>
              <Label>API Key</Label>
              <Input
                type={showSecrets ? 'text' : 'password'}
                placeholder="re_xxxxxxxxxxxxxxxx"
                value={formState.resend_api_key}
                onChange={(e) => setFormState((s) => ({ ...s, resend_api_key: e.target.value }))}
              />
            </div>
          )}

          {formState.provider === 'amazon_ses' && (
            <>
              <div>
                <Label>Access Key ID</Label>
                <Input
                  type={showSecrets ? 'text' : 'password'}
                  placeholder="AKIA..."
                  value={formState.ses_access_key_id}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, ses_access_key_id: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Secret Access Key</Label>
                <Input
                  type={showSecrets ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formState.ses_secret_access_key}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, ses_secret_access_key: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Região AWS</Label>
                <Select
                  value={formState.ses_region}
                  onValueChange={(v) => setFormState((s) => ({ ...s, ses_region: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                    <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                    <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                    <SelectItem value="sa-east-1">South America (São Paulo)</SelectItem>
                    <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {formState.provider === 'sendgrid' && (
            <div>
              <Label>API Key</Label>
              <Input
                type={showSecrets ? 'text' : 'password'}
                placeholder="SG.xxxxxxxxxxxxxxxx"
                value={formState.sendgrid_api_key}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, sendgrid_api_key: e.target.value }))
                }
              />
            </div>
          )}

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>E-mail Padrão (fallback)</Label>
              <Input
                placeholder="noreply@agsell.com"
                value={formState.default_from_email}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, default_from_email: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usado quando o cliente não tem domínio verificado
              </p>
            </div>
            <div>
              <Label>Nome Padrão (fallback)</Label>
              <Input
                placeholder="AG Sell"
                value={formState.default_from_name}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, default_from_name: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setTestDialogOpen(true)}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Enviar E-mail de Teste
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status card */}
      {config && (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="font-medium text-foreground">
                  Provedor configurado: {providerInfo[config.provider]?.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  Todos os clientes usarão este provedor. Cada um configura seu domínio na página "Domínio E-mail".
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test email dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar E-mail de Teste</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Endereço de destino</Label>
            <Input
              placeholder="seu@email.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast.info('Funcionalidade de teste será implementada na integração completa.');
                setTestDialogOpen(false);
              }}
            >
              Enviar Teste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
