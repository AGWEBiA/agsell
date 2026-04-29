import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ContactTag {
  id: string;
  name: string;
  color: string | null;
}

export const DUPLICATE_TAG_MESSAGE = 'Esta tag já está aplicada a este contato.';

/**
 * Returns true if the supabase error indicates a duplicate (contact_id, tag_id) row.
 * Postgres unique violation = code '23505'.
 */
export function isDuplicateTagError(error: any): boolean {
  if (!error) return false;
  const code = error.code || error?.cause?.code;
  if (code === '23505') return true;
  const msg = String(error.message || error.error_description || '').toLowerCase();
  return msg.includes('contact_tags_contact_id_tag_id_key') || msg.includes('duplicate key');
}

export function useContactTags(contactId: string | null | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['contact-tags', contactId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!contactId) return [];
      const { data, error } = await supabase
        .from('contact_tags')
        .select('tag_id, tags(id, name, color)')
        .eq('contact_id', contactId);
      if (error) throw error;
      return (data || []).map((r: any) => r.tags).filter(Boolean) as ContactTag[];
    },
    enabled: !!contactId,
  });

  const addTag = useMutation({
    mutationFn: async (tagId: string) => {
      if (!contactId) throw new Error('contactId required');
      // Client-side guard: never insert duplicates.
      const current = (query.data ?? []).map((t) => t.id);
      if (current.includes(tagId)) {
        const err: any = new Error(DUPLICATE_TAG_MESSAGE);
        err.code = '23505';
        throw err;
      }
      const { data, error } = await supabase
        .from('contact_tags')
        .insert({ contact_id: contactId, tag_id: tagId })
        .select('id, contact_id, tag_id, created_at')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (e: any) => {
      if (isDuplicateTagError(e)) {
        toast.warning(DUPLICATE_TAG_MESSAGE);
      } else {
        toast.error('Erro ao adicionar tag: ' + (e.message || 'desconhecido'));
      }
    },
  });

  const removeTag = useMutation({
    mutationFn: async (tagId: string) => {
      if (!contactId) throw new Error('contactId required');
      const { error } = await supabase
        .from('contact_tags')
        .delete()
        .eq('contact_id', contactId)
        .eq('tag_id', tagId);
      if (error) throw error;
      return tagId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (e: any) => {
      toast.error('Erro ao remover tag: ' + (e.message || 'desconhecido'));
    },
  });

  return { ...query, addTag, removeTag };
}

/**
 * Bulk apply tags to multiple contacts. Uses upsert with onConflict to avoid
 * duplicate-key errors and silently skip already-tagged pairs.
 */
export function useBulkApplyTags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contactIds, tagIds }: { contactIds: string[]; tagIds: string[] }) => {
      if (contactIds.length === 0 || tagIds.length === 0) return { inserted: 0, skipped: 0 };

      // Fetch existing pairs to compute skipped accurately for UI feedback.
      const { data: existing, error: existingErr } = await supabase
        .from('contact_tags')
        .select('contact_id, tag_id')
        .in('contact_id', contactIds)
        .in('tag_id', tagIds);
      if (existingErr) throw existingErr;
      const existingSet = new Set((existing || []).map((r: any) => `${r.contact_id}:${r.tag_id}`));

      const rows: Array<{ contact_id: string; tag_id: string }> = [];
      for (const c of contactIds) for (const t of tagIds) {
        if (!existingSet.has(`${c}:${t}`)) rows.push({ contact_id: c, tag_id: t });
      }
      if (rows.length === 0) return { inserted: 0, skipped: contactIds.length * tagIds.length };

      // Insert in chunks of 500
      let inserted = 0;
      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        const { error } = await supabase.from('contact_tags').insert(chunk);
        if (error) throw error;
        inserted += chunk.length;
      }
      return { inserted, skipped: contactIds.length * tagIds.length - inserted };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-tags'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (e: any) => toast.error('Erro ao aplicar tags em massa: ' + (e.message || 'desconhecido')),
  });
}
