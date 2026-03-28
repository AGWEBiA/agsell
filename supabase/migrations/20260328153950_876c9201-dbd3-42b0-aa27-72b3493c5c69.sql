-- Fix 1: checkout_leads - change global admin policy from public to authenticated
DROP POLICY IF EXISTS "Global admins can manage checkout leads" ON public.checkout_leads;
CREATE POLICY "Global admins can manage checkout leads"
ON public.checkout_leads FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: checkout_leads - add NULL org_id protection to org admin SELECT
DROP POLICY IF EXISTS "Admins can view checkout_leads" ON public.checkout_leads;
CREATE POLICY "Admins can view checkout_leads"
ON public.checkout_leads FOR SELECT
TO authenticated
USING (
  (organization_id IS NOT NULL AND is_org_admin(organization_id, auth.uid()))
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix 3: inbound_webhooks - change ALL policy from public to authenticated
DROP POLICY IF EXISTS "Admins can manage webhooks" ON public.inbound_webhooks;
CREATE POLICY "Admins can manage webhooks"
ON public.inbound_webhooks FOR ALL
TO authenticated
USING (is_org_admin(organization_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (is_org_admin(organization_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Fix 4: inbound_webhooks - update SELECT policy to exclude secret_token for non-admins
-- (RLS can't filter columns, but ensure only admins access the table)
DROP POLICY IF EXISTS "Members can view webhooks" ON public.inbound_webhooks;
CREATE POLICY "Members can view webhooks"
ON public.inbound_webhooks FOR SELECT
TO authenticated
USING (is_org_admin(organization_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));