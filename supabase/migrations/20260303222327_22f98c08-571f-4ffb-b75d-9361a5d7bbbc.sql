
-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_form_submission_created ON public.form_submissions;

CREATE TRIGGER on_form_submission_created
AFTER INSERT ON public.form_submissions
FOR EACH ROW
EXECUTE FUNCTION public.handle_form_submission();
