-- Create API keys table for public REST API
CREATE TABLE public.api_keys (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    permissions JSONB DEFAULT '["read"]'::jsonb,
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_day INTEGER DEFAULT 10000,
    requests_today INTEGER DEFAULT 0,
    requests_this_minute INTEGER DEFAULT 0,
    last_request_at TIMESTAMP WITH TIME ZONE,
    last_minute_reset TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_day_reset DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage API keys"
ON public.api_keys FOR ALL
USING (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Members can view API keys"
ON public.api_keys FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

-- Create index for fast key lookup
CREATE INDEX idx_api_keys_key_prefix ON public.api_keys(key_prefix);
CREATE INDEX idx_api_keys_organization ON public.api_keys(organization_id);

-- Trigger for updated_at
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();