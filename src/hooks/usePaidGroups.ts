import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export function usePaidGroupsConfig() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const configQuery = useQuery({
    queryKey: ['paid-groups-config', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('paid_groups_config')
        .select('*')
        .eq('organization_id', orgId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const upsertConfig = useMutation({
    mutationFn: async (values: { evolution_api_url: string; evolution_api_key: string; is_active: boolean }) => {
      const { error } = await supabase.from('paid_groups_config').upsert({
        organization_id: orgId!,
        ...values,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'organization_id' });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['paid-groups-config'] }); toast.success('Configuração salva!'); },
    onError: (e: any) => toast.error(e.message),
  });

  return { config: configQuery.data, isLoading: configQuery.isLoading, upsertConfig };
}

export function usePaidGroups() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const groupsQuery = useQuery({
    queryKey: ['paid-groups', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('paid_groups').select('*').eq('organization_id', orgId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const createGroup = useMutation({
    mutationFn: async (values: { name: string; group_jid: string; instance_name: string }) => {
      const { error } = await supabase.from('paid_groups').insert({ organization_id: orgId!, ...values });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['paid-groups'] }); toast.success('Grupo criado!'); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('paid_groups').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['paid-groups'] }); toast.success('Grupo removido!'); },
    onError: (e: any) => toast.error(e.message),
  });

  return { groups: groupsQuery.data ?? [], isLoading: groupsQuery.isLoading, createGroup, deleteGroup };
}

export function usePaidGroupProducts() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const productsQuery = useQuery({
    queryKey: ['paid-group-products', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('paid_group_products').select('*').eq('organization_id', orgId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const createProduct = useMutation({
    mutationFn: async (values: { name: string; description?: string; price?: number; currency?: string; billing_cycle?: string; gateway_mappings?: Record<string, string[]> }) => {
      const { error } = await supabase.from('paid_group_products').insert({ organization_id: orgId!, ...values });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['paid-group-products'] }); toast.success('Produto criado!'); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...values }: { id: string; name?: string; description?: string; price?: number; gateway_mappings?: Record<string, string[]>; is_active?: boolean }) => {
      const { error } = await supabase.from('paid_group_products').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['paid-group-products'] }); toast.success('Produto atualizado!'); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('paid_group_products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['paid-group-products'] }); toast.success('Produto removido!'); },
    onError: (e: any) => toast.error(e.message),
  });

  return { products: productsQuery.data ?? [], isLoading: productsQuery.isLoading, createProduct, updateProduct, deleteProduct };
}

export function usePaidGroupProductLinks() {
  const queryClient = useQueryClient();

  const linksQuery = (productId: string) => useQuery({
    queryKey: ['paid-group-product-links', productId],
    queryFn: async () => {
      const { data, error } = await supabase.from('paid_group_product_links').select('*').eq('product_id', productId);
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const linkGroup = useMutation({
    mutationFn: async ({ product_id, group_id }: { product_id: string; group_id: string }) => {
      const { error } = await supabase.from('paid_group_product_links').insert({ product_id, group_id });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['paid-group-product-links'] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const unlinkGroup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('paid_group_product_links').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['paid-group-product-links'] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return { linksQuery, linkGroup, unlinkGroup };
}

export function usePaidGroupMembers() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ['paid-group-members', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('paid_group_members').select('*').eq('organization_id', orgId!).order('added_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('paid_group_members').update({ status: 'removed', removed_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['paid-group-members'] }); toast.success('Membro removido!'); },
    onError: (e: any) => toast.error(e.message),
  });

  return { members: membersQuery.data ?? [], isLoading: membersQuery.isLoading, removeMember };
}
