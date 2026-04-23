import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Mail,
  Tag,
  Star,
  Bell,
  Clock,
  MessageSquare,
  UserPlus,
  Plus,
  Trash2,
  GripVertical,
  ArrowRight,
  Instagram,
  PenLine,
  ListPlus,
  ListMinus,
  Globe,
  UserCheck,
  Phone,
  Shuffle,
  HeadphonesIcon,
  GitBranch,
  Pencil,
  Vote,
  SplitSquareVertical,
  TrendingUp,
} from 'lucide-react';
import { ActionConfigFields } from './ActionConfigFields';

export type ActionType =
  | 'send_email'
  | 'add_tag'
  | 'remove_tag'
  | 'update_score'
  | 'send_notification'
  | 'wait'
  | 'send_whatsapp'
  | 'create_task'
  | 'move_deal_stage'
  | 'send_instagram_dm'
  | 'set_custom_field'
  | 'subscribe_sequence'
  | 'unsubscribe_sequence'
  | 'http_request'
  | 'assign_agent'
  | 'send_sms'
  | 'ab_split'
  | 'transfer_human'
  | 'goto_flow'
  | 'send_poll'
  | 'create_deal'
  | 'condition';

export type Action = {
  id: string;
  type: ActionType;
  config: Record<string, unknown>;
};

export const actionTypes = [
  { value: 'send_email', label: 'Enviar Email', icon: Mail, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400', category: 'messaging' },
  { value: 'send_whatsapp', label: 'Enviar WhatsApp', icon: MessageSquare, color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400', category: 'messaging' },
  { value: 'send_instagram_dm', label: 'Enviar DM Instagram', icon: Instagram, color: 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-400', category: 'messaging' },
  { value: 'send_sms', label: 'Enviar SMS', icon: Phone, color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-400', category: 'messaging' },
  { value: 'send_notification', label: 'Notificar Admin', icon: Bell, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400', category: 'messaging' },
  { value: 'add_tag', label: 'Adicionar Tag', icon: Tag, color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400', category: 'crm' },
  { value: 'remove_tag', label: 'Remover Tag', icon: Tag, color: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400', category: 'crm' },
  { value: 'set_custom_field', label: 'Definir Campo', icon: PenLine, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400', category: 'crm' },
  { value: 'update_score', label: 'Atualizar Lead Score', icon: Star, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400', category: 'crm' },
  { value: 'create_deal', label: 'Criar Deal no Pipeline', icon: TrendingUp, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400', category: 'crm' },
  { value: 'subscribe_sequence', label: 'Inscrever em Sequência', icon: ListPlus, color: 'bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-400', category: 'flow' },
  { value: 'unsubscribe_sequence', label: 'Remover de Sequência', icon: ListMinus, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400', category: 'flow' },
  { value: 'goto_flow', label: 'Ir para outro Flow', icon: GitBranch, color: 'bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-400', category: 'flow' },
  { value: 'send_poll', label: 'Enviar Enquete', icon: Vote, color: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900 dark:text-fuchsia-400', category: 'messaging' },
  { value: 'ab_split', label: 'Teste A/B (Split)', icon: Shuffle, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400', category: 'flow' },
  { value: 'condition', label: 'Condição (Se/Senão)', icon: SplitSquareVertical, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400', category: 'flow' },
  { value: 'wait', label: 'Aguardar', icon: Clock, color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', category: 'flow' },
  { value: 'assign_agent', label: 'Atribuir a Agente', icon: UserCheck, color: 'bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-400', category: 'team' },
  { value: 'transfer_human', label: 'Transferir p/ Humano', icon: HeadphonesIcon, color: 'bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-400', category: 'team' },
  { value: 'create_task', label: 'Criar Tarefa', icon: UserPlus, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400', category: 'team' },
  { value: 'http_request', label: 'Requisição HTTP', icon: Globe, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', category: 'advanced' },
];

const categoryLabels: Record<string, string> = {
  messaging: '💬 Mensagens',
  crm: '📇 CRM & Dados',
  flow: '🔀 Fluxo & Sequência',
  team: '👥 Equipe',
  advanced: '⚙️ Avançado',
};

interface AutomationActionsEditorProps {
  actions: Action[];
  onChange: (actions: Action[]) => void;
}

export function AutomationActionsEditor({ actions, onChange }: AutomationActionsEditorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [newActionType, setNewActionType] = useState<ActionType | ''>('');
  const [actionConfig, setActionConfig] = useState<Record<string, unknown>>({});

  const handleAddAction = () => {
    if (!newActionType) return;
    const newAction: Action = {
      id: crypto.randomUUID(),
      type: newActionType,
      config: actionConfig,
    };
    onChange([...actions, newAction]);
    setIsDialogOpen(false);
    setNewActionType('');
    setActionConfig({});
  };

  const handleEditAction = (action: Action) => {
    setEditingAction(action);
    setNewActionType(action.type);
    setActionConfig(action.config);
    setIsDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingAction || !newActionType) return;
    const updatedActions = actions.map((a) =>
      a.id === editingAction.id ? { ...a, type: newActionType, config: actionConfig } : a
    );
    onChange(updatedActions);
    setIsDialogOpen(false);
    setEditingAction(null);
    setNewActionType('');
    setActionConfig({});
  };

  const handleRemoveAction = (actionId: string) => {
    onChange(actions.filter((a) => a.id !== actionId));
  };

  const getActionTypeInfo = (type: ActionType) => actionTypes.find((t) => t.value === type);

  const getActionSummary = (action: Action): string => {
    switch (action.type) {
      case 'send_email':
        return action.config.subject ? `"${String(action.config.subject)}"` : 'Email configurado';
      case 'add_tag':
      case 'remove_tag':
        return action.config.tag_name ? `Tag: ${String(action.config.tag_name)}` : action.type === 'add_tag' ? 'Adicionar tag' : 'Remover tag';
      case 'update_score':
        return `${action.config.operation === 'add' ? '+' : action.config.operation === 'subtract' ? '-' : '='} ${action.config.points || 0} pontos`;
      case 'send_notification':
        return action.config.title ? String(action.config.title) : 'Notificação';
      case 'wait':
        return `${action.config.duration || 0} ${action.config.unit === 'minutes' ? 'min' : action.config.unit === 'hours' ? 'h' : 'd'}`;
      case 'send_whatsapp':
        return action.config.message ? String(action.config.message).slice(0, 40) + '…' : 'Mensagem WhatsApp';
      case 'send_instagram_dm':
        return action.config.message ? String(action.config.message).slice(0, 40) + '…' : 'DM Instagram';
      case 'send_sms':
        return action.config.message ? String(action.config.message).slice(0, 40) + '…' : 'Mensagem SMS';
      case 'create_task':
        return action.config.title ? String(action.config.title) : 'Nova tarefa';
      case 'create_deal':
        return action.config.title ? `Deal: ${String(action.config.title)}` : 'Novo deal no pipeline';
      case 'set_custom_field':
        return action.config.field_name ? `${String(action.config.field_name)} = ${String(action.config.field_value || '')}` : 'Campo personalizado';
      case 'subscribe_sequence':
        return action.config.sequence_name ? `Sequência: ${String(action.config.sequence_name)}` : 'Inscrever em sequência';
      case 'unsubscribe_sequence':
        return action.config.sequence_name ? `Sequência: ${String(action.config.sequence_name)}` : 'Remover de sequência';
      case 'http_request':
        return action.config.url ? `${String(action.config.method || 'POST')} ${String(action.config.url).slice(0, 30)}…` : 'Requisição HTTP';
      case 'assign_agent':
        return action.config.agent_name ? String(action.config.agent_name) : 'Atribuir agente';
      case 'ab_split':
        return `${action.config.split_percent || 50}% / ${100 - (Number(action.config.split_percent) || 50)}%`;
      case 'transfer_human':
        return action.config.department ? `Dept: ${String(action.config.department)}` : 'Live chat';
      case 'goto_flow':
        return action.config.flow_name ? `→ ${String(action.config.flow_name)}` : 'Outro flow';
      case 'send_poll': {
        const question = action.config.question ? String(action.config.question) : 'Enquete';
        const optCount = [action.config.option_1, action.config.option_2, action.config.option_3, action.config.option_4].filter(Boolean).length;
        return `${question.slice(0, 30)}${question.length > 30 ? '…' : ''} (${optCount} opções)`;
      }
      case 'condition': {
        const field = action.config.condition_field ? String(action.config.condition_field) : '';
        const op = action.config.condition_operator ? String(action.config.condition_operator) : '';
        return field ? `Se ${field} ${op} ${String(action.config.condition_value || '')}` : 'Condição';
      }
      default:
        return '';
    }
  };

  // Group action types by category for the selector
  const groupedActions = actionTypes.reduce((acc, at) => {
    const cat = at.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(at);
    return acc;
  }, {} as Record<string, typeof actionTypes>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Ações da Automação</Label>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditingAction(null);
            setNewActionType('');
            setActionConfig({});
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Ação
        </Button>
      </div>

      {actions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              Nenhuma ação configurada. Clique em "Adicionar Ação" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {actions.map((action, index) => {
            const typeInfo = getActionTypeInfo(action.type);
            if (!typeInfo) return null;
            const Icon = typeInfo.icon;

            return (
              <Card key={action.id} className="group hover:shadow-sm transition-shadow">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {index + 1}
                      </Badge>
                      {index > 0 && <ArrowRight className="h-3 w-3" />}
                    </div>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-md ${typeInfo.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{typeInfo.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{getActionSummary(action)}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditAction(action)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRemoveAction(action.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAction ? 'Editar Ação' : 'Nova Ação'}</DialogTitle>
            <DialogDescription>Configure a ação que será executada na automação.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!editingAction && !newActionType ? (
              <div className="space-y-4">
                {Object.entries(groupedActions).map(([category, items]) => (
                  <div key={category}>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">{categoryLabels[category] || category}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {items.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            className="flex items-center gap-2 p-2.5 rounded-lg border hover:bg-accent transition-colors text-left"
                            onClick={() => {
                              setNewActionType(type.value as ActionType);
                              setActionConfig({});
                            }}
                          >
                            <div className={`flex h-7 w-7 items-center justify-center rounded-md ${type.color}`}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-medium leading-tight">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {newActionType && (
                  <div className="flex items-center gap-2 p-2 bg-accent/50 rounded-lg">
                    {(() => {
                      const info = getActionTypeInfo(newActionType);
                      if (!info) return null;
                      const Icon = info.icon;
                      return (
                        <>
                          <div className={`flex h-7 w-7 items-center justify-center rounded-md ${info.color}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-sm font-medium">{info.label}</span>
                          {!editingAction && (
                            <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs" onClick={() => setNewActionType('')}>
                              Trocar
                            </Button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
                <ActionConfigFields
                  actionType={newActionType}
                  config={actionConfig}
                  onConfigChange={setActionConfig}
                />
              </>
            )}
          </div>

          {newActionType && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={editingAction ? handleSaveEdit : handleAddAction}>
                {editingAction ? 'Salvar' : 'Adicionar'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
