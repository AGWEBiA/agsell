
-- Fix overly permissive CSAT response insert policy
DROP POLICY IF EXISTS "Anyone can insert CSAT response" ON public.csat_responses;

CREATE POLICY "Authenticated users can insert CSAT response"
ON public.csat_responses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.csat_surveys cs
    WHERE cs.id = csat_responses.survey_id
    AND cs.is_active = true
  )
);
