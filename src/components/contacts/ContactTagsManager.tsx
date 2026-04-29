import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTags, useCreateTag } from '@/hooks/useTags';
import { useContactTags, isDuplicateTagError, DUPLICATE_TAG_MESSAGE } from '@/hooks/useContactTags';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Plus, X, Tag as TagIcon, Check, Loader2, ArrowUpDown, Webhook, AlertCircle, CheckCircle2, Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface ContactTagsManagerProps {
  contactId: string;
}

type SortMode = 'name-asc' | 'color';
const SORT_STORAGE_KEY = 'contact-tags-sort';

function loadSort(): SortMode {
  try {
    const v = localStorage.getItem(SORT_STORAGE_KEY);
    return v === 'color' || v === 'name-asc' ? v : 'name-asc';
  } catch { return 'name-asc'; }
}

function sortTags<T extends { name: string; color: string | null }>(tags: T[], mode: SortMode): T[] {
  const arr = [...tags];
  if (mode === 'color') {
    arr.sort((a, b) => (a.color || 'zzz').localeCompare(b.color || 'zzz') || a.name.localeCompare(b.name));
  } else {
    arr.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
  }
  return arr;
}

/**
 * Subscribes to recent webhook_deliveries that target tag_added/tag_removed events
 * for the current org and reflects whether the most recent action was emitted.
 * Returns a status badge tied to a specific tagId so we can show per-action feedback.
 */
function useRecentTagWebhookStatus(orgId: string | null) {
  return useQuery({
    queryKey: ['tag-webhook-status', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('id, status, payload, last_status_code, completed_at, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []).filter((d: any) => {
        const ev = d.payload?.event;
        return ev === 'tag_added' || ev === 'tag_removed';
      });
    },
    enabled: !!orgId,
    refetchInterval: 4000,
  });
}

export function ContactTagsManager({ contactId }: ContactTagsManagerProps) {
  const queryClient = useQueryClient();
  const { data: allTags = [] } = useTags();
  const createTag = useCreateTag();
  const { data: contactTags = [], isLoading, addTag, removeTag } = useContactTags(contactId);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>(loadSort());
  const [orgId, setOrgId] = useState<string | null>(null);
  const [lastActionAt, setLastActionAt] = useState<number>(0);
  const [lastActionEvent, setLastActionEvent] = useState<'tag_added' | 'tag_removed' | null>(null);

  useEffect(() => {
    try { localStorage.setItem(SORT_STORAGE_KEY, sortMode); } catch {}
  }, [sortMode]);

  // Discover org via the contact (RLS already restricts).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('contacts').select('organization_id').eq('id', contactId).maybeSingle();
      if (!cancelled) setOrgId((data as any)?.organization_id ?? null);
    })();
    return () => { cancelled = true; };
  }, [contactId]);

  const { data: recentDeliveries = [] } = useRecentTagWebhookStatus(orgId);

  const sortedTags = useMemo(() => sortTags(contactTags, sortMode), [contactTags, sortMode]);
  const assignedIds = new Set(contactTags.map(t => t.id));
  const trimmed = search.trim();
  const exactMatch = allTags.find(t => t.name.toLowerCase() === trimmed.toLowerCase());

  // Find delivery state for the most recent action (post lastActionAt window)
  const matchingDelivery = useMemo(() => {
    if (!lastActionAt || !lastActionEvent) return null;
    const since = lastActionAt - 1000;
    return recentDeliveries
      .filter((d: any) => d.payload?.event === lastActionEvent && new Date(d.created_at).getTime() >= since)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null;
  }, [recentDeliveries, lastActionAt, lastActionEvent]);

  const handleAdd = async (tagId: string) => {
    if (assignedIds.has(tagId)) {
      toast.warning(DUPLICATE_TAG_MESSAGE);
      return;
    }
    try {
      await addTag.mutateAsync(tagId);
      toast.success('Tag adicionada — ação confirmada no banco.');
      setLastActionEvent('tag_added');
      setLastActionAt(Date.now());
    } catch (e: any) {
      // toast already triggered by hook
    }
  };

  const handleRemove = async (tagId: string) => {
    try {
      await removeTag.mutateAsync(tagId);
      toast.success('Tag removida — ação confirmada no banco.');
      setLastActionEvent('tag_removed');
      setLastActionAt(Date.now());
    } catch {}
  };

  const handleCreateAndAssign = async () => {
    if (!trimmed) return;
    try {
      const newTag = await createTag.mutateAsync({ name: trimmed });
      toast.success(`Tag "${newTag.name}" criada.`);
      await handleAdd(newTag.id);
      setSearch('');
    } catch {}
  };

  // Status renderer
  const renderWebhookStatus = () => {
    if (!lastActionEvent) return null;
    if (!matchingDelivery) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3 animate-pulse" />
          Aguardando emissão de webhook ({lastActionEvent})…
        </span>
      );
    }
    const status = matchingDelivery.status;
    if (status === 'success') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3" />
          Webhook {lastActionEvent} emitido (HTTP {matchingDelivery.last_status_code ?? '2xx'}).
        </span>
      );
    }
    if (status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] text-destructive">
          <AlertCircle className="h-3 w-3" />
          Falha ao emitir webhook {lastActionEvent} (HTTP {matchingDelivery.last_status_code ?? '?'}).
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <Webhook className="h-3 w-3" />
        Webhook {lastActionEvent} enfileirado (status: {status}).
      </span>
    );
  };

  const filteredAvailable = useMemo(() => {
    return sortTags(
      allTags.filter(t => t.name.toLowerCase().includes(trimmed.toLowerCase())),
      sortMode
    );
  }, [allTags, trimmed, sortMode]);

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TagIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Tags</span>
            <span className="text-xs text-muted-foreground">({contactTags.length})</span>
          </div>
          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
            <SelectTrigger className="h-7 w-[120px] text-[11px]">
              <ArrowUpDown className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc" className="text-xs">Nome (A-Z)</SelectItem>
              <SelectItem value="color" className="text-xs">Cor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-1.5 items-center">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : sortedTags.length === 0 ? (
            <span className="text-xs text-muted-foreground">Nenhuma tag</span>
          ) : (
            sortedTags.map(tag => (
              <Badge
                key={tag.id}
                variant="secondary"
                style={tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color, borderColor: tag.color } : undefined}
                className="gap-1 pr-1 border"
              >
                {tag.name}
                <button
                  type="button"
                  onClick={() => handleRemove(tag.id)}
                  disabled={removeTag.isPending}
                  className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5"
                  aria-label={`Remover tag ${tag.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                <Plus className="h-3 w-3 mr-1" /> Adicionar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Buscar ou criar tag..."
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandList>
                  <CommandEmpty>
                    {trimmed ? (
                      <button
                        type="button"
                        onClick={handleCreateAndAssign}
                        disabled={createTag.isPending || addTag.isPending}
                        className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm flex items-center gap-2"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Criar "{trimmed}"
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Nenhuma tag</span>
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredAvailable.map(tag => {
                      const isAssigned = assignedIds.has(tag.id);
                      return (
                        <Tooltip key={tag.id}>
                          <TooltipTrigger asChild>
                            <CommandItem
                              value={tag.name}
                              onSelect={() => {
                                if (isAssigned) handleRemove(tag.id);
                                else handleAdd(tag.id);
                              }}
                              className="flex items-center gap-2"
                            >
                              <span
                                className="h-2.5 w-2.5 rounded-full border"
                                style={{ backgroundColor: tag.color || 'transparent' }}
                              />
                              <span className="flex-1">{tag.name}</span>
                              {isAssigned && <Check className="h-3.5 w-3.5 text-primary" />}
                            </CommandItem>
                          </TooltipTrigger>
                          {isAssigned && (
                            <TooltipContent side="left">
                              Já aplicada — clique para remover
                            </TooltipContent>
                          )}
                        </Tooltip>
                      );
                    })}
                    {trimmed && !exactMatch && (
                      <CommandItem onSelect={handleCreateAndAssign} className="flex items-center gap-2">
                        <Plus className="h-3.5 w-3.5" />
                        <span>Criar "{trimmed}"</span>
                      </CommandItem>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {renderWebhookStatus()}
      </div>
    </TooltipProvider>
  );
}
