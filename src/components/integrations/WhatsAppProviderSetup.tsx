import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Settings,
  Trash2,
  Zap,
  MessageSquare,
  Shield,
  Server,
  Smartphone,
} from 'lucide-react';
import { useOrganizationIntegrations } from '@/hooks/useOrganizationIntegrations';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

interface EvolutionAPIConfig {
  api_url: string;
  api_key: string;
  instance_name: string;
}

interface WhatsAppBusinessConfig {
  access_token: string;
  phone_number_id: string;
  business_account_id: string;
  webhook_verify_token: string;
}

export function WhatsAppProviderSetup() {
  const { integrations, upsertIntegration, deleteIntegration, toggleIntegration, isLoading } = useOrganizationIntegrations();
  
  const [activeTab, setActiveTab] = useState('evolution');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Evolution API Config
  const [evolutionConfig, setEvolutionConfig] = useState<EvolutionAPIConfig>({
    api_url: '',
    api_key: '',
    instance_name: '',
  });

  // WhatsApp Business Config
  const [businessConfig, setBusinessConfig] = useState<WhatsAppBusinessConfig>({
    access_token: '',
    phone_number_id: '',
    business_account_id: '',
    webhook_verify_token: '',
  });

  // Get existing integrations
  const evolutionIntegration = integrations.find(i => i.integration_type === 'evolution_api');
  const businessIntegration = integrations.find(i => i.integration_type === 'whatsapp_business');

  // Load existing config
  useEffect(() => {
    if (evolutionIntegration?.config) {
      const config = evolutionIntegration.config as Record<string, string>;
      setEvolutionConfig({
        api_url: config.api_url || '',
        api_key: config.api_key || '',
        instance_name: config.instance_name || '',
      });
    }
    if (businessIntegration?.config) {
      const config = businessIntegration.config as Record<string, string>;
      setBusinessConfig({
        access_token: config.access_token || '',
        phone_number_id: config.phone_number_id || '',
        business_account_id: config.business_account_id || '',
        webhook_verify_token: config.webhook_verify_token || '',
      });
    }
  }, [evolutionIntegration, businessIntegration]);

  const handleSaveEvolution = async () => {
    if (!evolutionConfig.api_url || !evolutionConfig.api_key || !evolutionConfig.instance_name) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      await upsertIntegration.mutateAsync({
        name: 'Evolution API',
        integration_type: 'evolution_api',
        config: evolutionConfig as unknown as Json,
        is_active: true,
      });
      setIsDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!businessConfig.access_token || !businessConfig.phone_number_id) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      await upsertIntegration.mutateAsync({
        name: 'WhatsApp Business API',
        integration_type: 'whatsapp_business',
        config: businessConfig as unknown as Json,
        is_active: true,
      });
      setIsDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEvolution = async () => {
    if (!evolutionConfig.api_url || !evolutionConfig.api_key) {
      toast.error('Configure a API primeiro');
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch(`${evolutionConfig.api_url}/instance/connectionState/${evolutionConfig.instance_name}`, {
        headers: {
          'apikey': evolutionConfig.api_key,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.instance?.state === 'open') {
          toast.success('Conexão ativa! WhatsApp conectado.');
        } else {
          toast.warning(`Status: ${data.instance?.state || 'desconectado'}. Escaneie o QR Code.`);
        }
      } else {
        toast.error('Erro ao conectar com Evolution API');
      }
    } catch (error) {
      toast.error('Não foi possível conectar. Verifique a URL e a chave.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestBusiness = async () => {
    if (!businessConfig.access_token || !businessConfig.phone_number_id) {
      toast.error('Configure a API primeiro');
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${businessConfig.phone_number_id}`,
        {
          headers: {
            'Authorization': `Bearer ${businessConfig.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(`Conectado! Número: ${data.display_phone_number || businessConfig.phone_number_id}`);
      } else {
        const error = await response.json();
        toast.error(`Erro: ${error.error?.message || 'Token inválido'}`);
      }
    } catch (error) {
      toast.error('Não foi possível conectar. Verifique as credenciais.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover esta integração?')) {
      await deleteIntegration.mutateAsync(id);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleIntegration.mutateAsync({ id, isActive });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-green-600" />
            Provedores WhatsApp
          </h2>
          <p className="text-muted-foreground">
            Configure os provedores para envio de mensagens
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Configurar Provedor
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Evolution API Card */}
        <Card className={evolutionIntegration?.is_active ? 'border-green-200 dark:border-green-800' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                  <Server className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Evolution API</CardTitle>
                  <CardDescription>Conexão via QR Code</CardDescription>
                </div>
              </div>
              {evolutionIntegration && (
                <Switch
                  checked={evolutionIntegration.is_active || false}
                  onCheckedChange={(checked) => handleToggle(evolutionIntegration.id, checked)}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {evolutionIntegration ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={evolutionIntegration.is_active ? 'default' : 'secondary'}>
                    {evolutionIntegration.is_active ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" /> Ativo</>
                    ) : (
                      'Inativo'
                    )}
                  </Badge>
                  {evolutionIntegration.last_sync_at && (
                    <span className="text-xs text-muted-foreground">
                      Última sync: {new Date(evolutionIntegration.last_sync_at).toLocaleString('pt-BR')}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Instância:</strong> {(evolutionIntegration.config as Record<string, string>)?.instance_name}</p>
                  <p><strong>URL:</strong> {(evolutionIntegration.config as Record<string, string>)?.api_url}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleTestEvolution}
                    disabled={isTesting}
                  >
                    {isTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    <span className="ml-2">Testar</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveTab('evolution');
                      setIsDialogOpen(true);
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleDelete(evolutionIntegration.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">Não configurado</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveTab('evolution');
                    setIsDialogOpen(true);
                  }}
                >
                  Configurar Evolution API
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp Business API Card */}
        <Card className={businessIntegration?.is_active ? 'border-green-200 dark:border-green-800' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">WhatsApp Business API</CardTitle>
                  <CardDescription>API Oficial da Meta</CardDescription>
                </div>
              </div>
              {businessIntegration && (
                <Switch
                  checked={businessIntegration.is_active || false}
                  onCheckedChange={(checked) => handleToggle(businessIntegration.id, checked)}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {businessIntegration ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={businessIntegration.is_active ? 'default' : 'secondary'}>
                    {businessIntegration.is_active ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" /> Ativo</>
                    ) : (
                      'Inativo'
                    )}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Phone ID:</strong> {(businessIntegration.config as Record<string, string>)?.phone_number_id}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleTestBusiness}
                    disabled={isTesting}
                  >
                    {isTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    <span className="ml-2">Testar</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveTab('business');
                      setIsDialogOpen(true);
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleDelete(businessIntegration.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">Não configurado</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveTab('business');
                    setIsDialogOpen(true);
                  }}
                >
                  Configurar Business API
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Qual provedor escolher?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-purple-600">Evolution API</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✅ Conexão via QR Code (sem aprovação)</li>
                <li>✅ Não precisa de conta Business</li>
                <li>✅ Menor custo (self-hosted)</li>
                <li>⚠️ Requer servidor próprio ou cloud</li>
                <li>⚠️ Pode ter instabilidades</li>
              </ul>
              <Button variant="link" className="p-0 h-auto" asChild>
                <a href="https://doc.evolution-api.com" target="_blank" rel="noopener noreferrer">
                  Ver documentação <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">WhatsApp Business API</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✅ API oficial e mais estável</li>
                <li>✅ Maior limite de mensagens</li>
                <li>✅ Templates aprovados pela Meta</li>
                <li>⚠️ Requer aprovação da Meta</li>
                <li>⚠️ Custo por mensagem</li>
              </ul>
              <Button variant="link" className="p-0 h-auto" asChild>
                <a href="https://developers.facebook.com/docs/whatsapp" target="_blank" rel="noopener noreferrer">
                  Ver documentação <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configurar Provedor WhatsApp</DialogTitle>
            <DialogDescription>
              Escolha e configure o provedor de WhatsApp
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="evolution">Evolution API</TabsTrigger>
              <TabsTrigger value="business">Business API</TabsTrigger>
            </TabsList>

            <TabsContent value="evolution" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="evo-url">URL da API *</Label>
                <Input
                  id="evo-url"
                  placeholder="https://api.evolution.com.br"
                  value={evolutionConfig.api_url}
                  onChange={(e) => setEvolutionConfig({ ...evolutionConfig, api_url: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">URL do seu servidor Evolution API</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="evo-key">API Key *</Label>
                <Input
                  id="evo-key"
                  type="password"
                  placeholder="sua-chave-api"
                  value={evolutionConfig.api_key}
                  onChange={(e) => setEvolutionConfig({ ...evolutionConfig, api_key: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evo-instance">Nome da Instância *</Label>
                <Input
                  id="evo-instance"
                  placeholder="agsell-whatsapp"
                  value={evolutionConfig.instance_name}
                  onChange={(e) => setEvolutionConfig({ ...evolutionConfig, instance_name: e.target.value })}
                />
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEvolution} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Salvar
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="business" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="biz-token">Access Token *</Label>
                <Input
                  id="biz-token"
                  type="password"
                  placeholder="EAAxxxxxxx..."
                  value={businessConfig.access_token}
                  onChange={(e) => setBusinessConfig({ ...businessConfig, access_token: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Token de acesso do Meta for Developers</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="biz-phone">Phone Number ID *</Label>
                <Input
                  id="biz-phone"
                  placeholder="123456789012345"
                  value={businessConfig.phone_number_id}
                  onChange={(e) => setBusinessConfig({ ...businessConfig, phone_number_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="biz-account">Business Account ID</Label>
                <Input
                  id="biz-account"
                  placeholder="123456789012345"
                  value={businessConfig.business_account_id}
                  onChange={(e) => setBusinessConfig({ ...businessConfig, business_account_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="biz-webhook">Webhook Verify Token</Label>
                <Input
                  id="biz-webhook"
                  placeholder="my-verify-token"
                  value={businessConfig.webhook_verify_token}
                  onChange={(e) => setBusinessConfig({ ...businessConfig, webhook_verify_token: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Token para verificação de webhooks</p>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveBusiness} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Salvar
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
