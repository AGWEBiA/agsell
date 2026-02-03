-- Fix RLS policies with "true" check
-- Drop the overly permissive policy and replace with proper validation

DROP POLICY IF EXISTS "System can insert events" ON public.whatsapp_group_events;

-- Create proper policy that requires authenticated user
CREATE POLICY "Authenticated can insert events" ON public.whatsapp_group_events
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);