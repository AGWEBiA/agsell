
-- 1. Harden profiles: require authenticated user for SELECT
DROP POLICY IF EXISTS "Deny anonymous profiles access" ON public.profiles;
CREATE POLICY "Deny anonymous profiles access"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- 2. Harden checkout_leads: restrict to org admins only
DROP POLICY IF EXISTS "Admins can view checkout_leads" ON public.checkout_leads;
CREATE POLICY "Admins can view checkout_leads"
ON public.checkout_leads
FOR SELECT
TO authenticated
USING (
  public.is_org_admin(organization_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- 3. Harden permission_profiles: restrict system profiles to authenticated org members
DROP POLICY IF EXISTS "Restrict permission_profiles to org members" ON public.permission_profiles;
CREATE POLICY "Restrict permission_profiles to org members"
ON public.permission_profiles
FOR SELECT
TO authenticated
USING (
  is_system = true 
  OR public.is_org_member(organization_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- 4. Harden messages: validate sender_type on insert
CREATE OR REPLACE FUNCTION public.validate_message_sender_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow 'user' or 'agent' sender_type for authenticated inserts
  IF NEW.sender_type NOT IN ('user', 'agent', 'contact', 'system', 'bot') THEN
    RAISE EXCEPTION 'Invalid sender_type: %', NEW.sender_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_message_sender ON public.messages;
CREATE TRIGGER validate_message_sender
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_message_sender_type();
