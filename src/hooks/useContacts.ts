import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface Contact {
  id: string;
  user_id: string;
  company_id: string | null;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  position: string | null;
  source: string | null;
  status: string | null;
  lead_score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  company?: Company | null;
}

export interface Company {
  id: string;
  name: string;
}

export interface CreateContactData {
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  position?: string;
  source?: string;
  status?: string;
  notes?: string;
  company_id?: string;
}

const CONTACTS_PAGE_SIZE = 1000;

async function fetchAllContacts(): Promise<Contact[]> {
  let from = 0;
  const allContacts: Contact[] = [];

  while (true) {
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        company:companies(id, name)
      `)
      .order('created_at', { ascending: false })
      .range(from, from + CONTACTS_PAGE_SIZE - 1);

    if (error) throw error;

    const batch = (data || []) as Contact[];
    allContacts.push(...batch);

    if (batch.length < CONTACTS_PAGE_SIZE) break;
    from += CONTACTS_PAGE_SIZE;
  }

  return allContacts;
}

export function useContacts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contacts', user?.id],
    queryFn: fetchAllContacts,
    enabled: !!user,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (data: CreateContactData) => {
      const { data: result, error } = await supabase
        .from('contacts')
        .insert({
          ...data,
          user_id: user!.id,
          organization_id: currentOrganization?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contato criado com sucesso!');
      // Fire automation trigger
      try {
        const { data: automations } = await supabase
          .from('automations')
          .select('id')
          .eq('organization_id', currentOrganization?.id ?? '')
          .eq('trigger_type', 'contact_created')
          .eq('is_active', true);
        if (automations?.length) {
          await Promise.allSettled(
            automations.map((a) =>
              supabase.functions.invoke('process-automation', {
                body: { automation_id: a.id, contact_id: result.id, trigger_event: 'contact_created' },
              })
            )
          );
        }
      } catch {}
    },
    onError: (error) => {
      toast.error('Erro ao criar contato: ' + error.message);
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Contact> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('contacts')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contato atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar contato: ' + error.message);
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contato excluído!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir contato: ' + error.message);
    },
  });
}
