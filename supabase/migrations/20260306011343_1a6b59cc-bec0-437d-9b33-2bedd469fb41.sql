
-- Function to unify SAC contacts: merge auto-created contacts into real ones
-- and reassign their conversations
CREATE OR REPLACE FUNCTION public.unify_sac_contacts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  auto_contact RECORD;
  real_contact RECORD;
  merged_count int := 0;
  reassigned_convs int := 0;
  orphan_convs_fixed int := 0;
BEGIN
  -- Step 1: Find auto-created contacts and try to match with real contacts
  FOR auto_contact IN
    SELECT c.id, c.organization_id, c.phone, c.whatsapp, c.first_name
    FROM contacts c
    WHERE c.source = 'whatsapp_inbound'
       OR (c.first_name ~ '^\+?\d[\d\s\-]+$' AND c.source IS NOT DISTINCT FROM 'whatsapp_inbound')
  LOOP
    -- Try to find a "real" contact in the same org with matching phone
    SELECT c.id INTO real_contact
    FROM contacts c
    WHERE c.organization_id = auto_contact.organization_id
      AND c.id != auto_contact.id
      AND c.source IS DISTINCT FROM 'whatsapp_inbound'
      AND c.first_name !~ '^\+?\d[\d\s\-]+$'
      AND (
        -- Match by normalized phone digits (last 10-11 chars)
        RIGHT(regexp_replace(COALESCE(c.phone,''), '\D', '', 'g'), 11) = RIGHT(regexp_replace(COALESCE(auto_contact.phone,''), '\D', '', 'g'), 11)
        OR RIGHT(regexp_replace(COALESCE(c.whatsapp,''), '\D', '', 'g'), 11) = RIGHT(regexp_replace(COALESCE(auto_contact.whatsapp,''), '\D', '', 'g'), 11)
        OR RIGHT(regexp_replace(COALESCE(c.phone,''), '\D', '', 'g'), 11) = RIGHT(regexp_replace(COALESCE(auto_contact.whatsapp,''), '\D', '', 'g'), 11)
        OR RIGHT(regexp_replace(COALESCE(c.whatsapp,''), '\D', '', 'g'), 11) = RIGHT(regexp_replace(COALESCE(auto_contact.phone,''), '\D', '', 'g'), 11)
      )
      AND LENGTH(regexp_replace(COALESCE(c.phone, c.whatsapp, ''), '\D', '', 'g')) >= 10
    LIMIT 1;

    IF real_contact.id IS NOT NULL THEN
      -- Reassign all conversations from auto-created to real contact
      UPDATE conversations SET contact_id = real_contact.id WHERE contact_id = auto_contact.id;
      GET DIAGNOSTICS reassigned_convs = ROW_COUNT;
      
      -- Reassign messages' related data if any
      UPDATE conversation_notes SET conversation_id = conversation_notes.conversation_id WHERE FALSE; -- no-op placeholder
      
      -- Update real contact's whatsapp if empty
      UPDATE contacts SET whatsapp = auto_contact.whatsapp
      WHERE id = real_contact.id AND (whatsapp IS NULL OR whatsapp = '');
      
      -- Delete the auto-created duplicate
      DELETE FROM contacts WHERE id = auto_contact.id;
      
      merged_count := merged_count + 1;
    END IF;
  END LOOP;

  -- Step 2: Fix conversations that have contact_id but the contact's name is just a phone number
  -- Update those contacts to have proper whatsapp field populated
  UPDATE contacts SET whatsapp = regexp_replace(first_name, '\D', '', 'g')
  WHERE source = 'whatsapp_inbound'
    AND (whatsapp IS NULL OR whatsapp = '')
    AND first_name ~ '^\+?\d[\d\s\-]+$';

  -- Step 3: Merge duplicate conversations for the same contact+channel
  -- Keep the one with the most recent message, reassign messages from older ones
  FOR auto_contact IN
    SELECT contact_id, channel, organization_id, 
           array_agg(id ORDER BY last_message_at DESC NULLS LAST) as conv_ids
    FROM conversations
    WHERE contact_id IS NOT NULL
    GROUP BY contact_id, channel, organization_id
    HAVING count(*) > 1
  LOOP
    -- Keep first (most recent), merge rest into it
    FOR i IN 2..array_length(auto_contact.conv_ids, 1) LOOP
      UPDATE messages SET conversation_id = auto_contact.conv_ids[1]
      WHERE conversation_id = auto_contact.conv_ids[i];
      
      UPDATE conversation_notes SET conversation_id = auto_contact.conv_ids[1]
      WHERE conversation_id = auto_contact.conv_ids[i];
      
      DELETE FROM conversations WHERE id = auto_contact.conv_ids[i];
      
      orphan_convs_fixed := orphan_convs_fixed + 1;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'contacts_merged', merged_count,
    'duplicate_conversations_merged', orphan_convs_fixed
  );
END;
$$;

-- Execute the unification now
SELECT public.unify_sac_contacts();
