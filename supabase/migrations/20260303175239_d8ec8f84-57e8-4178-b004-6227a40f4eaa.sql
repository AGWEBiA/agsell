
-- Merge duplicate conversations: keep the one with the most recent message, move messages from others
DO $$
DECLARE
  dup RECORD;
  keep_id UUID;
  remove_ids UUID[];
BEGIN
  -- Find groups of conversations with same contact_id + channel + organization_id that have duplicates
  FOR dup IN
    SELECT contact_id, channel, organization_id, array_agg(id ORDER BY last_message_at DESC NULLS LAST, created_at DESC) AS conv_ids
    FROM conversations
    WHERE contact_id IS NOT NULL
    GROUP BY contact_id, channel, organization_id
    HAVING COUNT(*) > 1
  LOOP
    keep_id := dup.conv_ids[1];
    remove_ids := dup.conv_ids[2:];

    -- Move all messages from duplicate conversations to the kept one
    UPDATE messages SET conversation_id = keep_id WHERE conversation_id = ANY(remove_ids);

    -- Move conversation notes
    UPDATE conversation_notes SET conversation_id = keep_id WHERE conversation_id = ANY(remove_ids);

    -- Update the kept conversation's last_message_at
    UPDATE conversations SET last_message_at = GREATEST(
      (SELECT MAX(created_at) FROM messages WHERE conversation_id = keep_id),
      conversations.last_message_at
    ) WHERE id = keep_id;

    -- Delete the duplicate conversations
    DELETE FROM conversations WHERE id = ANY(remove_ids);

    RAISE NOTICE 'Merged % duplicate conversations for contact % channel %', array_length(remove_ids, 1), dup.contact_id, dup.channel;
  END LOOP;
END $$;

-- Also merge conversations that match by whatsapp_sender_id in metadata but have NULL contact_id
-- Link them to the correct contact
DO $$
DECLARE
  orphan RECORD;
  matched_contact_id UUID;
  matched_conv_id UUID;
BEGIN
  FOR orphan IN
    SELECT c.id, c.organization_id, c.channel, c.metadata->>'whatsapp_sender_id' AS sender_id
    FROM conversations c
    WHERE c.contact_id IS NULL
      AND c.channel = 'whatsapp'
      AND c.metadata->>'whatsapp_sender_id' IS NOT NULL
  LOOP
    -- Find a contact matching this phone
    SELECT ct.id INTO matched_contact_id
    FROM contacts ct
    WHERE ct.organization_id = orphan.organization_id
      AND (
        REGEXP_REPLACE(ct.whatsapp, '\D', '', 'g') = orphan.sender_id
        OR REGEXP_REPLACE(ct.phone, '\D', '', 'g') = orphan.sender_id
      )
    LIMIT 1;

    IF matched_contact_id IS NOT NULL THEN
      -- Check if there's already a conversation for this contact+channel
      SELECT id INTO matched_conv_id
      FROM conversations
      WHERE contact_id = matched_contact_id
        AND channel = orphan.channel
        AND organization_id = orphan.organization_id
      LIMIT 1;

      IF matched_conv_id IS NOT NULL AND matched_conv_id != orphan.id THEN
        -- Merge: move messages and delete orphan
        UPDATE messages SET conversation_id = matched_conv_id WHERE conversation_id = orphan.id;
        UPDATE conversation_notes SET conversation_id = matched_conv_id WHERE conversation_id = orphan.id;
        DELETE FROM conversations WHERE id = orphan.id;
      ELSE
        -- Just assign the contact
        UPDATE conversations SET contact_id = matched_contact_id WHERE id = orphan.id;
      END IF;
    END IF;
  END LOOP;
END $$;
