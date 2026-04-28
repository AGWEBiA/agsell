-- Trigger: when a tag is added to a contact, enqueue matching tag_added automations
CREATE OR REPLACE FUNCTION public.enqueue_tag_added_automations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tag_name text;
  v_org_id uuid;
  v_contact_id uuid;
  auto_rec RECORD;
  v_execution_id uuid;
  v_actions jsonb;
BEGIN
  v_contact_id := NEW.contact_id;

  -- Resolve tag and org
  SELECT t.name, c.organization_id
    INTO v_tag_name, v_org_id
  FROM public.tags t
  JOIN public.contacts c ON c.id = NEW.contact_id
  WHERE t.id = NEW.tag_id
  LIMIT 1;

  IF v_tag_name IS NULL OR v_org_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find active tag_added automations whose configured tag matches (or is empty/wildcard)
  FOR auto_rec IN
    SELECT a.id, a.actions, a.trigger_config
    FROM public.automations a
    WHERE a.is_active = true
      AND a.trigger_type = 'tag_added'
      AND a.organization_id = v_org_id
      AND (
        COALESCE(NULLIF(btrim(a.trigger_config->>'tag_name'), ''), '') = ''
        OR lower(btrim(a.trigger_config->>'tag_name')) = lower(btrim(v_tag_name))
      )
  LOOP
    v_actions := COALESCE(auto_rec.actions, '[]'::jsonb);

    -- Create execution record (pending)
    INSERT INTO public.automation_executions (
      automation_id, contact_id, trigger_event, status, total_steps, current_step
    ) VALUES (
      auto_rec.id, v_contact_id, 'tag_added', 'pending',
      jsonb_array_length(v_actions), 0
    )
    RETURNING id INTO v_execution_id;

    -- Schedule immediate processing via existing cron pipeline
    INSERT INTO public.automation_scheduled_steps (
      automation_id, execution_id, contact_id, organization_id,
      current_step, scheduled_at, status, actions
    ) VALUES (
      auto_rec.id, v_execution_id, v_contact_id, v_org_id,
      0, now(), 'pending', v_actions
    );

    -- Increment counter
    UPDATE public.automations
       SET executions_count = COALESCE(executions_count, 0) + 1
     WHERE id = auto_rec.id;
  END LOOP;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block tag insertion on automation enqueue failure
  RAISE WARNING 'enqueue_tag_added_automations failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contact_tags_enqueue_automations ON public.contact_tags;
CREATE TRIGGER contact_tags_enqueue_automations
AFTER INSERT ON public.contact_tags
FOR EACH ROW EXECUTE FUNCTION public.enqueue_tag_added_automations();