-- ================================================
-- Create Storage Bucket for Book Images
-- ================================================
-- This script creates a public storage bucket for extracted book images

-- Create book-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-images',
  'book-images',
  true,
  10485760, -- 10MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for book-images bucket
CREATE POLICY "Users can upload their own book images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'book-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own book images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'book-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own book images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'book-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (images are public)
CREATE POLICY "Public read access for book images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'book-images');
