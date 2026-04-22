
-- Add user_id column to track who connected each instance
ALTER TABLE public.organization_integrations
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_org_integrations_user_id ON public.organization_integrations(user_id);
