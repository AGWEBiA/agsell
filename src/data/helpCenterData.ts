import {
  LayoutDashboard, Users, Building2, Kanban, Tags, CheckSquare,
  Inbox, Mail, MessageSquare, Zap, BarChart3, Target, FileText,
  Link as LinkIcon, Settings, Bot, Brain, Trophy, Shield, Key,
  Webhook, SlidersHorizontal, Instagram, ListChecks, BookOpen,
  Rocket, Globe, Briefcase, Star, PlayCircle, HelpCircle, Workflow,
  Vote, SplitSquareVertical, Megaphone, Search, Bell, Palette,
  type LucideIcon,
} from 'lucide-react';

export interface HelpCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
}

export interface HelpArticle {
  id: string;
  categoryId: string;
  title: string;
  icon: LucideIcon;
  description: string;
  readTime?: string;
  popular?: boolean;
  content: string;
}

export const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    title: 'Primeiros Passos',
    icon: Rocket,
    description: 'Comece a usar o AG Sell em poucos minutos. Configure sua conta, organização e primeiros contatos.',
  },
  {
    id: 'crm',
    title: 'CRM e Contatos',
    icon: Users,
    description: 'Gerencie contatos, empresas, pipeline de vendas, tags e tarefas para organizar seu negócio.',
  },
  {
    id: 'communication',
    title: 'Comunicação',
    icon: MessageSquare,
    description: 'Inbox unificado, WhatsApp, E-mail Marketing, Instagram, Telegram, SMS e Shopify em um só lugar.',
  },
  {
    id: 'marketing',
    title: 'Marketing e Automação',
    icon: Zap,
    description: 'Automações, Flow Builder, Sequências, Lead Scoring, Testes A/B, Formulários e Growth Tools.',
  },
  {
    id: 'intelligence',
    title: 'Inteligência e Analytics',
    icon: BarChart3,
    description: 'Dashboards, Assistente IA, Agentes IA, Gamificação, Site Tracking, Atribuição, Sentimento, Relatórios e Metas.',
  },
  {
    id: 'settings',
    title: 'Configurações',
    icon: Settings,
    description: 'Organização, planos, permissões, agência, API Keys, webhooks e integrações.',
  },
];

export const helpArticles: HelpArticle[] = [
  // =====================================================
  // PRIMEIROS PASSOS
  // =====================================================
  {
    id: 'welcome',
    categoryId: 'getting-started',
    title: 'Visão geral do AG Sell',
    icon: Star,
    description: 'Conheça a plataforma e entenda como ela pode ajudar seu negócio.',
    readTime: '5 min',
    popular: true,
    content: `O **AG Sell** é uma plataforma completa de CRM, automação de vendas e atendimento multicanal que centraliza todas as suas operações comerciais em um único lugar. Projetada para pequenas, médias empresas e agências de marketing, ela elimina a necessidade de múltiplas ferramentas desconectadas.

## O que você pode fazer com o AG Sell?

- **Gerenciar contatos e empresas** de forma organizada com CRM completo
- **Acompanhar negócios** no pipeline de vendas com quadro Kanban drag-and-drop
- **Atender clientes** via WhatsApp, E-mail, Instagram, Telegram e SMS em um inbox unificado
- **Automatizar tarefas repetitivas** com fluxos inteligentes e sequências drip
- **Capturar leads** com formulários, Growth Tools, links e QR Codes
- **Analisar métricas** e resultados com dashboards completos e relatórios do SAC
- **Usar Inteligência Artificial** para respostas automáticas, análises e agentes autônomos
- **Gamificar a equipe** com pontos, níveis, conquistas e ranking
- **Integrar ferramentas** como Stripe, Hotmart, Eduzz, Kiwify e Shopify

[screenshot:Dashboard principal do AG Sell|/dashboard]

## Para quem é o AG Sell?

- **Vendedores** que precisam organizar contatos e acompanhar negócios
- **Equipes de vendas** que precisam de pipeline, tarefas e colaboração
- **Equipes de marketing** que precisam de automações, e-mail marketing e flows
- **Equipes de suporte** que precisam de inbox unificado e métricas de atendimento
- **Agências** que gerenciam múltiplos clientes com contas isoladas
- **Infoprodutores** que integram plataformas de vendas digitais

## Principais módulos

### 📇 CRM
Contatos, Empresas, Pipeline Kanban, Tags e Tarefas.

### 💬 Comunicação
SAC/Inbox unificado, WhatsApp (com QR Code e múltiplas instâncias), E-mail Marketing, Inbox de E-mail, Instagram, Telegram, SMS e Canais.

### 🚀 Marketing
Automações com 20+ ações, Flow Builder visual (estilo ManyChat), Sequências Drip, Lead Scoring, Testes A/B, Formulários de captura e Growth Tools.

### 🧠 Inteligência
Dashboard Analytics, Assistente IA contextual, Agentes de IA autônomos (com base de conhecimento RAG) e Gamificação com ranking.

### ⚙️ Configurações
Organização e equipe, Planos e assinatura, Permissões granulares, Gestão de Agência (multi-tenant), API Keys, Webhooks de entrada, Integrações e Configurações gerais (tema, LGPD).

> O AG Sell foi projetado para ser tão simples que qualquer pessoa consegue usar. Explore os módulos no menu lateral e comece pela criação dos seus primeiros contatos.

💡 **Dica**: Use a barra de busca global (**Ctrl+K** ou **⌘+K** no Mac) para encontrar qualquer funcionalidade, contato, empresa ou página rapidamente.`,
  },
  {
    id: 'first-setup',
    categoryId: 'getting-started',
    title: 'Configuração inicial',
    icon: Settings,
    description: 'Passo a passo completo para configurar sua conta, organização, equipe e plano.',
    readTime: '8 min',
    popular: true,
    content: `Depois de criar sua conta, siga estes passos para configurar o AG Sell e começar a vender.

## Passo 1: Configurando sua organização

A organização é o "espaço de trabalho" onde todos os dados do seu negócio ficam armazenados. Cada organização é isolada — ou seja, dados de uma organização não se misturam com outra.

1. Acesse **"Organização"** no menu lateral (seção Configurações)
2. Defina o **nome** da sua empresa
3. Faça upload do **logo** (recomendado: 200x200px, PNG ou JPG)
4. Configure o **slug** (endereço único da organização, ex: "minha-empresa")
5. Clique em **Salvar**

[screenshot:Página de configuração da organização|/organization]

> O logo da organização aparece no cabeçalho da plataforma e nos formulários públicos. Escolha uma imagem de boa qualidade.

## Passo 2: Convidando membros da equipe

1. Na página de **Organização**, vá até a seção de membros
2. Clique em **"Convidar membro"**
3. Insira o **e-mail** do colaborador
4. Selecione o **papel**:
   - **Owner** — Acesso total e propriedade da organização (apenas 1 por organização)
   - **Admin** — Acesso total, exceto exclusão da organização
   - **Membro** — Acesso controlado por perfis de permissão
5. O convite será enviado automaticamente por e-mail
6. O membro acessa o link e cria sua conta (ou faz login se já tiver)

> Após aceitar o convite, o membro terá acesso imediato à organização. Você pode revogar o acesso a qualquer momento.

⚠️ **Importante**: Configure os **perfis de permissão** (menu Permissões) antes de convidar membros com papel "Membro" para garantir que cada pessoa veja apenas o que precisa.

## Passo 3: Escolhendo seu plano

O AG Sell oferece planos com diferentes níveis de recursos e limites.

1. Acesse **"Planos"** no menu lateral
2. Compare os recursos de cada plano (número de contatos, envios, automações, etc.)
3. Selecione o plano ideal para seu negócio
4. Clique em **"Assinar"**
5. Complete o pagamento via **Stripe** (cartão de crédito)
6. Os recursos são liberados **imediatamente**

💡 **Dica**: Comece com o plano que atende suas necessidades atuais. Você pode fazer upgrade a qualquer momento sem perder dados.

## Passo 4: Importando seus contatos

Se você já tem uma base de contatos, importe-os em massa:

1. Acesse **"Contatos"** no menu lateral
2. Clique em **"Importar"**
3. Selecione seu arquivo **CSV**
4. Mapeie os campos do arquivo para os campos do CRM
5. Confirme e acompanhe o progresso da importação

> O CSV deve ter pelo menos o campo "Nome" (ou "first_name"). Campos como e-mail, telefone e WhatsApp são opcionais mas muito recomendados.

## Passo 5: Conectando canais de comunicação

Para começar a atender, conecte pelo menos um canal:

### WhatsApp
1. Acesse **"WhatsApp"** no menu → Clique em **"Conectar WhatsApp"** → Escaneie o QR Code

### E-mail
1. Acesse **"Domínio E-mail"** → Adicione seu domínio → Configure DNS

### Instagram
1. Acesse **"Instagram"** → Conecte via Facebook/Instagram

## Checklist de configuração

- ✅ Organização criada com nome e logo
- ✅ Membros da equipe convidados
- ✅ Plano selecionado e assinatura ativa
- ✅ Contatos importados (se já tiver base)
- ✅ Pelo menos um canal de comunicação conectado
- ✅ Permissões configuradas para a equipe
- ✅ Primeira automação criada (ex: boas-vindas)

💡 **Dica**: O sistema possui um assistente de **Onboarding** que guia você pelos primeiros passos. Siga as etapas sugeridas para uma configuração completa.`,
  },
  {
    id: 'navigation',
    categoryId: 'getting-started',
    title: 'Navegando pelo sistema',
    icon: LayoutDashboard,
    description: 'Entenda a interface completa: sidebar, busca global, notificações, temas e atalhos.',
    readTime: '4 min',
    content: `A interface do AG Sell é organizada para facilitar a navegação e maximizar a produtividade.

## Menu lateral (Sidebar)

O menu lateral é a principal forma de navegação. Ele é dividido em seções:

### 📊 Visão Geral
- **Dashboard** — Métricas resumidas do seu negócio (deals, contatos, receita, tarefas)
- **Tarefas** — Gerenciamento de atividades com calendário e prioridades

### 📇 CRM
- **Contatos** — Base de leads e clientes
- **Empresas** — Cadastro de organizações (B2B)
- **Pipeline** — Kanban de funil de vendas
- **Tags** — Etiquetas para segmentação

### 💬 Comunicação
- **SAC** — Inbox unificado multicanal
- **WhatsApp** — Conexão e campanhas
- **E-mail** — Campanhas de e-mail marketing
- **Inbox E-mail** — Caixa de entrada de e-mails
- **Instagram** — Automações e DMs
- **Canais** — Telegram, SMS e Shopify

### 🚀 Marketing
- **Automações** — Fluxos automatizados
- **Flow Builder** — Construtor visual de funis
- **Sequências** — Drip campaigns
- **Lead Scoring** — Pontuação de leads
- **Testes A/B** — Comparação de variantes
- **Formulários** — Captura de leads
- **Growth Tools** — Links, QR Codes e widgets

### 🧠 Inteligência
- **Analytics** — Dashboards e relatórios
- **Assistente IA** — Chat inteligente contextual
- **Agentes IA** — Bots autônomos com RAG
- **Gamificação** — Pontos, níveis e ranking

### ⚙️ Configurações
- Organização, Planos, Permissões, Agência, API Keys, Webhooks, Integrações e Settings

[screenshot:Menu lateral do AG Sell|/dashboard]

> O sidebar pode ser **recolhido** clicando no botão de toggle para ganhar mais espaço na tela.

## Busca global (Ctrl+K)

Pressione **Ctrl+K** (ou **⌘+K** no Mac) para abrir a busca global. Funcionalidades:

- **Buscar contatos** pelo nome, e-mail ou telefone
- **Buscar empresas** pelo nome ou domínio
- **Navegar para páginas** digitando o nome (ex: "pipeline", "automações")
- **Encontrar funcionalidades** rapidamente sem navegar pelo menu

A busca é contextual e prioriza resultados mais relevantes.

## Notificações

O ícone de **sino** (🔔) no cabeçalho mostra suas notificações em tempo real:

- 💬 Novas mensagens no inbox
- ✅ Tarefas vencidas ou próximas do prazo
- 📊 Atualizações do sistema
- 🔔 Alertas de automações

Clique na notificação para ir diretamente ao item relacionado.

## Tema claro e escuro

O AG Sell suporta **tema claro** e **tema escuro**:

1. Clique no ícone de **lua/sol** no cabeçalho
2. Alterne entre os temas
3. A preferência é salva automaticamente no seu navegador

## Seletor de organização (Agências)

Se você usa o modo **Agência**, um seletor aparece no topo do sidebar permitindo alternar entre as organizações dos seus clientes instantaneamente.

## Responsividade

O AG Sell funciona em **desktop**, **tablet** e **celular**. Em telas menores:
- O sidebar se transforma em um menu hamburger
- Os painéis se empilham verticalmente
- Ações principais continuam acessíveis

💡 **Dica**: Memorize o atalho **Ctrl+K** — ele é a forma mais rápida de chegar a qualquer lugar do sistema.`,
  },
  {
    id: 'dashboard-overview',
    categoryId: 'getting-started',
    title: 'Dashboard: seu painel de controle',
    icon: LayoutDashboard,
    description: 'Entenda todas as métricas, gráficos e indicadores do dashboard principal.',
    readTime: '4 min',
    content: `O Dashboard é a primeira tela que você vê ao acessar o AG Sell. Ele apresenta um panorama completo do seu negócio.

## Métricas principais (cards)

Na parte superior, você encontra cards com métricas-chave:

- **Total de Contatos** — Quantos contatos estão cadastrados no CRM
- **Deals Ativos** — Negócios em andamento no pipeline
- **Receita do Período** — Valor total dos deals ganhos no período selecionado
- **Tarefas Pendentes** — Quantidade de tarefas em aberto

Cada card mostra a variação percentual em relação ao período anterior (seta verde para crescimento, vermelha para queda).

[screenshot:Dashboard principal do AG Sell|/dashboard]

## Gráficos e visualizações

### Evolução de receita
Gráfico de linha mostrando a receita mensal ao longo do tempo, permitindo identificar tendências de crescimento.

### Distribuição do pipeline
Gráfico de barras mostrando quantos deals estão em cada etapa do funil, ajudando a identificar gargalos.

### Atividades recentes
Lista das últimas atividades realizadas pela equipe: novos contatos, deals movidos, mensagens enviadas, tarefas concluídas.

## Filtros de período

Use os filtros no topo para ajustar o período visualizado:

- **Hoje** — Dados do dia atual
- **Esta semana** — Últimos 7 dias
- **Este mês** — Mês corrente
- **Este trimestre** — Últimos 3 meses
- **Este ano** — Ano corrente
- **Personalizado** — Defina datas específicas

## Dicas para usar o Dashboard

- 📊 Consulte o dashboard **diariamente** para acompanhar a evolução do negócio
- 🎯 Use as métricas para definir **metas semanais** para a equipe
- 🔍 Se um indicador cair, investigue indo ao módulo específico (ex: Pipeline para deals)
- 📈 Compare períodos para identificar **sazonalidades** e tendências

💡 **Dica**: O Dashboard é atualizado em tempo real. Qualquer ação feita por um membro da equipe reflete imediatamente nos números.`,
  },

  // =====================================================
  // CRM E CONTATOS
  // =====================================================
  {
    id: 'contacts',
    categoryId: 'crm',
    title: 'Gerenciando contatos',
    icon: Users,
    description: 'Guia completo: criar, importar, filtrar, segmentar e gerenciar contatos no CRM.',
    readTime: '8 min',
    popular: true,
    content: `Os contatos são a base do seu CRM. Aqui você gerencia todas as informações dos seus leads e clientes.

## Visão geral da página de Contatos

Ao acessar **"Contatos"** no menu, você vê:

- **Barra de busca** — Pesquise por nome, e-mail, telefone ou WhatsApp
- **Filtros** — Filtre por status, tags, empresa, fonte e data
- **Botão "Novo Contato"** — Criar contato manualmente
- **Botão "Importar"** — Importar contatos via CSV
- **Tabela de contatos** — Com nome, e-mail, telefone, status, tags e data de criação

[screenshot:Página de Contatos do CRM|/contacts]

## Criando um contato manualmente

1. Clique no botão **"Novo Contato"**
2. Preencha os campos obrigatórios:
   - **Nome** (obrigatório)
   - **Sobrenome** (opcional)
3. Preencha os campos opcionais:
   - **E-mail** — Para campanhas de e-mail e identificação
   - **Telefone** — Para contato telefônico
   - **WhatsApp** — Para mensagens via WhatsApp (formato: +55DDDNÚMERO)
   - **Empresa** — Vincule a uma empresa cadastrada
   - **Cargo** — Posição na empresa
   - **Fonte** — De onde veio o lead (site, indicação, anúncio, etc.)
   - **Status** — Novo, Ativo, Inativo
   - **Notas** — Observações livres sobre o contato
4. Adicione **tags** para segmentação
5. Clique em **"Salvar"**

> O campo WhatsApp é especialmente importante: ele conecta o contato ao canal de comunicação mais usado no Brasil.

## Importação em massa (CSV)

Para importar uma base de contatos existente:

1. Na página de Contatos, clique em **"Importar"**
2. Selecione seu arquivo **CSV** (separado por vírgula ou ponto-e-vírgula)
3. O sistema exibe uma **prévia das colunas** detectadas
4. **Mapeie os campos**: associe cada coluna do CSV a um campo do CRM
   - first_name → Nome
   - last_name → Sobrenome
   - email → E-mail
   - phone → Telefone
   - whatsapp → WhatsApp
5. Revise o mapeamento e clique em **"Confirmar importação"**
6. Acompanhe o progresso na tela (processados, sucesso, erros)

### Dicas para importação

- O arquivo deve ter **cabeçalhos** na primeira linha
- O campo **Nome** é obrigatório — linhas sem nome serão ignoradas
- Formatos de telefone aceitos: (11)99999-9999, 11999999999, +5511999999999
- Se houver erros, o sistema mostrará quais linhas falharam e o motivo
- Contatos com e-mail duplicado podem ser tratados como atualização

⚠️ **Limite**: A importação processa até 1.000 linhas por vez. Para bases maiores, divida em múltiplos arquivos.

## Detalhes do contato

Ao clicar em um contato na lista, você abre a **ficha completa** com:

### Informações pessoais
Todos os dados cadastrais do contato (editáveis a qualquer momento).

### Timeline de atividades
Histórico cronológico completo com:
- 💬 Mensagens de WhatsApp enviadas e recebidas
- ✉️ E-mails enviados e recebidos
- 📸 Interações no Instagram
- 📋 Tarefas vinculadas ao contato
- 🔀 Movimentações no pipeline
- 📝 Notas e observações da equipe
- 🏷️ Tags adicionadas ou removidas
- 🤖 Ações de automações executadas

### Lead Score
Pontuação automática baseada no engajamento do contato (configurável no módulo Lead Scoring).

### Tags
Etiquetas coloridas para segmentação. Você pode adicionar e remover tags diretamente na ficha.

### Deals vinculados
Lista de negócios do pipeline associados ao contato.

[screenshot:Lista de contatos com detalhes|/contacts]

## Filtrando contatos

Use os filtros para encontrar segmentos específicos:

- **Status** — Novo, Ativo, Inativo
- **Tags** — Filtre por uma ou mais tags
- **Empresa** — Contatos de uma empresa específica
- **Fonte** — De onde o lead veio (site, indicação, anúncio)
- **Data** — Criados em um período específico
- **Lead Score** — Acima ou abaixo de uma pontuação

## Ações em massa

Selecione múltiplos contatos na tabela para executar ações em lote:
- Adicionar tag
- Remover tag
- Alterar status
- Excluir contatos

## Boas práticas

- 🏷️ **Use tags** para segmentar contatos desde o início — facilita campanhas futuras
- 📱 **Preencha o WhatsApp** de todos os contatos para aproveitar o canal mais eficiente
- 🔄 **Mantenha dados atualizados** — dados desatualizados prejudicam automações
- 📊 **Monitore o Lead Score** para priorizar contatos com maior potencial
- 🗂️ **Vincule a empresas** quando aplicável (essencial para vendas B2B)

💡 **Dica**: Use tags coloridas para segmentar seus contatos. Isso facilita a criação de campanhas direcionadas e automações personalizadas.`,
  },
  {
    id: 'companies',
    categoryId: 'crm',
    title: 'Cadastro de empresas',
    icon: Building2,
    description: 'Guia completo para organizar empresas, vincular contatos e acompanhar negócios B2B.',
    readTime: '5 min',
    content: `O módulo de Empresas permite organizar seus contatos por organização, essencial para vendas B2B.

## Visão geral

Na página de **Empresas**, você encontra:

- **Tabela de empresas** com nome, domínio, setor, porte e contatos vinculados
- **Busca** por nome ou domínio
- **Botão "Nova Empresa"** para cadastro manual

[screenshot:Página de Empresas|/companies]

## Criando uma empresa

1. Clique em **"Nova Empresa"**
2. Preencha os campos:
   - **Nome** (obrigatório) — Razão social ou nome fantasia
   - **Domínio** — Site da empresa (ex: empresa.com.br)
   - **Setor/Indústria** — Ramo de atuação (tecnologia, saúde, varejo, etc.)
   - **Porte** — Micro, Pequena, Média, Grande
   - **E-mail** — E-mail corporativo principal
   - **Telefone** — Telefone comercial
   - **Endereço** — Endereço físico
   - **Cidade, Estado, País** — Localização
   - **Notas** — Observações internas sobre a empresa
3. Clique em **"Salvar"**

## Vinculando contatos a empresas

Existem duas formas de vincular contatos:

### Na criação/edição do contato
1. Ao criar ou editar um contato, selecione a empresa no campo **"Empresa"**
2. O contato será automaticamente vinculado

### Na página da empresa
1. Abra a empresa desejada
2. Na seção de contatos vinculados, visualize todos os contatos associados
3. Para adicionar novos, edite o contato e selecione esta empresa

## Dados da empresa no CRM

Ao abrir uma empresa, você vê:

- **Informações cadastrais** — Todos os dados preenchidos
- **Contatos vinculados** — Lista de pessoas associadas à empresa
- **Deals ativos** — Negócios em andamento com esta empresa
- **Histórico** — Atividades e interações de todos os contatos da empresa

## Uso em vendas B2B

Em vendas B2B, é comum interagir com múltiplos decisores de uma mesma empresa:

1. Cadastre a empresa com dados completos
2. Vincule todos os contatos (CEO, gerente, comprador, etc.)
3. Crie deals no pipeline vinculados à empresa
4. Acompanhe todas as interações de todos os contatos no histórico

> Uma empresa pode ter múltiplos contatos vinculados e múltiplos deals simultâneos. Isso permite acompanhar o relacionamento completo com a organização.

## Filtrando empresas

Use a barra de busca para encontrar empresas por:
- Nome (parcial ou completo)
- Domínio do site

💡 **Dica**: Preencha o campo "Domínio" com o site da empresa. Isso ajuda na identificação automática e integração com ferramentas externas.`,
  },
  {
    id: 'pipeline',
    categoryId: 'crm',
    title: 'Pipeline de vendas (Kanban)',
    icon: Kanban,
    description: 'Guia completo: criar deals, arrastar entre etapas, filtrar, métricas e boas práticas.',
    readTime: '7 min',
    popular: true,
    content: `O Pipeline é o coração do seu processo de vendas, com visualização Kanban intuitiva para acompanhar cada negociação.

## Conceito do Pipeline

O pipeline representa seu **funil de vendas** — o caminho que um lead percorre desde o primeiro contato até o fechamento. Cada coluna representa uma **etapa** do funil, e cada card é um **deal** (negócio/oportunidade).

## Etapas padrão

O pipeline vem com etapas pré-configuradas que você pode personalizar:

- **Novo** → Lead recém-chegado que precisa de qualificação
- **Qualificado** → Lead com fit confirmado, pronto para abordagem
- **Proposta** → Proposta comercial enviada ao lead
- **Negociação** → Em negociação ativa (preço, prazo, condições)
- **Fechado** → Negócio concluído com sucesso (ganho)

[screenshot:Pipeline Kanban com etapas do funil|/pipeline]

## Criando um deal

1. Clique no botão **"+"** na coluna desejada (ou "Novo Deal" no topo)
2. Preencha os campos:
   - **Título** (obrigatório) — Nome descritivo do negócio (ex: "Implementação CRM - Empresa X")
   - **Valor** — Valor monetário do negócio
   - **Moeda** — BRL, USD, EUR, etc.
   - **Contato** — Vincule a um contato do CRM
   - **Empresa** — Vincule a uma empresa
   - **Probabilidade** — Chance de fechamento (0-100%)
   - **Data prevista** — Quando espera fechar o negócio
   - **Notas** — Observações internas
3. Clique em **"Criar"**

> O deal é criado na etapa selecionada e pode ser movido para outras etapas conforme a negociação avança.

## Movendo deals entre etapas

### Arrastar e soltar (drag-and-drop)
- Clique e segure o card do deal
- Arraste para a coluna de destino
- Solte para confirmar a mudança

### Edição manual
- Abra o deal clicando no card
- Altere a etapa no campo "Etapa"
- Salve as alterações

Cada movimentação é **registrada no histórico** do deal e do contato vinculado, criando um rastro completo da jornada.

## Detalhes do deal

Ao clicar em um deal, você vê:

- **Informações do negócio** — Título, valor, etapa, probabilidade, data prevista
- **Contato e empresa vinculados** — Com links para acessar rapidamente
- **Histórico de movimentações** — Quando e por quem o deal foi movido
- **Notas** — Observações da equipe
- **Tarefas vinculadas** — Atividades pendentes para avançar o deal

## Filtros do Pipeline

Use os filtros para visualizar deals específicos:

- **Etapa** — Mostrar apenas deals de uma ou mais etapas
- **Valor** — Faixa de valor (mínimo/máximo)
- **Responsável** — Deals atribuídos a um membro específico
- **Data prevista** — Deals com fechamento previsto em um período
- **Contato/Empresa** — Deals de um contato ou empresa específica
- **Status** — Aberto, ganho, perdido

## Métricas do Pipeline

O pipeline calcula automaticamente:

- **Valor total por etapa** — Soma dos deals em cada coluna
- **Número de deals por etapa** — Quantidade de negócios em cada fase
- **Taxa de conversão** — Percentual de deals que avançam entre etapas
- **Ticket médio** — Valor médio dos deals

Essas métricas também aparecem no **Dashboard** e no **Analytics** para análise mais profunda.

## Boas práticas

- 🔄 **Atualize diariamente** — Mova deals conforme a negociação evolui
- 📝 **Adicione notas** em cada movimentação para registrar o contexto
- 📅 **Defina datas previstas** realistas para previsão de receita
- 🎯 **Use probabilidades** para calcular receita ponderada
- ✅ **Crie tarefas** para cada deal (ex: "Enviar proposta", "Follow-up")
- 🏷️ **Vincule contatos** para manter o histórico completo
- 📊 **Analise gargalos** — Se muitos deals ficam parados em uma etapa, há um problema no processo

⚠️ **Deals parados**: Deals que ficam mais de 7 dias sem movimentação são sinalizados. Configure automações para alertar a equipe quando isso acontecer.

💡 **Dica**: Mantenha o pipeline atualizado movendo os deals conforme a negociação avança. Isso garante métricas precisas no Analytics e previsões de receita confiáveis.`,
  },
  {
    id: 'tags',
    categoryId: 'crm',
    title: 'Usando tags',
    icon: Tags,
    description: 'Guia completo: criar tags coloridas, aplicar a contatos, usar em automações e filtros.',
    readTime: '4 min',
    content: `Tags são etiquetas coloridas que ajudam a organizar, segmentar e automatizar ações com seus contatos.

## O que são Tags?

Tags funcionam como **rótulos** que você aplica aos contatos para categorizá-los. Um contato pode ter múltiplas tags simultaneamente. Exemplos de uso:

- **Interesse**: "interesse-produto-a", "interesse-servico-b"
- **Fase**: "lead-quente", "cliente-ativo", "churn"
- **Origem**: "facebook-ads", "google-ads", "indicacao"
- **Segmento**: "b2b", "b2c", "premium"

## Criando tags

1. Acesse **"Tags"** no menu lateral
2. Clique em **"Nova Tag"**
3. Defina o **nome** da tag (ex: "lead-quente")
4. Escolha uma **cor** para identificação visual
5. Clique em **"Salvar"**

[screenshot:Página de gerenciamento de Tags|/tags]

### Convenções de nomenclatura

Recomendamos usar nomes descritivos e padronizados:
- Use **letras minúsculas** e **hifens** (ex: lead-quente, interesse-crm)
- Agrupe por **prefixos** (ex: origem-facebook, origem-google)
- Evite nomes genéricos (ex: "tag1", "importante")

## Aplicando tags aos contatos

### Manualmente
1. Abra o contato desejado
2. No campo **"Tags"**, clique para adicionar
3. Selecione uma ou mais tags da lista
4. As tags são salvas automaticamente

### Via importação CSV
- Adicione uma coluna "tags" no CSV com os nomes separados por vírgula
- As tags serão criadas automaticamente se não existirem

### Via automações
- Use a ação **"Adicionar Tag"** em automações e flows
- Automatize a segmentação baseada em eventos

## Usando tags em automações

Tags são peças fundamentais nas automações:

### Como gatilho
- **"Tag adicionada"** — Dispare uma automação quando uma tag específica for adicionada a um contato
- **"Tag removida"** — Dispare quando uma tag for removida

### Como ação
- **"Adicionar Tag"** — Aplique tags automaticamente
- **"Remover Tag"** — Remova tags automaticamente

### Como condição
- **"Se tem tag X"** — Ramifique o fluxo baseado na presença de uma tag
- **"Se não tem tag X"** — Condição inversa

### Em filtros de campanhas
- Ao criar campanhas de e-mail ou WhatsApp, filtre destinatários por tags
- Combine múltiplas tags com lógica E/OU

## Usando tags em filtros

Em todas as telas do CRM, você pode filtrar por tags:
- **Contatos** — Filtre a tabela por uma ou mais tags
- **Pipeline** — Veja deals de contatos com tags específicas
- **Campanhas** — Selecione destinatários por tags

## Boas práticas

- 🎨 **Use cores distintas** por categoria (ex: azul para origem, verde para interesse, vermelho para urgência)
- 📋 **Documente o significado** de cada tag para a equipe
- 🔄 **Automatize a aplicação** — Evite depender de marcação manual
- 🗑️ **Limpe tags obsoletas** periodicamente
- 📊 **Analise segmentos** — Tags permitem comparar performance entre grupos

💡 **Dica**: As tags com cores distintas facilitam a identificação visual rápida dos segmentos no CRM. Defina uma paleta de cores padronizada.`,
  },
  {
    id: 'tasks',
    categoryId: 'crm',
    title: 'Tarefas',
    icon: CheckSquare,
    description: 'Guia completo: criar tarefas, prazos, prioridades, calendário e automação de tarefas.',
    readTime: '5 min',
    content: `O módulo de Tarefas permite organizar as atividades da sua equipe com prazos, prioridades e visualização em calendário.

## Visão geral

Na página de **Tarefas**, você encontra:

- **Lista de tarefas** com filtros por status, prioridade e responsável
- **Visualização em calendário** para planejamento temporal
- **Botão "Nova Tarefa"** para criação manual
- **Contadores** de tarefas pendentes, em progresso e concluídas

[screenshot:Módulo de Tarefas|/tasks]

## Criando uma tarefa

1. Clique em **"Nova Tarefa"**
2. Preencha os campos:
   - **Título** (obrigatório) — Descrição clara da atividade (ex: "Follow-up com João sobre proposta")
   - **Descrição** — Detalhes adicionais sobre o que fazer
   - **Prazo** — Data e hora limite
   - **Prioridade** — Baixa, Média ou Alta
   - **Responsável** — Membro da equipe que executará
3. Opcionalmente vincule a:
   - **Contato** — Para follow-ups e ações relacionadas a leads
   - **Deal** — Para ações necessárias no pipeline
4. Clique em **"Salvar"**

## Status das tarefas

- **Pendente** — Criada mas ainda não iniciada
- **Em progresso** — Sendo executada
- **Concluída** — Finalizada com sucesso
- **Atrasada** — Passou do prazo sem ser concluída (indicador visual vermelho)

## Visualização em calendário

- Alterne entre **Lista** e **Calendário** no topo da página
- No calendário, cada tarefa aparece na data do prazo
- **Cores** indicam a prioridade:
   - 🟢 Verde — Baixa prioridade
   - 🟡 Amarelo — Média prioridade
   - 🔴 Vermelho — Alta prioridade
- **Arraste tarefas** entre datas para reagendar rapidamente

## Vinculando tarefas a contatos e deals

Tarefas vinculadas aparecem:
- Na **timeline do contato** — Equipe vê todas as atividades pendentes
- Na **ficha do deal** — Ações necessárias para avançar o negócio
- Nas **notificações** — Alertas quando o prazo se aproxima

## Automação de tarefas

Crie tarefas automaticamente usando:

### Automações
- Adicione a ação **"Criar Tarefa"** em qualquer automação
- Defina título, prazo e prioridade dinamicamente
- Exemplo: "Quando um deal for movido para 'Proposta', criar tarefa 'Enviar proposta' com prazo de 2 dias"

### Flow Builder
- Adicione o nó **"Criar Tarefa"** em fluxos visuais

### Gatilhos comuns
- Deal parado há mais de X dias → Criar tarefa de follow-up
- Novo contato criado → Criar tarefa de qualificação
- Formulário submetido → Criar tarefa de contato inicial

## Notificações de prazo

O sistema notifica automaticamente:
- 🔔 **24 horas antes** do prazo — Lembrete preventivo
- 🔴 **No vencimento** — Alerta de tarefa vencendo
- ⚠️ **Após o prazo** — Tarefa aparece como atrasada

## Boas práticas

- ✅ **Uma tarefa por ação** — Evite tarefas genéricas como "Fazer follow-up em todos os leads"
- 📅 **Defina prazos realistas** — Tarefas sem prazo tendem a ser esquecidas
- 🎯 **Use prioridades** com critério — Nem tudo é "alta prioridade"
- 🔗 **Vincule a contatos/deals** — Mantém o contexto e facilita o acompanhamento
- 🤖 **Automatize criação** — Tarefas automáticas garantem que nada seja esquecido

💡 **Dica**: Use tarefas com prazos para garantir que nenhum follow-up seja esquecido. A combinação de tarefas + automações cria um sistema à prova de esquecimentos.`,
  },

  // =====================================================
  // COMUNICAÇÃO
  // =====================================================
  {
    id: 'inbox',
    categoryId: 'communication',
    title: 'SAC / Inbox unificado',
    icon: Inbox,
    description: 'Guia completo: atendimento multicanal, IA, transcrição, atribuição, CSAT e relatórios.',
    readTime: '10 min',
    popular: true,
    content: `O Inbox é sua central de atendimento que unifica mensagens de **WhatsApp**, **E-mail**, **Instagram**, **Telegram** e **SMS** em um único painel.

## Visão geral da interface

O Inbox é dividido em três painéis:

### Painel esquerdo — Lista de conversas
- Lista todas as conversas ativas e recentes
- Filtro por **canal** (WhatsApp, E-mail, Instagram, etc.)
- Filtro por **status** (Aberta, Respondida, Resolvida)
- Filtro por **prioridade** (Normal, Urgente)
- Filtro por **atribuição** (Minhas, Da equipe, Não atribuídas)
- **Busca** por nome do contato ou conteúdo da mensagem
- Indicador de **mensagens não lidas**

### Painel central — Chat
- Histórico completo da conversa selecionada
- Campo de digitação para responder
- Botões de ação: enviar, anexar arquivo, emoji, resposta rápida
- Botão **"Enviar com IA"** para gerar resposta inteligente
- Botão de **transcrição de áudio**
- Indicador do **canal** (ícone de WhatsApp, E-mail, etc.)

### Painel direito — Detalhes do contato
- Informações do contato (nome, e-mail, telefone, WhatsApp)
- **Lead Score** — Pontuação do contato
- **Tags** — Etiquetas aplicadas
- **Notas** — Observações internas da equipe
- **Deals** vinculados no pipeline
- **Histórico** de interações anteriores

[screenshot:Inbox unificado - Central de Atendimento|/inbox]

## Respondendo mensagens

1. Selecione uma conversa na lista à esquerda
2. Leia o histórico da conversa no painel central
3. Digite sua resposta no campo de texto na parte inferior
4. Pressione **Enter** para enviar (ou **Shift+Enter** para quebrar linha)
5. A mensagem é enviada pelo mesmo canal que o contato usou

### Opções ao responder
- **Texto** — Mensagem de texto simples
- **Emoji** — Selecione emojis do seletor
- **Arquivo** — Anexe documentos, imagens ou outros arquivos
- **Resposta rápida** — Use templates pré-configurados
- **Notas internas** — Adicione observações visíveis apenas para a equipe

## IA no atendimento

O recurso de **IA no atendimento** ajuda a responder mais rápido e com mais qualidade:

1. Com uma conversa aberta, clique no botão **"Enviar com IA"** (ícone de estrela/sparkle)
2. A IA analisa o **contexto completo** da conversa (mensagens anteriores, dados do contato)
3. Uma resposta inteligente é gerada automaticamente
4. **Revise** a sugestão antes de enviar
5. **Edite** se necessário — a IA é um assistente, não um substituto
6. Clique em **Enviar** para confirmar

> A IA é contextual: ela leva em conta o histórico da conversa, dados do contato e informações do CRM para gerar respostas relevantes.

## Transcrição de áudio

Quando receber mensagens de áudio no WhatsApp:

1. O áudio aparece como player no chat
2. Clique no botão de **transcrição** (ícone de texto)
3. O texto é gerado automaticamente usando IA
4. A transcrição aparece abaixo do áudio
5. Útil para ambientes onde não é possível ouvir áudio

## Respostas rápidas (Quick Replies)

Configure templates de respostas frequentes:

1. Acesse **Config. SAC** no menu lateral
2. Vá para a seção **"Respostas Rápidas"**
3. Clique em **"Nova Resposta"**
4. Defina um **atalho** (ex: "/boas-vindas") e o **texto da resposta**
5. No chat, digite o atalho ou clique no ícone de respostas rápidas

### Exemplos de respostas rápidas
- **/boas-vindas** — "Olá! Bem-vindo ao AG Sell. Como posso ajudar?"
- **/horario** — "Nosso horário de atendimento é de segunda a sexta, das 9h às 18h."
- **/preco** — "Nossos planos começam a partir de R$197/mês. Veja mais em..."

## Notas internas da conversa

Adicione observações visíveis apenas para a equipe:

1. Na conversa aberta, acesse a seção de **notas** no painel direito
2. Clique em **"Adicionar nota"**
3. Escreva a observação
4. A nota fica vinculada à conversa e visível para todos os membros

> Notas internas são úteis para registrar contexto, decisões e informações que não devem ser enviadas ao cliente.

## Atribuição de atendimentos

Configure regras de atribuição automática para distribuir conversas entre os atendentes:

1. Acesse **"Config. SAC"** no menu lateral
2. Vá para a seção **"Regras de Atribuição"**
3. Crie uma nova regra:
   - **Nome** — Identificação da regra
   - **Canais** — Para quais canais aplicar
   - **Estratégia**:
     - **Round Robin** — Distribui igualmente entre atendentes na ordem
     - **Carga mínima** — Prioriza quem tem menos atendimentos abertos
     - **Aleatório** — Distribui aleatoriamente
   - **Membros elegíveis** — Selecione quais atendentes participam
   - **Máximo simultâneo** — Limite de atendimentos por pessoa
4. Ative a regra

[screenshot:Configuração do SAC|/inbox-settings]

## Agentes de atendimento (SAC)

Gerencie quem pode atender no SAC:

1. Acesse **"Config. SAC"** → seção **"Agentes"**
2. Visualize a lista de agentes disponíveis
3. Configure o **status online/offline** de cada agente
4. Defina **departamentos** e especialidades

## Pesquisa CSAT (Satisfação)

Configure pesquisas de satisfação automáticas:

1. Acesse **Config. SAC** → seção **"CSAT"**
2. Clique em **"Nova Pesquisa"**
3. Configure:
   - **Nome** — Identificação da pesquisa
   - **Pergunta** — Ex: "De 1 a 5, como você avalia nosso atendimento?"
   - **Canais** — Em quais canais enviar
   - **Envio automático** — Enviar automaticamente ao encerrar a conversa
4. Ative a pesquisa

### Métricas de satisfação
- **Nota média** (CSAT Score)
- **Distribuição por nota** (quantos deram 1, 2, 3, 4 ou 5)
- **Comentários** dos clientes
- **Por agente** — Compare a satisfação entre atendentes

## Protocolos de atendimento

Cada conversa recebe um **número de protocolo** único automaticamente. Isso permite:
- Rastrear atendimentos
- Vincular conversas relacionadas
- Fornecer referência ao cliente

## Categorias e prioridades

Classifique conversas por:
- **Categorias** — Suporte, Vendas, Financeiro, etc.
- **Prioridades** — Normal, Urgente
- **Tags** — Adicione tags específicas à conversa

## Boas práticas

- ⚡ **Responda rápido** — O tempo de primeira resposta impacta diretamente a satisfação
- 🤖 **Use a IA** como rascunho — Revise sempre antes de enviar
- 📝 **Registre notas** — Contexto interno facilita transferências entre atendentes
- 🏷️ **Categorize conversas** — Facilita análises posteriores
- 📊 **Monitore métricas** — Use os Relatórios do SAC para identificar melhorias
- 🎯 **Configure respostas rápidas** para perguntas frequentes

💡 **Dica**: O Lead Score aparece ao lado do nome do contato no chat. Use para priorizar atendimentos de leads mais qualificados e com maior potencial de conversão.`,
  },
  {
    id: 'whatsapp',
    categoryId: 'communication',
    title: 'WhatsApp',
    icon: MessageSquare,
    description: 'Guia completo: QR Code, API Oficial (Meta), Coex (duplo canal), múltiplas instâncias e campanhas.',
    readTime: '12 min',
    popular: true,
    content: `Integre o WhatsApp ao AG Sell para comunicação direta com seus contatos, campanhas em massa e automações. O sistema suporta **múltiplos provedores simultaneamente** — incluindo a API Oficial da Meta e a Evolution API via QR Code.

## Provedores disponíveis

O AG Sell oferece **quatro modalidades** de conexão WhatsApp, que podem ser usadas **simultaneamente**:

| Provedor | Tipo | Indicado para |
|----------|------|---------------|
| **Evolution API (QR Code)** | Não oficial | Testes, uso pessoal, agilidade |
| **WhatsApp Business API (Meta)** | Oficial | Alto volume, profissionalismo, templates |
| **WhatsApp com Coexistência (Beta)** | Oficial + App | Manter app pessoal + API no mesmo número |
| **Z-API** | Não oficial | Alternativa simplificada |

> **Coex (Coexistência)** permite usar o mesmo número no app do celular e na API simultaneamente — recurso avançado da API Oficial da Meta.

---

## Opção 1: Conectando via QR Code (Evolution API)

Esta é a forma mais rápida de começar:

1. Acesse **"WhatsApp"** no menu lateral
2. Clique em **"Conectar WhatsApp"**
3. Um **QR Code** será exibido na tela
4. No seu celular, abra o **WhatsApp** → Menu (⋮) → **"Dispositivos vinculados"** → **"Vincular dispositivo"**
5. Escaneie o QR Code exibido na tela
6. Aguarde a sincronização (pode levar alguns segundos)
7. O status mudará para **"Conectado"** (indicador verde)

[screenshot:Tela de conexão do WhatsApp|/whatsapp]

> O AG Sell se conecta ao WhatsApp como um **dispositivo vinculado**. Seu celular deve permanecer conectado à internet para manter a conexão ativa.

⚠️ **Importante**: A conexão pode cair se o celular ficar muito tempo sem internet ou se o WhatsApp for deslogado. Reconecte escaneando um novo QR Code.

---

## Opção 2: WhatsApp Business API Oficial (Meta)

A API Oficial oferece **maior estabilidade, templates aprovados e suporte a alto volume de mensagens**. Siga os passos:

### Pré-requisitos

1. **Conta Meta Business Suite** verificada em [business.facebook.com](https://business.facebook.com)
2. **App criado** no [Meta for Developers](https://developers.facebook.com) (tipo "Business")
3. Produto **WhatsApp** adicionado ao app
4. **Número de telefone** registrado e verificado na plataforma Meta

### Obtendo as credenciais

1. Acesse o [Meta for Developers](https://developers.facebook.com) → seu App → **WhatsApp** → **Configuração da API**
2. Copie as seguintes informações:
   - **Phone Number ID** — Identificador único do seu número
   - **WhatsApp Business Account ID (WABA ID)** — ID da conta business
   - **Access Token Permanente** — Token de acesso (gere um token permanente no painel de System Users)

### Configurando no AG Sell

1. Acesse **"Integrações"** no menu lateral
2. Na seção **WhatsApp**, clique em **"Configurar"**
3. Selecione a aba **"WhatsApp Business API"**
4. Preencha os campos:
   - **Phone Number ID**
   - **Business Account ID**
   - **Access Token**
   - **Webhook Verify Token** (crie um token personalizado, ex: "agsell_verify_2024")
5. Clique em **"Salvar Configuração"**

### Configurando o Webhook na Meta

Para receber mensagens dos clientes, configure o webhook no Meta:

1. No Meta for Developers, vá em **WhatsApp** → **Configuração** → **Webhook**
2. Cole a **URL do Webhook** exibida na interface do AG Sell
3. Cole o **Verify Token** que você definiu
4. Clique em **"Verificar e Salvar"**
5. Inscreva-se nos campos: **messages**, **message_deliveries**, **message_reads**

✅ Pronto! As mensagens recebidas aparecerão automaticamente no Inbox.

---

## Opção 3: WhatsApp com Coexistência (Beta)

O modo **Coex** permite usar o **mesmo número no app do celular e na API** simultaneamente. Isso é possível graças ao recurso de coexistência da API Oficial da Meta.

### Como funciona

- Você continua usando o WhatsApp normalmente no celular
- A API envia e recebe mensagens pelo mesmo número
- Ideal para profissionais que não querem separar número pessoal/profissional

### Configuração

1. Siga todos os passos da **Opção 2** (API Oficial)
2. Na tela de configuração, marque a opção **"Habilitar Coexistência (Coex)"**
3. Salve a configuração

⚠️ **Atenção**: O recurso de Coexistência é um **recurso Beta** da Meta. Nem todos os números podem ser habilitados. Consulte a documentação oficial da Meta para verificar a disponibilidade.

---

## Múltiplas instâncias

Você pode conectar **vários números de WhatsApp** simultaneamente, inclusive usando **provedores diferentes** para cada número:

1. Na página do WhatsApp, clique em **"Adicionar Instância"**
2. Defina um nome para identificação (ex: "Vendas - QR Code", "Suporte - API Oficial")
3. Escolha o provedor (Evolution API, API Oficial, Z-API ou Coex)
4. Configure as credenciais do provedor escolhido
5. Use o **seletor no topo** da página para alternar entre contas

### Exemplo de configuração multi-instância

| Instância | Provedor | Número | Uso |
|-----------|----------|--------|-----|
| Vendas | API Oficial | +55 11 9xxxx-1111 | Alto volume, templates |
| Suporte | Evolution API (QR) | +55 11 9xxxx-2222 | Atendimento rápido |
| Pessoal | Coex (Beta) | +55 11 9xxxx-3333 | App + API simultaneamente |

### Instância padrão

- Defina uma instância como **padrão** — ela será usada automaticamente quando nenhuma instância for especificada
- Para campanhas e automações, você pode **escolher qual instância** usar

### Roteamento inteligente

Quando uma mensagem é enviada sem especificar a instância:
1. O sistema verifica se há uma **instância padrão** ativa
2. Se não houver, prioriza **Evolution API** como fallback
3. Em último caso, usa a **primeira instância ativa** disponível

---

## Campanhas de envio em massa

Envie mensagens para múltiplos contatos de uma vez:

1. Acesse a aba **"Campanhas"** na página do WhatsApp
2. Clique em **"Nova Campanha"**
3. Configure:
   - **Nome** — Identificação da campanha
   - **Instância** — Qual número usar para envio
   - **Mensagem** — Texto da mensagem (suporta formatação WhatsApp)
   - **Destinatários** — Selecione contatos por:
     - Tags específicas
     - Todos os contatos
     - Seleção manual
   - **Mídia** — Opcionalmente anexe imagem, vídeo ou documento
4. Clique em **"Enviar"** para envio imediato ou **"Agendar"** para envio futuro

### Detalhes da campanha
- **Progresso em tempo real** — Acompanhe quantos foram enviados
- **Status por contato** — Enviado, entregue, lido, erro
- **Intervalo entre envios** — O sistema adiciona delays para evitar bloqueio

⚠️ **Atenção**: Respeite as políticas do WhatsApp sobre envio em massa. Envios excessivos ou spam podem resultar em **bloqueio temporário ou permanente** da conta. Recomendações:
- Envie apenas para contatos que **consentiram** receber mensagens
- Limite o volume a **200-300 mensagens por dia** em contas novas
- Aumente gradualmente conforme a conta "aquece"
- Evite conteúdo repetitivo ou genérico

## Grupos do WhatsApp

Gerencie seus grupos diretamente pela plataforma:

1. Acesse a aba **"Grupos"** na página do WhatsApp
2. Visualize todos os grupos do número conectado
3. Para cada grupo:
   - Veja a lista de **participantes**
   - **Envie mensagens** diretamente pelo AG Sell
   - Acompanhe o **histórico** de mensagens

### Mensagens para grupos
1. Selecione o grupo desejado
2. Digite a mensagem
3. Envie — a mensagem aparece no grupo como se fosse enviada pelo celular

## Integração com o CRM

Todas as mensagens de WhatsApp são:

- **Registradas no histórico** do contato
- **Visíveis no Inbox** unificado
- **Disponíveis para automações** como gatilho
- **Contabilizadas no Lead Score** (se configurado)

## Comparativo: QR Code vs API Oficial

| Característica | QR Code (Evolution) | API Oficial (Meta) |
|----------------|--------------------|--------------------|
| Configuração | Simples (escanear QR) | Requer conta Meta Business |
| Estabilidade | Média (depende do celular) | Alta (infraestrutura Meta) |
| Templates | Não suporta | Suporta templates aprovados |
| Volume | Limitado | Alto volume |
| Custo | Sem custo da Meta | Cobrança por conversa (Meta) |
| Coexistência | Não | Sim (Beta) |
| Ideal para | Início rápido, testes | Operações profissionais |

## Boas práticas

- 📱 **Mantenha o celular conectado** à internet (para QR Code)
- 🔄 **Reconecte proativamente** — Verifique o status da conexão regularmente
- ✍️ **Personalize mensagens** — Use {{nome}} para incluir o nome do contato
- ⏰ **Respeite horários** — Evite enviar mensagens fora do horário comercial
- 📊 **Monitore o engajamento** — Acompanhe taxas de leitura e resposta
- 🚫 **Evite spam** — Envie conteúdo relevante para não ser bloqueado
- 🔀 **Use múltiplas instâncias** — Separe canais por departamento ou finalidade
- 🏢 **API Oficial para produção** — Para operações críticas, prefira a API Oficial

💡 **Dica**: Combine WhatsApp com automações para criar fluxos como: "Quando um novo contato for criado, enviar mensagem de boas-vindas automaticamente". Você pode escolher qual instância/provedor usar em cada automação.`,
  },
  {
    id: 'email-marketing',
    categoryId: 'communication',
    title: 'E-mail Marketing',
    icon: Mail,
    description: 'Guia completo: criar campanhas, editor visual, templates, domínio personalizado e métricas.',
    readTime: '7 min',
    content: `O módulo de E-mail permite criar e enviar campanhas profissionais de e-mail marketing com editor visual.

## Visão geral

Na página de **E-mail**, você encontra:

- **Lista de campanhas** — Todas as campanhas criadas, com status e métricas
- **Botão "Nova Campanha"** — Criar uma nova campanha
- **Filtros** — Por status (rascunho, enviada, agendada)

[screenshot:Módulo de E-mail Marketing|/email]

## Criando uma campanha

### 1. Informações básicas
1. Clique em **"Nova Campanha"**
2. Defina o **nome** da campanha (interno, apenas para organização)
3. Defina o **assunto** do e-mail (o que o destinatário vê na caixa de entrada)
4. Selecione o **remetente** (caixa postal configurada)

### 2. Conteúdo do e-mail
Use o **editor visual** para montar o e-mail:

- **Arrastar e soltar** blocos de conteúdo
- Blocos disponíveis:
   - Texto (com formatação rica)
   - Imagem
   - Botão (CTA)
   - Separador
   - Espaçador
   - Colunas (layout em grid)
- **Variáveis dinâmicas**: {{nome}}, {{email}}, {{empresa}}
- **Personalização visual**: cores, fontes, bordas, espaçamentos

### 3. Destinatários
Selecione quem receberá o e-mail:

- **Todos os contatos** com e-mail cadastrado
- **Filtrar por tags** — Selecione uma ou mais tags
- **Contatos específicos** — Seleção manual

### 4. Envio
- **Enviar agora** — Dispara imediatamente
- **Agendar** — Defina data e hora para envio futuro

## Templates de e-mail

Para agilizar a criação:

1. Na criação de campanha, clique em **"Templates"**
2. Escolha entre templates pré-prontos:
   - Newsletter básica
   - Promoção com destaque
   - Anúncio de produto
   - Welcome email
3. Personalize cores, textos e imagens
4. Salve seus próprios templates para reuso

## Domínio personalizado de e-mail

Para melhor **entregabilidade** (evitar caixa de spam), configure um domínio próprio:

1. Acesse **"Domínio E-mail"** no menu lateral
2. Clique em **"Adicionar Domínio"**
3. Insira seu domínio (ex: empresa.com.br)
4. O sistema gera os registros **DNS** necessários:
   - **SPF** — Autoriza o envio pelo AG Sell
   - **DKIM** — Assina digitalmente os e-mails
   - **DMARC** — Política de autenticação
   - **MX** — Para recebimento de e-mails
5. Adicione os registros no **painel do seu provedor de domínio** (GoDaddy, Registro.br, Cloudflare, etc.)
6. Volte ao AG Sell e clique em **"Verificar"**
7. Aguarde a propagação DNS (pode levar até 48h, geralmente minutos)

[screenshot:Configuração de Domínio de E-mail|/email-domain]

### Status da verificação
- ✅ **Verificado** — Tudo configurado corretamente
- ⏳ **Pendente** — Aguardando propagação DNS
- ❌ **Erro** — Registro não encontrado (verifique a configuração)

## Caixas postais (Mailboxes)

Após verificar o domínio, crie caixas postais:

1. No domínio verificado, acesse **"Caixas Postais"**
2. Clique em **"Nova Caixa"**
3. Configure:
   - **Prefixo** — ex: contato, suporte, vendas (gera contato@seudominio.com)
   - **Nome** — Nome de exibição (ex: "Equipe de Vendas")
   - **Limite diário** — Quantidade máxima de envios por dia:
     - Aquecimento: 50/dia (domínios novos)
     - Conservador: 200/dia
     - Moderado: 500/dia
     - Alto volume: 1000/dia
   - **Assinatura** — Configure assinatura com logo e links de redes sociais

### Warmup (Aquecimento)

Domínios novos precisam ser **aquecidos** gradualmente:
1. Comece com o limite de **50 e-mails/dia**
2. Após 1-2 semanas sem problemas, aumente para **200/dia**
3. Continue aumentando gradualmente conforme a reputação cresce
4. O status de warmup é exibido na caixa postal

## Métricas das campanhas

Cada campanha exibe métricas detalhadas:

- **Taxa de abertura** — Percentual de destinatários que abriram o e-mail
- **Taxa de cliques** — Percentual que clicou em links do e-mail
- **Entregas** — Quantidade de e-mails efetivamente entregues
- **Bounces** — E-mails que não foram entregues (endereço inválido)

## Boas práticas

- ✉️ **Assunto atraente** — O assunto é o fator #1 na taxa de abertura
- 📱 **Design responsivo** — Teste como o e-mail aparece no celular
- 🎯 **Segmente destinatários** — E-mails segmentados têm 2x mais abertura
- 📊 **Analise métricas** — Compare campanhas para otimizar
- 🔥 **Aqueça o domínio** — Comece devagar para evitar spam
- 📝 **Inclua CTA claro** — Botão com ação específica (Comprar, Saiba mais, etc.)

💡 **Dica**: Combine e-mail marketing com automações para envios baseados em comportamento (ex: enviar e-mail de follow-up quando um lead abrir uma proposta).`,
  },
  {
    id: 'instagram-integration',
    categoryId: 'communication',
    title: 'Instagram',
    icon: Instagram,
    description: 'Guia completo: conectar conta, automações de DM, comentários, stories e histórico.',
    readTime: '5 min',
    content: `Conecte contas do Instagram para automação de interações, DMs automáticas e atendimento via Inbox.

## Conectando sua conta

1. Acesse **"Instagram"** no menu lateral
2. Clique em **"Conectar conta"**
3. Autorize o acesso via **Facebook/Instagram** (sua conta Instagram deve ser uma conta profissional vinculada a uma página do Facebook)
4. Sua conta aparecerá na lista com:
   - Nome de usuário
   - Foto de perfil
   - Status da conexão

[screenshot:Página de automações do Instagram|/instagram]

### Requisitos
- Conta Instagram **Profissional** (Comercial ou Criador)
- Página do **Facebook** vinculada ao Instagram
- Permissões concedidas para gerenciar mensagens

## Automações de DM

Configure respostas automáticas para diferentes tipos de interação:

### Tipos de gatilhos

1. **DM recebida** — Quando alguém envia uma mensagem direta
2. **Comentário em post** — Quando alguém comenta em uma publicação
3. **Comentário em post específico** — Filtrado por post (via URL ou ID)
4. **Resposta ao story** — Quando alguém responde um story
5. **Menção em story** — Quando alguém menciona você em um story
6. **Novo seguidor** — Quando alguém começa a seguir

### Configurando uma automação

1. Clique em **"Nova Automação"**
2. Selecione a **conta** do Instagram
3. Escolha o **tipo de gatilho**
4. Configure as **condições**:
   - Palavra-chave na mensagem/comentário
   - Qualquer interação (sem filtro)
5. Configure a **resposta automática**:
   - Texto de resposta
   - Responder via DM (para comentários)
   - Enviar mídia (imagem, vídeo)
6. Opcionalmente adicione **ações CRM**:
   - Criar contato
   - Adicionar tag
   - Inscrever em sequência
7. **Ative** a automação

### Exemplos de automações

**Captura de leads via comentários:**
- Gatilho: Comentário com a palavra "QUERO" em um post de oferta
- Ação: Responder o comentário "Mandei no DM! 🚀"
- Ação: Enviar DM com link da oferta
- Ação: Criar contato no CRM com tag "lead-instagram"

**Boas-vindas para novos seguidores:**
- Gatilho: Novo seguidor
- Ação: Enviar DM de boas-vindas com apresentação
- Ação: Adicionar tag "seguidor-instagram"

## Histórico de execuções

Acompanhe todas as automações executadas:

- **Data e hora** da execução
- **Tipo de evento** que disparou
- **Status** (sucesso ou erro)
- **Ação tomada** (mensagem enviada, contato criado, etc.)
- **Contato** vinculado à interação

## Integração com o Inbox

Mensagens do Instagram aparecem no **Inbox unificado**:
- DMs são exibidas como conversas
- A equipe pode responder diretamente pelo Inbox
- Histórico completo da interação fica vinculado ao contato

## Boas práticas

- 📸 **Use em posts estratégicos** — Configure automações para posts com ofertas ou conteúdo de valor
- 🎯 **Segmente por palavra-chave** — Diferentes palavras podem acionar diferentes fluxos
- 🤖 **Combine com Flow Builder** — Use automações de Instagram como gatilho para funis completos
- ⏱️ **Responda rápido** — O Instagram penaliza contas que demoram para responder DMs

💡 **Dica**: Use o Flow Builder para criar funis completos de Instagram, combinando gatilhos de comentários com sequências de DMs automáticas.`,
  },
  {
    id: 'channels',
    categoryId: 'communication',
    title: 'Canais de comunicação',
    icon: Globe,
    description: 'Guia completo: Telegram, SMS (Twilio/Vonage) e Shopify — configuração e uso.',
    readTime: '5 min',
    content: `A página de Canais centraliza a configuração de todos os canais de comunicação adicionais disponíveis no AG Sell.

## Canais disponíveis

### 🤖 Telegram

Conecte bots do Telegram para atendimento automatizado:

1. Crie um bot no Telegram via **@BotFather**
2. Copie o **Token do Bot** gerado
3. No AG Sell, acesse **"Canais"** → **Telegram**
4. Cole o **Token do Bot**
5. Configure a **mensagem de boas-vindas** (enviada quando alguém inicia conversa com o bot)
6. Ative a integração

**Funcionalidades:**
- Receba mensagens do Telegram no **Inbox unificado**
- Responda diretamente pelo AG Sell
- Crie contatos automaticamente a partir de interações
- Use em **automações** como canal de envio

### 📱 SMS

Integre provedores de SMS para envios automáticos:

**Twilio:**
1. Crie uma conta no Twilio
2. Obtenha Account SID, Auth Token e número de telefone
3. No AG Sell, acesse **"Canais"** → **SMS**
4. Configure as credenciais do Twilio
5. Ative a integração

**Vonage:**
1. Crie uma conta no Vonage
2. Obtenha API Key e API Secret
3. Configure no AG Sell da mesma forma

**Funcionalidades:**
- Envie SMS em **automações** e **sequências**
- Receba respostas de SMS no **Inbox**
- Acompanhe **entregas** e **respostas**
- Use SMS como **fallback** quando WhatsApp não estiver disponível

### 🛒 Shopify

Conecte sua loja Shopify para sincronizar dados:

1. No AG Sell, acesse **"Canais"** → **Shopify**
2. Siga o fluxo de autorização do Shopify
3. Configure quais eventos sincronizar:
   - **Novo pedido** → Cria contato automaticamente
   - **Pedido pago** → Adiciona tag "cliente"
   - **Carrinho abandonado** → Dispara automação de recuperação

**Funcionalidades:**
- Crie contatos automaticamente a partir de compras
- Sincronize dados de pedidos
- Dispare automações baseadas em eventos de compra
- Recupere carrinhos abandonados com mensagens automáticas

[screenshot:Página de Canais|/channels]

## Boas práticas

- 📡 **Configure múltiplos canais** para alcançar contatos onde eles preferem ser contatados
- 🔄 **Use canais como fallback** — Se WhatsApp não entregar, tente SMS
- 🤖 **Automatize boas-vindas** em todos os canais para primeira impressão positiva
- 📊 **Compare performance** entre canais para investir nos mais eficientes

💡 **Dica**: A estratégia multicanal aumenta significativamente as taxas de resposta. Configure pelo menos 2 canais ativos.`,
  },
  {
    id: 'inbox-reports',
    categoryId: 'communication',
    title: 'Relatórios do SAC',
    icon: BarChart3,
    description: 'Métricas detalhadas: tempo de resposta, volume, satisfação, performance por agente.',
    readTime: '4 min',
    content: `Os Relatórios do SAC oferecem métricas detalhadas sobre o desempenho do atendimento da sua equipe.

## Métricas disponíveis

### Tempo de resposta
- **Tempo médio de primeira resposta** — Quanto tempo leva para o primeiro atendente responder
- **Tempo médio de resolução** — Quanto tempo leva para resolver o atendimento completamente
- Ambos medidos em minutos/horas com gráfico de evolução

### Volume de atendimento
- **Total de conversas** — Por período selecionado
- **Distribuição por canal** — Quantas via WhatsApp, E-mail, Instagram, etc.
- **Distribuição por status** — Abertas, em atendimento, resolvidas
- **Pico de atendimento** — Horários e dias com mais demanda

### Satisfação (CSAT)
- **Nota média** — Score de satisfação (1-5)
- **Distribuição por nota** — Quantos clientes deram cada nota
- **Tendência** — Evolução da satisfação ao longo do tempo
- **Comentários** — Feedback textual dos clientes

### Performance por agente
- **Conversas atendidas** — Quantidade por atendente
- **Tempo médio de resposta** — Por atendente
- **Nota CSAT** — Satisfação por atendente
- **Taxa de resolução** — Percentual de atendimentos resolvidos por atendente

[screenshot:Relatórios do SAC|/inbox-reports]

## Filtros

Filtre os relatórios por:

- **Período** — Hoje, esta semana, este mês, personalizado
- **Canal** — WhatsApp, E-mail, Instagram, Telegram, SMS
- **Agente** — Atendente específico
- **Prioridade** — Normal, Urgente

## Como usar os dados

### Identificar gargalos
- Tempo de primeira resposta alto? → Contrate mais atendentes ou configure automações
- Volume concentrado em um canal? → Invista mais nesse canal
- Nota CSAT baixa em um agente? → Ofereça treinamento

### Definir metas
- Meta de tempo de primeira resposta: < 5 minutos
- Meta de CSAT: > 4.0
- Meta de taxa de resolução: > 90%

💡 **Dica**: Acompanhe o tempo de primeira resposta para garantir que seus clientes não fiquem esperando. Respostas rápidas aumentam a satisfação em até 60%.`,
  },
  {
    id: 'email-inbox',
    categoryId: 'communication',
    title: 'Inbox de E-mail',
    icon: Mail,
    description: 'Guia completo: receber e responder e-mails, caixas postais, assinaturas e warmup.',
    readTime: '5 min',
    content: `O Inbox de E-mail permite receber e responder e-mails diretamente dentro do AG Sell, sem precisar de um cliente de e-mail externo.

## Pré-requisitos

Para usar o Inbox de E-mail, você precisa:

1. **Domínio verificado** — Configure em "Domínio E-mail"
2. **Registros MX** configurados — Para recebimento de e-mails
3. **Caixa postal** criada — Com o prefixo desejado (ex: contato@)

## Como funciona

1. Quando alguém envia e-mail para **contato@seudominio.com**, o e-mail aparece no Inbox
2. O sistema tenta **vincular automaticamente** ao contato pelo e-mail
3. Se não encontrar, cria um novo contato automaticamente
4. Você pode **responder** diretamente pela plataforma

[screenshot:Inbox de E-mail|/email-inbox]

## Funcionalidades

### Receber e-mails
- E-mails recebidos aparecem em **tempo real** no inbox
- Indicação visual de e-mails **não lidos**
- Preview do conteúdo na lista

### Responder e-mails
1. Abra o e-mail na lista
2. Clique em **"Responder"**
3. O campo de resposta abre com:
   - Cabeçalho de resposta ("Em resposta a...")
   - Assinatura configurada automaticamente
4. Escreva sua resposta e envie

### Vincular a contatos
- E-mails são **automaticamente vinculados** ao contato correspondente (pelo endereço de e-mail)
- Aparecem na **timeline do contato** junto com WhatsApp e Instagram
- Criam **histórico unificado** de todas as interações

## Caixas postais — Configuração detalhada

Cada caixa postal possui:

### Limite diário de envios
Configure com presets inteligentes:
- 🐢 **Aquecimento (50/dia)** — Para domínios novos, aumenta reputação gradualmente
- 🐌 **Conservador (200/dia)** — Para uso regular com volume baixo
- ⚡ **Moderado (500/dia)** — Para volume médio de envios
- 🚀 **Alto volume (1000/dia)** — Para operações de grande escala

### Assinatura
Personalize a assinatura de cada caixa postal:
- **Logo** da empresa
- **Nome e cargo** do remetente
- **Links de redes sociais** (WhatsApp, Instagram, Facebook, YouTube, Telegram)
- **Texto** personalizado

### Status de warmup
Acompanhe o aquecimento do domínio:
- **Cold** — Domínio novo, sem reputação
- **Warming** — Em processo de aquecimento
- **Warm** — Reputação estabelecida
- **Hot** — Alta reputação, alto volume permitido

## Boas práticas

- 🔥 **Aqueça o domínio** — Comece com 50/dia e aumente gradualmente a cada semana
- 📧 **Responda rápido** — E-mails não respondidos prejudicam a reputação
- 🎨 **Configure assinatura** profissional — Transmite credibilidade
- 🔗 **Mantenha MX configurado** — Sem MX, você não recebe e-mails

💡 **Dica**: Comece com o limite de aquecimento (50 e-mails/dia) para novos domínios e aumente gradualmente a cada 1-2 semanas conforme a reputação cresce.`,
  },

  // =====================================================
  // MARKETING E AUTOMAÇÃO
  // =====================================================
  {
    id: 'automations',
    categoryId: 'marketing',
    title: 'Automações',
    icon: Zap,
    description: 'Guia completo: gatilhos, 20+ ações, condições, enquetes, templates e boas práticas.',
    readTime: '12 min',
    popular: true,
    content: `O motor de automações permite criar fluxos que executam ações automaticamente, eliminando tarefas repetitivas e acelerando seu processo de vendas.

## Conceitos básicos

Uma automação é composta por:

- **Gatilho** — O evento que inicia a automação (o "quando")
- **Ações** — O que deve ser executado (o "então")
- **Condições** — Lógica Se/Senão para ramificar o fluxo (o "se")
- **Enquetes** — Perguntas interativas com ações por resposta

## Criando uma automação

1. Acesse **"Automações"** no menu lateral
2. Clique em **"Nova Automação"**
3. Defina o **nome** da automação (ex: "Boas-vindas novos leads")
4. Selecione o **gatilho** (evento que inicia)
5. Adicione **ações** (o que acontece)
6. Opcionalmente, adicione **condições** para ramificar
7. **Ative** a automação
8. Clique em **"Salvar"**

[screenshot:Módulo de Automações|/automations]

## Gatilhos disponíveis

### Contatos
- **Contato criado** — Quando um novo contato é adicionado ao CRM
- **Contato atualizado** — Quando dados de um contato são alterados

### Tags
- **Tag adicionada** — Quando uma tag específica é adicionada a um contato
- **Tag removida** — Quando uma tag é removida de um contato

### Pipeline
- **Deal criado** — Quando um novo deal é adicionado ao pipeline
- **Deal movido** — Quando um deal muda de etapa
- **Deal ganho** — Quando um deal é marcado como ganho
- **Deal perdido** — Quando um deal é marcado como perdido

### Mensagens
- **Mensagem recebida (WhatsApp)** — Quando uma mensagem chega no WhatsApp
- **E-mail recebido** — Quando um e-mail é recebido

### Formulários
- **Formulário submetido** — Quando alguém preenche um formulário

### Webhooks
- **Evento de webhook** — Quando um webhook de entrada é acionado (Stripe, Hotmart, etc.)

## Ações disponíveis (20+)

### 💬 Mensagens
- **Enviar E-mail** — Envie e-mails com templates, variáveis ({{nome}}, {{email}}) e formatação rica
- **Enviar WhatsApp** — Envie mensagens de WhatsApp com texto, mídia e botões
- **Enviar DM Instagram** — Envie DMs com texto, quick replies e imagens
- **Enviar SMS** — Envie SMS via Twilio ou Vonage
- **Enviar Enquete** — Envie pergunta interativa com até 4 opções e ações diferentes por resposta
- **Notificar Admin** — Notifique um administrador via notificação push ou e-mail

### 📇 CRM & Dados
- **Adicionar Tag** — Aplique uma tag ao contato automaticamente
- **Remover Tag** — Remova uma tag do contato
- **Definir Campo** — Atualize qualquer campo do contato (status, fonte, notas, etc.)
- **Atualizar Lead Score** — Adicione, subtraia ou defina a pontuação do lead

### 🔀 Fluxo & Sequência
- **Inscrever em Sequência** — Adicione o contato a uma sequência drip (e-mails programados)
- **Remover de Sequência** — Cancele a inscrição do contato em uma sequência
- **Ir para outro Flow** — Redirecione para um fluxo visual no Flow Builder
- **Teste A/B (Split)** — Divida o tráfego entre dois caminhos com slider de porcentagem
- **Condição (Se/Senão)** — Crie ramificações lógicas baseadas em dados do contato
- **Aguardar** — Adicione delay em minutos, horas ou dias antes da próxima ação

### 👥 Equipe
- **Atribuir a Agente** — Atribua o contato a um atendente (round robin, menos ocupado ou específico)
- **Transferir p/ Humano** — Encaminhe para atendimento humano por departamento
- **Criar Tarefa** — Crie uma tarefa com título, prazo e prioridade automaticamente

### ⚙️ Avançado
- **Requisição HTTP** — Faça chamadas a APIs externas com método (GET, POST, PUT), headers e body customizáveis

## Enquetes com ramificação

A ação de **Enquete** é uma das mais poderosas — permite enviar perguntas interativas e configurar ações diferentes para cada resposta:

### Configurando uma enquete
1. Adicione a ação **"Enviar Enquete"** à automação
2. Defina a **pergunta** (ex: "Qual produto te interessa?")
3. Adicione até **4 opções** de resposta (ex: "Produto A", "Produto B", "Serviço", "Apenas olhando")
4. Para **cada opção**, configure uma ação:
   - Adicionar tag específica
   - Ir para um flow diferente
   - Enviar mensagem personalizada
   - Atualizar campo do contato
   - Inscrever em sequência
5. A resposta é salva automaticamente em um **campo do contato**

### Exemplo de funil com enquete

**Qualificação automática por interesse:**
- Enquete: "Qual seu interesse?" → Opções: Produto A, Produto B, Serviço, Apenas olhando
- Se **"Produto A"** → Tag "interesse-produto-a" + Sequência de vendas A + Score +20
- Se **"Produto B"** → Tag "interesse-produto-b" + Flow de demonstração + Score +20
- Se **"Serviço"** → Transferir para humano (equipe de vendas)
- Se **"Apenas olhando"** → Tag "browsing" + Sequência de nutrição

## Condições (Se/Senão)

A ação **Condição** permite criar ramificações lógicas na automação:

### Critérios de condição
- **Campo do contato** — Verificar status, fonte, e-mail, nome, etc.
- **Tag** — Verificar se o contato possui uma tag específica
- **Lead Score** — Comparar pontuação (maior que, menor que, igual a)
- **Resposta de enquete** — Agir baseado na resposta dada
- **Última interação** — Dias desde o último contato

### Operadores disponíveis
- Igual a / Diferente de
- Contém / Não contém
- Maior que / Menor que
- Existe / Não existe (campo preenchido ou vazio)

### Ações para cada resultado
Para **Verdadeiro** (condição atendida) e **Falso** (condição não atendida), defina ações:
- Adicionar/remover tag
- Ir para outro flow
- Enviar mensagem
- Parar automação
- Qualquer outra ação

### Exemplo de condição
**Condição**: Lead Score ≥ 70
- **Verdadeiro**: Notificar vendedor + Tag "lead-qualificado" + Criar tarefa "Ligar para lead"
- **Falso**: Inscrever em sequência de nutrição + Tag "lead-frio"

## Teste A/B (Split Test) inline

Dentro de automações, você pode dividir o fluxo para testar abordagens:

1. Adicione a ação **"Teste A/B"**
2. Defina a **porcentagem** de divisão (ex: 50/50, 70/30)
3. Configure ações diferentes para cada **variante**
4. Acompanhe as métricas de cada caminho

## Templates de automação

O sistema oferece templates prontos para cenários comuns:

- **Boas-vindas** — Envia mensagem de boas-vindas quando um contato é criado
- **Follow-up automático** — Envia follow-up X dias após último contato
- **Deal parado** — Notifica vendedor quando deal fica parado por mais de Y dias
- **Nutrição de leads** — Inscreve leads frios em sequência de nutrição
- **Recuperação de carrinho** — Envia mensagem quando carrinho é abandonado (via webhook Shopify)

## Execuções e histórico

Acompanhe todas as execuções de cada automação:

- **Data e hora** da execução
- **Contato** que disparou o gatilho
- **Evento** que iniciou (tag adicionada, deal criado, etc.)
- **Status** (sucesso, erro, em andamento)
- **Passos executados** — Quais ações foram realizadas
- **Erro** — Mensagem detalhada se algo falhou

## Boas práticas

- 🎯 **Comece simples** — Uma automação com 2-3 ações já gera valor
- 📊 **Monitore execuções** — Verifique se as automações estão funcionando
- 🔄 **Itere gradualmente** — Adicione complexidade conforme aprende
- 🏷️ **Use tags como ponte** — Tags conectam automações entre si
- 🧪 **Teste antes de ativar** — Crie um contato de teste para validar o fluxo
- 📝 **Nomeie claramente** — "Boas-vindas + Nutrição para leads de Facebook" é melhor que "Automação 1"
- ⏸️ **Desative se necessário** — Automações podem ser pausadas sem excluir

💡 **Dica**: Comece com automações simples e vá incrementando. Use enquetes para qualificar leads automaticamente e condições para personalizar a jornada.`,
  },
  {
    id: 'flow-builder',
    categoryId: 'marketing',
    title: 'Flow Builder Visual',
    icon: Workflow,
    description: 'Guia completo: construtor visual de funis estilo ManyChat para Instagram, WhatsApp e CRM.',
    readTime: '10 min',
    popular: true,
    content: `O Flow Builder é o construtor visual de automações do AG Sell, inspirado no ManyChat. Ele permite criar funis de automação de forma visual e intuitiva.

## Diferença entre Automações e Flow Builder

| Aspecto | Automações | Flow Builder |
|---------|-----------|--------------|
| Interface | Lista de ações sequenciais | Canvas visual com nós conectados |
| Visualização | Linear/texto | Gráfica/fluxograma |
| Complexidade | Simples a moderada | Moderada a complexa |
| Melhor para | Fluxos diretos | Funis com ramificações |

> Ambos podem ser combinados: uma Automação pode redirecionar para um Flow, e vice-versa.

## Visão geral

[screenshot:Flow Builder Visual|/flow-builder]

## Gerenciando seus fluxos

Ao acessar o Flow Builder, você vê a lista **"Meus Fluxos"** com todos os fluxos criados:

- Cada card mostra:
   - **Nome** do fluxo
   - **Gatilho** configurado (ícone + descrição)
   - **Número de ações** (nós) no fluxo
   - **Execuções** — Quantas vezes o fluxo foi disparado
   - **Status** — Ativo/Inativo
- Use o menu (⋮) de cada card para:
   - **Ativar/Desativar** o fluxo
   - **Editar** — Abrir no editor visual
   - **Duplicar** — Criar cópia do fluxo
   - **Excluir** — Remover o fluxo

Crie quantos fluxos quiser clicando em **"Novo Fluxo"**.

## Criando um fluxo passo a passo

### Passo 1: Escolha o gatilho

O primeiro passo é definir o que inicia seu fluxo. Os gatilhos são organizados por canal:

**📸 Instagram:**
- **Comentário em qualquer post** — Dispara quando alguém comenta em qualquer publicação
- **Comentário em post específico** — Filtra por post (via URL ou ID do post)
- **DM recebida** — Quando alguém envia mensagem direta
- **Resposta ao story (geral)** — Quando alguém responde qualquer story
- **Resposta a story específico** — Filtrado por URL ou ID do story
- **Menção em story** — Quando alguém menciona você em um story
- **Novo seguidor** — Quando alguém começa a seguir

**💬 WhatsApp:**
- **Mensagem recebida** — Qualquer mensagem
- **Palavra-chave específica** — Com modos de correspondência:
   - **Exata** — A mensagem inteira deve ser a palavra-chave
   - **Contém** — A mensagem deve conter a palavra-chave
   - **Inicia com** — A mensagem deve começar com a palavra-chave
- **Automação fonte** — Quando contato vem de automação específica
- **Origem da mensagem** — Filtra por tipo:
   - Campanha
   - Grupo
   - Broadcast
   - Mensagem direta

**📇 CRM:**
- **Novo contato criado** — Quando um contato é adicionado ao CRM
- **Formulário submetido** — Com seleção de formulário específico
- **Fonte do contato** — Filtra por origem:
   - Site
   - Anúncios (Facebook, Google)
   - Landing page
   - Indicação
   - Instagram
   - WhatsApp

### Passo 2: Adicione passos

Após definir o gatilho, adicione ações clicando no botão **"+"** entre os nós:

**Ações de mensagem:**
- 💬 **Enviar DM** — Responder via mensagem direta (Instagram/WhatsApp)
- 💬 **Responder comentário** — Responder ao comentário no post
- ✉️ **Enviar E-mail** — Enviar e-mail com assunto e conteúdo
- 📱 **Enviar WhatsApp** — Enviar mensagem de WhatsApp

**Ações de CRM:**
- 🏷️ **Adicionar Tag** — Aplicar tag ao contato
- 🏷️ **Remover Tag** — Remover tag do contato
- 📊 **Atualizar Lead Score** — Somar, subtrair ou definir pontuação
- 🔔 **Notificar equipe** — Enviar notificação para a equipe
- ✅ **Criar tarefa** — Criar tarefa vinculada ao contato

**Condições:**
- 🏷️ **Se tem tag** — Verificar presença de tag
- 🔤 **Se contém palavra-chave** — Verificar texto da mensagem
- 📊 **Se score ≥ valor** — Verificar pontuação do lead

**Espera:**
- ⏰ **Aguardar X minutos/horas/dias** — Pausar o fluxo antes de continuar

### Passo 3: Configure cada passo

Clique em qualquer nó para configurar seus parâmetros:

- **Mensagem a enviar** — Com suporte a variáveis: {{nome}}, {{email}}, {{empresa}}
- **Tag a adicionar/remover** — Seleção da lista de tags existentes
- **Palavra-chave a verificar** — Com modo de correspondência
- **Tempo de espera** — Em minutos, horas ou dias
- **Score a adicionar** — Valor positivo ou negativo
- **Tarefa** — Título, prazo e prioridade

### Passo 4: Salve e ative

1. Dê um **nome** ao seu fluxo (ex: "Funil Instagram Oferta Black Friday")
2. Ative o **switch** para que o fluxo comece a funcionar
3. Clique em **"Salvar Fluxo"**

## Editando fluxos existentes

1. Na lista "Meus Fluxos", clique em qualquer card
2. O editor visual abre com todos os nós e conexões
3. Faça as alterações desejadas
4. Clique em **"Atualizar Fluxo"** para salvar

## Exemplos de funis completos

### Funil Instagram → DM com qualificação
1. **Gatilho**: Comentário com palavra "QUERO" em post específico
2. **Ação**: Responder comentário "Mandei no DM! 🚀"
3. **Ação**: Enviar DM com oferta detalhada + link
4. **Ação**: Adicionar tag "interesse-instagram"
5. **Ação**: Atualizar score +20
6. **Espera**: 24 horas
7. **Condição**: Se tem tag "comprou" → Parar
8. **Ação**: Enviar DM de follow-up com urgência
9. **Espera**: 48 horas
10. **Condição**: Se score ≥ 50 → Notificar vendedor
11. **Ação**: Criar tarefa "Ligar para lead do Instagram"

### Funil WhatsApp de qualificação
1. **Gatilho**: Palavra-chave "INFO" (contém)
2. **Ação**: Enviar WhatsApp de boas-vindas + catálogo
3. **Ação**: Adicionar tag "lead-whatsapp"
4. **Ação**: Atualizar score +20
5. **Espera**: 30 minutos
6. **Condição**: Se respondeu → Tag "engajado" + Score +10
7. **Ação**: Criar tarefa "Follow-up em 48h"

### Funil CRM de onboarding
1. **Gatilho**: Formulário "Cadastro" submetido
2. **Ação**: Enviar e-mail de boas-vindas
3. **Ação**: Adicionar tag "onboarding"
4. **Espera**: 1 dia
5. **Ação**: Enviar WhatsApp "Tudo certo com o cadastro?"
6. **Espera**: 3 dias
7. **Ação**: Enviar e-mail com tutorial
8. **Ação**: Atualizar score +30

## Boas práticas

- 🎯 **Nomeie fluxos claramente** — "Funil Instagram Black Friday" > "Flow 1"
- 🧪 **Teste com contato fictício** antes de ativar
- ⏰ **Use esperas com moderação** — Muitas esperas podem fazer o contato esfriar
- 🔀 **Combine canais** — Instagram → WhatsApp → E-mail para máximo alcance
- 📊 **Monitore execuções** — Verifique se os fluxos estão disparando corretamente

💡 **Dica**: Combine o Flow Builder com enquetes das Automações para criar funis de qualificação interativos e altamente personalizados.`,
  },
  {
    id: 'sequences',
    categoryId: 'marketing',
    title: 'Sequências (Drip Campaigns)',
    icon: ListChecks,
    description: 'Guia completo: criar sequências de nutrição, configurar passos, inscrever contatos e boas práticas.',
    readTime: '6 min',
    content: `As Sequências permitem criar campanhas de nutrição com envios automáticos em intervalos programados — o famoso "drip marketing".

## O que são Sequências?

São séries de mensagens (e-mail, WhatsApp, SMS) enviadas automaticamente em intervalos configuráveis. Diferente de automações que reagem a eventos, sequências seguem um **cronograma fixo** após a inscrição.

### Casos de uso ideais
- 📧 **Nutrição de leads** — Sequência de 7 e-mails educativos ao longo de 30 dias
- 👋 **Onboarding** — Série de boas-vindas para novos clientes
- 🔄 **Follow-up pós-venda** — Mensagens de acompanhamento após compra
- 📚 **Curso por e-mail** — Aulas enviadas semanalmente
- 🎯 **Reengajamento** — Sequência para contatos inativos

## Criando uma Sequência

1. Acesse **"Sequências"** no menu lateral
2. Clique em **"Nova Sequência"**
3. Defina:
   - **Nome** — Identificação clara (ex: "Nutrição Lead Frio - 14 dias")
   - **Descrição** — Objetivo da sequência
4. Adicione **passos** (mensagens)
5. **Ative** a sequência

## Configurando passos

Cada passo da sequência define:

### Canal de envio
- ✉️ **E-mail** — Defina assunto e conteúdo HTML
- 💬 **WhatsApp** — Defina texto da mensagem
- 📱 **SMS** — Defina texto do SMS

### Conteúdo da mensagem
- Texto com variáveis dinâmicas: {{nome}}, {{email}}, {{empresa}}
- Formatação rica para e-mails
- Emojis e formatação WhatsApp para mensagens

### Delay (intervalo)
- Tempo de espera **antes** do envio deste passo
- Configurável em: **minutos**, **horas** ou **dias**
- Exemplo: Passo 1 (imediato) → Passo 2 (2 dias) → Passo 3 (5 dias) → Passo 4 (7 dias)

### Exemplo de sequência

| Passo | Delay | Canal | Conteúdo |
|-------|-------|-------|----------|
| 1 | Imediato | E-mail | Boas-vindas + links úteis |
| 2 | 2 dias | WhatsApp | "Já conferiu nosso material?" |
| 3 | 5 dias | E-mail | Case de sucesso de cliente |
| 4 | 7 dias | WhatsApp | Oferta especial com deadline |
| 5 | 10 dias | E-mail | Último lembrete + urgência |

## Inscrevendo contatos

Contatos podem ser inscritos em sequências de três formas:

### 1. Manualmente
1. Acesse a lista de contatos
2. Selecione os contatos desejados
3. Use a ação "Inscrever em sequência"
4. Selecione a sequência

### 2. Via Automação
- Na criação de automações, use a ação **"Inscrever em Sequência"**
- Selecione a sequência de destino
- O contato que disparou a automação será inscrito automaticamente

### 3. Via Flow Builder
- Adicione um nó de ação **"Inscrever em Sequência"** no fluxo visual

## Removendo contatos

Contatos podem ser removidos de sequências:
- **Manualmente** — Acesse a sequência e remova o contato
- **Via Automação** — Use a ação "Remover de Sequência"
- **Automaticamente** — Configure condições de saída (ex: se comprou, sair da sequência)

## Boas práticas

- 📅 **Planeje o cronograma** antes de criar — Defina quantos passos e intervalos
- ✍️ **Personalize o conteúdo** — Use {{nome}} e referências ao contexto
- 🎯 **Segmente** — Crie sequências diferentes para perfis diferentes
- 📊 **Monitore métricas** — Aberturas, cliques, respostas
- 🔀 **Combine canais** — Alterne entre e-mail e WhatsApp para melhor engajamento
- ⏹️ **Defina condições de saída** — Remova contatos que já converteram

💡 **Dica**: Combine sequências com Lead Scoring para criar jornadas inteligentes. Contatos com score alto saem da sequência de nutrição e vão para abordagem direta.`,
  },
  {
    id: 'whatsapp-flows',
    categoryId: 'marketing',
    title: 'WhatsApp Flows',
    icon: ListChecks,
    description: 'Guia completo: formulários interativos dentro do WhatsApp para coleta de dados.',
    readTime: '4 min',
    content: `WhatsApp Flows são formulários interativos enviados diretamente no WhatsApp, permitindo coletar dados estruturados sem que o contato precise acessar links externos.

## O que são Flows?

São formulários que o contato preenche **dentro do próprio WhatsApp**, nativamente. Diferente de enviar um link para um formulário web, os Flows oferecem experiência nativa com campos interativos.

## Criando um Flow

1. Acesse **"WhatsApp Flows"** no menu lateral
2. Clique em **"Novo Flow"**
3. Configure:
   - **Nome** — Identificação interna
   - **Descrição** — Para que serve este flow
4. Monte o formulário com o **builder visual**
5. Adicione campos conforme necessário
6. **Salve** e **publique**

[screenshot:Builder de WhatsApp Flows|/whatsapp-flows]

## Tipos de campos disponíveis

- **Texto** — Resposta livre (nome, e-mail, endereço)
- **Seleção** — Lista de opções (plano de interesse, como conheceu)
- **Data** — Seletor de data nativo (data de nascimento, agendamento)
- **Número** — Apenas números (telefone, quantidade, CPF)

## Visualizando submissões

1. Na lista de Flows, clique no flow desejado
2. Acesse a aba **"Submissões"**
3. Visualize todas as respostas recebidas com:
   - Nome do contato
   - Data e hora da submissão
   - Todos os campos preenchidos
4. Os dados são automaticamente **vinculados ao contato** no CRM

## Uso em automações

Flows podem ser integrados com automações:
- Use como **ação** em automações para solicitar dados
- As respostas podem **disparar gatilhos** de outras automações
- Dados coletados podem ser usados em **condições** para ramificação

## Boas práticas

- 📝 **Seja breve** — Formulários curtos têm maior taxa de conclusão
- 🎯 **Peça só o essencial** — Não peça dados desnecessários
- 📱 **Teste no celular** — Verifique como o flow aparece no WhatsApp
- 🔄 **Use com automações** — Automatize ações baseadas nas respostas

💡 **Dica**: WhatsApp Flows são ideais para agendamentos, pesquisas rápidas e qualificação de leads diretamente no WhatsApp.`,
  },
  {
    id: 'lead-scoring',
    categoryId: 'marketing',
    title: 'Lead Scoring',
    icon: Target,
    description: 'Guia completo: criar regras de pontuação, classificação automática e uso em automações.',
    readTime: '6 min',
    content: `O Lead Scoring atribui pontos aos contatos automaticamente baseado em suas ações e engajamento, permitindo identificar os leads mais qualificados.

## Como funciona

Cada ação do lead no sistema gera pontos (positivos ou negativos). A pontuação acumulada indica o **nível de interesse e engajamento** do lead.

### Exemplos de pontuação padrão
- **+10** — Abriu e-mail
- **+15** — Visitou formulário
- **+20** — Clicou em link do e-mail
- **+25** — Respondeu mensagem de WhatsApp
- **+30** — Interagiu no Instagram (DM, comentário)
- **+50** — Submeteu formulário de captura
- **+50** — Respondeu enquete de qualificação
- **-10** — Não abriu e-mail em 30 dias
- **-20** — Não respondeu mensagem em 14 dias

## Classificação automática

Os leads são classificados automaticamente baseado na pontuação:

- 🟢 **Qualificado (Hot)** — 70 pontos ou mais → Pronto para abordagem de vendas
- 🟡 **Morno (Warm)** — Entre 40 e 69 pontos → Precisa de mais nutrição
- 🔴 **Frio (Cold)** — Menos de 40 pontos → Ainda não está engajado

[screenshot:Configuração de regras de Lead Scoring|/lead-scoring]

## Configurando regras

1. Acesse **"Lead Scoring"** no menu lateral
2. Clique em **"Nova Regra"**
3. Configure:
   - **Nome** — Descrição da regra (ex: "Abriu e-mail de campanha")
   - **Tipo de evento** — Selecione o evento que aciona a regra
   - **Pontos** — Valor positivo ou negativo
   - **Condições adicionais** — Filtros opcionais
4. **Ative** a regra

### Tipos de eventos disponíveis
- E-mail aberto / clicado
- WhatsApp recebido / respondido
- Instagram — DM / comentário / follow
- Formulário submetido
- Deal criado / movido / ganho
- Tag adicionada / removida
- Inatividade (sem interação por X dias)

## Onde o score aparece

O Lead Score é exibido em múltiplos lugares:

- **Inbox** — Ao lado do nome do contato no chat, permitindo priorizar atendimentos
- **Ficha do contato** — Na seção de informações, com indicador visual de cor
- **Filtros de contatos** — Filtre por faixa de pontuação
- **Tabela de contatos** — Coluna de score ordenável
- **Pipeline** — Nos cards de deals vinculados a contatos

## Usando Lead Score em automações

O score é uma ferramenta poderosa para automações:

### Como gatilho
- "Quando score atingir 70" → Notificar vendedor
- "Quando score cair abaixo de 20" → Inscrever em reengajamento

### Como condição
- "Se score ≥ 50" → Enviar proposta comercial
- "Se score < 30" → Enviar conteúdo educativo

### Como ação
- "Adicionar +20 ao score" → Quando submeteu formulário
- "Definir score para 0" → Quando foi marcado como desqualificado

## Boas práticas

- 📊 **Revise as regras periodicamente** — Ajuste pontuações baseado em resultados reais
- 🎯 **Não inflacione scores** — Pontuações altas demais perdem significado
- ⚖️ **Balance positivos e negativos** — Inatividade deve reduzir o score
- 📈 **Use como critério de priorização** — Leads com score alto primeiro
- 🤖 **Automatize ações** baseadas em faixas de score
- 📋 **Documente as regras** para a equipe entender o significado de cada faixa

💡 **Dica**: Use o score como gatilho em automações. Exemplo: quando um lead atingir 70 pontos, crie automaticamente uma tarefa para o vendedor ligar.`,
  },
  {
    id: 'forms',
    categoryId: 'marketing',
    title: 'Formulários de captura',
    icon: FileText,
    description: 'Guia completo: criar formulários, editor de campos, estilos, templates e integrações.',
    readTime: '5 min',
    content: `Crie formulários personalizados para capturar leads em seu site, landing pages ou compartilhados por WhatsApp e e-mail.

## Visão geral

Na página de **Formulários**, você encontra:
- Lista de todos os formulários criados
- Contagem de submissões por formulário
- Status (ativo/inativo)
- Link público de cada formulário

[screenshot:Página de Formulários|/forms]

## Criando um formulário

### 1. Informações básicas
1. Clique em **"Novo Formulário"**
2. Defina:
   - **Nome** — Identificação interna (ex: "Cadastro Newsletter")
   - **Descrição** — Texto exibido ao visitante sobre o formulário

### 2. Adicionando campos
Use o **editor visual** de campos:

- **Nome** — Campo de texto para nome
- **E-mail** — Com validação de formato
- **Telefone** — Com máscara e DDI internacional
- **WhatsApp** — Número de WhatsApp
- **Texto livre** — Resposta aberta
- **Seleção** — Dropdown com opções
- **Caixa de seleção** — Checkbox (ex: "Aceito os termos")
- **Campos personalizados** — Qualquer campo adicional

Para cada campo, configure:
- **Rótulo** — Texto visível (ex: "Seu nome completo")
- **Placeholder** — Texto de exemplo dentro do campo
- **Obrigatório** — Se o campo deve ser preenchido
- **Ordem** — Posição na lista de campos

### 3. Estilização
Personalize a aparência do formulário:
- **Cores** — Fundo, texto, botão
- **Botão de envio** — Texto e cor
- **Texto de sucesso** — Mensagem após submissão
- **Redirecionamento** — URL para redirecionar após envio

### 4. Templates
Use templates prontos como ponto de partida:
- Cadastro básico (nome + e-mail)
- Contato comercial (nome + e-mail + telefone + mensagem)
- Newsletter (e-mail)
- Agendamento (nome + telefone + data)

## Compartilhando formulários

Cada formulário tem um **link público único**:

1. Copie o link do formulário
2. Compartilhe por:
   - **Site/Landing page** — Incorpore via iframe ou link
   - **WhatsApp** — Envie o link em mensagens
   - **E-mail** — Inclua em campanhas
   - **Redes sociais** — Publique em posts e stories
   - **QR Code** — Gere um QR Code com o link
   - **Anúncios** — Use como URL de destino

## Submissões

Quando alguém preenche o formulário:

1. Um **contato é criado automaticamente** no CRM (se não existir)
2. Se o contato já existir (pelo e-mail), os dados são **atualizados**
3. A submissão é registrada na aba **"Submissões"** do formulário
4. Tags configuradas são **aplicadas automaticamente**
5. **Automações** com gatilho "Formulário submetido" são disparadas

## Integrações com automações

Formulários se integram com todo o ecossistema:

- **Gatilho de automação** — "Quando formulário X for submetido"
- **Gatilho de Flow** — "Quando formulário for submetido"
- **Lead Score** — Submissão pode somar pontos automaticamente
- **Tags** — Aplique tags automaticamente aos contatos que preencherem

## Boas práticas

- 📝 **Peça o mínimo necessário** — Menos campos = mais submissões
- 🎨 **Personalize as cores** — Combine com a identidade visual do seu site
- ✅ **Use campos obrigatórios** com moderação — Apenas para dados essenciais
- 📊 **Monitore submissões** — Taxas de abandono indicam problemas
- 🔗 **Combine com automações** — Formulário → Tag → Sequência de nutrição

💡 **Dica**: Formulários com 3-5 campos têm as maiores taxas de conversão. Peça mais dados gradualmente após o primeiro contato.`,
  },
  {
    id: 'ab-tests',
    categoryId: 'marketing',
    title: 'Testes A/B',
    icon: SplitSquareVertical,
    description: 'Guia completo: criar testes, comparar variantes, métricas e boas práticas para otimização.',
    readTime: '4 min',
    content: `Os Testes A/B permitem comparar duas versões de uma mensagem para descobrir qual tem melhor desempenho e otimizar suas comunicações.

## Como funciona

1. Você cria **duas versões** (variante A e variante B) de uma mensagem
2. O sistema envia **metade para cada variante** (ou proporção customizada)
3. As métricas são coletadas automaticamente
4. O sistema identifica o **vencedor** baseado nos resultados

## Criando um teste

1. Acesse **"Testes A/B"** no menu lateral
2. Clique em **"Novo Teste"**
3. Configure:
   - **Nome** — Identificação do teste (ex: "Teste assunto e-mail Black Friday")
   - **Canal** — WhatsApp, E-mail ou Instagram
4. Crie a **Variante A** — Primeira versão da mensagem
5. Crie a **Variante B** — Segunda versão (altere apenas UMA variável)
6. Defina os **destinatários**
7. Clique em **"Iniciar Teste"**

## Métricas coletadas

O sistema acompanha automaticamente:

- **Envios** — Quantidade enviada de cada variante
- **Aberturas** (e-mail) — Taxa de abertura de cada versão
- **Respostas** — Taxa de resposta de cada variante
- **Cliques** — Taxa de cliques em links
- **Conversões** — Conversões geradas por cada variante
- **Vencedor** — Variante com melhor performance geral

## O que testar

### Em e-mails
- **Assunto** — Diferente redação do assunto
- **CTA** — Texto do botão ("Comprar agora" vs "Ver oferta")
- **Layout** — Com imagem vs sem imagem
- **Horário** — Manhã vs tarde

### Em WhatsApp
- **Texto** — Abordagem formal vs informal
- **Emoji** — Com vs sem emojis
- **Extensão** — Mensagem curta vs detalhada
- **CTA** — Diferentes chamadas para ação

### Em Instagram
- **DM** — Diferentes aberturas
- **Resposta a comentário** — Diferentes textos de resposta

## Testes A/B em automações (inline)

Além de testes independentes, você pode usar **Split Tests** dentro de automações:

1. Na criação de automação, adicione a ação **"Teste A/B"**
2. Configure a porcentagem de divisão (ex: 50/50, 70/30)
3. Defina ações diferentes para cada caminho
4. Monitore qual caminho gera mais resultado

## Boas práticas

- 🔬 **Teste UMA variável por vez** — Se mudar assunto E conteúdo, não saberá o que causou a diferença
- 📊 **Aguarde volume** — Pelo menos 100 envios por variante para resultados confiáveis
- 🏆 **Use o vencedor** — Aplique o aprendizado nas próximas comunicações
- 🔄 **Teste continuamente** — Sempre há espaço para otimização
- 📝 **Documente resultados** — Crie um banco de aprendizados para a equipe

💡 **Dica**: Testes A/B também estão disponíveis como ação inline dentro de automações (Split Test), permitindo testar caminhos completos, não apenas mensagens.`,
  },
  {
    id: 'growth-tools',
    categoryId: 'marketing',
    title: 'Growth Tools',
    icon: Megaphone,
    description: 'Guia completo: links de captura, QR Codes, widgets para site e métricas de conversão.',
    readTime: '5 min',
    content: `Growth Tools são ferramentas de captura de leads projetadas para atrair contatos para o seu WhatsApp e CRM de forma automatizada.

## Tipos de ferramentas

### 🔗 Links de captura

Gere links personalizados que iniciam conversa no WhatsApp:

1. Acesse **"Growth Tools"** no menu lateral
2. Clique em **"Novo Growth Tool"**
3. Selecione **"Link"**
4. Configure:
   - **Nome** — Identificação interna
   - **Número de WhatsApp** — Para qual número direcionar
   - **Mensagem pré-preenchida** — Texto que aparece pronto para enviar (ex: "Olá! Vi sua oferta e quero saber mais.")
5. Copie o link gerado

**Como funciona:**
- O visitante clica no link
- O WhatsApp abre com a mensagem pré-preenchida
- Ao enviar, o contato é criado automaticamente no CRM
- Automações configuradas são disparadas

**Onde usar:**
- Bio do Instagram
- Posts em redes sociais
- E-mails
- Assinatura de e-mail
- Anúncios pagos

### 📱 QR Codes

Gere QR Codes dinâmicos vinculados ao seu WhatsApp:

1. Crie um Growth Tool do tipo **"QR Code"**
2. Configure número, mensagem e nome
3. O QR Code é gerado automaticamente
4. Baixe em alta resolução para uso impresso

**Onde usar:**
- Materiais impressos (folhetos, cartões)
- Vitrines e pontos de venda
- Eventos e feiras
- Apresentações
- Embalagens de produtos

### 🖥️ Widgets para site

Botões flutuantes de WhatsApp para incorporar no seu site:

1. Crie um Growth Tool do tipo **"Widget"**
2. Configure:
   - **Cores** — Combine com seu site
   - **Posição** — Canto inferior direito ou esquerdo
   - **Mensagem** — Texto de abertura
   - **Ícone** — WhatsApp ou personalizado
3. Copie o **código embed** (HTML/JavaScript)
4. Cole no seu site

## Métricas

Cada ferramenta rastreia automaticamente:

- **Cliques** — Quantas vezes foi acessada/escaneada
- **Conversões** — Contatos gerados (que efetivamente enviaram mensagem)
- **Taxa de conversão** — Cliques ÷ Conversões

## Integração com automações

Growth Tools se conectam ao ecossistema:
- Contatos capturados podem **disparar automações**
- Tags podem ser **aplicadas automaticamente** ao contato gerado
- O contato entra no **pipeline** automaticamente

## Boas práticas

- 🎯 **Uma ferramenta por campanha** — Para medir performance de cada canal
- 📝 **Personalize a mensagem** — Contextualize com a campanha/oferta
- 📊 **Compare performance** — Identifique quais canais geram mais leads
- 🔄 **Combine com automações** — Novos contatos devem entrar em fluxos de nutrição

💡 **Dica**: Use Growth Tools com automações para que novos contatos entrem automaticamente em fluxos de nutrição e qualificação.`,
  },

  // =====================================================
  // INTELIGÊNCIA E ANALYTICS
  // =====================================================
  {
    id: 'analytics',
    categoryId: 'intelligence',
    title: 'Analytics e relatórios',
    icon: BarChart3,
    description: 'Guia completo: dashboards de vendas, pipeline, equipe, filtros e como usar os dados.',
    readTime: '6 min',
    content: `O módulo de Analytics oferece dashboards completos para análise do seu negócio, com métricas de vendas, pipeline e performance da equipe.

## Visão geral do Analytics

[screenshot:Dashboard de Analytics|/analytics]

O Analytics é dividido em seções de métricas:

## Métricas de vendas

### Receita
- **Receita total** — Soma dos valores de deals ganhos
- **Receita por período** — Mensal, trimestral, anual
- **Evolução** — Gráfico de linha mostrando tendência
- **Comparação** — Período atual vs anterior (% de crescimento)

### Conversão
- **Taxa de conversão geral** — Deals ganhos ÷ Deals criados
- **Taxa por etapa** — Conversão entre cada fase do pipeline
- **Funil de conversão** — Visualização da perda em cada etapa

### Ticket médio
- **Valor médio por deal** — Receita total ÷ Número de deals ganhos
- **Evolução do ticket** — Tendência ao longo do tempo

## Métricas de pipeline

### Distribuição por etapa
- **Gráfico de barras** — Quantidade de deals em cada coluna
- **Valor por etapa** — Soma dos valores em cada fase
- **Tempo médio** — Quanto tempo deals permanecem em cada etapa

### Gargalos
- **Etapas com mais deals parados** — Identifique onde as negociações travam
- **Deals antigos** — Negociações paradas há muito tempo
- **Taxa de perda por etapa** — Onde deals são mais frequentemente perdidos

## Métricas de equipe

### Performance individual
- **Deals por membro** — Quantidade de negócios atribuídos e ganhos
- **Receita por membro** — Valor gerado por cada vendedor
- **Ranking** — Classificação dos top performers
- **Atividades** — Quantidade de ações realizadas (mensagens, tarefas, etc.)

### Tempo de resposta
- **Média da equipe** — Tempo médio de resposta às mensagens
- **Por membro** — Comparação individual
- **Evolução** — Tendência ao longo do tempo

## Filtros disponíveis

Filtre todas as métricas por:

- **Período** — Hoje, esta semana, este mês, trimestre, ano, personalizado
- **Membro da equipe** — Performance individual
- **Etapa do pipeline** — Foco em uma fase específica
- **Tags** — Segmentos específicos de contatos
- **Canal** — Métricas por canal de comunicação

## Como usar os dados

### Reuniões semanais
1. Abra o Analytics com filtro "Esta semana"
2. Revise receita e deals ganhos
3. Identifique deals parados no pipeline
4. Compare performance da equipe
5. Defina ações para a próxima semana

### Diagnóstico de problemas
- **Receita caindo?** → Analise a taxa de conversão por etapa
- **Muitos leads frios?** → Revise as fontes e Lead Scoring
- **Pipeline parado?** → Identifique a etapa gargalo
- **Equipe desigual?** → Redistribua leads e ofereça treinamento

### Previsão de receita
- Use o valor total do pipeline × probabilidade média para prever receita
- Analise a taxa de conversão histórica para projeções mais precisas

## Boas práticas

- 📊 **Consulte semanalmente** — Dados só geram valor se usados
- 🎯 **Defina metas baseadas em dados** — Use histórico para metas realistas
- 🔍 **Investigue anomalias** — Picos ou quedas merecem atenção
- 📈 **Compare períodos** — Identifique sazonalidades e tendências
- 👥 **Compartilhe com a equipe** — Transparência motiva performance

💡 **Dica**: Acompanhe o Analytics semanalmente para identificar tendências e ajustar sua estratégia antes que problemas se agravem.`,
  },
  {
    id: 'ai-assistant',
    categoryId: 'intelligence',
    title: 'Assistente IA',
    icon: Bot,
    description: 'Guia completo: chat com IA contextual, tipos de perguntas, análises e sugestões.',
    readTime: '4 min',
    content: `O Assistente IA é um chat inteligente integrado ao seu CRM que pode responder perguntas, gerar textos e fornecer insights baseados nos dados do seu negócio.

## O que ele pode fazer

### 📊 Análise de dados
- Resumir métricas do período (receita, deals, contatos)
- Identificar tendências de vendas
- Comparar performance entre períodos
- Apontar gargalos no pipeline

### 💡 Sugestões estratégicas
- Sugerir próximos passos para deals específicos
- Recomendar ações para leads frios
- Propor estratégias de follow-up
- Indicar melhores horários para contato

### ✍️ Geração de conteúdo
- Redigir e-mails de follow-up personalizados
- Criar textos para campanhas de WhatsApp
- Gerar respostas para mensagens de clientes
- Criar descrições para formulários e landing pages

### 📋 Resumos e relatórios
- Resumir atividades da semana/mês
- Listar tarefas pendentes importantes
- Destacar deals que precisam de atenção
- Resumir interações com um contato específico

[screenshot:Chat com o Assistente IA|/ai-assistant]

## Como usar

1. Acesse **"Assistente IA"** no menu lateral
2. Digite sua pergunta ou pedido no campo de chat
3. A IA processa sua solicitação e responde
4. Continue a conversa para aprofundar ou refinar

## Exemplos de perguntas úteis

### Vendas
- "Quais deals estão parados há mais de 7 dias?"
- "Qual foi minha taxa de conversão este mês?"
- "Quanto de receita geramos na última semana?"
- "Quais são os top 5 deals por valor?"

### Conteúdo
- "Sugira um e-mail de follow-up para o lead que pediu proposta"
- "Escreva uma mensagem de boas-vindas para novos contatos do Instagram"
- "Crie um texto de recuperação para leads inativos há 30 dias"
- "Redija uma resposta educada para a reclamação do cliente"

### Estratégia
- "Qual canal gera mais conversões?"
- "Resuma as atividades da equipe esta semana"
- "Que automações poderiam ajudar a aumentar conversões?"
- "Sugira melhorias para o processo de vendas"

## Contexto do CRM

> O Assistente tem acesso ao contexto do seu CRM para fornecer respostas relevantes e personalizadas. Ele conhece seus contatos, deals, automações e métricas.

## Modelos de IA disponíveis

O Assistente utiliza modelos de IA de última geração, incluindo:
- Modelos Google Gemini para análise multimodal
- Modelos OpenAI GPT para geração de texto

## Boas práticas

- 🎯 **Seja específico** — "Quais deals de valor acima de R$5.000 estão na etapa Proposta?" > "Como estão as vendas?"
- 📝 **Peça em partes** — Para solicitações complexas, divida em perguntas menores
- ✅ **Revise as respostas** — A IA pode errar, especialmente com dados numéricos
- 🔄 **Itere** — Refine pedidos na mesma conversa para resultados melhores

💡 **Dica**: Use o Assistente IA como "segundo cérebro" para análises rápidas e geração de conteúdo. Ele economiza tempo em tarefas que levariam minutos ou horas manualmente.`,
  },
  {
    id: 'ai-agents',
    categoryId: 'intelligence',
    title: 'Agentes de IA',
    icon: Brain,
    description: 'Guia completo: criar agentes autônomos, base de conhecimento (RAG), canais e métricas.',
    readTime: '7 min',
    content: `Agentes de IA são assistentes virtuais autônomos que podem atender seus clientes automaticamente em múltiplos canais, usando Inteligência Artificial com base de conhecimento personalizada.

## Diferença entre Assistente IA e Agentes IA

| Aspecto | Assistente IA | Agentes IA |
|---------|--------------|------------|
| Público | Equipe interna | Clientes/leads |
| Acesso | Via menu do AG Sell | Via WhatsApp, E-mail, Chat |
| Conhecimento | Dados do CRM | Base de conhecimento personalizada |
| Interação | Você pergunta | O cliente pergunta |

## Criando um agente

1. Acesse **"Agentes IA"** no menu lateral
2. Clique em **"Novo Agente"**
3. Configure:
   - **Nome** — Nome do agente (ex: "Ana - Atendente Virtual")
   - **Descrição** — Breve descrição do propósito
   - **Avatar** — Imagem de perfil do agente (opcional)

[screenshot:Página de Agentes de IA|/ai-agents]

### Configuração da IA

4. **Modelo de IA** — Selecione o modelo:
   - Modelos mais rápidos para respostas simples
   - Modelos mais potentes para raciocínio complexo
5. **Prompt de sistema** — Define a personalidade e regras do agente:
   - Quem ele é e como deve se comportar
   - Tom de voz (formal, informal, amigável)
   - O que pode e não pode responder
   - Instruções para situações específicas
6. **Temperatura** — Controle de criatividade (0 = previsível, 1 = criativo)
7. **Mensagem de boas-vindas** — Primeira mensagem quando alguém inicia conversa
8. **Mensagem de fallback** — Quando o agente não sabe responder

### Exemplo de prompt de sistema

> Você é Ana, assistente virtual da Empresa X. Seu papel é: responder dúvidas sobre produtos e serviços, ajudar com informações de preços e planos, agendar reuniões com a equipe de vendas e resolver dúvidas frequentes. Regras: seja sempre educada e profissional, se não souber a resposta transfira para um humano, nunca invente informações sobre produtos, responda em português do Brasil.

## Base de conhecimento (RAG)

Alimente o agente com informações do seu negócio:

1. Na aba **"Conhecimento"** do agente
2. Clique em **"Adicionar Documento"**
3. Configure:
   - **Título** — Nome do documento
   - **Tipo** — FAQ, Documento, Política, Tutorial
   - **Conteúdo** — Cole o texto com as informações
4. O agente usará esse conteúdo como referência para responder

### O que incluir na base de conhecimento
- **FAQ** — Perguntas frequentes e respostas
- **Produtos/Serviços** — Descrições, preços, características
- **Políticas** — Trocas, devoluções, garantia
- **Tutoriais** — Como usar produtos ou serviços
- **Informações da empresa** — Horário, localização, contato

> O RAG (Retrieval Augmented Generation) permite que o agente busque informações relevantes na base de conhecimento antes de responder, garantindo respostas precisas e baseadas em fatos.

## Canais de atuação

Defina onde o agente deve atuar:

- **WhatsApp** — Responde mensagens recebidas automaticamente
- **E-mail** — Responde e-mails com base no conhecimento
- **Chat do site** — Via widget integrado

Selecione um ou mais canais na configuração do agente.

## Transferência para humano

Configure quando o agente deve transferir para um atendente humano:

- Quando não souber responder (fallback)
- Quando o cliente solicitar explicitamente
- Quando detectar frustração ou urgência
- Para assuntos que exigem decisão humana (ex: negociação)

A transferência aparece no **Inbox** para a equipe continuar o atendimento.

## Métricas do agente

Acompanhe a performance do agente:

- **Total de conversas** — Quantas interações o agente teve
- **Taxa de satisfação** — Baseada em feedback dos contatos
- **Transferências para humanos** — Quantas vezes precisou escalar
- **Tempo médio de resposta** — Velocidade de resposta do agente
- **Taxa de resolução** — Percentual de questões resolvidas sem humano

## Boas práticas

- 📚 **Alimente a base de conhecimento** — Quanto mais conteúdo relevante, melhores as respostas
- 🧪 **Teste exaustivamente** — Simule conversas antes de ativar em produção
- 📝 **Refine o prompt** — Ajuste o tom e as regras baseado em conversas reais
- 🔄 **Atualize periodicamente** — Mantenha a base de conhecimento atual
- 📊 **Monitore métricas** — Altas taxas de transferência indicam lacunas no conhecimento
- 🎯 **Comece simples** — Um agente de FAQ é mais fácil de configurar e já gera valor

💡 **Dica**: Comece com um agente de FAQ que responde dúvidas comuns. Isso libera sua equipe para atendimentos mais complexos e reduz o tempo de resposta.`,
  },
  {
    id: 'gamification',
    categoryId: 'intelligence',
    title: 'Gamificação',
    icon: Trophy,
    description: 'Guia completo: sistema de pontos, níveis, ranking, conquistas e como motivar a equipe.',
    readTime: '4 min',
    content: `A Gamificação transforma atividades de vendas em um jogo motivacional, incentivando a equipe a bater metas e manter o CRM atualizado.

## Como funciona

Cada ação no sistema gera **pontos de experiência (XP)**:

### Pontuação por ação
- 📇 Criar contato: **+10 XP**
- 🏢 Criar empresa: **+15 XP**
- 💰 Criar deal: **+20 XP**
- 🏆 Fechar deal (ganho): **+50 XP**
- ✅ Completar tarefa: **+20 XP**
- ✉️ Enviar campanha de e-mail: **+30 XP**
- 💬 Enviar mensagem no inbox: **+5 XP**
- 🤖 Criar automação: **+25 XP**
- 📝 Criar formulário: **+15 XP**

> Os XP são acumulados individualmente por membro da equipe.

## Níveis

Conforme acumula XP, você progride por níveis:

- 🥉 **Bronze** — 0 a 499 XP
- 🥈 **Prata** — 500 a 1.499 XP
- 🥇 **Ouro** — 1.500 a 3.999 XP
- 💎 **Diamante** — 4.000+ XP

Cada nível traz um **badge visual** exibido no perfil do membro.

## Ranking

Compare o desempenho com os colegas:

- 🏅 **Ranking semanal** — Reset toda semana para nova competição
- 📊 **Ranking mensal** — Visão de longo prazo
- 🏆 **Top performers** — Destaque visual para os primeiros colocados
- 📈 **Evolução** — Gráfico de XP ao longo do tempo

[screenshot:Módulo de Gamificação|/gamification]

## Conquistas (Achievements)

Desbloqueie conquistas especiais por marcos alcançados:

- 🎯 **"Primeiro Deal"** — Feche seu primeiro negócio
- 🚀 **"Máquina de Vendas"** — Feche 10 deals em um mês
- 💬 **"Comunicador"** — Envie 100 mensagens no inbox
- 📧 **"Email Master"** — Crie 5 campanhas de e-mail
- 🤖 **"Automator"** — Crie 3 automações
- 📇 **"Networking"** — Cadastre 50 contatos
- ⚡ **"Velocista"** — Responda 10 mensagens em menos de 2 minutos

## Widget de gamificação

O widget de gamificação aparece no dashboard mostrando:
- Seu **nível atual** e progresso para o próximo
- **XP total** acumulado
- **Posição no ranking**
- **Última conquista** desbloqueada
- **Barra de progresso** até o próximo nível

## Benefícios para a gestão

- 📊 **Visibilidade** — Veja quem está mais ativo no CRM
- 🎯 **Motivação** — Competição saudável entre a equipe
- 📈 **Adoção** — Incentiva o uso completo da plataforma
- 🏆 **Reconhecimento** — Destaque para top performers

## Boas práticas

- 🏅 **Celebre conquistas** — Reconheça publicamente os top performers
- 🔄 **Mantenha a competição** — Rankings semanais mantêm o engajamento
- 🎯 **Combine com metas** — XP complementa, não substitui metas de vendas
- 📊 **Use como indicador** — Baixo XP pode indicar baixo uso da ferramenta

💡 **Dica**: A gamificação é mais eficaz quando toda a equipe participa. Encoraje todos a usar o CRM diariamente e acompanhem o ranking juntos.`,
  },

  // =====================================================
  // CONFIGURAÇÕES
  // =====================================================
  {
    id: 'organization',
    categoryId: 'settings',
    title: 'Organização e equipe',
    icon: Building2,
    description: 'Guia completo: configurar organização, convidar membros, papéis e gerenciamento.',
    readTime: '5 min',
    content: `Gerencie os dados da sua organização e equipe de forma centralizada.

## Perfil da organização

1. Acesse **"Organização"** no menu lateral
2. Configure:
   - **Nome** — Nome da empresa/organização
   - **Logo** — Upload de imagem (200x200px, PNG/JPG recomendado)
   - **Slug** — URL única da organização (usado internamente)
3. Clique em **"Salvar"**

[screenshot:Configurações da Organização|/organization]

> O logo aparece no cabeçalho da plataforma, formulários públicos e relatórios. Use uma imagem de boa qualidade.

## Membros da equipe

### Convidando membros
1. Na página de Organização, vá para a seção **"Membros"**
2. Clique em **"Convidar membro"**
3. Insira o **e-mail** do colaborador
4. Selecione o **papel**:
   - **Owner** — Proprietário da organização (apenas 1)
   - **Admin** — Acesso administrativo completo
   - **Membro** — Acesso controlado por permissões
5. O convite é enviado automaticamente por e-mail
6. O membro aceita o convite e acessa a organização

### Gerenciando membros
- **Alterar papel** — Mude o papel de qualquer membro
- **Remover membro** — Desvincula o membro da organização
- **Ver último acesso** — Quando o membro acessou pela última vez

### Papéis e diferenças

| Permissão | Owner | Admin | Membro |
|-----------|-------|-------|--------|
| Visualizar dados | ✅ | ✅ | Conforme permissões |
| Editar organização | ✅ | ✅ | ❌ |
| Convidar membros | ✅ | ✅ | ❌ |
| Gerenciar plano | ✅ | ✅ | ❌ |
| Excluir organização | ✅ | ❌ | ❌ |
| Configurar permissões | ✅ | ✅ | ❌ |

## Isolamento de dados

Cada organização mantém seus dados **completamente isolados**:
- Contatos de uma organização não aparecem em outra
- Automações, deals, tags — tudo é separado
- Membros podem pertencer a múltiplas organizações

## Boas práticas

- 👥 **Convide toda a equipe** — O CRM funciona melhor com todos usando
- 🔒 **Use permissões** — Limite acesso baseado no papel de cada membro
- 📝 **Mantenha dados atualizados** — Nome, logo e informações corretas

💡 **Dica**: Configure as permissões (menu Permissões) antes de convidar membros com papel "Membro" para garantir controle de acesso desde o início.`,
  },
  {
    id: 'plans-subscription',
    categoryId: 'settings',
    title: 'Planos e assinatura',
    icon: Target,
    description: 'Guia completo: planos disponíveis, assinatura, upgrade, downgrade e faturamento.',
    readTime: '4 min',
    content: `O AG Sell oferece planos com diferentes níveis de recursos para atender negócios de todos os portes.

## Visualizando planos

1. Acesse **"Planos"** no menu lateral
2. Veja todos os planos disponíveis com:
   - **Recursos incluídos** em cada plano
   - **Limites** (contatos, envios, automações, membros)
   - **Preços** mensais e anuais
   - Comparação lado a lado

[screenshot:Página de Planos e Assinatura|/plans]

## Assinando ou fazendo upgrade

1. Selecione o plano desejado
2. Clique em **"Assinar"** ou **"Upgrade"**
3. Complete o pagamento via **Stripe** (cartão de crédito)
4. Os recursos são liberados **imediatamente**
5. Você recebe confirmação por e-mail

## Gerenciando sua assinatura

Na página de Planos, acompanhe:

- **Plano atual** — Qual plano está ativo
- **Status** — Ativo, em trial, expirado
- **Data de renovação** — Quando a próxima cobrança acontecerá
- **Histórico de pagamentos** — Cobranças anteriores

## Upgrade

- Ao fazer upgrade, os novos recursos são liberados **imediatamente**
- A diferença de valor é calculada **pro-rata** (proporcional aos dias restantes)
- Não há perda de dados ou configurações

## Downgrade

⚠️ Ao fazer downgrade:
- Funcionalidades exclusivas do plano anterior serão **desativadas no próximo ciclo**
- Dados não são excluídos, mas o acesso pode ser limitado
- Se ultrapassar limites do novo plano (contatos, membros), funcionalidades são bloqueadas

## Feature Gate

Recursos que não fazem parte do seu plano são protegidos por **Feature Gate**:
- O item aparece no menu mas está **bloqueado**
- Ao tentar acessar, você vê qual plano é necessário
- Botão direto para fazer upgrade

## Boas práticas

- 📊 **Comece pelo plano que atende hoje** — Upgrade é fácil e imediato
- 📅 **Planos anuais** têm desconto significativo
- 🔔 **Monitore o uso** — Próximo de atingir limites? Considere upgrade
- 💳 **Mantenha cartão atualizado** — Evite interrupção por falha de pagamento

💡 **Dica**: Comece com o plano que atende suas necessidades atuais. Você pode fazer upgrade a qualquer momento sem perder dados ou configurações.`,
  },
  {
    id: 'permissions',
    categoryId: 'settings',
    title: 'Permissões e acessos',
    icon: Shield,
    description: 'Guia completo: criar perfis de permissão, configurar acessos granulares e Feature Gate.',
    readTime: '5 min',
    content: `Configure exatamente o que cada membro da equipe pode acessar no AG Sell com controle granular de permissões.

## Como funciona

O sistema de permissões tem três camadas:

1. **Papéis** — Owner, Admin, Membro (definidos na Organização)
2. **Perfis de permissão** — Conjuntos de módulos permitidos (configurados aqui)
3. **Feature Gate** — Recursos limitados pelo plano da organização

## Criando um perfil de permissão

1. Acesse **"Permissões"** no menu lateral
2. Clique em **"Novo Perfil"**
3. Defina o **nome** do perfil (ex: "Vendedor", "Suporte", "Marketing")
4. Selecione os **módulos permitidos**:

[screenshot:Configuração de Permissões|/permissions]

### Módulos configuráveis

**CRM:**
- ✅ Contatos — Ver, criar, editar, excluir
- ✅ Empresas — Ver, criar, editar, excluir
- ✅ Pipeline — Ver, criar deals, mover, editar
- ✅ Tags — Ver, criar, aplicar

**Comunicação:**
- ✅ Inbox (SAC) — Atender, responder, transferir
- ✅ WhatsApp — Enviar, conectar, campanhas
- ✅ E-mail Marketing — Criar campanhas, enviar
- ✅ Instagram — Automações, DMs
- ✅ Canais — Telegram, SMS, Shopify

**Marketing:**
- ✅ Automações — Criar, editar, ativar
- ✅ Flow Builder — Criar, editar fluxos
- ✅ Sequências — Criar, inscrever contatos
- ✅ Formulários — Criar, ver submissões
- ✅ Growth Tools — Criar ferramentas
- ✅ Testes A/B — Criar, analisar
- ✅ Lead Scoring — Configurar regras

**Inteligência:**
- ✅ Analytics — Ver dashboards e relatórios
- ✅ Assistente IA — Usar o chat
- ✅ Agentes IA — Criar, configurar
- ✅ Gamificação — Ver ranking, conquistas

**Configurações:**
- ✅ Organização — Editar dados
- ✅ Planos — Ver e gerenciar
- ✅ API Keys — Criar e gerenciar
- ✅ Webhooks — Configurar
- ✅ Integrações — Conectar serviços

5. Clique em **"Salvar"**

## Atribuindo perfis

1. Na página de Organização, selecione um membro
2. Atribua o perfil de permissão criado
3. O acesso é atualizado imediatamente

## Comportamento do Gate

Recursos sem permissão são:

- 🚫 **Ocultos do menu lateral** — O membro não vê itens que não pode acessar
- 🔒 **Bloqueados por URL direta** — Se digitar a URL, vê uma mensagem amigável
- 📋 **Mensagem explicativa** — Indica que o recurso requer permissão especial

## Exemplos de perfis

### Vendedor
- ✅ Contatos, Empresas, Pipeline, Tags, Tarefas
- ✅ Inbox, WhatsApp
- ✅ Analytics (somente visualização)
- ❌ Automações, E-mail, Configurações

### Suporte
- ✅ Contatos (visualização)
- ✅ Inbox, WhatsApp
- ❌ Pipeline, Automações, Configurações

### Marketing
- ✅ Contatos, Tags
- ✅ E-mail, Automações, Flow Builder, Formulários, Growth Tools
- ✅ Analytics, Lead Scoring, Testes A/B
- ❌ Pipeline (edição), Configurações administrativas

## Boas práticas

- 🔒 **Princípio do menor privilégio** — Dê apenas as permissões necessárias
- 📝 **Nomeie perfis claramente** — "Vendedor Júnior" vs "Vendedor Sênior"
- 🔄 **Revise periodicamente** — Atualize conforme a equipe evolui
- 📋 **Documente** — Mantenha uma lista de perfis e suas permissões

💡 **Dica**: Configure perfis de permissão antes de convidar novos membros. Isso garante que cada pessoa veja apenas o que precisa desde o primeiro acesso.`,
  },
  {
    id: 'agency-management',
    categoryId: 'settings',
    title: 'Gestão de Agência',
    icon: Briefcase,
    description: 'Guia completo: modo multi-tenant para agências, convidar clientes, alternar contas e isolamento.',
    readTime: '5 min',
    content: `O modo Agência permite gerenciar múltiplas organizações-cliente a partir de uma única conta, ideal para agências de marketing e consultorias.

## O que é o modo Agência?

O modo Agência transforma sua conta AG Sell em uma plataforma **multi-tenant**:
- Sua organização é a **agência** (organização mãe)
- Cada cliente é uma **organização filha** (com dados isolados)
- Você alterna entre clientes com um clique
- Cada cliente pode ter seu próprio plano e configurações

## Adicionando clientes

1. Acesse **"Clientes Agência"** no menu lateral
2. Clique em **"Convidar Cliente"**
3. Insira o **e-mail** do cliente
4. Selecione o **nível de acesso**:
   - **Operacional** — Acesso para operar CRM, inbox e automações do cliente
   - **Completo** — Acesso total, incluindo configurações, planos e permissões
5. O cliente receberá um **convite por e-mail**
6. Ao aceitar, a organização do cliente é vinculada à sua agência

## Alternando entre clientes

- No topo do **sidebar**, um **seletor de organização** aparece
- Clique no seletor para ver a lista de organizações
- Selecione a organização do cliente desejada
- A interface é atualizada instantaneamente com os dados daquele cliente
- Para voltar, selecione sua organização principal

## Isolamento de dados

- Cada organização-cliente mantém seus dados **completamente isolados**
- A agência **acessa** mas **não mistura** dados entre clientes
- Automações, contatos, deals, tags — tudo é separado
- O cliente pode acessar sua própria organização independentemente

## Plano necessário

O modo Agência requer o plano **Agência** e está protegido por **Feature Gate**:
- Se seu plano não incluir o módulo de Agência, o menu aparece bloqueado
- Faça upgrade para o plano Agência para desbloquear

## Boas práticas

- 🔒 **Use "Operacional"** para equipes que só executam, **"Completo"** para gestores
- 📊 **Acompanhe métricas** de cada cliente separadamente
- 📝 **Documente processos** — Cada cliente pode ter processos diferentes
- 🔄 **Alternar é instantâneo** — Use para verificar status rapidamente

> Cada organização-cliente mantém seus dados completamente isolados. A agência acessa mas não mistura dados entre clientes.

💡 **Dica**: O seletor de organização no sidebar permite alternar entre clientes instantaneamente. Use para verificar o status de cada conta rapidamente.`,
  },
  {
    id: 'api-webhooks',
    categoryId: 'settings',
    title: 'API Keys e Webhooks',
    icon: Key,
    description: 'Guia completo: criar API Keys, webhooks de entrada, rate limiting e integrações de pagamento.',
    readTime: '6 min',
    content: `Use API Keys e Webhooks para integrar o AG Sell com outros sistemas e automatizar processos externos.

## API Keys

### O que são
API Keys são credenciais que permitem sistemas externos acessar dados do AG Sell via API REST.

### Criando uma chave
1. Acesse **"API Keys"** no menu lateral
2. Clique em **"Nova Chave"**
3. Configure:
   - **Nome** — Identificação (ex: "Integração Website", "App Mobile")
   - **Permissões** — O que a chave pode acessar:
     - Contatos (ler, criar, editar, excluir)
     - Deals (ler, criar, editar)
     - Tags (ler, aplicar)
   - **Rate limiting** — Limites de requisição:
     - Requisições por minuto (padrão: 60)
     - Requisições por dia (padrão: 10.000)
   - **Expiração** — Data de validade (opcional)
4. Clique em **"Gerar Chave"**
5. **Copie a chave** imediatamente (ela não será exibida novamente!)

[screenshot:Gerenciamento de API Keys|/api-keys]

### Gerenciando chaves
- **Ativar/Desativar** — Suspenda temporariamente sem excluir
- **Visualizar uso** — Veja estatísticas de requisições
- **Último acesso** — Quando a chave foi usada pela última vez
- **Revogar** — Exclua permanentemente a chave

⚠️ **Segurança**: Nunca compartilhe API Keys publicamente. Trate-as como senhas.

## Webhooks de entrada

### O que são
Webhooks de entrada permitem que sistemas externos enviem dados para o AG Sell quando eventos acontecem (pagamento aprovado, pedido criado, etc.).

### Criando um webhook
1. Acesse **"Webhooks"** no menu lateral
2. Clique em **"Novo Webhook"**
3. O sistema gera:
   - **URL do endpoint** — Endereço único para receber dados
   - **Token de segurança** — Para autenticação (envie no header)
4. Configure:
   - **Nome** — Identificação (ex: "Webhook Stripe", "Webhook Hotmart")
   - **Descrição** — Para que serve
   - **Mapeamento de campos** — Como traduzir os dados recebidos para campos do CRM
   - **Ação alvo** — O que fazer quando receber dados:
     - Criar contato
     - Atualizar contato
     - Criar deal
     - Disparar automação
5. Copie a **URL** e o **Token**
6. Configure no sistema externo

[screenshot:Configuração de Webhooks|/webhooks]

### Integrações de pagamento prontas

O AG Sell tem webhooks pré-configurados para:

**Stripe:**
- Pagamento aprovado → Cria contato + Deal ganho
- Assinatura criada → Tag "cliente-ativo"
- Assinatura cancelada → Tag "churn"

**Hotmart:**
- Compra aprovada → Cria contato + Tag do produto
- Reembolso → Atualiza status

**Eduzz:**
- Compra aprovada → Cria contato + Automação de onboarding

**Kiwify:**
- Compra aprovada → Cria contato + Deal

### Monitoramento
- **Requisições recebidas** — Contagem total
- **Último request** — Data/hora do último envio
- **Status** — Ativo/Inativo
- **Logs** — Histórico de payloads recebidos

## Boas práticas

- 🔑 **Uma chave por integração** — Facilita rastreio e revogação
- 🔒 **Limite permissões** — Dê apenas o acesso necessário
- 📊 **Monitore uso** — Verifique se há uso anormal
- 🔄 **Rotacione chaves** — Troque periodicamente por segurança
- 📝 **Documente integrações** — Registre o que cada chave/webhook faz

💡 **Dica**: Combine webhooks com automações para criar fluxos como: "Quando receber pagamento no Stripe, criar contato, mover para pipeline de clientes e enviar e-mail de boas-vindas".`,
  },
  {
    id: 'integrations',
    categoryId: 'settings',
    title: 'Integrações',
    icon: LinkIcon,
    description: 'Guia completo: Stripe, Hotmart, Eduzz, Kiwify, Evolution API, Z-API e domínio de e-mail.',
    readTime: '5 min',
    content: `O AG Sell se integra com diversas ferramentas e plataformas do mercado para automatizar seu negócio.

## Integrações disponíveis

### 💳 Provedores de pagamento

**Stripe:**
- Pagamentos e assinaturas internacionais
- Webhook automático para criação de contatos
- Sincronização de status de pagamento
- Configuração: API Key do Stripe

**Hotmart:**
- Vendas de infoprodutos
- Webhook para captura de compradores
- Tags automáticas por produto comprado
- Configuração: Webhook URL no Hotmart

**Eduzz:**
- Vendas digitais
- Integração via webhook
- Criação automática de contatos
- Configuração: Webhook URL no Eduzz

**Kiwify:**
- Vendas online
- Webhook para sincronização
- Tags automáticas
- Configuração: Webhook URL no Kiwify

### 💬 WhatsApp providers

**Evolution API:**
- Servidor próprio de WhatsApp
- Máxima privacidade e controle
- Configuração: URL do servidor + API Key + Instance Name
- Ideal para: empresas com infraestrutura própria

**Z-API:**
- API simplificada e gerenciada
- Sem necessidade de servidor próprio
- Configuração: Instance ID + Token + Client Token
- Ideal para: quem quer praticidade

### ✉️ E-mail
- Domínio personalizado com SPF, DKIM, DMARC
- Configuração detalhada no módulo "Domínio E-mail"

[screenshot:Página de Integrações|/integrations]

## Configurando uma integração

1. Acesse **"Integrações"** no menu lateral
2. Encontre a integração desejada
3. Clique em **"Configurar"**
4. Siga o assistente de configuração específico:
   - Insira credenciais (API Key, Token, etc.)
   - Configure as opções específicas
   - Teste a conexão
5. Ative a integração

## Testando integrações

Após configurar, sempre teste:
- **WhatsApp** — Envie uma mensagem de teste
- **Pagamento** — Faça uma transação de teste (modo sandbox)
- **E-mail** — Envie um e-mail de teste

## Boas práticas

- 🔐 **Proteja credenciais** — Nunca compartilhe API Keys publicamente
- 🧪 **Teste em sandbox** — Use ambientes de teste antes de produção
- 📝 **Documente** — Registre quais integrações estão ativas e por quê
- 🔄 **Monitore** — Verifique periodicamente se as conexões estão ativas

> Cada integração tem seu próprio fluxo de configuração. Siga os passos indicados na tela e consulte a documentação da ferramenta externa se necessário.

💡 **Dica**: Configure as integrações de pagamento (Stripe, Hotmart) primeiro se seu negócio depende de vendas online. Isso automatiza a criação de contatos e deals.`,
  },
  {
    id: 'support-portal',
    categoryId: 'settings',
    title: 'Portal de Suporte White-label',
    icon: HelpCircle,
    description: 'Configure um portal público de suporte para seus clientes abrirem e acompanharem chamados.',
    readTime: '6 min',
    popular: true,
    content: `O **Portal de Suporte White-label** permite que você ofereça um canal de atendimento profissional para seus clientes, sem que eles precisem criar conta ou fazer login. Disponível nos planos **Professional**, **Enterprise** e **Agência**.

## Como funciona

O portal é uma página pública acessível via link único da sua organização:

\`\`\`
https://seudominio.com/support-portal/slug-da-sua-organizacao
\`\`\`

Seus clientes podem:
- **Abrir tickets de suporte** com nome, e-mail, assunto e categoria
- **Acompanhar o status** de tickets existentes usando o número de protocolo
- **Iniciar chat direto** via WhatsApp (se configurado)

> Cada ticket gera um protocolo único (ex: SUP-20260306-12345) que o cliente usa para consultar o andamento.

## Configurando o Portal

1. Acesse **"Portal de Suporte"** no menu lateral (seção Comunicação)
2. Você verá o **link público** do seu portal — copie e compartilhe com seus clientes
3. Configure as opções:

### Mensagem de boas-vindas
Personalize a mensagem que seus clientes veem ao acessar o portal.

### Horário de atendimento
Informe o horário em que sua equipe está disponível para responder.

### Categorias de chamados
Adicione categorias para organizar os tickets recebidos:
- Clique em **"+"** para adicionar uma nova categoria
- Clique no **"X"** ao lado de uma categoria para removê-la
- Categorias padrão: Dúvida, Problema técnico, Financeiro, Sugestão, Outro

### Chat via WhatsApp
Ative para permitir que clientes iniciem uma conversa direta pelo WhatsApp:
1. Ative o switch **"Chat via WhatsApp"**
2. Insira o número do WhatsApp no formato internacional (ex: 5511999999999)
3. O botão de chat aparecerá no portal público

## Integração com o CRM

Quando um cliente abre um ticket pelo portal:
- O sistema **cria automaticamente um contato** no CRM (se não existir)
- O ticket é vinculado ao contato pelo e-mail informado
- Você pode acompanhar os tickets diretamente no SAC/Inbox

## Acompanhamento de tickets

Seus clientes podem consultar o status dos tickets:
1. No portal, clicam na aba **"Acompanhar Ticket"**
2. Inserem o **número do protocolo** e o **e-mail** usado na abertura
3. O sistema mostra o status atual: Aberto, Em andamento ou Resolvido

## Boas práticas

- 🔗 **Compartilhe o link** no seu site, e-mails e redes sociais
- ⏰ **Mantenha horários atualizados** para definir expectativas corretas
- 📋 **Use categorias claras** para facilitar a triagem dos tickets
- 💬 **Ative o WhatsApp** para oferecer atendimento instantâneo
- 📊 **Monitore os tickets** regularmente para garantir respostas rápidas

💡 **Dica**: Inclua o link do portal de suporte na assinatura de e-mail da sua equipe e no rodapé do seu site para facilitar o acesso dos clientes.`,
  },
  {
    id: 'settings-general',
    categoryId: 'settings',
    title: 'Configurações gerais',
    icon: Settings,
    description: 'Guia completo: tema claro/escuro, notificações, privacidade (LGPD), exportação e exclusão.',
    readTime: '4 min',
    content: `Personalize sua experiência no AG Sell e gerencie suas preferências de privacidade.

## Tema claro e escuro

O AG Sell oferece dois temas visuais:

- ☀️ **Tema claro** — Fundo branco, ideal para ambientes iluminados
- 🌙 **Tema escuro** — Fundo escuro, ideal para trabalhar à noite ou reduzir fadiga visual

### Como alternar
1. Clique no ícone de **lua/sol** no cabeçalho (canto superior direito)
2. O tema muda instantaneamente
3. A preferência é **salva automaticamente** no seu navegador

> O tema é individual — cada membro pode escolher sua preferência sem afetar os outros.

[screenshot:Configurações Gerais|/settings]

## Notificações

Configure quais notificações deseja receber:

### Tipos de notificação
- 💬 **Novas mensagens** — Quando uma mensagem é recebida no inbox
- ✅ **Tarefas vencidas** — Quando o prazo de uma tarefa expira
- 📊 **Movimentações no pipeline** — Quando deals são movidos
- 🤖 **Execuções de automação** — Quando automações são disparadas
- 🔔 **Atualizações do sistema** — Novos recursos e manutenções

### Canais de notificação
- **Push no navegador** — Notificações pop-up no desktop
- **Dentro do app** — Ícone de sino no cabeçalho
- **E-mail** — Para notificações importantes

## Privacidade e LGPD

Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você pode:

### Exportar seus dados
1. Acesse **Configurações** → **Privacidade**
2. Clique em **"Exportar meus dados"**
3. O sistema prepara um arquivo com todos os seus dados pessoais
4. Você recebe o download quando pronto

### Excluir sua conta
1. Acesse **Configurações** → **Privacidade**
2. Clique em **"Excluir minha conta"**
3. Confirme a exclusão (requer senha)
4. Todos os seus dados pessoais serão **permanentemente apagados**

⚠️ **A exclusão de conta é irreversível**. Todos os dados serão apagados permanentemente, incluindo:
- Contatos criados por você
- Automações criadas por você
- Histórico de mensagens
- Configurações pessoais

> Se você é o **Owner** da organização, a exclusão da conta também pode afetar a organização inteira. Transfira a propriedade antes de excluir.

## Boas práticas

- 🌙 **Use tema escuro** à noite para reduzir fadiga visual
- 🔔 **Configure notificações** para não perder mensagens importantes
- 📋 **Exporte dados regularmente** como backup de segurança
- 🔒 **Revise permissões** periodicamente

💡 **Dica**: Ative notificações de novas mensagens no navegador para nunca perder um atendimento. A rapidez de resposta impacta diretamente a satisfação do cliente.`,
  },

  // =====================================================
  // NOVOS MÓDULOS — INTELIGÊNCIA E MARKETING AVANÇADO
  // =====================================================
  {
    id: 'sms-marketing',
    categoryId: 'marketing',
    title: 'SMS Marketing',
    icon: Megaphone,
    description: 'Campanhas SMS em massa, automações e mensagens bidirecionais.',
    readTime: '6 min',
    content: `O módulo de **SMS Marketing** permite enviar campanhas de texto em massa, criar automações baseadas em SMS e gerenciar conversas bidirecionais — tudo integrado ao CRM.

## Campanhas SMS

1. Acesse **SMS Marketing** no menu lateral
2. Clique em **"Nova Campanha"**
3. Selecione destinatários (todos, por tag, por segmento)
4. Escreva a mensagem (até 160 caracteres)
5. Envie agora ou agende

### Métricas
- Enviados, Entregues, Respostas, Taxa de entrega

## Automações SMS
- Carrinho abandonado, boas-vindas, follow-up, reengajamento
- Integre SMS como ação em qualquer automação ou sequência

## Two-Way Messaging
- Respostas de SMS aparecem no Inbox
- Responda pelo Inbox e o contato recebe por SMS

## Configuração
Configure Twilio ou Vonage em **Canais** → **SMS** com Account SID, Auth Token e número de envio.

💡 **Dica**: Use SMS como fallback — se WhatsApp não entregar em 30 min, envie por SMS automaticamente.`,
  },
  {
    id: 'site-tracking',
    categoryId: 'intelligence',
    title: 'Rastreamento de Site',
    icon: Globe,
    description: 'Monitore visitantes do seu site com snippet JS e visualize sessões.',
    readTime: '7 min',
    content: `O **Site Tracking** monitora visitantes do seu site em tempo real com um snippet JavaScript.

## Instalação
1. Acesse **Site Tracking** → copie o snippet JS
2. Cole no \`<head>\` do seu site
3. O rastreamento inicia automaticamente

## O que é rastreado
- Visualizações de página (URL, título, referrer)
- Sessões (início, duração, páginas/sessão)
- Dispositivos (Desktop, Mobile, Tablet)
- Origem (Direto, Orgânico, Social, Pago)

## Dashboard
- Visitantes únicos, sessões, páginas/sessão, tempo médio
- Distribuição por dispositivo (gráfico pizza)
- Páginas mais visitadas (ranking)

## Integração com CRM
Quando o visitante é identificado via formulário, as sessões são vinculadas ao perfil do contato para uso em Lead Scoring e automações.

💡 **Dica**: Combine com Lead Scoring para pontuar leads que visitam páginas de preço.`,
  },
  {
    id: 'attribution',
    categoryId: 'intelligence',
    title: 'Atribuição de Receita',
    icon: Target,
    description: 'Rastreie a jornada do cliente e atribua receita a canais e campanhas.',
    readTime: '6 min',
    content: `O módulo de **Atribuição** rastreia a jornada completa e atribui receita aos canais que contribuíram para a conversão.

## Modelos
| Modelo | Descrição |
|--------|-----------|
| **Primeiro toque** | 100% ao primeiro canal |
| **Último toque** | 100% ao último canal |
| **Linear** | Distribui igualmente entre todos |

## Dashboard
- Receita por canal (barras), touchpoints recentes, canal top, ROI por canal

## Como funciona
1. Cada interação cria um touchpoint
2. Quando deal é ganho, receita é distribuída conforme modelo
3. Dashboard consolida a visão

💡 **Dica**: Use linear para visão equilibrada. Primeiro toque mostra o que atrai, último mostra o que converte.`,
  },
  {
    id: 'ai-builder',
    categoryId: 'intelligence',
    title: 'AI Builder',
    icon: Brain,
    description: 'Gere e-mails, automações e copy com IA. Inclui Brand Kit e segmentação inteligente.',
    readTime: '8 min',
    content: `O **AI Builder** gera conteúdo e estratégia com inteligência artificial.

## Geração de Conteúdo
- **E-mails HTML** — Descreva o objetivo, IA cria o e-mail
- **Fluxos de automação** — Descreva a estratégia, receba o fluxo
- **Copy para WhatsApp** — Mensagens persuasivas

## AI Brand Kit
1. Cole a URL do site da marca
2. IA extrai: cores, fontes e tom de comunicação
3. Use para consistência visual em e-mails e landing pages

## Segmentos Sugeridos por IA
1. Clique em "Gerar Sugestões"
2. IA analisa padrões de engajamento e comportamento
3. Receba sugestões como "Leads quentes sem follow-up"
4. Aplique como filtro no CRM

💡 **Dica**: Gere séries de e-mails de onboarding — "série de 5 e-mails de boas-vindas para SaaS" e receba tudo pronto.`,
  },
  {
    id: 'predictive-sending',
    categoryId: 'intelligence',
    title: 'Envio Preditivo',
    icon: Search,
    description: 'IA determina o melhor horário para enviar mensagens a cada contato.',
    readTime: '5 min',
    content: `O **Envio Preditivo** usa IA para determinar o melhor horário de envio para cada contato.

## Como funciona
1. IA analisa histórico de interações
2. Identifica padrões de horários com maior engajamento
3. Cria perfil de envio (timezone, canal preferido, horário ideal)
4. Aplica automaticamente em campanhas e automações

## Dashboard
- Perfis analisados, melhoria estimada, horário mais popular
- Distribuição por horário e canal preferido

💡 **Dica**: Deixe coletar 2+ semanas de dados antes de confiar nas predições.`,
  },
  {
    id: 'sentiment-analysis',
    categoryId: 'intelligence',
    title: 'Análise de Sentimento',
    icon: Brain,
    description: 'IA classifica o sentimento das conversas e identifica padrões.',
    readTime: '5 min',
    content: `A **Análise de Sentimento** classifica automaticamente o tom das mensagens recebidas.

## Classificações
- **Positivo** — Tom satisfeito, elogioso
- **Neutro** — Informativo, sem carga emocional
- **Negativo** — Insatisfeito, reclamação, urgência

## Dashboard
- Distribuição de sentimentos (gráfico)
- Palavras-chave mais frequentes
- Tendências temporais

## Uso prático
- Priorize atendimentos negativos
- Identifique tendências de insatisfação
- Automatize escalação de mensagens negativas

💡 **Dica**: Combine com CSAT para visão completa. Sentimento = tempo real, CSAT = pós-atendimento.`,
  },
  {
    id: 'sales-routing',
    categoryId: 'intelligence',
    title: 'Roteamento de Vendas',
    icon: SlidersHorizontal,
    description: 'Distribua leads automaticamente entre vendedores com regras inteligentes.',
    readTime: '5 min',
    content: `O **Sales Routing** distribui leads automaticamente entre vendedores.

## Estratégias
| Estratégia | Descrição |
|-----------|-----------|
| **Round Robin** | Alternando entre vendedores |
| **Por Carga** | Vendedor com menos leads ativos |
| **Por Território** | Baseado na região do contato |
| **Por Especialidade** | Conforme tags ou produto |

## Configuração
1. Acesse Sales Routing → "Nova Regra"
2. Defina nome, estratégia e membros elegíveis
3. Configure limites (máx. concurrent)
4. Ative

💡 **Dica**: Round Robin para equipes homogêneas, por carga para equipes com níveis diferentes.`,
  },
  {
    id: 'goals',
    categoryId: 'intelligence',
    title: 'Metas e Conversões',
    icon: Target,
    description: 'Defina metas de vendas e acompanhe progresso em tempo real.',
    readTime: '5 min',
    content: `O módulo de **Metas** permite definir objetivos e acompanhar progresso.

## Tipos
| Tipo | Exemplo |
|------|---------|
| **Receita** | R$ 100.000 em vendas no mês |
| **Contagem** | 500 novos leads no trimestre |
| **Evento** | 1.000 page views na landing page |

## Criar meta
1. Acesse Metas → "Nova Meta"
2. Defina nome, tipo, valor alvo e deadline
3. Acompanhe progresso no dashboard

## Status automáticos
- **Ativa** — Em andamento
- **Atingida** — Valor atual ≥ alvo
- **Expirada** — Deadline passou sem atingir

💡 **Dica**: Metas mensais de receita + semanais de leads. Acompanhe diariamente.`,
  },
  {
    id: 'win-probability',
    categoryId: 'intelligence',
    title: 'Probabilidade de Fechamento',
    icon: Target,
    description: 'IA calcula a probabilidade de fechar cada negócio do pipeline.',
    readTime: '5 min',
    content: `A **Win Probability** usa IA para calcular chances de converter cada negócio.

## Como funciona
1. IA analisa: valor, tempo na etapa, atividades, contato
2. Compara com padrões históricos
3. Calcula probabilidade (0-100%)
4. Lista fatores positivos e negativos

## Dashboard
- Total de deals analisados
- Probabilidade média do pipeline
- Deals de alta probabilidade (>70%)

## Uso prático
- Foque nos top deals (>70%)
- Recupere deals em risco (queda de probabilidade)
- Forecast: valor × probabilidade

💡 **Dica**: Recalcule semanalmente. Deals estagnados perdem probabilidade — aja rápido.`,
  },
  {
    id: 'conditional-content',
    categoryId: 'marketing',
    title: 'Conteúdo Condicional',
    icon: Vote,
    description: 'Blocos de conteúdo dinâmico que mudam conforme o perfil do contato.',
    readTime: '5 min',
    content: `O **Conteúdo Condicional** cria blocos dinâmicos em e-mails que mudam com base no contato.

## Condições disponíveis
- **Tag** — Contato possui ou não uma tag
- **Lead Score** — Acima/abaixo de um valor
- **Status** — Lead, Cliente, Churned
- **Campo customizado** — Qualquer campo

## Criar bloco
1. Acesse Conteúdo Condicional → "Novo Bloco"
2. Defina condição
3. Escreva conteúdo verdadeiro e alternativo (fallback)
4. Use o código gerado nos templates

## Preview
Editor lado a lado: Se verdadeiro vs Se falso

💡 **Dica**: Ofertas de upgrade para Starter, features avançadas para Enterprise — tudo no mesmo e-mail.`,
  },
  {
    id: 'custom-reports',
    categoryId: 'intelligence',
    title: 'Relatórios Personalizados',
    icon: BarChart3,
    description: 'Dashboards customizados combinando métricas de CRM, e-mail e WhatsApp.',
    readTime: '5 min',
    content: `Os **Relatórios Personalizados** permitem criar dashboards sob medida.

## Criar relatório
1. Acesse Relatórios Personalizados → "Novo Relatório"
2. Adicione widgets (Barras, Linhas, Pizza)
3. Escolha fontes: CRM, E-mail, WhatsApp, Inbox
4. Configure período e filtros

## Fontes de dados
- **CRM** — Contatos, deals, receita, pipeline
- **E-mail** — Campanhas, aberturas, cliques
- **WhatsApp** — Mensagens, respostas, campanhas
- **Inbox** — Conversas, tempo de resposta, CSAT

💡 **Dica**: Relatório semanal com: novos leads, deals ganhos, receita e CSAT para reuniões de equipe.`,
  },
  {
    id: 'revenue-reporting',
    categoryId: 'intelligence',
    title: 'Relatório de Receita',
    icon: BarChart3,
    description: 'Receita por canal, campanha e período com dashboards detalhados.',
    readTime: '5 min',
    content: `O **Relatório de Receita** consolida toda receita segmentada por canal, campanha e período.

## Dashboard
- Receita total no período
- Receita por canal (E-mail, WhatsApp, SMS, Site)
- Crescimento vs período anterior
- Top campanhas por receita

## Filtros
- Período (7, 30, 90 dias ou customizado)
- Canal e campanha

## Integração
Alimentado pelos dados de **Atribuição** para visão clara de contribuição por canal.

💡 **Dica**: Compare receita por canal mensalmente para redistribuir investimentos.`,
  },
  {
    id: 'landing-pages',
    categoryId: 'marketing',
    title: 'Landing Pages',
    icon: Globe,
    description: 'Crie landing pages de captura com integração direta ao CRM.',
    readTime: '5 min',
    content: `O módulo de **Landing Pages** permite criar páginas de captura de leads sem ferramentas externas.

## Criar Landing Page
1. Acesse Landing Pages → "Nova Landing Page"
2. Defina título, slug (URL) e descrição
3. Edite conteúdo HTML no editor
4. Configure formulário de captura
5. Publique

## Integração com CRM
Formulário preenchido → Contato criado automaticamente → Tags aplicadas → Automações disparadas

## Métricas
- Visualizações, conversões, taxa de conversão

💡 **Dica**: Use para campanhas específicas (Black Friday, lançamento) com URLs personalizadas.`,
  },
];
