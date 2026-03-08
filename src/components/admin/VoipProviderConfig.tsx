import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Phone, Save, Loader2, Shield, Wifi, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VoipProviderSettings {
  provider: 'twilio' | 'vonage' | 'none';
  enabled: boolean;
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_twiml_app_sid: string;
  twilio_phone_number: string;
  vonage_api_key: string;
  vonage_api_secret: string;
  vonage_application_id: string;
  vonage_private_key: string;
  vonage_phone_number: string;
  auto_record: boolean;
  auto_transcribe: boolean;
  auto_sentiment: boolean;
  max_call_duration_minutes: number;
  credits_per_minute: number;
}

const DEFAULT_SETTINGS: VoipProviderSettings = {
  provider: 'none',
  enabled: false,
  twilio_account_sid: '',
  twilio_auth_token: '',
  twilio_twiml_app_sid: '',
  twilio_phone_number: '',
  vonage_api_key: '',
  vonage_api_secret: '',
  vonage_application_id: '',
  vonage_private_key: '',
  vonage_phone_number: '',
  auto_record: true,
  auto_transcribe: true,
  auto_sentiment: true,
  max_call_duration_minutes: 60,
  credits_per_minute: 1,
};

export function VoipProviderConfig() {
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = React.useState<VoipProviderSettings>(DEFAULT_SETTINGS);
  const [isDirty, setIsDirty] = React.useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['platform_settings', 'voip_provider'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'voip_provider')
        .maybeSingle();
      if (error) throw error;
      return (data?.value as unknown as VoipProviderSettings) ?? DEFAULT_SETTINGS;
    },
  });

  React.useEffect(() => {
    if (settings) {
      setLocalSettings({ ...DEFAULT_SETTINGS, ...settings });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (newSettings: VoipProviderSettings) => {
      const { data: existing } = await supabase
        .from('platform_settings')
        .select('id')
        .eq('key', 'voip_provider')
        .maybeSingle();

      const payload = newSettings as unknown as Record<string, never>;

      if (existing) {
        const { error } = await supabase
          .from('platform_settings')
          .update({ value: payload, updated_at: new Date().toISOString() })
          .eq('key', 'voip_provider');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('platform_settings')
          .insert([{
            key: 'voip_provider',
            description: 'Configuração do provedor VoIP (Twilio/Vonage)',
            value: payload,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform_settings', 'voip_provider'] });
      toast.success('Configuração do provedor VoIP salva!');
      setIsDirty(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const update = (partial: Partial<VoipProviderSettings>) => {
    setLocalSettings((prev) => ({ ...prev, ...partial }));
    setIsDirty(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Provedor VoIP WebRTC
          </CardTitle>
          <CardDescription>
            Configure o provedor de telefonia para chamadas WebRTC diretamente no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>VoIP WebRTC Ativo</Label>
              <p className="text-xs text-muted-foreground">Habilita chamadas pelo navegador dentro do Inbox</p>
            </div>
            <Switch
              checked={localSettings.enabled}
              onCheckedChange={(v) => update({ enabled: v })}
            />
          </div>

          <div className="space-y-2">
            <Label>Provedor</Label>
            <Select
              value={localSettings.provider}
              onValueChange={(v) => update({ provider: v as VoipProviderSettings['provider'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum (apenas tel: link)</SelectItem>
                <SelectItem value="twilio">Twilio</SelectItem>
                <SelectItem value="vonage">Vonage (Nexmo)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {localSettings.provider === 'none' && (
            <div className="p-3 rounded-lg bg-muted/50 border flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Sem provedor configurado, o sistema usará links <code>tel:</code> para abrir o discador nativo do dispositivo (Fase 1).
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Twilio Config */}
      {localSettings.provider === 'twilio' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Credenciais Twilio
            </CardTitle>
            <CardDescription>
              Obtenha estas informações no <a href="https://console.twilio.com" target="_blank" rel="noopener" className="text-primary underline">Console do Twilio</a>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Account SID</Label>
                <Input
                  value={localSettings.twilio_account_sid}
                  onChange={(e) => update({ twilio_account_sid: e.target.value })}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  type="password"
                />
              </div>
              <div className="space-y-2">
                <Label>Auth Token</Label>
                <Input
                  value={localSettings.twilio_auth_token}
                  onChange={(e) => update({ twilio_auth_token: e.target.value })}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  type="password"
                />
              </div>
              <div className="space-y-2">
                <Label>TwiML App SID</Label>
                <Input
                  value={localSettings.twilio_twiml_app_sid}
                  onChange={(e) => update({ twilio_twiml_app_sid: e.target.value })}
                  placeholder="APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
                <p className="text-xs text-muted-foreground">Necessário para chamadas WebRTC via Twilio Client</p>
              </div>
              <div className="space-y-2">
                <Label>Número de Telefone</Label>
                <Input
                  value={localSettings.twilio_phone_number}
                  onChange={(e) => update({ twilio_phone_number: e.target.value })}
                  placeholder="+5511999999999"
                />
                <p className="text-xs text-muted-foreground">Caller ID exibido para o destinatário</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vonage Config */}
      {localSettings.provider === 'vonage' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Credenciais Vonage
            </CardTitle>
            <CardDescription>
              Obtenha estas informações no <a href="https://dashboard.nexmo.com" target="_blank" rel="noopener" className="text-primary underline">Dashboard do Vonage</a>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  value={localSettings.vonage_api_key}
                  onChange={(e) => update({ vonage_api_key: e.target.value })}
                  placeholder="xxxxxxxx"
                  type="password"
                />
              </div>
              <div className="space-y-2">
                <Label>API Secret</Label>
                <Input
                  value={localSettings.vonage_api_secret}
                  onChange={(e) => update({ vonage_api_secret: e.target.value })}
                  placeholder="xxxxxxxxxxxxxxxx"
                  type="password"
                />
              </div>
              <div className="space-y-2">
                <Label>Application ID</Label>
                <Input
                  value={localSettings.vonage_application_id}
                  onChange={(e) => update({ vonage_application_id: e.target.value })}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label>Número de Telefone</Label>
                <Input
                  value={localSettings.vonage_phone_number}
                  onChange={(e) => update({ vonage_phone_number: e.target.value })}
                  placeholder="+5511999999999"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI & Recording Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wifi className="h-4 w-4 text-primary" />
            Configurações de Chamada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Duração Máxima (minutos)</Label>
              <Input
                type="number"
                value={localSettings.max_call_duration_minutes}
                onChange={(e) => update({ max_call_duration_minutes: Number(e.target.value) })}
                min={1}
                max={180}
              />
            </div>
            <div className="space-y-2">
              <Label>Créditos por Minuto</Label>
              <Input
                type="number"
                value={localSettings.credits_per_minute}
                onChange={(e) => update({ credits_per_minute: Number(e.target.value) })}
                min={1}
                max={10}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Gravar Automaticamente</Label>
                <p className="text-xs text-muted-foreground">Salva a gravação de cada chamada</p>
              </div>
              <Switch
                checked={localSettings.auto_record}
                onCheckedChange={(v) => update({ auto_record: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Transcrição Automática (IA)</Label>
                <p className="text-xs text-muted-foreground">Transcreve a gravação automaticamente após a chamada</p>
              </div>
              <Switch
                checked={localSettings.auto_transcribe}
                onCheckedChange={(v) => update({ auto_transcribe: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Análise de Sentimento (IA)</Label>
                <p className="text-xs text-muted-foreground">Analisa o sentimento da conversa automaticamente</p>
              </div>
              <Switch
                checked={localSettings.auto_sentiment}
                onCheckedChange={(v) => update({ auto_sentiment: v })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate(localSettings)}
          disabled={!isDirty || saveMutation.isPending}
          className="gap-2"
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Configuração VoIP
        </Button>
      </div>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status da Integração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Provedor</span>
              <Badge variant={localSettings.provider !== 'none' ? 'default' : 'secondary'}>
                {localSettings.provider === 'none' ? 'Não configurado' : localSettings.provider === 'twilio' ? 'Twilio' : 'Vonage'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>WebRTC</span>
              <Badge variant={localSettings.enabled && localSettings.provider !== 'none' ? 'default' : 'secondary'}>
                {localSettings.enabled && localSettings.provider !== 'none' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Gravação</span>
              <Badge variant={localSettings.auto_record ? 'default' : 'secondary'}>
                {localSettings.auto_record ? 'Automática' : 'Desativada'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Transcrição IA</span>
              <Badge variant={localSettings.auto_transcribe ? 'default' : 'secondary'}>
                {localSettings.auto_transcribe ? 'Ativa' : 'Desativada'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Sentimento IA</span>
              <Badge variant={localSettings.auto_sentiment ? 'default' : 'secondary'}>
                {localSettings.auto_sentiment ? 'Ativo' : 'Desativado'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
