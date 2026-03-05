import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Zap, Loader2, CheckCircle2, AlertCircle, ArrowRight, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  platformId: string;
  platformName: string;
}

const platformConfigs: Record<string, { urlLabel: string; urlPlaceholder: string; keyLabel: string; keyHelp: string }> = {
  activecampaign: {
    urlLabel: 'URL da conta ActiveCampaign',
    urlPlaceholder: 'https://suaconta.api-us1.com',
    keyLabel: 'API Key',
    keyHelp: 'Encontre em Configurações → Desenvolvedor → Chave da API',
  },
  rdstation: {
    urlLabel: 'Token de API (RD Station)',
    urlPlaceholder: 'Seu token de API do RD Station Marketing',
    keyLabel: 'Client ID (opcional)',
    keyHelp: 'Encontre em Configurações → Integrações → Tokens de API',
  },
};

const importOptions = [
  { id: 'contacts', label: 'Contatos e Leads', desc: 'Todos os contatos com campos personalizados' },
  { id: 'tags', label: 'Tags e Listas', desc: 'Todas as tags e segmentações' },
  { id: 'automations', label: 'Automações', desc: 'Estrutura de automações e triggers' },
  { id: 'campaigns', label: 'Campanhas de E-mail', desc: 'Templates e histórico de campanhas' },
  { id: 'sequences', label: 'Sequências / Funis', desc: 'Funis de e-mail com todos os steps' },
];

interface MigrationProgress {
  step: string;
  total: number;
  processed: number;
  errors: number;
}

export function MigrationAPIConnect({ platformId, platformName }: Props) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const config = platformConfigs[platformId];

  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>(['contacts', 'tags']);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [completed, setCompleted] = useState(false);

  const toggleOption = (id: string) => {
    setSelectedOptions(prev => prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]);
  };

  const handleConnect = async () => {
    if (!apiUrl.trim()) { toast.error('Preencha a URL/Token da API'); return; }
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('migrate-platform', {
        body: {
          action: 'test_connection',
          platform: platformId,
          api_url: apiUrl,
          api_key: apiKey,
          organization_id: currentOrganization?.id,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setConnected(true);
      toast.success(`Conexão com ${platformName} estabelecida!`);
    } catch (err: any) {
      toast.error('Erro ao conectar: ' + err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleMigrate = async () => {
    if (!user || selectedOptions.length === 0) return;
    setMigrating(true);
    setProgress(null);
    try {
      const { data, error } = await supabase.functions.invoke('migrate-platform', {
        body: {
          action: 'migrate',
          platform: platformId,
          api_url: apiUrl,
          api_key: apiKey,
          organization_id: currentOrganization?.id,
          user_id: user.id,
          import_options: selectedOptions,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setProgress({
        step: 'Concluído',
        total: data.total || 0,
        processed: data.processed || 0,
        errors: data.errors || 0,
      });
      setCompleted(true);

      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      queryClient.invalidateQueries({ queryKey: ['email_campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['sequences'] });

      toast.success('Migração concluída com sucesso!');
    } catch (err: any) {
      toast.error('Erro na migração: ' + err.message);
    } finally {
      setMigrating(false);
    }
  };

  if (!config) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Migração Automática via API — {platformName}
        </CardTitle>
        <CardDescription>
          Conecte sua conta {platformName} e migre todos os dados automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg">
          <Shield className="h-4 w-4 text-primary" />
          <p className="text-xs text-muted-foreground">
            Suas credenciais são usadas apenas para leitura e não são armazenadas permanentemente.
          </p>
        </div>

        {/* Step 1: Connect */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={connected ? 'default' : 'secondary'}>1</Badge>
            <p className="font-medium">Conectar à API</p>
            {connected && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>{config.urlLabel}</Label>
              <Input value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder={config.urlPlaceholder} disabled={connected} />
            </div>
            {platformId === 'activecampaign' && (
              <div>
                <Label>{config.keyLabel}</Label>
                <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} disabled={connected} />
                <p className="text-xs text-muted-foreground mt-1">{config.keyHelp}</p>
              </div>
            )}
          </div>

          {!connected && (
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Testando conexão...</> : 'Testar Conexão'}
            </Button>
          )}
        </div>

        {/* Step 2: Select data */}
        {connected && !completed && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">2</Badge>
              <p className="font-medium">Selecionar dados para migrar</p>
            </div>

            <div className="space-y-2">
              {importOptions.map(opt => (
                <label key={opt.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/30 cursor-pointer transition-colors">
                  <Checkbox
                    checked={selectedOptions.includes(opt.id)}
                    onCheckedChange={() => toggleOption(opt.id)}
                  />
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <Button onClick={handleMigrate} disabled={migrating || selectedOptions.length === 0} className="w-full">
              {migrating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Migrando dados...</>
              ) : (
                <>Iniciar Migração <ArrowRight className="h-4 w-4 ml-2" /></>
              )}
            </Button>
          </div>
        )}

        {/* Progress / Result */}
        {progress && (
          <div className="p-4 bg-accent/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              {completed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Loader2 className="h-5 w-5 animate-spin" />}
              <p className="font-medium">{progress.step}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-background rounded">
                <p className="text-lg font-bold">{progress.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="p-2 bg-background rounded">
                <p className="text-lg font-bold text-green-500">{progress.processed}</p>
                <p className="text-xs text-muted-foreground">Importados</p>
              </div>
              <div className="p-2 bg-background rounded">
                <p className="text-lg font-bold text-destructive">{progress.errors}</p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
