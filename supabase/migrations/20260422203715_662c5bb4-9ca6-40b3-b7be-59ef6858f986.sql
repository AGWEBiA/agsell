
CREATE TABLE public.whatsapp_webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL DEFAULT 'messages.upsert',
  instance_name TEXT,
  phone TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  routing_status TEXT NOT NULL DEFAULT 'received',
  details JSONB,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their whatsapp webhook logs"
ON public.whatsapp_webhook_logs FOR SELECT
TO authenticated
USING (
  (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE INDEX idx_wa_webhook_logs_org ON public.whatsapp_webhook_logs (organization_id, created_at DESC);
CREATE INDEX idx_wa_webhook_logs_status ON public.whatsapp_webhook_logs (routing_status);

CREATE TABLE public.unknown_whatsapp_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_name TEXT NOT NULL UNIQUE,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  message_count INTEGER NOT NULL DEFAULT 1,
  sample_phone TEXT,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.unknown_whatsapp_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view unknown instances"
ON public.unknown_whatsapp_instances FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update unknown instances"
ON public.unknown_whatsapp_instances FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
