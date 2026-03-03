
-- Add max_email_domains column to plans
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_email_domains integer NOT NULL DEFAULT 1;

-- Update plan limits considering Resend costs:
-- Resend: ~$0.28/1000 emails, each domain = 1 slot (removing inbound subdomain)
-- Starter R$197: 1 domain, 2000 emails (~$0.56 cost)
-- Professional R$397: 3 domains, 10000 emails (~$2.80 cost)  
-- Enterprise R$797: 10 domains, 50000 emails (~$14 cost)
-- Agência R$997: unlimited domains, 100000 emails (~$28 cost)

UPDATE public.plans SET max_email_domains = 1 WHERE slug = 'starter';
UPDATE public.plans SET max_email_domains = 3 WHERE slug = 'professional';
UPDATE public.plans SET max_email_domains = 10 WHERE slug = 'enterprise';
UPDATE public.plans SET max_email_domains = -1 WHERE slug = 'agencia';
UPDATE public.plans SET max_email_domains = 0 WHERE slug = 'free';

-- Update check_plan_limit to support email_domains resource
CREATE OR REPLACE FUNCTION public.check_plan_limit(_org_id uuid, _resource text, _current_count integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    plan_record RECORD;
    actual_count INTEGER;
    max_limit INTEGER;
BEGIN
    SELECT p.* INTO plan_record
    FROM organizations o
    JOIN plans p ON o.plan_id = p.id
    WHERE o.id = _org_id;
    
    IF plan_record IS NULL THEN
        RETURN jsonb_build_object('allowed', true, 'message', 'No plan restrictions');
    END IF;
    
    CASE _resource
        WHEN 'users' THEN max_limit := plan_record.max_users;
        WHEN 'contacts' THEN max_limit := plan_record.max_contacts;
        WHEN 'emails' THEN max_limit := plan_record.max_emails_per_month;
        WHEN 'whatsapp' THEN max_limit := plan_record.max_whatsapp_messages;
        WHEN 'automations' THEN max_limit := plan_record.max_automations;
        WHEN 'forms' THEN max_limit := plan_record.max_forms;
        WHEN 'ai_requests' THEN max_limit := plan_record.max_ai_requests_per_month;
        WHEN 'email_domains' THEN max_limit := plan_record.max_email_domains;
        ELSE RETURN jsonb_build_object('allowed', true, 'message', 'Unknown resource');
    END CASE;
    
    IF max_limit = -1 THEN
        RETURN jsonb_build_object('allowed', true, 'limit', -1, 'current', COALESCE(_current_count, 0));
    END IF;
    
    RETURN jsonb_build_object(
        'allowed', COALESCE(_current_count, 0) < max_limit,
        'limit', max_limit,
        'current', COALESCE(_current_count, 0),
        'remaining', max_limit - COALESCE(_current_count, 0)
    );
END;
$function$;
