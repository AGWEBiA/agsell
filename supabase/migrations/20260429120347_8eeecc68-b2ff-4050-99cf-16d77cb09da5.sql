UPDATE public.messages
SET delivery_status = 'delivered'
WHERE sender_type = 'contact'
  AND delivery_status = 'sent';