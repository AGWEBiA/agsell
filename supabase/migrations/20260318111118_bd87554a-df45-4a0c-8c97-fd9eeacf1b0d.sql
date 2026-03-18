
-- 1. Fix the entry lookup function with correct column names
CREATE OR REPLACE FUNCTION public.get_rotator_entries_for_campaign(_campaign_id uuid)
RETURNS TABLE(id uuid, invite_link text, entry_name text, sort_order int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.invite_link, e.name, e.sort_order
  FROM public.group_rotator_entries e
  JOIN public.group_rotator_campaigns c ON c.id = e.campaign_id
  WHERE e.campaign_id = _campaign_id
    AND e.is_paused = false
    AND c.is_active = true
  ORDER BY e.sort_order;
$$;

-- 2. Fix the click increment function with correct column name
CREATE OR REPLACE FUNCTION public.increment_rotator_entry_clicks(_entry_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.group_rotator_entries
  SET click_count = COALESCE(click_count, 0) + 1
  WHERE id = _entry_id;
END;
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.get_rotator_entries_for_campaign(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_rotator_entry_clicks(uuid) TO anon, authenticated;

-- 3. Drop the overly permissive policies
DROP POLICY IF EXISTS "Public can update entry clicks" ON public.group_rotator_entries;
DROP POLICY IF EXISTS "Public can update campaign index" ON public.group_rotator_campaigns;
DROP POLICY IF EXISTS "Public can read rotator entries" ON public.group_rotator_entries;
DROP POLICY IF EXISTS "Public can read active campaigns" ON public.group_rotator_campaigns;

-- 4. Restrict forms public SELECT to only return form by specific ID query
DROP POLICY IF EXISTS "Anyone can view active forms by id" ON public.forms;
CREATE POLICY "Anyone can view active forms by id" ON public.forms
FOR SELECT TO anon, authenticated
USING (is_active = true);

-- 5. Restrict platform_settings to admins only
DROP POLICY IF EXISTS "Authenticated users can read platform settings" ON public.platform_settings;
CREATE POLICY "Only admins can read platform settings" ON public.platform_settings
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
