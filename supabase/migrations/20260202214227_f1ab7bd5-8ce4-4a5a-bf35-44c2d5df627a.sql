-- Primeiro dropar TODAS as políticas que dependem das funções
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can update their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Members can view org members" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can manage invites" ON public.organization_invites;
DROP POLICY IF EXISTS "Anyone can view invite by token" ON public.organization_invites;
DROP POLICY IF EXISTS "Admins can manage integrations" ON public.organization_integrations;
DROP POLICY IF EXISTS "Members can view integrations" ON public.organization_integrations;
DROP POLICY IF EXISTS "Members can view webhook events" ON public.webhook_events;

-- Agora podemos dropar as funções
DROP FUNCTION IF EXISTS public.is_org_member(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_org_admin(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_org_role(uuid, uuid);

-- Recriar is_org_member com ordem consistente (org_id, user_id)
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_members
        WHERE organization_id = _org_id
          AND user_id = _user_id
    )
$$;

-- Recriar is_org_admin com ordem consistente (org_id, user_id)
CREATE OR REPLACE FUNCTION public.is_org_admin(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_members
        WHERE organization_id = _org_id
          AND user_id = _user_id
          AND role IN ('owner', 'admin')
    )
$$;

-- Recriar get_org_role com ordem consistente (org_id, user_id)
CREATE OR REPLACE FUNCTION public.get_org_role(_org_id uuid, _user_id uuid)
RETURNS org_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.organization_members
    WHERE organization_id = _org_id
      AND user_id = _user_id
$$;

-- Políticas para organizations
CREATE POLICY "Members can view their organizations"
ON public.organizations
FOR SELECT
USING (is_org_member(id, auth.uid()));

CREATE POLICY "Admins can update their organizations"
ON public.organizations
FOR UPDATE
USING (is_org_admin(id, auth.uid()));

-- Políticas para organization_members
CREATE POLICY "Admins can insert members"
ON public.organization_members
FOR INSERT
WITH CHECK (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Admins can update members"
ON public.organization_members
FOR UPDATE
USING (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Admins can delete members"
ON public.organization_members
FOR DELETE
USING (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Members can view org members"
ON public.organization_members
FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

-- Políticas para organization_invites
CREATE POLICY "Admins can insert invites"
ON public.organization_invites
FOR INSERT
WITH CHECK (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Admins can update invites"
ON public.organization_invites
FOR UPDATE
USING (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Admins can delete invites"
ON public.organization_invites
FOR DELETE
USING (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Members can view invites"
ON public.organization_invites
FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

-- Políticas para organization_integrations
CREATE POLICY "Admins can insert integrations"
ON public.organization_integrations
FOR INSERT
WITH CHECK (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Admins can update integrations"
ON public.organization_integrations
FOR UPDATE
USING (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Admins can delete integrations"
ON public.organization_integrations
FOR DELETE
USING (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Members can view integrations"
ON public.organization_integrations
FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

-- Políticas para webhook_events
CREATE POLICY "Members can view webhook events"
ON public.webhook_events
FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

-- Atualizar política de profiles para ver membros da mesma org
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view profiles in same org"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid()
    AND om2.user_id = profiles.user_id
  )
);