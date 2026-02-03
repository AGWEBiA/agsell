import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Settings, Trash2, TestTube, AlertCircle, RefreshCw, MessageSquare, Mail, CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIntegrations, Integration } from '@/hooks/useIntegrations';
import { WhatsAppProviderSetup } from '@/components/integrations/WhatsAppProviderSetup';

const categoryLabels: Record<string, string> = {
  email: 'Email',
  payment: 'Pagamentos',
  infoproduct: 'Infoprodutos',
  analytics: 'Analytics',
  crm: 'CRM',
  messaging: 'Mensageria',
};

export default function Integrations() {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrações</h1>
          <p className="text-muted-foreground">Conecte suas ferramentas favoritas</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {connectedCount} conectadas
        </Badge>
      </div>

      {/* Tabs for different integration types */}
      <Tabs defaultValue="whatsapp" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            E-mail
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pagamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="mt-6">
          <WhatsAppProviderSetup />
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de E-mail</CardTitle>
              <CardDescription>Configure o provedor de e-mail para disparos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Configuração de e-mail via Resend</p>
                <p className="text-sm mt-2">Acesse Configurações do Sistema para gerenciar</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Integrações de Pagamento</CardTitle>
              <CardDescription>Configure webhooks de plataformas de pagamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {['Stripe', 'Hotmart', 'Kiwify', 'Eduzz'].map((platform) => (
                  <Card key={platform} className="text-center">
                    <CardContent className="pt-6">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="font-medium">{platform}</p>
                      <Badge variant="outline" className="mt-2">Webhook Ativo</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Other Integrations */}
      <div className="pt-6 border-t">
        <h2 className="text-xl font-semibold mb-4">Outras Integrações</h2>
        {Object.entries(groupedIntegrations).map(([category, ints]) => (
          <div key={category} className="space-y-4 mb-6">
            <h3 className="text-lg font-medium">{categoryLabels[category]}</h3>
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
            {selectedIntegration?.configFields?.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
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
