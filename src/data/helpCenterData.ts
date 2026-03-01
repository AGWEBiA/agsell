import {
  LayoutDashboard, Users, Building2, Kanban, Tags, CheckSquare,
  Inbox, Mail, MessageSquare, Zap, BarChart3, Target, FileText,
  Link as LinkIcon, Settings, Bot, Brain, Trophy, Shield, Key,
  Webhook, SlidersHorizontal, Instagram, ListChecks, BookOpen,
  Rocket, Globe, Briefcase, Star, PlayCircle, HelpCircle, Workflow,
  Vote, SplitSquareVertical, Megaphone,
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
    description: 'Gerencie contatos, empresas, pipeline de vendas e tags para organizar seu negócio.',
  },
  {
    id: 'communication',
    title: 'Comunicação',
    icon: MessageSquare,
    description: 'Inbox unificado, WhatsApp, E-mail Marketing e Instagram em um só lugar.',
  },
  {
    id: 'marketing',
    title: 'Marketing e Automação',
    icon: Zap,
    description: 'Automações, Lead Scoring, WhatsApp Flows e Formulários para converter mais.',
  },
  {
    id: 'intelligence',
    title: 'Inteligência e Analytics',
    icon: BarChart3,
    description: 'Dashboards analíticos, Assistente IA, Agentes de IA e Gamificação.',
  },
  {
    id: 'settings',
    title: 'Configurações',
    icon: Settings,
    description: 'Organização, planos, permissões, API Keys, webhooks e integrações.',
  },
];

export const helpArticles: HelpArticle[] = [
  // --- Primeiros Passos ---
  {
    id: 'welcome',
    categoryId: 'getting-started',
    title: 'Visão geral do AG Sell',
    icon: Star,
    description: 'Conheça a plataforma e entenda como ela pode ajudar seu negócio.',
    readTime: '3 min',
    popular: true,
    content: `O AG Sell é uma plataforma completa de CRM e automação de vendas que centraliza todas as suas operações comerciais em um único lugar.

## O que você pode fazer com o AG Sell?

- Gerenciar contatos e empresas de forma organizada
- Acompanhar negócios no pipeline de vendas com quadro Kanban
- Atender clientes via WhatsApp, E-mail e Instagram em um inbox unificado
- Automatizar tarefas repetitivas com fluxos inteligentes
- Analisar métricas e resultados com dashboards completos
- Usar Inteligência Artificial para respostas e análises

[screenshot:Dashboard principal do AG Sell|/dashboard]

> O AG Sell foi projetado para ser tão simples que qualquer pessoa consegue usar. Explore os módulos no menu lateral e comece pela criação dos seus primeiros contatos.

💡 Dica: Use a barra de busca global (Ctrl+K) para encontrar qualquer funcionalidade rapidamente.`,
  },
  {
    id: 'first-setup',
    categoryId: 'getting-started',
    title: 'Configuração inicial',
    icon: Settings,
    description: 'Passo a passo para configurar sua conta e organização.',
    readTime: '5 min',
    popular: true,
    content: `Depois de criar sua conta, siga estes passos para configurar o AG Sell:

## Configurando sua organização

1. Acesse o menu "Organização" no sidebar
2. Defina o nome e logo da sua empresa
3. Configure o slug (endereço) da organização
4. Convide membros da sua equipe por e-mail

[screenshot:Página de configuração da organização|/organization]

## Convidando membros da equipe

1. Na página de Organização, clique em "Convidar membro"
2. Insira o e-mail do colaborador
3. Selecione o papel: Owner, Admin ou Membro
4. O convite será enviado por e-mail automaticamente

> Cada membro pode ter permissões diferentes. Configure os perfis de permissão na seção "Permissões".

## Escolhendo seu plano

1. Acesse "Planos" no menu lateral
2. Compare os recursos de cada plano
3. Selecione o plano ideal para seu negócio
4. Complete o pagamento via Stripe

💡 Dica: Comece com o plano que atende suas necessidades atuais. Você pode fazer upgrade a qualquer momento.`,
  },
  {
    id: 'navigation',
    categoryId: 'getting-started',
    title: 'Navegando pelo sistema',
    icon: LayoutDashboard,
    description: 'Entenda a interface e os principais recursos de navegação.',
    readTime: '2 min',
    content: `A interface do AG Sell é organizada em seções para facilitar a navegação.

## Menu lateral (Sidebar)

O menu lateral é dividido em categorias:

- **Visão Geral** — Dashboard e Tarefas
- **CRM** — Contatos, Empresas, Pipeline, Tags
- **Comunicação** — SAC, WhatsApp, E-mail, Instagram
- **Marketing** — Automações, Flows, Lead Scoring, Formulários
- **Inteligência** — Analytics, Assistente IA, Agentes IA, Gamificação
- **Configurações** — Organização, Planos, Permissões e mais

[screenshot:Menu lateral do AG Sell|/dashboard]

## Busca global

Pressione **Ctrl+K** (ou **⌘+K** no Mac) para abrir a busca global. Você pode pesquisar por:

- Contatos e empresas
- Páginas do sistema
- Funcionalidades

## Notificações

O ícone de sino no cabeçalho mostra suas notificações. Clique para ver alertas sobre:

- Novas mensagens no inbox
- Tarefas vencidas
- Atualizações do sistema`,
  },

  // --- CRM ---
  {
    id: 'contacts',
    categoryId: 'crm',
    title: 'Gerenciando contatos',
    icon: Users,
    description: 'Como criar, importar e organizar seus contatos no CRM.',
    readTime: '5 min',
    popular: true,
    content: `Os contatos são a base do seu CRM. Aqui você gerencia todas as informações dos seus leads e clientes.

## Criando um contato

1. Acesse "Contatos" no menu lateral
2. Clique no botão "Novo Contato"
3. Preencha os dados: nome, e-mail, telefone, WhatsApp
4. Opcionalmente, vincule a uma empresa e adicione tags
5. Clique em "Salvar"

[screenshot:Página de Contatos do CRM|/contacts]

## Importação em massa (CSV)

1. Na página de Contatos, clique em "Importar"
2. Selecione seu arquivo CSV
3. O sistema irá mapear automaticamente os campos
4. Revise o mapeamento e confirme a importação
5. Acompanhe o progresso da importação

> O arquivo CSV deve conter pelo menos o campo "Nome" (ou "first_name"). Campos como e-mail, telefone e WhatsApp são opcionais mas recomendados.

## Timeline de atividades

Ao clicar em um contato, você verá a timeline completa com:

- Mensagens de WhatsApp e e-mail
- Tarefas vinculadas
- Movimentações no pipeline
- Notas e observações

[screenshot:Lista de contatos com detalhes|/contacts]

💡 Dica: Use tags coloridas para segmentar seus contatos. Isso facilita a criação de campanhas e automações.`,
  },
  {
    id: 'companies',
    categoryId: 'crm',
    title: 'Cadastro de empresas',
    icon: Building2,
    description: 'Organize empresas e vincule contatos a elas.',
    readTime: '3 min',
    content: `O módulo de Empresas permite organizar seus contatos por organização.

## Criando uma empresa

1. Acesse "Empresas" no menu lateral
2. Clique em "Nova Empresa"
3. Preencha: nome, domínio, setor, porte
4. Adicione telefone, endereço e notas

[screenshot:Página de Empresas|/companies]

## Vinculando contatos

- Ao criar ou editar um contato, selecione a empresa no campo "Empresa"
- Na página da empresa, visualize todos os contatos vinculados
- Acompanhe também os negócios (deals) ativos com a empresa

> Uma empresa pode ter múltiplos contatos vinculados. Isso é útil para B2B onde você interage com vários decisores.`,
  },
  {
    id: 'pipeline',
    categoryId: 'crm',
    title: 'Pipeline de vendas (Kanban)',
    icon: Kanban,
    description: 'Gerencie seu funil de vendas com visualização drag-and-drop.',
    readTime: '4 min',
    popular: true,
    content: `O Pipeline é o coração do seu processo de vendas, com visualização Kanban intuitiva.

## Como funciona

O pipeline exibe seus negócios (deals) organizados em colunas que representam as etapas do funil:

- **Novo** → Lead recém-chegado
- **Qualificado** → Lead com fit confirmado
- **Proposta** → Proposta enviada
- **Negociação** → Em negociação ativa
- **Fechado** → Negócio concluído

[screenshot:Pipeline Kanban com etapas do funil|/pipeline]

## Criando um deal

1. Clique em "+" na coluna desejada
2. Defina título, valor e moeda
3. Vincule um contato e/ou empresa
4. Defina a probabilidade de fechamento
5. Adicione a data prevista de fechamento

## Movendo deals

- **Arraste e solte** o card de uma coluna para outra
- Ou abra o deal e altere a etapa manualmente
- Cada movimentação é registrada no histórico

## Filtros

Use os filtros para visualizar deals por:

- Etapa do pipeline
- Valor (mínimo/máximo)
- Responsável
- Data prevista

💡 Dica: Mantenha o pipeline atualizado movendo os deals conforme a negociação avança. Isso garante métricas precisas no Analytics.`,
  },
  {
    id: 'tags',
    categoryId: 'crm',
    title: 'Usando tags',
    icon: Tags,
    description: 'Crie etiquetas coloridas para segmentar e organizar.',
    readTime: '2 min',
    content: `Tags são etiquetas coloridas que ajudam a organizar e segmentar seus contatos.

## Criando tags

1. Acesse "Tags" no menu lateral
2. Clique em "Nova Tag"
3. Defina o nome e escolha uma cor
4. Salve a tag

## Aplicando tags aos contatos

- Ao criar ou editar um contato, adicione tags no campo dedicado
- É possível aplicar várias tags ao mesmo contato

## Usando tags em automações

Tags podem ser usadas como:

- **Gatilho** — Dispare automações quando uma tag é adicionada
- **Ação** — Adicione ou remova tags automaticamente
- **Filtro** — Segmente contatos por tags em campanhas

[screenshot:Página de gerenciamento de Tags|/tags]

> As tags com cores distintas facilitam a identificação visual rápida dos segmentos no CRM.`,
  },

  // --- Comunicação ---
  {
    id: 'inbox',
    categoryId: 'communication',
    title: 'SAC / Inbox unificado',
    icon: Inbox,
    description: 'Central de atendimento multicanal em um único painel.',
    readTime: '6 min',
    popular: true,
    content: `O Inbox é sua central de atendimento que unifica mensagens de WhatsApp, E-mail e Instagram.

## Visão geral

O Inbox exibe todas as conversas em um painel dividido em:

- **Lista de conversas** à esquerda
- **Chat da conversa selecionada** ao centro
- **Detalhes do contato** à direita

[screenshot:Inbox unificado - Central de Atendimento|/inbox]

## Respondendo mensagens

1. Selecione uma conversa na lista
2. Digite sua resposta no campo de texto
3. Envie com Enter ou clique no botão

## IA no atendimento

- Clique no botão **"Enviar com IA"** para gerar uma resposta inteligente
- A IA analisa o contexto da conversa e sugere uma resposta adequada
- Revise e edite antes de enviar, se necessário

## Transcrição de áudio

Quando receber mensagens de áudio:

1. Clique no botão de transcrição do áudio
2. O texto será gerado automaticamente
3. Útil para ambientes onde não pode ouvir áudio

## Atribuição de atendimentos

Configure regras de atribuição automática:

- **Round Robin** — Distribui igualmente entre atendentes
- **Carga mínima** — Prioriza quem tem menos atendimentos
- **Aleatório** — Distribui aleatoriamente

[screenshot:Configuração do SAC|/inbox-settings]

## Pesquisa CSAT

Configure pesquisas de satisfação automáticas:

1. Acesse Config. SAC no menu
2. Ative a pesquisa CSAT
3. Defina a pergunta e canais
4. A pesquisa é enviada ao encerrar o atendimento

💡 Dica: O Lead Score aparece ao lado do nome do contato no chat. Use para priorizar atendimentos de leads mais qualificados.`,
  },
  {
    id: 'whatsapp',
    categoryId: 'communication',
    title: 'WhatsApp',
    icon: MessageSquare,
    description: 'Conecte seu WhatsApp e gerencie conversas e campanhas.',
    readTime: '5 min',
    popular: true,
    content: `Integre o WhatsApp ao AG Sell para comunicação direta com seus contatos.

## Conectando sua conta

1. Acesse "WhatsApp" no menu lateral
2. Clique em "Conectar WhatsApp"
3. Escaneie o QR Code com seu celular
4. Aguarde a conexão ser estabelecida

[screenshot:Tela de conexão do WhatsApp|/whatsapp]

## Múltiplas instâncias

Você pode conectar vários números de WhatsApp:

- Cada instância funciona independentemente
- Use o seletor no topo para alternar entre contas
- Ideal para equipes com números diferentes

## Campanhas de envio em massa

1. Acesse a aba "Campanhas"
2. Crie uma nova campanha
3. Selecione os contatos destinatários
4. Escreva a mensagem
5. Envie ou agende o envio

⚠️ Atenção: Respeite as políticas do WhatsApp sobre envio em massa. Envios excessivos podem resultar em bloqueio da conta.

## Grupos

- Visualize seus grupos do WhatsApp
- Envie mensagens para grupos diretamente pela plataforma
- Gerencie participantes`,
  },
  {
    id: 'email-marketing',
    categoryId: 'communication',
    title: 'E-mail Marketing',
    icon: Mail,
    description: 'Crie campanhas de e-mail com editor visual e métricas.',
    readTime: '4 min',
    content: `O módulo de E-mail permite criar e enviar campanhas profissionais.

## Criando uma campanha

1. Acesse "E-mail" no menu lateral
2. Clique em "Nova Campanha"
3. Defina nome e assunto do e-mail
4. Use o editor visual para montar o conteúdo
5. Selecione os destinatários
6. Envie ou agende

[screenshot:Módulo de E-mail Marketing|/email]

## Templates

- Utilize templates pré-prontos como base
- Personalize cores, fontes e imagens
- Salve seus próprios templates para reuso

## Domínio personalizado

Para melhor entregabilidade:

1. Acesse "Domínio E-mail" no menu
2. Adicione seu domínio
3. Configure os registros DNS (SPF, DKIM, DMARC)
4. Aguarde a verificação automática

## Métricas

Acompanhe em tempo real:

- **Taxa de abertura** — Quantos abriram o e-mail
- **Taxa de cliques** — Quantos clicaram nos links
- **Entregas** — Quantidade de e-mails entregues

[screenshot:Configuração de Domínio de E-mail|/email-domain]`,
  },
  {
    id: 'instagram-integration',
    categoryId: 'communication',
    title: 'Instagram',
    icon: Instagram,
    description: 'Automações de DM e interações no Instagram.',
    readTime: '3 min',
    content: `Conecte contas do Instagram para automação de interações.

## Conectando sua conta

1. Acesse "Instagram" no menu
2. Clique em "Conectar conta"
3. Autorize o acesso via Facebook/Instagram
4. Sua conta aparecerá na lista

[screenshot:Página de automações do Instagram|/instagram]

## Automações de DM

Configure respostas automáticas para:

- Mensagens diretas recebidas
- Comentários em publicações
- Menções em stories

## Configurando uma automação

1. Clique em "Nova Automação"
2. Selecione a conta do Instagram
3. Escolha o tipo de gatilho (DM, comentário, menção)
4. Configure as condições e a resposta
5. Ative a automação

## Histórico de execuções

Acompanhe todas as automações executadas com:

- Data e hora da execução
- Tipo de evento que disparou
- Status (sucesso ou erro)
- Ação tomada`,
  },

  // --- Marketing ---
  {
    id: 'automations',
    categoryId: 'marketing',
    title: 'Automações',
    icon: Zap,
    description: 'Crie fluxos automatizados com gatilhos, condições e ações.',
    readTime: '8 min',
    popular: true,
    content: `O motor de automações permite criar fluxos que executam ações automaticamente.

## Conceitos básicos

Uma automação é composta por:

- **Gatilho** — O evento que inicia a automação
- **Ações** — O que deve ser executado
- **Condições** — Lógica Se/Senão para ramificar o fluxo
- **Enquetes** — Perguntas interativas com ações por resposta

## Gatilhos disponíveis

- Contato criado / atualizado
- Tag adicionada / removida
- Deal movido no pipeline / criado / ganho
- Mensagem recebida (WhatsApp/E-mail)
- Formulário submetido
- Evento de webhook

## Ações disponíveis (20+)

### 💬 Mensagens
- **Enviar E-mail** — Com templates e variáveis
- **Enviar WhatsApp** — Com botões e templates
- **Enviar DM Instagram** — Com quick replies e imagens
- **Enviar SMS** — Via Twilio/Vonage
- **Enviar Enquete** — Pergunta com até 4 opções e ações por resposta
- **Notificar Admin** — Via app ou e-mail

### 📇 CRM & Dados
- **Adicionar/Remover Tag** — Segmentação automática
- **Definir Campo** — Atualizar campos do contato (status, fonte, custom fields)
- **Atualizar Lead Score** — Adicionar, subtrair ou definir pontuação

### 🔀 Fluxo & Sequência
- **Inscrever em Sequência** — Adicionar contato a uma sequência drip
- **Remover de Sequência** — Cancelar inscrição
- **Ir para outro Flow** — Redirecionar para outro fluxo visual
- **Teste A/B (Split)** — Dividir tráfego com slider de porcentagem
- **Condição (Se/Senão)** — Ramificação por campo, tag, score ou resposta de enquete
- **Aguardar** — Delay em minutos, horas ou dias

### 👥 Equipe
- **Atribuir a Agente** — Round robin, menos ocupado ou agente específico
- **Transferir p/ Humano** — Encaminhar para atendimento por departamento
- **Criar Tarefa** — Com título, prazo e prioridade

### ⚙️ Avançado
- **Requisição HTTP** — Webhook externo com método, headers e body customizáveis

[screenshot:Módulo de Automações|/automations]

## Enquetes com ramificação

A ação de **Enquete** permite enviar perguntas interativas e configurar ações diferentes para cada resposta:

1. Defina a pergunta (ex: "Qual produto te interessa?")
2. Adicione até 4 opções de resposta
3. Para cada opção, configure uma ação (adicionar tag, ir para flow, enviar mensagem)
4. A resposta é salva automaticamente em um campo do contato

Exemplo de funil:
- Enquete: "Qual seu interesse?" → Opções: Produto A, Produto B, Serviço
- Se "Produto A" → Tag "interesse-produto-a" + Sequência de vendas A
- Se "Produto B" → Flow de demonstração
- Se "Serviço" → Transferir para humano

## Condições (Se/Senão)

A ação **Condição** permite criar ramificações lógicas:

- **Campo do contato** — Verificar status, fonte, e-mail, etc.
- **Tag** — Verificar se possui uma tag específica
- **Lead Score** — Comparar pontuação
- **Resposta de enquete** — Agir baseado na resposta
- **Última interação** — Dias desde último contato

Operadores: igual, diferente, contém, maior que, menor que, existe/não existe.

Para cada condição, defina ações para **Verdadeiro** e **Falso** (adicionar tag, ir para flow, enviar mensagem, parar automação).

## Templates prontos

Temos templates para cenários comuns:

- Boas-vindas para novos contatos
- Follow-up automático
- Notificação de deal parado
- Nutrição de leads
- Recuperação de carrinho

💡 Dica: Comece com automações simples e vá incrementando. Use enquetes para qualificar leads automaticamente.`,
  },
  {
    id: 'flow-builder',
    categoryId: 'marketing',
    title: 'Flow Builder Visual',
    icon: Workflow,
    description: 'Construtor visual de funis estilo ManyChat para Instagram, WhatsApp e CRM.',
    readTime: '7 min',
    popular: true,
    content: `O Flow Builder é o construtor visual de automações do AG Sell, inspirado no ManyChat.

## Visão geral

O Flow Builder permite criar funis de automação de forma visual e intuitiva, conectando gatilhos a sequências de ações em um canvas interativo.

[screenshot:Flow Builder Visual|/flow-builder]

## Gerenciando seus fluxos

Ao acessar o Flow Builder, você vê a lista **"Meus Fluxos"** com todos os fluxos criados:

- Cada card mostra o gatilho, número de ações e execuções
- Ative/desative fluxos pelo menu de cada card
- Crie quantos fluxos quiser clicando em **"Novo Fluxo"**

## Criando um fluxo

### 1. Escolha o gatilho

O primeiro passo é definir o que inicia seu fluxo:

**Instagram:**
- 📸 Comentário em qualquer post
- 📌 Comentário em post específico
- 💬 DM recebida
- 📖 Resposta ao story (geral ou story específico por URL/ID)
- 🏷️ Menção em story específico
- 👤 Novo seguidor

**WhatsApp:**
- 💬 Mensagem recebida
- ✨ Palavra-chave específica (correspondência exata, contém ou inicia com)
- 🤖 Automação fonte (disparar quando contato vem de automação específica)
- 📨 Origem da mensagem (campanha, grupo, broadcast ou mensagem direta)

**CRM:**
- 👤 Novo contato criado
- 📝 Formulário submetido (com seleção de formulário específico)
- 🔍 Fonte do contato (filtrar por origem: site, anúncios, landing page, indicação, etc.)

### 2. Adicione passos

Após definir o gatilho, adicione ações clicando no botão **+** entre os nós:

**Ações:**
- Enviar DM / Responder comentário
- Enviar WhatsApp / E-mail
- Adicionar/Remover tag
- Atualizar Lead Score
- Notificar equipe
- Criar tarefa

**Condições:**
- Se tem tag
- Se contém palavra-chave
- Se score ≥ valor

**Espera:**
- Aguardar X minutos / horas / dias

### 3. Configure cada passo

Clique em qualquer nó para configurar seus parâmetros:
- Mensagem a enviar (com variáveis como {{nome}})
- Tag a adicionar/remover
- Palavra-chave a verificar
- Tempo de espera

### 4. Salve e ative

- Dê um nome ao seu fluxo
- Ative o switch para que o fluxo comece a funcionar
- Clique em **"Salvar Fluxo"**

## Editando fluxos existentes

- Na lista "Meus Fluxos", clique em qualquer card para abrir o editor
- Todos os nós e configurações são carregados
- Faça alterações e clique em **"Atualizar Fluxo"**

## Exemplos de funis

### Funil Instagram → DM
1. Gatilho: Comentário com palavra "QUERO"
2. Ação: Responder comentário "Mandei no DM! 🚀"
3. Ação: Enviar DM com oferta detalhada
4. Ação: Adicionar tag "interesse-instagram"
5. Espera: 24 horas
6. Condição: Se tem tag "comprou" → Parar
7. Ação: Enviar DM de follow-up

### Funil WhatsApp de Qualificação
1. Gatilho: Palavra-chave "INFO"
2. Ação: Enviar WhatsApp de boas-vindas
3. Ação: Adicionar tag "lead-whatsapp"
4. Ação: Atualizar score +20
5. Ação: Criar tarefa "Follow-up em 48h"

💡 Dica: Combine o Flow Builder com enquetes das Automações para criar funis de qualificação interativos.`,
  },
  {
    id: 'whatsapp-flows',
    categoryId: 'marketing',
    title: 'WhatsApp Flows',
    icon: ListChecks,
    description: 'Formulários interativos para coleta de dados via WhatsApp.',
    readTime: '3 min',
    content: `WhatsApp Flows são formulários interativos enviados diretamente no WhatsApp.

## O que são Flows?

São formulários que o contato preenche dentro do próprio WhatsApp, sem precisar acessar links externos.

## Criando um Flow

1. Acesse "WhatsApp Flows" no menu
2. Clique em "Novo Flow"
3. Monte o formulário com o builder visual
4. Adicione campos: texto, seleção, data, etc.
5. Salve e publique

[screenshot:Builder de WhatsApp Flows|/whatsapp-flows]

## Tipos de campos

- **Texto** — Resposta livre
- **Seleção** — Lista de opções
- **Data** — Seletor de data
- **Número** — Apenas números

## Submissões

- Visualize todas as respostas na aba "Submissões"
- Os dados são automaticamente vinculados ao contato
- Exporte as respostas se necessário`,
  },
  {
    id: 'lead-scoring',
    categoryId: 'marketing',
    title: 'Lead Scoring',
    icon: Target,
    description: 'Qualifique leads automaticamente com pontuação baseada em ações.',
    readTime: '4 min',
    content: `O Lead Scoring atribui pontos aos contatos baseado em suas ações e engajamento.

## Como funciona

Cada ação do lead gera pontos positivos ou negativos:

- **+10** Abriu e-mail
- **+20** Clicou em link
- **+30** Respondeu mensagem
- **+50** Submeteu formulário
- **-10** Não abriu e-mail em 30 dias

## Classificação

Os leads são classificados automaticamente:

- 🟢 **Qualificado** — 70 pontos ou mais
- 🟡 **Morno** — Entre 40 e 69 pontos
- 🔴 **Frio** — Menos de 40 pontos

[screenshot:Configuração de regras de Lead Scoring|/lead-scoring]

## Configurando regras

1. Acesse "Lead Scoring" no menu
2. Crie uma nova regra
3. Selecione o tipo de evento
4. Defina os pontos (positivos ou negativos)
5. Ative a regra

## Usando no atendimento

O score aparece automaticamente:

- No Inbox, ao lado do nome do contato
- Na ficha do contato
- Nos filtros de contatos

💡 Dica: Use o score como gatilho em automações. Exemplo: quando um lead atingir 70 pontos, notifique o vendedor.`,
  },
  {
    id: 'forms',
    categoryId: 'marketing',
    title: 'Formulários de captura',
    icon: FileText,
    description: 'Crie formulários web para captura de leads.',
    readTime: '3 min',
    content: `Crie formulários personalizados para capturar leads em seu site ou landing pages.

## Criando um formulário

1. Acesse "Formulários" no menu
2. Clique em "Novo Formulário"
3. Configure nome e descrição
4. Adicione campos com o editor visual
5. Salve e copie o link

[screenshot:Página de Formulários|/forms]

## Campos disponíveis

- Nome, E-mail, Telefone
- Texto livre
- Seleção de opções
- Campos customizados

## Compartilhando

Cada formulário tem um link público único que pode ser:

- Incorporado em sites e landing pages
- Compartilhado por WhatsApp ou e-mail
- Usado em anúncios

## Submissões

- Contatos são criados automaticamente
- Visualize as respostas na aba "Submissões"
- Dados podem disparar automações`,
  },

  // --- Intelligence ---
  {
    id: 'analytics',
    categoryId: 'intelligence',
    title: 'Analytics e relatórios',
    icon: BarChart3,
    description: 'Dashboards com métricas de vendas, pipeline e equipe.',
    readTime: '4 min',
    content: `O módulo de Analytics oferece dashboards completos para análise do seu negócio.

## Métricas disponíveis

### Vendas
- Receita total e por período
- Ticket médio
- Taxa de conversão
- Evolução mensal

### Pipeline
- Distribuição por etapa
- Tempo médio em cada fase
- Gargalos identificados
- Valor total por etapa

### Equipe
- Performance individual
- Ranking de vendedores
- Deals por membro
- Tempo de resposta

[screenshot:Dashboard de Analytics|/analytics]

## Filtros

Filtre os dados por:

- Período (hoje, semana, mês, trimestre, ano)
- Membro da equipe
- Pipeline/etapa
- Tags

💡 Dica: Acompanhe o Analytics semanalmente para identificar tendências e ajustar sua estratégia.`,
  },
  {
    id: 'ai-assistant',
    categoryId: 'intelligence',
    title: 'Assistente IA',
    icon: Bot,
    description: 'Chat com IA contextual para sugestões e análises.',
    readTime: '3 min',
    content: `O Assistente IA é um chat inteligente integrado ao seu CRM.

## O que ele pode fazer

- Responder perguntas sobre seus dados
- Sugerir próximos passos para deals
- Analisar tendências de vendas
- Gerar textos para e-mails e mensagens
- Dar insights sobre performance

[screenshot:Chat com o Assistente IA|/ai-assistant]

## Como usar

1. Acesse "Assistente IA" no menu
2. Digite sua pergunta ou pedido
3. A IA responde com base nos dados do seu CRM

## Exemplos de perguntas

- "Quais deals estão parados há mais de 7 dias?"
- "Sugira um e-mail de follow-up para o lead João"
- "Qual a minha taxa de conversão este mês?"
- "Resuma as atividades da semana"

> O Assistente tem acesso ao contexto do seu CRM para fornecer respostas relevantes e personalizadas.`,
  },
  {
    id: 'ai-agents',
    categoryId: 'intelligence',
    title: 'Agentes de IA',
    icon: Brain,
    description: 'Agentes autônomos para atendimento automatizado.',
    readTime: '5 min',
    content: `Agentes de IA são assistentes virtuais que podem atender seus clientes automaticamente.

## Criando um agente

1. Acesse "Agentes IA" no menu
2. Clique em "Novo Agente"
3. Defina nome e descrição
4. Escolha o modelo de IA
5. Escreva o prompt de sistema (personalidade e regras)
6. Configure a mensagem de boas-vindas

[screenshot:Página de Agentes de IA|/ai-agents]

## Base de conhecimento (RAG)

Alimente o agente com informações do seu negócio:

1. Na aba "Conhecimento" do agente
2. Adicione documentos, FAQs, políticas
3. O agente usará esse conteúdo para responder

## Canais de atuação

Defina onde o agente deve atuar:

- WhatsApp
- E-mail
- Chat do site

## Métricas

Acompanhe:

- Total de conversas
- Taxa de satisfação
- Transferências para humanos
- Tempo médio de resposta

💡 Dica: Comece com um agente de FAQ que responde dúvidas comuns. Isso libera sua equipe para atendimentos mais complexos.`,
  },
  {
    id: 'gamification',
    categoryId: 'intelligence',
    title: 'Gamificação',
    icon: Trophy,
    description: 'Sistema de pontos, níveis e ranking para engajar a equipe.',
    readTime: '3 min',
    content: `A Gamificação transforma atividades de vendas em um jogo motivacional.

## Como funciona

Cada ação no sistema gera pontos:

- Criar contato: +10 XP
- Fechar deal: +50 XP
- Completar tarefa: +20 XP
- Enviar campanha: +30 XP

## Níveis

Conforme acumula XP, você progride por níveis:

- 🥉 Bronze
- 🥈 Prata
- 🥇 Ouro
- 💎 Diamante

## Ranking

Compare seu desempenho com os colegas:

- Ranking semanal e mensal
- Top performers destacados
- Prêmios para os primeiros colocados

[screenshot:Módulo de Gamificação|/gamification]

## Conquistas

Desbloqueie conquistas especiais:

- "Primeiro Deal" — Feche seu primeiro negócio
- "Máquina de Vendas" — Feche 10 deals em um mês
- "Comunicador" — Envie 100 mensagens`,
  },

  // --- Configurações ---
  {
    id: 'organization',
    categoryId: 'settings',
    title: 'Organização e equipe',
    icon: Building2,
    description: 'Configure sua organização e gerencie membros.',
    readTime: '3 min',
    content: `Gerencie os dados da sua organização e equipe.

## Perfil da organização

1. Acesse "Organização" no menu
2. Configure nome, logo e slug
3. As alterações são refletidas em toda a plataforma

[screenshot:Configurações da Organização|/organization]

## Membros da equipe

### Convidando membros
1. Clique em "Convidar membro"
2. Insira o e-mail
3. Selecione o papel: Owner, Admin ou Membro

### Papéis

- **Owner** — Acesso total, gerencia a organização
- **Admin** — Acesso total, sem poder excluir a organização
- **Membro** — Acesso limitado conforme permissões

> Cada membro recebe acesso imediato após aceitar o convite por e-mail.`,
  },
  {
    id: 'plans-subscription',
    categoryId: 'settings',
    title: 'Planos e assinatura',
    icon: Target,
    description: 'Entenda os planos e gerencie sua assinatura.',
    readTime: '3 min',
    content: `O AG Sell oferece planos com diferentes níveis de recursos.

## Planos disponíveis

Acesse "Planos" no menu para ver todos os planos com:

- Recursos incluídos em cada plano
- Limites de envio (e-mail, WhatsApp, IA)
- Preços mensais

[screenshot:Página de Planos e Assinatura|/plans]

## Assinando ou fazendo upgrade

1. Selecione o plano desejado
2. Clique em "Assinar" ou "Upgrade"
3. Complete o pagamento via Stripe
4. Os recursos são liberados imediatamente

## Gerenciando sua assinatura

- Veja o status atual na página de Planos
- Acompanhe a data de renovação
- Faça upgrade ou downgrade a qualquer momento

⚠️ Ao fazer downgrade, funcionalidades exclusivas do plano anterior serão desativadas no próximo ciclo de cobrança.`,
  },
  {
    id: 'permissions',
    categoryId: 'settings',
    title: 'Permissões e acessos',
    icon: Shield,
    description: 'Controle granular de acesso para cada membro.',
    readTime: '3 min',
    content: `Configure exatamente o que cada membro pode acessar.

## Perfis de permissão

1. Acesse "Permissões" no menu
2. Crie um perfil (ex: "Vendedor", "Suporte")
3. Selecione os módulos permitidos
4. Atribua o perfil aos membros

[screenshot:Configuração de Permissões|/permissions]

## Módulos configuráveis

- CRM (Contatos, Empresas, Pipeline)
- Comunicação (Inbox, WhatsApp, E-mail, Instagram)
- Marketing (Automações, Flow Builder, Sequências, Forms, Growth Tools)
- Testes A/B e Lead Scoring
- Analytics e relatórios
- Agentes de IA e Gamificação
- Configurações administrativas

## Gate de funcionalidades

Recursos que o membro não tem permissão são:

- Ocultos do menu lateral
- Bloqueados se acessados por URL direta
- Uma mensagem amigável indica a restrição`,
  },
  {
    id: 'sequences',
    categoryId: 'settings',
    title: 'Sequências (Drip Campaigns)',
    icon: ListChecks,
    description: 'Envio automatizado de mensagens programadas para nutrição de leads.',
    readTime: '4 min',
    content: `As Sequências permitem criar campanhas de nutrição com envios automáticos em intervalos programados.

## O que são Sequências?

São séries de mensagens (e-mail, WhatsApp, SMS) enviadas automaticamente em intervalos configuráveis. Ideal para:

- Nutrição de leads
- Onboarding de novos clientes
- Follow-up pós-venda
- Educação e engajamento

## Criando uma Sequência

1. Acesse "Sequências" no menu lateral
2. Clique em "Nova Sequência"
3. Defina o nome e descrição
4. Adicione passos com o tipo de envio e intervalo entre cada um
5. Ative a sequência

## Passos da Sequência

Cada passo define:

- **Canal** — E-mail, WhatsApp ou SMS
- **Conteúdo** — A mensagem a ser enviada
- **Delay** — Tempo de espera antes do envio (minutos, horas ou dias)

## Inscrevendo Contatos

Contatos podem ser inscritos:

- **Manualmente** — Selecione contatos e inscreva na sequência
- **Via Automação** — Use a ação "Inscrever em Sequência" em automações
- **Via Flow Builder** — Adicione como ação em fluxos visuais

💡 Dica: Combine sequências com Lead Scoring para criar jornadas inteligentes de nutrição.`,
  },
  {
    id: 'ab-tests',
    categoryId: 'settings',
    title: 'Testes A/B',
    icon: SplitSquareVertical,
    description: 'Compare variantes de mensagens para otimizar conversões.',
    readTime: '3 min',
    content: `Os Testes A/B permitem comparar duas versões de uma mensagem para descobrir qual tem melhor desempenho.

## Como funciona

1. Acesse "Testes A/B" no menu lateral
2. Clique em "Novo Teste"
3. Defina o nome e canal (WhatsApp, E-mail ou Instagram)
4. Crie a Variante A e a Variante B com conteúdos diferentes
5. Inicie o teste

## Métricas

O sistema acompanha automaticamente:

- **Envios** — Quantidade enviada de cada variante
- **Respostas** — Taxa de resposta de cada variante
- **Conversões** — Conversões geradas
- **Vencedor** — Variante com melhor performance

## Boas práticas

- Teste apenas **uma variável** por vez (assunto, CTA, imagem)
- Aguarde um volume mínimo de envios antes de declarar vencedor
- Use o vencedor como base para próximos testes

💡 Dica: Testes A/B também estão disponíveis como ação inline dentro de automações (Split Test).`,
  },
  {
    id: 'growth-tools',
    categoryId: 'settings',
    title: 'Growth Tools',
    icon: Megaphone,
    description: 'Ferramentas de captura: links, QR codes e widgets.',
    readTime: '3 min',
    content: `Growth Tools são ferramentas de captura de leads para atrair contatos para o seu WhatsApp e CRM.

## Tipos de ferramentas

### Links de captura
- Gere links personalizados com mensagem pré-preenchida
- Ao clicar, o contato inicia conversa no WhatsApp
- O contato é criado automaticamente no CRM

### QR Codes
- Gere QR Codes dinâmicos vinculados ao seu WhatsApp
- Ideal para materiais impressos, eventos e vitrines
- Acompanhe escaneamentos e conversões

### Widgets para site
- Botões flutuantes de WhatsApp para seu site
- Configuração visual de cores, posição e mensagem
- Instalação via código embed

## Métricas

Cada ferramenta rastreia:

- **Cliques** — Quantas vezes foi acessada
- **Conversões** — Contatos gerados

💡 Dica: Use Growth Tools com automações para que novos contatos entrem automaticamente em fluxos de nutrição.`,
  },
  {
    id: 'agency-management',
    categoryId: 'settings',
    title: 'Gestão de Agência',
    icon: Briefcase,
    description: 'Modo multi-tenant para agências que gerenciam múltiplas organizações.',
    readTime: '4 min',
    content: `O modo Agência permite gerenciar múltiplas organizações-cliente a partir de uma única conta.

## Adicionando clientes

1. Acesse "Clientes Agência" no menu lateral
2. Clique em "Convidar Cliente"
3. Insira o e-mail do cliente
4. O cliente receberá um convite para vincular sua organização

## Níveis de acesso

- **Operacional** — Acesso para operar o CRM e automações do cliente
- **Completo** — Acesso total, incluindo configurações e planos

## Alternando entre clientes

- Use o seletor de organização no topo da sidebar
- Alterne instantaneamente entre seus clientes
- Todas as ações ficam isoladas por organização

## Plano necessário

O modo Agência requer o plano **Agência (R$997/mês)** e está protegido por Feature Gate.

> Cada organização-cliente mantém seus dados completamente isolados. A agência acessa mas não mistura dados entre clientes.`,
  },
  {
    id: 'api-webhooks',
    categoryId: 'settings',
    title: 'API Keys e Webhooks',
    icon: Key,
    description: 'Integre o AG Sell com outros sistemas via API.',
    readTime: '4 min',
    content: `Use API Keys e Webhooks para integrar o AG Sell com outros sistemas.

## API Keys

### Criando uma chave
1. Acesse "API Keys" no menu
2. Clique em "Nova Chave"
3. Defina nome e permissões
4. Configure limites de requisição
5. Copie a chave gerada (ela não será exibida novamente)

[screenshot:Gerenciamento de API Keys|/api-keys]

### Rate limiting

Configure limites por chave:

- Requisições por minuto
- Requisições por dia

## Webhooks de entrada

### Criando um webhook
1. Acesse "Webhooks" no menu
2. Clique em "Novo Webhook"
3. O sistema gera um endpoint único
4. Configure o mapeamento de campos
5. Use o token de segurança para autenticação

### Integrações suportadas

- Stripe (pagamentos)
- Hotmart (vendas)
- Eduzz (vendas)
- Kiwify (vendas)
- Sistemas customizados

[screenshot:Configuração de Webhooks|/webhooks]

💡 Dica: Combine webhooks com automações para criar fluxos como: "Quando receber pagamento no Stripe, criar contato e mover para pipeline de clientes".`,
  },
  {
    id: 'integrations',
    categoryId: 'settings',
    title: 'Integrações',
    icon: LinkIcon,
    description: 'Conecte o AG Sell a ferramentas e plataformas externas.',
    readTime: '3 min',
    content: `O AG Sell se integra com diversas ferramentas do mercado.

## Integrações disponíveis

### Provedores de pagamento
- **Stripe** — Pagamentos e assinaturas
- **Hotmart** — Vendas de infoprodutos
- **Eduzz** — Vendas digitais
- **Kiwify** — Vendas online

### WhatsApp providers
- **Evolution API** — Servidor próprio
- **Z-API** — API simplificada

### E-mail
- Domínio personalizado (SPF, DKIM, DMARC)

[screenshot:Página de Integrações|/integrations]

## Configurando uma integração

1. Acesse "Integrações" no menu
2. Selecione a integração desejada
3. Siga o assistente de configuração
4. Teste a conexão

> Cada integração tem seu próprio fluxo de configuração. Siga os passos indicados na tela.`,
  },
  {
    id: 'settings-general',
    categoryId: 'settings',
    title: 'Configurações gerais',
    icon: Settings,
    description: 'Tema, notificações e privacidade (LGPD).',
    readTime: '2 min',
    content: `Personalize sua experiência no AG Sell.

## Tema

- Alterne entre **tema claro** e **tema escuro**
- A preferência é salva automaticamente

## Notificações

Configure quais notificações deseja receber:

- Novas mensagens
- Tarefas vencidas
- Movimentações no pipeline
- Atualizações do sistema

## Privacidade (LGPD)

Em conformidade com a LGPD, você pode:

- **Exportar seus dados** — Baixe todos os seus dados pessoais
- **Excluir sua conta** — Solicite a exclusão completa dos dados

[screenshot:Configurações Gerais|/settings]

⚠️ A exclusão de conta é irreversível. Todos os dados serão apagados permanentemente.`,
  },
];
