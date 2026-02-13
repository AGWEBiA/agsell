
-- Restore member SELECT access to integrations and webhooks
-- Members need to view these to use the system properly

-- organization_integrations: restore member view
DROP POLICY IF EXISTS "Only admins can view integrations" ON public.organization_integrations;

CREATE POLICY "Members can view integrations"
ON public.organization_integrations
FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

-- inbound_webhooks: restore member view
DROP POLICY IF EXISTS "Only admins can view webhooks" ON public.inbound_webhooks;

CREATE POLICY "Members can view webhooks"
ON public.inbound_webhooks
FOR SELECT
USING (is_org_member(organization_id, auth.uid()));
