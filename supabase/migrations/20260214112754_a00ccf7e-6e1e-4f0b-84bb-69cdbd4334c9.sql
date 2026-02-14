
-- Composite indexes for high-traffic queries
-- contacts: most queried table
CREATE INDEX IF NOT EXISTS idx_contacts_org_created ON public.contacts (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_user_created ON public.contacts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts (phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts (organization_id, status);

-- companies
CREATE INDEX IF NOT EXISTS idx_companies_org_created ON public.companies (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_user_created ON public.companies (user_id, created_at DESC);

-- deals
CREATE INDEX IF NOT EXISTS idx_deals_org_created ON public.deals (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_user_created ON public.deals (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals (stage_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON public.deals (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_deals_contact ON public.deals (contact_id);

-- tasks
CREATE INDEX IF NOT EXISTS idx_tasks_org_created ON public.tasks (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks (user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks (user_id, due_date) WHERE due_date IS NOT NULL;

-- activities
CREATE INDEX IF NOT EXISTS idx_activities_contact ON public.activities (contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_deal ON public.activities (deal_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_org ON public.activities (organization_id, created_at DESC);

-- messages & conversations
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_org ON public.conversations (organization_id, last_message_at DESC);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, is_read, created_at DESC);

-- tags
CREATE INDEX IF NOT EXISTS idx_contact_tags_contact ON public.contact_tags (contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_tag ON public.contact_tags (tag_id);

-- automations
CREATE INDEX IF NOT EXISTS idx_automations_org ON public.automations (organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_automation_executions_automation ON public.automation_executions (automation_id, created_at DESC);

-- api_keys
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix_hash ON public.api_keys (key_prefix, key_hash);

-- webhook
CREATE INDEX IF NOT EXISTS idx_webhook_events_org ON public.webhook_events (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook ON public.webhook_logs (webhook_id, created_at DESC);
