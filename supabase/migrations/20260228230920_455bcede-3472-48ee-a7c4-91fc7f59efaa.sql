
ALTER TABLE public.inbound_webhooks 
ADD COLUMN automation_id uuid REFERENCES public.automations(id) ON DELETE SET NULL DEFAULT NULL;
