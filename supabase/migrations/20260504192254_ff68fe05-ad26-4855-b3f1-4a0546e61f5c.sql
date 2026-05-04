ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS scheduled_export_config JSONB DEFAULT '{
  "enabled": false,
  "frequency": "weekly",
  "format": "pdf",
  "emails": [],
  "last_run": null
}'::jsonb;

-- Create table to track exports
CREATE TABLE IF NOT EXISTS public.crm_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  format TEXT NOT NULL,
  file_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.crm_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view exports for their organization"
ON public.crm_exports FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);
