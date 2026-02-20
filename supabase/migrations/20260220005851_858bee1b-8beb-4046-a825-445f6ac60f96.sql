
-- Tabela para contas do Instagram conectadas
CREATE TABLE public.instagram_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  instagram_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  full_name TEXT,
  profile_picture_url TEXT,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  page_id TEXT,
  page_access_token TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  connected_by UUID NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para automações do Instagram
CREATE TABLE public.instagram_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  automation_type TEXT NOT NULL DEFAULT 'dm_reply', -- dm_reply, comment_reply, story_reply, comment_to_dm
  trigger_config JSONB DEFAULT '{}'::jsonb,
  -- trigger_config pode conter: keywords, media_type, comment_contains, story_mention, etc.
  actions JSONB DEFAULT '[]'::jsonb,
  -- actions: [{type: 'send_dm', content: '...'}, {type: 'reply_comment', content: '...'}, {type: 'add_contact', ...}]
  is_active BOOLEAN NOT NULL DEFAULT false,
  executions_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para logs de execuções de automações do Instagram
CREATE TABLE public.instagram_automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID NOT NULL REFERENCES public.instagram_automations(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- dm_received, comment_received, story_mention, story_reply
  event_data JSONB DEFAULT '{}'::jsonb,
  action_taken TEXT,
  status TEXT NOT NULL DEFAULT 'success', -- success, failed, skipped
  error_message TEXT,
  contact_id UUID REFERENCES public.contacts(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_automation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies para instagram_accounts
CREATE POLICY "Admins can manage instagram accounts"
ON public.instagram_accounts FOR ALL
USING (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Members can view instagram accounts"
ON public.instagram_accounts FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

-- RLS Policies para instagram_automations
CREATE POLICY "Admins can manage instagram automations"
ON public.instagram_automations FOR ALL
USING (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Members can view instagram automations"
ON public.instagram_automations FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

-- RLS Policies para instagram_automation_logs
CREATE POLICY "Members can view instagram automation logs"
ON public.instagram_automation_logs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.instagram_accounts ia
  WHERE ia.id = instagram_automation_logs.instagram_account_id
  AND is_org_member(ia.organization_id, auth.uid())
));

CREATE POLICY "System can insert instagram automation logs"
ON public.instagram_automation_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Triggers para updated_at
CREATE TRIGGER update_instagram_accounts_updated_at
BEFORE UPDATE ON public.instagram_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instagram_automations_updated_at
BEFORE UPDATE ON public.instagram_automations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
