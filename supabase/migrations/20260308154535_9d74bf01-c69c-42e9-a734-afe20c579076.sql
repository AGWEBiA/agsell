
-- Create a secure function to look up a ticket by protocol number (replaces the removed anon policy)
CREATE OR REPLACE FUNCTION public.get_ticket_by_protocol(_protocol text)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  status text,
  priority text,
  category text,
  protocol_number text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.title, t.description, t.status, t.priority, t.category, t.protocol_number, t.created_at, t.updated_at
  FROM public.support_tickets t
  WHERE t.protocol_number = _protocol
  LIMIT 1;
$$;
