import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, X, Plus, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useTags, useCreateTag } from '@/hooks/useTags';
import { cn } from '@/lib/utils';

interface SearchableTagSelectProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
}

export function SearchableTagSelect({ selectedTags, onTagsChange, placeholder = 'Buscar ou criar tag...', label }: SearchableTagSelectProps) {
  const { data: allTags = [] } = useTags();
  const createTag = useCreateTag();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, []);

  const filteredTags = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allTags;
    return allTags.filter(t => t.name.toLowerCase().includes(q));
  }, [allTags, search]);

  const isExactMatch = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? allTags.some(t => t.name.toLowerCase() === q) : false;
  }, [allTags, search]);

  const addTag = (name: string) => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed || selectedTags.includes(trimmed)) return;
    onTagsChange([...selectedTags, trimmed]);
    setSearch('');
  };

  const removeTag = (name: string) => {
    onTagsChange(selectedTags.filter(t => t !== name));
  };

  const handleCreateAndAdd = async () => {
    const trimmed = search.trim().toLowerCase();
    if (!trimmed || selectedTags.includes(trimmed)) return;
    try {
      await createTag.mutateAsync({ name: trimmed });
    } catch {
      // Tag might already exist, that's fine
    }
    addTag(trimmed);
  };

  return (
    <div ref={containerRef} className="relative space-y-2">
      {/* Selected tags + input */}
      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 min-h-[40px] rounded-md border bg-background px-3 py-2 cursor-text transition-colors',
          isOpen ? 'ring-2 ring-ring border-input' : 'border-input'
        )}
        onClick={() => { setIsOpen(true); }}
      >
        {selectedTags.map(tag => (
          <Badge key={tag} variant="secondary" className="text-xs gap-1 shrink-0">
            <Tag className="h-3 w-3" />{tag}
            <button
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="ml-0.5 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder={selectedTags.length === 0 ? placeholder : 'Adicionar mais...'}
          value={search}
          onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onMouseDown={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (search.trim()) {
                const existing = filteredTags.find(t => t.name.toLowerCase() === search.trim().toLowerCase());
                if (existing) addTag(existing.name);
                else handleCreateAndAdd();
              }
            }
            if (e.key === 'Backspace' && !search && selectedTags.length > 0) {
              removeTag(selectedTags[selectedTags.length - 1]);
            }
          }}
        />
        <button
          type="button"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover shadow-md max-h-[200px] overflow-y-auto">
          {filteredTags.length === 0 && !search.trim() && (
            <div className="p-3 text-center text-xs text-muted-foreground">
              Nenhuma tag cadastrada. Digite para criar.
            </div>
          )}
          {filteredTags.map(tag => {
            const isSelected = selectedTags.includes(tag.name);
            return (
              <button
                key={tag.id}
                type="button"
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors',
                  isSelected && 'opacity-50'
                )}
                disabled={isSelected}
                onClick={() => addTag(tag.name)}
              >
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color || 'hsl(var(--primary))' }}
                />
                <span className="font-medium">{tag.name}</span>
              </button>
            );
          })}
          {search.trim() && !isExactMatch && (
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-accent transition-colors border-t"
              onClick={handleCreateAndAdd}
            >
              <Plus className="h-4 w-4 text-primary" />
              <span>Criar tag "<span className="font-semibold">{search.trim()}</span>"</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
