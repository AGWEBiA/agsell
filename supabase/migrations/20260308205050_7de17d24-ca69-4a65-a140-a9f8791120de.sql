
-- 1. Flow node analytics table for tracking metrics per node
CREATE TABLE public.flow_node_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  entries_count INTEGER NOT NULL DEFAULT 0,
  exits_count INTEGER NOT NULL DEFAULT 0,
  conversions_count INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  avg_duration_seconds NUMERIC DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(automation_id, node_id)
);

ALTER TABLE public.flow_node_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org flow node analytics"
  ON public.flow_node_analytics FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- 2. Automation execution log per contact (detailed timeline)
CREATE TABLE public.automation_contact_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES public.automation_executions(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  node_id TEXT,
  node_label TEXT,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_contact_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org automation timeline"
  ON public.automation_contact_timeline FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_act_timeline_contact ON public.automation_contact_timeline(contact_id, created_at DESC);
CREATE INDEX idx_act_timeline_automation ON public.automation_contact_timeline(automation_id, created_at DESC);

-- 3. Predictive lead scores table
CREATE TABLE public.predictive_lead_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  predicted_score INTEGER NOT NULL DEFAULT 0,
  confidence NUMERIC NOT NULL DEFAULT 0,
  factors JSONB DEFAULT '[]',
  model_version TEXT DEFAULT 'v1',
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contact_id)
);

ALTER TABLE public.predictive_lead_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org predictive scores"
  ON public.predictive_lead_scores FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org predictive scores"
  ON public.predictive_lead_scores FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );
