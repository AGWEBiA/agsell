import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  ShoppingCart,
  MessageSquare,
  Mail,
  Tag,
  Clock,
  Zap,
  Star,
  Gift,
  CalendarCheck,
  Users,
  RotateCcw,
  ThumbsUp,
  Megaphone,
  TrendingUp,
} from 'lucide-react';
import type { Action } from '@/components/automations/AutomationActionsEditor';

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  color: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  actions: Action[];
}

export const automationTemplates: AutomationTemplate[] = [
  {
    id: 'welcome',
    name: 'Boas-vindas',
    description: 'Envie uma mensagem de boas-vindas quando um novo contato é criado',
    category: 'Engajamento',
    icon: UserPlus,
    color: 'bg-green-500',
    trigger_type: 'contact_created',
    trigger_config: {},
    actions: [
      {
        id: '1',
        type: 'send_email',
        config: {
          subject: 'Bem-vindo(a)! 🎉',
          content: '<h1>Olá {{first_name}}!</h1><p>Seja bem-vindo(a) à nossa comunidade. Estamos muito felizes em ter você conosco.</p>',
        },
      },
      {
        id: '2',
        type: 'add_tag',
        config: { tag_name: 'novo-lead' },
      },
      {
        id: '3',
        type: 'update_score',
        config: { points: 10 },
      },
    ],
  },
  {
    id: 'cart_recovery',
    name: 'Recuperação de Carrinho',
    description: 'Recupere vendas perdidas com lembretes automáticos',
    category: 'Vendas',
    icon: ShoppingCart,
    color: 'bg-orange-500',
    trigger_type: 'deal_stage_changed',
    trigger_config: { from_stage: 'negotiation', to_stage: 'lost' },
    actions: [
      {
        id: '1',
        type: 'wait',
        config: { minutes: 60 },
      },
      {
        id: '2',
        type: 'send_email',
        config: {
          subject: 'Esqueceu algo? 🛒',
          content: '<p>Olá {{first_name}}, notamos que você estava interessado em nosso produto. Posso ajudar com alguma dúvida?</p>',
        },
      },
      {
        id: '3',
        type: 'wait',
        config: { minutes: 1440 }, // 24 hours
      },
      {
        id: '4',
        type: 'send_whatsapp',
        config: {
          message: 'Oi {{first_name}}! Vi que você se interessou pelo nosso produto. Temos uma oferta especial para você! Posso te contar?',
        },
      },
    ],
  },
  {
    id: 'followup',
    name: 'Follow-up Automático',
    description: 'Mantenha contato com leads que não responderam',
    category: 'Engajamento',
    icon: MessageSquare,
    color: 'bg-blue-500',
    trigger_type: 'score_threshold',
    trigger_config: { threshold: 50, direction: 'above' },
    actions: [
      {
        id: '1',
        type: 'create_task',
        config: {
          title: 'Follow-up com lead quente',
          description: 'Lead atingiu score 50+. Entrar em contato para qualificação.',
          due_days: 1,
        },
      },
      {
        id: '2',
        type: 'send_notification',
        config: {
          title: 'Novo lead quente! 🔥',
          message: 'Um lead atingiu score alto e precisa de atenção.',
        },
      },
    ],
  },
  {
    id: 'lead_nurturing',
    name: 'Nutrição de Leads',
    description: 'Eduque leads com conteúdo ao longo do tempo',
    category: 'Marketing',
    icon: Mail,
    color: 'bg-purple-500',
    trigger_type: 'form_submitted',
    trigger_config: {},
    actions: [
      {
        id: '1',
        type: 'send_email',
        config: {
          subject: 'Obrigado pelo interesse! Aqui está seu conteúdo',
          content: '<p>Olá {{first_name}}!</p><p>Obrigado por baixar nosso material. Anexo você encontra o conteúdo prometido.</p>',
        },
      },
      {
        id: '2',
        type: 'add_tag',
        config: { tag_name: 'interessado-conteudo' },
      },
      {
        id: '3',
        type: 'wait',
        config: { minutes: 4320 }, // 3 days
      },
      {
        id: '4',
        type: 'send_email',
        config: {
          subject: 'Mais dicas para você! 📚',
          content: '<p>Oi {{first_name}}! Espero que tenha gostado do material anterior. Separei mais algumas dicas exclusivas para você...</p>',
        },
      },
      {
        id: '5',
        type: 'update_score',
        config: { points: 15 },
      },
    ],
  },
  {
    id: 'vip_customer',
    name: 'Cliente VIP',
    description: 'Reconheça e recompense seus melhores clientes',
    category: 'Fidelização',
    icon: Star,
    color: 'bg-yellow-500',
    trigger_type: 'score_threshold',
    trigger_config: { threshold: 90, direction: 'above' },
    actions: [
      {
        id: '1',
        type: 'add_tag',
        config: { tag_name: 'vip' },
      },
      {
        id: '2',
        type: 'send_email',
        config: {
          subject: 'Você é VIP! 🌟',
          content: '<p>Parabéns {{first_name}}!</p><p>Você agora faz parte do nosso programa VIP. Isso significa acesso exclusivo a ofertas especiais e atendimento prioritário.</p>',
        },
      },
      {
        id: '3',
        type: 'create_task',
        config: {
          title: 'Ligar para cliente VIP',
          description: 'Novo cliente VIP. Fazer ligação de boas-vindas.',
          due_days: 1,
        },
      },
    ],
  },
  {
    id: 'birthday',
    name: 'Aniversário',
    description: 'Surpreenda clientes no dia especial deles',
    category: 'Fidelização',
    icon: Gift,
    color: 'bg-pink-500',
    trigger_type: 'tag_added',
    trigger_config: { tag_name: 'aniversariante-do-dia' },
    actions: [
      {
        id: '1',
        type: 'send_email',
        config: {
          subject: 'Feliz Aniversário! 🎂🎉',
          content: '<h1>Feliz Aniversário, {{first_name}}!</h1><p>Desejamos um dia maravilhoso cheio de alegrias. Como presente especial, preparamos um cupom exclusivo para você!</p>',
        },
      },
      {
        id: '2',
        type: 'send_whatsapp',
        config: {
          message: '🎂 Feliz aniversário, {{first_name}}! 🎉 Desejamos um dia incrível! Como presente, você ganhou 20% OFF na próxima compra. Código: NIVER20',
        },
      },
    ],
  },
  {
    id: 'meteoric_launch',
    name: 'Lançamento Meteórico',
    description: 'Fluxo completo para lançamentos com antecipação e abertura de carrinho',
    category: 'Lançamento',
    icon: Zap,
    color: 'bg-red-500',
    trigger_type: 'tag_added',
    trigger_config: { tag_name: 'lista-lancamento' },
    actions: [
      { id: '1', type: 'send_email', config: { subject: '🚀 Faltam 7 dias para o lançamento!', content: '<p>Olá {{first_name}}! Prepare-se para algo incrível que vai mudar seu jogo.</p>' } },
      { id: '2', type: 'wait', config: { minutes: 4320 } },
      { id: '3', type: 'send_whatsapp', config: { message: '⏰ {{primeiro_nome}}, faltam 4 dias! Você está pronto(a)?' } },
      { id: '4', type: 'wait', config: { minutes: 4320 } },
      { id: '5', type: 'send_email', config: { subject: '🔥 AMANHÃ! Últimas horas antes da abertura', content: '<p>{{first_name}}, amanhã abrimos as inscrições. Fique atento(a)!</p>' } },
      { id: '6', type: 'wait', config: { minutes: 1440 } },
      { id: '7', type: 'send_whatsapp', config: { message: '🎉 ABRIU! {{primeiro_nome}}, o link está disponível agora: {{link}}' } },
      { id: '8', type: 'add_tag', config: { tag_name: 'carrinho-aberto' } },
    ],
  },
  {
    id: 'webinar_funnel',
    name: 'Funil de Webinar',
    description: 'Convite, lembretes, replay e oferta para webinários ao vivo',
    category: 'Lançamento',
    icon: Star,
    color: 'bg-indigo-500',
    trigger_type: 'form_submitted',
    trigger_config: {},
    actions: [
      { id: '1', type: 'send_email', config: { subject: '✅ Inscrição confirmada no webinar!', content: '<p>Olá {{first_name}}! Sua vaga está garantida. Anote a data e o horário.</p>' } },
      { id: '2', type: 'add_tag', config: { tag_name: 'inscrito-webinar' } },
      { id: '3', type: 'wait', config: { minutes: 1440 } },
      { id: '4', type: 'send_whatsapp', config: { message: '📅 Lembrete: o webinar é AMANHÃ! Não perca, {{primeiro_nome}}!' } },
      { id: '5', type: 'wait', config: { minutes: 1380 } },
      { id: '6', type: 'send_whatsapp', config: { message: '🔴 AO VIVO AGORA! {{primeiro_nome}}, entre agora: {{link}}' } },
      { id: '7', type: 'wait', config: { minutes: 120 } },
      { id: '8', type: 'send_email', config: { subject: '🎬 Replay disponível + oferta especial', content: '<p>{{first_name}}, caso não tenha conseguido assistir ao vivo, aqui está o replay com uma oferta exclusiva!</p>' } },
    ],
  },
  {
    id: 'upsell_downsell',
    name: 'Upsell / Downsell',
    description: 'Aumente o ticket médio com ofertas complementares pós-compra',
    category: 'Vendas',
    icon: ShoppingCart,
    color: 'bg-emerald-500',
    trigger_type: 'tag_added',
    trigger_config: { tag_name: 'comprou' },
    actions: [
      { id: '1', type: 'wait', config: { minutes: 30 } },
      { id: '2', type: 'send_email', config: { subject: '🎁 Oferta exclusiva só para clientes!', content: '<p>{{first_name}}, como agradecimento, preparamos uma oferta especial de upgrade com 30% OFF.</p>' } },
      { id: '3', type: 'wait', config: { minutes: 2880 } },
      { id: '4', type: 'send_whatsapp', config: { message: '{{primeiro_nome}}, vi que você ainda não aproveitou a oferta exclusiva. Posso ajudar com alguma dúvida?' } },
      { id: '5', type: 'update_score', config: { points: 20 } },
    ],
  },
  {
    id: 'reactivation',
    name: 'Reativação de Base',
    description: 'Reengaje leads inativos com sequência multicanal',
    category: 'Engajamento',
    icon: MessageSquare,
    color: 'bg-teal-500',
    trigger_type: 'tag_added',
    trigger_config: { tag_name: 'inativo-30d' },
    actions: [
      { id: '1', type: 'send_email', config: { subject: '😢 Sentimos sua falta, {{first_name}}!', content: '<p>Faz tempo que não nos vemos! Temos novidades incríveis para você.</p>' } },
      { id: '2', type: 'wait', config: { minutes: 4320 } },
      { id: '3', type: 'send_whatsapp', config: { message: 'Oi {{primeiro_nome}}! 👋 Temos uma surpresa especial para quem voltar. Quer saber?' } },
      { id: '4', type: 'wait', config: { minutes: 2880 } },
      { id: '5', type: 'send_email', config: { subject: '🎯 Última chance: oferta exclusiva de retorno', content: '<p>{{first_name}}, esta é a sua última chance de aproveitar condições especiais.</p>' } },
    ],
  },
  {
    id: 'event_funnel_email',
    name: 'Funil de Evento — E-mail',
    description: 'Fase 4: Sequência de e-mails automática (boas-vindas, detalhes, lembrete) disparada por tag do evento',
    category: 'Eventos',
    icon: CalendarCheck,
    color: 'bg-amber-600',
    trigger_type: 'tag_added',
    trigger_config: { tag_name: 'evento-2026' },
    actions: [
      { id: '1', type: 'send_email', config: { subject: '✅ Inscrição confirmada no evento!', content: '<h1>Parabéns, {{first_name}}!</h1><p>Sua inscrição no evento foi confirmada. Em breve você receberá todos os detalhes.</p>' } },
      { id: '2', type: 'wait', config: { minutes: 1440 } },
      { id: '3', type: 'send_email', config: { subject: '📋 Detalhes do evento', content: '<p>Olá {{first_name}}! Aqui estão os detalhes completos do evento: data, horário, link de acesso e materiais de apoio.</p>' } },
      { id: '4', type: 'wait', config: { minutes: 2880 } },
      { id: '5', type: 'send_email', config: { subject: '⏰ Lembrete: o evento é AMANHÃ!', content: '<p>{{first_name}}, não esqueça! O evento acontece amanhã. Clique no link abaixo para acessar:</p>' } },
      { id: '6', type: 'update_score', config: { points: 15 } },
    ],
  },
  {
    id: 'event_funnel_whatsapp',
    name: 'Funil de Evento — WhatsApp 1:1',
    description: 'Fase 4: Sequência de WhatsApp (confirmação, link do grupo, lembrete 24h) disparada por tag do evento',
    category: 'Eventos',
    icon: CalendarCheck,
    color: 'bg-green-600',
    trigger_type: 'tag_added',
    trigger_config: { tag_name: 'evento-2026' },
    actions: [
      { id: '1', type: 'send_whatsapp', config: { message: '✅ Olá {{nome}}! Sua inscrição no evento foi confirmada com sucesso. Fique atento(a) às próximas mensagens!' } },
      { id: '2', type: 'wait', config: { minutes: 60 } },
      { id: '3', type: 'send_whatsapp', config: { message: '👥 {{nome}}, entre no grupo exclusivo do evento para receber atualizações em tempo real: {{link_grupo}}' } },
      { id: '4', type: 'wait', config: { minutes: 1380 } },
      { id: '5', type: 'send_whatsapp', config: { message: '⏰ {{nome}}, o evento começa em 24h! Prepare-se e não perca. Nos vemos lá! 🚀' } },
      { id: '6', type: 'add_tag', config: { tag_name: 'lembrete-enviado' } },
    ],
  },
  {
    id: 'event_funnel_group',
    name: 'Funil de Evento — Grupo',
    description: 'Fase 5-6: Automação de grupo com boas-vindas ao novo membro, conteúdo programado e pesquisa pós-evento',
    category: 'Eventos',
    icon: Users,
    color: 'bg-blue-600',
    trigger_type: 'tag_added',
    trigger_config: { tag_name: 'grupo-ativo' },
    actions: [
      { id: '1', type: 'send_whatsapp', config: { message: '🎉 Bem-vindo(a) ao grupo do evento! Aqui você receberá todas as atualizações e materiais exclusivos.' } },
      { id: '2', type: 'add_tag', config: { tag_name: 'grupo-evento-2026' } },
      { id: '3', type: 'wait', config: { minutes: 1440 } },
      { id: '4', type: 'send_whatsapp', config: { message: '📢 Conteúdo exclusivo do evento disponível! Confira o material que preparamos para vocês.' } },
      { id: '5', type: 'wait', config: { minutes: 2880 } },
      { id: '6', type: 'send_whatsapp', config: { message: '🔔 Avisos importantes sobre o evento de amanhã: horário, link de acesso e regras de participação.' } },
      { id: '7', type: 'wait', config: { minutes: 4320 } },
      { id: '8', type: 'send_whatsapp', config: { message: '📊 O evento terminou! Sua opinião é muito importante. Responda nossa pesquisa rápida: {{link_pesquisa}}' } },
    ],
  },
  {
    id: 'event_funnel_complete',
    name: 'Funil Completo de Evento (6 Fases)',
    description: 'Template completo: captação → webhook → organização → automações 1:1 (email+whatsapp) → entrada no grupo → automações do grupo',
    category: 'Eventos',
    icon: Zap,
    color: 'bg-red-600',
    trigger_type: 'form_submitted',
    trigger_config: {},
    actions: [
      // Fase 3: Tag automática
      { id: '1', type: 'add_tag', config: { tag_name: 'evento-2026' } },
      { id: '2', type: 'update_score', config: { points: 10 } },
      // Fase 4: Email de boas-vindas
      { id: '3', type: 'send_email', config: { subject: '✅ Inscrição confirmada!', content: '<h1>{{first_name}}, você está dentro!</h1><p>Sua inscrição foi confirmada. Fique atento(a) ao WhatsApp para receber o link do grupo.</p>' } },
      // Fase 4: WhatsApp 1:1
      { id: '4', type: 'send_whatsapp', config: { message: '✅ {{nome}}, inscrição confirmada! Em breve enviaremos o link do grupo exclusivo do evento.' } },
      { id: '5', type: 'wait', config: { minutes: 30 } },
      { id: '6', type: 'send_whatsapp', config: { message: '👥 {{nome}}, entre no grupo exclusivo do evento: {{link_grupo}}' } },
      // Fase 4: Lembrete 24h
      { id: '7', type: 'wait', config: { minutes: 1380 } },
      { id: '8', type: 'send_email', config: { subject: '⏰ Lembrete: evento amanhã!', content: '<p>{{first_name}}, o evento é AMANHÃ! Não esqueça de acessar pelo link do grupo.</p>' } },
      { id: '9', type: 'send_whatsapp', config: { message: '⏰ {{nome}}, lembrete: o evento começa em 24h! 🚀' } },
      // Fase 6: Pós-evento
      { id: '10', type: 'wait', config: { minutes: 4320 } },
      { id: '11', type: 'send_email', config: { subject: '📊 Como foi sua experiência?', content: '<p>{{first_name}}, o evento acabou! Queremos saber sua opinião. Responda nossa pesquisa rápida.</p>' } },
      { id: '12', type: 'add_tag', config: { tag_name: 'pos-evento' } },
    ],
  },
  {
    id: 'chargeback_recovery',
    name: 'Recuperação de Estorno',
    description: 'Recupere clientes que fizeram estorno/chargeback com sequência de reengajamento',
    category: 'Vendas',
    icon: RotateCcw,
    color: 'bg-red-600',
    trigger_type: 'tag_added',
    trigger_config: { tag_name: 'estorno' },
    actions: [
      { id: '1', type: 'wait', config: { minutes: 60 } },
      { id: '2', type: 'send_email', config: { subject: '😔 Notamos o cancelamento da sua compra', content: '<p>Olá {{first_name}},</p><p>Percebemos que houve um cancelamento/estorno na sua compra. Gostaríamos de entender o que aconteceu e como podemos ajudar.</p><p>Ficou com alguma dúvida sobre o produto? Pode responder este e-mail que vamos te ajudar!</p>' } },
      { id: '3', type: 'wait', config: { minutes: 1440 } },
      { id: '4', type: 'send_whatsapp', config: { message: 'Oi {{nome}}, tudo bem? Vi que houve um problema com sua compra. Posso te ajudar a resolver? Muitas vezes é algo simples que podemos corrigir juntos. 😊' } },
      { id: '5', type: 'wait', config: { minutes: 2880 } },
      { id: '6', type: 'send_email', config: { subject: '🎁 Oferta especial de retorno', content: '<p>{{first_name}}, preparamos uma condição exclusiva para você voltar. Acesse o link abaixo e garanta 40% de desconto na reativação.</p>' } },
      { id: '7', type: 'create_task', config: { title: 'Follow-up estorno', description: 'Cliente fez estorno. Sequência de recuperação em andamento.', due_days: 3 } },
    ],
  },
  {
    id: 'feedback_nps',
    name: 'Pesquisa de Feedback / NPS',
    description: 'Colete feedback e NPS automaticamente após compra ou interação',
    category: 'Fidelização',
    icon: ThumbsUp,
    color: 'bg-cyan-500',
    trigger_type: 'tag_added',
    trigger_config: { tag_name: 'comprou' },
    actions: [
      { id: '1', type: 'wait', config: { minutes: 10080 } },
      { id: '2', type: 'send_email', config: { subject: '⭐ Como está sendo sua experiência?', content: '<p>Olá {{first_name}}!</p><p>Já faz uma semana desde sua compra e gostaríamos de saber: como está sendo sua experiência?</p><p>Responda de 0 a 10: O quanto você recomendaria nosso produto para um amigo?</p>' } },
      { id: '3', type: 'wait', config: { minutes: 2880 } },
      { id: '4', type: 'send_whatsapp', config: { message: '⭐ {{nome}}, sua opinião é muito importante! Pode responder rapidinho: de 0 a 10, quanto recomendaria nosso produto? Leva menos de 30 segundos!' } },
      { id: '5', type: 'add_tag', config: { tag_name: 'pesquisa-enviada' } },
      { id: '6', type: 'wait', config: { minutes: 4320 } },
      { id: '7', type: 'send_email', config: { subject: '🙏 Última chance de dar seu feedback', content: '<p>{{first_name}}, ainda não recebemos seu feedback. Sua resposta nos ajuda a melhorar cada vez mais!</p>' } },
    ],
  },
  {
    id: 'broadcast_multicanal',
    name: 'Broadcast Multicanal',
    description: 'Disparo em massa coordenado via E-mail + WhatsApp + SMS para máximo alcance',
    category: 'Marketing',
    icon: Megaphone,
    color: 'bg-violet-500',
    trigger_type: 'tag_added',
    trigger_config: { tag_name: 'broadcast-campanha' },
    actions: [
      { id: '1', type: 'send_email', config: { subject: '🔥 Novidade exclusiva para você!', content: '<p>Olá {{first_name}}!</p><p>Temos uma novidade incrível que você precisa conhecer. Confira os detalhes abaixo!</p>' } },
      { id: '2', type: 'wait', config: { minutes: 120 } },
      { id: '3', type: 'send_whatsapp', config: { message: '🔥 {{nome}}, acabamos de enviar uma novidade exclusiva no seu e-mail! Confira agora e aproveite antes que acabe. 🚀' } },
      { id: '4', type: 'wait', config: { minutes: 240 } },
      { id: '5', type: 'send_sms', config: { message: '{{nome}}, novidade exclusiva! Confira seu e-mail ou WhatsApp. Oferta por tempo limitado!' } },
      { id: '6', type: 'add_tag', config: { tag_name: 'broadcast-enviado' } },
      { id: '7', type: 'update_score', config: { points: 5 } },
    ],
  },
  {
    id: 'sac_to_pipeline',
    name: 'SAC → Pipeline',
    description: 'Cria um deal automaticamente no Pipeline quando uma mensagem do WhatsApp contiver palavras de interesse de compra (preço, comprar, orçamento, etc.)',
    category: 'Vendas',
    icon: TrendingUp,
    color: 'bg-emerald-500',
    trigger_type: 'whatsapp_received',
    trigger_config: {},
    actions: [
      {
        id: '1',
        type: 'condition',
        config: {
          field: 'message_keyword',
          operator: 'contains_any',
          value: 'preço,preco,valor,quanto custa,comprar,orçamento,orcamento,quero,interessado,proposta',
        },
      },
      {
        id: '2',
        type: 'add_tag',
        config: { tag_name: 'oportunidade-sac' },
      },
      {
        id: '3',
        type: 'update_score',
        config: { points: 25, operation: 'add' },
      },
      {
        id: '4',
        type: 'create_deal',
        config: {
          title: 'Lead SAC — {{first_name}}',
          value: 0,
          probability: 40,
          expected_close_days: 14,
        },
      },
      {
        id: '5',
        type: 'send_notification',
        config: {
          title: 'Nova oportunidade no Pipeline',
          message: 'Lead {{first_name}} demonstrou interesse de compra via SAC. Verifique no Pipeline.',
          link: '/pipeline',
        },
      },
    ],
  },
];

interface AutomationTemplatesProps {
  onSelectTemplate: (template: AutomationTemplate) => void;
}

export function AutomationTemplates({ onSelectTemplate }: AutomationTemplatesProps) {
  const categories = [...new Set(automationTemplates.map((t) => t.category))];

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-lg font-semibold mb-3">{category}</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {automationTemplates
              .filter((t) => t.category === category)
              .map((template) => {
                const Icon = template.icon;
                return (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary"
                    onClick={() => onSelectTemplate(template)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${template.color}`}
                        >
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <Badge variant="secondary" className="mt-1">
                            {template.actions.length} ações
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="line-clamp-2">
                        {template.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
