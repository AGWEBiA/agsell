import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Copy, ExternalLink, Key, Globe, BarChart3, Users, Mail, TrendingUp, RefreshCw, TestTube, AlertCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface ConnectionStatus {
  status: 'idle' | 'testing' | 'connected' | 'error';
  message?: string;
}

export function AGSellAPISetup() {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ status: 'idle' });

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const defaultBaseUrl = `https://${projectId}.supabase.co/functions/v1/public-api`;

  const handleTest = async () => {
    if (!apiKey.trim()) {
      toast.error('Informe a API Key');
      return;
    }

    const url = baseUrl.trim() || defaultBaseUrl;
    setConnectionStatus({ status: 'testing' });

    try {
      const res = await fetch(`${url}/metrics/overview`, {
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        setConnectionStatus({ status: 'connected', message: 'Conexão validada com sucesso!' });
        toast.success('Conexão com AG Sell validada!');
      } else {
        const body = await res.json().catch(() => ({}));
        setConnectionStatus({ status: 'error', message: body.error || `Erro HTTP ${res.status}` });
        toast.error(body.error || 'Falha na conexão');
      }
    } catch {
      setConnectionStatus({ status: 'error', message: 'Não foi possível conectar ao servidor' });
      toast.error('Erro de rede ao testar conexão');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const endpoints = [
    { method: 'GET', path: '/metrics/overview', desc: 'Resumo geral de todas as métricas', icon: BarChart3 },
    { method: 'GET', path: '/metrics/email', desc: 'Aberturas, cliques, taxa de entrega', icon: Mail },
    { method: 'GET', path: '/metrics/leads', desc: 'Leads por período, funil, tag e source', icon: Users },
    { method: 'GET', path: '/metrics/pipeline', desc: 'Deals por etapa, taxa de conversão, valor total', icon: TrendingUp },
    { method: 'GET', path: '/metrics/automations', desc: 'Execuções, taxa de sucesso, últimas ações', icon: RefreshCw },
  ];

  const queryParams = [
    { param: 'period', desc: 'Período: today, 7d, 30d, 90d (padrão: 30d)', example: '?period=7d' },
    { param: 'tag', desc: 'Filtrar por tag (nome ou ID)', example: '?tag=cliente-premium' },
    { param: 'source', desc: 'Filtrar por fonte do lead', example: '?source=whatsapp' },
    { param: 'stage', desc: 'Filtrar por etapa do funil', example: '?stage=negociacao' },
    { param: 'status', desc: 'Filtrar por status do lead', example: '?status=qualified' },
  ];

  return (
    <div className="space-y-6">
      {/* Connection Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700">
              <Key className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Conectar ao AG Sell</CardTitle>
              <CardDescription>
                Cole a API Key gerada em <strong>Configurações → API Keys</strong> do AG Sell
              </CardDescription>
            </div>
            {connectionStatus.status === 'connected' && (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                <Check className="h-3 w-3 mr-1" /> Conectado
              </Badge>
            )}
            {connectionStatus.status === 'error' && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" /> Erro
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key <span className="text-destructive">*</span></Label>
            <Input
              id="api-key"
              type="password"
              placeholder="ag_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Gere uma chave em Configurações → API Keys com permissão de <strong>read</strong>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="base-url">Base URL (opcional)</Label>
            <Input
              id="base-url"
              type="text"
              placeholder={defaultBaseUrl}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para usar a URL padrão da sua instância
            </p>
          </div>

          {connectionStatus.status === 'error' && connectionStatus.message && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {connectionStatus.message}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleTest} disabled={connectionStatus.status === 'testing'} className="gap-2">
              {connectionStatus.status === 'testing' ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> Testando...</>
              ) : (
                <><TestTube className="h-4 w-4" /> Testar Conexão</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Endpoints + Params + Code Examples */}
      <Tabs defaultValue="endpoints">
        <TabsList>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="params">Parâmetros</TabsTrigger>
          <TabsTrigger value="code">Código de Exemplo</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Endpoints Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {endpoints.map((ep) => (
                <div
                  key={ep.path}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <ep.icon className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-mono">{ep.method}</Badge>
                      <code className="text-sm font-mono text-primary truncate">{ep.path}</code>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{ep.desc}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(ep.path, 'Endpoint')}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="params" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-3">
              {queryParams.map((qp) => (
                <div key={qp.param} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-semibold text-primary">{qp.param}</code>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{qp.desc}</p>
                  </div>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono shrink-0">{qp.example}</code>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Exemplo de Integração (JavaScript/TypeScript)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted/50 p-4 rounded-lg text-xs overflow-x-auto font-mono leading-relaxed">
{`// Configuração
const AG_SELL_API_KEY = "ag_sua_chave_aqui";
const AG_SELL_BASE_URL = "${baseUrl || defaultBaseUrl}";

// Função auxiliar
async function agSellAPI(endpoint, params = {}) {
  const url = new URL(AG_SELL_BASE_URL + endpoint);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url, {
    headers: {
      "x-api-key": AG_SELL_API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error(\`AG Sell API error: \${res.status}\`);
  return res.json();
}

// Buscar métricas de e-mail dos últimos 7 dias
const emailMetrics = await agSellAPI("/metrics/email", { period: "7d" });
console.log("Aberturas:", emailMetrics.data.opens);
console.log("Cliques:", emailMetrics.data.clicks);

// Buscar leads por tag
const leads = await agSellAPI("/metrics/leads", { 
  period: "30d", 
  tag: "cliente-premium" 
});

// Métricas do pipeline
const pipeline = await agSellAPI("/metrics/pipeline");
console.log("Deals por etapa:", pipeline.data.stages);

// Overview geral
const overview = await agSellAPI("/metrics/overview");`}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(`const AG_SELL_API_KEY = "ag_sua_chave_aqui";\nconst AG_SELL_BASE_URL = "${baseUrl || defaultBaseUrl}";`, 'Código')}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Autenticação via API Key</p>
                  <p className="text-xs text-muted-foreground">
                    Toda requisição requer o header <code className="bg-muted px-1 rounded">x-api-key</code>. 
                    As chaves são armazenadas com hash SHA-256 e nunca expostas em texto plano.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Rate Limiting</p>
                  <p className="text-xs text-muted-foreground">
                    Limite configurável por minuto e por dia. Excedeu? Aguarde o tempo indicado no header <code className="bg-muted px-1 rounded">retry_after</code>.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Isolamento Multi-Tenant</p>
                  <p className="text-xs text-muted-foreground">
                    Cada API Key é vinculada a uma organização. Dados de outras organizações são inacessíveis.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Somente Leitura</p>
                  <p className="text-xs text-muted-foreground">
                    Os endpoints de métricas são <strong>GET only</strong>. Uma API Key com permissão <code className="bg-muted px-1 rounded">read</code> é suficiente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
