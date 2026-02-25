
-- Drop all existing policies on instagram_accounts to start clean
DROP POLICY IF EXISTS "Admins can manage instagram accounts" ON public.instagram_accounts;
DROP POLICY IF EXISTS "Members can view instagram accounts" ON public.instagram_accounts;
DROP POLICY IF EXISTS "Admins can view instagram accounts" ON public.instagram_accounts;

-- Admins get full CRUD access (including tokens)
CREATE POLICY "Admins can manage instagram accounts"
ON public.instagram_accounts
FOR ALL
USING (is_org_admin(organization_id, auth.uid()));

-- Members can SELECT (frontend will use the safe view to exclude tokens)
CREATE POLICY "Members can view instagram accounts"
ON public.instagram_accounts
FOR SELECT
USING (is_org_member(organization_id, auth.uid()));
