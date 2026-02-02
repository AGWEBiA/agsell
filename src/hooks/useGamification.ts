import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';

interface UserGamification {
  id: string;
  user_id: string;
  organization_id: string;
  total_points: number;
  level: number;
  contacts_created: number;
  deals_won: number;
  tasks_completed: number;
  emails_sent: number;
  automations_created: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

interface UserAchievement {
  id: string;
  user_id: string;
  organization_id: string;
  achievement_type: string;
  achievement_name: string;
  points: number;
  earned_at: string;
  metadata: Record<string, unknown>;
}

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  level: number;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const ACHIEVEMENTS = {
  FIRST_CONTACT: { type: 'milestone', name: 'Primeiro Contato', points: 50, icon: '🎯' },
  FIRST_DEAL: { type: 'milestone', name: 'Primeira Venda', points: 100, icon: '💰' },
  FIRST_AUTOMATION: { type: 'milestone', name: 'Automatizador', points: 75, icon: '⚡' },
  CONTACTS_10: { type: 'milestone', name: '10 Contatos', points: 100, icon: '👥' },
  CONTACTS_50: { type: 'milestone', name: '50 Contatos', points: 250, icon: '🌟' },
  CONTACTS_100: { type: 'milestone', name: '100 Contatos', points: 500, icon: '🏆' },
  DEALS_WON_5: { type: 'milestone', name: '5 Negócios Fechados', points: 200, icon: '🎉' },
  DEALS_WON_25: { type: 'milestone', name: '25 Negócios Fechados', points: 500, icon: '💎' },
  STREAK_7: { type: 'streak', name: '7 Dias Seguidos', points: 150, icon: '🔥' },
  STREAK_30: { type: 'streak', name: '30 Dias Seguidos', points: 500, icon: '🚀' },
  TASKS_MASTER: { type: 'milestone', name: '50 Tarefas Concluídas', points: 200, icon: '✅' },
  EMAIL_PRO: { type: 'milestone', name: '100 Emails Enviados', points: 300, icon: '📧' },
};

export const POINT_VALUES = {
  contact_created: 10,
  deal_won: 50,
  task_completed: 5,
  email_sent: 2,
  automation_created: 25,
  daily_login: 5,
};

export function useGamification() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['gamification', 'stats', currentOrganization?.id, user?.id],
    queryFn: async () => {
      if (!currentOrganization?.id || !user?.id) return null;

      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserGamification | null;
    },
    enabled: !!currentOrganization?.id && !!user?.id,
  });

  const { data: achievements, isLoading: loadingAchievements } = useQuery({
    queryKey: ['gamification', 'achievements', currentOrganization?.id, user?.id],
    queryFn: async () => {
      if (!currentOrganization?.id || !user?.id) return [];

      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data as UserAchievement[];
    },
    enabled: !!currentOrganization?.id && !!user?.id,
  });

  const { data: leaderboard, isLoading: loadingLeaderboard } = useQuery({
    queryKey: ['gamification', 'leaderboard', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      const { data, error } = await supabase
        .from('user_gamification')
        .select('user_id, total_points, level')
        .eq('organization_id', currentOrganization.id)
        .order('total_points', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Fetch profiles for leaderboard users
      const userIds = data?.map(d => d.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      return (data || []).map(entry => ({
        ...entry,
        profile: profileMap.get(entry.user_id) || null,
      })) as LeaderboardEntry[];
    },
    enabled: !!currentOrganization?.id,
  });

  const awardPoints = useMutation({
    mutationFn: async ({ action, points }: { action: string; points: number }) => {
      if (!currentOrganization?.id || !user?.id) throw new Error('No user/org');

      const { error } = await supabase.rpc('award_points', {
        _user_id: user.id,
        _org_id: currentOrganization.id,
        _action: action,
        _points: points,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });

  const earnAchievement = useMutation({
    mutationFn: async ({ type, name, points }: { type: string; name: string; points: number }) => {
      if (!currentOrganization?.id || !user?.id) throw new Error('No user/org');

      // Check if already earned
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganization.id)
        .eq('achievement_type', type)
        .eq('achievement_name', name)
        .maybeSingle();

      if (existing) return null;

      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          organization_id: currentOrganization.id,
          achievement_type: type,
          achievement_name: name,
          points,
        })
        .select()
        .single();

      if (error) throw error;

      // Also award the points
      await awardPoints.mutateAsync({ action: 'achievement', points });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });

  const getLevelTitle = (level: number): string => {
    if (level >= 20) return 'Lenda das Vendas';
    if (level >= 15) return 'Mestre';
    if (level >= 10) return 'Expert';
    if (level >= 7) return 'Profissional';
    if (level >= 5) return 'Avançado';
    if (level >= 3) return 'Intermediário';
    return 'Iniciante';
  };

  const getNextLevelPoints = (currentPoints: number): number => {
    const currentLevel = Math.floor(currentPoints / 100) + 1;
    return currentLevel * 100;
  };

  const userRank = leaderboard?.findIndex(e => e.user_id === user?.id) ?? -1;

  return {
    stats,
    achievements: achievements || [],
    leaderboard: leaderboard || [],
    userRank: userRank >= 0 ? userRank + 1 : null,
    isLoading: loadingStats || loadingAchievements || loadingLeaderboard,
    awardPoints,
    earnAchievement,
    getLevelTitle,
    getNextLevelPoints,
  };
}
