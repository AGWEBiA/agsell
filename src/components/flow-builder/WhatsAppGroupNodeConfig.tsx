import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Info, Tag, Users, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TEMPLATE_VARIABLES } from './flowNodeTypes';

interface WhatsAppGroupNodeConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function WhatsAppGroupNodeConfig({ config, onChange }: WhatsAppGroupNodeConfigProps) {
  const tags = (config.target_tags as string[]) || [];
  const tagInput = String(config._tag_input || '');

  const insertVariable = (key: string) => {
    const current = String(config.message || '');
    onChange({ ...config, message: current + key });
  };

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed)) { onChange({ ...config, _tag_input: '' }); return; }
    onChange({ ...config, target_tags: [...tags, trimmed], _tag_input: '' });
  };

  const removeTag = (tag: string) => {
    onChange({ ...config, target_tags: tags.filter(t => t !== tag) });
  };

  return (
    <div className="space-y-5">
      {/* Info */}
      <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">Envio para Grupos por Tag</span>
        </div>
        <p className="text-xs text-muted-foreground">
          A mensagem será enviada para todos os grupos de WhatsApp que possuem as tags selecionadas abaixo. Configure as tags dos grupos na aba Grupos do WhatsApp.
        </p>
      </div>

      {/* Target Tags */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Tag className="h-4 w-4" /> Tags dos Grupos Alvo
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="Digite uma tag e pressione Enter..."
            value={tagInput}
            onChange={e => onChange({ ...config, _tag_input: e.target.value })}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            className="flex-1"
          />
          <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={!tagInput.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs gap-1">
                <Tag className="h-3 w-3" />{tag}
                <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <span className="text-xs text-muted-foreground self-center ml-1">
              → {tags.length} tag(s) = grupos com essas tags receberão a mensagem
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Adicione ao menos uma tag para selecionar os grupos alvo</p>
        )}
      </div>

      {/* Variables hint */}
      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Variáveis Disponíveis</span>
        </div>
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
          <Label>Mensagem para os Grupos</Label>
          <span className="text-xs text-muted-foreground">
            {String(config.message || '').length}/500
          </span>
        </div>
        <Textarea
          placeholder="Digite a mensagem que será enviada nos grupos..."
          rows={5}
          maxLength={500}
          value={String(config.message || '')}
          onChange={e => onChange({ ...config, message: e.target.value })}
        />
      </div>
    </div>
  );
}
