import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Copy, Check, Globe, Key, BarChart3, Users, Mail,
  TrendingUp, RefreshCw, ShieldCheck, FileText, Code2, Webhook,
  Search, Filter, ArrowRight, Zap, ExternalLink, Tag, Send,
} from 'lucide-react';
import { toast } from 'sonner';

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label || 'Texto'} copiado!`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="shrink-0">
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function CodeBlock({ code, language = 'typescript', label }: { code: string; language?: string; label?: string }) {
  return (
    <div className="relative group">
      <pre className="bg-zinc-950 text-zinc-100 p-5 rounded-xl text-sm overflow-x-auto font-mono leading-relaxed border border-zinc-800">
        <code>{code}</code>
      </pre>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={code} label={label || 'Código'} />
      </div>
    </div>
  );
}

const BASE_URL = 'https://gmemxbfibakfpsjbsvyt.supabase.co/functions/v1/public-api';

const endpoints = [
  // Metrics
  { method: 'GET', path: '/metrics/overview', desc: 'Resumo geral de todas as métricas', icon: BarChart3, category: 'metrics' },
  { method: 'GET', path: '/metrics/email', desc: 'Aberturas, cliques, taxa de entrega', icon: Mail, category: 'metrics' },
  { method: 'GET', path: '/metrics/leads', desc: 'Leads por período, funil, tag e source', icon: Users, category: 'metrics' },
  { method: 'GET', path: '/metrics/pipeline', desc: 'Deals por etapa, taxa de conversão', icon: TrendingUp, category: 'metrics' },
  { method: 'GET', path: '/metrics/automations', desc: 'Execuções e taxa de sucesso', icon: RefreshCw, category: 'metrics' },
  { method: 'GET', path: '/metrics/forms', desc: 'Submissões e taxa de conversão', icon: FileText, category: 'metrics' },
  // Contacts CRUD
  { method: 'GET', path: '/contacts', desc: 'Listar contatos (paginação por cursor)', icon: Users, category: 'crud' },
  { method: 'POST', path: '/contacts', desc: 'Criar novo contato', icon: Users, category: 'crud' },
  { method: 'GET', path: '/contacts/:id', desc: 'Buscar contato por ID', icon: Users, category: 'crud' },
  { method: 'PUT', path: '/contacts/:id', desc: 'Atualizar contato (substituição)', icon: Users, category: 'crud' },
  { method: 'PATCH', path: '/contacts/:id', desc: 'Atualizar contato (parcial)', icon: Users, category: 'crud' },
  { method: 'DELETE', path: '/contacts/:id', desc: 'Excluir contato', icon: Users, category: 'crud' },
  // Companies CRUD
  { method: 'GET', path: '/companies', desc: 'Listar empresas', icon: Globe, category: 'crud' },
  { method: 'POST', path: '/companies', desc: 'Criar nova empresa', icon: Globe, category: 'crud' },
  { method: 'GET', path: '/companies/:id', desc: 'Buscar empresa por ID', icon: Globe, category: 'crud' },
  { method: 'PUT', path: '/companies/:id', desc: 'Atualizar empresa', icon: Globe, category: 'crud' },
  { method: 'PATCH', path: '/companies/:id', desc: 'Atualizar empresa (parcial)', icon: Globe, category: 'crud' },
  { method: 'DELETE', path: '/companies/:id', desc: 'Excluir empresa', icon: Globe, category: 'crud' },
  // Deals CRUD
  { method: 'GET', path: '/deals', desc: 'Listar negócios', icon: TrendingUp, category: 'crud' },
  { method: 'POST', path: '/deals', desc: 'Criar novo negócio', icon: TrendingUp, category: 'crud' },
  { method: 'GET', path: '/deals/:id', desc: 'Buscar negócio por ID (com contato e empresa)', icon: TrendingUp, category: 'crud' },
  { method: 'PUT', path: '/deals/:id', desc: 'Atualizar negócio', icon: TrendingUp, category: 'crud' },
  { method: 'PATCH', path: '/deals/:id', desc: 'Atualizar negócio (parcial)', icon: TrendingUp, category: 'crud' },
  { method: 'DELETE', path: '/deals/:id', desc: 'Excluir negócio', icon: TrendingUp, category: 'crud' },
  // Tags CRUD
  { method: 'GET', path: '/tags', desc: 'Listar tags', icon: Tag, category: 'crud' },
  { method: 'POST', path: '/tags', desc: 'Criar nova tag', icon: Tag, category: 'crud' },
  { method: 'GET', path: '/tags/:id', desc: 'Buscar tag por ID', icon: Tag, category: 'crud' },
  { method: 'DELETE', path: '/tags/:id', desc: 'Excluir tag', icon: Tag, category: 'crud' },
  // Forms
  { method: 'GET', path: '/forms', desc: 'Listar formulários', icon: FileText, category: 'forms' },
  { method: 'GET', path: '/forms/:id', desc: 'Detalhes do formulário', icon: FileText, category: 'forms' },
  { method: 'GET', path: '/forms/:id/submissions', desc: 'Submissões com filtros e projeção', icon: FileText, category: 'forms' },
  { method: 'POST', path: '/forms/:id/submit', desc: 'Submissão pública (sem API Key)', icon: Send, category: 'forms' },
];

const queryParams = [
  { param: 'period', desc: 'Período dos dados (métricas)', values: 'today, 7d, 30d, 90d', default: '30d' },
  { param: 'tag', desc: 'Filtrar leads por tag', values: 'nome da tag', default: '—' },
  { param: 'source', desc: 'Filtrar leads por fonte', values: 'whatsapp, formulario, etc.', default: '—' },
  { param: 'status', desc: 'Filtrar por status', values: 'new, qualified, etc.', default: '—' },
  { param: 'limit', desc: 'Itens por página', values: '1-100', default: '50' },
  { param: 'cursor', desc: 'Cursor para próxima página (created_at)', values: 'ISO timestamp', default: '—' },
  { param: 'offset', desc: 'Offset alternativo (se não usar cursor)', values: 'número inteiro', default: '—' },
  { param: 'direction', desc: 'Direção da paginação', values: 'next, prev', default: 'next' },
  { param: 'fields', desc: 'Projetar campos específicos (submissions)', values: 'campo1,campo2', default: 'todos' },
  { param: 'filter.[campo]', desc: 'Filtros múltiplos nos dados do formulário', values: 'valor parcial (case-insensitive)', default: '—' },
  { param: 'field + value', desc: 'Filtro legado (campo único)', values: 'field=nome&value=João', default: '—' },
];

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  PUT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  PATCH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

export default function ApiDocs() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredEndpoints = activeCategory === 'all'
    ? endpoints
    : endpoints.filter(e => e.category === activeCategory);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Logo variant="auto" size="md" />
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-zinc-300 dark:text-zinc-600">/</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">API Docs</span>
              <Badge variant="outline" className="text-xs font-mono">v1.1</Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="gap-1.5">
                Criar Conta <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge className="bg-primary/10 text-primary border-primary/20">REST API v1.1</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            AG Sell API
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Integre qualquer ferramenta externa ao AG Sell via API REST ou Webhooks.
            Leia métricas, gerencie contatos, empresas, negócios, tags e receba submissões de formulários em tempo real.
          </p>
        </div>

        {/* Quick Start */}
        <Card className="border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <CardHeader className="bg-zinc-900 dark:bg-zinc-950 pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Quick Start — Primeira Requisição
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <CodeBlock
              label="Quick Start"
              code={`curl -X GET "${BASE_URL}/metrics/overview?period=7d" \\
  -H "x-api-key: ag_sua_chave_aqui" \\
  -H "Content-Type: application/json"`}
            />
          </CardContent>
        </Card>

        {/* Auth Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Key className="h-6 w-6 text-primary" />
            Autenticação
          </h2>
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardContent className="pt-6 space-y-4">
              <p className="text-zinc-700 dark:text-zinc-300">
                Todas as requisições exigem o header <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-sm font-mono text-primary">x-api-key</code> com uma chave válida.
              </p>
              <p className="text-zinc-700 dark:text-zinc-300">
                <strong>Exceção:</strong> O endpoint <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-sm font-mono text-blue-600 dark:text-blue-400">POST /forms/:id/submit</code> é público e não requer API Key.
              </p>
              <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Como obter sua API Key:</p>
                <ol className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2 list-decimal pl-5">
                  <li>Acesse o AG Sell e vá em <strong>Configurações → API Keys</strong></li>
                  <li>Clique em <strong>"Gerar Nova Chave"</strong></li>
                  <li>Selecione as permissões desejadas:
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li><code className="font-mono text-xs">read</code> — leitura (GET)</li>
                      <li><code className="font-mono text-xs">write</code> — criação e atualização (POST, PUT, PATCH)</li>
                      <li><code className="font-mono text-xs">delete</code> — exclusão (DELETE)</li>
                      <li><code className="font-mono text-xs">admin</code> — acesso total</li>
                    </ul>
                  </li>
                  <li>Copie a chave — ela não será exibida novamente</li>
                </ol>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Segurança:</strong> As chaves são armazenadas com hash SHA-256. Nunca compartilhe sua API Key em código público. Chaves expiradas ou desativadas retornam <code className="font-mono text-xs">403</code>.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Base URL */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Base URL
          </h2>
          <div className="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-950 rounded-xl p-4 border border-zinc-800">
            <code className="text-emerald-400 font-mono text-sm flex-1 break-all">{BASE_URL}</code>
            <CopyButton text={BASE_URL} label="Base URL" />
          </div>
        </section>

        {/* Endpoints */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Code2 className="h-6 w-6 text-primary" />
            Endpoints ({endpoints.length} rotas)
          </h2>

          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: `Todos (${endpoints.length})` },
              { key: 'metrics', label: 'Métricas' },
              { key: 'crud', label: 'CRUD' },
              { key: 'forms', label: 'Formulários' },
            ].map(cat => (
              <Button
                key={cat.key}
                variant={activeCategory === cat.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat.key)}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredEndpoints.map((ep) => (
              <div
                key={ep.method + ep.path}
                className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-primary/30 transition-colors"
              >
                <ep.icon className="h-4 w-4 text-zinc-400 shrink-0" />
                <Badge className={`${methodColors[ep.method]} text-xs font-mono px-2 shrink-0`}>
                  {ep.method}
                </Badge>
                <code className="text-sm font-mono text-primary truncate">{ep.path}</code>
                <span className="hidden sm:inline text-xs text-zinc-500 ml-auto shrink-0">{ep.desc}</span>
                <CopyButton text={ep.path} label="Endpoint" />
              </div>
            ))}
          </div>
        </section>

        {/* Pagination */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <ArrowRight className="h-6 w-6 text-primary" />
            Paginação por Cursor
          </h2>
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardContent className="pt-6 space-y-4">
              <p className="text-zinc-700 dark:text-zinc-300">
                Todos os endpoints de listagem utilizam <strong>paginação por cursor</strong> (baseado em <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">created_at</code>), garantindo performance consistente em grandes volumes de dados.
              </p>
              <CodeBlock
                label="Cursor Pagination"
                code={`// Primeira página
GET /contacts?limit=20

// Resposta inclui next_cursor
{
  "data": [...],
  "meta": {
    "total": 1500,
    "limit": 20,
    "has_more": true,
    "next_cursor": "2026-03-15T10:30:00.000Z"
  }
}

// Próxima página — use next_cursor
GET /contacts?limit=20&cursor=2026-03-15T10:30:00.000Z

// Alternativa: paginação por offset (menos eficiente)
GET /contacts?limit=20&offset=40`}
              />
            </CardContent>
          </Card>
        </section>

        {/* Query Params */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Filter className="h-6 w-6 text-primary" />
            Parâmetros de Query
          </h2>
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardContent className="pt-6 p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Parâmetro</th>
                      <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Descrição</th>
                      <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Valores</th>
                      <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Default</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queryParams.map((qp) => (
                      <tr key={qp.param} className="border-b border-zinc-100 dark:border-zinc-800/50">
                        <td className="py-3 px-4">
                          <code className="font-mono text-primary text-xs bg-primary/5 px-1.5 py-0.5 rounded">{qp.param}</code>
                        </td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{qp.desc}</td>
                        <td className="py-3 px-4 text-zinc-500 dark:text-zinc-500 font-mono text-xs">{qp.values}</td>
                        <td className="py-3 px-4">
                          <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{qp.default}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Input Validation */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Validação de Dados
          </h2>
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardContent className="pt-6 space-y-4">
              <p className="text-zinc-700 dark:text-zinc-300">
                Todos os campos enviados via POST/PUT/PATCH passam por sanitização automática (whitelist). Campos não reconhecidos são ignorados silenciosamente.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Contatos</p>
                  <p className="text-xs text-zinc-500 font-mono leading-relaxed">
                    first_name* (100), last_name (100), email (320, validado), phone (30), whatsapp (30), position (100), source (50), status (30), notes (5000), company_id (36), lead_score (número)
                  </p>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Empresas</p>
                  <p className="text-xs text-zinc-500 font-mono leading-relaxed">
                    name* (200), domain (255), industry (100), size (50), phone (30), email (320, validado), address (500), city (100), state (100), country (100), notes (5000)
                  </p>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Negócios</p>
                  <p className="text-xs text-zinc-500 font-mono leading-relaxed">
                    title* (200), value (número), probability (número), currency (10), status (30), notes (5000), contact_id (36), company_id (36), stage_id (36), expected_close_date (30)
                  </p>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Tags</p>
                  <p className="text-xs text-zinc-500 font-mono leading-relaxed">
                    name* (100), color (20)
                  </p>
                </div>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">* Campos obrigatórios. Números entre parênteses indicam tamanho máximo em caracteres.</p>
            </CardContent>
          </Card>
        </section>

        {/* Public Form Submit */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Send className="h-6 w-6 text-primary" />
            Submissão Pública de Formulário
          </h2>
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardContent className="pt-6 space-y-4">
              <p className="text-zinc-700 dark:text-zinc-300">
                O endpoint <code className="font-mono text-xs bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded text-blue-800 dark:text-blue-300">POST /forms/:id/submit</code> permite submissões de formulário <strong>sem autenticação</strong>, ideal para integração em sites, landing pages e aplicações externas.
              </p>
              <CodeBlock
                label="Submissão Pública"
                code={`// Enviar dados para um formulário público
const res = await fetch('${BASE_URL}/forms/UUID_DO_FORMULARIO/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: 'Maria Silva',
    email: 'maria@email.com',
    telefone: '11999999999',
    mensagem: 'Quero saber mais sobre o produto'
  })
});

const data = await res.json();
// { success: true, submission_id: "uuid-da-submissao" }

// ⚡ Automaticamente:
// - Contador de submissões é incrementado
// - Automações com trigger "form_submitted" são disparadas
// - Webhook outbound é enviado (se configurado no formulário)`}
              />
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <Zap className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Respostas de erro:</strong>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li><code className="font-mono">404</code> — Formulário não encontrado</li>
                    <li><code className="font-mono">400</code> — Formulário inativo ou body inválido</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Form Submission Filters */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            Filtros Avançados de Submissões
          </h2>
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardContent className="pt-6 space-y-4">
              <p className="text-zinc-700 dark:text-zinc-300">
                O endpoint <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">GET /forms/:id/submissions</code> suporta filtros múltiplos e projeção de campos.
              </p>
              <CodeBlock
                label="Filtros de Submissões"
                code={`// Filtros múltiplos nos dados do formulário (case-insensitive, match parcial)
GET /forms/:id/submissions?filter.profissao=medico&filter.cidade=SP

// Projetar apenas campos específicos dos dados
GET /forms/:id/submissions?fields=nome,email,profissao

// Combinar filtros + projeção + paginação
GET /forms/:id/submissions?filter.profissao=medico&fields=nome,email&limit=10

// Filtro legado (campo único)
GET /forms/:id/submissions?field=profissao&value=medico

// Resposta com metadados completos
{
  "data": [
    {
      "id": "uuid",
      "form_id": "uuid",
      "contact_id": "uuid-or-null",
      "created_at": "2026-03-18T14:30:00.000Z",
      "data": { "nome": "Dr. João", "email": "joao@med.com", "profissao": "Médico" }
    }
  ],
  "meta": {
    "total": 250,
    "limit": 10,
    "has_more": true,
    "next_cursor": "2026-03-15T10:30:00.000Z",
    "filters_applied": { "profissao": "medico" },
    "fields_selected": "nome,email,profissao"
  }
}`}
              />
            </CardContent>
          </Card>
        </section>

        {/* Code Examples */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Code2 className="h-6 w-6 text-primary" />
            Exemplos de Código
          </h2>

          <Tabs defaultValue="sdk" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sdk">SDK Client</TabsTrigger>
              <TabsTrigger value="fetch">Fetch API</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="php">PHP</TabsTrigger>
            </TabsList>

            <TabsContent value="sdk">
              <CodeBlock
                label="SDK Client"
                code={`// agsell-client.ts — SDK para integração nativa
class AGSellClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || '${BASE_URL}';
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const res = await fetch(this.baseUrl + endpoint, {
      ...options,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || \`AG Sell API error: \${res.status}\`);
    }
    return res.json();
  }

  // Métricas
  async getOverview(period = '30d') {
    return this.request(\`/metrics/overview?period=\${period}\`);
  }

  async getLeadMetrics(params: Record<string, string> = {}) {
    const qs = new URLSearchParams({ period: '30d', ...params });
    return this.request(\`/metrics/leads?\${qs}\`);
  }

  // Contatos (com paginação por cursor)
  async listContacts(limit = 50, cursor?: string) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    return this.request(\`/contacts?\${params}\`);
  }

  async createContact(data: Record<string, any>) {
    return this.request('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContact(id: string, data: Record<string, any>) {
    return this.request(\`/contacts/\${id}\`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteContact(id: string) {
    return this.request(\`/contacts/\${id}\`, { method: 'DELETE' });
  }

  // Tags
  async listTags(limit = 50) {
    return this.request(\`/tags?limit=\${limit}\`);
  }

  async createTag(name: string, color?: string) {
    return this.request('/tags', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    });
  }

  // Formulários
  async getFormSubmissions(formId: string, params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params);
    return this.request(\`/forms/\${formId}/submissions?\${qs}\`);
  }

  // Iterar todas as páginas (cursor)
  async *paginateAll(endpoint: string, limit = 50) {
    let cursor: string | null = null;
    do {
      const params = new URLSearchParams({ limit: String(limit) });
      if (cursor) params.set('cursor', cursor);
      const res = await this.request(\`\${endpoint}?\${params}\`);
      yield* res.data;
      cursor = res.meta?.next_cursor || null;
    } while (cursor);
  }
}

// Uso:
const agsell = new AGSellClient('ag_sua_chave_aqui');

// Buscar overview
const overview = await agsell.getOverview('7d');
console.log(overview.data);

// Iterar todos os contatos
for await (const contact of agsell.paginateAll('/contacts', 100)) {
  console.log(contact.first_name, contact.email);
}`}
              />
            </TabsContent>

            <TabsContent value="fetch">
              <CodeBlock
                label="Fetch API"
                code={`const API_KEY = 'ag_sua_chave_aqui';
const BASE = '${BASE_URL}';

const headers = {
  'x-api-key': API_KEY,
  'Content-Type': 'application/json',
};

// Buscar métricas de e-mail dos últimos 7 dias
const res = await fetch(\`\${BASE}/metrics/email?period=7d\`, { headers });
const data = await res.json();
console.log('Aberturas:', data.data.totals.opens);
console.log('Click rate:', data.data.totals.click_rate + '%');

// Criar contato
const newContact = await fetch(\`\${BASE}/contacts\`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    first_name: 'Maria',
    email: 'maria@email.com',
    phone: '11999999999',
    source: 'api',
  }),
}).then(r => r.json());

// Criar tag
await fetch(\`\${BASE}/tags\`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ name: 'VIP', color: '#ff0000' }),
});

// Paginação por cursor
let cursor = null;
do {
  const params = new URLSearchParams({ limit: '50' });
  if (cursor) params.set('cursor', cursor);
  const page = await fetch(\`\${BASE}/contacts?\${params}\`, { headers }).then(r => r.json());
  page.data.forEach(c => console.log(c.first_name));
  cursor = page.meta.next_cursor;
} while (cursor);

// Submissão pública (sem API Key)
await fetch(\`\${BASE}/forms/UUID_DO_FORMULARIO/submit\`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nome: 'João', email: 'joao@email.com' }),
});`}
              />
            </TabsContent>

            <TabsContent value="python">
              <CodeBlock
                language="python"
                label="Python"
                code={`import requests

API_KEY = "ag_sua_chave_aqui"
BASE = "${BASE_URL}"
HEADERS = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
}

# Buscar overview
res = requests.get(f"{BASE}/metrics/overview?period=7d", headers=HEADERS)
print(res.json())

# Listar contatos com paginação por cursor
cursor = None
while True:
    params = {"limit": 50}
    if cursor:
        params["cursor"] = cursor
    res = requests.get(f"{BASE}/contacts", headers=HEADERS, params=params)
    data = res.json()
    for c in data["data"]:
        print(f"{c['first_name']} - {c.get('email', 'sem email')}")
    cursor = data["meta"].get("next_cursor")
    if not cursor:
        break

# Criar tag
requests.post(f"{BASE}/tags", headers=HEADERS, json={"name": "Lead Quente", "color": "#ff6600"})

# Submissão pública de formulário (sem API Key)
form_id = "uuid-do-formulario"
requests.post(
    f"{BASE}/forms/{form_id}/submit",
    json={"nome": "João Silva", "email": "joao@email.com"}
)

# Filtrar submissões com filtros múltiplos
res = requests.get(
    f"{BASE}/forms/{form_id}/submissions",
    headers=HEADERS,
    params={"filter.profissao": "medico", "filter.cidade": "SP", "fields": "nome,email"}
)
for s in res.json()["data"]:
    print(s["data"])`}
              />
            </TabsContent>

            <TabsContent value="php">
              <CodeBlock
                language="php"
                label="PHP"
                code={`<?php
$apiKey = "ag_sua_chave_aqui";
$base = "${BASE_URL}";

function agsellRequest($endpoint, $method = "GET", $body = null) {
    global $apiKey, $base;
    $ch = curl_init($base . $endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "x-api-key: $apiKey",
        "Content-Type: application/json",
    ]);
    if ($method === "POST") {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    } elseif (in_array($method, ["PUT", "PATCH", "DELETE"])) {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        if ($body) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ["code" => $httpCode, "body" => json_decode($response, true)];
}

// Overview
$overview = agsellRequest("/metrics/overview?period=30d");
print_r($overview["body"]);

// Criar contato
$newContact = agsellRequest("/contacts", "POST", [
    "first_name" => "João",
    "email" => "joao@email.com",
    "source" => "api",
]);
print_r($newContact["body"]);

// Criar tag
agsellRequest("/tags", "POST", ["name" => "VIP", "color" => "#ff0000"]);

// Atualizar contato (PATCH)
$contactId = $newContact["body"]["data"]["id"];
agsellRequest("/contacts/$contactId", "PATCH", ["status" => "qualified"]);

// Paginação por cursor
$cursor = null;
do {
    $params = "?limit=50";
    if ($cursor) $params .= "&cursor=" . urlencode($cursor);
    $page = agsellRequest("/contacts" . $params);
    foreach ($page["body"]["data"] as $contact) {
        echo $contact["first_name"] . "\\n";
    }
    $cursor = $page["body"]["meta"]["next_cursor"] ?? null;
} while ($cursor);

// Submissão pública (sem API Key)
$ch = curl_init("$base/forms/UUID/submit");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(["nome" => "Maria"]));
echo curl_exec($ch);
curl_close($ch);`}
              />
            </TabsContent>
          </Tabs>
        </section>

        {/* Webhooks */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Webhook className="h-6 w-6 text-primary" />
            Webhooks (Push em Tempo Real)
          </h2>
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardContent className="pt-6 space-y-4">
              <p className="text-zinc-700 dark:text-zinc-300">
                Configure um <strong>Webhook URL</strong> diretamente no formulário do AG Sell. A cada nova submissão, um <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">POST</code> é disparado automaticamente com os dados.
              </p>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Payload de exemplo:</p>
                <CodeBlock
                  label="Webhook Payload"
                  code={`{
  "event": "form_submission",
  "form_id": "uuid-do-formulario",
  "form_name": "Formulário de Contato",
  "submission_id": "uuid-da-submissao",
  "contact_id": "uuid-do-contato-ou-null",
  "data": {
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "11999999999",
    "mensagem": "Quero saber mais sobre o produto"
  },
  "submitted_at": "2026-03-18T14:30:00.000Z"
}`}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Headers padrão enviados:</p>
                <CodeBlock
                  label="Webhook Headers"
                  code={`Content-Type: application/json
User-Agent: AGSell-Webhook/1.0
// + headers customizados configurados no formulário`}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Receiver de exemplo (Node.js/Express):</p>
                <CodeBlock
                  label="Webhook Receiver"
                  code={`// POST /webhook/agsell
app.post('/webhook/agsell', (req, res) => {
  // 1. Validar autenticação (header customizado)
  const auth = req.headers['authorization'];
  if (auth !== \`Bearer \${process.env.AGSELL_WEBHOOK_SECRET}\`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Processar payload
  const { event, form_id, form_name, data, contact_id } = req.body;

  if (event === 'form_submission') {
    const nome  = data.nome || data.name;
    const email = data.email;
    const fone  = data.telefone || data.phone || data.whatsapp;

    // 3. Salvar, disparar ação, etc.
    console.log(\`[\${form_name}] Novo lead: \${nome} — \${email} — \${fone}\`);
  }

  res.status(200).json({ received: true });
});`}
                />
              </div>

              <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-4">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Como configurar:</p>
                <ol className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5 list-decimal pl-5">
                  <li>Acesse o formulário no AG Sell</li>
                  <li>Vá na aba <strong>Integrações → Webhook</strong></li>
                  <li>Informe a <strong>URL de callback</strong> da sua ferramenta</li>
                  <li>Adicione headers customizados (ex: <code className="font-mono text-xs">Authorization: Bearer TOKEN</code>)</li>
                  <li>Salve — a cada submissão, o POST é disparado automaticamente (fire-and-forget)</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Error Codes */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Code2 className="h-6 w-6 text-primary" />
            Códigos de Erro
          </h2>
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardContent className="pt-6 p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">HTTP</th>
                      <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Código</th>
                      <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Descrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { http: '401', code: 'MISSING_API_KEY', desc: 'Header x-api-key não enviado' },
                      { http: '401', code: 'INVALID_API_KEY', desc: 'Chave não reconhecida (prefixo ou hash incorreto)' },
                      { http: '403', code: 'KEY_DISABLED', desc: 'Chave desativada pelo admin' },
                      { http: '403', code: 'KEY_EXPIRED', desc: 'Chave expirada' },
                      { http: '403', code: 'FORBIDDEN', desc: 'Permissão insuficiente para esta operação' },
                      { http: '404', code: 'NOT_FOUND', desc: 'Recurso não encontrado' },
                      { http: '404', code: 'FORM_NOT_FOUND', desc: 'Formulário não encontrado (submissão pública)' },
                      { http: '400', code: 'FORM_INACTIVE', desc: 'Formulário inativo' },
                      { http: '429', code: 'RATE_LIMIT_MINUTE', desc: 'Limite por minuto excedido (inclui retry_after em segundos)' },
                      { http: '429', code: 'RATE_LIMIT_DAY', desc: 'Limite diário excedido' },
                      { http: '500', code: 'INTERNAL_ERROR', desc: 'Erro interno do servidor' },
                    ].map((err) => (
                      <tr key={err.code} className="border-b border-zinc-100 dark:border-zinc-800/50">
                        <td className="py-3 px-4">
                          <Badge className={`text-xs font-mono ${
                            err.http.startsWith('4') ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                            'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                          }`}>{err.http}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <code className="font-mono text-primary text-xs bg-primary/5 px-1.5 py-0.5 rounded">{err.code}</code>
                        </td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{err.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Rate Limiting & Security */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Segurança & Limites
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Key, title: 'API Key com Hash SHA-256', desc: 'Chaves nunca são armazenadas em texto plano. Prefixo de 8 caracteres para lookup rápido.' },
              { icon: ShieldCheck, title: 'Rate Limiting Granular', desc: 'Limite por minuto (padrão: 60) e por dia (padrão: 10.000). Contadores resetam automaticamente. Header retry_after no 429.' },
              { icon: Globe, title: 'Isolamento Multi-Tenant', desc: 'Cada chave é vinculada a uma organização. Dados de outras orgs são inacessíveis. Validação por organization_id em todas as queries.' },
              { icon: Search, title: 'Sanitização Whitelist', desc: 'Campos de entrada são sanitizados com whitelist por recurso. Campos desconhecidos são ignorados silenciosamente.' },
            ].map((item) => (
              <Card key={item.title} className="border-zinc-200 dark:border-zinc-800">
                <CardContent className="pt-6 flex items-start gap-3">
                  <item.icon className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{item.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Checklist */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Check className="h-6 w-6 text-primary" />
            Checklist de Implementação
          </h2>
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardContent className="pt-6">
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  'Tela de config com campo API Key e Base URL',
                  'Botão "Testar Conexão" (GET /metrics/overview)',
                  'Armazenar API Key criptografada',
                  'Implementar paginação por cursor',
                  'Endpoint webhook para receber submissões',
                  'Mapeamento de campos do formulário',
                  'Tratamento de erros por código (RATE_LIMIT_MINUTE, etc.)',
                  'Retry com backoff no 429 (usar retry_after)',
                  'Usar PATCH para atualizações parciais',
                  'Log de chamadas para debugging',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded border-2 border-zinc-300 dark:border-zinc-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Architecture Diagram */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Arquitetura Recomendada
          </h2>
          <CodeBlock
            label="Diagrama"
            code={`┌─────────────────────────────────────────┐
│          SUA FERRAMENTA / PLUGIN        │
│                                         │
│  ┌────────────────────────────────────┐  │
│  │  Tela de Configuração             │  │
│  │  • Campo: API Key                 │  │
│  │  • Campo: Base URL (opcional)     │  │
│  │  • Botão: Testar Conexão          │  │
│  └──────────┬─────────────────────────┘  │
│             │                           │
│  ┌──────────▼─────────────────────────┐  │
│  │  AG Sell API Client (SDK)          │  │
│  │  • GET  /metrics/*                 │  │
│  │  • CRUD /contacts, /companies      │  │
│  │  • CRUD /deals, /tags              │  │
│  │  • GET  /forms/*/submissions       │  │
│  │  • Paginação por cursor            │  │
│  └──────────┬─────────────────────────┘  │
│             │                           │
│  ┌──────────▼─────────────────────────┐  │
│  │  Webhook Receiver (POST)           │  │
│  │  • Endpoint: /webhook/agsell       │  │
│  │  • Valida headers customizados     │  │
│  │  • Processa form_submission        │  │
│  └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
          │                    ▲
          │  API Requests      │  Webhook POST
          │  (x-api-key)       │  (fire-and-forget)
          ▼                    │
┌─────────────────────────────────────────┐
│              AG SELL                    │
│  REST API + Webhook Dispatcher          │
│  • SHA-256 Auth   • Rate Limiting       │
│  • Cursor Paging  • Input Sanitization  │
│  • Multi-tenant   • Auto Automations    │
└─────────────────────────────────────────┘`}
          />
        </section>

        {/* CTA */}
        <div className="text-center space-y-4 py-8">
          <p className="text-zinc-500 dark:text-zinc-400">Pronto para integrar?</p>
          <div className="flex justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Criar Conta Grátis <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="gap-2">
                Já tenho conta <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-sm text-zinc-500">
        <p>© {new Date().getFullYear()} AG Sell — Documentação da API v1.1</p>
      </footer>
    </div>
  );
}
