
-- Create table for SAC agents (atendentes)
CREATE TABLE public.sac_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  department TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sac_agents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Members can view SAC agents"
  ON public.sac_agents FOR SELECT
  USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Admins can insert SAC agents"
  ON public.sac_agents FOR INSERT
  WITH CHECK (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Admins can update SAC agents"
  ON public.sac_agents FOR UPDATE
  USING (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Admins can delete SAC agents"
  ON public.sac_agents FOR DELETE
  USING (is_org_admin(organization_id, auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_sac_agents_updated_at
  BEFORE UPDATE ON public.sac_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Unique constraint: no duplicate email per org
CREATE UNIQUE INDEX idx_sac_agents_org_email ON public.sac_agents(organization_id, email);
