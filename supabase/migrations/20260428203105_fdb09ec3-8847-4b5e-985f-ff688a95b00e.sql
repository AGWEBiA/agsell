
-- Helper: enqueue webhook deliveries for all active subscriptions matching event
CREATE OR REPLACE FUNCTION public.emit_webhook_event(
  _org_id uuid,
  _event_type text,
  _data jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub RECORD;
  payload jsonb;
  enqueued int := 0;
BEGIN
  IF _org_id IS NULL OR _event_type IS NULL THEN
    RETURN 0;
  END IF;

  payload := jsonb_build_object(
    'event', _event_type,
    'organization_id', _org_id,
    'created_at', now(),
    'data', COALESCE(_data, '{}'::jsonb)
  );

  FOR sub IN
    SELECT id, url, secret
    FROM public.api_webhook_subscriptions
    WHERE organization_id = _org_id
      AND is_active = true
      AND _event_type = ANY(events)
  LOOP
    INSERT INTO public.webhook_deliveries (
      webhook_id, organization_id, url, method, headers, payload,
      status, attempts, max_attempts, next_retry_at
    ) VALUES (
      sub.id, _org_id, sub.url, 'POST',
      jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Webhook-Event', _event_type,
        'X-Webhook-Subscription', sub.id::text
      ),
      payload, 'pending', 0, 5, now()
    );
    enqueued := enqueued + 1;
  END LOOP;

  RETURN enqueued;
END;
$$;

-- Trigger: emit events when message delivery_status changes
CREATE OR REPLACE FUNCTION public.message_status_webhook_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_event text;
  v_data jsonb;
BEGIN
  -- Determine event
  IF TG_OP = 'INSERT' THEN
    -- Only emit message_sent when an outbound message is created
    IF NEW.sender_type IN ('user','agent','bot','system') THEN
      v_event := 'message_sent';
    ELSE
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.delivery_status IS DISTINCT FROM OLD.delivery_status THEN
      v_event := CASE NEW.delivery_status
        WHEN 'delivered' THEN 'delivered'
        WHEN 'read' THEN 'read'
        WHEN 'failed' THEN 'failed'
        ELSE NULL
      END;
    END IF;
    IF v_event IS NULL THEN RETURN NEW; END IF;
  END IF;

  SELECT organization_id INTO v_org_id
  FROM public.conversations WHERE id = NEW.conversation_id;

  IF v_org_id IS NULL THEN RETURN NEW; END IF;

  v_data := jsonb_build_object(
    'message_id', NEW.id,
    'conversation_id', NEW.conversation_id,
    'external_id', NEW.external_id,
    'delivery_status', NEW.delivery_status,
    'message_type', NEW.message_type,
    'sender_type', NEW.sender_type,
    'created_at', NEW.created_at
  );

  PERFORM public.emit_webhook_event(v_org_id, v_event, v_data);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_webhook_emit_insert ON public.messages;
CREATE TRIGGER messages_webhook_emit_insert
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.message_status_webhook_trigger();

DROP TRIGGER IF EXISTS messages_webhook_emit_update ON public.messages;
CREATE TRIGGER messages_webhook_emit_update
AFTER UPDATE OF delivery_status ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.message_status_webhook_trigger();

-- Policy so org members can read their delivery logs (already exists for SELECT)
-- Add INSERT/UPDATE policies are not needed (service role handles it)

-- Cron: process pending deliveries every minute
SELECT cron.schedule(
  'process-webhook-deliveries',
  '* * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://rcxrkvwxlzwzrllwdwgz.supabase.co/functions/v1/process-webhook-deliveries',
    headers := jsonb_build_object('Content-Type','application/json','X-Internal-Cron','true'),
    body := '{}'::jsonb
  );
  $cron$
) WHERE NOT EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-webhook-deliveries'
);
