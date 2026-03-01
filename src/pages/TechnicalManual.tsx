import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const MANUAL_CONTENT = `# MANUAL TÉCNICO COMPLETO — AG SELL
## Plataforma CRM + Automação Omnichannel + IA

**Versão:** 1.0  
**Data:** Março 2026  
**Classificação:** Documentação Interna — Uso Técnico e Estratégico

---

## SUMÁRIO

1. Visão Geral do Sistema
2. Arquitetura Técnica
3. Estrutura de Navegação e Rotas
4. Módulos Funcionais (Detalhado)
5. Sistema de Autenticação
6. Sistema de Acesso e Monetização
7. Planos e Assinaturas
8. Integração Stripe
9. Sistema de IA
10. Telemetria e Logs
11. Painel Administrativo
12. Banco de Dados
13. Segurança
14. PWA e Recursos Avançados
15. Considerações Finais

---

# 1. VISÃO GERAL DO SISTEMA

## 1.1 Propósito Estratégico

O AG Sell é uma plataforma SaaS de CRM, automação de marketing e atendimento omnichannel projetada para substituir múltiplas ferramentas (ManyChat, ActiveCampaign, RD Station, HubSpot) com uma solução unificada. A plataforma integra WhatsApp nativo, Instagram DM, e-mail marketing, agentes de IA com RAG, pipeline de vendas e gamificação de equipes em um único produto.

## 1.2 Público-Alvo

| Perfil | Descrição |
|--------|-----------|
| **Usuário Final** | Vendedores, SDRs, atendentes que usam CRM, inbox e automações |
| **Gestor/Admin Org** | Gerentes que configuram pipelines, permissões, agentes IA e planos |
| **Administrador Global** | Super admin com acesso a painel de gestão de todas as organizações |
| **Agência** | Operador multi-tenant que gerencia múltiplas organizações-cliente |

## 1.3 Modelo de Negócio

- Modelo SaaS estritamente pago (sem plano gratuito ativo para público)
- 4 níveis: Starter (R$197), Professional (R$397), Enterprise (R$797), Agência (R$997)
- Cobrança via Stripe com ciclos mensal e anual (desconto 17% anual)
- WhatsApp ilimitado em todos os planos

## 1.4 Limites do Sistema

O sistema é uma plataforma de gestão e automação. Não efetua operações financeiras diretas, não substitui ERPs nem sistemas contábeis.

---

# 2. ARQUITETURA TÉCNICA

## 2.1 Stack Completa

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **UI Framework** | Tailwind CSS + shadcn/ui (Radix primitives) |
| **State/Data** | TanStack React Query v5 |
| **Roteamento** | React Router DOM v6 |
| **Backend** | Supabase (Lovable Cloud) |
| **Banco de Dados** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth (email/senha) |
| **Edge Functions** | Deno (Supabase Edge Functions) |
| **IA** | Lovable AI Gateway (Gemini, GPT-5) |
| **Pagamentos** | Stripe (checkout, webhooks, assinaturas) |
| **E-mail** | Resend / SendGrid / Amazon SES (configurável pelo admin) |
| **Gráficos** | Recharts |
| **Notificações** | Sonner (toasts) |
| **Realtime** | Supabase Realtime (messages, notifications, conversations) |

## 2.2 Fluxo Geral da Aplicação

\`\`\`
Landing Page (/) → Pricing (/pricing) → Register/Login
     ↓
  Dashboard (/dashboard) [ProtectedRoute + DashboardLayout]
     ↓
  Módulos CRM / Comunicação / Marketing / Inteligência
     ↓
  Feature Gating (verificação de plano por rota)
     ↓
  Subscription Expired → Redirect /subscription-expired
\`\`\`

## 2.3 Organização do Código

\`\`\`
src/
├── App.tsx                  # Roteamento principal
├── main.tsx                 # Entry point
├── index.css                # Design tokens CSS
├── pages/                   # 40+ páginas
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── layout/              # AppSidebar, AppHeader, DashboardLayout
│   ├── auth/                # ProtectedRoute
│   ├── permissions/         # FeatureGate, PermissionGate, FeatureRequiredPage
│   ├── admin/               # Painéis do admin global
│   ├── automations/         # Editor de ações, templates
│   ├── inbox/               # SAC, CSAT, transcrição
│   ├── whatsapp/            # QR, grupos, campanhas
│   ├── email/               # Template editor
│   ├── contacts/            # Import, timeline
│   ├── ai-agents/           # Templates, dashboard
│   ├── agency/              # Multi-tenant
│   └── ...
├── contexts/                # Auth, Organization, Permissions, Theme, AdminView
├── hooks/                   # 40+ custom hooks (useContacts, usePipeline, etc.)
├── integrations/supabase/   # client.ts (auto-generated), types.ts (auto-generated)
├── data/                    # helpCenterData.ts
└── assets/                  # Logos
supabase/
├── config.toml              # Configuração do projeto
├── functions/               # 25+ Edge Functions
└── migrations/              # Migrações SQL
\`\`\`

---

# 3. ESTRUTURA DE NAVEGAÇÃO E ROTAS

## 3.1 Rotas Públicas

| URL | Módulo | Objetivo | Acesso |
|-----|--------|----------|--------|
| \`/\` | Landing Page | Página de vendas com diferenciais, planos e depoimentos | Público |
| \`/login\` | Login | Autenticação por email/senha | Público |
| \`/register\` | Registro | Criação de conta + organização | Público |
| \`/pricing\` | Preços | Listagem de planos com checkout | Público |
| \`/privacy-policy\` | Privacidade | Política de privacidade | Público |
| \`/terms-of-service\` | Termos | Termos de serviço | Público |
| \`/purchase-success\` | Sucesso | Confirmação pós-checkout | Público |
| \`/forms/:formId\` | Formulário | Formulário público de captura | Público |
| \`/agency-invite/:token\` | Convite Agência | Aceite de convite de agência | Público |

## 3.2 Rotas Protegidas (ProtectedRoute + DashboardLayout)

| URL | Módulo | Feature Required | Acesso |
|-----|--------|------------------|--------|
| \`/dashboard\` | Dashboard | — | Autenticado |
| \`/contacts\` | Contatos | — | Autenticado |
| \`/companies\` | Empresas | — | Autenticado |
| \`/pipeline\` | Pipeline | — | Autenticado |
| \`/tags\` | Tags | — | Autenticado |
| \`/tasks\` | Tarefas | — | Autenticado |
| \`/inbox\` | SAC (Inbox) | — | Autenticado |
| \`/inbox-settings\` | Config. SAC | — | Org Admin |
| \`/email\` | E-mail Marketing | \`email_marketing\` | Feature Gate |
| \`/whatsapp\` | WhatsApp | \`whatsapp\` | Feature Gate |
| \`/instagram\` | Instagram | \`instagram\` | Feature Gate |
| \`/whatsapp-flows\` | WhatsApp Flows | \`whatsapp\` | Feature Gate |
| \`/automations\` | Automações | \`automacoes\` | Feature Gate |
| \`/flow-builder\` | Flow Builder | \`automacoes\` | Feature Gate |
| \`/lead-scoring\` | Lead Scoring | \`lead_scoring\` | Feature Gate |
| \`/sequences\` | Sequências (Drip) | — | Autenticado |
| \`/ab-tests\` | Testes A/B | — | Autenticado |
| \`/growth-tools\` | Growth Tools | — | Autenticado |
| \`/forms\` | Formulários | — | Autenticado |
| \`/analytics\` | Analytics | \`analytics\` | Feature Gate |
| \`/ai-assistant\` | Assistente IA | — | Autenticado |
| \`/ai-agents\` | Agentes IA | — | Autenticado |
| \`/gamification\` | Gamificação | — | Autenticado |
| \`/integrations\` | Integrações | \`integrações\` | Feature Gate |
| \`/channels\` | Canais | — | Autenticado |
| \`/organization\` | Organização | — | Org Admin |
| \`/plans\` | Planos | — | Autenticado |
| \`/permissions\` | Permissões | — | Org Admin |
| \`/settings\` | Configurações | — | Autenticado |
| \`/api-keys\` | API Keys | \`api\` | Org Admin + Feature Gate |
| \`/webhooks\` | Webhooks | \`api\` | Feature Gate |
| \`/email-domain\` | Domínio E-mail | \`email_marketing\` | Feature Gate |
| \`/agency-clients\` | Clientes (Agência) | \`agency_management\` | Feature Gate |
| \`/help-center\` | Central de Ajuda | — | Autenticado |
| \`/system-guide\` | Guia do Sistema | — | Autenticado |
| \`/admin\` | Painel Admin | — | \`isAdmin\` (role global) |

## 3.3 Rotas com Assinatura Expirada

| URL | Módulo |
|-----|--------|
| \`/subscription-expired\` | Tela de renovação |
| \`/renew-plans\` | Acesso a planos mesmo com assinatura expirada |

---

# 4. MÓDULOS FUNCIONAIS (DETALHADO)

## 4.1 CRM — Contatos

### Objetivo
Gerenciar leads e clientes com histórico completo de interações.

### Campos de Entrada

| Nome Técnico | Label | Tipo | Obrigatório | Validações | Default |
|-------------|-------|------|-------------|------------|---------|
| \`first_name\` | Nome | text | Sim | — | — |
| \`last_name\` | Sobrenome | text | Não | — | null |
| \`email\` | E-mail | text | Não | Formato e-mail | null |
| \`phone\` | Telefone | text | Não | — | null |
| \`whatsapp\` | WhatsApp | text | Não | — | null |
| \`position\` | Cargo | text | Não | — | null |
| \`company_id\` | Empresa | uuid (FK) | Não | — | null |
| \`source\` | Origem | text | Não | — | null |
| \`status\` | Status | text | Não | — | \`'active'\` |
| \`lead_score\` | Score | integer | Não | 0-100 | 0 |
| \`notes\` | Notas | text | Não | — | null |

### Funcionalidades
- CRUD completo
- Importação CSV (ImportContactsDialog)
- Timeline de atividades (ActivityTimeline)
- Tags (contact_tags — relação N:N)
- Lead Scoring automático e manual
- Filtros avançados e busca

### RLS
- Isolamento por \`organization_id\`
- \`is_org_member()\` para SELECT, UPDATE, DELETE
- INSERT requer \`user_id = auth.uid()\`

## 4.2 CRM — Empresas

### Campos de Entrada

| Nome Técnico | Label | Tipo | Obrigatório | Default |
|-------------|-------|------|-------------|---------|
| \`name\` | Nome | text | Sim | — |
| \`domain\` | Domínio | text | Não | null |
| \`industry\` | Setor | text | Não | null |
| \`size\` | Porte | text | Não | null |
| \`phone\` | Telefone | text | Não | null |
| \`email\` | E-mail | text | Não | null |
| \`address\` | Endereço | text | Não | null |
| \`city\` | Cidade | text | Não | null |
| \`state\` | Estado | text | Não | null |
| \`country\` | País | text | Não | null |

## 4.3 Pipeline de Vendas

### Objetivo
Visualização Kanban de deals com drag-and-drop entre estágios.

### Campos do Deal

| Nome Técnico | Label | Tipo | Obrigatório | Default |
|-------------|-------|------|-------------|---------|
| \`title\` | Título | text | Sim | — |
| \`contact_id\` | Contato | uuid | Não | null |
| \`company_id\` | Empresa | uuid | Não | null |
| \`stage_id\` | Estágio | uuid | Não | null |
| \`value\` | Valor | numeric | Não | 0 |
| \`currency\` | Moeda | text | Não | \`'BRL'\` |
| \`probability\` | Probabilidade | integer | Não | 50 |
| \`expected_close_date\` | Previsão Fechamento | date | Não | null |
| \`status\` | Status | text | Não | \`'open'\` |

### Regras de Negócio
- Estágios configuráveis por organização (tabela \`pipeline_stages\`)
- Probabilidade associada ao estágio
- Valor total do pipeline = soma dos valores × probabilidade

## 4.4 Tarefas

### Campos

| Nome Técnico | Label | Tipo | Default |
|-------------|-------|------|---------|
| \`title\` | Título | text | — |
| \`description\` | Descrição | text | null |
| \`priority\` | Prioridade | text | \`'medium'\` |
| \`status\` | Status | text | \`'pending'\` |
| \`due_date\` | Prazo | timestamp | null |
| \`contact_id\` | Contato | uuid | null |
| \`deal_id\` | Deal | uuid | null |

### Funcionalidades
- Calendário de tarefas (TaskCalendar)
- Filtros por status, prioridade, prazo
- Vinculação a contatos e deals

## 4.5 SAC / Inbox Omnichannel

### Objetivo
Centralizar conversas de WhatsApp, E-mail e Instagram DM em uma única interface.

### Funcionalidades
- Atribuição de agentes (SacAgentsManager)
- Regras de assignment automático (round-robin, load-balancing)
- CSAT integrado (CsatConfig)
- Transcrição de áudio (AudioTranscription via Edge Function \`transcribe-audio\`)
- IA para respostas sugeridas (SendIAButton)
- Realtime habilitado para \`messages\`, \`conversations\`, \`notifications\`

### Tabelas Envolvidas
- \`conversations\` (canal, status, assigned_to, metadata)
- \`messages\` (conteúdo, tipo, timestamps)
- \`assignment_rules\` (estratégia, membros elegíveis, max concorrência)
- \`assignment_state\` (round-robin index)

## 4.6 WhatsApp

### Funcionalidades
- Conexão via QR Code (WhatsAppQRConnect) — Evolution API
- Seletor de instâncias múltiplas (WhatsAppInstanceSelector)
- Campanhas em massa (WhatsAppCampaignsManager)
- Grupos (WhatsAppGroupsManager, WhatsAppGroupMessages)
- WhatsApp Flows interativos (telas, coleta de dados, gatilhos por keyword)

### Edge Functions
- \`send-whatsapp\` — envio de mensagens
- \`whatsapp-webhook\` — recepção de webhooks
- \`process-whatsapp-campaign\` — processamento assíncrono de campanhas

## 4.7 Instagram

### Funcionalidades
- Conexão OAuth (instagram-oauth)
- Automações por comentário, DM recebida
- Broadcasts de DM em massa
- Logs de automação

### Edge Functions
- \`instagram-oauth\` — fluxo OAuth
- \`instagram-webhook\` — recepção de eventos
- \`instagram-lookup\` — busca de perfil
- \`send-instagram-dm\` — envio de DM

## 4.8 E-mail Marketing

### Funcionalidades
- Editor de templates (EmailTemplateEditor)
- Campanhas com métricas (open, click, sent)
- Domínio customizado com verificação SPF/DKIM/DMARC (DomainSetupWizard)
- Provedor configurável (Resend, SendGrid, Amazon SES)

### Edge Functions
- \`send-email\` — envio multi-provedor
- \`verify-email-domain\` — verificação DNS
- \`verify-email-domains-cron\` — verificação periódica
- \`email-inbound\` — recepção de e-mails

## 4.9 Automações

### Objetivo
Executar ações automaticamente quando um gatilho é acionado.

### Gatilhos Disponíveis
- \`form_submitted\` — Formulário submetido
- \`tag_added\` — Tag adicionada
- \`deal_stage_changed\` — Deal mudou de estágio
- \`contact_created\` — Contato criado
- \`score_threshold\` — Score atingiu limite
- \`email_opened\` / \`email_clicked\` — Interação com e-mail
- \`whatsapp_received\` — WhatsApp recebido
- \`instagram_dm\` / \`instagram_comment\` — Interação no Instagram

### Tipos de Ação
- \`send_email\` — Enviar e-mail
- \`send_whatsapp\` — Enviar WhatsApp
- \`send_instagram_dm\` — Enviar DM Instagram
- \`send_sms\` — Enviar SMS
- \`add_tag\` / \`remove_tag\` — Gerenciar tags
- \`update_score\` — Alterar lead score
- \`update_status\` — Alterar status do contato
- \`create_task\` — Criar tarefa
- \`send_notification\` — Enviar notificação interna
- \`wait\` — Aguardar (delay)
- \`http_request\` — Chamada HTTP externa
- \`send_poll\` — Enquete com mapeamento de respostas (add_tag, goto_flow, subscribe_sequence)
- \`condition\` — Lógica condicional (If/Else) com avaliação de campo, tag, score ou resposta de poll
- \`assign_agent\` — Atribuir agente de atendimento
- \`split_test\` — Teste A/B inline

### Edge Function
- \`process-automation\` — Executa sequencialmente cada ação, registra progresso em \`automation_executions\`

## 4.10 Flow Builder Visual

### Objetivo
Construtor visual drag-and-drop estilo ManyChat para criação de funis multi-canal.

### Funcionalidades
- Múltiplos fluxos independentes por organização
- Filtro por \`trigger_config.flow_builder = true\`
- Nós visuais: Trigger, Ação, Condição, Delay
- Suporte a gatilhos de Instagram (comentário, DM), WhatsApp (keyword), e CRM (contato criado, tag adicionada)
- Persistência do canvas como JSON no campo \`actions\`

## 4.11 Sequências (Drip Campaigns)

### Objetivo
Envio automatizado de mensagens em intervalos programados.

### Tabelas
- \`sequences\` — configuração da sequência
- \`sequence_steps\` — passos com delay, tipo de ação, conteúdo JSON
- \`sequence_enrollments\` — inscrição de contatos com progresso

### Edge Function
- \`process-sequence\` — processa próximo passo de cada enrollment ativo

## 4.12 Lead Scoring

### Regras (\`lead_scoring_rules\`)
- Evento + pontos atribuídos
- Tipos: \`email_opened\`, \`link_clicked\`, \`form_submitted\`, \`deal_won\`, etc.
- Score max: 100, min: 0

## 4.13 Formulários

### Campos (\`forms\`)
- \`fields\` — JSON array de campos configuráveis (FormFieldEditor)
- \`settings\` — configurações (redirect URL, mensagem de sucesso)
- URL pública: \`/forms/:formId\`
- Submissões armazenadas em \`form_submissions\`

## 4.14 Testes A/B

### Campos (\`ab_tests\`)
- \`variant_a\` / \`variant_b\` — JSON com conteúdo de cada variante
- \`sent_a\` / \`sent_b\` — contadores de envio
- \`responses_a\` / \`responses_b\` — respostas
- \`conversion_a\` / \`conversion_b\` — conversões
- \`winner\` — variante vencedora (a/b/null)
- Canal: WhatsApp, E-mail, Instagram

## 4.15 Growth Tools

### Campos (\`growth_tools\`)
- \`tool_type\` — tipo de ferramenta (link, QR code, widget)
- \`channel\` — canal de captura
- \`phone_number\` — número WhatsApp
- \`prefilled_message\` — mensagem pré-preenchida
- \`config\` — JSON com configurações visuais
- Métricas: \`clicks_count\`, \`conversions_count\`

## 4.16 Analytics

### Objetivo
Dashboard com métricas em tempo real: contatos, deals, funil, engajamento.

### Hook: \`useAnalytics\`
- Agregações de contatos por fonte, status
- Evolução temporal de deals
- Métricas de campanhas (email, WhatsApp)

## 4.17 Agentes IA

### Campos (\`ai_agents\`)
- \`name\`, \`description\`, \`system_prompt\`
- \`model\` — modelo IA (default: \`google/gemini-3-flash-preview\`)
- \`temperature\` — criatividade (0-1)
- \`max_tokens\` — limite de tokens
- \`channels\` — canais de atuação (array)
- \`welcome_message\`, \`fallback_message\`
- \`knowledge_base\` — referência a base de conhecimento

### Base de Conhecimento (\`ai_agent_knowledge\`)
- \`title\`, \`content\`, \`content_type\`
- Injetado no system prompt como contexto RAG

### Conversas (\`ai_agent_conversations\`)
- \`messages\` — JSON array de mensagens
- \`satisfaction_rating\` — NPS/CSAT
- \`transferred_to_human\` — flag de escalação

## 4.18 Gamificação

### Tabelas
- \`user_gamification\` — pontos totais, nível, contadores por ação
- \`user_achievements\` — conquistas desbloqueadas

### Função RPC
- \`award_points(_user_id, _org_id, _action, _points)\`
- Ações pontuáveis: \`contact_created\`, \`deal_won\`, \`task_completed\`, \`email_sent\`, \`automation_created\`
- Nível = \`FLOOR(total_points / 100) + 1\`

---

# 5. SISTEMA DE AUTENTICAÇÃO

## 5.1 Métodos de Login
- E-mail + Senha (Supabase Auth)
- Confirmação de e-mail obrigatória (auto-confirm DESABILITADO)

## 5.2 Fluxo Completo

\`\`\`
Register (/register)
  → signUp(email, password, name)
  → Supabase cria user + envia e-mail de confirmação
  → Trigger handle_new_user() cria profile
  → Redirect para /login

Login (/login)
  → signInWithPassword(email, password)
  → onAuthStateChange atualiza contexto
  → checkAdminRole via RPC has_role
  → Redirect para /dashboard

Logout
  → signOut()
  → Redirect para /
\`\`\`

## 5.3 Recuperação de Senha
- Suporte nativo do Supabase Auth (\`resetPasswordForEmail\`)

## 5.4 Sessão e Persistência
- Token JWT armazenado via Supabase SDK (localStorage)
- Refresh token automático
- \`getSession()\` no carregamento inicial

## 5.5 Admin Check
- \`has_role(user_id, 'admin')\` via RPC
- Tabela \`user_roles\` (user_id, role)
- Fallback: query direta na tabela se RPC falhar
- Ref counter (\`adminCheckRef\`) para evitar race conditions

---

# 6. SISTEMA DE ACESSO E MONETIZAÇÃO

## 6.1 Hierarquia de Acesso

| Nível | Origem | Escopo |
|-------|--------|--------|
| **Super Admin** | Tabela \`user_roles\` com role \`'admin'\` | Acesso global a todas as organizações |
| **Org Owner** | \`organization_members.role = 'owner'\` | Todas as permissões na organização |
| **Org Admin** | \`organization_members.role = 'admin'\` | Todas exceto módulo \`admin\` |
| **Member** | \`organization_members.role = 'member'\` | view, create, edit |
| **Viewer** | \`organization_members.role = 'viewer'\` | Somente view |

## 6.2 Feature Gating

O componente \`FeatureRequiredPage\` envolve rotas protegidas e verifica se o plano da organização inclui a feature necessária:

\`\`\`tsx
<FeatureRequiredPage feature="whatsapp" featureLabel="WhatsApp Business">
  <WhatsApp />
</FeatureRequiredPage>
\`\`\`

Features possíveis: \`crm_basico\`, \`pipeline\`, \`tarefas\`, \`automacoes\`, \`email_marketing\`, \`analytics\`, \`lead_scoring\`, \`whatsapp\`, \`instagram\`, \`integrações\`, \`api\`, \`white_label\`, \`suporte_prioritario\`, \`agency_management\`

## 6.3 Sidebar Feature Lock

Itens do menu com \`featureRequired\` são exibidos com ícone de cadeado e redirecionam para \`/plans\` se o plano não inclui a feature.

## 6.4 Plan Limit Checking

Função RPC \`check_plan_limit(_org_id, _resource, _current_count)\`:
- Recursos: \`users\`, \`contacts\`, \`emails\`, \`whatsapp\`, \`automations\`, \`forms\`, \`ai_requests\`
- \`-1\` = ilimitado
- Retorna: \`{ allowed, limit, current, remaining }\`

## 6.5 Subscription Status

Hook \`useSubscriptionStatus\`:
- \`active\` — acesso total
- \`trialing\` — período de teste
- \`expired\` — redirect para \`/subscription-expired\`
- \`no_subscription\` — sem plano pago (tier free)
- Re-check a cada 5 minutos

---

# 7. PLANOS E ASSINATURAS

## 7.1 Tabela \`plans\`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| \`name\` | text | Nome do plano |
| \`slug\` | text | Identificador único |
| \`price_monthly\` | numeric | Preço mensal em BRL |
| \`price_yearly\` | numeric | Preço anual em BRL |
| \`max_users\` | integer | Limite de usuários (-1 = ilimitado) |
| \`max_contacts\` | integer | Limite de contatos |
| \`max_emails_per_month\` | integer | Limite de e-mails/mês |
| \`max_whatsapp_messages\` | integer | Limite de mensagens WhatsApp |
| \`max_automations\` | integer | Limite de automações |
| \`max_forms\` | integer | Limite de formulários |
| \`max_instagram_accounts\` | integer | Limite de contas Instagram |
| \`max_ai_requests_per_month\` | integer | Limite de requisições IA |
| \`features\` | jsonb (string[]) | Array de features habilitadas |
| \`is_active\` | boolean | Plano ativo para venda |
| \`is_default\` | boolean | Plano padrão (free) |

## 7.2 Tabela \`subscriptions\`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| \`organization_id\` | uuid | Organização assinante |
| \`plan_id\` | uuid | Plano contratado |
| \`status\` | text | active, canceled, past_due, trialing, paused |
| \`billing_cycle\` | text | monthly, yearly |
| \`stripe_subscription_id\` | text | ID da assinatura no Stripe |
| \`stripe_customer_id\` | text | ID do cliente no Stripe |
| \`current_period_start\` | timestamp | Início do período |
| \`current_period_end\` | timestamp | Fim do período |
| \`cancel_at_period_end\` | boolean | Cancelar ao fim do período |

## 7.3 Ciclo de Vida

\`\`\`
Checkout → Stripe Session → Webhook checkout.session.completed
  → Cria/atualiza subscription + organization.plan_id
  → customer.subscription.updated → Sincroniza datas e status
  → invoice.payment_failed → Status → past_due
  → customer.subscription.deleted → Status → canceled
\`\`\`

---

# 8. INTEGRAÇÃO STRIPE

## 8.1 Edge Functions

| Função | Objetivo |
|--------|----------|
| \`create-checkout\` | Cria Stripe Checkout Session para assinatura |
| \`guest-checkout\` | Checkout para usuários não cadastrados (cria conta automaticamente) |
| \`stripe-webhook\` | Processa eventos do Stripe |

## 8.2 Eventos Processados

| Evento | Ação |
|--------|------|
| \`checkout.session.completed\` | Cria user + org + subscription (guest) ou confirma checkout |
| \`customer.subscription.updated\` | Atualiza período e status |
| \`customer.subscription.deleted\` | Marca como canceled |
| \`invoice.payment_succeeded\` | Log |
| \`invoice.payment_failed\` | Marca como past_due |

## 8.3 Segurança
- Verificação de assinatura webhook via \`stripe.webhooks.constructEvent\`
- Rejeição se \`STRIPE_WEBHOOK_SECRET\` não configurado
- Secrets: \`STRIPE_SECRET_KEY\`, \`STRIPE_WEBHOOK_SECRET\`

## 8.4 Guest Checkout
- Novo usuário: Stripe → Webhook → \`handleNewUserSignup\`
  - Cria user via \`auth.admin.createUser\`
  - Cria organização via RPC \`create_organization_with_owner\`
  - Envia e-mail de boas-vindas com credenciais temporárias (Resend)

---

# 9. SISTEMA DE IA

## 9.1 Arquitetura

- Gateway: \`https://ai.gateway.lovable.dev/v1/chat/completions\`
- Autenticação: \`LOVABLE_API_KEY\` (secret)
- Não requer API key do usuário

## 9.2 Assistente IA Padrão

| Aspecto | Detalhe |
|---------|---------|
| **Edge Function** | \`ai-chat\` |
| **Modelo default** | \`google/gemini-3-flash-preview\` |
| **System prompt** | Assistente de CRM/vendas/automação em pt-BR |
| **Contexto injetado** | Contadores de contatos, deals, tarefas do usuário |
| **Limites** | \`max_ai_requests_per_month\` do plano (100, 500, 2000, 5000) |

## 9.3 Agentes IA Customizados

| Aspecto | Detalhe |
|---------|---------|
| **Seleção** | \`agent_id\` no request |
| **Configuração** | model, temperature, max_tokens do agente |
| **RAG** | Knowledge base injetada no system prompt |
| **Validação** | Verifica \`is_org_member\` antes de processar |
| **Rate Limiting** | 429 (quota excedida), 402 (créditos insuficientes) |

## 9.4 Modelos Suportados
- \`google/gemini-2.5-flash\`, \`google/gemini-2.5-pro\`, \`google/gemini-3-flash-preview\`, \`google/gemini-3-pro-preview\`
- \`openai/gpt-5\`, \`openai/gpt-5-mini\`, \`openai/gpt-5-nano\`, \`openai/gpt-5.2\`

---

# 10. TELEMETRIA E LOGS

## 10.1 Tabelas de Tracking

| Tabela | Finalidade |
|--------|-----------|
| \`activities\` | Timeline de ações do usuário (criação, edição, ligações, notas) |
| \`automation_executions\` | Execuções de automações com steps e resultados |
| \`instagram_automation_logs\` | Logs de automações do Instagram |
| \`notifications\` | Notificações internas (Realtime) |

## 10.2 Campos de \`activities\`
- \`activity_type\` — tipo (call, note, email, meeting, etc.)
- \`title\`, \`description\`
- \`contact_id\`, \`deal_id\`, \`company_id\` — vinculações
- \`metadata\` — JSON com dados adicionais

## 10.3 Execuções de Automação
- Status tracking: pending → running → completed / completed_with_errors
- \`results\` — JSON array com resultado de cada step
- \`current_step\` / \`total_steps\` — progresso

---

# 11. PAINEL ADMINISTRATIVO

## Acesso
- Rota: \`/admin\`
- Requer: \`isAdmin === true\` (role \`'admin'\` na tabela \`user_roles\`)
- Redirect para \`/dashboard\` se não admin

## 11.1 Aba: Visão Geral

| Métrica | Fonte |
|---------|-------|
| MRR | Soma de \`price_monthly\` dos planos com \`subscription.status = 'active'\` |
| Organizações | Contagem de \`organizations\` |
| Usuários Totais | Contagem de \`profiles\` |
| Contatos Totais | Contagem de \`contacts\` (cross-org) |
| Gráfico MRR | Série temporal baseada em \`created_at\` das subscriptions |
| Distribuição por Plano | PieChart agrupando subscriptions por plano |

### Tabela de Organizações
- Nome, slug, plano, status, membros, data criação
- Ação: Atribuir plano (AssignPlanDialog)

### Riscos
- Queries cross-org via RLS permissiva para admin (\`has_role\`)
- Alteração de plano impacta features imediatamente

## 11.2 Aba: Usuários (UsersManagement)
- Listagem de todos os usuários da plataforma
- Gestão de roles globais

## 11.3 Aba: Planos (PlansManagement)
- CRUD de planos de assinatura
- Campos: nome, preço, limites, features
- Impacto: alterações afetam organizações vinculadas imediatamente

## 11.4 Aba: Financeiro (FinancialDashboard)
- Métricas de receita, churn, LTV
- Projeções baseadas em dados reais

## 11.5 Aba: Custos E-mail (EmailCostProjection)
- Projeção de custos por provedor (Resend, SES, SendGrid)
- Baseado em volume de envio

## 11.6 Aba: Provedor E-mail (EmailProviderConfig)
- Configuração global do provedor de e-mail
- Credenciais armazenadas em \`organization_integrations\`
- Impacto: todos os envios da plataforma usam este provedor

---

# 12. BANCO DE DADOS

## 12.1 Tabelas Principais

| Tabela | Descrição | Isolamento |
|--------|-----------|-----------|
| \`profiles\` | Perfis de usuário (full_name, avatar_url, phone) | user_id |
| \`user_roles\` | Roles globais (admin, moderator, user) | user_id |
| \`organizations\` | Organizações (nome, slug, logo, plan_id, settings) | id |
| \`organization_members\` | Membros (user_id, role, permission_profile_id) | organization_id |
| \`contacts\` | Contatos CRM | organization_id |
| \`companies\` | Empresas | organization_id |
| \`deals\` | Negociações/oportunidades | organization_id |
| \`pipeline_stages\` | Estágios do pipeline | organization_id |
| \`tags\` | Tags de categorização | organization_id |
| \`contact_tags\` | Relação N:N contato-tag | via contact/tag |
| \`activities\` | Timeline de atividades | organization_id |
| \`tasks\` | Tarefas | organization_id |
| \`conversations\` | Conversas do inbox | organization_id |
| \`messages\` | Mensagens das conversas | via conversation |
| \`notifications\` | Notificações internas | user_id |
| \`automations\` | Configuração de automações | organization_id + user_id |
| \`automation_executions\` | Execuções de automações | via automation |
| \`sequences\` | Sequências drip | organization_id |
| \`sequence_steps\` | Passos das sequências | via sequence |
| \`sequence_enrollments\` | Inscrições em sequências | via sequence |
| \`forms\` | Formulários de captura | organization_id |
| \`form_submissions\` | Submissões de formulários | via form |
| \`email_campaigns\` | Campanhas de e-mail | organization_id |
| \`email_domains\` | Domínios verificados | organization_id |
| \`plans\` | Planos de assinatura | — (global) |
| \`subscriptions\` | Assinaturas ativas | organization_id |
| \`ai_agents\` | Agentes IA configurados | organization_id |
| \`ai_agent_knowledge\` | Base de conhecimento RAG | via agent |
| \`ai_agent_conversations\` | Histórico de conversas IA | via agent |
| \`whatsapp_instances\` | Instâncias WhatsApp conectadas | organization_id |
| \`whatsapp_groups\` | Grupos WhatsApp | organization_id |
| \`whatsapp_flows\` | Flows interativos WhatsApp | organization_id |
| \`whatsapp_flow_submissions\` | Submissões de flows | via flow |
| \`instagram_accounts\` | Contas Instagram conectadas | organization_id |
| \`instagram_automations\` | Automações Instagram | organization_id |
| \`instagram_automation_logs\` | Logs de automação IG | via automation |
| \`instagram_dm_broadcasts\` | Broadcasts de DM | organization_id |
| \`instagram_dm_broadcast_recipients\` | Destinatários de broadcast | via broadcast |
| \`ab_tests\` | Testes A/B | organization_id |
| \`growth_tools\` | Ferramentas de captura | organization_id |
| \`lead_scoring_rules\` | Regras de scoring | organization_id |
| \`api_keys\` | Chaves de API pública | organization_id |
| \`inbound_webhooks\` | Webhooks de entrada | organization_id |
| \`agency_clients\` | Clientes de agência | agency_org_id, client_org_id |
| \`permission_profiles\` | Perfis de permissão | organization_id |
| \`sac_agents\` | Agentes de SAC | organization_id |
| \`assignment_rules\` | Regras de atribuição | organization_id |
| \`assignment_state\` | Estado round-robin | via rule |
| \`csat_surveys\` | Pesquisas CSAT | organization_id |
| \`csat_responses\` | Respostas CSAT | organization_id |
| \`user_gamification\` | Pontuação/gamificação | organization_id + user_id |
| \`user_achievements\` | Conquistas desbloqueadas | organization_id + user_id |
| \`sms_configs\` | Configuração SMS | organization_id |
| \`organization_integrations\` | Integrações de terceiros | organization_id |
| \`import_jobs\` | Jobs de importação CSV | organization_id |

## 12.2 Funções RPC

| Função | Assinatura | Objetivo |
|--------|-----------|----------|
| \`is_org_member\` | \`(_org_id, _user_id)\` | Verifica associação à organização |
| \`is_org_admin\` | \`(_org_id, _user_id)\` | Verifica role admin/owner |
| \`get_org_role\` | \`(_org_id, _user_id)\` | Retorna role do membro |
| \`has_role\` | \`(_user_id, _role)\` | Verifica role global (admin) |
| \`get_user_role\` | \`(_user_id)\` | Retorna role global mais alta |
| \`has_permission\` | \`(_user_id, _org_id, _module, _action)\` | Verifica permissão granular |
| \`check_plan_limit\` | \`(_org_id, _resource, _current_count)\` | Verifica limites do plano |
| \`create_organization_with_owner\` | \`(org_name, org_slug)\` | Cria org + membership owner |
| \`increment_automation_executions\` | \`(automation_id)\` | Incrementa contador |
| \`award_points\` | \`(_user_id, _org_id, _action, _points)\` | Pontua gamificação |
| \`is_agency_of\` | \`(_client_org_id, _user_id)\` | Verifica vínculo agência |
| \`get_agency_access_level\` | \`(_client_org_id, _user_id)\` | Nível de acesso da agência |

## 12.3 Triggers
- \`handle_new_user()\` — Cria profile ao cadastrar usuário
- \`update_updated_at_column()\` — Atualiza timestamps automaticamente

---

# 13. SEGURANÇA

## 13.1 Row Level Security (RLS)

**Padrão multi-tenant:**
- Todas as tabelas têm RLS habilitado
- Isolamento via \`is_org_member(organization_id, auth.uid())\`
- INSERT requer \`user_id = auth.uid()\`
- Funções RPC com \`SECURITY DEFINER\` e \`SET search_path TO 'public'\`

**Admin global:**
- \`has_role(auth.uid(), 'admin')\` — acesso cross-org em tabelas críticas
- Policies de SELECT e UPDATE para admin em \`organizations\` e \`subscriptions\`

**Agência:**
- \`is_agency_of(_client_org_id, _user_id)\` — acesso ao client
- \`get_agency_access_level\` — nível (operational, full)

## 13.2 Edge Functions — Autenticação

- Todas validam \`Authorization: Bearer <token>\`
- \`supabase.auth.getUser(token)\` para validação robusta
- Verificação \`is_org_member\` antes de operações sensíveis
- Propagação do token do usuário em chamadas internas (não service_role_key)

## 13.3 Stripe Webhook
- Verificação de assinatura HMAC (\`constructEvent\`)
- Rejeição sem \`STRIPE_WEBHOOK_SECRET\`

## 13.4 Instagram/WhatsApp
- Verificação \`INSTAGRAM_APP_SECRET\` / \`FACEBOOK_APP_SECRET\`
- Webhooks validam payloads recebidos

## 13.5 API Keys
- Hash da key armazenado (\`key_hash\`)
- Rate limiting: \`rate_limit_per_minute\`, \`rate_limit_per_day\`
- Contadores: \`requests_this_minute\`, \`requests_today\`
- Expiração: \`expires_at\`

## 13.6 Secrets Configurados

| Secret | Uso |
|--------|-----|
| \`STRIPE_SECRET_KEY\` | Pagamentos |
| \`LOVABLE_API_KEY\` | Gateway de IA |
| \`INSTAGRAM_APP_SECRET\` | Webhooks Instagram |
| \`FACEBOOK_APP_SECRET\` | Webhooks Facebook |
| \`SUPABASE_URL\` | URL do projeto |
| \`SUPABASE_ANON_KEY\` | Chave anônima |
| \`SUPABASE_SERVICE_ROLE_KEY\` | Chave de serviço (backend) |

---

# 14. PWA E RECURSOS AVANÇADOS

## 14.1 PWA
- Não implementado como PWA formal (sem service worker / manifest registrado)
- Aplicação SPA responsiva com suporte mobile via Tailwind
- Sidebar adapta para drawer no mobile

## 14.2 Realtime
- Tabelas com Realtime habilitado: \`messages\`, \`notifications\`, \`conversations\`
- Usado no Inbox para atualização instantânea de mensagens

## 14.3 Busca Global
- Componente \`GlobalSearch\` disponível em todas as telas do dashboard
- Busca em contatos, deals, empresas

## 14.4 Tema
- Suporte light/dark via \`ThemeContext\`
- Design tokens CSS em \`index.css\`
- Tailwind config com cores semânticas HSL

## 14.5 Onboarding
- \`OnboardingWizard\` — wizard guiado para novos usuários

---

# 15. CONSIDERAÇÕES FINAIS

## 15.1 Pontos Fortes
- Arquitetura multi-tenant robusta com isolamento total por RLS
- Feature gating granular por plano
- RBAC flexível com perfis de permissão customizáveis
- Integração omnichannel (WhatsApp + Instagram + E-mail + SMS + Telegram)
- IA integrada sem necessidade de API key do usuário
- Flow Builder visual estilo ManyChat
- Enquetes com mapeamento de respostas e lógica condicional
- Gamificação de equipes de vendas
- Modo agência multi-tenant
- Checkout com onboarding automático (guest checkout)

## 15.2 Pontos de Atenção
- Action \`wait\` nas automações registra mas não implementa delay real (necessita sistema de filas)
- PWA não formalizado (sem manifest / service worker)
- Crons de verificação de domínio dependem de invocação externa
- Rate limiting de API implementado em banco, não em edge middleware

## 15.3 Estrutura Preparada para Escala
- Todas as queries são isoladas por organização
- Realtime seletivo (apenas tabelas críticas)
- Edge Functions stateless e horizontalmente escaláveis
- TanStack Query com cache e stale time configurados
- Paginação preparada (\`usePaginatedQuery\`)

## 15.4 Edge Functions Completas

| Função | Objetivo |
|--------|----------|
| \`ai-chat\` | Chat IA (assistente + agentes custom) |
| \`create-checkout\` | Checkout Stripe para usuários logados |
| \`guest-checkout\` | Checkout para novos usuários |
| \`stripe-webhook\` | Processa eventos Stripe |
| \`send-email\` | Envio multi-provedor (Resend/SES/SendGrid) |
| \`send-whatsapp\` | Envio WhatsApp |
| \`send-sms\` | Envio SMS (Twilio/Vonage) |
| \`send-instagram-dm\` | Envio Instagram DM |
| \`process-automation\` | Execução de automações |
| \`process-sequence\` | Processamento de sequências drip |
| \`process-whatsapp-campaign\` | Processamento de campanhas WhatsApp |
| \`instagram-oauth\` | Fluxo OAuth Instagram |
| \`instagram-webhook\` | Webhook Instagram |
| \`instagram-lookup\` | Busca de perfil Instagram |
| \`whatsapp-webhook\` | Webhook WhatsApp |
| \`telegram-webhook\` | Webhook Telegram |
| \`email-inbound\` | Recepção de e-mails |
| \`verify-email-domain\` | Verificação DNS de domínio |
| \`verify-email-domains-cron\` | Verificação periódica |
| \`transcribe-audio\` | Transcrição de áudio |
| \`public-api\` | API pública REST |
| \`webhook-inbound\` | Webhook genérico de entrada |
| \`webhook-hotmart\` | Webhook Hotmart |
| \`webhook-kiwify\` | Webhook Kiwify |
| \`webhook-eduzz\` | Webhook Eduzz |
| \`webhook-shopify\` | Webhook Shopify |
| \`webhook-stripe\` | Webhook Stripe (pagamentos) |
| \`admin-manage-users\` | Gestão de usuários (admin) |
| \`delete-user-data\` | Exclusão de dados (LGPD) |
| \`export-user-data\` | Exportação de dados (LGPD) |

---

**FIM DO DOCUMENTO**

*Este manual reflete o estado atual do sistema AG Sell em produção (Março 2026). Atualizações devem ser versionadas e registradas neste documento.*
`;

export default function TechnicalManual() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(MANUAL_CONTENT);
      toast.success('Manual copiado para a área de transferência!');
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = MANUAL_CONTENT;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast.success('Manual copiado!');
    }
  };

  // Convert markdown to basic HTML for display
  const renderMarkdown = (md: string) => {
    return md
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-10 mb-4 text-foreground border-b border-border pb-2">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-8 mb-3 text-foreground">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-semibold mt-6 mb-2 text-foreground">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\`\`\`(\w*)\n([\s\S]*?)\`\`\`/g, '<pre class="bg-muted rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono border border-border"><code>$2</code></pre>')
      .replace(/\`([^`]+)\`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">$1</code>')
      .replace(/^\| (.+) \|$/gm, (match) => {
        const cells = match.split('|').filter(c => c.trim());
        const isHeader = cells.some(c => /^[-]+$/.test(c.trim()));
        if (isHeader) return '';
        const tag = 'td';
        return `<tr>${cells.map(c => `<${tag} class="border border-border px-3 py-2 text-sm">${c.trim()}</${tag}>`).join('')}</tr>`;
      })
      .replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, (match) => {
        const rows = match.trim().split('\n').filter(r => r.trim());
        if (rows.length === 0) return match;
        const firstRow = rows[0].replace(/td/g, 'th').replace(/text-sm/g, 'text-sm font-semibold bg-muted/50');
        return `<table class="w-full border-collapse border border-border my-4 rounded-lg overflow-hidden">${firstRow}${rows.slice(1).join('\n')}</table>`;
      })
      .replace(/^- (.*$)/gm, '<li class="ml-4 text-sm text-muted-foreground list-disc">$1</li>')
      .replace(/^---$/gm, '<hr class="my-8 border-border" />')
      .replace(/\n\n/g, '<br/>')
      .replace(/\n/g, '\n');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">Manual Técnico — AG Sell</h1>
          </div>
          <Button onClick={handleCopy} className="gap-2">
            <Copy className="h-4 w-4" />
            Copiar Tudo
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div 
          className="prose prose-sm max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(MANUAL_CONTENT) }}
        />
      </div>
    </div>
  );
}
