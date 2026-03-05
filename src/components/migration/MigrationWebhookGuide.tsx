import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Webhook, Copy, CheckCircle2, ExternalLink, ArrowRight, Shield, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';

interface Props {
  platformId: string;
  platformName: string;
}

const platformGuides: Record<string, {
  description: string;
  steps: { title: string; detail: string }[];
  webhookFields: string[];
  tips: string[];
}> = {
  sellflux: {
    description: 'O SellFlux permite enviar dados via Webhook e API Call. Configure um fluxo que envie os leads para a AG Sell automaticamente.',
    steps: [
      {
        title: '1. Acesse seu painel SellFlux',
        detail: 'Vá até a seção de Automações ou Fluxos e selecione o fluxo que contém os leads que deseja migrar.',
      },
      {
        title: '2. Adicione um bloco de Webhook',
        detail: 'No editor de fluxo, insira um bloco "Webhook" ou "API Call" na etapa desejada. Selecione o método POST.',
      },
      {
        title: '3. Cole a URL do Webhook da AG Sell',
        detail: 'Copie a URL abaixo e cole no campo "URL" do bloco de Webhook no SellFlux.',
      },
      {
        title: '4. Configure o Body (JSON)',
        detail: 'No campo de corpo da requisição, mapeie os campos do lead. Use o formato JSON com os campos: nome, email, telefone, tags.',
      },
      {
        title: '5. Configure os Headers',
        detail: 'Adicione o header "Content-Type: application/json". Se o webhook exigir token, adicione também "X-Webhook-Secret" com o token gerado.',
      },
      {
        title: '6. Ative o fluxo',
        detail: 'Salve e ative o fluxo. Todos os leads que passarem por essa etapa serão enviados automaticamente para a AG Sell.',
      },
    ],
    webhookFields: ['nome', 'email', 'telefone', 'whatsapp', 'tags'],
    tips: [
      'Para migrar leads existentes, crie um fluxo temporário que processe todos os contatos de uma lista.',
      'Você pode usar o bloco "API Call" com método POST para maior controle sobre headers e autenticação.',
      'Os campos enviados serão mapeados automaticamente no Webhook de Entrada da AG Sell.',
    ],
  },
  mailchimp: {
    description: 'O Mailchimp permite exportar dados via API e também configurar Webhooks para enviar eventos automaticamente.',
    steps: [
      {
        title: '1. Exporte contatos via Audience',
        detail: 'No Mailchimp, vá em Audience → All Contacts → Export Audience. Baixe o CSV e use a aba "Importar CSV" nesta página.',
      },
      {
        title: '2. Exporte templates de e-mail',
        detail: 'Vá em Campaigns → Email Templates. Para cada template, clique em "Edit" e copie o HTML. Use a aba "Importar JSON" para importar.',
      },
      {
        title: '3. Configure Webhook (opcional)',
        detail: 'Em Audience → Settings → Webhooks, adicione a URL abaixo para sincronizar novos inscritos automaticamente.',
      },
      {
        title: '4. Migre automações manualmente',
        detail: 'O Mailchimp não exporta automações. Recrie-as na AG Sell usando o Flow Builder — a estrutura é mais flexível.',
      },
    ],
    webhookFields: ['email', 'FNAME', 'LNAME', 'PHONE'],
    tips: [
      'O CSV do Mailchimp usa "Email Address", "First Name", "Last Name" — o mapeamento automático reconhece esses campos.',
      'Tags do Mailchimp são exportadas no CSV na coluna "TAGS".',
      'Para campanhas, exporte os relatórios como referência e recrie os templates na AG Sell.',
    ],
  },
  hubspot: {
    description: 'O HubSpot possui uma API robusta e exportação de dados completa. Você pode migrar contatos, deals e automações.',
    steps: [
      {
        title: '1. Exporte contatos do HubSpot',
        detail: 'Vá em Contacts → List Actions → Export. Selecione os campos desejados e baixe como CSV.',
      },
      {
        title: '2. Exporte negócios (Deals)',
        detail: 'Em Sales → Deals, use a exportação para CSV. Mapeie os campos de valor, estágio e contato associado.',
      },
      {
        title: '3. Configure Webhook via Workflows',
        detail: 'No HubSpot, crie um Workflow com ação "Send a Webhook". Cole a URL da AG Sell abaixo e selecione os campos.',
      },
      {
        title: '4. Templates e Sequences',
        detail: 'Exporte seus templates de e-mail como HTML (Email → Design Tools) e importe via JSON na AG Sell.',
      },
    ],
    webhookFields: ['firstname', 'lastname', 'email', 'phone', 'company'],
    tips: [
      'O HubSpot permite enviar até 100 propriedades no webhook — selecione apenas as necessárias.',
      'Deals podem ser importados como negócios no Pipeline da AG Sell via CSV.',
      'Workflows do HubSpot podem ser recriados no Flow Builder com mais flexibilidade.',
    ],
  },
};

export function MigrationWebhookGuide({ platformId, platformName }: Props) {
  const { currentOrganization } = useOrganization();
  const guide = platformGuides[platformId];
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  if (!guide) return null;

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'gmemxbfibakfpsjbsvyt';
  const webhookUrl = `https://${projectId}.supabase.co/functions/v1/webhook-inbound`;

  const samplePayload = JSON.stringify(
    guide.webhookFields.reduce((acc, field) => {
      acc[field] = field === 'tags' ? 'lead,importado' : `valor_${field}`;
      return acc;
    }, {} as Record<string, string>),
    null,
    2
  );

  const copyToClipboard = (text: string, type: 'url' | 'payload') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    }
    toast.success('Copiado!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Migração via Webhook — {platformName}
        </CardTitle>
        <CardDescription>{guide.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Webhook URL */}
        <div className="space-y-2">
          <p className="text-sm font-medium">URL do Webhook da AG Sell:</p>
          <div className="flex items-center gap-2">
            <Input value={webhookUrl} readOnly className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookUrl, 'url')}>
              {copiedUrl ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Também funciona com a API pública: configure um Webhook de Entrada em Configurações → Webhooks para URL personalizada.
          </p>
        </div>

        {/* Step by step */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Passo a passo:</p>
          {guide.steps.map((step, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg border border-border">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{i + 1}</span>
              </div>
              <div>
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Sample payload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Exemplo de payload JSON:</p>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(samplePayload, 'payload')}>
              {copiedPayload ? <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
              Copiar
            </Button>
          </div>
          <pre className="bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto">
            {samplePayload}
          </pre>
        </div>

        {/* Tips */}
        <div className="space-y-2 p-3 bg-accent/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Dicas para {platformName}:</p>
          </div>
          <ul className="space-y-1">
            {guide.tips.map((tip, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
          <Shield className="h-4 w-4 text-primary" />
          <p className="text-xs text-muted-foreground">
            Para maior segurança, crie um Webhook de Entrada na AG Sell (Webhooks → Entrada) com token secreto e mapeamento de campos personalizado.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
