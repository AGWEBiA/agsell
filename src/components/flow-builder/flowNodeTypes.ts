import {
  Zap, MessageSquare, Mail, Instagram, Send,
  Heart, Eye, UserPlus, MessageCircle, Sparkles,
  Tag, Star, Bell, Clock, CheckSquare, GitBranch,
  Timer, Flame, MailCheck, Filter, Smartphone,
  Globe, MousePointer, LogOut, List, LayoutTemplate,
  Package, Code, AtSign, Share2, Link, Megaphone, Users,
  Phone, StickyNote, Split, Shuffle, Volume2, Pencil,
  CreditCard, Receipt, Ban, FileText, ShoppingCart, RotateCcw,
  TrendingUp, TrendingDown, ArrowRightLeft, CalendarDays, UserX,
  PhoneOff, PhoneIncoming, MailOpen, MousePointerClick, MailX,
} from 'lucide-react';

export interface FlowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'timer' | 'warmup' | 'note';
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
  { id: 'instagram_dm_keyword', label: 'Palavra-chave na DM', icon: Sparkles, channel: 'instagram', color: 'from-pink-500 to-fuchsia-500', description: 'Quando DM contém uma palavra-chave específica' },
  { id: 'instagram_comment_keyword', label: 'Palavra-chave no Comentário', icon: Sparkles, channel: 'instagram', color: 'from-purple-500 to-fuchsia-500', description: 'Quando comentário contém uma palavra-chave específica' },
  { id: 'instagram_story_reply', label: 'Resposta ao Story', icon: Eye, channel: 'instagram', color: 'from-pink-400 to-orange-400', description: 'Quando alguém responde ou reage ao seu story' },
  { id: 'instagram_story_specific', label: 'Story Específico', icon: Eye, channel: 'instagram', color: 'from-orange-400 to-pink-500', description: 'Gatilho para um story específico (por URL ou ID)' },
  { id: 'instagram_new_follower', label: 'Novo Seguidor', icon: UserPlus, channel: 'instagram', color: 'from-purple-400 to-pink-400', description: 'Quando alguém começa a seguir você' },
  { id: 'instagram_mention', label: 'Menção ao Perfil', icon: AtSign, channel: 'instagram', color: 'from-fuchsia-500 to-pink-500', description: 'Quando alguém menciona seu perfil nos stories' },
  { id: 'instagram_share_dm', label: 'Compartilhar por DM', icon: Share2, channel: 'instagram', color: 'from-rose-400 to-purple-500', description: 'Quando alguém compartilha seu conteúdo via DM' },
  { id: 'instagram_ref_url', label: 'Ref URL Instagram', icon: Link, channel: 'instagram', color: 'from-violet-500 to-indigo-500', description: 'Quando alguém clica em um link de referência para conversa' },
  { id: 'instagram_ads', label: 'Anúncios Instagram', icon: Megaphone, channel: 'instagram', color: 'from-orange-500 to-red-500', description: 'Quando alguém interage com um anúncio Click-to-DM' },
  { id: 'whatsapp_received', label: 'Mensagem WhatsApp', icon: MessageSquare, channel: 'whatsapp', color: 'from-green-500 to-emerald-500', description: 'Quando receber uma mensagem no WhatsApp' },
  { id: 'whatsapp_keyword', label: 'Palavra-chave WhatsApp', icon: Sparkles, channel: 'whatsapp', color: 'from-emerald-500 to-teal-500', description: 'Quando mensagem contém palavra-chave' },
  { id: 'whatsapp_automation', label: 'Automação WhatsApp', icon: Zap, channel: 'whatsapp', color: 'from-teal-500 to-green-500', description: 'Quando uma automação WhatsApp específica é acionada' },
  { id: 'whatsapp_message_source', label: 'Mensagem de Origem', icon: MessageSquare, channel: 'whatsapp', color: 'from-green-400 to-teal-400', description: 'Quando mensagem vem de uma origem específica' },
  { id: 'contact_created', label: 'Contato Criado', icon: UserPlus, channel: 'crm', color: 'from-blue-500 to-indigo-500', description: 'Quando um novo contato é adicionado' },
  { id: 'contact_source', label: 'Fonte do Contato', icon: UserPlus, channel: 'crm', color: 'from-indigo-400 to-blue-400', description: 'Quando contato vem de uma fonte específica' },
  { id: 'form_submitted', label: 'Formulário Enviado', icon: CheckSquare, channel: 'crm', color: 'from-indigo-500 to-blue-500', description: 'Quando um formulário específico é preenchido' },
  { id: 'page_visited', label: 'Página Visitada', icon: Globe, channel: 'site', color: 'from-cyan-500 to-blue-500', description: 'Quando um contato visita uma página específica do seu site' },
  { id: 'site_event', label: 'Evento no Site', icon: MousePointer, channel: 'site', color: 'from-teal-500 to-cyan-500', description: 'Quando um evento customizado é disparado no site' },
  // Payment gateway triggers
  { id: 'gateway_purchase_approved', label: 'Compra Aprovada', icon: CreditCard, channel: 'pagamento', color: 'from-green-500 to-emerald-600', description: 'Quando uma compra é aprovada (Hotmart, Kiwify, Eduzz)' },
  { id: 'gateway_boleto_generated', label: 'Boleto Gerado', icon: FileText, channel: 'pagamento', color: 'from-amber-500 to-yellow-500', description: 'Quando um boleto é emitido pelo gateway' },
  { id: 'gateway_boleto_paid', label: 'Boleto Pago', icon: Receipt, channel: 'pagamento', color: 'from-green-400 to-lime-500', description: 'Quando um boleto é pago pelo comprador' },
  { id: 'gateway_pix_generated', label: 'PIX Gerado', icon: ShoppingCart, channel: 'pagamento', color: 'from-teal-500 to-cyan-500', description: 'Quando um PIX é gerado aguardando pagamento' },
  { id: 'gateway_refund', label: 'Reembolso', icon: RotateCcw, channel: 'pagamento', color: 'from-red-500 to-rose-500', description: 'Quando um reembolso é processado' },
  { id: 'gateway_chargeback', label: 'Chargeback', icon: Ban, channel: 'pagamento', color: 'from-red-600 to-red-700', description: 'Quando ocorre um chargeback/disputa' },
  { id: 'gateway_subscription_canceled', label: 'Assinatura Cancelada', icon: Ban, channel: 'pagamento', color: 'from-orange-500 to-red-500', description: 'Quando uma assinatura recorrente é cancelada' },
  { id: 'gateway_cart_abandoned', label: 'Checkout Abandonado', icon: ShoppingCart, channel: 'pagamento', color: 'from-orange-400 to-amber-500', description: 'Quando o comprador abandona o checkout' },
  // Pipeline triggers
  { id: 'deal_stage_changed', label: 'Etapa do Negócio', icon: ArrowRightLeft, channel: 'crm', color: 'from-blue-500 to-cyan-500', description: 'Quando um negócio muda de etapa no pipeline' },
  { id: 'deal_won', label: 'Negócio Ganho', icon: TrendingUp, channel: 'crm', color: 'from-green-500 to-emerald-500', description: 'Quando um negócio é marcado como ganho' },
  { id: 'deal_lost', label: 'Negócio Perdido', icon: TrendingDown, channel: 'crm', color: 'from-red-500 to-rose-500', description: 'Quando um negócio é marcado como perdido' },
  // Tag/Score triggers
  { id: 'tag_added', label: 'Tag Adicionada', icon: Tag, channel: 'crm', color: 'from-emerald-500 to-green-500', description: 'Quando uma tag é adicionada a um contato' },
  { id: 'tag_removed', label: 'Tag Removida', icon: Tag, channel: 'crm', color: 'from-rose-500 to-red-500', description: 'Quando uma tag é removida de um contato' },
  { id: 'score_threshold', label: 'Score Atingido', icon: Star, channel: 'crm', color: 'from-yellow-500 to-amber-500', description: 'Quando o score do contato atinge um valor específico' },
  // Email triggers
  { id: 'email_opened', label: 'E-mail Aberto', icon: MailOpen, channel: 'email', color: 'from-blue-400 to-indigo-500', description: 'Quando o contato abre um e-mail enviado' },
  { id: 'email_clicked', label: 'Link Clicado no E-mail', icon: MousePointerClick, channel: 'email', color: 'from-indigo-500 to-violet-500', description: 'Quando o contato clica em um link do e-mail' },
  { id: 'email_bounced', label: 'E-mail Bounce', icon: MailX, channel: 'email', color: 'from-red-400 to-orange-500', description: 'Quando um e-mail retorna como bounce' },
  // Date/Inactivity triggers
  { id: 'date_trigger', label: 'Data Agendada', icon: CalendarDays, channel: 'crm', color: 'from-violet-500 to-purple-500', description: 'Acionado em uma data específica (aniversário, vencimento)' },
  { id: 'inactivity_trigger', label: 'Inatividade', icon: UserX, channel: 'crm', color: 'from-slate-500 to-gray-600', description: 'Quando o contato fica inativo por X dias' },
  // VoIP triggers
  { id: 'call_completed', label: 'Chamada Completada', icon: PhoneIncoming, channel: 'voip', color: 'from-blue-500 to-sky-500', description: 'Quando uma chamada VoIP é completada' },
  { id: 'call_missed', label: 'Chamada Perdida', icon: PhoneOff, channel: 'voip', color: 'from-red-400 to-rose-500', description: 'Quando uma chamada é perdida' },
  // Telegram triggers
  { id: 'telegram_message', label: 'Mensagem Telegram', icon: Send, channel: 'telegram', color: 'from-sky-500 to-blue-500', description: 'Quando uma mensagem é recebida no Telegram' },
  { id: 'telegram_keyword', label: 'Palavra-chave Telegram', icon: Sparkles, channel: 'telegram', color: 'from-blue-500 to-sky-600', description: 'Quando mensagem no Telegram contém palavra-chave' },
  // WhatsApp group triggers
  { id: 'whatsapp_group_join', label: 'Entrou no Grupo', icon: UserPlus, channel: 'whatsapp', color: 'from-green-500 to-lime-500', description: 'Quando alguém entra em um grupo do WhatsApp' },
  { id: 'whatsapp_group_leave', label: 'Saiu do Grupo', icon: LogOut, channel: 'whatsapp', color: 'from-red-400 to-orange-400', description: 'Quando alguém sai de um grupo do WhatsApp' },
];

// ── Node categories ──
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
      { id: 'parallel_channels', label: 'Espinha de Peixe', icon: Split, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
    ],
  },
  {
    label: 'WhatsApp',
    nodes: [
      { id: 'send_whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
      { id: 'send_whatsapp_group', label: 'WhatsApp Grupo', icon: Users, color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
      { id: 'add_to_whatsapp_group', label: 'Adicionar ao Grupo', icon: UserPlus, color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
      { id: 'edit_whatsapp_group', label: 'Editar Grupo', icon: Pencil, color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
      { id: 'send_whatsapp_oficial', label: 'WhatsApp Oficial', icon: MessageSquare, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    ],
  },
  {
    label: 'Instagram',
    nodes: [
      { id: 'send_instagram_dm', label: 'DM Instagram', icon: Instagram, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
      { id: 'send_instagram_comment_reply', label: 'Responder Comentário', icon: MessageCircle, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
      { id: 'send_instagram_story_reply', label: 'Responder Story', icon: Eye, color: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300' },
      { id: 'instagram_like_comment', label: 'Curtir Comentário', icon: Heart, color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
      { id: 'instagram_follow_back', label: 'Seguir de Volta', icon: UserPlus, color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
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
    label: 'SMS / Voz',
    nodes: [
      { id: 'send_sms', label: 'SMS', icon: Smartphone, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
      { id: 'voice_torpedo', label: 'Torpedo de Voz', icon: Volume2, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
      { id: 'send_voip_call', label: 'Ligação VoIP', icon: Phone, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
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
      { id: 'link_split', label: 'Link Split', icon: Shuffle, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
      { id: 'note', label: 'Anotação', icon: StickyNote, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
    ],
  },
  {
    label: 'CRM/E-mail',
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
  instagram_mention: 'instagram_comment',
  instagram_dm_keyword: 'instagram_dm',
  instagram_comment_keyword: 'instagram_comment',
  instagram_share_dm: 'instagram_dm',
  instagram_ref_url: 'instagram_dm',
  instagram_ads: 'instagram_dm',
  whatsapp_received: 'whatsapp_received',
  whatsapp_keyword: 'whatsapp_received',
  whatsapp_automation: 'whatsapp_received',
  whatsapp_message_source: 'whatsapp_received',
  contact_created: 'contact_created',
  contact_source: 'contact_created',
  form_submitted: 'form_submitted',
  page_visited: 'page_visited',
  site_event: 'site_event',
  gateway_purchase_approved: 'gateway_event',
  gateway_boleto_generated: 'gateway_event',
  gateway_boleto_paid: 'gateway_event',
  gateway_pix_generated: 'gateway_event',
  gateway_refund: 'gateway_event',
  gateway_chargeback: 'gateway_event',
  gateway_subscription_canceled: 'gateway_event',
  gateway_cart_abandoned: 'gateway_event',
  deal_stage_changed: 'deal_stage_changed',
  deal_won: 'deal_won',
  deal_lost: 'deal_lost',
  tag_added: 'tag_added',
  tag_removed: 'tag_removed',
  score_threshold: 'score_threshold',
  email_opened: 'email_opened',
  email_clicked: 'email_clicked',
  email_bounced: 'email_bounced',
  date_trigger: 'date_trigger',
  inactivity_trigger: 'inactivity_trigger',
  call_completed: 'call_completed',
  call_missed: 'call_missed',
  telegram_message: 'telegram_message',
  telegram_keyword: 'telegram_message',
  whatsapp_group_join: 'whatsapp_group_join',
  whatsapp_group_leave: 'whatsapp_group_leave',
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

// Flow templates - expanded with strategic templates
export const flowTemplates = [
  { id: 'welcome_whatsapp', name: 'Boas-vindas WhatsApp', description: 'Envie uma mensagem de boas-vindas quando um lead entrar', category: 'whatsapp' },
  { id: 'lead_nurture_email', name: 'Nutrição de Leads', description: 'Sequência de emails para nutrir leads frios', category: 'email' },
  { id: 'abandoned_cart', name: 'Carrinho Abandonado', description: 'Recupere vendas perdidas com lembretes automáticos', category: 'vendas' },
  { id: 'instagram_engagement', name: 'Engajamento Instagram', description: 'Responda automaticamente a comentários e DMs', category: 'instagram' },
  { id: 'onboarding', name: 'Onboarding de Cliente', description: 'Guie novos clientes com uma sequência multicanal', category: 'crm' },
  { id: 'meteoric_launch', name: 'Lançamento Meteórico', description: 'Fluxo completo para lançamentos com antecipação, aquecimento e abertura', category: 'lançamento' },
  { id: 'webinar_funnel', name: 'Funil de Webinar', description: 'Convite, lembrete, replay e oferta para webinários', category: 'lançamento' },
  { id: 'upsell_downsell', name: 'Upsell / Downsell', description: 'Aumente o ticket médio com ofertas complementares pós-compra', category: 'vendas' },
  { id: 'reactivation', name: 'Reativação de Base', description: 'Reengaje leads inativos com sequência multicanal', category: 'engajamento' },
  { id: 'post_sale', name: 'Pós-Venda', description: 'NPS, review e fidelização após a compra', category: 'engajamento' },
  { id: 'flash_sale', name: 'Flash Sale / Promoção', description: 'Campanha relâmpago com timer e escassez', category: 'vendas' },
  { id: 'fishbone_recovery', name: 'Espinha de Peixe', description: 'Disparo multicanal paralelo para maximizar alcance', category: 'avançado' },
];
