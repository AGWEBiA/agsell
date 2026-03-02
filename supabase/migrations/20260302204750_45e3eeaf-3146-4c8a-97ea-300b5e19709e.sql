
-- Global platform settings (key-value store for admin configs)
CREATE TABLE public.platform_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text NOT NULL UNIQUE,
    value jsonb NOT NULL DEFAULT '{}'::jsonb,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only global admins can manage platform settings
CREATE POLICY "Global admins can manage platform settings"
ON public.platform_settings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can read platform settings (needed for edge functions to work via service role, and for org users to get evolution config)
CREATE POLICY "Authenticated users can read platform settings"
ON public.platform_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default Evolution API config entry
INSERT INTO public.platform_settings (key, value, description)
VALUES ('evolution_api', '{"api_url": "", "api_key": "", "is_configured": false}'::jsonb, 'Configuração global da Evolution API');
