import {
  Zap, MessageSquare, Mail, Instagram, Send,
  Heart, Eye, UserPlus, MessageCircle, Sparkles,
  Tag, Star, Bell, Clock, CheckSquare, GitBranch,
  Timer, Flame, MailCheck, Filter, Smartphone,
  Globe, MousePointer, LogOut, List, LayoutTemplate,
  Package, Code,
} from 'lucide-react';

export interface FlowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'timer' | 'warmup';
  subtype: string;
  label: string;
  config: Record<string, unknown>;
  children?: string[];
  conditionTrue?: string;
  conditionFalse?: string;
}

export const triggerOptions = [
  { id: 'instagram_comment', label: 'Comentário no Post', icon: Heart, channel: 'instagram', color: 'from-pink-500 to-purple-500', description: 'Quando alguém comenta em qualquer post' },
  { id: 'instagram_specific_post', label: 'Post Específico', icon: Instagram, channel: 'instagram', color: 'from-purple-500 to-pink-500', description: 'Quando alguém comenta em um post específico' },
  { id: 'instagram_dm', label: 'DM Recebida', icon: MessageCircle, channel: 'instagram', color: 'from-purple-500 to-orange-400', description: 'Quando alguém envia uma DM' },
  { id: 'instagram_story_reply', label: 'Resposta ao Story', icon: Eye, channel: 'instagram', color: 'from-pink-400 to-orange-400', description: 'Quando alguém responde ou reage ao seu story' },
  { id: 'instagram_story_specific', label: 'Story Específico', icon: Eye, channel: 'instagram', color: 'from-orange-400 to-pink-500', description: 'Gatilho para um story específico (por URL ou ID)' },
  { id: 'instagram_new_follower', label: 'Novo Seguidor', icon: UserPlus, channel: 'instagram', color: 'from-purple-400 to-pink-400', description: 'Quando alguém começa a seguir você' },
  { id: 'whatsapp_received', label: 'Mensagem WhatsApp', icon: MessageSquare, channel: 'whatsapp', color: 'from-green-500 to-emerald-500', description: 'Quando receber uma mensagem no WhatsApp' },
  { id: 'whatsapp_keyword', label: 'Palavra-chave WhatsApp', icon: Sparkles, channel: 'whatsapp', color: 'from-emerald-500 to-teal-500', description: 'Quando mensagem contém palavra-chave' },
  { id: 'whatsapp_automation', label: 'Automação WhatsApp', icon: Zap, channel: 'whatsapp', color: 'from-teal-500 to-green-500', description: 'Quando uma automação WhatsApp específica é acionada' },
  { id: 'whatsapp_message_source', label: 'Mensagem de Origem', icon: MessageSquare, channel: 'whatsapp', color: 'from-green-400 to-teal-400', description: 'Quando mensagem vem de uma origem específica' },
  { id: 'contact_created', label: 'Contato Criado', icon: UserPlus, channel: 'crm', color: 'from-blue-500 to-indigo-500', description: 'Quando um novo contato é adicionado' },
  { id: 'contact_source', label: 'Fonte do Contato', icon: UserPlus, channel: 'crm', color: 'from-indigo-400 to-blue-400', description: 'Quando contato vem de uma fonte específica' },
  { id: 'form_submitted', label: 'Formulário Enviado', icon: CheckSquare, channel: 'crm', color: 'from-indigo-500 to-blue-500', description: 'Quando um formulário específico é preenchido' },
];

// ── Node categories matching SellFlux sidebar ──
export const nodeCategories = [
  {
    label: 'Entrada',
    nodes: [
      { id: 'tag_filter', label: 'Filtro de Tag', icon: Filter, color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
    ],
  },
  {
    label: 'Controle',
    nodes: [
      { id: 'timer', label: 'Timer', icon: Timer, color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
      { id: 'warmup', label: 'Aquecimento', icon: Flame, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    ],
  },
  {
    label: 'WhatsApp',
    nodes: [
      { id: 'send_whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
      { id: 'send_whatsapp_oficial', label: 'WhatsApp Oficial', icon: MessageSquare, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    ],
  },
  {
    label: 'E-mail',
    nodes: [
      { id: 'send_email_performance', label: 'Performance', icon: MailCheck, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
      { id: 'send_email_marketing', label: 'Marketing', icon: Mail, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
    ],
  },
  {
    label: 'SMS',
    nodes: [
      { id: 'send_sms', label: 'SMS', icon: Smartphone, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
    ],
  },
  {
    label: 'Tags',
    nodes: [
      { id: 'add_tag', label: 'Add Tag', icon: Tag, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
      { id: 'remove_tag', label: 'Remover Tag', icon: Tag, color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
      { id: 'list_tag', label: 'Listar Tag', icon: List, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    ],
  },
  {
    label: 'Avançado',
    nodes: [
      { id: 'conditional', label: 'Condicional', icon: GitBranch, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
      { id: 'full_page', label: 'Full Page', icon: LayoutTemplate, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
      { id: 'pixel', label: 'Pixel', icon: MousePointer, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
      { id: 'abandonment', label: 'Abandono', icon: LogOut, color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
    ],
  },
  {
    label: 'CRM',
    nodes: [
      { id: 'update_score', label: 'Atualizar Score', icon: Star, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
      { id: 'send_notification', label: 'Notificar Equipe', icon: Bell, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
      { id: 'create_task', label: 'Criar Tarefa', icon: CheckSquare, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
      { id: 'wait', label: 'Aguardar', icon: Clock, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    ],
  },
];

// Flat list for backward compat
export const actionOptions = nodeCategories.flatMap(c => c.nodes);

export const conditionOptions = [
  { id: 'if_tag', label: 'Se tem Tag', icon: GitBranch, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { id: 'if_keyword', label: 'Se contém palavra', icon: GitBranch, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { id: 'if_score', label: 'Se score ≥', icon: GitBranch, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
];

export const triggerTypeMap: Record<string, string> = {
  instagram_comment: 'instagram_comment',
  instagram_specific_post: 'instagram_comment',
  instagram_dm: 'instagram_dm',
  instagram_story_reply: 'instagram_comment',
  instagram_story_specific: 'instagram_comment',
  instagram_new_follower: 'contact_created',
  whatsapp_received: 'whatsapp_received',
  whatsapp_keyword: 'whatsapp_received',
  whatsapp_automation: 'whatsapp_received',
  whatsapp_message_source: 'whatsapp_received',
  contact_created: 'contact_created',
  contact_source: 'contact_created',
  form_submitted: 'form_submitted',
};

export const TEMPLATE_VARIABLES = [
  { key: '{{nome}}', label: 'Nome completo' },
  { key: '{{primeiro_nome}}', label: 'Primeiro nome' },
  { key: '{{email}}', label: 'E-mail' },
  { key: '{{telefone}}', label: 'Telefone' },
  { key: '{{whatsapp}}', label: 'WhatsApp' },
  { key: '{{rastreamento}}', label: 'Rastreamento' },
  { key: '{{boleto}}', label: 'Boleto' },
  { key: '{{pix}}', label: 'PIX' },
];

export const WEEKDAYS = [
  { key: 'dom', label: 'Dom' },
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
];

// Flow templates
export const flowTemplates = [
  { id: 'welcome_whatsapp', name: 'Boas-vindas WhatsApp', description: 'Envie uma mensagem de boas-vindas quando um lead entrar', category: 'whatsapp' },
  { id: 'lead_nurture_email', name: 'Nutrição de Leads', description: 'Sequência de emails para nutrir leads frios', category: 'email' },
  { id: 'abandoned_cart', name: 'Carrinho Abandonado', description: 'Recupere vendas perdidas com lembretes automáticos', category: 'vendas' },
  { id: 'instagram_engagement', name: 'Engajamento Instagram', description: 'Responda automaticamente a comentários e DMs', category: 'instagram' },
  { id: 'onboarding', name: 'Onboarding de Cliente', description: 'Guie novos clientes com uma sequência multicanal', category: 'crm' },
];
