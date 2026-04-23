INSERT INTO storage.buckets (id, name, public) VALUES ('inbox-attachments', 'inbox-attachments', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for inbox-attachments" ON storage.objects FOR SELECT USING (bucket_id = 'inbox-attachments');

CREATE POLICY "Authenticated users can upload to inbox-attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'inbox-attachments');

CREATE POLICY "Authenticated users can delete from inbox-attachments" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'inbox-attachments');