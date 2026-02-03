import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  ExternalLink,
  Lock,
  Plus,
  RefreshCw,
  Settings,
  Star,
  Trash2,
  Zap,
  MessageSquare,
  Shield,
  Server,
  Smartphone,
} from 'lucide-react';
import { useWhatsAppInstances, WhatsAppInstance } from '@/hooks/useWhatsAppInstances';
import { usePlans } from '@/hooks/usePlans';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface EvolutionAPIConfig {
  api_url: string;
  api_key: string;
  instance_name: string;
  phone_number: string;
}

interface WhatsAppBusinessConfig {
  access_token: string;
  phone_number_id: string;
  business_account_id: string;
  webhook_verify_token: string;
  phone_number: string;
}

export function WhatsAppProviderSetup() {
  const { 
    instances, 
    activeInstances,
    defaultInstance,
    createInstance, 
    deleteInstance, 
    toggleInstance, 
    setDefaultInstance,
    isLoading 
  } = useWhatsAppInstances();
  const { currentPlan, isLoading: plansLoading } = usePlans();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('evolution');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [instanceName, setInstanceName] = useState('');

  // Check if plan includes WhatsApp feature
  const hasWhatsAppFeature = currentPlan?.features?.includes('whatsapp') || 
                             currentPlan?.slug === 'professional' || 
                             currentPlan?.slug === 'enterprise' ||
                             (currentPlan?.max_whatsapp_messages ?? 0) > 0;

  // Evolution API Config
  const [evolutionConfig, setEvolutionConfig] = useState<EvolutionAPIConfig>({
    api_url: '',
    api_key: '',
    instance_name: '',
    phone_number: '',
  });

  // WhatsApp Business Config
  const [businessConfig, setBusinessConfig] = useState<WhatsAppBusinessConfig>({
    access_token: '',
    phone_number_id: '',
    business_account_id: '',
    webhook_verify_token: '',
    phone_number: '',
  });

  // Get existing integrations by type
  const evolutionInstances = instances.filter(i => i.integration_type === 'evolution_api');
  const businessInstances = instances.filter(i => i.integration_type === 'whatsapp_business');

  // If plan doesn't include WhatsApp, show upgrade prompt
  if (!plansLoading && !hasWhatsAppFeature) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Recurso Exclusivo</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            A integração com WhatsApp está disponível apenas nos planos pagos. 
            Faça upgrade para enviar mensagens e campanhas pelo WhatsApp.
          </p>
          <Button onClick={() => navigate('/plans')}>
            Ver Planos
          </Button>
        </CardContent>
      </Card>
    );
  }

  const resetForm = () => {
    setEvolutionConfig({ api_url: '', api_key: '', instance_name: '', phone_number: '' });
    setBusinessConfig({ access_token: '', phone_number_id: '', business_account_id: '', webhook_verify_token: '', phone_number: '' });
    setInstanceName('');
    setIsDefault(false);
  };

  const handleSaveEvolution = async () => {
    if (!evolutionConfig.api_url || !evolutionConfig.api_key || !evolutionConfig.instance_name) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!instanceName) {
      toast.error('Digite um nome para identificar esta instância');
      return;
    }

    setIsSaving(true);
    try {
      await createInstance.mutateAsync({
        name: instanceName,
        integration_type: 'evolution_api',
        config: { ...evolutionConfig } as Record<string, string>,
        phone_number: evolutionConfig.phone_number || evolutionConfig.instance_name,
        is_default: isDefault || instances.length === 0,
      });
      setIsDialogOpen(false);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!businessConfig.access_token || !businessConfig.phone_number_id) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    if (!instanceName) {
      toast.error('Digite um nome para identificar esta instância');
      return;
    }

    setIsSaving(true);
    try {
      await createInstance.mutateAsync({
        name: instanceName,
        integration_type: 'whatsapp_business',
        config: { ...businessConfig } as Record<string, string>,
        phone_number: businessConfig.phone_number || businessConfig.phone_number_id,
        is_default: isDefault || instances.length === 0,
      });
      setIsDialogOpen(false);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEvolution = async (instance: WhatsAppInstance) => {
    const config = instance.config;
    if (!config.api_url || !config.api_key) {
      toast.error('Configuração incompleta');
      return;
    }

    setIsTesting(instance.id);
    try {
      const response = await fetch(`${config.api_url}/instance/connectionState/${config.instance_name}`, {
        headers: {
          'apikey': config.api_key,
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
      setIsTesting(null);
    }
  };

  const handleTestBusiness = async (instance: WhatsAppInstance) => {
    const config = instance.config;
    if (!config.access_token || !config.phone_number_id) {
      toast.error('Configuração incompleta');
      return;
    }

    setIsTesting(instance.id);
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${config.phone_number_id}`,
        {
          headers: {
            'Authorization': `Bearer ${config.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(`Conectado! Número: ${data.display_phone_number || config.phone_number_id}`);
      } else {
        const error = await response.json();
        toast.error(`Erro: ${error.error?.message || 'Token inválido'}`);
      }
    } catch (error) {
      toast.error('Não foi possível conectar. Verifique as credenciais.');
    } finally {
      setIsTesting(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover esta instância?')) {
      await deleteInstance.mutateAsync(id);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleInstance.mutateAsync({ id, isActive });
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultInstance.mutateAsync(id);
  };

  const renderInstanceCard = (instance: WhatsAppInstance) => {
    const isEvolution = instance.integration_type === 'evolution_api';
    
    return (
      <Card 
        key={instance.id} 
        className={`${instance.is_active ? 'border-green-200 dark:border-green-800' : ''} ${instance.is_default ? 'ring-2 ring-yellow-400' : ''}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isEvolution ? 'bg-purple-100 dark:bg-purple-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
                {isEvolution ? (
                  <Server className="h-5 w-5 text-purple-600" />
                ) : (
                  <Smartphone className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {instance.name}
                  {instance.is_default && (
                    <Badge variant="outline" className="text-xs">
                      <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                      Padrão
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isEvolution ? 'Evolution API' : 'WhatsApp Business API'}
                  {instance.phone_number && ` • ${instance.phone_number}`}
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={instance.is_active}
              onCheckedChange={(checked) => handleToggle(instance.id, checked)}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <Badge variant={instance.is_active ? 'default' : 'secondary'}>
              {instance.is_active ? (
                <><CheckCircle2 className="h-3 w-3 mr-1" /> Ativo</>
              ) : (
                'Inativo'
              )}
            </Badge>
            <div className="flex gap-1">
              {!instance.is_default && instance.is_active && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSetDefault(instance.id)}
                  title="Definir como padrão"
                >
                  <Star className="h-4 w-4" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => isEvolution ? handleTestEvolution(instance) : handleTestBusiness(instance)}
                disabled={isTesting === instance.id}
              >
                {isTesting === instance.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(instance.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
            Configure múltiplos números e escolha qual usar para envios
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Número
        </Button>
      </div>

      {/* Instances List */}
      {instances.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhum número configurado</h3>
            <p className="text-muted-foreground mb-4">
              Adicione seu primeiro número WhatsApp para começar a enviar mensagens
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Número
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {instances.map(renderInstanceCard)}
        </div>
      )}

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
            <DialogTitle>Adicionar Número WhatsApp</DialogTitle>
            <DialogDescription>
              Escolha o provedor e configure as credenciais
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="instance-name">Nome da Instância *</Label>
              <Input
                id="instance-name"
                placeholder="Ex: WhatsApp Principal, Suporte, Marketing..."
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Um nome para identificar este número</p>
            </div>
          </div>

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
              </div>
              <div className="space-y-2">
                <Label htmlFor="evo-key">API Key *</Label>
                <Input
                  id="evo-key"
                  type="password"
                  placeholder="Sua chave de API"
                  value={evolutionConfig.api_key}
                  onChange={(e) => setEvolutionConfig({ ...evolutionConfig, api_key: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evo-instance">Nome da Instância *</Label>
                <Input
                  id="evo-instance"
                  placeholder="minha-instancia"
                  value={evolutionConfig.instance_name}
                  onChange={(e) => setEvolutionConfig({ ...evolutionConfig, instance_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evo-phone">Número do WhatsApp</Label>
                <Input
                  id="evo-phone"
                  placeholder="+55 11 99999-9999"
                  value={evolutionConfig.phone_number}
                  onChange={(e) => setEvolutionConfig({ ...evolutionConfig, phone_number: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Opcional - para identificação</p>
              </div>
            </TabsContent>

            <TabsContent value="business" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="biz-token">Access Token *</Label>
                <Input
                  id="biz-token"
                  type="password"
                  placeholder="Token de acesso da Meta"
                  value={businessConfig.access_token}
                  onChange={(e) => setBusinessConfig({ ...businessConfig, access_token: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="biz-phone-id">Phone Number ID *</Label>
                <Input
                  id="biz-phone-id"
                  placeholder="ID do número no Meta"
                  value={businessConfig.phone_number_id}
                  onChange={(e) => setBusinessConfig({ ...businessConfig, phone_number_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="biz-account">Business Account ID</Label>
                <Input
                  id="biz-account"
                  placeholder="ID da conta Business"
                  value={businessConfig.business_account_id}
                  onChange={(e) => setBusinessConfig({ ...businessConfig, business_account_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="biz-phone">Número do WhatsApp</Label>
                <Input
                  id="biz-phone"
                  placeholder="+55 11 99999-9999"
                  value={businessConfig.phone_number}
                  onChange={(e) => setBusinessConfig({ ...businessConfig, phone_number: e.target.value })}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="is-default"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked === true)}
            />
            <Label htmlFor="is-default" className="text-sm font-normal">
              Definir como número padrão para envios
            </Label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button
              onClick={activeTab === 'evolution' ? handleSaveEvolution : handleSaveBusiness}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Adicionar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
