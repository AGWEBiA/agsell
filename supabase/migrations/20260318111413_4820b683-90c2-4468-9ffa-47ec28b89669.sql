
-- 1. Fix forms: create a security definer function for public form access
CREATE OR REPLACE FUNCTION public.get_form_by_id(_form_id uuid)
RETURNS SETOF public.forms
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.forms WHERE id = _form_id AND is_active = true LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_form_by_id(uuid) TO anon, authenticated;

-- Drop and recreate forms policy - restrict anon to nothing (use RPC instead)
DROP POLICY IF EXISTS "Anyone can view active forms by id" ON public.forms;

-- 2. Fix group_rotator_campaigns - drop public SELECT policy  
DROP POLICY IF EXISTS "Public can read active campaigns by slug" ON public.group_rotator_campaigns;

-- Create secure function for slug lookup
CREATE OR REPLACE FUNCTION public.get_rotator_campaign_by_slug(_slug text)
RETURNS TABLE(id uuid, name text, slug text, strategy text, current_index int, total_clicks int, is_active boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.slug, c.strategy, c.current_index, c.total_clicks, c.is_active
  FROM public.group_rotator_campaigns c
  WHERE c.slug = _slug AND c.is_active = true
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_rotator_campaign_by_slug(text) TO anon, authenticated;

-- 3. Fix plan_whatsapp_group_links - restrict to admins
DROP POLICY IF EXISTS "Authenticated read plan_whatsapp_group_links" ON public.plan_whatsapp_group_links;
CREATE POLICY "Only admins can read plan_whatsapp_group_links" ON public.plan_whatsapp_group_links
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Fix plan_whatsapp_groups - restrict to admins
DROP POLICY IF EXISTS "Authenticated read active plan_whatsapp_groups" ON public.plan_whatsapp_groups;
CREATE POLICY "Only admins can read plan_whatsapp_groups" ON public.plan_whatsapp_groups
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
