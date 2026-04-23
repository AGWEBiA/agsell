import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ActionConfigFieldsProps {
  actionType: string;
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
}

export function ActionConfigFields({ actionType, config, onConfigChange }: ActionConfigFieldsProps) {
  const set = (key: string, value: unknown) => onConfigChange({ ...config, [key]: value });

  switch (actionType) {
    case 'send_email':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Template de Email</Label>
            <Select value={(config.template_id as string) || ''} onValueChange={(v) => set('template_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione um template" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="welcome">Boas-vindas</SelectItem>
                <SelectItem value="followup">Follow-up</SelectItem>
                <SelectItem value="promotion">Promoção</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Assunto</Label>
            <Input placeholder="Assunto do email" value={(config.subject as string) || ''} onChange={(e) => set('subject', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Conteúdo</Label>
            <Textarea placeholder="Conteúdo do email... Use {{nome}}, {{email}} como variáveis" rows={4} value={(config.content as string) || ''} onChange={(e) => set('content', e.target.value)} />
          </div>
        </div>
      );

    case 'send_whatsapp':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={(config.template as string) || ''} onValueChange={(v) => set('template', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione um template" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="welcome">Boas-vindas</SelectItem>
                <SelectItem value="followup">Follow-up</SelectItem>
                <SelectItem value="custom">Personalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea placeholder="Olá {{nome}}, seja bem-vindo..." rows={4} value={(config.message as string) || ''} onChange={(e) => set('message', e.target.value)} />
            <p className="text-xs text-muted-foreground">Variáveis: {'{{nome}}'}, {'{{email}}'}, {'{{telefone}}'}</p>
          </div>
          <div className="space-y-2">
            <Label>Botões (opcional)</Label>
            <Input placeholder="Texto do botão 1" value={(config.button1 as string) || ''} onChange={(e) => set('button1', e.target.value)} />
            <Input placeholder="Texto do botão 2" value={(config.button2 as string) || ''} onChange={(e) => set('button2', e.target.value)} />
          </div>
        </div>
      );

    case 'send_instagram_dm':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea placeholder="Olá! Obrigado por interagir com nosso conteúdo..." rows={4} value={(config.message as string) || ''} onChange={(e) => set('message', e.target.value)} />
            <p className="text-xs text-muted-foreground">Variáveis: {'{{nome}}'}, {'{{username}}'}</p>
          </div>
          <div className="space-y-2">
            <Label>Tipo de Mensagem</Label>
            <Select value={(config.message_type as string) || 'text'} onValueChange={(v) => set('message_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="image">Imagem + Texto</SelectItem>
                <SelectItem value="quick_reply">Quick Replies</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {config.message_type === 'image' && (
            <div className="space-y-2">
              <Label>URL da Imagem</Label>
              <Input placeholder="https://..." value={(config.image_url as string) || ''} onChange={(e) => set('image_url', e.target.value)} />
            </div>
          )}
          {config.message_type === 'quick_reply' && (
            <div className="space-y-2">
              <Label>Respostas Rápidas</Label>
              <Input placeholder="Opção 1" value={(config.quick_reply_1 as string) || ''} onChange={(e) => set('quick_reply_1', e.target.value)} />
              <Input placeholder="Opção 2" value={(config.quick_reply_2 as string) || ''} onChange={(e) => set('quick_reply_2', e.target.value)} />
              <Input placeholder="Opção 3" value={(config.quick_reply_3 as string) || ''} onChange={(e) => set('quick_reply_3', e.target.value)} />
            </div>
          )}
        </div>
      );

    case 'send_sms':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Mensagem SMS</Label>
            <Textarea placeholder="Sua mensagem SMS..." rows={3} value={(config.message as string) || ''} onChange={(e) => set('message', e.target.value)} />
            <p className="text-xs text-muted-foreground">Máx. 160 caracteres. Variáveis: {'{{nome}}'}</p>
          </div>
        </div>
      );

    case 'add_tag':
    case 'remove_tag':
      return (
        <div className="space-y-2">
          <Label>Nome da Tag</Label>
          <Input placeholder="Ex: Lead Quente" value={(config.tag_name as string) || ''} onChange={(e) => set('tag_name', e.target.value)} />
        </div>
      );

    case 'set_custom_field':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Campo</Label>
            <Select value={(config.field_name as string) || ''} onValueChange={(v) => set('field_name', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione o campo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="source">Fonte</SelectItem>
                <SelectItem value="position">Cargo</SelectItem>
                <SelectItem value="notes">Observações</SelectItem>
                <SelectItem value="phone">Telefone</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="custom">Campo Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {config.field_name === 'custom' && (
            <div className="space-y-2">
              <Label>Nome do Campo</Label>
              <Input placeholder="nome_do_campo" value={(config.custom_field_key as string) || ''} onChange={(e) => set('custom_field_key', e.target.value)} />
            </div>
          )}
          <div className="space-y-2">
            <Label>Valor</Label>
            <Input placeholder="Novo valor do campo" value={(config.field_value as string) || ''} onChange={(e) => set('field_value', e.target.value)} />
            <p className="text-xs text-muted-foreground">Use {'{{variavel}}'} para valores dinâmicos</p>
          </div>
        </div>
      );

    case 'update_score':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Operação</Label>
            <Select value={(config.operation as string) || 'add'} onValueChange={(v) => set('operation', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Adicionar pontos</SelectItem>
                <SelectItem value="subtract">Subtrair pontos</SelectItem>
                <SelectItem value="set">Definir valor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Pontos</Label>
            <Input type="number" placeholder="10" value={(config.points as string) || ''} onChange={(e) => set('points', parseInt(e.target.value) || 0)} />
          </div>
        </div>
      );

    case 'send_notification':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input placeholder="Título da notificação" value={(config.title as string) || ''} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea placeholder="Mensagem da notificação..." rows={3} value={(config.message as string) || ''} onChange={(e) => set('message', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Canal de Notificação</Label>
            <Select value={(config.channel as string) || 'in_app'} onValueChange={(v) => set('channel', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in_app">No App</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'wait':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tempo de Espera</Label>
            <div className="flex gap-2">
              <Input type="number" placeholder="1" className="w-24" value={(config.duration as string) || ''} onChange={(e) => set('duration', parseInt(e.target.value) || 0)} />
              <Select value={(config.unit as string) || 'hours'} onValueChange={(v) => set('unit', v)}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutos</SelectItem>
                  <SelectItem value="hours">Horas</SelectItem>
                  <SelectItem value="days">Dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );

    case 'subscribe_sequence':
    case 'unsubscribe_sequence':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>ID da Sequência</Label>
            <Input placeholder="ID ou nome da sequência" value={(config.sequence_id as string) || ''} onChange={(e) => set('sequence_id', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Nome da Sequência (referência)</Label>
            <Input placeholder="Ex: Onboarding" value={(config.sequence_name as string) || ''} onChange={(e) => set('sequence_name', e.target.value)} />
          </div>
        </div>
      );

    case 'http_request':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Método</Label>
            <Select value={(config.method as string) || 'POST'} onValueChange={(v) => set('method', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>URL</Label>
            <Input placeholder="https://api.example.com/webhook" value={(config.url as string) || ''} onChange={(e) => set('url', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Headers (JSON)</Label>
            <Textarea placeholder='{"Authorization": "Bearer ..."}' rows={2} value={(config.headers as string) || ''} onChange={(e) => set('headers', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Body (JSON)</Label>
            <Textarea placeholder='{"contact_id": "{{id}}", "event": "..."}' rows={3} value={(config.body as string) || ''} onChange={(e) => set('body', e.target.value)} />
            <p className="text-xs text-muted-foreground">Variáveis: {'{{id}}'}, {'{{nome}}'}, {'{{email}}'}, {'{{telefone}}'}</p>
          </div>
        </div>
      );

    case 'assign_agent':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Estratégia de Atribuição</Label>
            <Select value={(config.strategy as string) || 'round_robin'} onValueChange={(v) => set('strategy', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="round_robin">Round Robin</SelectItem>
                <SelectItem value="least_busy">Menos Ocupado</SelectItem>
                <SelectItem value="specific">Agente Específico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {config.strategy === 'specific' && (
            <div className="space-y-2">
              <Label>Nome do Agente</Label>
              <Input placeholder="Nome do agente" value={(config.agent_name as string) || ''} onChange={(e) => set('agent_name', e.target.value)} />
            </div>
          )}
          <div className="space-y-2">
            <Label>Departamento (opcional)</Label>
            <Input placeholder="Ex: Vendas, Suporte" value={(config.department as string) || ''} onChange={(e) => set('department', e.target.value)} />
          </div>
        </div>
      );

    case 'transfer_human':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Departamento</Label>
            <Select value={(config.department as string) || ''} onValueChange={(v) => set('department', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione o departamento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Vendas</SelectItem>
                <SelectItem value="support">Suporte</SelectItem>
                <SelectItem value="billing">Financeiro</SelectItem>
                <SelectItem value="custom">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mensagem de Transferência</Label>
            <Textarea placeholder="Você será transferido para um atendente..." rows={2} value={(config.transfer_message as string) || ''} onChange={(e) => set('transfer_message', e.target.value)} />
          </div>
        </div>
      );

    case 'ab_split':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Divisão do Tráfego</Label>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium w-16">A: {String(config.split_percent || 50)}%</span>
              <Slider
                value={[Number(config.split_percent) || 50]}
                onValueChange={([v]) => set('split_percent', v)}
                min={10}
                max={90}
                step={5}
                className="flex-1"
              />
              <span className="text-sm font-medium w-16">B: {String(100 - (Number(config.split_percent) || 50))}%</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nome Variante A</Label>
            <Input placeholder="Ex: Mensagem curta" value={(config.variant_a_name as string) || ''} onChange={(e) => set('variant_a_name', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Nome Variante B</Label>
            <Input placeholder="Ex: Mensagem longa" value={(config.variant_b_name as string) || ''} onChange={(e) => set('variant_b_name', e.target.value)} />
          </div>
        </div>
      );

    case 'goto_flow':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>ID do Flow</Label>
            <Input placeholder="ID do flow de destino" value={(config.flow_id as string) || ''} onChange={(e) => set('flow_id', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Nome do Flow (referência)</Label>
            <Input placeholder="Ex: Funil de Vendas" value={(config.flow_name as string) || ''} onChange={(e) => set('flow_name', e.target.value)} />
          </div>
        </div>
      );

    case 'create_task':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título da Tarefa</Label>
            <Input placeholder="Ex: Fazer follow-up com lead" value={(config.title as string) || ''} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Prazo (dias)</Label>
            <Input type="number" placeholder="3" value={(config.due_days as string) || ''} onChange={(e) => set('due_days', parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <Select value={(config.priority as string) || 'medium'} onValueChange={(v) => set('priority', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'create_deal':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título do Deal</Label>
            <Input
              placeholder="Ex: Lead via {{source}} — {{first_name}}"
              value={(config.title as string) || ''}
              onChange={(e) => set('title', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use {`{{first_name}}`} e {`{{source}}`} como variáveis. Se vazio, será gerado automaticamente.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Valor estimado (R$)</Label>
            <Input
              type="number"
              placeholder="0"
              value={(config.value as string) || ''}
              onChange={(e) => set('value', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>Probabilidade (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="50"
              value={(config.probability as string) || ''}
              onChange={(e) => set('probability', parseInt(e.target.value) || 50)}
            />
          </div>
          <div className="space-y-2">
            <Label>Fechamento esperado (dias)</Label>
            <Input
              type="number"
              placeholder="30"
              value={(config.expected_close_days as string) || ''}
              onChange={(e) => set('expected_close_days', parseInt(e.target.value) || 0)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            ℹ️ O deal será criado no <strong>primeiro estágio</strong> do seu pipeline (ex: "Novo Lead").
          </p>
        </div>
      );

    case 'send_poll':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Canal da Enquete</Label>
            <Select value={(config.poll_channel as string) || 'whatsapp'} onValueChange={(v) => set('poll_channel', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="instagram">Instagram DM</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Pergunta</Label>
            <Input placeholder="Qual produto te interessa mais?" value={(config.question as string) || ''} onChange={(e) => set('question', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Opções de Resposta</Label>
            <Input placeholder="Opção 1 (obrigatória)" value={(config.option_1 as string) || ''} onChange={(e) => set('option_1', e.target.value)} />
            <Input placeholder="Opção 2 (obrigatória)" value={(config.option_2 as string) || ''} onChange={(e) => set('option_2', e.target.value)} />
            <Input placeholder="Opção 3 (opcional)" value={(config.option_3 as string) || ''} onChange={(e) => set('option_3', e.target.value)} />
            <Input placeholder="Opção 4 (opcional)" value={(config.option_4 as string) || ''} onChange={(e) => set('option_4', e.target.value)} />
          </div>
          <div className="rounded-lg border p-3 bg-accent/30 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">📌 Ações por Resposta (opcional)</p>
            <p className="text-xs text-muted-foreground">Defina o que acontece quando o contato escolhe cada opção:</p>
            {[1, 2, 3, 4].map((i) => {
              const optVal = config[`option_${i}`] as string;
              if (!optVal) return null;
              return (
                <div key={i} className="space-y-1">
                  <Label className="text-xs">Se responder "{optVal}":</Label>
                  <Select value={(config[`action_on_${i}`] as string) || 'none'} onValueChange={(v) => set(`action_on_${i}`, v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma ação extra</SelectItem>
                      <SelectItem value="add_tag">Adicionar Tag</SelectItem>
                      <SelectItem value="set_field">Definir Campo</SelectItem>
                      <SelectItem value="goto_flow">Ir para Flow</SelectItem>
                      <SelectItem value="subscribe_sequence">Inscrever em Sequência</SelectItem>
                      <SelectItem value="send_message">Enviar Mensagem</SelectItem>
                    </SelectContent>
                  </Select>
                  {config[`action_on_${i}`] && config[`action_on_${i}`] !== 'none' && (
                    <Input
                      className="h-8 text-xs"
                      placeholder={
                        config[`action_on_${i}`] === 'add_tag' ? 'Nome da tag' :
                        config[`action_on_${i}`] === 'set_field' ? 'campo=valor' :
                        config[`action_on_${i}`] === 'goto_flow' ? 'ID do flow' :
                        config[`action_on_${i}`] === 'subscribe_sequence' ? 'ID da sequência' :
                        'Mensagem de resposta'
                      }
                      value={(config[`action_value_${i}`] as string) || ''}
                      onChange={(e) => set(`action_value_${i}`, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="space-y-2">
            <Label>Salvar resposta no campo</Label>
            <Input placeholder="Ex: interesse_produto" value={(config.save_to_field as string) || ''} onChange={(e) => set('save_to_field', e.target.value)} />
            <p className="text-xs text-muted-foreground">A resposta será salva neste campo do contato</p>
          </div>
        </div>
      );

    case 'condition':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Condição</Label>
            <Select value={(config.condition_type as string) || 'field'} onValueChange={(v) => set('condition_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="field">Campo do Contato</SelectItem>
                <SelectItem value="tag">Possui Tag</SelectItem>
                <SelectItem value="score">Lead Score</SelectItem>
                <SelectItem value="poll_response">Resposta de Enquete</SelectItem>
                <SelectItem value="last_interaction">Última Interação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(config.condition_type === 'field' || !config.condition_type) && (
            <>
              <div className="space-y-2">
                <Label>Campo</Label>
                <Select value={(config.condition_field as string) || ''} onValueChange={(v) => set('condition_field', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione o campo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="source">Fonte</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Telefone</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="position">Cargo</SelectItem>
                    <SelectItem value="custom">Campo Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {config.condition_field === 'custom' && (
                <div className="space-y-2">
                  <Label>Nome do Campo</Label>
                  <Input placeholder="nome_do_campo" value={(config.custom_field_key as string) || ''} onChange={(e) => set('custom_field_key', e.target.value)} />
                </div>
              )}
            </>
          )}

          {config.condition_type === 'tag' && (
            <div className="space-y-2">
              <Label>Nome da Tag</Label>
              <Input placeholder="Ex: Lead Quente" value={(config.condition_field as string) || ''} onChange={(e) => set('condition_field', e.target.value)} />
            </div>
          )}

          {config.condition_type === 'score' && (
            <div className="space-y-2">
              <Label>Campo de Score</Label>
              <Input value="lead_score" disabled />
              {(() => { if (!config.condition_field) set('condition_field', 'lead_score'); return null; })()}
            </div>
          )}

          {config.condition_type === 'poll_response' && (
            <div className="space-y-2">
              <Label>Campo da Enquete</Label>
              <Input placeholder="Ex: interesse_produto (campo salvo na enquete)" value={(config.condition_field as string) || ''} onChange={(e) => set('condition_field', e.target.value)} />
            </div>
          )}

          {config.condition_type === 'last_interaction' && (
            <div className="space-y-2">
              <Label>Campo</Label>
              <Input value="days_since_last_interaction" disabled />
              {(() => { if (!config.condition_field) set('condition_field', 'days_since_last_interaction'); return null; })()}
            </div>
          )}

          <div className="space-y-2">
            <Label>Operador</Label>
            <Select value={(config.condition_operator as string) || 'equals'} onValueChange={(v) => set('condition_operator', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Igual a</SelectItem>
                <SelectItem value="not_equals">Diferente de</SelectItem>
                <SelectItem value="contains">Contém</SelectItem>
                <SelectItem value="not_contains">Não contém</SelectItem>
                <SelectItem value="greater_than">Maior que</SelectItem>
                <SelectItem value="less_than">Menor que</SelectItem>
                <SelectItem value="exists">Existe (preenchido)</SelectItem>
                <SelectItem value="not_exists">Não existe (vazio)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!['exists', 'not_exists'].includes((config.condition_operator as string) || '') && (
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input placeholder="Valor para comparação" value={(config.condition_value as string) || ''} onChange={(e) => set('condition_value', e.target.value)} />
            </div>
          )}

          <div className="rounded-lg border p-3 bg-accent/30 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">📌 Ramificação</p>
            <div className="space-y-2">
              <Label className="text-xs text-green-600">✅ Se VERDADEIRO → Ação:</Label>
              <Select value={(config.true_action as string) || 'continue'} onValueChange={(v) => set('true_action', v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="continue">Continuar para próxima ação</SelectItem>
                  <SelectItem value="add_tag">Adicionar Tag</SelectItem>
                  <SelectItem value="goto_flow">Ir para Flow</SelectItem>
                  <SelectItem value="subscribe_sequence">Inscrever em Sequência</SelectItem>
                  <SelectItem value="send_message">Enviar Mensagem</SelectItem>
                  <SelectItem value="stop">Parar automação</SelectItem>
                </SelectContent>
              </Select>
              {config.true_action && !['continue', 'stop'].includes(config.true_action as string) && (
                <Input className="h-8 text-xs" placeholder="Valor (tag, flow ID, mensagem...)" value={(config.true_action_value as string) || ''} onChange={(e) => set('true_action_value', e.target.value)} />
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-red-600">❌ Se FALSO → Ação:</Label>
              <Select value={(config.false_action as string) || 'continue'} onValueChange={(v) => set('false_action', v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="continue">Continuar para próxima ação</SelectItem>
                  <SelectItem value="add_tag">Adicionar Tag</SelectItem>
                  <SelectItem value="goto_flow">Ir para Flow</SelectItem>
                  <SelectItem value="subscribe_sequence">Inscrever em Sequência</SelectItem>
                  <SelectItem value="send_message">Enviar Mensagem</SelectItem>
                  <SelectItem value="stop">Parar automação</SelectItem>
                </SelectContent>
              </Select>
              {config.false_action && !['continue', 'stop'].includes(config.false_action as string) && (
                <Input className="h-8 text-xs" placeholder="Valor (tag, flow ID, mensagem...)" value={(config.false_action_value as string) || ''} onChange={(e) => set('false_action_value', e.target.value)} />
              )}
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
