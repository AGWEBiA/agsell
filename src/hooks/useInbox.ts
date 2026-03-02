import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { useEffect } from 'react';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type Conversation = Tables<'conversations'>;
type Message = Tables<'messages'>;
type ConversationInsert = TablesInsert<'conversations'>;
type MessageInsert = TablesInsert<'messages'>;

type ConversationWithContact = Conversation & {
  contacts: {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    lead_score: number | null;
  } | null;
  messages: Message[];
};

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
            id,
            first_name,
            last_name,
            email,
            phone,
            whatsapp,
            lead_score
          ),
          messages (
            id,
            content,
            sender_type,
            is_read,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });
      
      if (error) throw error;
      return data as ConversationWithContact[];
    },
    enabled: !!user?.id,
  });

  // Realtime subscription for new messages and conversation updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('inbox-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => { queryClient.invalidateQueries({ queryKey: ['conversations'] }); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => { queryClient.invalidateQueries({ queryKey: ['conversations'] }); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const createConversation = useMutation({
    mutationFn: async (conversation: Omit<ConversationInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('conversations')
        .insert({ ...conversation, user_id: user.id, organization_id: currentOrganization?.id || null })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      toast.error('Erro ao criar conversa: ' + error.message);
    },
  });

  const sendMessage = useMutation({
    mutationFn: async (message: MessageInsert) => {
      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();
      
      if (error) throw error;

      // Update last_message_at and ensure metadata has sender ID for routing replies
      const conv = conversationsQuery.data?.find(c => c.id === message.conversation_id);
      const contactPhone = conv?.contacts?.whatsapp || conv?.contacts?.phone;
      const cleanPhone = contactPhone ? contactPhone.replace(/\D/g, "") : null;
      
      const existingMetadata = (conv?.metadata as Record<string, string> | null) || {};
      const updatedMetadata: Record<string, string> = conv?.channel === 'whatsapp' && cleanPhone
        ? { ...existingMetadata, whatsapp_sender_id: cleanPhone }
        : { ...existingMetadata };

      await supabase
        .from('conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          metadata: updatedMetadata as unknown as Record<string, string>,
        })
        .eq('id', message.conversation_id);

      // Actually send via WhatsApp if channel is whatsapp
      if (conv?.channel === 'whatsapp' && contactPhone) {
        try {
          const { data: whatsappResult, error: whatsappError } = await supabase.functions.invoke('send-whatsapp', {
            body: {
              organization_id: currentOrganization?.id,
              to: contactPhone,
              message: message.content,
            },
          });
          if (whatsappError) {
            console.error('WhatsApp send error:', whatsappError);
            toast.error('Mensagem salva, mas falhou ao enviar via WhatsApp');
          } else if (whatsappResult?.error) {
            console.error('WhatsApp API error:', whatsappResult.error);
            toast.error(`Erro WhatsApp: ${whatsappResult.error}`);
          }
        } catch (err) {
          console.error('WhatsApp invoke error:', err);
          toast.error('Falha ao enviar mensagem via WhatsApp');
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      toast.error('Erro ao enviar mensagem: ' + error.message);
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const updateConversationStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('conversations')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Status atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  return {
    conversations: conversationsQuery.data ?? [],
    isLoading: conversationsQuery.isLoading,
    error: conversationsQuery.error,
    createConversation,
    sendMessage,
    markAsRead,
    updateConversationStatus,
  };
}
