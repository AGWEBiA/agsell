import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useGatewayProducts } from '@/hooks/useGatewayProducts';

interface SequenceNodeConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  subtype: string;
}

const TRANSACTION_STATUSES = [
  { value: 'cart_abandoned', label: 'Abandonou o carrinho' },
  { value: 'purchase_approved', label: 'Compra aprovada' },
  { value: 'purchase_completed', label: 'Compra realizada' },
  { value: 'boleto_generated', label: 'Boleto gerado' },
  { value: 'boleto_paid', label: 'Boleto pago' },
  { value: 'pix_generated', label: 'PIX gerado' },
  { value: 'pix_paid', label: 'PIX pago' },
  { value: 'refund', label: 'Reembolso' },
  { value: 'chargeback', label: 'Chargeback' },
  { value: 'subscription_canceled', label: 'Assinatura cancelada' },
  { value: 'subscription_renewed', label: 'Assinatura renovada' },
  { value: 'trial_started', label: 'Trial iniciado' },
  { value: 'trial_ended', label: 'Trial finalizado' },
];

const LEAD_STATUSES = [
  { value: 'new', label: 'Novo lead' },
  { value: 'engaged', label: 'Engajado' },
  { value: 'qualified', label: 'Qualificado' },
  { value: 'opportunity', label: 'Oportunidade' },
  { value: 'customer', label: 'Cliente' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'lost', label: 'Perdido' },
];

export function SequenceNodeConfig({ config, onChange, subtype }: SequenceNodeConfigProps) {
  const { data: gatewayProducts = [] } = useGatewayProducts(String(config.gateway || 'any'));

  const updateField = (field: string, value: unknown) => {
    onChange({ ...config, [field]: value });
  };

  if (subtype === 'sequence_transaction') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Configure a sequência de transação. O lead entra ao receber o status de entrada e sai automaticamente ao receber o status de saída.
        </p>

        <div>
          <Label>Gateway de Pagamento</Label>
          <Select value={String(config.gateway || 'any')} onValueChange={v => updateField('gateway', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Qualquer gateway</SelectItem>
              <SelectItem value="hotmart">Hotmart</SelectItem>
              <SelectItem value="kiwify">Kiwify</SelectItem>
              <SelectItem value="eduzz">Eduzz</SelectItem>
              <SelectItem value="stripe">Stripe</SelectItem>
              <SelectItem value="shopify">Shopify</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Status de Entrada *</Label>
          <Select value={String(config.entry_status || '')} onValueChange={v => updateField('entry_status', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione o status de entrada" /></SelectTrigger>
            <SelectContent>
              {TRANSACTION_STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">O lead entra na sequência quando recebe este status</p>
        </div>

        <div>
          <Label>Status de Saída *</Label>
          <Select value={String(config.exit_status || '')} onValueChange={v => updateField('exit_status', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione o status de saída" /></SelectTrigger>
            <SelectContent>
              {TRANSACTION_STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">O lead sai da sequência automaticamente ao receber este status</p>
        </div>

        <div>
          <Label>Produto (opcional)</Label>
          <Select value={String(config.product_id || 'any')} onValueChange={v => updateField('product_id', v)}>
            <SelectTrigger><SelectValue placeholder="Qualquer produto" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Qualquer produto</SelectItem>
              {gatewayProducts.map(p => (
                <SelectItem key={p.id} value={p.external_product_id || p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Data de início</Label>
          <Input
            type="datetime-local"
            value={String(config.start_date || '')}
            onChange={e => updateField('start_date', e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">A partir de quando considerar transações (padrão: agora)</p>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={!!config.allow_reentry}
            onCheckedChange={v => updateField('allow_reentry', v)}
          />
          <Label>Permitir reentrada</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Se ativo, o lead pode reentrar na sequência toda vez que o status de entrada for recebido novamente
        </p>
      </div>
    );
  }

  if (subtype === 'sequence_lead') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Configure a sequência de lead. Controla o fluxo baseado no status do lead no CRM.
        </p>

        <div>
          <Label>Status de Entrada *</Label>
          <Select value={String(config.entry_status || '')} onValueChange={v => updateField('entry_status', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger>
            <SelectContent>
              {LEAD_STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Status de Saída *</Label>
          <Select value={String(config.exit_status || '')} onValueChange={v => updateField('exit_status', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger>
            <SelectContent>
              {LEAD_STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Data de início</Label>
          <Input type="datetime-local" value={String(config.start_date || '')} onChange={e => updateField('start_date', e.target.value)} />
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={!!config.allow_reentry} onCheckedChange={v => updateField('allow_reentry', v)} />
          <Label>Permitir reentrada</Label>
        </div>
      </div>
    );
  }

  if (subtype === 'sequence_rewarming') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Sequência de reaquecimento para leads inativos. O lead entra quando está inativo por X dias e sai ao engajar novamente.
        </p>

        <div>
          <Label>Dias de inatividade para entrada *</Label>
          <Input
            type="number"
            min={1}
            value={String(config.inactivity_days || 30)}
            onChange={e => updateField('inactivity_days', Number(e.target.value))}
          />
        </div>

        <div>
          <Label>Critério de saída</Label>
          <Select value={String(config.exit_criteria || 'any_interaction')} onValueChange={v => updateField('exit_criteria', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any_interaction">Qualquer interação</SelectItem>
              <SelectItem value="email_opened">Abriu e-mail</SelectItem>
              <SelectItem value="link_clicked">Clicou em link</SelectItem>
              <SelectItem value="whatsapp_reply">Respondeu WhatsApp</SelectItem>
              <SelectItem value="purchase">Realizou compra</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Máximo de tentativas</Label>
          <Input
            type="number"
            min={1}
            max={30}
            value={String(config.max_attempts || 5)}
            onChange={e => updateField('max_attempts', Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground mt-1">Após X tentativas sem resposta, o lead é marcado como frio</p>
        </div>
      </div>
    );
  }

  if (subtype === 'sequence_optin') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Sequência de Opt-in / Double Opt-in para confirmar interesse do lead.
        </p>

        <div>
          <Label>Tipo de Opt-in</Label>
          <Select value={String(config.optin_type || 'single')} onValueChange={v => updateField('optin_type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single Opt-in</SelectItem>
              <SelectItem value="double">Double Opt-in (confirmação)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Canal de confirmação</Label>
          <Select value={String(config.confirmation_channel || 'email')} onValueChange={v => updateField('confirmation_channel', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="email">E-mail</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Timeout (horas)</Label>
          <Input
            type="number"
            min={1}
            value={String(config.timeout_hours || 48)}
            onChange={e => updateField('timeout_hours', Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground mt-1">Tempo máximo para o lead confirmar o opt-in</p>
        </div>

        <div>
          <Label>Tag ao confirmar</Label>
          <Input
            placeholder="Ex: opt_in_confirmado"
            value={String(config.confirm_tag || '')}
            onChange={e => updateField('confirm_tag', e.target.value)}
          />
        </div>
      </div>
    );
  }

  return <p className="text-sm text-muted-foreground">Nenhuma configuração adicional.</p>;
}
