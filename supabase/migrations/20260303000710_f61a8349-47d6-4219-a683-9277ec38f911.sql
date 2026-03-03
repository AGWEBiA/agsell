-- Add media support to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text',
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_mime_type TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Create storage bucket for inbox attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('inbox-attachments', 'inbox-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for inbox attachments
CREATE POLICY "Authenticated users can upload inbox attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'inbox-attachments');

CREATE POLICY "Anyone can view inbox attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'inbox-attachments');

CREATE POLICY "Users can delete their own inbox attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'inbox-attachments');