
CREATE OR REPLACE FUNCTION public.handle_form_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  form_record RECORD;
  contact_first_name TEXT;
  contact_email TEXT;
  contact_phone TEXT;
  contact_whatsapp TEXT;
  new_contact_id UUID;
  submission_data JSONB;
  k TEXT;
  v TEXT;
BEGIN
  -- Increment submissions count
  UPDATE public.forms SET submissions_count = COALESCE(submissions_count, 0) + 1 WHERE id = NEW.form_id;

  -- Get form info
  SELECT user_id, organization_id INTO form_record FROM public.forms WHERE id = NEW.form_id;
  IF form_record IS NULL THEN RETURN NEW; END IF;

  submission_data := NEW.data;

  -- Iterate all keys and match by lowercase to be flexible with any field name
  FOR k, v IN SELECT * FROM jsonb_each_text(submission_data)
  LOOP
    CONTINUE WHEN v IS NULL OR v = '';
    
    CASE lower(trim(k))
      WHEN 'nome', 'name', 'first_name', 'nome completo', 'nome_completo', 'full_name' THEN
        IF contact_first_name IS NULL THEN contact_first_name := v; END IF;
      WHEN 'email', 'e-mail', 'e_mail', 'correo' THEN
        IF contact_email IS NULL THEN contact_email := v; END IF;
      WHEN 'telefone', 'phone', 'celular', 'tel', 'fone', 'número', 'numero', 'phone_number' THEN
        IF contact_phone IS NULL THEN contact_phone := v; END IF;
      WHEN 'whatsapp', 'wpp', 'zap' THEN
        IF contact_whatsapp IS NULL THEN contact_whatsapp := v; END IF;
      ELSE NULL;
    END CASE;
  END LOOP;

  -- Replicate: if we have phone but no whatsapp, copy phone to whatsapp and vice-versa
  IF contact_phone IS NOT NULL AND contact_whatsapp IS NULL THEN
    contact_whatsapp := contact_phone;
  ELSIF contact_whatsapp IS NOT NULL AND contact_phone IS NULL THEN
    contact_phone := contact_whatsapp;
  END IF;

  -- Only create contact if we have at least a name
  IF contact_first_name IS NOT NULL AND contact_first_name != '' THEN
    -- Check if contact already exists by email
    IF contact_email IS NOT NULL AND contact_email != '' THEN
      SELECT id INTO new_contact_id 
      FROM public.contacts 
      WHERE email = contact_email 
        AND organization_id = form_record.organization_id
      LIMIT 1;
    END IF;

    IF new_contact_id IS NULL THEN
      INSERT INTO public.contacts (
        first_name, email, phone, whatsapp, 
        user_id, organization_id, source
      ) VALUES (
        contact_first_name, 
        NULLIF(contact_email, ''), 
        NULLIF(contact_phone, ''),
        NULLIF(contact_whatsapp, ''),
        form_record.user_id, 
        form_record.organization_id, 
        'formulario'
      )
      RETURNING id INTO new_contact_id;
    END IF;

    UPDATE public.form_submissions SET contact_id = new_contact_id WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;
