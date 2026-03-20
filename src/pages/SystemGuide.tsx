import React, { useState } from 'react';
import {
  LayoutDashboard, Users, Building2, Kanban, Tags, CheckSquare,
  Inbox, Mail, MessageSquare, Zap, BarChart3, Target, FileText,
  Link as LinkIcon, Settings, Bot, Brain, Trophy, Shield, Key,
  Webhook, SlidersHorizontal, Instagram, ListChecks, Search,
  BookOpen, ChevronRight, Lightbulb, Bell, Globe, Lock, Database,
  HelpCircle, Megaphone, Wrench, Workflow, Vote, SplitSquareVertical, Briefcase,
  Link as LinkIcon, Phone,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  description: string;
  features: {
    title: string;
    description: string;
  }[];
}

const guideSections: GuideSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Painel central com visão consolidada de todas as métricas do seu negócio.',
    features: [
      { title: 'Métricas em tempo real', description: 'Acompanhe contatos, negócios, receita e taxas de conversão atualizados automaticamente.' },
      { title: 'Gráficos interativos', description: 'Visualize tendências de vendas, pipeline e atividades com gráficos dinâmicos.' },
      { title: 'Atividades recentes', description: 'Feed de todas as ações realizadas na plataforma, incluindo criação de contatos, movimentações no pipeline e mensagens.' },
      { title: 'Tarefas pendentes', description: 'Lista rápida de tarefas que precisam de atenção imediata.' },
    ],
  },
  {
    id: 'tasks',
    title: 'Tarefas',
    icon: CheckSquare,
    description: 'Gerencie todas as suas tarefas com visualização em lista e calendário.',
    features: [
      { title: 'Criação de tarefas', description: 'Crie tarefas com título, descrição, prioridade, data de vencimento e responsável.' },
      { title: 'Visualização em calendário', description: 'Veja suas tarefas organizadas por data em um calendário interativo.' },
      { title: 'Filtros e busca', description: 'Filtre tarefas por status (pendente, em andamento, concluída), prioridade e responsável.' },
      { title: 'Vinculação com contatos', description: 'Associe tarefas a contatos e negócios do CRM para melhor rastreamento.' },
    ],
  },
  {
    id: 'contacts',
    title: 'Contatos',
    icon: Users,
    description: 'Base centralizada de todos os seus contatos com informações completas.',
    features: [
      { title: 'Cadastro completo', description: 'Registre nome, e-mail, telefone, WhatsApp, empresa, cargo e notas para cada contato.' },
      { title: 'Importação em massa', description: 'Importe contatos via arquivo CSV com mapeamento automático de campos.' },
      { title: 'Lead Score', description: 'Pontuação automática de qualificação baseada em regras configuráveis.' },
      { title: 'Tags e segmentação', description: 'Organize contatos com tags coloridas para segmentação e campanhas.' },
      { title: 'Timeline de atividades', description: 'Histórico completo de interações, e-mails, mensagens e tarefas vinculadas ao contato.' },
    ],
  },
  {
    id: 'companies',
    title: 'Empresas',
    icon: Building2,
    description: 'Gestão de empresas e organizações vinculadas aos seus contatos.',
    features: [
      { title: 'Perfil da empresa', description: 'Cadastre nome, domínio, setor, porte, telefone e endereço completo.' },
      { title: 'Contatos vinculados', description: 'Visualize todos os contatos associados a cada empresa.' },
      { title: 'Negócios ativos', description: 'Acompanhe todos os deals em andamento com a empresa.' },
    ],
  },
  {
    id: 'pipeline',
    title: 'Pipeline',
    icon: Kanban,
    description: 'Gerencie seu funil de vendas com visualização Kanban intuitiva.',
    features: [
      { title: 'Quadro Kanban', description: 'Arraste e solte cards entre as etapas do funil para atualizar o status dos negócios.' },
      { title: 'Etapas personalizáveis', description: 'Configure as etapas do pipeline de acordo com o seu processo de vendas.' },
      { title: 'Valores e probabilidade', description: 'Defina valor, moeda e probabilidade de fechamento para cada deal.' },
      { title: 'Filtros avançados', description: 'Filtre negócios por etapa, valor, responsável e data prevista de fechamento.' },
    ],
  },
  {
    id: 'tags',
    title: 'Tags',
    icon: Tags,
    description: 'Sistema de etiquetas coloridas para organização e segmentação.',
    features: [
      { title: 'Cores personalizáveis', description: 'Crie tags com cores distintas para facilitar a identificação visual.' },
      { title: 'Aplicação múltipla', description: 'Aplique várias tags a um mesmo contato para segmentação cruzada.' },
      { title: 'Uso em automações', description: 'Utilize tags como gatilhos e ações em fluxos de automação.' },
    ],
  },
  {
    id: 'inbox',
    title: 'SAC / Inbox',
    icon: Inbox,
    description: 'Central unificada de atendimento multicanal com atribuição inteligente.',
    features: [
      { title: 'Inbox unificado', description: 'Receba e responda mensagens de WhatsApp, e-mail e Instagram em um único painel.' },
      { title: 'Atribuição automática', description: 'Configure regras de distribuição (round-robin, carga mínima, aleatório) para atendentes.' },
      { title: 'Gestão de atendentes', description: 'Cadastre atendentes com departamento, status e capacidade máxima de atendimentos simultâneos.' },
      { title: 'IA no atendimento', description: 'Use o botão "Enviar com IA" para gerar respostas inteligentes baseadas no contexto da conversa.' },
      { title: 'Transcrição de áudio', description: 'Transcreva mensagens de áudio automaticamente para texto.' },
      { title: 'Pesquisa CSAT', description: 'Configure pesquisas de satisfação automáticas ao encerrar atendimentos.' },
      { title: 'Score do Lead', description: 'Visualize a qualificação do lead (qualificado, morno ou frio) diretamente na conversa.' },
    ],
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp',
    icon: MessageSquare,
    description: 'Integração completa com WhatsApp para comunicação e campanhas.',
    features: [
      { title: 'Conexão via QR Code', description: 'Conecte sua conta do WhatsApp escaneando um QR code diretamente na plataforma.' },
      { title: 'Múltiplas instâncias', description: 'Gerencie diversas contas/números de WhatsApp simultaneamente com número de telefone visível para identificação.' },
      { title: 'Envio em massa', description: 'Crie e gerencie campanhas de envio de mensagens para listas de contatos.' },
      { title: 'Gerenciamento de Grupos', description: 'Importe grupos do WhatsApp via dispositivo conectado, configure tags de grupo e tags de leads, ative sincronização automática de membros e envie mensagens com agendamento.' },
      { title: 'Configuração de Dispositivo', description: 'Importe todos os grupos e contatos de um dispositivo conectado com um clique. Visualize o número de telefone para fácil identificação.' },
      { title: 'Ações em lote', description: 'Edite tags e configurações de múltiplos grupos simultaneamente com edição em lote.' },
      { title: 'Seletor de instância', description: 'Alterne facilmente entre diferentes instâncias conectadas.' },
    ],
  },
  {
    id: 'email',
    title: 'E-mail Marketing',
    icon: Mail,
    description: 'Plataforma completa de e-mail marketing com editor visual.',
    features: [
      { title: 'Editor de templates', description: 'Crie e-mails visualmente com editor drag-and-drop e templates pré-prontos.' },
      { title: 'Campanhas', description: 'Crie, agende e envie campanhas de e-mail com rastreamento de abertura e cliques.' },
      { title: 'Domínio personalizado', description: 'Configure seu próprio domínio de envio com verificação SPF, DKIM e DMARC.' },
      { title: 'Métricas', description: 'Acompanhe taxas de abertura, cliques e entregas em tempo real.' },
    ],
  },
  {
    id: 'instagram',
    title: 'Instagram',
    icon: Instagram,
    description: 'Automação de interações no Instagram para engajamento e conversão.',
    features: [
      { title: 'Contas conectadas', description: 'Vincule múltiplas contas do Instagram à plataforma.' },
      { title: 'Automações de DM', description: 'Configure respostas automáticas para mensagens diretas, comentários e menções.' },
      { title: 'Histórico de execuções', description: 'Visualize logs detalhados de todas as automações executadas.' },
    ],
  },
  {
    id: 'automations',
    title: 'Automações',
    icon: Zap,
    description: 'Motor de automação com 20+ ações, enquetes, condições e ramificações.',
    features: [
      { title: 'Gatilhos configuráveis', description: 'Dispare automações baseadas em eventos como criação de contato, movimentação de deal, recebimento de mensagem e mais.' },
      { title: '20+ Ações disponíveis', description: 'Envie e-mail, WhatsApp, DM Instagram, SMS. Adicione tags, defina campos, atualize score. Inscreva em sequências, faça requisições HTTP e mais.' },
      { title: 'Enquetes interativas', description: 'Envie perguntas com até 4 opções e configure ações diferentes para cada resposta. Ideal para qualificação de leads.' },
      { title: 'Condições (Se/Senão)', description: 'Ramifique automações por campo do contato, tag, score, resposta de enquete ou última interação com operadores avançados.' },
      { title: 'Teste A/B (Split)', description: 'Divida o tráfego entre variantes com slider de porcentagem para otimizar conversão.' },
      { title: 'Atribuição inteligente', description: 'Atribua a agentes via round robin, menos ocupado ou específico. Transfira para humano por departamento.' },
      { title: 'Requisição HTTP', description: 'Integre com qualquer sistema externo via webhook com método, headers e body customizáveis.' },
      { title: 'Templates prontos', description: 'Utilize templates de automação pré-configurados para cenários comuns.' },
      { title: 'Histórico de execuções', description: 'Monitore todas as execuções com status, erros e resultados detalhados.' },
    ],
  },
  {
    id: 'flow-builder',
    title: 'Flow Builder Visual',
    icon: Workflow,
    badge: 'NOVO',
    description: 'Construtor visual de funis estilo ManyChat para Instagram, WhatsApp e CRM.',
    features: [
      { title: 'Canvas visual intuitivo', description: 'Monte funis de automação arrastando e conectando blocos em um editor visual, sem precisar de código.' },
      { title: 'Múltiplos fluxos', description: 'Crie e gerencie quantos fluxos quiser. Cada um com seu gatilho, ações e configurações independentes.' },
      { title: 'Gatilhos Instagram', description: 'Comentários (geral ou post específico), DMs recebidas, respostas a stories específicos, menções e novos seguidores.' },
      { title: 'Gatilhos WhatsApp', description: 'Mensagens recebidas, palavras-chave (exata, contém, inicia com), automação fonte e origem da mensagem (campanha, grupo, broadcast, direto).' },
      { title: 'Gatilhos CRM', description: 'Novo contato criado, formulário submetido (com seleção de formulário específico) e filtro por fonte/origem do contato.' },
      { title: 'Ações encadeadas', description: 'Enviar DM, responder comentário, enviar WhatsApp/e-mail, adicionar tags, atualizar score, criar tarefas.' },
      { title: 'Condições lógicas', description: 'Ramifique o fluxo com verificações de tag, palavra-chave ou lead score.' },
      { title: 'Delays configuráveis', description: 'Insira pausas em minutos, horas ou dias entre as ações do fluxo.' },
      { title: 'Edição de fluxos existentes', description: 'Reabra qualquer fluxo salvo para editar nós, configurações e ativar/desativar.' },
    ],
  },
  {
    id: 'whatsapp-flows',
    title: 'WhatsApp Flows',
    icon: ListChecks,
    description: 'Construtor de formulários interativos para coleta de dados via WhatsApp.',
    features: [
      { title: 'Builder visual', description: 'Monte formulários com campos de texto, seleção, data e mais, sem código.' },
      { title: 'Submissões', description: 'Receba e visualize as respostas dos formulários em tempo real.' },
      { title: 'Integração com contatos', description: 'Vincule submissões automaticamente aos contatos do CRM.' },
    ],
  },
  {
    id: 'lead-scoring',
    title: 'Lead Scoring',
    icon: Target,
    description: 'Sistema de pontuação automática para qualificação de leads.',
    features: [
      { title: 'Regras de pontuação', description: 'Configure regras baseadas em eventos (abertura de e-mail, visita, resposta, etc.) com pontos positivos ou negativos.' },
      { title: 'Classificação automática', description: 'Leads são classificados automaticamente como qualificado (70+), morno (40-69) ou frio (<40).' },
      { title: 'Integração com automações', description: 'Use o score como gatilho para automações e fluxos de nutrição.' },
    ],
  },
  {
    id: 'forms',
    title: 'Formulários',
    icon: FileText,
    description: 'Criação de formulários web para captura de leads.',
    features: [
      { title: 'Builder de formulários', description: 'Crie formulários com campos personalizáveis e configurações de layout.' },
      { title: 'Submissões', description: 'Visualize todas as respostas recebidas com dados estruturados.' },
      { title: 'Criação automática de contatos', description: 'Novos contatos são criados automaticamente a partir das submissões.' },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: BarChart3,
    description: 'Dashboards analíticos com métricas multidimensionais.',
    features: [
      { title: 'Métricas de vendas', description: 'Receita, ticket médio, taxa de conversão e evolução ao longo do tempo.' },
      { title: 'Análise de pipeline', description: 'Distribuição por etapa, tempo médio em cada fase e gargalos.' },
      { title: 'Performance de equipe', description: 'Compare resultados entre membros da equipe e identifique top performers.' },
      { title: 'Relatórios de campanhas', description: 'Resultados de campanhas de e-mail e WhatsApp com métricas de engajamento.' },
    ],
  },
  {
    id: 'ai-assistant',
    title: 'Assistente IA',
    icon: Bot,
    description: 'Assistente de inteligência artificial integrado ao CRM.',
    features: [
      { title: 'Chat contextual', description: 'Converse com a IA que tem acesso ao contexto do seu CRM para respostas relevantes.' },
      { title: 'Sugestões inteligentes', description: 'Receba sugestões de próximos passos, abordagens e estratégias.' },
      { title: 'Análise de dados', description: 'Peça análises e insights sobre seus dados de vendas e contatos.' },
    ],
  },
  {
    id: 'ai-agents',
    title: 'Agentes de IA',
    icon: Brain,
    description: 'Agentes autônomos de IA para atendimento e automação.',
    features: [
      { title: 'Criação de agentes', description: 'Configure agentes com nome, modelo de IA, prompt de sistema e mensagem de boas-vindas.' },
      { title: 'Base de conhecimento', description: 'Alimente agentes com documentos e informações específicas do seu negócio (RAG).' },
      { title: 'Canais de atuação', description: 'Defina em quais canais (WhatsApp, e-mail, chat) o agente deve atuar.' },
      { title: 'Métricas de conversas', description: 'Acompanhe conversas, satisfação e transferências para humanos.' },
    ],
  },
  {
    id: 'gamification',
    title: 'Gamificação',
    icon: Trophy,
    description: 'Sistema de gamificação para engajamento da equipe de vendas.',
    features: [
      { title: 'Pontos e XP', description: 'Acumule pontos por ações como criar contatos, fechar deals e completar tarefas.' },
      { title: 'Níveis', description: 'Progrida por níveis conforme acumula experiência.' },
      { title: 'Ranking', description: 'Compete com colegas em um ranking de desempenho.' },
      { title: 'Conquistas', description: 'Desbloqueie conquistas especiais por marcos alcançados.' },
    ],
  },
  {
    id: 'integrations',
    title: 'Integrações',
    icon: LinkIcon,
    description: 'Conecte o AG Sell a outras ferramentas e plataformas.',
    features: [
      { title: 'Provedores de pagamento', description: 'Integre com Stripe, Hotmart, Eduzz e Kiwify via webhooks.' },
      { title: 'WhatsApp providers', description: 'Configure provedores de WhatsApp (Evolution API, Z-API, etc.).' },
      { title: 'Webhooks de entrada', description: 'Receba dados de sistemas externos via webhooks configuráveis.' },
    ],
  },
  {
    id: 'organization',
    title: 'Organização',
    icon: Building2,
    description: 'Gestão da organização, equipe e configurações gerais.',
    features: [
      { title: 'Perfil da organização', description: 'Configure nome, logo e slug da sua organização.' },
      { title: 'Membros da equipe', description: 'Convide e gerencie membros com diferentes papéis (owner, admin, member).' },
      { title: 'Convites por e-mail', description: 'Envie convites para novos membros da equipe.' },
    ],
  },
  {
    id: 'plans',
    title: 'Planos e Assinatura',
    icon: Target,
    description: 'Gestão de planos, assinaturas e checkout com Stripe.',
    features: [
      { title: 'Planos disponíveis', description: 'Visualize e compare os planos disponíveis com seus recursos.' },
      { title: 'Checkout integrado', description: 'Assine ou faça upgrade diretamente pela plataforma com pagamento via Stripe.' },
      { title: 'Gestão de assinatura', description: 'Acompanhe status, renovação e histórico da sua assinatura.' },
    ],
  },
  {
    id: 'permissions',
    title: 'Permissões',
    icon: Shield,
    description: 'Controle granular de acesso por perfil de permissão.',
    features: [
      { title: 'Perfis de permissão', description: 'Crie perfis com permissões específicas para cada módulo do sistema.' },
      { title: 'Atribuição a membros', description: 'Associe perfis de permissão aos membros da organização.' },
      { title: 'Gate de funcionalidades', description: 'Recursos são exibidos ou ocultados conforme as permissões do usuário.' },
    ],
  },
  {
    id: 'api-keys',
    title: 'API Keys',
    icon: Key,
    description: 'Geração e gestão de chaves de API para integrações externas.',
    features: [
      { title: 'Criação de chaves', description: 'Gere chaves de API com nome, permissões e data de expiração.' },
      { title: 'Rate limiting', description: 'Configure limites de requisições por minuto e por dia.' },
      { title: 'Monitoramento', description: 'Acompanhe o uso de cada chave com data do último acesso.' },
    ],
  },
  {
    id: 'webhooks',
    title: 'Webhooks',
    icon: Webhook,
    description: 'Configure webhooks de entrada para receber dados externos.',
    features: [
      { title: 'Endpoints personalizados', description: 'Crie endpoints únicos para receber dados de sistemas externos.' },
      { title: 'Mapeamento de campos', description: 'Configure como os dados recebidos devem ser mapeados para o CRM.' },
      { title: 'Token de segurança', description: 'Proteja seus webhooks com tokens de autenticação.' },
      { title: 'Histórico de requisições', description: 'Visualize todas as requisições recebidas com detalhes.' },
    ],
  },
  {
    id: 'sequences',
    title: 'Sequências (Drip)',
    icon: ListChecks,
    badge: 'NOVO',
    description: 'Envio automatizado de mensagens em intervalos programados para nutrição de leads.',
    features: [
      { title: 'Criação de sequências', description: 'Monte sequências com múltiplos passos de envio (e-mail, WhatsApp, SMS) com intervalos configuráveis.' },
      { title: 'Inscrição de contatos', description: 'Inscreva contatos manualmente ou automaticamente via automações e flows.' },
      { title: 'Progresso por contato', description: 'Acompanhe em qual etapa cada contato inscrito está e o status de cada envio.' },
      { title: 'Integração com automações', description: 'Use ações "Inscrever em Sequência" e "Remover de Sequência" dentro de automações e flows.' },
    ],
  },
  {
    id: 'ab-tests',
    title: 'Testes A/B',
    icon: SplitSquareVertical,
    badge: 'NOVO',
    description: 'Compare variantes de mensagens para otimizar conversões em WhatsApp, E-mail e Instagram.',
    features: [
      { title: 'Criação de testes', description: 'Defina duas variantes (A e B) com conteúdo diferente para o mesmo canal.' },
      { title: 'Distribuição automática', description: 'O sistema divide automaticamente os envios entre as variantes.' },
      { title: 'Métricas comparativas', description: 'Acompanhe envios, respostas e conversões de cada variante em tempo real.' },
      { title: 'Vencedor automático', description: 'O sistema identifica e destaca a variante com melhor desempenho.' },
    ],
  },
  {
    id: 'growth-tools',
    title: 'Growth Tools',
    icon: Megaphone,
    badge: 'NOVO',
    description: 'Ferramentas de captura de leads: links, QR codes e widgets para WhatsApp e Instagram.',
    features: [
      { title: 'Links de captura', description: 'Gere links com mensagem pré-preenchida para WhatsApp que criam contatos automaticamente.' },
      { title: 'QR Codes', description: 'Gere QR Codes dinâmicos para uso em materiais impressos, eventos e displays.' },
      { title: 'Widgets para site', description: 'Botões flutuantes de WhatsApp para incorporar em sites e landing pages.' },
      { title: 'Métricas de performance', description: 'Acompanhe cliques e conversões de cada ferramenta de captura.' },
    ],
  },
  {
    id: 'channels',
    title: 'Canais',
    icon: Globe,
    description: 'Gestão centralizada de todos os canais de comunicação conectados.',
    features: [
      { title: 'Visão consolidada', description: 'Veja o status de todos os canais (WhatsApp, Instagram, E-mail, Telegram) em um único painel.' },
      { title: 'Configuração rápida', description: 'Acesse a configuração de cada canal diretamente a partir da visão geral.' },
      { title: 'Status em tempo real', description: 'Monitore se cada canal está conectado, desconectado ou com erros.' },
    ],
  },
  {
    id: 'agency',
    title: 'Gestão de Agência',
    icon: Briefcase,
    description: 'Modo multi-tenant para agências que gerenciam múltiplas organizações-cliente.',
    features: [
      { title: 'Clientes da agência', description: 'Adicione e gerencie organizações-cliente a partir da sua organização de agência.' },
      { title: 'Convites por e-mail', description: 'Envie convites para novos clientes se vincularem à agência.' },
      { title: 'Níveis de acesso', description: 'Defina acesso operacional ou completo para cada organização-cliente.' },
      { title: 'Troca de contexto', description: 'Alterne entre organizações-cliente sem precisar fazer logout.' },
    ],
  },
  {
    id: 'settings',
    title: 'Configurações Gerais',
    icon: Settings,
    description: 'Preferências do sistema, tema e configurações pessoais.',
    features: [
      { title: 'Perfil do usuário', description: 'Atualize seu nome, e-mail e altere sua senha de acesso.' },
      { title: 'Tema claro/escuro', description: 'Alterne entre os temas claro e escuro da interface.' },
      { title: 'Notificações', description: 'Configure preferências de notificações do sistema.' },
      { title: 'Exportação de dados (LGPD)', description: 'Exporte seus dados pessoais em conformidade com a LGPD.' },
      { title: 'Exclusão de conta (LGPD)', description: 'Solicite a exclusão completa dos seus dados.' },
    ],
  },
  {
    id: 'voip',
    title: 'VoIP / Telefonia',
    icon: Globe,
    badge: 'NOVO',
    description: 'Realize e receba ligações diretamente pela plataforma com softphone integrado.',
    features: [
      { title: 'Softphone integrado', description: 'Faça ligações diretamente do navegador sem precisar de aplicativos externos.' },
      { title: 'Gravação de chamadas', description: 'Grave ligações automaticamente para revisão e treinamento.' },
      { title: 'Transcrição automática', description: 'Transcreva ligações com IA para registro e busca textual.' },
      { title: 'Dashboard de chamadas', description: 'Métricas completas: duração média, ligações por dia, taxa de atendimento.' },
      { title: 'Créditos de VoIP', description: 'Compre e gerencie pacotes de créditos para ligações.' },
      { title: 'Vinculação com CRM', description: 'Associe ligações a contatos e deals automaticamente.' },
    ],
  },
  {
    id: 'paid-groups',
    title: 'Grupos Pagos',
    icon: Users,
    badge: 'BETA',
    description: 'Automatize a gestão de membros em grupos de WhatsApp com 20+ gateways de pagamento.',
    features: [
      { title: 'Adição automática', description: 'Comprou? Membro é adicionado ao grupo de WhatsApp automaticamente.' },
      { title: 'Remoção automática', description: 'Cancelou, reembolsou ou expirou? Membro é removido automaticamente.' },
      { title: '20+ Gateways', description: 'Stripe, Kiwify, Hotmart, Eduzz, Monetizze, PerfectPay, Braip, Guru e mais 12.' },
      { title: 'Produtos e vínculos', description: 'Crie produtos internos e vincule a múltiplos grupos simultaneamente.' },
      { title: 'Dashboard de membros', description: 'Acompanhe entradas, saídas e status de cada membro.' },
    ],
  },
  {
    id: 'group-rotator',
    title: 'Rotador de Grupos',
    icon: LinkIcon,
    badge: 'NOVO',
    description: 'Link inteligente que distribui cliques entre múltiplos grupos de WhatsApp via round-robin.',
    features: [
      { title: 'Campanhas com slug', description: 'Crie links únicos (ex: /r/meu-curso) para distribuição automática.' },
      { title: 'Round-robin inteligente', description: 'Cada clique vai para o próximo grupo disponível automaticamente.' },
      { title: 'Limites de capacidade', description: 'Defina máx. de cliques e membros por grupo para troca automática.' },
      { title: 'Analytics de cliques', description: 'Acompanhe cliques, ocupação e status de cada grupo em tempo real.' },
    ],
  },
  {
    id: 'landing-pages',
    title: 'Landing Pages',
    icon: Globe,
    badge: 'NOVO',
    description: 'Editor visual de landing pages com 11+ seções, SEO e integração com CRM.',
    features: [
      { title: 'Editor visual', description: 'Monte páginas arrastando seções: Hero, Features, Testimonials, FAQ, CTA e mais.' },
      { title: 'Propriedades editáveis', description: 'Customize títulos, textos, cores e estilos de cada seção via painel lateral.' },
      { title: 'SEO integrado', description: 'Configure título, descrição e CSS customizado para cada página.' },
      { title: 'Integração com CRM', description: 'Formulários de captura criam contatos e disparam automações automaticamente.' },
    ],
  },
  {
    id: 'event-tracking',
    title: 'Event Tracking (Pixel)',
    icon: Target,
    badge: 'NOVO',
    description: 'Snippet JavaScript para rastreamento de eventos e navegação em sites externos.',
    features: [
      { title: 'Snippet plug-and-play', description: 'Copie e cole o código no seu site para começar a rastrear automaticamente.' },
      { title: 'Page views automáticos', description: 'Cada visualização de página é registrada com URL, título e referrer.' },
      { title: 'Navegação SPA', description: 'Detecta navegação em aplicações de página única (pushState, popstate).' },
      { title: 'Eventos customizados', description: 'Rastreie cliques em botões, scroll e interações específicas via API JS.' },
      { title: 'Visitor ID persistente', description: 'Identificação única de visitantes via localStorage para sessões contínuas.' },
    ],
  },
  {
    id: 'sms-marketing',
    title: 'SMS Marketing',
    icon: Megaphone,
    badge: 'NOVO',
    description: 'Campanhas SMS em massa, automações e mensagens bidirecionais.',
    features: [
      { title: 'Campanhas em massa', description: 'Envie SMS para listas segmentadas com agendamento.' },
      { title: 'Two-way messaging', description: 'Respostas de SMS aparecem no inbox para conversa bidirecional.' },
      { title: 'Provedores múltiplos', description: 'Integre Twilio ou Vonage como provedor de SMS.' },
      { title: 'Automações SMS', description: 'Use SMS como ação em automações, sequências e flows.' },
    ],
  },
  {
    id: 'migration',
    title: 'Migração de Plataforma',
    icon: Database,
    description: 'Ferramentas para migrar dados de outras plataformas para o AG Sell.',
    features: [
      { title: 'Importação CSV', description: 'Importe contatos, deals e dados via arquivo CSV com mapeamento de campos.' },
      { title: 'Importação JSON', description: 'Importe dados estruturados em formato JSON para migração programática.' },
      { title: 'Conexão via API', description: 'Conecte à API da plataforma de origem para importação automatizada.' },
      { title: 'Webhooks de migração', description: 'Configure webhooks para sincronização contínua durante a transição.' },
    ],
  },
  {
    id: 'support-center',
    title: 'Suporte AG Sell',
    icon: HelpCircle,
    description: 'Central de suporte da plataforma para abrir chamados técnicos.',
    features: [
      { title: 'Abertura de tickets', description: 'Abra chamados técnicos com categorização e prioridade.' },
      { title: 'Protocolo automático', description: 'Cada ticket recebe um protocolo único (SUP-YYYYMMDD-XXXXX).' },
      { title: 'Acompanhamento', description: 'Consulte o status do chamado a qualquer momento.' },
    ],
  },
  {
    id: 'support-portal',
    title: 'Portal de Suporte White-label',
    icon: Globe,
    badge: 'NOVO',
    description: 'Portal público personalizável para seus clientes abrirem e acompanharem chamados.',
    features: [
      { title: 'Abertura sem login', description: 'Clientes abrem tickets sem precisar criar conta na plataforma.' },
      { title: 'Acompanhamento por protocolo', description: 'Consulta por protocolo + e-mail para ver status em tempo real.' },
      { title: 'Categorias personalizáveis', description: 'Defina categorias de chamados específicas do seu negócio.' },
      { title: 'Chat WhatsApp integrado', description: 'Botão de chat direto via WhatsApp no portal público.' },
      { title: 'Integração com CRM', description: 'Tickets criam contatos e vinculam ao histórico automaticamente.' },
    ],
  },
  {
    id: 'whatsapp-templates',
    title: 'Templates de WhatsApp',
    icon: MessageSquare,
    description: 'Gerencie templates de mensagens para WhatsApp Business API.',
    features: [
      { title: 'Criação de templates', description: 'Crie templates com variáveis, botões e mídias para aprovação.' },
      { title: 'Categorias', description: 'Organize por tipo: marketing, utilidade, autenticação.' },
      { title: 'Status de aprovação', description: 'Acompanhe o status: pendente, aprovado, rejeitado.' },
    ],
  },
  {
    id: 'contact-preferences',
    title: 'Preferências de Contato (Opt-out)',
    icon: Shield,
    description: 'Gestão de preferências de comunicação e opt-out por canal.',
    features: [
      { title: 'Opt-out por canal', description: 'Contatos podem optar por não receber mensagens em canais específicos.' },
      { title: 'Histórico de preferências', description: 'Registre quando e por que o contato optou por sair.' },
      { title: 'Conformidade LGPD', description: 'Garanta conformidade com regulamentações de privacidade de dados.' },
    ],
  },
  {
    id: 'ai-builder',
    title: 'AI Builder',
    icon: Brain,
    badge: 'NOVO',
    description: 'Gere e-mails, automações e copy com Inteligência Artificial.',
    features: [
      { title: 'Geração de e-mails', description: 'Descreva o objetivo e a IA cria o e-mail HTML completo.' },
      { title: 'Geração de fluxos', description: 'Descreva a estratégia e receba um fluxo de automação pronto.' },
      { title: 'AI Brand Kit', description: 'Extraia cores, fontes e tom de comunicação a partir da URL do seu site.' },
      { title: 'Segmentos sugeridos', description: 'IA analisa sua base e sugere segmentações inteligentes.' },
    ],
  },
  {
    id: 'predictive-sending',
    title: 'Envio Preditivo',
    icon: Brain,
    badge: 'NOVO',
    description: 'IA analisa o histórico e determina o melhor horário de envio por contato.',
    features: [
      { title: 'Horário ideal', description: 'IA identifica quando cada contato tem maior engajamento.' },
      { title: 'Canal preferido', description: 'Identifica automaticamente o canal mais responsivo de cada contato.' },
      { title: 'Perfis de envio', description: 'Cria perfis individuais com timezone, horário ideal e canal preferido.' },
    ],
  },
  {
    id: 'sentiment',
    title: 'Análise de Sentimento',
    icon: Brain,
    badge: 'NOVO',
    description: 'IA classifica automaticamente o tom das mensagens recebidas.',
    features: [
      { title: 'Classificação automática', description: 'Positivo, neutro ou negativo para cada mensagem recebida.' },
      { title: 'Palavras-chave', description: 'Extração automática de termos mais frequentes por sentimento.' },
      { title: 'Dashboard de tendências', description: 'Gráficos de evolução do sentimento ao longo do tempo.' },
    ],
  },
  {
    id: 'sales-routing',
    title: 'Roteamento de Vendas',
    icon: SlidersHorizontal,
    badge: 'NOVO',
    description: 'Distribua leads entre vendedores com regras inteligentes.',
    features: [
      { title: 'Round Robin', description: 'Alternância automática entre vendedores para distribuição uniforme.' },
      { title: 'Por carga', description: 'Distribui para o vendedor com menos leads ativos.' },
      { title: 'Por território', description: 'Baseado na região geográfica do contato.' },
      { title: 'Limites configuráveis', description: 'Defina máximo de leads simultâneos por vendedor.' },
    ],
  },
  {
    id: 'goals',
    title: 'Metas de Conversão',
    icon: Target,
    badge: 'NOVO',
    description: 'Defina metas de receita, contagem ou eventos e acompanhe em tempo real.',
    features: [
      { title: 'Tipos de meta', description: 'Receita (R$), contagem (leads, deals) ou eventos (page views, conversões).' },
      { title: 'Progresso em tempo real', description: 'Barra de progresso atualizada automaticamente conforme ações são realizadas.' },
      { title: 'Status automático', description: 'Meta ativa, atingida ou expirada com indicadores visuais.' },
    ],
  },
  {
    id: 'win-probability',
    title: 'Probabilidade de Fechamento',
    icon: Target,
    badge: 'NOVO',
    description: 'IA calcula a probabilidade de converter cada deal do pipeline.',
    features: [
      { title: 'Score 0-100%', description: 'IA analisa valor, tempo, atividades e engajamento para calcular probabilidade.' },
      { title: 'Fatores de impacto', description: 'Lista detalhada dos fatores positivos e negativos de cada deal.' },
      { title: 'Forecast inteligente', description: 'Receita projetada baseada em probabilidade real, não estimativas manuais.' },
    ],
  },
  {
    id: 'custom-reports',
    title: 'Relatórios Personalizados',
    icon: BarChart3,
    badge: 'NOVO',
    description: 'Dashboards customizados com widgets configuráveis de múltiplas fontes.',
    features: [
      { title: 'Widgets flexíveis', description: 'Barras, linhas, pizza — escolha o tipo de gráfico para cada métrica.' },
      { title: 'Múltiplas fontes', description: 'Combine dados de CRM, E-mail, WhatsApp e Inbox no mesmo relatório.' },
      { title: 'Filtros avançados', description: 'Período, canal, agente e outros filtros para análises profundas.' },
    ],
  },
  {
    id: 'conditional-content',
    title: 'Conteúdo Condicional',
    icon: Vote,
    badge: 'NOVO',
    description: 'Blocos dinâmicos em e-mails que mudam conforme o perfil do contato.',
    features: [
      { title: 'Condições por tag', description: 'Mostre conteúdo diferente para contatos com ou sem determinada tag.' },
      { title: 'Condições por score', description: 'Adapte CTAs e ofertas conforme a pontuação do lead.' },
      { title: 'Preview lado a lado', description: 'Visualize em tempo real o conteúdo para cada condição (verdadeiro vs falso).' },
    ],
  },
  {
    id: 'system-status',
    title: 'Status do Sistema',
    icon: Globe,
    description: 'Monitore o status de todos os serviços da plataforma em tempo real.',
    features: [
      { title: 'Status dos serviços', description: 'Monitore API, banco de dados, autenticação, edge functions e storage.' },
      { title: 'Uptime e latência', description: 'Acompanhe disponibilidade e tempo de resposta de cada serviço.' },
      { title: 'Página pública', description: 'Página acessível em /status sem autenticação para transparência.' },
    ],
  },
];

export default function SystemGuide() {
  const [search, setSearch] = useState('');

  const filtered = guideSections.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.features.some(
        (f) => f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
      )
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          Guia do Sistema
        </h1>
        <p className="text-muted-foreground mt-1">
          Documentação completa de todas as funcionalidades do AG Sell
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar funcionalidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{guideSections.length}</p>
            <p className="text-xs text-muted-foreground">Módulos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {guideSections.reduce((acc, s) => acc + s.features.length, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Funcionalidades</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">6</p>
            <p className="text-xs text-muted-foreground">Canais integrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">100%</p>
            <p className="text-xs text-muted-foreground">Operacional</p>
          </CardContent>
        </Card>
      </div>

      {/* Guide Content */}
      <Accordion type="multiple" className="space-y-2">
        {filtered.map((section) => {
          const Icon = section.icon;
          return (
            <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-2">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{section.title}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {section.features.length} recursos
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-normal">{section.description}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-3 pb-2 pl-[52px]">
                  {section.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{feature.title}</p>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma funcionalidade encontrada para "{search}"</p>
        </div>
      )}
    </div>
  );
}
