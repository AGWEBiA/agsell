import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

type SupabaseTable = 'contacts' | 'companies' | 'deals' | 'tasks' | 'tags' | 'forms' | 'automations' | 'conversations';

interface UseCrudOptions<T> {
  table: SupabaseTable;
  queryKey: string;
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  filterByUser?: boolean;
  filterByOrg?: boolean;
  pageSize?: number;
  staleTime?: number;
  toastMessages?: {
    createSuccess?: string;
    updateSuccess?: string;
    deleteSuccess?: string;
  };
  transform?: (data: any[]) => T[];
}

export function useCrud<T extends { id: string }>({
  table,
  queryKey,
  select = '*',
  orderBy = { column: 'created_at', ascending: false },
  filterByUser = true,
  filterByOrg = true,
  pageSize,
  staleTime = 2 * 60 * 1000,
  toastMessages,
  transform,
}: UseCrudOptions<T>) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const qc = useQueryClient();

  const fullKey = [queryKey, user?.id, currentOrganization?.id];

  const query = useQuery({
    queryKey: fullKey,
    queryFn: async () => {
      if (!user?.id) return [] as T[];
      let q = supabase.from(table).select(select).order(orderBy.column, { ascending: orderBy.ascending ?? false });
      
      if (filterByUser) q = q.eq('user_id', user.id);
      if (filterByOrg && currentOrganization?.id) q = q.eq('organization_id', currentOrganization.id);
      if (pageSize) q = q.limit(pageSize);

      const { data, error } = await q;
      if (error) throw error;
      return (transform ? transform(data || []) : data || []) as T[];
    },
    enabled: !!user?.id,
    staleTime,
    gcTime: staleTime * 5,
  });

  const createMutation = useMutation({
    mutationFn: async (item: Omit<any, 'id' | 'user_id' | 'organization_id'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from(table)
        .insert({
          ...item,
          user_id: filterByUser ? user.id : undefined,
          organization_id: filterByOrg ? currentOrganization?.id || null : undefined,
        })
        .select()
        .single();
      if (error) throw error;
      return data as T;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fullKey });
      if (toastMessages?.createSuccess) toast.success(toastMessages.createSuccess);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<T>) => {
      const { data, error } = await supabase
        .from(table)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as T;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fullKey });
      if (toastMessages?.updateSuccess) toast.success(toastMessages.updateSuccess);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fullKey });
      if (toastMessages?.deleteSuccess) toast.success(toastMessages.deleteSuccess);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    create: createMutation,
    update: updateMutation,
    remove: deleteMutation,
  };
}
