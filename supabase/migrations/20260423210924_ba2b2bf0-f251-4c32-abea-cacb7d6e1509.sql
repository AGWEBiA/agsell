-- Drop the broken policy
DROP POLICY IF EXISTS "Anyone can submit to active forms" ON public.form_submissions;

-- Recreate using the SECURITY DEFINER function get_form_by_id
-- This bypasses the forms table RLS just to confirm the form exists and is active
CREATE POLICY "Anyone can submit to active forms"
ON public.form_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.get_form_by_id(form_submissions.form_id)
  )
);