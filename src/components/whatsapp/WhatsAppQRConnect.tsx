import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MessageSquare,
  Link2,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppConnection {
  id: string;
  name: string;
  phone: string;
  status: 'connected' | 'disconnected' | 'connecting';
  type: 'qr' | 'api';
  lastSync?: string;
}

interface WhatsAppQRConnectProps {
  onConnect?: (connection: WhatsAppConnection) => void;
}

export function WhatsAppQRConnect({ onConnect }: WhatsAppQRConnectProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [connectionType, setConnectionType] = useState<'qr' | 'api'>('qr');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'waiting' | 'connected' | 'error'>('idle');
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const connectionStatusRef = useRef(connectionStatus);

  // Keep ref in sync with state
  useEffect(() => {
    connectionStatusRef.current = connectionStatus;
  }, [connectionStatus]);

  // API connection fields
  const [apiConfig, setApiConfig] = useState({
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    webhookVerifyToken: '',
  });

  // Simulate QR code generation
  const generateQRCode = async () => {
    setIsGeneratingQR(true);
    setConnectionStatus('waiting');

    // Simulate API call to generate QR
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate a placeholder QR code (in production, this would come from the WhatsApp Web API)
    const qrData = `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="white"/>
        <rect x="20" y="20" width="40" height="40" fill="black"/>
        <rect x="140" y="20" width="40" height="40" fill="black"/>
        <rect x="20" y="140" width="40" height="40" fill="black"/>
        <rect x="70" y="20" width="10" height="10" fill="black"/>
        <rect x="90" y="20" width="10" height="10" fill="black"/>
        <rect x="110" y="20" width="10" height="10" fill="black"/>
        <rect x="70" y="40" width="10" height="10" fill="black"/>
        <rect x="90" y="40" width="10" height="10" fill="black"/>
        <rect x="110" y="40" width="10" height="10" fill="black"/>
        <rect x="70" y="60" width="10" height="10" fill="black"/>
        <rect x="90" y="60" width="10" height="10" fill="black"/>
        <rect x="110" y="60" width="10" height="10" fill="black"/>
        <rect x="80" y="80" width="40" height="40" fill="black"/>
        <text x="100" y="180" text-anchor="middle" font-size="12" fill="black">AG Sell WhatsApp</text>
      </svg>
    `)}`;

    setQrCode(qrData);
    setIsGeneratingQR(false);

    // Simulate waiting for scan (in production, this would be a websocket connection)
    setTimeout(() => {
      if (connectionStatusRef.current === 'waiting') {
        // Simulate successful connection
        const newConnection: WhatsAppConnection = {
          id: crypto.randomUUID(),
          name: 'Meu WhatsApp',
          phone: '+55 11 99999-9999',
          status: 'connected',
          type: 'qr',
          lastSync: new Date().toISOString(),
        };
        setConnections((prev) => [...prev, newConnection]);
        setConnectionStatus('connected');
        onConnect?.(newConnection);
        toast.success('WhatsApp conectado com sucesso!');
      }
    }, 8000);
  };

  const handleAPIConnect = () => {
    if (!apiConfig.accessToken || !apiConfig.phoneNumberId) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const newConnection: WhatsAppConnection = {
      id: crypto.randomUUID(),
      name: 'WhatsApp Business API',
      phone: apiConfig.phoneNumberId,
      status: 'connected',
      type: 'api',
      lastSync: new Date().toISOString(),
    };

    setConnections((prev) => [...prev, newConnection]);
    onConnect?.(newConnection);
    toast.success('WhatsApp Business API conectado!');
    setIsDialogOpen(false);
    setApiConfig({ accessToken: '', phoneNumberId: '', businessAccountId: '', webhookVerifyToken: '' });
  };

  const refreshQRCode = () => {
    setQrCode(null);
    setConnectionStatus('idle');
    generateQRCode();
  };

  const disconnectWhatsApp = (connectionId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    toast.success('WhatsApp desconectado');
  };

  return (
    <>
      {/* Connections List */}
      <div className="space-y-4">
        {connections.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connections.map((connection) => (
              <Card key={connection.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                      connection.status === 'connected'
                        ? 'bg-green-100 dark:bg-green-900'
                        : 'bg-red-100 dark:bg-red-900'
                    }`}>
                      <Smartphone className={`h-6 w-6 ${
                        connection.status === 'connected' ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{connection.name}</p>
                      <p className="text-sm text-muted-foreground">{connection.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={connection.status === 'connected' ? 'default' : 'destructive'}>
                        {connection.status === 'connected' ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Conectado</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Desconectado</>
                        )}
                      </Badge>
                      <Badge variant="outline">
                        {connection.type === 'qr' ? 'QR Code' : 'API'}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectWhatsApp(connection.id)}
                    >
                      Desconectar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Connection Options */}
        <Card>
          <CardHeader>
            <CardTitle>Conectar WhatsApp</CardTitle>
            <CardDescription>
              Escolha como você deseja conectar seu WhatsApp ao AG Sell
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* QR Code Option */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                setConnectionType('qr');
                setIsDialogOpen(true);
              }}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                      <QrCode className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">QR Code (WhatsApp Web)</p>
                      <p className="text-sm text-muted-foreground">
                        Conecte escaneando um QR Code
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Sem necessidade de conta Business
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Configuração rápida e simples
                    </p>
                    <p className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Requer telefone conectado à internet
                    </p>
                  </div>
                  <Button className="w-full mt-4">
                    <QrCode className="h-4 w-4 mr-2" />
                    Conectar via QR Code
                  </Button>
                </CardContent>
              </Card>

              {/* API Option */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                setConnectionType('api');
                setIsDialogOpen(true);
              }}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                      <Link2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">WhatsApp Business API</p>
                      <p className="text-sm text-muted-foreground">
                        Conecte via API oficial da Meta
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Templates de mensagem aprovados
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Maior limite de mensagens
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Webhook para automações
                    </p>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    <Link2 className="h-4 w-4 mr-2" />
                    Conectar via API
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {connectionType === 'qr' ? 'Conectar via QR Code' : 'Conectar via API'}
            </DialogTitle>
            <DialogDescription>
              {connectionType === 'qr'
                ? 'Escaneie o QR Code com seu WhatsApp para conectar'
                : 'Configure as credenciais da API do WhatsApp Business'}
            </DialogDescription>
          </DialogHeader>

          {connectionType === 'qr' ? (
            <div className="py-6">
              {connectionStatus === 'connected' ? (
                <div className="text-center">
                  <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-green-100 dark:bg-green-900 mb-4">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Conectado com Sucesso!</h3>
                  <p className="text-muted-foreground">
                    Seu WhatsApp foi conectado ao AG Sell
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  {qrCode ? (
                    <>
                      <div className="relative inline-block">
                        <img
                          src={qrCode}
                          alt="QR Code"
                          className="w-48 h-48 mx-auto border rounded-lg"
                        />
                        {connectionStatus === 'waiting' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-4">
                        1. Abra o WhatsApp no seu celular<br />
                        2. Vá em Configurações &gt; Dispositivos Conectados<br />
                        3. Toque em "Conectar um Dispositivo"<br />
                        4. Escaneie este QR Code
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={refreshQRCode}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar QR Code
                      </Button>
                    </>
                  ) : (
                    <Button onClick={generateQRCode} disabled={isGeneratingQR}>
                      {isGeneratingQR ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Gerando QR Code...
                        </>
                      ) : (
                        <>
                          <QrCode className="h-4 w-4 mr-2" />
                          Gerar QR Code
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token *</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="EAAxxxxxxx..."
                  value={apiConfig.accessToken}
                  onChange={(e) => setApiConfig({ ...apiConfig, accessToken: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumberId">Phone Number ID *</Label>
                <Input
                  id="phoneNumberId"
                  placeholder="123456789012345"
                  value={apiConfig.phoneNumberId}
                  onChange={(e) => setApiConfig({ ...apiConfig, phoneNumberId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessAccountId">Business Account ID</Label>
                <Input
                  id="businessAccountId"
                  placeholder="123456789012345"
                  value={apiConfig.businessAccountId}
                  onChange={(e) => setApiConfig({ ...apiConfig, businessAccountId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookVerifyToken">Webhook Verify Token</Label>
                <Input
                  id="webhookVerifyToken"
                  placeholder="my-verify-token"
                  value={apiConfig.webhookVerifyToken}
                  onChange={(e) => setApiConfig({ ...apiConfig, webhookVerifyToken: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {connectionStatus === 'connected' ? 'Fechar' : 'Cancelar'}
            </Button>
            {connectionType === 'api' && (
              <Button onClick={handleAPIConnect}>
                Conectar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
