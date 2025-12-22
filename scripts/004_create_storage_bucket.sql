-- ============================================
-- Supabase Storage Bucket Configuration
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Create the 'books' storage bucket for PDF files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'books',
  'books',
  true,  -- Public bucket for easy PDF access
  52428800,  -- 50MB max file size
  ARRAY['application/pdf']::text[]  -- Only allow PDF files
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Enable RLS on storage.objects (should already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow authenticated users to upload files to their own folder
DROP POLICY IF EXISTS "Users can upload PDFs to their folder" ON storage.objects;
CREATE POLICY "Users can upload PDFs to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'books' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy: Allow anyone to read/download PDFs (public bucket)
DROP POLICY IF EXISTS "Anyone can read PDFs" ON storage.objects;
CREATE POLICY "Anyone can read PDFs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'books');

-- 5. Policy: Allow users to update their own files
DROP POLICY IF EXISTS "Users can update their own PDFs" ON storage.objects;
CREATE POLICY "Users can update their own PDFs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'books' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'books' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Policy: Allow users to delete their own files
DROP POLICY IF EXISTS "Users can delete their own PDFs" ON storage.objects;
CREATE POLICY "Users can delete their own PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'books' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- Verification: Run this to check bucket exists
-- ============================================
-- SELECT * FROM storage.buckets WHERE id = 'books';
