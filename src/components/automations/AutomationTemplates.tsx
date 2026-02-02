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
