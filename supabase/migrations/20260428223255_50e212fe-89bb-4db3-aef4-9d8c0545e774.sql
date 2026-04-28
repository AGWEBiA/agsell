-- Trigger function: tag_added / tag_removed on contact_tags
CREATE OR REPLACE FUNCTION public.contact_tags_webhook_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_tag_name text;
  v_tag_color text;
  v_contact_id uuid;
  v_event text;
  v_data jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event := 'tag_added';
    v_contact_id := NEW.contact_id;
    SELECT t.name, t.color INTO v_tag_name, v_tag_color FROM public.tags t WHERE t.id = NEW.tag_id;
    SELECT c.organization_id INTO v_org_id FROM public.contacts c WHERE c.id = NEW.contact_id;
    v_data := jsonb_build_object(
      'contact_id', NEW.contact_id,
      'tag_id', NEW.tag_id,
      'tag_name', v_tag_name,
      'tag_color', v_tag_color,
      'created_at', now()
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_event := 'tag_removed';
    v_contact_id := OLD.contact_id;
    SELECT t.name, t.color INTO v_tag_name, v_tag_color FROM public.tags t WHERE t.id = OLD.tag_id;
    SELECT c.organization_id INTO v_org_id FROM public.contacts c WHERE c.id = OLD.contact_id;
    v_data := jsonb_build_object(
      'contact_id', OLD.contact_id,
      'tag_id', OLD.tag_id,
      'tag_name', v_tag_name,
      'tag_color', v_tag_color,
      'removed_at', now()
    );
  END IF;

  IF v_org_id IS NOT NULL THEN
    PERFORM public.emit_webhook_event(v_org_id, v_event, v_data);
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'contact_tags_webhook_trigger failed: %', SQLERRM;
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS contact_tags_webhook_events ON public.contact_tags;
CREATE TRIGGER contact_tags_webhook_events
AFTER INSERT OR DELETE ON public.contact_tags
FOR EACH ROW EXECUTE FUNCTION public.contact_tags_webhook_trigger();

-- Trigger function: tag_created / tag_deleted on tags
CREATE OR REPLACE FUNCTION public.tags_webhook_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event text;
  v_data jsonb;
  v_org_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event := 'tag_created';
    v_org_id := NEW.organization_id;
    v_data := jsonb_build_object(
      'tag_id', NEW.id,
      'tag_name', NEW.name,
      'tag_color', NEW.color,
      'created_at', NEW.created_at
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_event := 'tag_deleted';
    v_org_id := OLD.organization_id;
    v_data := jsonb_build_object(
      'tag_id', OLD.id,
      'tag_name', OLD.name,
      'tag_color', OLD.color,
      'deleted_at', now()
    );
  END IF;

  IF v_org_id IS NOT NULL THEN
    PERFORM public.emit_webhook_event(v_org_id, v_event, v_data);
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'tags_webhook_trigger failed: %', SQLERRM;
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS tags_webhook_events ON public.tags;
CREATE TRIGGER tags_webhook_events
AFTER INSERT OR DELETE ON public.tags
FOR EACH ROW EXECUTE FUNCTION public.tags_webhook_trigger();