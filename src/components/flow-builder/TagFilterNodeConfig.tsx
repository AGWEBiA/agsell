import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, X } from 'lucide-react';
import { useTags } from '@/hooks/useTags';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TagFilterNodeConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function TagFilterNodeConfig({ config, onChange }: TagFilterNodeConfigProps) {
  const { data: tags = [], refetch } = useTags();
  const entryTags = (config.entry_tags as string[]) || [];
  const blockTags = (config.block_tags as string[]) || [];
  const [newEntryTag, setNewEntryTag] = useState('');
  const [newBlockTag, setNewBlockTag] = useState('');
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showNewBlock, setShowNewBlock] = useState(false);

  const addEntryTag = (tagName: string) => {
    if (tagName && !entryTags.includes(tagName)) {
      onChange({ ...config, entry_tags: [...entryTags, tagName] });
    }
  };

  const removeEntryTag = (tagName: string) => {
    onChange({ ...config, entry_tags: entryTags.filter(t => t !== tagName) });
  };

  const addBlockTag = (tagName: string) => {
    if (tagName && !blockTags.includes(tagName)) {
      onChange({ ...config, block_tags: [...blockTags, tagName] });
    }
  };

  const removeBlockTag = (tagName: string) => {
    onChange({ ...config, block_tags: blockTags.filter(t => t !== tagName) });
  };

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
      <div className="space-y-3">
        <div>
          <Label className="font-semibold">Tag(s) de entrada dos leads</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Para o lead entrar nesta tag, o mesmo deve possuir TODAS as tags abaixo, simultaneamente.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 min-h-[32px]">
          {entryTags.map(tag => (
            <Badge key={tag} variant="default" className="gap-1">
              {tag}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeEntryTag(tag)} />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Select value="" onValueChange={v => addEntryTag(v)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione uma tag" />
            </SelectTrigger>
            <SelectContent>
              {tags.filter(t => !entryTags.includes(t.name)).map(t => (
                <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
              ))}
              {tags.filter(t => !entryTags.includes(t.name)).length === 0 && (
                <p className="text-xs text-muted-foreground p-2 text-center">Nenhuma tag disponível</p>
              )}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setShowNewEntry(!showNewEntry)} title="Criar nova tag">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {showNewEntry && (
          <div className="flex gap-2">
            <Input
              placeholder="Nome da nova tag"
              value={newEntryTag}
              onChange={e => setNewEntryTag(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newEntryTag.trim()) {
                  addEntryTag(newEntryTag.trim());
                  setNewEntryTag('');
                  setShowNewEntry(false);
                }
              }}
            />
            <Button size="sm" onClick={() => {
              if (newEntryTag.trim()) {
                addEntryTag(newEntryTag.trim());
                setNewEntryTag('');
                setShowNewEntry(false);
              }
            }}>Adicionar</Button>
          </div>
        )}
      </div>

      {/* Block tags */}
      <div className="space-y-3">
        <div>
          <Label className="font-semibold">Tag(s) que impossibilitam a entrada dos leads</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Se o lead possuir TODAS as tags abaixo, ele não entrará nesta etapa.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 min-h-[32px]">
          {blockTags.map(tag => (
            <Badge key={tag} variant="destructive" className="gap-1">
              {tag}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeBlockTag(tag)} />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Select value="" onValueChange={v => addBlockTag(v)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione uma tag" />
            </SelectTrigger>
            <SelectContent>
              {tags.filter(t => !blockTags.includes(t.name)).map(t => (
                <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
              ))}
              {tags.filter(t => !blockTags.includes(t.name)).length === 0 && (
                <p className="text-xs text-muted-foreground p-2 text-center">Nenhuma tag disponível</p>
              )}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setShowNewBlock(!showNewBlock)} title="Criar nova tag">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {showNewBlock && (
          <div className="flex gap-2">
            <Input
              placeholder="Nome da nova tag"
              value={newBlockTag}
              onChange={e => setNewBlockTag(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newBlockTag.trim()) {
                  addBlockTag(newBlockTag.trim());
                  setNewBlockTag('');
                  setShowNewBlock(false);
                }
              }}
            />
            <Button size="sm" onClick={() => {
              if (newBlockTag.trim()) {
                addBlockTag(newBlockTag.trim());
                setNewBlockTag('');
                setShowNewBlock(false);
              }
            }}>Adicionar</Button>
          </div>
        )}
      </div>
    </div>
  );
}
