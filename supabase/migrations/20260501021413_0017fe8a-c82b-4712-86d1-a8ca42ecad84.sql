CREATE OR REPLACE FUNCTION public.admin_audit_webhook_events(
  _email text DEFAULT NULL,
  _source text DEFAULT NULL,
  _processed_filter text DEFAULT NULL, -- 'all' | 'processed' | 'pending' | 'error'
  _limit int DEFAULT 200
)
RETURNS TABLE(
  id uuid,
  source text,
  event_type text,
  processed boolean,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz,
  customer_email text,
  customer_name text,
  order_id text,
  order_status text,
  product_name text,
  user_exists boolean,
  user_id uuid,
  organization_id uuid,
  organization_name text,
  has_active_subscription boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  v_email := NULLIF(btrim(lower(_email)), '');

  RETURN QUERY
  WITH filtered AS (
    SELECT
      we.id,
      we.source,
      we.event_type,
      we.processed,
      we.processed_at,
      we.error_message,
      we.created_at,
      lower(COALESCE(
        we.payload->'Customer'->>'email',
        we.payload->'customer'->>'email',
        we.payload->>'customer_email',
        we.payload->'data'->'customer'->>'email',
        we.payload->'buyer'->>'email'
      )) AS customer_email,
      COALESCE(
        we.payload->'Customer'->>'full_name',
        we.payload->'Customer'->>'first_name',
        we.payload->'customer'->>'name',
        we.payload->>'customer_name'
      ) AS customer_name,
      COALESCE(we.payload->>'order_id', we.payload->>'id', we.payload->'data'->>'id') AS order_id,
      COALESCE(we.payload->>'order_status', we.payload->>'status') AS order_status,
      COALESCE(
        we.payload->'Product'->>'product_name',
        we.payload->>'product_name',
        we.payload->'product'->>'name'
      ) AS product_name
    FROM public.webhook_events we
    WHERE (_source IS NULL OR we.source = _source)
      AND (
        _processed_filter IS NULL OR _processed_filter = 'all'
        OR (_processed_filter = 'processed' AND we.processed = true AND COALESCE(we.error_message,'') = '')
        OR (_processed_filter = 'pending' AND we.processed = false)
        OR (_processed_filter = 'error' AND COALESCE(we.error_message,'') <> '')
      )
  )
  SELECT
    f.id, f.source, f.event_type, f.processed, f.processed_at, f.error_message, f.created_at,
    f.customer_email, f.customer_name, f.order_id, f.order_status, f.product_name,
    (au.id IS NOT NULL) AS user_exists,
    au.id AS user_id,
    om.organization_id,
    o.name AS organization_name,
    EXISTS(
      SELECT 1 FROM public.subscriptions s
      WHERE s.organization_id = om.organization_id AND s.status = 'active'
    ) AS has_active_subscription
  FROM filtered f
  LEFT JOIN auth.users au ON lower(au.email) = f.customer_email
  LEFT JOIN LATERAL (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = au.id ORDER BY created_at ASC LIMIT 1
  ) om ON true
  LEFT JOIN public.organizations o ON o.id = om.organization_id
  WHERE (v_email IS NULL OR f.customer_email = v_email OR f.customer_email LIKE '%' || v_email || '%')
  ORDER BY f.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 500));
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_audit_webhook_events(text, text, text, int) TO authenticated;