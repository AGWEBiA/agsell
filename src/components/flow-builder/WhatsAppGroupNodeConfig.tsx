import React, { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Info, Tag, Users, X, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TEMPLATE_VARIABLES } from './flowNodeTypes';
import { useTags } from '@/hooks/useTags';

interface WhatsAppGroupNodeConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function WhatsAppGroupNodeConfig({ config, onChange }: WhatsAppGroupNodeConfigProps) {
  const selectedTags = (config.target_tags as string[]) || [];
  const [searchQuery, setSearchQuery] = useState('');
  const { tags: orgTags = [] } = useTags();

  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return orgTags;
    const q = searchQuery.toLowerCase();
    return orgTags.filter(t => t.name.toLowerCase().includes(q));
  }, [orgTags, searchQuery]);

  const insertVariable = (key: string) => {
    const current = String(config.message || '');
    onChange({ ...config, message: current + key });
  };

  const toggleTag = (tagName: string) => {
    const lower = tagName.toLowerCase();
    if (selectedTags.includes(lower)) {
      onChange({ ...config, target_tags: selectedTags.filter(t => t !== lower) });
    } else {
      onChange({ ...config, target_tags: [...selectedTags, lower] });
    }
  };

  const addCustomTag = () => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed || selectedTags.includes(trimmed)) return;
    onChange({ ...config, target_tags: [...selectedTags, trimmed] });
    setSearchQuery('');
  };

  const removeTag = (tag: string) => {
    onChange({ ...config, target_tags: selectedTags.filter(t => t !== tag) });
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

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tags existentes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
            className="pl-9"
            onPointerDown={e => e.stopPropagation()}
          />
        </div>

        {/* Tag list from org */}
        {filteredTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto rounded-md border p-2">
            {filteredTags.map(tag => {
              const isSelected = selectedTags.includes(tag.name.toLowerCase());
              return (
                <Badge
                  key={tag.id}
                  variant={isSelected ? 'default' : 'outline'}
                  className="cursor-pointer text-xs gap-1 transition-colors"
                  onClick={() => toggleTag(tag.name)}
                >
                  <Tag className="h-3 w-3" />{tag.name}
                  {isSelected && <X className="h-3 w-3 ml-0.5" />}
                </Badge>
              );
            })}
          </div>
        )}

        {searchQuery.trim() && filteredTags.length === 0 && (
          <Button type="button" variant="outline" size="sm" onClick={addCustomTag} className="w-full text-xs gap-1">
            <Plus className="h-3 w-3" /> Criar tag "{searchQuery.trim()}"
          </Button>
        )}

        {/* Selected tags */}
        {selectedTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {selectedTags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs gap-1">
                <Tag className="h-3 w-3" />{tag}
                <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <span className="text-xs text-muted-foreground self-center ml-1">
              → {selectedTags.length} tag(s) = grupos com essas tags receberão a mensagem
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
