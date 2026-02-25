
-- ==============================================
-- MIGRATE CRM TABLES RLS FROM user_id TO org membership
-- ==============================================

-- ============ CONTACTS ============
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;

CREATE POLICY "Members can view org contacts" ON public.contacts
FOR SELECT USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can insert org contacts" ON public.contacts
FOR INSERT WITH CHECK (is_org_member(organization_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Members can update org contacts" ON public.contacts
FOR UPDATE USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can delete org contacts" ON public.contacts
FOR DELETE USING (is_org_member(organization_id, auth.uid()));

-- ============ DEALS ============
DROP POLICY IF EXISTS "Users can view their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can insert their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can update their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can delete their own deals" ON public.deals;

CREATE POLICY "Members can view org deals" ON public.deals
FOR SELECT USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can insert org deals" ON public.deals
FOR INSERT WITH CHECK (is_org_member(organization_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Members can update org deals" ON public.deals
FOR UPDATE USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can delete org deals" ON public.deals
FOR DELETE USING (is_org_member(organization_id, auth.uid()));

-- ============ TASKS ============
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

CREATE POLICY "Members can view org tasks" ON public.tasks
FOR SELECT USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can insert org tasks" ON public.tasks
FOR INSERT WITH CHECK (is_org_member(organization_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Members can update org tasks" ON public.tasks
FOR UPDATE USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can delete org tasks" ON public.tasks
FOR DELETE USING (is_org_member(organization_id, auth.uid()));

-- ============ COMPANIES ============
DROP POLICY IF EXISTS "Users can view their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can insert their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can delete their own companies" ON public.companies;

CREATE POLICY "Members can view org companies" ON public.companies
FOR SELECT USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can insert org companies" ON public.companies
FOR INSERT WITH CHECK (is_org_member(organization_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Members can update org companies" ON public.companies
FOR UPDATE USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can delete org companies" ON public.companies
FOR DELETE USING (is_org_member(organization_id, auth.uid()));

-- ============ TAGS ============
DROP POLICY IF EXISTS "Users can view their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can insert their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can update their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can delete their own tags" ON public.tags;

CREATE POLICY "Members can view org tags" ON public.tags
FOR SELECT USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can insert org tags" ON public.tags
FOR INSERT WITH CHECK (is_org_member(organization_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Members can update org tags" ON public.tags
FOR UPDATE USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can delete org tags" ON public.tags
FOR DELETE USING (is_org_member(organization_id, auth.uid()));

-- ============ PIPELINE_STAGES ============
DROP POLICY IF EXISTS "Users can view their own stages" ON public.pipeline_stages;
DROP POLICY IF EXISTS "Users can insert their own stages" ON public.pipeline_stages;
DROP POLICY IF EXISTS "Users can update their own stages" ON public.pipeline_stages;
DROP POLICY IF EXISTS "Users can delete their own stages" ON public.pipeline_stages;

CREATE POLICY "Members can view org stages" ON public.pipeline_stages
FOR SELECT USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can insert org stages" ON public.pipeline_stages
FOR INSERT WITH CHECK (is_org_member(organization_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Members can update org stages" ON public.pipeline_stages
FOR UPDATE USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can delete org stages" ON public.pipeline_stages
FOR DELETE USING (is_org_member(organization_id, auth.uid()));

-- ============ ACTIVITIES ============
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities;

CREATE POLICY "Members can view org activities" ON public.activities
FOR SELECT USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can insert org activities" ON public.activities
FOR INSERT WITH CHECK (is_org_member(organization_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Members can update org activities" ON public.activities
FOR UPDATE USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can delete org activities" ON public.activities
FOR DELETE USING (is_org_member(organization_id, auth.uid()));

-- ============ EMAIL_CAMPAIGNS ============
DROP POLICY IF EXISTS "Users can manage their email campaigns" ON public.email_campaigns;

CREATE POLICY "Members can view org email campaigns" ON public.email_campaigns
FOR SELECT USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can insert org email campaigns" ON public.email_campaigns
FOR INSERT WITH CHECK (is_org_member(organization_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Members can update org email campaigns" ON public.email_campaigns
FOR UPDATE USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can delete org email campaigns" ON public.email_campaigns
FOR DELETE USING (is_org_member(organization_id, auth.uid()));

-- ============ FORMS ============
DROP POLICY IF EXISTS "Users can manage their forms" ON public.forms;

CREATE POLICY "Members can view org forms" ON public.forms
FOR SELECT USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can insert org forms" ON public.forms
FOR INSERT WITH CHECK (is_org_member(organization_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Members can update org forms" ON public.forms
FOR UPDATE USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can delete org forms" ON public.forms
FOR DELETE USING (is_org_member(organization_id, auth.uid()));

-- ============ IMPORT_JOBS ============
DROP POLICY IF EXISTS "Users can manage their import jobs" ON public.import_jobs;

CREATE POLICY "Members can view org import jobs" ON public.import_jobs
FOR SELECT USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can insert org import jobs" ON public.import_jobs
FOR INSERT WITH CHECK (is_org_member(organization_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Members can update org import jobs" ON public.import_jobs
FOR UPDATE USING (is_org_member(organization_id, auth.uid()));

-- ============ AUTOMATIONS ============
-- automations already have organization_id column
DROP POLICY IF EXISTS "Users can manage their automations" ON public.automations;

CREATE POLICY "Members can view org automations" ON public.automations
FOR SELECT USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can insert org automations" ON public.automations
FOR INSERT WITH CHECK (is_org_member(organization_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Members can update org automations" ON public.automations
FOR UPDATE USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can delete org automations" ON public.automations
FOR DELETE USING (is_org_member(organization_id, auth.uid()));

-- ============ CONTACT_TAGS ============
-- Update to use org membership via contacts table
DROP POLICY IF EXISTS "Users can manage contact tags" ON public.contact_tags;

CREATE POLICY "Members can manage contact tags" ON public.contact_tags
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM contacts
    WHERE contacts.id = contact_tags.contact_id
    AND is_org_member(contacts.organization_id, auth.uid())
  )
);

-- ============ NOTIFICATIONS ============
-- Keep user-specific for notifications (personal)
-- No change needed

-- ============ CONVERSATIONS ============
-- conversations already use user_id but have organization_id
DROP POLICY IF EXISTS "Users can manage their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;

CREATE POLICY "Members can view org conversations" ON public.conversations
FOR SELECT USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can insert org conversations" ON public.conversations
FOR INSERT WITH CHECK (is_org_member(organization_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Members can update org conversations" ON public.conversations
FOR UPDATE USING (is_org_member(organization_id, auth.uid()));

-- ============ LEAD_SCORING_RULES ============
DROP POLICY IF EXISTS "Users can manage their scoring rules" ON public.lead_scoring_rules;

CREATE POLICY "Members can view org scoring rules" ON public.lead_scoring_rules
FOR SELECT USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can insert org scoring rules" ON public.lead_scoring_rules
FOR INSERT WITH CHECK (is_org_member(organization_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Members can update org scoring rules" ON public.lead_scoring_rules
FOR UPDATE USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can delete org scoring rules" ON public.lead_scoring_rules
FOR DELETE USING (is_org_member(organization_id, auth.uid()));
