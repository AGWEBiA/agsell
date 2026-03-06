
-- Update unify function to handle Brazilian 8-to-9 digit mobile migration
CREATE OR REPLACE FUNCTION public.normalize_br_phone(phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  digits text;
  local_digits text;
  ddd text;
  subscriber text;
BEGIN
  digits := regexp_replace(COALESCE(phone, ''), '\D', '', 'g');
  IF LENGTH(digits) < 10 THEN RETURN digits; END IF;
  
  -- Strip country code 55
  IF digits LIKE '55%' AND LENGTH(digits) > 11 THEN
    local_digits := SUBSTRING(digits FROM 3);
  ELSE
    local_digits := digits;
  END IF;
  
  -- Extract DDD (first 2 digits) and subscriber (last 8 digits, ignoring optional 9th digit prefix)
  ddd := LEFT(local_digits, 2);
  subscriber := RIGHT(local_digits, 8);
  
  RETURN ddd || subscriber;
END;
$$;

-- Re-run unification with improved matching
DO $$
DECLARE
  dup RECORD;
  kept_id uuid;
  remove_id uuid;
  merged int := 0;
BEGIN
  FOR dup IN
    WITH normalized AS (
      SELECT c.id, c.organization_id, c.first_name, c.source,
        c.phone, c.whatsapp,
        public.normalize_br_phone(COALESCE(c.whatsapp, c.phone, '')) AS br_key
      FROM contacts c
      WHERE COALESCE(c.phone, c.whatsapp) IS NOT NULL
        AND LENGTH(regexp_replace(COALESCE(c.whatsapp, c.phone, ''), '\D', '', 'g')) >= 10
    ),
    dups AS (
      SELECT n1.id AS id1, n2.id AS id2, n1.organization_id,
        n1.first_name AS name1, n2.first_name AS name2,
        n1.source AS src1, n2.source AS src2,
        ROW_NUMBER() OVER (PARTITION BY LEAST(n1.id, n2.id), GREATEST(n1.id, n2.id)) as rn
      FROM normalized n1
      JOIN normalized n2 ON n1.organization_id = n2.organization_id 
        AND n1.id < n2.id AND n1.br_key = n2.br_key
        AND LENGTH(n1.br_key) >= 10
    )
    SELECT * FROM dups WHERE rn = 1
  LOOP
    IF dup.src1 = 'whatsapp_inbound' AND dup.src2 != 'whatsapp_inbound' THEN
      kept_id := dup.id2; remove_id := dup.id1;
    ELSIF dup.src2 = 'whatsapp_inbound' AND dup.src1 != 'whatsapp_inbound' THEN
      kept_id := dup.id1; remove_id := dup.id2;
    ELSIF dup.name1 ~ '^\+?\d[\d\s\-\.]+$' AND dup.name2 !~ '^\+?\d[\d\s\-\.]+$' THEN
      kept_id := dup.id2; remove_id := dup.id1;
    ELSIF dup.name2 ~ '^\+?\d[\d\s\-\.]+$' AND dup.name1 !~ '^\+?\d[\d\s\-\.]+$' THEN
      kept_id := dup.id1; remove_id := dup.id2;
    ELSE
      kept_id := dup.id1; remove_id := dup.id2;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM contacts WHERE id = remove_id) THEN CONTINUE; END IF;

    UPDATE conversations SET contact_id = kept_id WHERE contact_id = remove_id;
    UPDATE contacts SET whatsapp = (SELECT COALESCE(whatsapp, phone) FROM contacts WHERE id = remove_id)
    WHERE id = kept_id AND (whatsapp IS NULL OR whatsapp = '');
    UPDATE deals SET contact_id = kept_id WHERE contact_id = remove_id;
    UPDATE activities SET contact_id = kept_id WHERE contact_id = remove_id;
    UPDATE tasks SET contact_id = kept_id WHERE contact_id = remove_id;
    DELETE FROM contacts WHERE id = remove_id;
    merged := merged + 1;
  END LOOP;

  -- Merge duplicate conversations
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
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Contacts merged: %', merged;
END;
$$;
