
-- Add webhook_url column to forms for outbound webhook on submission
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS webhook_url TEXT DEFAULT NULL;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS webhook_headers JSONB DEFAULT NULL;
