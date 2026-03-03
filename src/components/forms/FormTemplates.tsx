import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Mail, ClipboardList, MessageSquare, UserPlus, Star, ShoppingCart, Calendar } from 'lucide-react';
import type { FormField } from './FormFieldEditor';

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  fields: FormField[];
  settings: FormSettings;
}

export interface FormSettings {
  layout: 'single' | 'two-columns' | 'multi-step' | 'inline';
  primaryColor: string;
  bgColor: string;
  textColor: string;
  borderRadius: string;
  fontFamily: string;
  buttonText: string;
  successMessage: string;
  customCss: string;
  padding: string;
  fieldGap: string;
  labelPosition: 'top' | 'left' | 'hidden';
  showBorder: boolean;
  shadow: 'none' | 'sm' | 'md' | 'lg';
}

export const DEFAULT_SETTINGS: FormSettings = {
  layout: 'single',
  primaryColor: '',
  bgColor: '',
  textColor: '',
  borderRadius: '8',
  fontFamily: '',
  buttonText: 'Enviar',
  successMessage: 'Obrigado por preencher o formulário!',
  customCss: '',
  padding: '24',
  fieldGap: '16',
  labelPosition: 'top',
  showBorder: true,
  shadow: 'md',
};

const TEMPLATES: FormTemplate[] = [
  {
    id: 'contact',
    name: 'Formulário de Contato',
    description: 'Ideal para páginas de contato com nome, email e mensagem.',
    icon: <Mail className="h-6 w-6" />,
    category: 'Básico',
    fields: [
      { name: 'name', label: 'Nome completo', type: 'text', required: true, placeholder: 'Seu nome' },
      { name: 'email', label: 'E-mail', type: 'email', required: true, placeholder: 'seu@email.com' },
      { name: 'phone', label: 'Telefone', type: 'tel', required: false, placeholder: '(11) 99999-9999' },
      { name: 'message', label: 'Mensagem', type: 'textarea', required: true, placeholder: 'Como podemos ajudar?' },
    ],
    settings: { ...DEFAULT_SETTINGS, layout: 'single' },
  },
  {
    id: 'lead-capture',
    name: 'Captura de Lead',
    description: 'Formulário compacto para capturar leads rapidamente.',
    icon: <UserPlus className="h-6 w-6" />,
    category: 'Marketing',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true, placeholder: 'Seu nome' },
      { name: 'email', label: 'E-mail', type: 'email', required: true, placeholder: 'seu@email.com' },
      { name: 'whatsapp', label: 'WhatsApp', type: 'tel', required: false, placeholder: '(11) 99999-9999' },
    ],
    settings: { ...DEFAULT_SETTINGS, layout: 'single', buttonText: 'Quero receber!' },
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    description: 'Captura inline para barras de newsletter em headers ou footers.',
    icon: <FileText className="h-6 w-6" />,
    category: 'Marketing',
    fields: [
      { name: 'email', label: 'E-mail', type: 'email', required: true, placeholder: 'Digite seu e-mail' },
    ],
    settings: { ...DEFAULT_SETTINGS, layout: 'inline', buttonText: 'Inscrever-se', showBorder: false, shadow: 'none' },
  },
  {
    id: 'survey',
    name: 'Pesquisa de Satisfação',
    description: 'Colete feedback dos seus clientes com multi-step.',
    icon: <Star className="h-6 w-6" />,
    category: 'Feedback',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true, placeholder: 'Seu nome' },
      { name: 'rating', label: 'Avaliação', type: 'select', required: true, options: ['Excelente', 'Bom', 'Regular', 'Ruim'] },
      { name: 'recommend', label: 'Nos recomendaria?', type: 'select', required: true, options: ['Sim', 'Talvez', 'Não'] },
      { name: 'feedback', label: 'Comentário', type: 'textarea', required: false, placeholder: 'Conte-nos mais...' },
    ],
    settings: { ...DEFAULT_SETTINGS, layout: 'multi-step', buttonText: 'Enviar Avaliação' },
  },
  {
    id: 'registration',
    name: 'Cadastro Completo',
    description: 'Formulário em duas colunas para cadastros detalhados.',
    icon: <ClipboardList className="h-6 w-6" />,
    category: 'Cadastro',
    fields: [
      { name: 'first_name', label: 'Nome', type: 'text', required: true, placeholder: 'Nome' },
      { name: 'last_name', label: 'Sobrenome', type: 'text', required: true, placeholder: 'Sobrenome' },
      { name: 'email', label: 'E-mail', type: 'email', required: true, placeholder: 'seu@email.com' },
      { name: 'phone', label: 'Telefone', type: 'tel', required: true, placeholder: '(11) 99999-9999' },
      { name: 'company', label: 'Empresa', type: 'text', required: false, placeholder: 'Sua empresa' },
      { name: 'role', label: 'Cargo', type: 'text', required: false, placeholder: 'Seu cargo' },
    ],
    settings: { ...DEFAULT_SETTINGS, layout: 'two-columns', buttonText: 'Cadastrar' },
  },
  {
    id: 'event',
    name: 'Inscrição em Evento',
    description: 'Formulário multi-step para inscrições em eventos.',
    icon: <Calendar className="h-6 w-6" />,
    category: 'Eventos',
    fields: [
      { name: 'name', label: 'Nome completo', type: 'text', required: true, placeholder: 'Seu nome' },
      { name: 'email', label: 'E-mail', type: 'email', required: true, placeholder: 'seu@email.com' },
      { name: 'phone', label: 'Telefone', type: 'tel', required: true, placeholder: '(11) 99999-9999' },
      { name: 'ticket_type', label: 'Tipo de ingresso', type: 'select', required: true, options: ['VIP', 'Premium', 'Standard'] },
      { name: 'dietary', label: 'Restrição alimentar', type: 'select', required: false, options: ['Nenhuma', 'Vegetariano', 'Vegano', 'Sem glúten'] },
      { name: 'notes', label: 'Observações', type: 'textarea', required: false, placeholder: 'Alguma observação?' },
    ],
    settings: { ...DEFAULT_SETTINGS, layout: 'multi-step', buttonText: 'Confirmar Inscrição' },
  },
  {
    id: 'quote',
    name: 'Solicitação de Orçamento',
    description: 'Formulário para orçamentos e propostas comerciais.',
    icon: <ShoppingCart className="h-6 w-6" />,
    category: 'Vendas',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true, placeholder: 'Seu nome' },
      { name: 'email', label: 'E-mail', type: 'email', required: true, placeholder: 'seu@email.com' },
      { name: 'phone', label: 'Telefone', type: 'tel', required: true, placeholder: '(11) 99999-9999' },
      { name: 'service', label: 'Serviço desejado', type: 'select', required: true, options: ['Consultoria', 'Desenvolvimento', 'Design', 'Marketing'] },
      { name: 'budget', label: 'Faixa de orçamento', type: 'select', required: false, options: ['Até R$ 5.000', 'R$ 5.000 - R$ 15.000', 'R$ 15.000 - R$ 50.000', 'Acima de R$ 50.000'] },
      { name: 'details', label: 'Detalhes do projeto', type: 'textarea', required: true, placeholder: 'Descreva o que você precisa...' },
    ],
    settings: { ...DEFAULT_SETTINGS, layout: 'single', buttonText: 'Solicitar Orçamento' },
  },
  {
    id: 'support',
    name: 'Suporte / Chamado',
    description: 'Formulário para abertura de chamados de suporte.',
    icon: <MessageSquare className="h-6 w-6" />,
    category: 'Suporte',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true, placeholder: 'Seu nome' },
      { name: 'email', label: 'E-mail', type: 'email', required: true, placeholder: 'seu@email.com' },
      { name: 'category', label: 'Categoria', type: 'select', required: true, options: ['Bug', 'Dúvida', 'Sugestão', 'Outro'] },
      { name: 'priority', label: 'Prioridade', type: 'select', required: true, options: ['Baixa', 'Média', 'Alta', 'Urgente'] },
      { name: 'description', label: 'Descrição', type: 'textarea', required: true, placeholder: 'Descreva o problema em detalhes...' },
    ],
    settings: { ...DEFAULT_SETTINGS, layout: 'two-columns', buttonText: 'Abrir Chamado' },
  },
];

interface Props {
  onSelect: (template: FormTemplate) => void;
}

export function FormTemplates({ onSelect }: Props) {
  const categories = [...new Set(TEMPLATES.map(t => t.category))];

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TEMPLATES.filter(t => t.category === category).map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer hover:border-primary/50 transition-colors group"
                onClick={() => onSelect(template)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{template.name}</p>
                        <Badge variant="secondary" className="text-[10px]">{template.fields.length} campos</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{template.description}</p>
                      <Badge variant="outline" className="text-[10px] mt-1.5">
                        {template.settings.layout === 'single' && 'Coluna única'}
                        {template.settings.layout === 'two-columns' && 'Duas colunas'}
                        {template.settings.layout === 'multi-step' && 'Multi-step'}
                        {template.settings.layout === 'inline' && 'Inline'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
