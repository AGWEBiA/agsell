
-- Tabela para WhatsApp Flows (formulários interativos)
CREATE TABLE public.whatsapp_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published, archived
  flow_json JSONB NOT NULL DEFAULT '{"screens": []}'::jsonb,
  -- flow_json contém as telas do formulário interativo
  trigger_keywords TEXT[] DEFAULT '{}'::text[],
  auto_trigger BOOLEAN NOT NULL DEFAULT false,
  response_message TEXT,
  collect_as_contact BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT false,
  submissions_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para submissões de WhatsApp Flows
CREATE TABLE public.whatsapp_flow_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES public.whatsapp_flows(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id),
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'completed', -- completed, partial, abandoned
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_flow_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage whatsapp flows"
ON public.whatsapp_flows FOR ALL
USING (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Members can view whatsapp flows"
ON public.whatsapp_flows FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can view flow submissions"
ON public.whatsapp_flow_submissions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.whatsapp_flows wf
  WHERE wf.id = whatsapp_flow_submissions.flow_id
  AND is_org_member(wf.organization_id, auth.uid())
));

CREATE POLICY "System can insert flow submissions"
ON public.whatsapp_flow_submissions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Triggers
CREATE TRIGGER update_whatsapp_flows_updated_at
BEFORE UPDATE ON public.whatsapp_flows
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
