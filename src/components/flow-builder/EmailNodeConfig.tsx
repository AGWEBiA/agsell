import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Info, Clock, AlertCircle, Mail, ChevronDown, Shield, Flame, ExternalLink, Eye } from 'lucide-react';
import { TEMPLATE_VARIABLES } from './flowNodeTypes';
import { useEmailMailboxes } from '@/hooks/useEmailMailboxes';
import { useNavigate } from 'react-router-dom';

interface EmailNodeConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  mode: 'marketing' | 'performance';
}

const BEST_TIMES = [
  { day: 'Terça-feira', time: '10:00 - 11:00', score: '⭐⭐⭐⭐⭐' },
  { day: 'Quarta-feira', time: '10:00 - 11:00', score: '⭐⭐⭐⭐⭐' },
  { day: 'Quinta-feira', time: '09:00 - 10:00', score: '⭐⭐⭐⭐' },
  { day: 'Terça-feira', time: '14:00 - 15:00', score: '⭐⭐⭐⭐' },
  { day: 'Segunda-feira', time: '10:00 - 11:00', score: '⭐⭐⭐' },
  { day: 'Quarta-feira', time: '14:00 - 15:00', score: '⭐⭐⭐' },
  { day: 'Quinta-feira', time: '14:00 - 16:00', score: '⭐⭐⭐' },
  { day: 'Sexta-feira', time: '09:00 - 10:00', score: '⭐⭐' },
  { day: 'Sábado', time: '10:00 - 12:00', score: '⭐⭐' },
  { day: 'Domingo', time: '18:00 - 20:00', score: '⭐' },
];

function SpamScoreGauge({ score }: { score: number }) {
  const getColor = () => {
    if (score <= 4) return 'text-green-500';
    if (score <= 9) return 'text-yellow-500';
    return 'text-red-500';
  };
  const getLabel = () => {
    if (score <= 4) return 'Baixa';
    if (score <= 9) return 'Média';
    return 'Alta';
  };

  return (
    <div className="rounded-lg border p-4 flex items-center gap-4">
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${(score / 20) * 100}, 100`}
            className={getColor()}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${getColor()}`}>
          {score}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold">Análise de score de e-mail</p>
        <p className="text-xs text-muted-foreground">Probabilidade de um e-mail ser classificado como spam.</p>
        <div className="flex gap-3 mt-1 text-xs">
          <span className="text-green-500">● 1-4 baixa</span>
          <span className="text-yellow-500">● 5-9 média</span>
          <span className="text-red-500">● 10-20 alta</span>
        </div>
      </div>
    </div>
  );
}

export function EmailNodeConfig({ config, onChange, mode }: EmailNodeConfigProps) {
  const { allMailboxes } = useEmailMailboxes();
  const [bestTimesOpen, setBestTimesOpen] = useState(false);
  const navigate = useNavigate();

  const insertVariable = (key: string) => {
    const current = String(config.message || '');
    onChange({ ...config, message: current + key });
  };

  const estimateSpamScore = (): number => {
    const msg = String(config.message || '');
    const subject = String(config.subject || '');
    const combined = msg + ' ' + subject;
    let score = 0;
    if (combined.match(/grátis|free|ganhe|desconto/i)) score += 2;
    if (combined.match(/!!+/)) score += 1;
    if (combined.match(/TUDO EM MAIÚSCULO/)) score += 2;
    if (combined.match(/clique aqui|click here/i)) score += 1;
    if (combined.length < 20) score += 1;
    if (!config.mailbox_id) score += 1;
    return Math.min(score, 20);
  };

  const selectedMailbox = allMailboxes.find((m: any) => m.id === config.mailbox_id);

  return (
    <div className="space-y-5">
      {/* Mailbox selector */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Caixa postal
        </Label>
        <p className="text-xs text-muted-foreground">
          O campo abaixo será responsável pelo endereço da caixa postal que irá enviar o e-mail para os leads. O domínio precisa estar ativo/verificado.
        </p>
        <Select
          value={String(config.mailbox_id || '')}
          onValueChange={v => {
            const mailbox = allMailboxes.find((m: any) => m.id === v);
            onChange({
              ...config,
              mailbox_id: v,
              mailbox_name: mailbox ? `${mailbox.name} - ${mailbox.from_email}` : '',
              from_email: mailbox?.from_email || '',
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma caixa postal" />
          </SelectTrigger>
          <SelectContent>
            {allMailboxes.length === 0 ? (
              <SelectItem value="_none" disabled>Nenhuma caixa postal configurada</SelectItem>
            ) : (
              allMailboxes.map((m: any) => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex items-center gap-2">
                    <span>{m.name} - {m.from_email}</span>
                    {m.warmup_status === 'warming' && <Flame className="h-3 w-3 text-orange-500" />}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {/* Manage Mailboxes Button */}
        <Button
          variant="default"
          size="sm"
          className="w-full bg-primary hover:bg-primary/90"
          onClick={() => navigate('/email-domain')}
        >
          <Mail className="h-4 w-4 mr-2" />
          GERENCIAR CAIXAS POSTAIS
        </Button>
      </div>

      {/* Subject (marketing only) */}
      {mode === 'marketing' && (
        <div className="space-y-2">
          <Label>Assunto do e-mail</Label>
          <p className="text-xs text-muted-foreground">
            O campo abaixo se refere ao assunto do e-mail que o lead receberá no seu e-mail.
          </p>
          <Input
            placeholder="Ex: Oferta especial para você, {{primeiro_nome}}!"
            value={String(config.subject || '')}
            onChange={e => onChange({ ...config, subject: e.target.value })}
          />
        </div>
      )}

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

      {/* Message */}
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
        {mode === 'performance' && (
          <p className="text-xs text-muted-foreground">
            💡 Email Performance envia e-mails com pouco HTML, facilitando que caiam na caixa de entrada ao invés de spam.
          </p>
        )}
      </div>

      {/* Best times collapsible */}
      <Collapsible open={bestTimesOpen} onOpenChange={setBestTimesOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full p-3 rounded-lg border hover:bg-accent/50 transition-colors">
            <span className="text-sm font-medium">Top 10 Melhores Dias e Horários para Envio de E-mails</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${bestTimesOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 rounded-lg border divide-y">
            {BEST_TIMES.map((t, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 text-xs">
                <span className="font-medium">{i + 1}. {t.day}</span>
                <span className="text-muted-foreground">{t.time}</span>
                <span>{t.score}</span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Spam Score */}
      <div className="space-y-2">
        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange({ ...config, _spam_checked: true })}
          >
            <Shield className="h-4 w-4 mr-1" />
            TESTE DE SCORE
          </Button>
        </div>
        {config._spam_checked && (
          <SpamScoreGauge score={estimateSpamScore()} />
        )}
      </div>

      {/* Edit Email Button (marketing) */}
      {mode === 'marketing' && (
        <Button
          variant="default"
          className="w-full bg-primary hover:bg-primary/90"
          onClick={() => onChange({ ...config, _editing_template: true })}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          CLIQUE AQUI PARA EDITAR SEU E-MAIL
        </Button>
      )}

      {/* Email Preview */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Preview do E-mail:
        </Label>
        <div className="rounded-lg border bg-background p-4 min-h-[120px]">
          {config.subject || config.message ? (
            <div className="space-y-3">
              {selectedMailbox && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground border-b pb-2">
                  <Mail className="h-3 w-3" />
                  <span>De: {selectedMailbox.name} &lt;{(selectedMailbox as any).from_email || `${selectedMailbox.prefix}@`}&gt;</span>
                </div>
              )}
              {config.subject && (
                <p className="text-sm font-semibold">{String(config.subject)}</p>
              )}
              {config.message && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{String(config.message)}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Preencha os campos acima para visualizar o preview do e-mail.
            </p>
          )}
        </div>
      </div>

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
