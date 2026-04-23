
UPDATE storage.buckets SET public = true WHERE id = 'inbox-attachments';

DROP POLICY IF EXISTS "Public read access for inbox-attachments" ON storage.objects;
CREATE POLICY "Public read access for inbox-attachments" ON storage.objects FOR SELECT USING (bucket_id = 'inbox-attachments');
