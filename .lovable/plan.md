
## Roadmap de Expansão - AG Sell

### ✅ Etapa 1: Automação de Instagram
- [x] Tabelas: `instagram_accounts`, `instagram_automations`, `instagram_automation_logs`
- [x] Página `/instagram` com abas (Automações, Contas, Histórico)
- [x] Hook `useInstagram.ts`
- [x] Rota e item no sidebar

### ✅ Etapa 2: WhatsApp Flows
- [x] Tabelas: `whatsapp_flows`, `whatsapp_flow_submissions`
- [x] Página `/whatsapp-flows` com builder de formulários
- [x] Hook `useWhatsAppFlows.ts`
- [x] Rota e item no sidebar

### ✅ Etapa 3: Agentes de IA por Setor
- [x] Templates pré-configurados por nicho (imobiliário, e-commerce, saúde, educação, serviços, alimentação, automotivo)
- [x] Prompts e knowledge base iniciais por template
- [x] Auto-inserção de knowledge snippets ao criar via template

### ✅ Etapa 4: Performance dos Agentes de IA
- [x] Dashboard de performance por agente (conversas, satisfação, transferências)
- [x] Métricas consolidadas (total conversas, satisfação média, taxa de resolução)
- [x] Gráfico de conversas por agente
- [x] Breakdown individual por agente

### ✅ Etapa 5: Triggers e Workers
- [x] Trigger de automação para `deal_stage_changed`
- [x] Trigger de automação para `form_submitted`
- [x] Trigger de automação para `deal_won`
- [x] Worker de Instagram para triggers em tempo real (webhook com auto-reply DM/comment)
- [x] Realtime habilitado para conversations, messages, notifications

### ✅ Etapa 6: Paridade ManyChat
- [x] Testes A/B de mensagens (tabela `ab_tests`, página `/ab-tests`)
- [x] Growth Tools - links, QR codes, widgets (tabela `growth_tools`, página `/growth-tools`)
- [x] Sequências / Drip Campaigns (tabelas `sequences`, `sequence_steps`, `sequence_enrollments`, página `/sequences`)
- [x] Condições avançadas (if/else) nos steps de sequências
- [x] Canais: Telegram (tabela `telegram_bots`), SMS (tabela `sms_configs`), Shopify (tabela `shopify_integrations`)
- [x] Página unificada de canais `/channels`

### ✅ Etapa 7: Flow Builder Visual
- [x] Construtor visual de funis estilo ManyChat
- [x] Gatilhos: Instagram (comentário, DM, story, menção, seguidor), WhatsApp (mensagem, palavra-chave, automação, origem), CRM (contato, formulário, fonte)
- [x] Ações: enviar mensagem, adicionar/remover tag, lead score, notificar, criar tarefa
- [x] Condições: tag, palavra-chave, score
- [x] Timer/espera configurável
- [x] Enquetes com ramificação por resposta
- [x] Teste A/B (Split) inline
- [x] Requisição HTTP customizável

### ✅ Etapa 8: E-mail Avançado
- [x] Configuração de domínio personalizado (SPF, DKIM, DMARC)
- [x] Caixas postais com limites diários de envio e presets inteligentes
- [x] Warmup de domínio com acompanhamento visual
- [x] Assinaturas personalizadas com logo e redes sociais
- [x] Inbox de e-mail para recebimento e resposta
- [x] Campanhas de e-mail com templates visuais

### ✅ Etapa 9: Documentação e Ajuda
- [x] Central de Ajuda completa estilo GitBook (`/help-center`)
- [x] Guia do Sistema interno (`/system-guide`)
- [x] Manual Técnico para administradores (`/manual-tecnico`)
- [x] Artigos organizados por categorias: Primeiros Passos, CRM, Comunicação, Marketing, Inteligência, Configurações
- [x] Busca global na documentação
- [x] Live previews das rotas do sistema

### ✅ Etapa 10: Gestão e Governança
- [x] Modo Agência multi-tenant com convites e níveis de acesso
- [x] Permissões granulares com Feature Gate
- [x] Gamificação (XP, níveis, ranking, conquistas)
- [x] API Keys com rate limiting e permissões
- [x] Webhooks de entrada e saída com integrações (Stripe, Hotmart, Eduzz, Kiwify, Shopify)
- [x] LGPD (exportação e exclusão de dados)

### 🏁 Status: Plataforma Completa
Todas as funcionalidades planejadas foram implementadas. O sistema está pronto para produção com:

- **CRM completo**: Contatos, Empresas, Pipeline Kanban, Tags, Tarefas
- **Comunicação multicanal**: WhatsApp, E-mail, Instagram, Telegram, SMS
- **Automação avançada**: Automações, Flow Builder visual, Sequências, Testes A/B
- **Inteligência**: Analytics, Assistente IA, Agentes de IA, Lead Scoring, Gamificação
- **Integrações**: Stripe, Hotmart, Eduzz, Kiwify, Shopify, Evolution API, Z-API
- **Governança**: Planos, Permissões, API Keys, Webhooks, Modo Agência, LGPD
