-- Add admin bypass SELECT policies for all key tables used in admin dashboard

-- contacts
CREATE POLICY "Global admins can view all contacts"
ON public.contacts FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- tags
CREATE POLICY "Global admins can view all tags"
ON public.tags FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- contact_tags
CREATE POLICY "Global admins can view all contact_tags"
ON public.contact_tags FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- deals
CREATE POLICY "Global admins can view all deals"
ON public.deals FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- companies
CREATE POLICY "Global admins can view all companies"
ON public.companies FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- automations
CREATE POLICY "Global admins can view all automations"
ON public.automations FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- forms
CREATE POLICY "Global admins can view all forms"
ON public.forms FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- form_submissions
CREATE POLICY "Global admins can view all form_submissions"
ON public.form_submissions FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- conversations
CREATE POLICY "Global admins can view all conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- tasks
CREATE POLICY "Global admins can view all tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- email_campaigns
CREATE POLICY "Global admins can view all email_campaigns"
ON public.email_campaigns FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- email_domains
CREATE POLICY "Global admins can view all email_domains"
ON public.email_domains FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- whatsapp_groups
CREATE POLICY "Global admins can view all whatsapp_groups"
ON public.whatsapp_groups FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- ai_agents
CREATE POLICY "Global admins can view all ai_agents"
ON public.ai_agents FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- profiles
CREATE POLICY "Global admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- activities
CREATE POLICY "Global admins can view all activities"
ON public.activities FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
