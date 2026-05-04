import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { useEffect, useMemo } from 'react';

const getConversationMetadata = (conversation: any): Record<string, any> => {
  if (!conversation?.metadata || typeof conversation.metadata !== 'object' || Array.isArray(conversation.metadata)) {
    return {};
  }

  return conversation.metadata as Record<string, any>;
};

export function useInbox() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const conversationsQueryKey = useMemo(
    () => ['conversations', currentOrganization?.id ?? null, user?.id ?? null] as const,
    [currentOrganization?.id, user?.id],
  );

  const conversationsQuery = useQuery({
    queryKey: conversationsQueryKey,
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('conversations')
        .select(`
          *,
          contacts (
            id, first_name, last_name, email, phone, whatsapp, lead_score
          ),
          messages (
            id, content, sender_type, is_read, created_at,
            message_type, media_url, media_mime_type, file_name, sender_id,
            delivery_status, external_id, metadata,
            quoted_message_id, quoted_content, quoted_sender_type
          )
        `)
        .order('last_message_at', { ascending: false })
        .order('created_at', { referencedTable: 'messages', ascending: true });

      if (currentOrganization?.id) {
        query = query.eq('organization_id', currentOrganization.id);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const allSenderIds = new Set<string>();
      (data as any[])?.forEach((conv) => {
        conv.messages?.forEach((m: any) => {
          if (m.sender_id) allSenderIds.add(m.sender_id);
        });
      });

      const senderNames: Record<string, string> = {};
      if (allSenderIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', Array.from(allSenderIds));

        profiles?.forEach((p) => {
          if (p.full_name) senderNames[p.user_id] = p.full_name;
        });
      }

      (data as any[])?.forEach((conv) => {
        conv.messages?.forEach((m: any) => {
          if (m.sender_id && senderNames[m.sender_id]) {
            m.sender_name = senderNames[m.sender_id];
          }
        });
      });

      return data as any[];
    },
    enabled: !!user?.id,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    refetchInterval: user?.id ? 3000 : false,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!user?.id) return;

    const channelName = currentOrganization?.id
      ? `inbox-realtime-${currentOrganization.id}`
      : `inbox-realtime-${user.id}`;

    const refreshConversations = () => {
      queryClient.invalidateQueries({ queryKey: conversationsQueryKey, exact: true });
      queryClient.refetchQueries({ queryKey: conversationsQueryKey, exact: true, type: 'active' });
    };

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let failCount = 0;

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        failCount = 0;
        refreshConversations();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        failCount = 0;
        refreshConversations();
      })
      .on('system', {}, (payload: any) => {
        if (payload?.extension === 'postgres_changes' && payload?.status === 'error') {
          failCount++;
          console.warn('[Inbox Realtime] Error detected, failCount:', failCount);
          // Auto-reload on repeated failures
          if (failCount >= 2) {
            refreshConversations();
            failCount = 0;
          }
        }
      })
      .subscribe((status) => {
        if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          console.warn('[Inbox Realtime] Status:', status, '— scheduling reconnect');
          refreshConversations();
          if (!reconnectTimer) {
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              supabase.removeChannel(channel);
              // The effect cleanup + re-run handles resubscription
            }, 5000);
          }
        }
      });

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      supabase.removeChannel(channel);
    };
  }, [conversationsQueryKey, currentOrganization?.id, queryClient, user?.id]);

  const createConversation = useMutation({
    mutationFn: async (conversation: { contact_id: string; channel: string; metadata?: Record<string, any> | null }) => {
      if (!user?.id) throw new Error('Not authenticated');

      let existingQuery = supabase
        .from('conversations')
        .select('*')
        .eq('contact_id', conversation.contact_id)
        .eq('channel', conversation.channel);

      if (currentOrganization?.id) {
        existingQuery = existingQuery.eq('organization_id', currentOrganization.id);
      } else {
        existingQuery = existingQuery.is('organization_id', null).eq('user_id', user.id);
      }

      const { data: existing } = await existingQuery.maybeSingle();

      if (existing) {
        const existingMetadata = getConversationMetadata(existing);
        const nextMetadata = conversation.metadata
          ? { ...existingMetadata, ...conversation.metadata }
          : existingMetadata;

        const updates: Record<string, any> = {};
        if (existing.status === 'resolved' || existing.status === 'closed') {
          updates.status = 'open';
          updates.last_message_at = new Date().toISOString();
          updates.resolved_at = null;
        }

        if (conversation.metadata) {
          updates.metadata = nextMetadata;
        }

        if (Object.keys(updates).length > 0) {
          const { data: updatedConversation, error: updateError } = await supabase
            .from('conversations')
            .update(updates)
            .eq('id', existing.id)
            .select()
            .single();

          if (updateError) throw updateError;
          return updatedConversation;
        }

        return existing;
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          contact_id: conversation.contact_id,
          channel: conversation.channel,
          user_id: user.id,
          organization_id: currentOrganization?.id || null,
          metadata: conversation.metadata ?? null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (conversation) => {
      queryClient.setQueryData(conversationsQueryKey, (current: any[] | undefined) => {
        if (!conversation) return current ?? [];
        const existing = (current ?? []).filter((item) => item.id !== conversation.id);
        return [{ ...conversation, contacts: null, messages: [] }, ...existing];
      });
      queryClient.invalidateQueries({ queryKey: conversationsQueryKey, exact: true });
    },
    onError: (e) => toast.error('Erro ao criar conversa: ' + e.message),
  });

  const sendMessage = useMutation({
    mutationFn: async (message: any) => {
      const {
        instance_id,
        quoted_message_id,
        quoted_content,
        quoted_sender_type,
        quoted_external_id,
        ...messageToInsert
      } = { ...message };

      if (message.sender_type === 'user' && user?.id) {
        messageToInsert.sender_id = user.id;
      }

      // Add quoted fields if replying
      if (quoted_message_id) {
        (messageToInsert as any).quoted_message_id = quoted_message_id;
        (messageToInsert as any).quoted_content = quoted_content;
        (messageToInsert as any).quoted_sender_type = quoted_sender_type;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(messageToInsert as any)
        .select()
        .single();
      if (error) throw error;

      const conv = conversationsQuery.data?.find((c) => c.id === message.conversation_id);
      const conversationMetadata = getConversationMetadata(conv);
      const contactPhone = conv?.contacts?.whatsapp || conv?.contacts?.phone;
      const cleanPhone = contactPhone ? contactPhone.replace(/\D/g, '') : null;
      const resolvedInstanceId =
        instance_id ||
        (typeof conversationMetadata.whatsapp_manual_instance_id === 'string' ? conversationMetadata.whatsapp_manual_instance_id : null) ||
        (typeof conversationMetadata.whatsapp_instance_id === 'string' ? conversationMetadata.whatsapp_instance_id : null);

      const updates: Record<string, any> = {
        last_message_at: new Date().toISOString(),
      };

      if (message.sender_type === 'user' && conv && !conv.first_response_at) {
        updates.first_response_at = new Date().toISOString();
      }

      if (message.sender_type === 'user' && conv && !conv.assigned_to && user?.id) {
        updates.assigned_to = user.id;
      }

      if (conv?.channel === 'whatsapp' && cleanPhone) {
        updates.metadata = {
          ...conversationMetadata,
          whatsapp_sender_id: cleanPhone,
          ...(resolvedInstanceId ? { whatsapp_last_used_instance_id: resolvedInstanceId } : {}),
        };
      }

      await supabase.from('conversations').update(updates).eq('id', message.conversation_id);

      if (conv?.channel === 'whatsapp' && contactPhone) {
        try {
          // Map internal message_type → send-whatsapp media_type
          const incomingType = String(message.message_type || 'text');
          const mime = String(message.media_mime_type || '');
          let mappedMediaType: 'image' | 'video' | 'audio' | 'document' | undefined;
          if (incomingType === 'image') mappedMediaType = 'image';
          else if (incomingType === 'video' || mime.startsWith('video/')) mappedMediaType = 'video';
          else if (incomingType === 'audio' || mime.startsWith('audio/')) mappedMediaType = 'audio';
          else if (incomingType === 'file' || incomingType === 'document') mappedMediaType = 'document';

          const isPtt = incomingType === 'audio' && (mime.includes('ogg') || mime.includes('opus'));

          const sendBody: Record<string, unknown> = {
            organization_id: currentOrganization?.id,
            to: contactPhone,
            message: message.content,
            instance_id: resolvedInstanceId || undefined,
            quoted_message_external_id: quoted_external_id || undefined,
          };
          if (message.media_url && mappedMediaType) {
            if (isPtt) {
              sendBody.message_kind = 'audio_ptt';
              sendBody.audio_url = message.media_url;
            } else {
              sendBody.message_kind = 'media';
              sendBody.media_url = message.media_url;
              sendBody.media_type = mappedMediaType;
              if (message.file_name) sendBody.media_filename = message.file_name;
              sendBody.media_caption = message.content || '';
            }
          }

          const { data: responseData, error: whatsappError } = await supabase.functions.invoke('send-whatsapp', {
            body: sendBody,
          });

          if (whatsappError) {
            toast.error('Mensagem salva, mas falhou ao enviar via WhatsApp');
            await supabase.from('messages').update({ delivery_status: 'failed' }).eq('id', data.id);
          } else if (responseData?.error) {
            toast.error(`Erro WhatsApp: ${responseData.error}`);
            await supabase.from('messages').update({ delivery_status: 'failed' }).eq('id', data.id);
          } else {
            // Save external_id for delivery tracking via webhook (messages.update).
            // Do NOT mark as 'sent' here — the Evolution API HTTP 200 only means the
            // request was accepted, not that WhatsApp delivered it. Real status (sent /
            // delivered / read / failed) comes from the webhook updating delivery_status
            // based on SERVER_ACK / DELIVERY_ACK / READ events. Initial state stays 'pending'.
            const externalId = responseData?.key?.id || responseData?.messageId || responseData?.id;
            const instanceUsed = responseData?.instance_used || responseData?.instance;
            const evoStatus = String(responseData?.status || responseData?.key?.status || '').toUpperCase();
            const updates: Record<string, any> = {};
            if (externalId) updates.external_id = externalId;
            if (instanceUsed) updates.instance_name = instanceUsed;
            
            // If Evolution already returned an explicit error/failed status synchronously, mark failed
            if (evoStatus === 'ERROR' || evoStatus === 'FAILED') {
              updates.delivery_status = 'failed';
            }
            if (Object.keys(updates).length > 0) {
              await supabase.from('messages').update(updates).eq('id', data.id);
            }
          }
        } catch {
          toast.error('Falha ao enviar mensagem via WhatsApp');
          await supabase.from('messages').update({ delivery_status: 'failed' }).eq('id', data.id);
        }
      }

      return data;
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData(conversationsQueryKey, (current: any[] | undefined) => {
        if (!newMessage) return current ?? [];

        return (current ?? []).map((conversation) => {
          if (conversation.id !== newMessage.conversation_id) return conversation;

          const nextMessages = [...(conversation.messages ?? []), newMessage];
          return {
            ...conversation,
            messages: nextMessages,
            last_message_at: newMessage.created_at ?? new Date().toISOString(),
          };
        });
      });
      queryClient.invalidateQueries({ queryKey: conversationsQueryKey, exact: true });
    },
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conversationsQueryKey, exact: true }),
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
      queryClient.invalidateQueries({ queryKey: conversationsQueryKey, exact: true });
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
