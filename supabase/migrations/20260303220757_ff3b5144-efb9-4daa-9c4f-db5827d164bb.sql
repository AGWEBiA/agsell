
-- Allow anyone to insert form submissions (public forms)
CREATE POLICY "Anyone can submit forms"
ON public.form_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
