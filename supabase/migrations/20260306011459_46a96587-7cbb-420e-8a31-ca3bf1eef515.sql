
-- Fix and recreate unification function
CREATE OR REPLACE FUNCTION public.unify_sac_contacts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  dup RECORD;
  merged_contacts int := 0;
  merged_convs_count int := 0;
  kept_id uuid;
  remove_id uuid;
  tmp_count int;
BEGIN
  FOR dup IN
    WITH normalized AS (
      SELECT 
        c.id, c.organization_id, c.first_name, c.source, c.phone, c.whatsapp,
        RIGHT(regexp_replace(COALESCE(c.whatsapp, c.phone, ''), '\D', '', 'g'), 10) AS tail10
      FROM contacts c
      WHERE COALESCE(c.phone, c.whatsapp) IS NOT NULL
        AND LENGTH(regexp_replace(COALESCE(c.whatsapp, c.phone, ''), '\D', '', 'g')) >= 10
    ),
    duplicates AS (
      SELECT 
        n1.id AS real_id, n2.id AS dup_id, n1.organization_id,
        n1.first_name AS real_name, n2.first_name AS dup_name,
        n1.source AS real_source, n2.source AS dup_source,
        n1.whatsapp AS real_whatsapp, n2.whatsapp AS dup_whatsapp,
        ROW_NUMBER() OVER (PARTITION BY LEAST(n1.id, n2.id), GREATEST(n1.id, n2.id)) as rn
      FROM normalized n1
      JOIN normalized n2 ON n1.organization_id = n2.organization_id 
        AND n1.id < n2.id AND n1.tail10 = n2.tail10
    )
    SELECT * FROM duplicates WHERE rn = 1
  LOOP
    IF dup.real_source = 'whatsapp_inbound' AND dup.dup_source != 'whatsapp_inbound' THEN
      kept_id := dup.dup_id; remove_id := dup.real_id;
    ELSIF dup.dup_source = 'whatsapp_inbound' AND dup.real_source != 'whatsapp_inbound' THEN
      kept_id := dup.real_id; remove_id := dup.dup_id;
    ELSIF dup.real_name ~ '^\+?\d[\d\s\-\.]+$' AND dup.dup_name !~ '^\+?\d[\d\s\-\.]+$' THEN
      kept_id := dup.dup_id; remove_id := dup.real_id;
    ELSIF dup.dup_name ~ '^\+?\d[\d\s\-\.]+$' AND dup.real_name !~ '^\+?\d[\d\s\-\.]+$' THEN
      kept_id := dup.real_id; remove_id := dup.dup_id;
    ELSE
      kept_id := dup.real_id; remove_id := dup.dup_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM contacts WHERE id = remove_id) THEN CONTINUE; END IF;

    UPDATE conversations SET contact_id = kept_id WHERE contact_id = remove_id;
    UPDATE contacts SET whatsapp = (SELECT COALESCE(whatsapp, phone) FROM contacts WHERE id = remove_id)
    WHERE id = kept_id AND (whatsapp IS NULL OR whatsapp = '');
    UPDATE deals SET contact_id = kept_id WHERE contact_id = remove_id;
    UPDATE activities SET contact_id = kept_id WHERE contact_id = remove_id;
    UPDATE tasks SET contact_id = kept_id WHERE contact_id = remove_id;
    DELETE FROM contacts WHERE id = remove_id;
    merged_contacts := merged_contacts + 1;
  END LOOP;

  -- Merge duplicate conversations (same contact + channel + org)
  FOR dup IN
    SELECT contact_id, channel, organization_id,
           array_agg(id ORDER BY last_message_at DESC NULLS LAST) as conv_ids
    FROM conversations WHERE contact_id IS NOT NULL
    GROUP BY contact_id, channel, organization_id HAVING count(*) > 1
  LOOP
    FOR i IN 2..array_length(dup.conv_ids, 1) LOOP
      UPDATE messages SET conversation_id = dup.conv_ids[1] WHERE conversation_id = dup.conv_ids[i];
      UPDATE conversation_notes SET conversation_id = dup.conv_ids[1] WHERE conversation_id = dup.conv_ids[i];
      DELETE FROM conversations WHERE id = dup.conv_ids[i];
      merged_convs_count := merged_convs_count + 1;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object('contacts_merged', merged_contacts, 'conversations_unified', merged_convs_count);
END;
$$;

SELECT public.unify_sac_contacts();
