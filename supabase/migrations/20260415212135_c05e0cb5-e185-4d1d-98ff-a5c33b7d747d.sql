
-- 1. Make inbox-attachments bucket private
UPDATE storage.buckets SET public = false WHERE id = 'inbox-attachments';

-- 2. Remove public SELECT policies on storage (anyone/anon access)
DROP POLICY IF EXISTS "Anyone can view inbox attachments" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read voip audio" ON storage.objects;

-- 3. Remove duplicate unscoped DELETE policy on inbox-attachments
DROP POLICY IF EXISTS "Users can delete their own inbox attachments" ON storage.objects;

-- 4. Tighten INSERT policy for inbox-attachments (require folder = user id)
DROP POLICY IF EXISTS "Authenticated users can upload inbox attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload inbox attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'inbox-attachments'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- 5. Tighten INSERT policy for automation_executions
DROP POLICY IF EXISTS "Users can insert executions" ON public.automation_executions;
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.automation_executions;
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'automation_executions' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.automation_executions', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Org members can insert executions"
  ON public.automation_executions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.automations a
      JOIN public.organization_members om ON om.organization_id = a.organization_id
      WHERE a.id = automation_id AND om.user_id = auth.uid()
    )
  );

-- 6. Tighten INSERT policy for ai_agent_conversations
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'ai_agent_conversations' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.ai_agent_conversations', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Org members can insert ai agent conversations"
  ON public.ai_agent_conversations FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_agents ag
      JOIN public.organization_members om ON om.organization_id = ag.organization_id
      WHERE ag.id = agent_id AND om.user_id = auth.uid()
    )
  );

-- 7. Tighten INSERT policy for instagram_automation_logs
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'instagram_automation_logs' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.instagram_automation_logs', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Org members can insert instagram automation logs"
  ON public.instagram_automation_logs FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.instagram_accounts ia
      JOIN public.organization_members om ON om.organization_id = ia.organization_id
      WHERE ia.id = instagram_account_id AND om.user_id = auth.uid()
    )
  );

-- 8. Tighten webhook secret visibility - restrict inbound_webhooks SELECT to org admins
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'inbound_webhooks' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.inbound_webhooks', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Org admins can view inbound webhooks"
  ON public.inbound_webhooks FOR SELECT TO authenticated
  USING (
    is_org_admin(organization_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)
  );
