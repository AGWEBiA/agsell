CREATE TABLE IF NOT EXISTS public.chatbots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chatbots_org ON public.chatbots(organization_id);

ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view chatbots"
  ON public.chatbots FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can insert chatbots"
  ON public.chatbots FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can update chatbots"
  ON public.chatbots FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can delete chatbots"
  ON public.chatbots FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_chatbots_updated_at
  BEFORE UPDATE ON public.chatbots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();