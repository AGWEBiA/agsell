import { useState, useMemo, useEffect } from 'react';

import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SwaggerEmbed } from '@/components/api/SwaggerEmbed';
import {
  Search, Code2, Copy, Check, Key, Webhook as WebhookIcon, Send, Users, Building2,
  Briefcase, Tag as TagIcon, Bot, MessagesSquare, FileText, BarChart3, Download,
  ExternalLink, Shield, Zap, BookOpen, Terminal, Rocket,
} from 'lucide-react';
import { toast } from 'sonner';
import agsellLogo from '@/assets/agsell-api-logo.png';

const API_BASE = `https://rcxrkvwxlzwzrllwdwgz.supabase.co/functions/v1/public-api/v1`;
const API_BASE_V11 = `https://rcxrkvwxlzwzrllwdwgz.supabase.co/functions/v1/public-api/v1.1`;
const OPENAPI_URL = `https://rcxrkvwxlzwzrllwdwgz.supabase.co/functions/v1/openapi-spec`;
const POSTMAN_URL = `https://rcxrkvwxlzwzrllwdwgz.supabase.co/functions/v1/openapi-spec?format=postman`;

type Lang = 'curl' | 'js' | 'python' | 'php';

interface Endpoint {
  id: string;
  group: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  title: string;
  description: string;
  body?: Record<string, unknown>;
  responseExample?: Record<string, unknown>;
}

const ENDPOINTS: Endpoint[] = [
  // Contacts
  { id: 'contacts-list', group: 'CRM · Contatos', method: 'GET', path: '/contacts', title: 'Listar contatos', description: 'Retorna contatos paginados (cursor por created_at).' },
  { id: 'contacts-get', group: 'CRM · Contatos', method: 'GET', path: '/contacts/{id}', title: 'Buscar contato', description: 'Retorna detalhes de um contato específico.' },
  { id: 'contacts-create', group: 'CRM · Contatos', method: 'POST', path: '/contacts', title: 'Criar contato', description: 'Cria um novo contato. Apenas first_name é obrigatório.', body: { first_name: 'João', last_name: 'Silva', email: 'joao@exemplo.com', phone: '+5511999999999', whatsapp: '+5511999999999', source: 'api' } },
  { id: 'contacts-update', group: 'CRM · Contatos', method: 'PATCH', path: '/contacts/{id}', title: 'Atualizar contato', description: 'Atualiza campos parcialmente.', body: { status: 'qualificado', lead_score: 85 } },
  { id: 'contacts-delete', group: 'CRM · Contatos', method: 'DELETE', path: '/contacts/{id}', title: 'Remover contato', description: 'Exclui um contato permanentemente.' },
  // Companies
  { id: 'companies-list', group: 'CRM · Empresas', method: 'GET', path: '/companies', title: 'Listar empresas', description: 'Retorna lista paginada de empresas.' },
  { id: 'companies-create', group: 'CRM · Empresas', method: 'POST', path: '/companies', title: 'Criar empresa', description: 'Cria uma nova empresa.', body: { name: 'Acme Corp', domain: 'acme.com', industry: 'SaaS', size: '50-200', city: 'São Paulo' } },
  // Deals
  { id: 'deals-list', group: 'CRM · Negócios', method: 'GET', path: '/deals', title: 'Listar negócios', description: 'Lista negócios com contato e empresa relacionados.' },
  { id: 'deals-create', group: 'CRM · Negócios', method: 'POST', path: '/deals', title: 'Criar negócio', description: 'Cria um novo deal no pipeline.', body: { title: 'Proposta Acme', value: 15000, currency: 'BRL', contact_id: 'uuid-do-contato', stage_id: 'uuid-do-estagio' } },
  // Tags
  { id: 'tags-list', group: 'CRM · Tags', method: 'GET', path: '/tags', title: 'Listar tags', description: 'Lista todas as tags da organização.' },
  { id: 'tags-create', group: 'CRM · Tags', method: 'POST', path: '/tags', title: 'Criar tag', description: 'Cria uma nova etiqueta.', body: { name: 'VIP', color: '#FF0000' } },
  // Messages (v1)
  { id: 'messages-send', group: 'Mensagens', method: 'POST', path: '/messages', title: 'Enviar mensagem', description: 'Envia mensagem omnichannel: WhatsApp, Email ou SMS.', body: { channel: 'whatsapp', to: '+5511999999999', message: 'Olá! Sua proposta está pronta.' } },
  // Messages v1.1 (use base v1.1 — chame com /v1.1/ no lugar de /v1/)
  { id: 'messages-send-v11', group: 'Mensagens v1.1', method: 'POST', path: '/messages', title: '[v1.1] Enviar com tracking', description: 'Envio v1.1: persiste a mensagem, devolve message_id e tracking_url para acompanhamento de entrega. Use o servidor /v1.1/.', body: { channel: 'whatsapp', to: '+5511999999999', message: 'Olá!' } },
  { id: 'messages-get-v11', group: 'Mensagens v1.1', method: 'GET', path: '/messages/{id}', title: '[v1.1] Buscar mensagem', description: 'Retorna o registro completo da mensagem.' },
  { id: 'messages-status-v11', group: 'Mensagens v1.1', method: 'GET', path: '/messages/{id}/status', title: '[v1.1] Status de entrega + timeline', description: 'Status atual (queued/sent/delivered/read/failed) e histórico cronológico.' },
  { id: 'messages-status-cb-v11', group: 'Mensagens v1.1', method: 'POST', path: '/messages/{id}/status', title: '[v1.1] Callback de status', description: 'Reporta atualização de status vinda do provedor (delivered, read, failed, bounced).', body: { status: 'delivered', info: 'Entregue ao dispositivo do destinatário' } },
  // Automations
  { id: 'automations-list', group: 'Automações', method: 'GET', path: '/automations', title: 'Listar automações', description: 'Retorna todas as automações da organização.' },
  { id: 'automations-trigger', group: 'Automações', method: 'POST', path: '/automations/{id}/trigger', title: 'Disparar automação', description: 'Inicia execução de uma automação ativa, passando dados arbitrários.', body: { contact_id: 'uuid', custom_data: { origem: 'site' } } },
  // Inbox
  { id: 'conversations-list', group: 'Inbox', method: 'GET', path: '/conversations', title: 'Listar conversas', description: 'Lista conversas do inbox unificado (todos canais).' },
  { id: 'conversations-get', group: 'Inbox', method: 'GET', path: '/conversations/{id}', title: 'Buscar conversa', description: 'Retorna conversa com dados do contato.' },
  // Forms
  { id: 'forms-list', group: 'Forms', method: 'GET', path: '/forms', title: 'Listar formulários', description: 'Retorna formulários da organização.' },
  { id: 'forms-submissions', group: 'Forms', method: 'GET', path: '/forms/{id}/submissions', title: 'Listar submissões', description: 'Retorna submissões de um formulário.' },
  { id: 'forms-submit', group: 'Forms', method: 'POST', path: '/forms/{id}/submit', title: 'Submeter formulário (público)', description: 'Endpoint PÚBLICO sem autenticação. Cria contato automaticamente.', body: { data: { nome: 'Cliente', email: 'cliente@email.com', telefone: '+5511999999999' } } },
  // Webhooks (v1)
  { id: 'webhooks-list', group: 'Webhooks', method: 'GET', path: '/webhooks', title: 'Listar assinaturas', description: 'Lista assinaturas de webhook ativas.' },
  { id: 'webhooks-create', group: 'Webhooks', method: 'POST', path: '/webhooks', title: 'Criar assinatura', description: 'Inscreve URL externa em eventos. v1.1 retorna o secret HMAC para validação de assinaturas (X-Agsell-Signature).', body: { name: 'Meu Sistema', url: 'https://meusite.com/webhook', events: ['contact.created', 'deal.won', 'message.status_updated'] } },
  { id: 'webhooks-delete', group: 'Webhooks', method: 'DELETE', path: '/webhooks/{id}', title: 'Remover assinatura', description: 'Cancela uma assinatura de webhook.' },
  // Webhooks v1.1
  { id: 'webhooks-events-v11', group: 'Webhooks v1.1', method: 'GET', path: '/webhooks/events', title: '[v1.1] Eventos suportados', description: 'Lista todos os event names que podem ser assinados.' },
  { id: 'webhooks-test-v11', group: 'Webhooks v1.1', method: 'POST', path: '/webhooks/{id}/test', title: '[v1.1] Disparar teste', description: 'Envia um evento webhook.test assinado para a URL cadastrada e retorna o status_code da resposta.' },
  { id: 'webhooks-rotate-v11', group: 'Webhooks v1.1', method: 'POST', path: '/webhooks/{id}/rotate-secret', title: '[v1.1] Rotacionar secret', description: 'Gera um novo secret HMAC. O valor anterior é invalidado imediatamente.' },
  // Metrics
  { id: 'metrics-overview', group: 'Métricas', method: 'GET', path: '/metrics/overview?period=30d', title: 'Visão geral', description: 'KPIs consolidados do período (today, 7d, 30d, 90d).' },
  { id: 'metrics-leads', group: 'Métricas', method: 'GET', path: '/metrics/leads', title: 'Métricas de leads', description: 'Estatísticas de geração e conversão.' },
];

const WEBHOOK_EVENTS = [
  { name: 'contact.created', desc: 'Novo contato criado' },
  { name: 'contact.updated', desc: 'Contato atualizado' },
  { name: 'contact.tagged', desc: 'Tag aplicada a contato' },
  { name: 'deal.created', desc: 'Novo negócio criado' },
  { name: 'deal.stage_changed', desc: 'Negócio mudou de estágio' },
  { name: 'deal.won', desc: 'Negócio ganho' },
  { name: 'deal.lost', desc: 'Negócio perdido' },
  { name: 'message.received', desc: 'Nova mensagem recebida (qualquer canal)' },
  { name: 'message.sent', desc: 'Mensagem enviada com sucesso' },
  { name: 'form.submitted', desc: 'Formulário submetido' },
  { name: 'automation.completed', desc: 'Automação concluiu execução' },
  { name: 'conversation.assigned', desc: 'Conversa atribuída a agente' },
];

function buildExample(ep: Endpoint, lang: Lang, apiKey = 'YOUR_API_KEY'): string {
  const base = ep.group.includes('v1.1') ? API_BASE_V11 : API_BASE;
  const url = `${base}${ep.path.replace('{id}', 'RESOURCE_ID')}`;
  const bodyJson = ep.body ? JSON.stringify(ep.body, null, 2) : '';
  const hasBody = !!ep.body && ep.method !== 'GET';

  if (lang === 'curl') {
    return `curl -X ${ep.method} '${url}' \\
  -H 'X-API-Key: ${apiKey}' \\
  -H 'Content-Type: application/json'${hasBody ? ` \\\n  -d '${bodyJson.replace(/\n/g, '\n     ')}'` : ''}`;
  }
  if (lang === 'js') {
    return `const res = await fetch('${url}', {
  method: '${ep.method}',
  headers: {
    'X-API-Key': '${apiKey}',
    'Content-Type': 'application/json',
  },${hasBody ? `\n  body: JSON.stringify(${bodyJson}),` : ''}
});
const data = await res.json();
console.log(data);`;
  }
  if (lang === 'python') {
    return `import requests

url = '${url}'
headers = {
    'X-API-Key': '${apiKey}',
    'Content-Type': 'application/json',
}
${hasBody ? `payload = ${bodyJson.replace(/"/g, "'").replace(/: true/g, ': True').replace(/: false/g, ': False').replace(/: null/g, ': None')}\n\nresponse = requests.${ep.method.toLowerCase()}(url, headers=headers, json=payload)` : `response = requests.${ep.method.toLowerCase()}(url, headers=headers)`}
print(response.json())`;
  }
  // PHP
  return `<?php
$ch = curl_init('${url}');
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${ep.method}');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-Key: ${apiKey}',
    'Content-Type: application/json',
]);${hasBody ? `\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(${bodyJson.replace(/"/g, "'").replace(/\{/g, '[').replace(/\}/g, ']').replace(/:/g, ' =>')}));` : ''}
$response = curl_exec($ch);
curl_close($ch);
echo $response;`;
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  POST: 'bg-green-500/10 text-green-500 border-green-500/20',
  PATCH: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  DELETE: 'bg-red-500/10 text-red-500 border-red-500/20',
};

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group">
      <pre className="bg-zinc-950 text-zinc-100 p-4 rounded-lg overflow-x-auto text-xs leading-relaxed border border-zinc-800">
        <code>{code}</code>
      </pre>
      <Button
        size="icon" variant="ghost"
        className="absolute top-2 right-2 h-7 w-7 opacity-70 group-hover:opacity-100"
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); toast.success('Copiado!'); setTimeout(() => setCopied(false), 2000); }}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

export default function ApiDocs() {
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string>('intro');
  const [lang, setLang] = useState<Lang>('curl');

  const filtered = useMemo(() => {
    if (!search.trim()) return ENDPOINTS;
    const q = search.toLowerCase();
    return ENDPOINTS.filter(e => e.title.toLowerCase().includes(q) || e.path.toLowerCase().includes(q) || e.group.toLowerCase().includes(q));
  }, [search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Endpoint[]>();
    filtered.forEach(e => {
      if (!map.has(e.group)) map.set(e.group, []);
      map.get(e.group)!.push(e);
    });
    return Array.from(map.entries());
  }, [filtered]);

  // Scroll spy
  useEffect(() => {
    const handler = () => {
      const sections = document.querySelectorAll('[data-section]');
      let current = 'intro';
      sections.forEach((s) => {
        const r = (s as HTMLElement).getBoundingClientRect();
        if (r.top < 200) current = (s as HTMLElement).dataset.section || current;
      });
      setActiveId(current);
    };
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    document.title = 'API Docs · Agsell — Integração nativa REST';
    const desc = 'Documentação completa da API REST do Agsell: contatos, deals, mensagens omnichannel, automações e webhooks. Exemplos em cURL, JavaScript, Python e PHP.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);
  }, []);

  const groupIcon: Record<string, JSX.Element> = {
    'CRM · Contatos': <Users className="h-3.5 w-3.5" />,
    'CRM · Empresas': <Building2 className="h-3.5 w-3.5" />,
    'CRM · Negócios': <Briefcase className="h-3.5 w-3.5" />,
    'CRM · Tags': <TagIcon className="h-3.5 w-3.5" />,
    'Mensagens': <Send className="h-3.5 w-3.5" />,
    'Mensagens v1.1': <Send className="h-3.5 w-3.5" />,
    'Automações': <Bot className="h-3.5 w-3.5" />,
    'Inbox': <MessagesSquare className="h-3.5 w-3.5" />,
    'Forms': <FileText className="h-3.5 w-3.5" />,
    'Webhooks': <WebhookIcon className="h-3.5 w-3.5" />,
    'Webhooks v1.1': <WebhookIcon className="h-3.5 w-3.5" />,
    'Métricas': <BarChart3 className="h-3.5 w-3.5" />,
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center gap-4">
            <Link to="/" className="flex items-center gap-2 font-bold">
              <img src={agsellLogo} alt="AG Sell" className="h-7 w-7 rounded-md object-contain" />
              <span>Agsell API</span>
              <Badge variant="secondary" className="text-[10px]">v1.1</Badge>
            </Link>
            <div className="flex-1 max-w-md ml-auto">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar endpoints..." className="pl-8 h-9" />
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={OPENAPI_URL} target="_blank" rel="noreferrer">
                <Download className="h-3.5 w-3.5 mr-1.5" /> OpenAPI
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={POSTMAN_URL} target="_blank" rel="noreferrer">
                <Download className="h-3.5 w-3.5 mr-1.5" /> Postman
              </a>
            </Button>
            <Button size="sm" asChild>
              <Link to="/api-keys"><Key className="h-3.5 w-3.5 mr-1.5" /> API Keys</Link>
            </Button>
          </div>
        </header>

        <div className="container flex gap-6 py-6">
          {/* Sidebar */}
          <aside className="hidden lg:block w-60 shrink-0">
            <ScrollArea className="h-[calc(100vh-6rem)] sticky top-20">
              <nav className="space-y-1 pr-3">
                <a href="#intro" className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted ${activeId === 'intro' ? 'bg-muted font-medium' : ''}`}>
                  <BookOpen className="h-3.5 w-3.5" /> Introdução
                </a>
                <a href="#quickstart" className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted ${activeId === 'quickstart' ? 'bg-muted font-medium' : ''}`}>
                  <Rocket className="h-3.5 w-3.5" /> Guia rápido
                </a>
                <a href="#auth" className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted ${activeId === 'auth' ? 'bg-muted font-medium' : ''}`}>
                  <Shield className="h-3.5 w-3.5" /> Autenticação
                </a>
                <a href="#errors" className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted ${activeId === 'errors' ? 'bg-muted font-medium' : ''}`}>
                  <Zap className="h-3.5 w-3.5" /> Erros & Limites
                </a>
                <a href="#webhooks-info" className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted ${activeId === 'webhooks-info' ? 'bg-muted font-medium' : ''}`}>
                  <WebhookIcon className="h-3.5 w-3.5" /> Webhooks
                </a>
                <a href="#swagger" className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted ${activeId === 'swagger' ? 'bg-muted font-medium' : ''}`}>
                  <Code2 className="h-3.5 w-3.5" /> Swagger interativo
                </a>
                <Separator className="my-3" />
                <p className="px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Endpoints</p>
                {grouped.map(([group, items]) => (
                  <div key={group} className="mb-2">
                    <p className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {groupIcon[group]} {group}
                    </p>
                    {items.map(ep => (
                      <a key={ep.id} href={`#${ep.id}`} className={`flex items-center gap-2 px-3 py-1 ml-2 text-xs rounded hover:bg-muted ${activeId === ep.id ? 'bg-muted font-medium' : 'text-muted-foreground'}`}>
                        <span className={`text-[9px] font-bold w-10 ${METHOD_COLORS[ep.method].split(' ')[1]}`}>{ep.method}</span>
                        <span className="truncate">{ep.title}</span>
                      </a>
                    ))}
                  </div>
                ))}
              </nav>
            </ScrollArea>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 space-y-12">
            {/* Intro */}
            <section data-section="intro" id="intro" className="scroll-mt-20">
              <Badge className="mb-3">REST API · v1.1</Badge>
              <h1 className="text-4xl font-bold tracking-tight mb-3">Integração nativa com Agsell</h1>
              <p className="text-lg text-muted-foreground mb-6">
                API REST completa para integrar seu sistema, ERP, e-commerce ou aplicativo ao CRM, Inbox e motor de automações do Agsell.
                Compatível com qualquer linguagem que faça requisições HTTP.
              </p>
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Base URL</p>
                  <code className="text-sm font-mono">{API_BASE}</code>
                </CardContent>
              </Card>
              <div className="grid sm:grid-cols-3 gap-3 mt-6">
                <Card><CardContent className="p-4"><Shield className="h-5 w-5 text-primary mb-2" /><p className="font-semibold text-sm">SHA-256</p><p className="text-xs text-muted-foreground">Chaves hasheadas, nunca armazenadas em texto puro</p></CardContent></Card>
                <Card><CardContent className="p-4"><Zap className="h-5 w-5 text-primary mb-2" /><p className="font-semibold text-sm">60 req/min</p><p className="text-xs text-muted-foreground">Rate limit configurável por chave</p></CardContent></Card>
                <Card><CardContent className="p-4"><Terminal className="h-5 w-5 text-primary mb-2" /><p className="font-semibold text-sm">OpenAPI 3.1</p><p className="text-xs text-muted-foreground">Importe no Postman, Insomnia ou gere SDK</p></CardContent></Card>
              </div>
              <Card className="mt-4 border-primary/30 bg-primary/5">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <Download className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Coleção pronta do Postman</p>
                      <p className="text-xs text-muted-foreground">Baixe o JSON, importe no Postman/Insomnia e configure as variáveis <code className="bg-muted px-1 rounded">base_url</code> e <code className="bg-muted px-1 rounded">api_key</code>. Todos os endpoints prontos para teste.</p>
                    </div>
                  </div>
                  <Button asChild className="shrink-0">
                    <a href={POSTMAN_URL} target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4 mr-1.5" /> Baixar coleção
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </section>

            {/* Quick Start */}
            <section data-section="quickstart" id="quickstart" className="scroll-mt-20">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2"><Rocket className="h-5 w-5" /> Guia rápido — primeira chamada em 3 minutos</h2>
              <p className="text-muted-foreground mb-6">
                Siga os passos abaixo para gerar sua API Key, ajustar o rate limit e disparar sua primeira requisição via cURL.
              </p>

              <div className="space-y-4">
                {/* Step 1 */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                      <CardTitle className="text-base">Gere sua API Key</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>Acesse <Link to="/api-keys" className="text-primary underline">API Keys</Link> no menu lateral.</li>
                      <li>Clique em <strong className="text-foreground">"Nova chave"</strong> e dê um nome descritivo (ex: <code className="bg-muted px-1 rounded text-xs">ERP Produção</code>).</li>
                      <li>Selecione os escopos (read/write) conforme a integração.</li>
                      <li><strong className="text-destructive">Copie a chave imediatamente</strong> — ela é mostrada apenas uma vez (armazenamos só o hash SHA-256).</li>
                    </ol>
                    <div className="bg-muted/50 border border-border rounded-md p-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Formato da chave</p>
                      <code className="text-xs font-mono">ags_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</code>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/api-keys"><Key className="h-3.5 w-3.5 mr-1.5" /> Abrir gerenciador de chaves</Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* Step 2 */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
                      <CardTitle className="text-base">Configure o rate limit</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      Cada chave tem um limite padrão de <strong className="text-foreground">60 requisições por minuto</strong>. Você pode ajustar
                      por chave em <Link to="/api-keys" className="text-primary underline">API Keys</Link> → editar → <em>Rate limit</em>.
                    </p>
                    <div className="grid sm:grid-cols-3 gap-2">
                      <div className="bg-muted/30 rounded p-3 border">
                        <p className="text-xs text-muted-foreground">Padrão</p>
                        <p className="font-bold">60 req/min</p>
                      </div>
                      <div className="bg-muted/30 rounded p-3 border">
                        <p className="text-xs text-muted-foreground">Alto volume</p>
                        <p className="font-bold">300 req/min</p>
                      </div>
                      <div className="bg-muted/30 rounded p-3 border">
                        <p className="text-xs text-muted-foreground">Enterprise</p>
                        <p className="font-bold">1000+ req/min</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cada resposta inclui os headers <code className="bg-muted px-1 rounded">X-RateLimit-Limit</code>,
                      <code className="bg-muted px-1 rounded ml-1">X-RateLimit-Remaining</code> e
                      <code className="bg-muted px-1 rounded ml-1">X-RateLimit-Reset</code>. Se exceder, retorna <code className="bg-muted px-1 rounded">429 Too Many Requests</code>.
                    </p>
                  </CardContent>
                </Card>

                {/* Step 3 */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                      <CardTitle className="text-base">Teste a primeira chamada com cURL</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-muted-foreground">Liste seus contatos para validar a autenticação:</p>
                    <pre className="bg-zinc-950 text-zinc-100 rounded-md p-3 text-xs overflow-x-auto">
{`curl -X GET "${API_BASE}/contacts?limit=5" \\
  -H "X-API-Key: ags_live_SUA_CHAVE_AQUI" \\
  -H "Content-Type: application/json"`}
                    </pre>
                    <p className="text-xs font-semibold text-muted-foreground mt-3">Resposta esperada (200 OK)</p>
                    <pre className="bg-zinc-950 text-zinc-100 rounded-md p-3 text-xs overflow-x-auto">
{`{
  "data": [
    { "id": "...", "first_name": "João", "email": "joao@ex.com" }
  ],
  "pagination": { "page": 1, "limit": 5, "total": 142 }
}`}
                    </pre>
                    <p className="text-muted-foreground">Envie sua primeira mensagem WhatsApp:</p>
                    <pre className="bg-zinc-950 text-zinc-100 rounded-md p-3 text-xs overflow-x-auto">
{`curl -X POST "${API_BASE}/messages" \\
  -H "X-API-Key: ags_live_SUA_CHAVE_AQUI" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channel": "whatsapp",
    "to": "5511999999999",
    "content": "Olá! Mensagem de teste via API."
  }'`}
                    </pre>
                    <div className="bg-success/10 border border-success/30 rounded-md p-3 text-xs">
                      ✅ Recebeu <code className="bg-muted px-1 rounded">200</code>? Sua integração está pronta. Veja todos os endpoints abaixo.
                    </div>
                    <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-xs">
                      ❌ <strong>401 Unauthorized:</strong> chave inválida ou faltando header <code className="bg-muted px-1 rounded">X-API-Key</code>.<br/>
                      ❌ <strong>429 Too Many Requests:</strong> aguarde o tempo indicado em <code className="bg-muted px-1 rounded">X-RateLimit-Reset</code>.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Auth */}
            <section data-section="auth" id="auth" className="scroll-mt-20">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2"><Shield className="h-5 w-5" /> Autenticação</h2>
              <p className="text-muted-foreground mb-4">
                Envie sua API Key no header <code className="bg-muted px-1.5 py-0.5 rounded text-xs">X-API-Key</code> em toda requisição autenticada.
                Crie e gerencie chaves em <Link to="/api-keys" className="text-primary underline">API Keys</Link>.
              </p>
              <CodeBlock code={`curl '${API_BASE}/contacts' \\
  -H 'X-API-Key: sk_live_abc123...'`} />
              <Card className="mt-4 border-yellow-500/30 bg-yellow-500/5">
                <CardContent className="p-4 text-sm">
                  <strong>⚠️ Nunca exponha a API Key no frontend.</strong> Use sempre em servidor (backend, edge function, worker).
                  Para uso público em formulários, use <code className="bg-muted px-1 rounded">/forms/&#123;id&#125;/submit</code> que dispensa autenticação.
                </CardContent>
              </Card>
            </section>

            {/* Errors */}
            <section data-section="errors" id="errors" className="scroll-mt-20">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2"><Zap className="h-5 w-5" /> Erros & Rate Limits</h2>
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                {[
                  ['400', 'Validação falhou — verifique o body'],
                  ['401', 'API key ausente ou inválida'],
                  ['403', 'Sem permissão para essa ação'],
                  ['404', 'Recurso não encontrado'],
                  ['429', 'Rate limit excedido (60/min ou 10k/dia)'],
                  ['500', 'Erro interno — tente novamente'],
                ].map(([code, desc]) => (
                  <div key={code} className="flex gap-3 p-3 border rounded-lg">
                    <code className="font-mono font-bold text-primary">{code}</code>
                    <span className="text-sm text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Todas as respostas de erro seguem o padrão: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{`{ "error": "...", "code": "..." }`}</code></p>
            </section>

            {/* Webhooks intro */}
            <section data-section="webhooks-info" id="webhooks-info" className="scroll-mt-20">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2"><WebhookIcon className="h-5 w-5" /> Webhooks (Eventos)</h2>
              <p className="text-muted-foreground mb-4">
                Receba notificações HTTP em tempo real quando eventos acontecem no sistema. Inscreva-se via API no endpoint <code className="bg-muted px-1.5 py-0.5 rounded text-xs">POST /webhooks</code>.
              </p>
              <Card>
                <CardHeader><CardTitle className="text-base">Eventos disponíveis</CardTitle></CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-2">
                  {WEBHOOK_EVENTS.map(ev => (
                    <div key={ev.name} className="flex items-start gap-2 text-sm">
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono shrink-0">{ev.name}</code>
                      <span className="text-muted-foreground text-xs">{ev.desc}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="mt-4">
                <CardHeader><CardTitle className="text-base">Payload de exemplo</CardTitle></CardHeader>
                <CardContent>
                  <CodeBlock code={`POST https://seusite.com/webhook
Content-Type: application/json
X-Agsell-Signature: sha256=...
X-Agsell-Event: contact.created

{
  "event": "contact.created",
  "timestamp": "2026-04-28T20:00:00Z",
  "organization_id": "uuid",
  "data": {
    "id": "contact-uuid",
    "first_name": "João",
    "email": "joao@exemplo.com"
  }
}`} />
                </CardContent>
              </Card>
            </section>

            <Separator />

            {/* Endpoints */}
            {grouped.map(([group, items]) => (
              <div key={group} className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2 sticky top-16 bg-background py-2 z-10">
                  {groupIcon[group]} {group}
                </h2>
                {items.map(ep => (
                  <section key={ep.id} data-section={ep.id} id={ep.id} className="scroll-mt-20">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge variant="outline" className={`font-mono text-xs ${METHOD_COLORS[ep.method]}`}>{ep.method}</Badge>
                          <code className="text-sm font-mono font-medium">{ep.path}</code>
                        </div>
                        <CardTitle className="text-lg">{ep.title}</CardTitle>
                        <CardDescription>{ep.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Tabs value={lang} onValueChange={(v) => setLang(v as Lang)}>
                          <TabsList className="grid grid-cols-4 w-full max-w-md">
                            <TabsTrigger value="curl">cURL</TabsTrigger>
                            <TabsTrigger value="js">JavaScript</TabsTrigger>
                            <TabsTrigger value="python">Python</TabsTrigger>
                            <TabsTrigger value="php">PHP</TabsTrigger>
                          </TabsList>
                          {(['curl', 'js', 'python', 'php'] as Lang[]).map(l => (
                            <TabsContent key={l} value={l} className="mt-3">
                              <CodeBlock code={buildExample(ep, l)} />
                            </TabsContent>
                          ))}
                        </Tabs>
                      </CardContent>
                    </Card>
                  </section>
                ))}
              </div>
            ))}

            {/* Swagger interativo */}
            <section data-section="swagger" id="swagger" className="scroll-mt-20">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2"><Code2 className="h-5 w-5" /> Swagger UI — playground interativo</h2>
              <p className="text-muted-foreground mb-4">
                Documentação OpenAPI 3.1 renderizada com Swagger UI. Clique em <strong>"Authorize"</strong> e cole sua API Key
                (header <code className="bg-muted px-1 rounded text-xs">X-API-Key</code>) para executar chamadas <em>Try it out</em> direto do navegador.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Button variant="outline" size="sm" asChild>
                  <a href={OPENAPI_URL} target="_blank" rel="noreferrer">
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Baixar JSON OpenAPI
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={POSTMAN_URL} target="_blank" rel="noreferrer">
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Baixar coleção Postman
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`https://editor.swagger.io/?url=${encodeURIComponent(OPENAPI_URL)}`} target="_blank" rel="noreferrer">
                    Abrir no Swagger Editor <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                  </a>
                </Button>
              </div>
              <SwaggerEmbed specUrl={OPENAPI_URL} />
            </section>

            {/* Footer */}
            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <CardContent className="p-6 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-bold text-lg mb-1">Pronto para começar?</h3>
                  <p className="text-sm text-muted-foreground">Crie sua API Key e faça a primeira chamada em menos de 2 minutos.</p>
                </div>
                <div className="flex gap-2">
                  <Button asChild><Link to="/api-keys">Gerar API Key</Link></Button>
                  <Button variant="outline" asChild>
                    <a href={OPENAPI_URL} target="_blank" rel="noreferrer">
                      Baixar OpenAPI <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </>
  );
}
