
-- Fix: Replace overly permissive anon policies with org_id validation
DROP POLICY IF EXISTS "Anon can insert site events" ON public.site_events;
CREATE POLICY "Insert site events with valid org" ON public.site_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (organization_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.organizations WHERE id = organization_id));

DROP POLICY IF EXISTS "Anon can insert tracking sessions" ON public.site_tracking_sessions;
CREATE POLICY "Insert tracking with valid org" ON public.site_tracking_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (organization_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.organizations WHERE id = organization_id));

DROP POLICY IF EXISTS "Anon can update tracking sessions" ON public.site_tracking_sessions;
CREATE POLICY "Update tracking own session" ON public.site_tracking_sessions
  FOR UPDATE TO anon, authenticated
  USING (organization_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.organizations WHERE id = organization_id))
  WITH CHECK (organization_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.organizations WHERE id = organization_id));
