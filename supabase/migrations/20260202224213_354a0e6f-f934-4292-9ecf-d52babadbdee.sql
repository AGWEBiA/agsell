-- Create gamification tables for Phase 4

-- User achievements/badges table
CREATE TABLE public.user_achievements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- User points/stats table
CREATE TABLE public.user_gamification (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    total_points INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    contacts_created INTEGER NOT NULL DEFAULT 0,
    deals_won INTEGER NOT NULL DEFAULT 0,
    tasks_completed INTEGER NOT NULL DEFAULT 0,
    emails_sent INTEGER NOT NULL DEFAULT 0,
    automations_created INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, organization_id)
);

-- Organization onboarding progress
CREATE TABLE public.organization_onboarding (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
    step_profile_completed BOOLEAN DEFAULT false,
    step_team_completed BOOLEAN DEFAULT false,
    step_pipeline_completed BOOLEAN DEFAULT false,
    step_first_contact_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_achievements
CREATE POLICY "Users can view achievements in their org"
ON public.user_achievements FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Users can earn their own achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_gamification
CREATE POLICY "Users can view gamification in their org"
ON public.user_gamification FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Users can manage their own gamification"
ON public.user_gamification FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for organization_onboarding
CREATE POLICY "Members can view org onboarding"
ON public.organization_onboarding FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Admins can manage org onboarding"
ON public.organization_onboarding FOR ALL
USING (is_org_admin(organization_id, auth.uid()));

-- Function to award points and check for achievements
CREATE OR REPLACE FUNCTION public.award_points(
    _user_id UUID,
    _org_id UUID,
    _action TEXT,
    _points INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_total INTEGER;
    new_level INTEGER;
BEGIN
    -- Insert or update user gamification record
    INSERT INTO public.user_gamification (user_id, organization_id, total_points)
    VALUES (_user_id, _org_id, _points)
    ON CONFLICT (user_id, organization_id)
    DO UPDATE SET 
        total_points = user_gamification.total_points + _points,
        updated_at = now(),
        last_activity_date = CURRENT_DATE,
        contacts_created = CASE WHEN _action = 'contact_created' THEN user_gamification.contacts_created + 1 ELSE user_gamification.contacts_created END,
        deals_won = CASE WHEN _action = 'deal_won' THEN user_gamification.deals_won + 1 ELSE user_gamification.deals_won END,
        tasks_completed = CASE WHEN _action = 'task_completed' THEN user_gamification.tasks_completed + 1 ELSE user_gamification.tasks_completed END,
        emails_sent = CASE WHEN _action = 'email_sent' THEN user_gamification.emails_sent + 1 ELSE user_gamification.emails_sent END,
        automations_created = CASE WHEN _action = 'automation_created' THEN user_gamification.automations_created + 1 ELSE user_gamification.automations_created END;
    
    -- Get current total and calculate new level
    SELECT total_points INTO current_total 
    FROM public.user_gamification 
    WHERE user_id = _user_id AND organization_id = _org_id;
    
    new_level := GREATEST(1, FLOOR(current_total / 100) + 1);
    
    UPDATE public.user_gamification 
    SET level = new_level 
    WHERE user_id = _user_id AND organization_id = _org_id;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_user_gamification_updated_at
BEFORE UPDATE ON public.user_gamification
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_onboarding_updated_at
BEFORE UPDATE ON public.organization_onboarding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();