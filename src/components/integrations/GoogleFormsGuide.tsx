import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Copy, ExternalLink, FileText, Zap, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function GoogleFormsGuide() {
  const { user } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const appsScript = `// Cole este script no Editor de Apps Script do seu Google Forms
// Vá em Extensões > Apps Script > cole o código > Salve
// Depois vá em Gatilhos (ícone de relógio) > Adicionar gatilho
// Escolha: onFormSubmit | Do formulário | Ao enviar formulário

function onFormSubmit(e) {
  var WEBHOOK_URL = "${webhookUrl || 'COLE_SUA_URL_DE_WEBHOOK_AQUI'}";
  
  var responses = e.response.getItemResponses();
  var data = {};
  
  for (var i = 0; i < responses.length; i++) {
    var title = responses[i].getItem().getTitle();
    var answer = responses[i].getResponse();
    
    // Mapear campos comuns automaticamente
    var key = title.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    // Auto-detectar campos padrão
    if (/nome|name/i.test(title)) key = 'nome';
    if (/e-?mail/i.test(title)) key = 'email';
    if (/telefone|phone|celular|whatsapp/i.test(title)) key = 'telefone';
    
    data[key] = answer;
  }
  
  // Adicionar metadados
  data['_source'] = 'google_forms';
  data['_form_title'] = e.source.getTitle();
  data['_submitted_at'] = new Date().toISOString();
  
  var options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(data),
    muteHttpExceptions: true
  };
  
  try {
    var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    Logger.log('Webhook enviado: ' + response.getContentText());
  } catch (error) {
    Logger.log('Erro ao enviar webhook: ' + error.toString());
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(appsScript);
    setCopied(true);
    toast.success('Script copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-blue-500">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Google Forms → AG Sell</CardTitle>
              <CardDescription>
                Envie automaticamente respostas do Google Forms para o CRM via webhook
              </CardDescription>
            </div>
            <Badge variant="secondary" className="ml-auto">Apps Script</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">1</div>
              <h3 className="font-semibold">Crie um Webhook de Entrada</h3>
            </div>
            <p className="text-sm text-muted-foreground ml-9">
              Vá em <strong>Webhooks</strong> no menu lateral, crie um webhook de entrada e copie a URL gerada.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">2</div>
              <h3 className="font-semibold">Cole a URL do Webhook</h3>
            </div>
            <div className="ml-9">
              <Input
                placeholder="https://gmemxbfibakfpsjbsvyt.supabase.co/functions/v1/webhook-inbound/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">3</div>
              <h3 className="font-semibold">Copie o Script e cole no Google Forms</h3>
            </div>
            <div className="ml-9 space-y-3">
              <div className="relative">
                <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto max-h-64 overflow-y-auto border">
                  <code>{appsScript}</code>
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 gap-1.5"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                No Google Forms: <strong>Extensões</strong> → <strong>Apps Script</strong> → Cole o código → Salve →
                Clique no ícone de <strong>Gatilhos</strong> (⏰) → Adicionar gatilho → Escolha <code>onFormSubmit</code>
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">4</div>
              <h3 className="font-semibold">Configure uma Automação (opcional)</h3>
            </div>
            <p className="text-sm text-muted-foreground ml-9">
              No webhook de entrada, vincule uma automação para processar os leads automaticamente:
              adicionar tags, enviar WhatsApp, criar deal no pipeline, etc.
            </p>
          </div>

          <div className="bg-accent/50 rounded-lg p-4 flex items-start gap-3">
            <Zap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Campos mapeados automaticamente</p>
              <p className="text-muted-foreground mt-1">
                O script detecta campos de <code>Nome</code>, <code>E-mail</code>, <code>Telefone</code> e <code>WhatsApp</code> automaticamente, criando o contato no CRM com a fonte "google_forms".
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
