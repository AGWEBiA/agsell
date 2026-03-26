import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { AlertCircle } from 'lucide-react';
import { SearchableTagSelect } from '@/components/whatsapp/SearchableTagSelect';

interface TagFilterNodeConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function TagFilterNodeConfig({ config, onChange }: TagFilterNodeConfigProps) {
  const entryTags = (config.entry_tags as string[]) || [];
  const blockTags = (config.block_tags as string[]) || [];

  const deadlineDate = String(config.deadline_date || '');
  const isDeadlinePast = deadlineDate && new Date(deadlineDate) < new Date();

  return (
    <div className="space-y-5">
      {/* Deadline */}
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
        <p className="text-xs text-muted-foreground mt-1">A etapa vai liberar os leads até uma data e hora determinada.</p>
        {config.has_deadline && (
          <>
            <Input
              type="datetime-local"
              className={`mt-3 ${isDeadlinePast ? 'border-destructive' : ''}`}
              value={deadlineDate}
              onChange={e => onChange({ ...config, deadline_date: e.target.value })}
            />
            {isDeadlinePast && (
              <p className="text-xs text-destructive mt-1 font-medium">⚠ A data não pode ser anterior à data atual!</p>
            )}
          </>
        )}
      </div>

      {/* Entry tags */}
      <div className="space-y-2">
        <div>
          <Label className="font-semibold">Tag(s) de entrada dos leads</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Para o lead entrar nesta tag, o mesmo deve possuir TODAS as tags abaixo, simultaneamente.
          </p>
        </div>
        <SearchableTagSelect
          selectedTags={entryTags}
          onTagsChange={tags => onChange({ ...config, entry_tags: tags })}
          placeholder="Buscar ou criar tag de entrada..."
        />
      </div>

      {/* Block tags */}
      <div className="space-y-2">
        <div>
          <Label className="font-semibold">Tag(s) que impossibilitam a entrada dos leads</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Se o lead possuir TODAS as tags abaixo, ele não entrará nesta etapa.
          </p>
        </div>
        <SearchableTagSelect
          selectedTags={blockTags}
          onTagsChange={tags => onChange({ ...config, block_tags: tags })}
          placeholder="Buscar ou criar tag de bloqueio..."
        />
      </div>
    </div>
  );
}
