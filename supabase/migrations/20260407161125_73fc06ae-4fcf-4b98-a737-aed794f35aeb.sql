
-- Fix inbox-attachments: remove public SELECT, add org-member SELECT
DROP POLICY IF EXISTS "Anyone can read inbox attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public can read inbox attachments" ON storage.objects;

-- Create proper authenticated SELECT policy for inbox-attachments
CREATE POLICY "Org members can read inbox attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'inbox-attachments'
);

-- Fix DELETE policy to only allow the uploader to delete
DROP POLICY IF EXISTS "Authenticated users can delete inbox attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete inbox attachments" ON storage.objects;

CREATE POLICY "Users can delete own inbox attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'inbox-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix voip-audio: remove public SELECT
DROP POLICY IF EXISTS "Anyone can read voip audio" ON storage.objects;

-- Fix messages RLS: allow org members to view messages (not just conversation creator)
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;

CREATE POLICY "Org members can view messages"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (
      c.user_id = auth.uid()
      OR public.is_org_member(c.organization_id, auth.uid())
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

-- Also fix message INSERT to allow org members
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;

CREATE POLICY "Org members can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (
      c.user_id = auth.uid()
      OR public.is_org_member(c.organization_id, auth.uid())
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

-- Fix message UPDATE for org members
DROP POLICY IF EXISTS "Users can update messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their messages" ON public.messages;

CREATE POLICY "Org members can update messages"
ON public.messages FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (
      c.user_id = auth.uid()
      OR public.is_org_member(c.organization_id, auth.uid())
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  )
);
