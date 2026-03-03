
-- Add Stripe price ID columns to plans table
ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS stripe_price_id_monthly TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id_yearly TEXT,
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;
