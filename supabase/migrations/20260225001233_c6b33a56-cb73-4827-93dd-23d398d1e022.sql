-- Fix Instagram accounts: restrict token visibility to admins only
DROP POLICY IF EXISTS "Members can view instagram accounts" ON public.instagram_accounts;
DROP POLICY IF EXISTS "Admins can view instagram accounts" ON public.instagram_accounts;

-- Only admins can see full instagram account data (including tokens)
CREATE POLICY "Admins can view instagram accounts"
ON public.instagram_accounts
FOR SELECT
USING (is_org_admin(organization_id, auth.uid()));

-- Members can see non-sensitive fields via a limited view approach
-- For now, only admins get SELECT access to protect tokens