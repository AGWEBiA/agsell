
-- Unified communication credit packages (replaces sms_credit_packages + voip_credit_packages)
CREATE TABLE public.communication_credit_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  credits integer NOT NULL,
  price_cents integer NOT NULL,
  price_per_credit_cents numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  kiwify_checkout_url text,
  kiwify_product_id text,
  stripe_price_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unified communication credits per org (replaces sms_credits + voip_credits)
CREATE TABLE public.communication_credits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  balance integer NOT NULL DEFAULT 0,
  total_purchased integer NOT NULL DEFAULT 0,
  total_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unified communication transactions (replaces sms_transactions + voip_transactions)
CREATE TABLE public.communication_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'purchase',
  amount integer NOT NULL DEFAULT 0,
  channel text, -- 'sms', 'voip', or null for general purchase
  package_id uuid REFERENCES public.communication_credit_packages(id),
  payment_method text,
  payment_reference text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.communication_credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_transactions ENABLE ROW LEVEL SECURITY;

-- Packages: anyone can read active packages, only global admins manage
CREATE POLICY "Anyone can read active packages" ON public.communication_credit_packages
  FOR SELECT USING (true);

CREATE POLICY "Global admins manage packages" ON public.communication_credit_packages
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Credits: org members can read own org, service role manages
CREATE POLICY "Org members can view credits" ON public.communication_credits
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages credits" ON public.communication_credits
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Transactions: org members can view, authenticated can insert own org
CREATE POLICY "Org members can view transactions" ON public.communication_transactions
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can insert transactions" ON public.communication_transactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Global admins manage transactions" ON public.communication_transactions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Migrate data from old tables
INSERT INTO public.communication_credit_packages (name, credits, price_cents, price_per_credit_cents, is_active, sort_order, kiwify_checkout_url, kiwify_product_id, stripe_price_id)
SELECT name, credits, price_cents, price_per_credit_cents, is_active, sort_order, kiwify_checkout_url, kiwify_product_id, stripe_price_id
FROM public.sms_credit_packages
ON CONFLICT DO NOTHING;

-- Migrate credits: combine sms + voip balances
INSERT INTO public.communication_credits (organization_id, balance, total_purchased, total_used)
SELECT 
  COALESCE(s.organization_id, v.organization_id),
  COALESCE(s.balance, 0) + COALESCE(v.balance, 0),
  COALESCE(s.total_purchased, 0) + COALESCE(v.total_purchased, 0),
  COALESCE(s.total_used, 0) + COALESCE(v.total_used, 0)
FROM public.sms_credits s
FULL OUTER JOIN public.voip_credits v ON s.organization_id = v.organization_id
ON CONFLICT (organization_id) DO UPDATE SET
  balance = EXCLUDED.balance,
  total_purchased = EXCLUDED.total_purchased,
  total_used = EXCLUDED.total_used;
