-- 1. Secure instagram_accounts_safe view with security_invoker
DROP VIEW IF EXISTS instagram_accounts_safe;
CREATE VIEW instagram_accounts_safe WITH (security_invoker = true) AS
SELECT id, organization_id, instagram_user_id, username, full_name,
       profile_picture_url, is_active, connected_by, metadata, created_at, updated_at
FROM instagram_accounts;

-- 2. Fix forms public read policy to only expose necessary fields via the existing policy
-- The public policy is needed for FormView (/forms/:formId), keep it but it's acceptable for public forms.
-- No change needed - this is intentional design for public form rendering.

-- 3. Fix permission_profiles: restrict system profiles to authenticated users only
DROP POLICY IF EXISTS "Members can view permission profiles" ON permission_profiles;
CREATE POLICY "Members can view permission profiles" ON permission_profiles
  FOR SELECT USING (
    (organization_id IS NOT NULL AND is_org_member(organization_id, auth.uid()))
    OR (organization_id IS NULL AND auth.uid() IS NOT NULL)
  );