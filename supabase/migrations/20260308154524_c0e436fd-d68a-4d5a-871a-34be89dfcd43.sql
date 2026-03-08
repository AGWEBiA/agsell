
-- FIX 1: Remove public anonymous access to all support tickets
-- Replace with a secure function for protocol-based lookup
DROP POLICY IF EXISTS "Anyone can view ticket by protocol" ON public.support_tickets;

-- FIX 2: Restrict instagram_accounts SELECT to org admins only
DROP POLICY IF EXISTS "Members can view instagram accounts" ON public.instagram_accounts;
CREATE POLICY "Admins can view instagram accounts" ON public.instagram_accounts
  FOR SELECT TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- FIX 3: Remove public anonymous access to agency invite tokens
DROP POLICY IF EXISTS "Anyone can read pending invites by token" ON public.agency_clients;

-- FIX 4: Restrict SMS credits modification to admins only
DROP POLICY IF EXISTS "Org members can manage SMS credits" ON public.sms_credits;

-- Keep SELECT for all members
CREATE POLICY "Org members can view SMS credits" ON public.sms_credits
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- Only admins can modify
CREATE POLICY "Admins can manage SMS credits" ON public.sms_credits
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- FIX 5: Restrict paid_groups_config with API keys to admins
DROP POLICY IF EXISTS "Org members view paid_groups_config" ON public.paid_groups_config;
CREATE POLICY "Admins can view paid_groups_config" ON public.paid_groups_config
  FOR SELECT TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- FIX 6: Restrict site_tracking_sessions UPDATE to server-side only (remove anon UPDATE)
DROP POLICY IF EXISTS "Update tracking own session" ON public.site_tracking_sessions;
