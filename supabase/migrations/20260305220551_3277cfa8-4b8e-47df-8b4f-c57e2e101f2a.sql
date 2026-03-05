ALTER TABLE public.plans 
  ADD COLUMN IF NOT EXISTS kiwify_product_id_yearly text,
  ADD COLUMN IF NOT EXISTS kiwify_checkout_url_yearly text;