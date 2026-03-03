import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, AlertCircle } from 'lucide-react';
import { WEEKDAYS } from './flowNodeTypes';

interface TimerNodeConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function TimerNodeConfig({ config, onChange }: TimerNodeConfigProps) {
  const timerMode = String(config.timer_mode || 'continuous');
  const selectedDays = (config.selected_days as string[]) || WEEKDAYS.map(d => d.key);

  const toggleDay = (day: string) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day];
    onChange({ ...config, selected_days: newDays });
  };

  return (
    <div className="space-y-5">
      <Tabs value={timerMode} onValueChange={v => onChange({ ...config, timer_mode: v })}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="continuous">Tempo contínuo</TabsTrigger>
          <TabsTrigger value="specific_date">Data específica</TabsTrigger>
        </TabsList>

        <TabsContent value="continuous" className="space-y-4 mt-4">
          <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">Selecionar um tempo de espera?</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">O lead irá aguardar um determinado tempo para ser liberado pelo timer.</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="number"
                  min={1}
                  value={String(config.duration || 1)}
                  onChange={e => onChange({ ...config, duration: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="flex-1">
                <Select value={String(config.unit || 'minutes')} onValueChange={v => onChange({ ...config, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutos</SelectItem>
                    <SelectItem value="hours">Horas</SelectItem>
                    <SelectItem value="days">Dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="specific_date" className="space-y-4 mt-4">
          <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">Agendar a liberação para um momento específico?</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">O timer vai liberar os leads apenas na data e hora determinada.</p>
            <Input
              type="datetime-local"
              className={String(config.specific_date || '') && new Date(String(config.specific_date)) < new Date() ? 'border-destructive' : ''}
              value={String(config.specific_date || '')}
              onChange={e => onChange({ ...config, specific_date: e.target.value })}
            />
            {String(config.specific_date || '') && new Date(String(config.specific_date)) < new Date() && (
              <p className="text-xs text-destructive mt-1 font-medium">⚠ A data não pode ser anterior à data atual!</p>
            )}
            <div className="mt-3 rounded-md bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                Fuso horário: <span className="font-semibold text-foreground">SAO PAULO</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                O fuso horário selecionado será exibido como referência para que você possa ver os horários correspondentes.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
          <>
            <Input
              type="datetime-local"
              className={`mt-3 ${String(config.deadline_date || '') && new Date(String(config.deadline_date)) < new Date() ? 'border-destructive' : ''}`}
              value={String(config.deadline_date || '')}
              onChange={e => onChange({ ...config, deadline_date: e.target.value })}
            />
            {String(config.deadline_date || '') && new Date(String(config.deadline_date)) < new Date() && (
              <p className="text-xs text-destructive mt-1 font-medium">⚠ A data não pode ser anterior à data atual!</p>
            )}
          </>
        )}
      </div>

      {/* Time interval */}
      <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">Determinar um intervalo de tempo?</span>
          </div>
          <Switch
            checked={!!config.has_time_interval}
            onCheckedChange={v => onChange({ ...config, has_time_interval: v })}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">O timer vai liberar os leads entre os horários de início e fim.</p>
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

      {/* Weekday selection */}
      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Selecionar os dias da semana?</span>
          </div>
          <Switch
            checked={!!config.has_weekday_filter}
            onCheckedChange={v => onChange({ ...config, has_weekday_filter: v })}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Determine quais dias da semana o timer vai ser acionado, por padrão funciona todos os dias.</p>
        {config.has_weekday_filter && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {WEEKDAYS.map(day => (
              <Badge
                key={day.key}
                variant={selectedDays.includes(day.key) ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-1.5"
                onClick={() => toggleDay(day.key)}
              >
                {day.label}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
