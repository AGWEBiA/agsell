import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

export function useInbox() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const conversationsQuery = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          contacts (
            id, first_name, last_name, email, phone, whatsapp, lead_score
          ),
          messages (
            id, content, sender_type, is_read, created_at,
            message_type, media_url, media_mime_type, file_name
          )
        `)
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false })
        .order('created_at', { referencedTable: 'messages', ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user?.id,
  });

  // Realtime
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('inbox-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' },
        () => { queryClient.invalidateQueries({ queryKey: ['conversations'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' },
        () => { queryClient.invalidateQueries({ queryKey: ['conversations'] }); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const createConversation = useMutation({
    mutationFn: async (conversation: { contact_id: string; channel: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          ...conversation,
          user_id: user.id,
          organization_id: currentOrganization?.id || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
    onError: (e) => toast.error('Erro ao criar conversa: ' + e.message),
  });

  const sendMessage = useMutation({
    mutationFn: async (message: any) => {
      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();
      if (error) throw error;

      // Update conversation + track first response
      const conv = conversationsQuery.data?.find(c => c.id === message.conversation_id);
      const updates: Record<string, any> = {
        last_message_at: new Date().toISOString(),
      };

      // Track first_response_at
      if (message.sender_type === 'user' && conv && !conv.first_response_at) {
        updates.first_response_at = new Date().toISOString();
      }

      // WhatsApp metadata
      const contactPhone = conv?.contacts?.whatsapp || conv?.contacts?.phone;
      const cleanPhone = contactPhone ? contactPhone.replace(/\D/g, '') : null;
      const existingMeta = (conv?.metadata as Record<string, string> | null) || {};
      if (conv?.channel === 'whatsapp' && cleanPhone) {
        updates.metadata = { ...existingMeta, whatsapp_sender_id: cleanPhone };
      }

      await supabase.from('conversations').update(updates).eq('id', message.conversation_id);

      // Send via WhatsApp if applicable
      if (conv?.channel === 'whatsapp' && contactPhone) {
        try {
          const { data: r, error: we } = await supabase.functions.invoke('send-whatsapp', {
            body: {
              organization_id: currentOrganization?.id,
              to: contactPhone,
              message: message.content,
            },
          });
          if (we) toast.error('Mensagem salva, mas falhou ao enviar via WhatsApp');
          else if (r?.error) toast.error(`Erro WhatsApp: ${r.error}`);
        } catch {
          toast.error('Falha ao enviar mensagem via WhatsApp');
        }
      }

      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
    onError: (e) => toast.error('Erro ao enviar mensagem: ' + e.message),
  });

  const markAsRead = useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  const updateConversation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, any>) => {
      const { data, error } = await supabase
        .from('conversations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Ticket atualizado!');
    },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  return {
    conversations: conversationsQuery.data ?? [],
    isLoading: conversationsQuery.isLoading,
    error: conversationsQuery.error,
    createConversation,
    sendMessage,
    markAsRead,
    updateConversation,
  };
}
