
-- 1. Integration marketplace catalog
CREATE TABLE IF NOT EXISTS public.integration_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  icon_url TEXT,
  is_native BOOLEAN DEFAULT false,
  auth_type TEXT DEFAULT 'api_key',
  config_schema JSONB DEFAULT '{}',
  documentation_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view integration catalog" ON public.integration_catalog FOR SELECT TO authenticated USING (true);

-- 2. Webhook delivery queue with retry
CREATE TABLE public.webhook_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  method TEXT DEFAULT 'POST',
  headers JSONB DEFAULT '{}',
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  last_status_code INTEGER,
  last_error TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own org deliveries" ON public.webhook_deliveries FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE INDEX idx_webhook_deliveries_pending ON public.webhook_deliveries(status, next_retry_at) WHERE status IN ('pending', 'retrying');

-- 3. Flow A/B test
CREATE TABLE public.flow_ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  variant_a_nodes JSONB NOT NULL DEFAULT '[]',
  variant_b_nodes JSONB NOT NULL DEFAULT '[]',
  split_percentage INTEGER DEFAULT 50,
  status TEXT DEFAULT 'draft',
  entries_a INTEGER DEFAULT 0,
  entries_b INTEGER DEFAULT 0,
  conversions_a INTEGER DEFAULT 0,
  conversions_b INTEGER DEFAULT 0,
  winner TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.flow_ab_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own org flow ab tests" ON public.flow_ab_tests FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own org flow ab tests" ON public.flow_ab_tests FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

-- 4. Add catalog_id to organization_integrations if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_integrations' AND column_name = 'catalog_id') THEN
    ALTER TABLE public.organization_integrations ADD COLUMN catalog_id UUID REFERENCES public.integration_catalog(id);
  END IF;
END $$;
