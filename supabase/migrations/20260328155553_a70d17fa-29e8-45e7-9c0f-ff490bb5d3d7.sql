-- Fix 1: automation_scheduled_steps - restrict auth_token to admins only
DROP POLICY IF EXISTS "Users can view own org scheduled steps" ON public.automation_scheduled_steps;
CREATE POLICY "Users can view own org scheduled steps"
ON public.automation_scheduled_steps FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL AND (
    is_org_admin(organization_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Fix 2: plans table - remove public SELECT and restrict to authenticated
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.plans;
CREATE POLICY "Authenticated users can view active plans"
ON public.plans FOR SELECT
TO authenticated
USING (is_active = true);

-- Fix 3: user_achievements - restrict INSERT to service role only
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;

-- Fix 4: audit_logs - restrict INSERT to use RPC only
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_logs;