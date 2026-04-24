import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Info, Clock, AlertCircle } from 'lucide-react';
import { TEMPLATE_VARIABLES } from './flowNodeTypes';
import { WhatsAppInteractiveConfig } from './WhatsAppInteractiveConfig';

interface WhatsAppNodeConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function WhatsAppNodeConfig({ config, onChange }: WhatsAppNodeConfigProps) {
  const insertVariable = (key: string) => {
    const current = String(config.message || '');
    onChange({ ...config, message: current + key });
  };

  return (
    <div className="space-y-5">
      {/* Variables hint */}
      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Escritas Automáticas</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Na sua mensagem você pode utilizar os seguintes textos automáticos para usar as informações dos leads como preenchimento automático.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_VARIABLES.map(v => (
            <Badge
              key={v.key}
              variant="secondary"
              className="cursor-pointer hover:bg-primary/20 transition-colors text-xs"
              onClick={() => insertVariable(v.key)}
            >
              {v.key}
            </Badge>
          ))}
        </div>
      </div>

      {/* Message (hidden for presence kind) */}
      {config.message_kind !== 'presence' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Mensagem</Label>
            <span className="text-xs text-muted-foreground">
              {String(config.message || '').length}/500
            </span>
          </div>
          <Textarea
            placeholder="Digite aqui.."
            rows={5}
            maxLength={500}
            value={String(config.message || '')}
            onChange={e => onChange({ ...config, message: e.target.value })}
          />
        </div>
      )}

      {/* Phase 1: interactive message kinds (buttons / list / presence) */}
      <WhatsAppInteractiveConfig config={config} onChange={onChange} />

      {/* Schedule deadline */}
      <div className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Agendar data e hora limite?</span>
          </div>
          <Switch
            checked={!!config.has_deadline}
            onCheckedChange={v => onChange({ ...config, has_deadline: v })}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">A etapa vai enviar as mensagens aos leads até uma data e hora determinada.</p>
        {config.has_deadline && (
          <Input
            type="datetime-local"
            className="mt-3"
            value={String(config.deadline_date || '')}
            onChange={e => onChange({ ...config, deadline_date: e.target.value })}
          />
        )}
      </div>

      {/* Time interval */}
      <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-violet-600" />
            <span className="text-sm font-medium text-violet-700 dark:text-violet-400">Agendar um intervalo de tempo?</span>
          </div>
          <Switch
            checked={!!config.has_time_interval}
            onCheckedChange={v => onChange({ ...config, has_time_interval: v })}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">A etapa vai enviar as mensagens aos leads somente no intervalo de tempo definido abaixo.</p>
        {config.has_time_interval && (
          <div className="flex gap-3 mt-3">
            <Input
              type="time"
              value={String(config.interval_start || '08:00')}
              onChange={e => onChange({ ...config, interval_start: e.target.value })}
            />
            <Input
              type="time"
              value={String(config.interval_end || '22:00')}
              onChange={e => onChange({ ...config, interval_end: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
