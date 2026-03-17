
-- Campaigns (each has a unique slug for the public link)
CREATE TABLE public.group_rotator_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  strategy TEXT NOT NULL DEFAULT 'round_robin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  current_index INTEGER NOT NULL DEFAULT 0,
  total_clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(slug)
);

-- Individual groups inside a campaign
CREATE TABLE public.group_rotator_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.group_rotator_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  invite_link TEXT NOT NULL,
  max_capacity INTEGER DEFAULT 250,
  max_clicks INTEGER DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  member_count INTEGER NOT NULL DEFAULT 0,
  is_paused BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Click log for analytics
CREATE TABLE public.group_rotator_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.group_rotator_campaigns(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES public.group_rotator_entries(id) ON DELETE CASCADE,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_rotator_campaigns_org ON public.group_rotator_campaigns(organization_id);
CREATE INDEX idx_rotator_campaigns_slug ON public.group_rotator_campaigns(slug);
CREATE INDEX idx_rotator_entries_campaign ON public.group_rotator_entries(campaign_id);
CREATE INDEX idx_rotator_clicks_campaign ON public.group_rotator_clicks(campaign_id);
CREATE INDEX idx_rotator_clicks_created ON public.group_rotator_clicks(created_at);

-- RLS
ALTER TABLE public.group_rotator_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_rotator_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_rotator_clicks ENABLE ROW LEVEL SECURITY;

-- Policies for campaigns
CREATE POLICY "Org members can manage rotator campaigns" ON public.group_rotator_campaigns
  FOR ALL TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(organization_id, auth.uid()));

-- Policies for entries
CREATE POLICY "Org members can manage rotator entries" ON public.group_rotator_entries
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.group_rotator_campaigns c
    WHERE c.id = campaign_id AND public.is_org_member(c.organization_id, auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.group_rotator_campaigns c
    WHERE c.id = campaign_id AND public.is_org_member(c.organization_id, auth.uid())
  ));

-- Policies for clicks (org members can read)
CREATE POLICY "Org members can read rotator clicks" ON public.group_rotator_clicks
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.group_rotator_campaigns c
    WHERE c.id = campaign_id AND public.is_org_member(c.organization_id, auth.uid())
  ));

-- Allow service role / edge functions to insert clicks
CREATE POLICY "Service can insert rotator clicks" ON public.group_rotator_clicks
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow anon to read campaigns by slug (for public redirect)
CREATE POLICY "Public can read active campaigns by slug" ON public.group_rotator_campaigns
  FOR SELECT TO anon
  USING (is_active = true);

-- Allow anon to read entries (for public redirect)
CREATE POLICY "Public can read rotator entries" ON public.group_rotator_entries
  FOR SELECT TO anon
  USING (true);

-- Allow anon to update click counts on entries
CREATE POLICY "Public can update entry clicks" ON public.group_rotator_entries
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anon to update campaign index
CREATE POLICY "Public can update campaign index" ON public.group_rotator_campaigns
  FOR UPDATE TO anon
  USING (is_active = true)
  WITH CHECK (is_active = true);
