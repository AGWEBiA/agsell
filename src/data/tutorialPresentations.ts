import {
  Kanban, Users, Inbox, Zap, ListChecks, Target, FileText,
  BarChart3, Shield, Webhook, LinkIcon, Instagram, MessageSquare,
  Trophy, Bot, Settings, Search, Bell, Mail, Globe, Building2,
  Tags, CheckSquare, Vote, Megaphone, Brain, Star, Palette,
  type LucideIcon,
} from 'lucide-react';
import type { TutorialPresentationData } from '@/components/help-center/TutorialPresentation';

export const tutorialPresentations: Record<string, TutorialPresentationData> = {
  // Pipeline / Kanban
  pipeline: {
    id: 'pipeline',
    title: 'Como usar o Pipeline de Vendas',
    description: 'Aprenda a gerenciar negócios no quadro Kanban',
    icon: Kanban,
    color: 'primary',
    slides: [
      {
        title: 'Acesse o Pipeline',
        subtitle: 'O pipeline é o coração das suas vendas.',
        icon: Kanban,
        bullets: [
          'No menu lateral, clique em **Pipeline**',
          'Você verá um quadro Kanban com as etapas do funil',
          'Cada cartão representa um **negócio** com valor, contato e data prevista',
        ],
        route: '/pipeline',
      },
      {
        title: 'Crie um novo negócio',
        subtitle: 'Adicione oportunidades de venda rapidamente.',
        bullets: [
          'Clique no botão **"+ Novo Negócio"** no topo da página',
          'Preencha o título, valor, contato associado e etapa inicial',
          'Defina a **data prevista de fechamento** e probabilidade',
          'Clique em **Salvar** para criar o cartão no Kanban',
        ],
        tip: 'Associe um contato ao negócio para ter o histórico completo.',
      },
      {
        title: 'Mova negócios entre etapas',
        subtitle: 'Arraste e solte para atualizar o progresso.',
        bullets: [
          'Clique e segure um cartão de negócio',
          'Arraste-o para a **próxima etapa** do funil',
          'O status é atualizado automaticamente',
          'Use os filtros no topo para visualizar por responsável ou valor',
        ],
        tip: 'O valor total por etapa é exibido no cabeçalho de cada coluna.',
      },
      {
        title: 'Gerencie etapas do funil',
        subtitle: 'Personalize as fases do seu processo de vendas.',
        bullets: [
          'Acesse **Configurações > Pipeline** para editar etapas',
          'Adicione, renomeie ou reordene as fases do funil',
          'Defina **probabilidades** padrão para cada etapa',
        ],
        warning: 'Remover uma etapa move os negócios para a etapa anterior.',
      },
    ],
  },

  // Contatos
  contacts: {
    id: 'contacts',
    title: 'Como gerenciar Contatos',
    description: 'Organize sua base de contatos de forma eficiente',
    icon: Users,
    color: 'primary',
    slides: [
      {
        title: 'Acesse a lista de contatos',
        subtitle: 'Central de todos os seus leads e clientes.',
        bullets: [
          'No menu lateral, clique em **Contatos**',
          'Veja a lista completa com nome, e-mail, telefone e status',
          'Use os **filtros** e **busca** para encontrar contatos rapidamente',
        ],
        route: '/contacts',
      },
      {
        title: 'Adicione contatos',
        subtitle: 'Cadastre novos leads manualmente ou por importação.',
        bullets: [
          'Clique em **"+ Novo Contato"** e preencha os dados',
          'Para importação em massa, clique em **Importar** e envie um CSV',
          'Mapeie as colunas do CSV para os campos do sistema',
          'Tags são aplicadas automaticamente durante a importação',
        ],
        tip: 'O campo WhatsApp deve incluir o DDI (ex: 5511999999999).',
      },
      {
        title: 'Organize com Tags e Segmentos',
        subtitle: 'Categorize contatos para campanhas direcionadas.',
        bullets: [
          'Selecione contatos e clique em **Aplicar Tag**',
          'Crie tags coloridas em **Tags** no menu lateral',
          'Use filtros combinados para criar **segmentos dinâmicos**',
        ],
      },
      {
        title: 'Perfil do contato',
        subtitle: 'Veja todo o histórico em uma única página.',
        bullets: [
          'Clique no nome do contato para abrir o perfil completo',
          'Veja **atividades**, **negócios**, **tags** e **preferências**',
          'Adicione notas e acompanhe o **lead score** atualizado',
          'Envie mensagens diretamente do perfil (WhatsApp, E-mail)',
        ],
      },
    ],
  },

  // Inbox Unificado
  inbox: {
    id: 'inbox',
    title: 'Como usar o Inbox Unificado',
    description: 'Centralize todas as conversas em um só lugar',
    icon: Inbox,
    color: 'primary',
    slides: [
      {
        title: 'Acesse o Inbox',
        subtitle: 'Todas as mensagens de todos os canais em um lugar.',
        bullets: [
          'No menu lateral, clique em **Inbox**',
          'Veja conversas de WhatsApp, E-mail, Instagram e mais',
          'O painel esquerdo lista as conversas, o direito mostra os detalhes',
        ],
        route: '/inbox',
      },
      {
        title: 'Responda conversas',
        subtitle: 'Interaja com clientes de forma rápida e eficiente.',
        bullets: [
          'Selecione uma conversa na lista à esquerda',
          'Digite sua resposta no campo de texto inferior',
          'Use **Respostas Rápidas** para mensagens frequentes',
          'Anexe arquivos, áudios ou emojis conforme necessário',
        ],
        tip: 'Configure atalhos de teclado para respostas rápidas nas configurações do Inbox.',
      },
      {
        title: 'Atribua e organize',
        subtitle: 'Distribua conversas entre a equipe.',
        bullets: [
          'Clique no ícone de **atribuição** para designar um agente',
          'Use **categorias** e **prioridades** para organizar o fluxo',
          'Marque como **resolvida** quando o atendimento estiver concluído',
        ],
      },
      {
        title: 'Configure regras de atribuição',
        subtitle: 'Automatize a distribuição de conversas.',
        bullets: [
          'Acesse **Inbox > Configurações > Atribuição**',
          'Escolha entre Round Robin, menor carga ou manual',
          'Defina **membros elegíveis** e limite de conversas simultâneas',
        ],
        route: '/inbox/settings',
      },
    ],
  },

  // Automações
  automations: {
    id: 'automations',
    title: 'Como criar Automações',
    description: 'Automatize tarefas repetitivas do seu negócio',
    icon: Zap,
    color: 'primary',
    slides: [
      {
        title: 'Acesse as Automações',
        subtitle: 'Crie fluxos que executam ações automaticamente.',
        bullets: [
          'No menu lateral, clique em **Automações**',
          'Veja suas automações ativas e pausadas',
          'Cada automação tem um **gatilho** e uma ou mais **ações**',
        ],
        route: '/automations',
      },
      {
        title: 'Crie uma automação',
        subtitle: 'Configure gatilhos e ações em poucos cliques.',
        bullets: [
          'Clique em **"+ Nova Automação"**',
          'Escolha o **gatilho**: novo contato, tag adicionada, formulário, etc.',
          'Adicione **ações**: enviar WhatsApp, e-mail, adicionar tag, mover no pipeline',
          'Defina condições e filtros para precisão',
        ],
        tip: 'Use templates prontos para começar rapidamente.',
      },
      {
        title: 'Monitore execuções',
        subtitle: 'Acompanhe o desempenho em tempo real.',
        bullets: [
          'Cada automação mostra o número de **execuções**',
          'Clique para ver o **histórico** de execuções com status',
          'Erros são destacados em vermelho com detalhes do problema',
        ],
      },
      {
        title: 'Templates e boas práticas',
        subtitle: 'Comece com modelos testados e otimizados.',
        bullets: [
          'Explore a galeria de **templates** por caso de uso',
          'Categorias: Boas-vindas, Recuperação, Nutrição, Pós-venda',
          'Personalize o template e ative com um clique',
        ],
        tip: 'Sempre teste a automação com um contato de teste antes de ativar.',
      },
    ],
  },

  // Sequências
  sequences: {
    id: 'sequences',
    title: 'Como configurar Sequências',
    description: 'Crie fluxos drip de follow-up automáticos',
    icon: ListChecks,
    color: 'primary',
    slides: [
      {
        title: 'O que são Sequências?',
        subtitle: 'Envios programados em série para nutrir leads.',
        bullets: [
          'Sequências enviam mensagens em **intervalos definidos**',
          'Ideal para **follow-up**, **onboarding** e **nutrição de leads**',
          'Funcionam via WhatsApp, E-mail ou ambos',
        ],
        route: '/sequences',
      },
      {
        title: 'Crie uma sequência',
        bullets: [
          'Clique em **"+ Nova Sequência"** e dê um nome',
          'Adicione **etapas** com o conteúdo da mensagem',
          'Defina o **intervalo** entre cada etapa (horas ou dias)',
          'Escolha o **canal** de envio para cada etapa',
        ],
      },
      {
        title: 'Adicione contatos à sequência',
        bullets: [
          'Selecione contatos na lista e clique em **"Adicionar à Sequência"**',
          'Ou use **automações** para adicionar automaticamente',
          'Contatos que respondem podem ser **removidos automaticamente**',
        ],
        tip: 'Configure a condição de saída para evitar envios desnecessários.',
      },
      {
        title: 'Acompanhe métricas',
        bullets: [
          'Veja taxas de **abertura**, **clique** e **resposta** por etapa',
          'Identifique etapas com baixa conversão e otimize',
          'Pause ou edite etapas individuais sem afetar o restante',
        ],
      },
    ],
  },

  // Lead Scoring
  'lead-scoring': {
    id: 'lead-scoring',
    title: 'Como usar o Lead Scoring',
    description: 'Pontue leads automaticamente para priorizar vendas',
    icon: Target,
    color: 'primary',
    slides: [
      {
        title: 'O que é Lead Scoring?',
        subtitle: 'Atribua pontos a leads com base em comportamento e perfil.',
        bullets: [
          'Lead Scoring **classifica** seus contatos por potencial de compra',
          'Pontos são atribuídos por **ações** (abrir e-mail, visitar site, responder)',
          'Contatos com maior score recebem **prioridade** na abordagem',
        ],
        route: '/lead-scoring',
      },
      {
        title: 'Configure regras de pontuação',
        bullets: [
          'Acesse **Lead Scoring** no menu lateral',
          'Defina **pontos positivos** para ações desejadas (ex: +10 por resposta)',
          'Defina **pontos negativos** para sinais de desinteresse (ex: -5 por opt-out)',
          'Agrupe regras por **categoria**: perfil, engajamento, comportamento',
        ],
      },
      {
        title: 'Defina faixas de qualificação',
        bullets: [
          'Configure faixas como **Frio** (0-30), **Morno** (31-70), **Quente** (71-100)',
          'Cada faixa pode **acionar automações** diferentes',
          'Leads quentes são notificados à equipe de vendas automaticamente',
        ],
        tip: 'Revise as regras mensalmente com base nas conversões reais.',
      },
    ],
  },

  // Formulários
  forms: {
    id: 'forms',
    title: 'Como criar Formulários',
    description: 'Capture leads com formulários personalizados',
    icon: FileText,
    color: 'primary',
    slides: [
      {
        title: 'Acesse os Formulários',
        subtitle: 'Crie formulários para captura de leads.',
        bullets: [
          'No menu lateral, clique em **Formulários**',
          'Veja seus formulários existentes e métricas de submissão',
          'Cada formulário gera um **link público** e **código embed**',
        ],
        route: '/forms',
      },
      {
        title: 'Crie um formulário',
        bullets: [
          'Clique em **"+ Novo Formulário"** ou use um template',
          'Arraste campos: Nome, E-mail, Telefone, WhatsApp, campos customizados',
          'Configure **validações** e campos obrigatórios',
          'Personalize cores, logo e mensagem de confirmação',
        ],
      },
      {
        title: 'Configure integrações',
        bullets: [
          'Defina quais **tags** serão aplicadas nos leads capturados',
          'Conecte a uma **automação** para follow-up imediato',
          'Adicione o lead ao **pipeline** automaticamente',
          'Configure **webhooks** para integração com ferramentas externas',
        ],
      },
      {
        title: 'Publique e compartilhe',
        bullets: [
          'Copie o **link público** para compartilhar diretamente',
          'Use o **código embed** para inserir no seu site',
          'Acompanhe **visualizações** e **conversões** em tempo real',
        ],
        tip: 'Teste o formulário no preview antes de publicar.',
      },
    ],
  },

  // Analytics
  analytics: {
    id: 'analytics',
    title: 'Como usar o Analytics',
    description: 'Entenda suas métricas e tome decisões baseadas em dados',
    icon: BarChart3,
    color: 'primary',
    slides: [
      {
        title: 'Acesse o Analytics',
        subtitle: 'Dashboards completos para acompanhar resultados.',
        bullets: [
          'No menu lateral, clique em **Analytics**',
          'O dashboard exibe **contatos**, **negócios**, **conversas** e **conversões**',
          'Use filtros de período para análises comparativas',
        ],
        route: '/analytics',
      },
      {
        title: 'Métricas de CRM',
        bullets: [
          'Acompanhe **novos contatos** por período e fonte',
          'Veja a **taxa de conversão** por etapa do pipeline',
          'Analise o **valor total** em cada estágio do funil',
          'Compare desempenho entre **membros** da equipe',
        ],
      },
      {
        title: 'Métricas de Comunicação',
        bullets: [
          'Taxa de **resposta** por canal (WhatsApp, E-mail, Instagram)',
          'Tempo médio de **primeira resposta** e **resolução**',
          'Volume de conversas por dia/semana/mês',
        ],
      },
      {
        title: 'Relatórios personalizados',
        bullets: [
          'Crie relatórios customizados em **Relatórios Personalizados**',
          'Escolha métricas, dimensões e tipo de visualização',
          'Exporte para **CSV** ou **PDF** para compartilhar',
        ],
        route: '/custom-reports',
      },
    ],
  },

  // Permissões
  permissions: {
    id: 'permissions',
    title: 'Como configurar Permissões',
    description: 'Controle o acesso da equipe por módulo',
    icon: Shield,
    color: 'primary',
    slides: [
      {
        title: 'Acesse as Permissões',
        subtitle: 'Defina quem pode ver e editar cada módulo.',
        bullets: [
          'Acesse **Configurações > Permissões** no menu',
          'Veja a lista de **membros** com suas funções',
          'Cada membro pode ter um **perfil de acesso** diferente',
        ],
        route: '/permissions',
      },
      {
        title: 'Crie perfis de acesso',
        bullets: [
          'Clique em **"+ Novo Perfil"** para criar um perfil personalizado',
          'Selecione os **módulos** que o perfil pode acessar',
          'Defina permissões granulares: **ver**, **criar**, **editar**, **excluir**',
          'Exemplos: Vendedor (CRM + Pipeline), Suporte (Inbox + Contatos)',
        ],
        warning: 'Apenas administradores podem alterar permissões de outros membros.',
      },
      {
        title: 'Atribua perfis aos membros',
        bullets: [
          'Selecione um membro na lista',
          'Escolha o **perfil de acesso** desejado',
          'As permissões entram em vigor **imediatamente**',
          'Membros sem acesso verão uma página de restrição',
        ],
        tip: 'Crie perfis específicos para diferentes funções na empresa.',
      },
    ],
  },

  // API e Webhooks
  'api-webhooks': {
    id: 'api-webhooks',
    title: 'Como usar API e Webhooks',
    description: 'Integre com sistemas externos via API REST',
    icon: Webhook,
    color: 'primary',
    slides: [
      {
        title: 'Obtenha sua API Key',
        subtitle: 'Autenticação para acessar a API pública.',
        bullets: [
          'Acesse **Configurações > API Keys**',
          'Clique em **"+ Nova API Key"** e dê um nome descritivo',
          'Copie a chave gerada (ela não será exibida novamente)',
          'Use no header: `Authorization: Bearer SUA_API_KEY`',
        ],
        route: '/api-keys',
        warning: 'Guarde a API Key em local seguro. Não compartilhe publicamente.',
      },
      {
        title: 'Endpoints da API',
        subtitle: 'Acesse contatos, negócios e mais via REST.',
        bullets: [
          'Consulte a **Documentação da API** com todos os endpoints',
          'Endpoints principais: `/contacts`, `/deals`, `/tags`, `/companies`',
          'Suporte a **GET**, **POST**, **PUT** e **DELETE**',
          'Resposta em JSON com paginação automática',
        ],
        route: '/api-docs',
      },
      {
        title: 'Configure Webhooks',
        bullets: [
          'Acesse **Configurações > Webhooks**',
          'Clique em **"+ Novo Webhook"** e defina a URL de destino',
          'Selecione os **eventos** que disparam o webhook',
          'Teste o webhook com o botão **"Testar"** antes de ativar',
        ],
        route: '/webhooks',
      },
      {
        title: 'Integrações prontas',
        bullets: [
          'Explore o **Marketplace de Integrações** para conectores prontos',
          'Stripe, Hotmart, Kiwify, Eduzz e Shopify já estão integrados',
          'Configure cada integração com poucos cliques',
        ],
        route: '/integrations',
        tip: 'Use webhooks para sincronizar dados em tempo real com seu ERP ou BI.',
      },
    ],
  },

  // Instagram
  instagram: {
    id: 'instagram',
    title: 'Como conectar o Instagram',
    description: 'Responda DMs e comentários pelo Inbox',
    icon: Instagram,
    color: 'primary',
    slides: [
      {
        title: 'Conecte sua conta Instagram',
        subtitle: 'Integração via Facebook/Meta Business.',
        bullets: [
          'Acesse **Canais > Instagram** no menu lateral',
          'Clique em **"Conectar Instagram"**',
          'Faça login na conta do **Facebook** vinculada',
          'Selecione a **página** e **conta profissional** do Instagram',
        ],
        route: '/instagram',
      },
      {
        title: 'Receba DMs no Inbox',
        bullets: [
          'Mensagens do Instagram aparecem automaticamente no **Inbox**',
          'Responda diretamente sem sair da plataforma',
          'O histórico completo fica vinculado ao **contato**',
        ],
      },
      {
        title: 'Automatize respostas',
        bullets: [
          'Crie **automações** com gatilho "Nova DM Instagram"',
          'Configure **respostas automáticas** para perguntas frequentes',
          'Use **Agentes de IA** para atendimento 24/7 no Instagram',
        ],
        tip: 'A conta do Instagram precisa ser Profissional (Business ou Creator).',
      },
    ],
  },

  // Gamificação
  gamification: {
    id: 'gamification',
    title: 'Como usar a Gamificação',
    description: 'Engaje a equipe com pontos, níveis e conquistas',
    icon: Trophy,
    color: 'primary',
    slides: [
      {
        title: 'Ative a Gamificação',
        subtitle: 'Transforme metas em um jogo para a equipe.',
        bullets: [
          'Acesse **Gamificação** no menu lateral',
          'O sistema atribui pontos por ações realizadas automaticamente',
          'Ações: fechar negócios, responder rápido, completar tarefas',
        ],
        route: '/gamification',
      },
      {
        title: 'Níveis e conquistas',
        bullets: [
          'Membros avançam de **nível** conforme acumulam pontos',
          'Conquistas são desbloqueadas por **marcos** específicos',
          'Ex: "Primeira Venda", "100 Conversas", "Streak 7 Dias"',
        ],
      },
      {
        title: 'Ranking e competição',
        bullets: [
          'O **ranking** mostra a posição de cada membro da equipe',
          'Rankings semanais e mensais motivam performance contínua',
          'Use o widget na dashboard para visibilidade constante',
        ],
        tip: 'Combine gamificação com metas reais para aumentar a motivação.',
      },
    ],
  },

  // Integrações
  integrations: {
    id: 'integrations',
    title: 'Como configurar Integrações',
    description: 'Conecte ferramentas externas ao AG Sell',
    icon: Globe,
    color: 'primary',
    slides: [
      {
        title: 'Acesse o Marketplace',
        subtitle: 'Todas as integrações disponíveis em um só lugar.',
        bullets: [
          'Acesse **Integrações** no menu lateral',
          'Browse por categoria: Pagamentos, E-commerce, Marketing',
          'Cada card mostra o status da conexão e ações disponíveis',
        ],
        route: '/integrations',
      },
      {
        title: 'Conecte uma integração',
        bullets: [
          'Clique na integração desejada (ex: Stripe, Hotmart, Shopify)',
          'Insira as **credenciais** ou **chave de API** solicitada',
          'Configure os **webhooks** automáticos quando disponível',
          'Teste a conexão com o botão **"Verificar"**',
        ],
      },
      {
        title: 'Webhooks de pagamento',
        bullets: [
          'Integrações de pagamento criam **webhooks automaticamente**',
          'Eventos de compra atualizam o contato e disparam automações',
          'Suporte a Stripe, Hotmart, Eduzz, Kiwify e Shopify',
        ],
        tip: 'Use as automações para enviar mensagem de boas-vindas após a compra.',
      },
    ],
  },

  // Empresas
  companies: {
    id: 'companies',
    title: 'Como gerenciar Empresas',
    description: 'Organize contatos B2B por empresa',
    icon: Building2,
    color: 'primary',
    slides: [
      {
        title: 'Acesse o módulo Empresas',
        bullets: [
          'No menu lateral, clique em **Empresas**',
          'Veja a lista completa com nome, setor, tamanho e domínio',
          'Use filtros para encontrar empresas por critérios específicos',
        ],
        route: '/companies',
      },
      {
        title: 'Cadastre uma empresa',
        bullets: [
          'Clique em **"+ Nova Empresa"**',
          'Preencha nome, domínio, setor, tamanho e dados de contato',
          'Vincule **contatos** existentes à empresa',
        ],
      },
      {
        title: 'Visualize o panorama B2B',
        bullets: [
          'No perfil da empresa, veja todos os **contatos vinculados**',
          'Acompanhe **negócios** ativos relacionados',
          'Registre **atividades** e notas no histórico da empresa',
        ],
        tip: 'O domínio da empresa pode associar contatos automaticamente pelo e-mail.',
      },
    ],
  },

  // Tags
  tags: {
    id: 'tags',
    title: 'Como usar Tags',
    description: 'Organize e segmente seus contatos com tags',
    icon: Tags,
    color: 'primary',
    slides: [
      {
        title: 'Crie e gerencie tags',
        bullets: [
          'Acesse **Tags** no menu lateral para ver todas as tags',
          'Clique em **"+ Nova Tag"** e defina nome e cor',
          'Tags podem ser aplicadas a **contatos**, **negócios** e **empresas**',
        ],
        route: '/tags',
      },
      {
        title: 'Aplique tags nos contatos',
        bullets: [
          'Selecione contatos na lista e use **"Aplicar Tag"**',
          'Tags são aplicadas automaticamente via **automações** e **formulários**',
          'No perfil do contato, veja e edite as tags atribuídas',
        ],
      },
      {
        title: 'Use tags como filtros e gatilhos',
        bullets: [
          'Filtre contatos por tag na lista de contatos',
          'Use tags como **gatilho** em automações (tag adicionada/removida)',
          'Segmente campanhas de WhatsApp e E-mail por tags',
        ],
        tip: 'Use uma convenção de cores: verde=clientes, azul=leads, vermelho=importante.',
      },
    ],
  },

  // Tarefas
  tasks: {
    id: 'tasks',
    title: 'Como usar Tarefas',
    description: 'Organize atividades e follow-ups da equipe',
    icon: CheckSquare,
    color: 'primary',
    slides: [
      {
        title: 'Acesse as Tarefas',
        bullets: [
          'No menu lateral, clique em **Tarefas**',
          'Veja tarefas pendentes, em andamento e concluídas',
          'Alterne entre visualização de **lista** e **calendário**',
        ],
        route: '/tasks',
      },
      {
        title: 'Crie uma tarefa',
        bullets: [
          'Clique em **"+ Nova Tarefa"**',
          'Defina título, descrição, **prazo** e **prioridade**',
          'Vincule a um **contato** ou **negócio** para contexto',
          'Atribua a um membro da equipe',
        ],
      },
      {
        title: 'Acompanhe e conclua',
        bullets: [
          'Tarefas atrasadas são destacadas em **vermelho**',
          'Marque como concluída com um clique',
          'Use o calendário para ter uma visão geral dos prazos',
        ],
        tip: 'Crie tarefas automaticamente via automações para follow-ups.',
      },
    ],
  },

  // Testes A/B
  'ab-tests': {
    id: 'ab-tests',
    title: 'Como fazer Testes A/B',
    description: 'Teste variações de mensagens para otimizar resultados',
    icon: Vote,
    color: 'primary',
    slides: [
      {
        title: 'O que são Testes A/B?',
        subtitle: 'Compare duas versões de mensagem para ver qual performa melhor.',
        bullets: [
          'Acesse **Testes A/B** no menu lateral',
          'Cada teste compara **Variante A** vs **Variante B**',
          'O sistema distribui os envios e mede resultados automaticamente',
        ],
        route: '/ab-tests',
      },
      {
        title: 'Crie um teste',
        bullets: [
          'Clique em **"+ Novo Teste A/B"**',
          'Escolha o canal: **WhatsApp** ou **E-mail**',
          'Escreva duas variações da mensagem',
          'Defina a **audiência** e o **critério de vitória** (abertura, clique, resposta)',
        ],
      },
      {
        title: 'Analise resultados',
        bullets: [
          'Acompanhe em tempo real os **envios**, **respostas** e **conversões**',
          'O sistema indica o **vencedor** com significância estatística',
          'Use o aprendizado para otimizar suas próximas campanhas',
        ],
        tip: 'Teste uma variável por vez (assunto, CTA, tom) para resultados claros.',
      },
    ],
  },

  // Growth Tools
  'growth-tools': {
    id: 'growth-tools',
    title: 'Como usar Growth Tools',
    description: 'Ferramentas para capturar e converter leads',
    icon: Megaphone,
    color: 'primary',
    slides: [
      {
        title: 'Acesse os Growth Tools',
        subtitle: 'Links, QR Codes e ferramentas de captura.',
        bullets: [
          'No menu lateral, clique em **Growth Tools**',
          'Veja links de captura, QR Codes e ferramentas disponíveis',
          'Cada ferramenta gera um **link rastreável** com métricas',
        ],
        route: '/growth-tools',
      },
      {
        title: 'Crie links de captura',
        bullets: [
          'Gere **links personalizados** para cada campanha',
          'Adicione **UTMs** automaticamente para rastreamento',
          'Redirecione para WhatsApp, formulário ou landing page',
        ],
      },
      {
        title: 'QR Codes inteligentes',
        bullets: [
          'Gere **QR Codes** vinculados a qualquer link de captura',
          'Ideal para materiais impressos, eventos e pontos de venda',
          'Acompanhe **scans** e **conversões** em tempo real',
        ],
        tip: 'Use Growth Tools em combinação com automações para nutrição automática.',
      },
    ],
  },

  // SMS Marketing
  'sms-marketing': {
    id: 'sms-marketing',
    title: 'Como usar SMS Marketing',
    description: 'Envie mensagens SMS para sua base de contatos',
    icon: MessageSquare,
    color: 'primary',
    slides: [
      {
        title: 'Configure o SMS',
        bullets: [
          'Acesse **SMS Marketing** no menu lateral',
          'Adquira **créditos SMS** no pacote desejado',
          'Cada mensagem consome créditos conforme o destino',
        ],
        route: '/sms',
      },
      {
        title: 'Envie campanhas SMS',
        bullets: [
          'Clique em **"+ Nova Campanha SMS"**',
          'Selecione os contatos ou segmento de destino',
          'Escreva a mensagem (até 160 caracteres por segmento)',
          'Agende o envio ou dispare imediatamente',
        ],
        warning: 'Respeite a LGPD: envie apenas para contatos com consentimento.',
      },
    ],
  },

  // Metas e Objetivos
  goals: {
    id: 'goals',
    title: 'Como definir Metas',
    description: 'Configure objetivos mensuráveis para a equipe',
    icon: Target,
    color: 'primary',
    slides: [
      {
        title: 'Acesse as Metas',
        bullets: [
          'No menu lateral, clique em **Metas**',
          'Veja metas ativas com progresso em tempo real',
          'Cada meta pode ser de **valor**, **quantidade** ou **evento**',
        ],
        route: '/goals',
      },
      {
        title: 'Crie uma meta',
        bullets: [
          'Clique em **"+ Nova Meta"** e defina o objetivo',
          'Escolha o tipo: vendas (R$), contatos, negócios fechados',
          'Defina o **valor alvo** e o **prazo**',
          'O progresso é atualizado automaticamente pelo sistema',
        ],
        tip: 'Combine metas com gamificação para maior engajamento da equipe.',
      },
    ],
  },

  // Assistente IA
  'ai-assistant': {
    id: 'ai-assistant',
    title: 'Como usar o Assistente IA',
    description: 'Chat inteligente para análises e sugestões',
    icon: Bot,
    color: 'primary',
    slides: [
      {
        title: 'Acesse o Assistente IA',
        subtitle: 'Seu co-piloto inteligente de vendas.',
        bullets: [
          'No menu lateral, clique em **Assistente IA**',
          'O chat usa IA para responder perguntas sobre seus dados',
          'Peça análises, sugestões de abordagem e resumos',
        ],
        route: '/ai-assistant',
      },
      {
        title: 'O que você pode perguntar',
        bullets: [
          '"Quais contatos estão mais engajados esta semana?"',
          '"Resuma as métricas de vendas do mês"',
          '"Sugira uma mensagem de follow-up para o lead X"',
          '"Quais automações estão com erro?"',
        ],
        tip: 'Quanto mais contexto você fornecer na pergunta, melhor a resposta.',
      },
    ],
  },

  // Relatórios de Inbox
  'inbox-reports': {
    id: 'inbox-reports',
    title: 'Como usar Relatórios do Inbox',
    description: 'Métricas detalhadas do atendimento ao cliente',
    icon: BarChart3,
    color: 'primary',
    slides: [
      {
        title: 'Acesse os Relatórios',
        bullets: [
          'No Inbox, clique em **Relatórios** no menu',
          'Veja métricas de tempo de resposta, volume e satisfação',
          'Filtre por período, agente ou canal',
        ],
        route: '/inbox/reports',
      },
      {
        title: 'Métricas principais',
        bullets: [
          '**Tempo médio de primeira resposta** por agente',
          '**Taxa de resolução** e tempo médio de resolução',
          '**Volume de conversas** por canal e dia',
          '**CSAT** (satisfação do cliente) por pesquisa',
        ],
        tip: 'Compare períodos para identificar tendências de melhoria.',
      },
    ],
  },

  // Site Tracking
  'site-tracking': {
    id: 'site-tracking',
    title: 'Como configurar Site Tracking',
    description: 'Rastreie visitas no seu site e identifique leads',
    icon: Search,
    color: 'primary',
    slides: [
      {
        title: 'Instale o tracking',
        bullets: [
          'Acesse **Site Tracking** no menu lateral',
          'Copie o **código JavaScript** gerado',
          'Cole no **<head>** de todas as páginas do seu site',
          'As visitas começam a ser rastreadas automaticamente',
        ],
        route: '/site-tracking',
      },
      {
        title: 'Identifique visitantes',
        bullets: [
          'Visitantes conhecidos são vinculados ao **contato** automaticamente',
          'Veja quais páginas cada contato visitou e quando',
          'Use visitas como **gatilho** em automações e lead scoring',
        ],
        tip: 'Combine com formulários para identificar visitantes anônimos.',
      },
    ],
  },

  // Atribuição
  attribution: {
    id: 'attribution',
    title: 'Como usar Atribuição de Marketing',
    description: 'Entenda quais canais geram mais conversões',
    icon: Target,
    color: 'primary',
    slides: [
      {
        title: 'Acesse a Atribuição',
        bullets: [
          'No menu lateral, clique em **Atribuição**',
          'Veja touchpoints de conversão por canal, fonte e campanha',
          'O sistema rastreia toda a jornada do lead até a conversão',
        ],
        route: '/attribution',
      },
      {
        title: 'Analise touchpoints',
        bullets: [
          'Cada conversão mostra os **pontos de contato** envolvidos',
          'Compare modelos: **primeiro toque**, **último toque**, **linear**',
          'Identifique os canais com melhor **ROI**',
        ],
        tip: 'Use UTMs nos seus links para rastreamento mais preciso.',
      },
    ],
  },
};
