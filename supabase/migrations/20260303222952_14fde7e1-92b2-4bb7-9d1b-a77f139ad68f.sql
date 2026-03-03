CREATE OR REPLACE FUNCTION public.handle_form_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  form_record RECORD;
  existing_contact RECORD;
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
  UPDATE public.forms
  SET submissions_count = COALESCE(submissions_count, 0) + 1
  WHERE id = NEW.form_id;

  -- Get form info
  SELECT user_id, organization_id INTO form_record
  FROM public.forms
  WHERE id = NEW.form_id;

  IF form_record IS NULL THEN
    RETURN NEW;
  END IF;

  submission_data := NEW.data;

  -- Flexible key mapping
  FOR k, v IN SELECT * FROM jsonb_each_text(submission_data)
  LOOP
    CONTINUE WHEN v IS NULL OR btrim(v) = '';

    CASE lower(btrim(k))
      WHEN 'nome', 'name', 'first_name', 'nome completo', 'nome_completo', 'full_name' THEN
        IF contact_first_name IS NULL THEN contact_first_name := btrim(v); END IF;
      WHEN 'email', 'e-mail', 'e_mail', 'correo' THEN
        IF contact_email IS NULL THEN contact_email := lower(btrim(v)); END IF;
      WHEN 'telefone', 'phone', 'celular', 'tel', 'fone', 'número', 'numero', 'phone_number' THEN
        IF contact_phone IS NULL THEN contact_phone := btrim(v); END IF;
      WHEN 'whatsapp', 'wpp', 'zap' THEN
        IF contact_whatsapp IS NULL THEN contact_whatsapp := btrim(v); END IF;
      ELSE NULL;
    END CASE;
  END LOOP;

  -- Replicate number both ways
  IF contact_phone IS NOT NULL AND contact_whatsapp IS NULL THEN
    contact_whatsapp := contact_phone;
  ELSIF contact_whatsapp IS NOT NULL AND contact_phone IS NULL THEN
    contact_phone := contact_whatsapp;
  END IF;

  -- Proceed if we have at least name or email
  IF COALESCE(NULLIF(contact_first_name, ''), NULLIF(contact_email, '')) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find existing contact by email in same org
  IF contact_email IS NOT NULL AND contact_email <> '' THEN
    SELECT id, phone, whatsapp
    INTO existing_contact
    FROM public.contacts
    WHERE organization_id = form_record.organization_id
      AND lower(email) = contact_email
    LIMIT 1;
  END IF;

  -- If existing contact found, enrich missing phone/whatsapp
  IF existing_contact.id IS NOT NULL THEN
    new_contact_id := existing_contact.id;

    UPDATE public.contacts
    SET
      phone = CASE
        WHEN COALESCE(NULLIF(phone, ''), '') = '' AND COALESCE(NULLIF(contact_phone, ''), '') <> '' THEN contact_phone
        ELSE phone
      END,
      whatsapp = CASE
        WHEN COALESCE(NULLIF(whatsapp, ''), '') = '' AND COALESCE(NULLIF(contact_whatsapp, ''), '') <> '' THEN contact_whatsapp
        ELSE whatsapp
      END,
      first_name = CASE
        WHEN COALESCE(NULLIF(first_name, ''), '') = '' AND COALESCE(NULLIF(contact_first_name, ''), '') <> '' THEN contact_first_name
        ELSE first_name
      END,
      updated_at = now()
    WHERE id = existing_contact.id;
  ELSE
    -- Create new contact
    INSERT INTO public.contacts (
      first_name,
      email,
      phone,
      whatsapp,
      user_id,
      organization_id,
      source
    ) VALUES (
      COALESCE(NULLIF(contact_first_name, ''), 'Lead Formulário'),
      NULLIF(contact_email, ''),
      NULLIF(contact_phone, ''),
      NULLIF(contact_whatsapp, ''),
      form_record.user_id,
      form_record.organization_id,
      'formulario'
    )
    RETURNING id INTO new_contact_id;
  END IF;

  -- Link submission to contact
  UPDATE public.form_submissions
  SET contact_id = new_contact_id
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;