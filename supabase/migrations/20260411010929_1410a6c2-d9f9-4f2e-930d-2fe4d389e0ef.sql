-- Remove auth_token column from automation_scheduled_steps since we now use service role key
-- This fixes the security vulnerability of exposed JWT tokens
ALTER TABLE public.automation_scheduled_steps DROP COLUMN IF EXISTS auth_token;

-- Fix voip-audio: remove public read policy
DROP POLICY IF EXISTS "Anyone can read voip audio" ON storage.objects;

-- Fix inbox-attachments: remove public read policy  
DROP POLICY IF EXISTS "Anyone can view inbox attachments" ON storage.objects;