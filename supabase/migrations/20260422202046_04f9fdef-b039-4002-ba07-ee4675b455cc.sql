ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'sent';

CREATE INDEX IF NOT EXISTS idx_messages_delivery_status ON public.messages(delivery_status);

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS external_id text;

CREATE INDEX IF NOT EXISTS idx_messages_external_id ON public.messages(external_id);