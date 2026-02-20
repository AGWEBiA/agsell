
-- Add assigned_to field to conversations
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);

-- Assignment rules for automatic distribution
CREATE TABLE public.assignment_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  strategy text NOT NULL DEFAULT 'round_robin', -- round_robin, least_busy, manual
  is_active boolean NOT NULL DEFAULT true,
  channels text[] NOT NULL DEFAULT '{}',
  eligible_members uuid[] NOT NULL DEFAULT '{}', -- user_ids eligible for assignment
  max_concurrent integer DEFAULT 10, -- max conversations per agent
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Track assignment state (last assigned index for round-robin)
CREATE TABLE public.assignment_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES public.assignment_rules(id) ON DELETE CASCADE,
  last_assigned_index integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(rule_id)
);

-- CSAT surveys config per organization
CREATE TABLE public.csat_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Pesquisa de Satisfação',
  question text NOT NULL DEFAULT 'Como você avalia o atendimento?',
  is_active boolean NOT NULL DEFAULT true,
  auto_send boolean NOT NULL DEFAULT true, -- send automatically when conversation closes
  channels text[] NOT NULL DEFAULT '{whatsapp,email}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Individual CSAT responses
CREATE TABLE public.csat_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES public.csat_surveys(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES auth.users(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assignment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csat_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csat_responses ENABLE ROW LEVEL SECURITY;

-- Assignment rules policies
CREATE POLICY "Admins can manage assignment rules"
ON public.assignment_rules FOR ALL
USING (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Members can view assignment rules"
ON public.assignment_rules FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

-- Assignment state policies
CREATE POLICY "Admins can manage assignment state"
ON public.assignment_state FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.assignment_rules ar
  WHERE ar.id = assignment_state.rule_id
  AND is_org_admin(ar.organization_id, auth.uid())
));

CREATE POLICY "Members can view assignment state"
ON public.assignment_state FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.assignment_rules ar
  WHERE ar.id = assignment_state.rule_id
  AND is_org_member(ar.organization_id, auth.uid())
));

-- CSAT surveys policies
CREATE POLICY "Admins can manage CSAT surveys"
ON public.csat_surveys FOR ALL
USING (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Members can view CSAT surveys"
ON public.csat_surveys FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

-- CSAT responses policies
CREATE POLICY "Members can view CSAT responses"
ON public.csat_responses FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Anyone can insert CSAT response"
ON public.csat_responses FOR INSERT
WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_assignment_rules_updated_at
BEFORE UPDATE ON public.assignment_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_csat_surveys_updated_at
BEFORE UPDATE ON public.csat_surveys
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
