import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TicketReply {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  sent_via: string;
  created_at: string;
  profile_name?: string;
}

export function useTicketReplies(ticketId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const repliesQuery = useQuery({
    queryKey: ['ticket-replies', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const { data, error } = await supabase
        .from('support_ticket_replies' as any)
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const userIds = new Set<string>();
      (data as any[])?.forEach((r: any) => userIds.add(r.user_id));
      let profileMap: Record<string, string> = {};
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', Array.from(userIds));
        profiles?.forEach((p: any) => { profileMap[p.user_id] = p.full_name; });
      }
      return (data as any[])?.map((r: any) => ({
        ...r,
        profile_name: profileMap[r.user_id] || 'Desconhecido',
      })) as TicketReply[];
    },
    enabled: !!ticketId,
  });

  const sendReply = useMutation({
    mutationFn: async ({ content, sentVia }: { content: string; sentVia?: string }) => {
      if (!ticketId || !user?.id) throw new Error('Dados insuficientes');
      const { error } = await supabase.from('support_ticket_replies' as any).insert({
        ticket_id: ticketId,
        user_id: user.id,
        content,
        sent_via: sentVia || 'internal',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-replies', ticketId] });
      toast.success('Resposta enviada!');
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteReply = useMutation({
    mutationFn: async (replyId: string) => {
      const { error } = await supabase.from('support_ticket_replies' as any).delete().eq('id', replyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-replies', ticketId] });
    },
  });

  return {
    replies: (repliesQuery.data || []) as TicketReply[],
    isLoading: repliesQuery.isLoading,
    sendReply,
    deleteReply,
  };
}
