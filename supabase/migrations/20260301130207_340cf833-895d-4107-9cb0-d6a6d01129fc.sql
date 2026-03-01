
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
