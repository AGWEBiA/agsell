
-- Remove duplicate policy (keep the new one)
DROP POLICY IF EXISTS "Anyone can submit to active forms" ON public.form_submissions;
