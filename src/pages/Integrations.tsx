import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Settings, Trash2, TestTube, AlertCircle, RefreshCw, MessageSquare, Instagram, FileSpreadsheet, Plug } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIntegrations, Integration } from '@/hooks/useIntegrations';
import { IntegrationMarketplace } from '@/components/integrations/IntegrationMarketplace';
import { WhatsAppProviderSetup } from '@/components/integrations/WhatsAppProviderSetup';
import { GoogleFormsGuide } from '@/components/integrations/GoogleFormsGuide';
import { GoogleSheetsIntegration } from '@/components/integrations/GoogleSheetsIntegration';
import { AGSellAPISetup } from '@/components/integrations/AGSellAPISetup';
import { useNavigate } from 'react-router-dom';
import { PageHeader, HelpTooltip } from '@/components/ui/help-tooltip';

const categoryLabels: Record<string, string> = {
  infoproduct: 'Infoprodutos',
  analytics: 'Analytics',
  crm: 'Automação',
};

export default function Integrations() {
  const navigate = useNavigate();
  const { 
    integrations, 
    connectIntegration, 
    disconnectIntegration, 
    testIntegration,
    getConnectedIntegrations 
  } = useIntegrations();
  
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!selectedIntegration) return;
    
    setIsConnecting(true);
    const success = await connectIntegration(selectedIntegration.id, configValues);
    setIsConnecting(false);

    if (success) {
      setIsDialogOpen(false);
      setConfigValues({});
      setSelectedIntegration(null);
    }
  };

  const handleTest = async (integration: Integration) => {
    setIsTesting(integration.id);
    await testIntegration(integration.id);
    setIsTesting(null);
  };

  const openConfigDialog = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConfigValues(integration.config || {});
    setIsDialogOpen(true);
  };

  const connectedCount = getConnectedIntegrations().length;

  // Group by category
  const groupedIntegrations = integrations.reduce((acc, int) => {
    if (!acc[int.category]) acc[int.category] = [];
    acc[int.category].push(int);
    return acc;
  }, {} as Record<string, Integration[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Integrações"
        description="Conecte suas ferramentas favoritas"
        helpText="Integrações permitem conectar o AG Sell a plataformas externas como WhatsApp, Instagram, Hotmart e mais. Configure as credenciais de cada serviço para ativar."
      >
        <Badge variant="secondary" className="text-sm">
          {connectedCount} conectadas
        </Badge>
      </PageHeader>

      {/* WhatsApp & Instagram Section */}
      <Tabs defaultValue="whatsapp" className="w-full">
        <TabsList className="w-auto">
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="instagram" className="flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            Instagram
          </TabsTrigger>
          <TabsTrigger value="google" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Google
          </TabsTrigger>
          <TabsTrigger value="agsell" className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            AG Sell API
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            🛒 Marketplace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="mt-6">
          <WhatsAppProviderSetup />
        </TabsContent>

        <TabsContent value="instagram" className="mt-6">
          <Card className="border-dashed">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
                  <Instagram className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Conta do Instagram</CardTitle>
                  <CardDescription>Conecte sua conta para automações de DM, comentários e stories</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Gerencie a conexão da sua conta do Instagram, configure automações de respostas e acompanhe logs de execução na página dedicada.
              </p>
              <Button onClick={() => navigate('/instagram')} className="gap-2">
                <Instagram className="h-4 w-4" />
                Ir para Instagram
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="google" className="mt-6 space-y-6">
          <Tabs defaultValue="forms">
            <TabsList>
              <TabsTrigger value="forms">Google Forms</TabsTrigger>
              <TabsTrigger value="sheets">Google Sheets</TabsTrigger>
            </TabsList>
            <TabsContent value="forms" className="mt-4">
              <GoogleFormsGuide />
            </TabsContent>
            <TabsContent value="sheets" className="mt-4">
              <GoogleSheetsIntegration />
            </TabsContent>
          </Tabs>
        </TabsContent>
        <TabsContent value="agsell" className="mt-6">
          <AGSellAPISetup />
        </TabsContent>
        <TabsContent value="marketplace" className="mt-6">
          <IntegrationMarketplace />
        </TabsContent>
      </Tabs>

      {/* Other Integrations by Category */}
      <div className="pt-6 border-t">
        <h2 className="text-xl font-semibold mb-4">Outras Integrações</h2>
        {Object.entries(groupedIntegrations).map(([category, ints]) => (
          <div key={category} className="space-y-4 mb-6">
            <h3 className="text-lg font-medium">{categoryLabels[category] || category}</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ints.map((integration) => (
                <Card key={integration.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-3xl">{integration.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium">{integration.name}</p>
                        <p className="text-sm text-muted-foreground">{integration.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={integration.status === 'connected' ? 'default' : integration.status === 'error' ? 'destructive' : 'secondary'}
                      >
                        {integration.status === 'connected' ? (
                          <><Check className="h-3 w-3 mr-1" /> Conectado</>
                        ) : integration.status === 'error' ? (
                          <><AlertCircle className="h-3 w-3 mr-1" /> Erro</>
                        ) : (
                          'Desconectado'
                        )}
                      </Badge>
                      {integration.status === 'connected' ? (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleTest(integration)}
                            disabled={isTesting === integration.id}
                          >
                            {isTesting === integration.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <TestTube className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openConfigDialog(integration)}>
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={() => disconnectIntegration(integration.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => openConfigDialog(integration)}>
                          Conectar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Config Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedIntegration?.icon}</span>
              {selectedIntegration?.status === 'connected' ? 'Configurar' : 'Conectar'} {selectedIntegration?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedIntegration?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedIntegration?.configFields?.length === 0 && (
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                ℹ️ Esta integração não requer configuração adicional.
              </p>
            )}
            {selectedIntegration?.configFields?.map((field) => (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <HelpTooltip content={`Cole aqui o ${field.label} obtido no painel da ${selectedIntegration.name}. Geralmente encontrado em Configurações > API.`} />
                </div>
                <Input
                  id={field.key}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={configValues[field.key] || ''}
                  onChange={(e) => setConfigValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                selectedIntegration?.status === 'connected' ? 'Salvar' : 'Conectar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
