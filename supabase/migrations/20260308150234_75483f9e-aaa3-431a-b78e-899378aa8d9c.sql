
ALTER TABLE public.voip_credit_packages
  ADD COLUMN IF NOT EXISTS kiwify_checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS kiwify_product_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
