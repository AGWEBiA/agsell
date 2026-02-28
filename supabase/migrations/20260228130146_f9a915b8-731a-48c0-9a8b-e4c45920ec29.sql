
-- Table for broadcast campaigns
CREATE TABLE public.instagram_dm_broadcasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'all', -- 'all' or 'selected'
  total_recipients INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued', -- queued, processing, completed, failed
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Table for individual recipient tracking
CREATE TABLE public.instagram_dm_broadcast_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broadcast_id UUID NOT NULL REFERENCES public.instagram_dm_broadcasts(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.instagram_dm_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_dm_broadcast_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view broadcasts" ON public.instagram_dm_broadcasts
  FOR SELECT USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Admins can insert broadcasts" ON public.instagram_dm_broadcasts
  FOR INSERT WITH CHECK (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Admins can update broadcasts" ON public.instagram_dm_broadcasts
  FOR UPDATE USING (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Members can view broadcast recipients" ON public.instagram_dm_broadcast_recipients
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.instagram_dm_broadcasts b
    WHERE b.id = instagram_dm_broadcast_recipients.broadcast_id
    AND is_org_member(b.organization_id, auth.uid())
  ));

CREATE POLICY "System can manage broadcast recipients" ON public.instagram_dm_broadcast_recipients
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.instagram_dm_broadcasts b
    WHERE b.id = instagram_dm_broadcast_recipients.broadcast_id
    AND is_org_admin(b.organization_id, auth.uid())
  ));
