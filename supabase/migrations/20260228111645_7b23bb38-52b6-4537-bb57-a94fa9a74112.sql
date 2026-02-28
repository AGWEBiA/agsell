CREATE VIEW public.instagram_accounts_safe
WITH (security_invoker=on) AS
  SELECT id, organization_id, instagram_user_id, username, full_name, 
         profile_picture_url, is_active, connected_by, metadata, 
         created_at, updated_at
  FROM public.instagram_accounts;