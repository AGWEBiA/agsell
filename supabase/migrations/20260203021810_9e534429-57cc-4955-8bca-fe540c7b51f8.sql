-- ============================================
-- WhatsApp Groups & Communities Management
-- ============================================

-- Table for WhatsApp groups/communities
CREATE TABLE public.whatsapp_groups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    external_group_id TEXT, -- ID from WhatsApp API
    name TEXT NOT NULL,
    description TEXT,
    group_type TEXT NOT NULL DEFAULT 'group', -- 'group' or 'community'
    invite_link TEXT,
    is_admin BOOLEAN DEFAULT false, -- If the bot is admin
    member_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    synced_at TIMESTAMP WITH TIME ZONE, -- Last sync with WhatsApp
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb
);

-- Table for group members
CREATE TABLE public.whatsapp_group_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.whatsapp_groups(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    name TEXT,
    is_admin BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    left_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'left', 'removed', 'banned'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for group member events (entries/exits monitoring)
CREATE TABLE public.whatsapp_group_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.whatsapp_groups(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.whatsapp_group_members(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'join', 'leave', 'remove', 'promote', 'demote'
    event_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for group message templates
CREATE TABLE public.whatsapp_group_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'video', 'document'
    content TEXT NOT NULL,
    media_url TEXT,
    trigger_event TEXT, -- 'on_join', 'on_leave', 'scheduled', 'manual'
    is_active BOOLEAN DEFAULT true,
    target_groups UUID[] DEFAULT '{}', -- Array of group IDs to send to
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for bulk/mass messaging campaigns (1-to-1)
CREATE TABLE public.whatsapp_campaigns (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    message_content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text',
    media_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'
    -- Targeting
    target_type TEXT NOT NULL DEFAULT 'contacts', -- 'contacts', 'tags', 'groups', 'all'
    target_filters JSONB DEFAULT '{}'::jsonb, -- Filters for targeting
    -- Rate limiting (WhatsApp best practices)
    messages_per_minute INTEGER DEFAULT 20, -- Safe default
    delay_between_messages INTEGER DEFAULT 3000, -- ms between each message
    daily_limit INTEGER DEFAULT 1000, -- Max messages per day
    -- Progress tracking
    total_recipients INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    messages_delivered INTEGER DEFAULT 0,
    messages_failed INTEGER DEFAULT 0,
    messages_read INTEGER DEFAULT 0,
    -- Scheduling
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL
);

-- Table for campaign recipients
CREATE TABLE public.whatsapp_campaign_recipients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.whatsapp_campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    name TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed', 'skipped'
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for WhatsApp message templates (pre-approved by Meta)
CREATE TABLE public.whatsapp_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    external_template_id TEXT, -- ID from WhatsApp Business API
    name TEXT NOT NULL,
    language TEXT DEFAULT 'pt_BR',
    category TEXT, -- 'marketing', 'utility', 'authentication'
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    content TEXT NOT NULL,
    header_type TEXT, -- 'text', 'image', 'video', 'document'
    header_content TEXT,
    footer_text TEXT,
    buttons JSONB DEFAULT '[]'::jsonb,
    variables JSONB DEFAULT '[]'::jsonb, -- Template variables
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_group_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_groups
CREATE POLICY "Members can view org groups" ON public.whatsapp_groups
    FOR SELECT USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Admins can manage org groups" ON public.whatsapp_groups
    FOR ALL USING (is_org_admin(organization_id, auth.uid()));

-- RLS Policies for whatsapp_group_members
CREATE POLICY "Members can view group members" ON public.whatsapp_group_members
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM whatsapp_groups g
        WHERE g.id = whatsapp_group_members.group_id
        AND is_org_member(g.organization_id, auth.uid())
    ));

CREATE POLICY "Admins can manage group members" ON public.whatsapp_group_members
    FOR ALL USING (EXISTS (
        SELECT 1 FROM whatsapp_groups g
        WHERE g.id = whatsapp_group_members.group_id
        AND is_org_admin(g.organization_id, auth.uid())
    ));

-- RLS Policies for whatsapp_group_events
CREATE POLICY "Members can view group events" ON public.whatsapp_group_events
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM whatsapp_groups g
        WHERE g.id = whatsapp_group_events.group_id
        AND is_org_member(g.organization_id, auth.uid())
    ));

CREATE POLICY "System can insert events" ON public.whatsapp_group_events
    FOR INSERT WITH CHECK (true);

-- RLS Policies for whatsapp_group_messages
CREATE POLICY "Members can view group messages" ON public.whatsapp_group_messages
    FOR SELECT USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Admins can manage group messages" ON public.whatsapp_group_messages
    FOR ALL USING (is_org_admin(organization_id, auth.uid()));

-- RLS Policies for whatsapp_campaigns
CREATE POLICY "Members can view campaigns" ON public.whatsapp_campaigns
    FOR SELECT USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Admins can manage campaigns" ON public.whatsapp_campaigns
    FOR ALL USING (is_org_admin(organization_id, auth.uid()));

-- RLS Policies for whatsapp_campaign_recipients
CREATE POLICY "Members can view recipients" ON public.whatsapp_campaign_recipients
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM whatsapp_campaigns c
        WHERE c.id = whatsapp_campaign_recipients.campaign_id
        AND is_org_member(c.organization_id, auth.uid())
    ));

CREATE POLICY "System can manage recipients" ON public.whatsapp_campaign_recipients
    FOR ALL USING (EXISTS (
        SELECT 1 FROM whatsapp_campaigns c
        WHERE c.id = whatsapp_campaign_recipients.campaign_id
        AND is_org_admin(c.organization_id, auth.uid())
    ));

-- RLS Policies for whatsapp_templates
CREATE POLICY "Members can view templates" ON public.whatsapp_templates
    FOR SELECT USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Admins can manage templates" ON public.whatsapp_templates
    FOR ALL USING (is_org_admin(organization_id, auth.uid()));

-- Indexes for performance
CREATE INDEX idx_whatsapp_groups_org ON public.whatsapp_groups(organization_id);
CREATE INDEX idx_whatsapp_group_members_group ON public.whatsapp_group_members(group_id);
CREATE INDEX idx_whatsapp_group_members_phone ON public.whatsapp_group_members(phone_number);
CREATE INDEX idx_whatsapp_group_events_group ON public.whatsapp_group_events(group_id);
CREATE INDEX idx_whatsapp_campaigns_org ON public.whatsapp_campaigns(organization_id);
CREATE INDEX idx_whatsapp_campaigns_status ON public.whatsapp_campaigns(status);
CREATE INDEX idx_whatsapp_campaign_recipients_campaign ON public.whatsapp_campaign_recipients(campaign_id);
CREATE INDEX idx_whatsapp_campaign_recipients_status ON public.whatsapp_campaign_recipients(status);

-- Updated at triggers
CREATE TRIGGER update_whatsapp_groups_updated_at
    BEFORE UPDATE ON public.whatsapp_groups
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_group_members_updated_at
    BEFORE UPDATE ON public.whatsapp_group_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_group_messages_updated_at
    BEFORE UPDATE ON public.whatsapp_group_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_campaigns_updated_at
    BEFORE UPDATE ON public.whatsapp_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at
    BEFORE UPDATE ON public.whatsapp_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();