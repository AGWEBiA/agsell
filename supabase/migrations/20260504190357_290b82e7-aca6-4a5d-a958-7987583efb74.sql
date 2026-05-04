-- Add commission and payment tracking to deals
ALTER TABLE public.deals 
ADD COLUMN commission_rate NUMERIC DEFAULT 0,
ADD COLUMN commission_value NUMERIC DEFAULT 0,
ADD COLUMN payment_link TEXT,
ADD COLUMN payment_status TEXT DEFAULT 'pending',
ADD COLUMN external_sale_id TEXT;

-- Create an index for better performance on payment lookups
CREATE INDEX idx_deals_external_sale_id ON public.deals(external_sale_id);
CREATE INDEX idx_deals_payment_status ON public.deals(payment_status);

-- Update RLS policies if necessary (usually they cover all columns)
-- No changes needed to RLS as existing policies use owner_id/organization_id
