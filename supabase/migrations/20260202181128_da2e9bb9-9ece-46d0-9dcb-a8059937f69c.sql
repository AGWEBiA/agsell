
-- Fix the permissive form submissions policy to require valid form
DROP POLICY IF EXISTS "Anyone can submit forms" ON public.form_submissions;
CREATE POLICY "Anyone can submit to active forms" ON public.form_submissions 
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.forms WHERE id = form_id AND is_active = true)
);
