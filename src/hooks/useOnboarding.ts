import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface OnboardingProgress {
  id: string;
  organization_id: string;
  step_profile_completed: boolean;
  step_team_completed: boolean;
  step_pipeline_completed: boolean;
  step_first_contact_completed: boolean;
  completed_at: string | null;
}

export function useOnboarding() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const buildProgressInsert = (
    step?: keyof Omit<OnboardingProgress, 'id' | 'organization_id' | 'completed_at'>,
    completedAt?: string | null
  ) => ({
    organization_id: currentOrganization!.id,
    step_profile_completed: step === 'step_profile_completed',
    step_team_completed: step === 'step_team_completed',
    step_pipeline_completed: step === 'step_pipeline_completed',
    step_first_contact_completed: step === 'step_first_contact_completed',
    completed_at: completedAt ?? null,
  });

  const { data: progress, isLoading } = useQuery({
    queryKey: ['onboarding', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return null;

      const { data, error } = await supabase
        .from('organization_onboarding')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .maybeSingle();

      if (error) throw error;
      return data as OnboardingProgress | null;
    },
    enabled: !!currentOrganization?.id,
  });

  const initializeOnboarding = useMutation({
    mutationFn: async () => {
      if (!currentOrganization?.id) throw new Error('No organization');

      const { data: existing, error: fetchError } = await supabase
        .from('organization_onboarding')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (existing) return existing;

      const { data, error } = await supabase
        .from('organization_onboarding')
        .insert(buildProgressInsert())
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });

  const updateStep = useMutation({
    mutationFn: async (step: keyof Omit<OnboardingProgress, 'id' | 'organization_id' | 'completed_at'>) => {
      if (!currentOrganization?.id) throw new Error('No organization');

      const updates: Record<string, boolean | string> = { [step]: true };

      // Check if all steps will be completed
      const currentProgress = progress || {};
      const allSteps = ['step_profile_completed', 'step_team_completed', 'step_pipeline_completed', 'step_first_contact_completed'];
      const willBeComplete = allSteps.every(s => s === step || (currentProgress as Record<string, boolean>)[s]);

      if (willBeComplete) {
        updates.completed_at = new Date().toISOString();
      }

      const { data: existing, error: fetchError } = await supabase
        .from('organization_onboarding')
        .select('id')
        .eq('organization_id', currentOrganization.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!existing) {
        const { data, error } = await supabase
          .from('organization_onboarding')
          .insert(buildProgressInsert(step, (updates.completed_at as string | undefined) ?? null))
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from('organization_onboarding')
        .update(updates)
        .eq('organization_id', currentOrganization.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });

  const currentStep = (): number => {
    if (!progress) return 0;
    if (!progress.step_profile_completed) return 1;
    if (!progress.step_team_completed) return 2;
    if (!progress.step_pipeline_completed) return 3;
    if (!progress.step_first_contact_completed) return 4;
    return 5; // Completed
  };

  const isComplete = progress?.completed_at !== null;
  const completionPercentage = progress
    ? [
        progress.step_profile_completed,
        progress.step_team_completed,
        progress.step_pipeline_completed,
        progress.step_first_contact_completed,
      ].filter(Boolean).length * 25
    : 0;

  return {
    progress,
    isLoading,
    currentStep: currentStep(),
    isComplete,
    completionPercentage,
    initializeOnboarding,
    updateStep,
  };
}
