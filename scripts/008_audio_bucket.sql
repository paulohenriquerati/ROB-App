-- ============================================
-- Audiobooks Storage Bucket Configuration
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Create the 'audiobooks' storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audiobooks',
  'audiobooks',
  true,  -- Public bucket for easy audio access
  524288000,  -- 500MB max file size (audiobooks are large)
  ARRAY[
    'audio/mpeg',       -- MP3
    'audio/mp4',        -- M4A, M4B
    'audio/x-m4b',      -- M4B (Audiobook)
    'audio/x-m4a',      -- M4A variant
    'audio/wav',        -- WAV
    'audio/ogg',        -- OGG
    'audio/webm',       -- WebM audio
    'audio/flac',       -- FLAC
    'audio/vnd.audible.aax',  -- AAX (Audible)
    'application/octet-stream' -- Fallback for unknown types
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Policy: Allow authenticated users to upload audio to their folder
DROP POLICY IF EXISTS "Users can upload audio to their folder" ON storage.objects;
CREATE POLICY "Users can upload audio to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audiobooks' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Policy: Allow anyone to read/stream audio (public bucket)
DROP POLICY IF EXISTS "Anyone can read audio" ON storage.objects;
CREATE POLICY "Anyone can read audio"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'audiobooks');

-- 4. Policy: Allow users to update their own audio files
DROP POLICY IF EXISTS "Users can update their own audio" ON storage.objects;
CREATE POLICY "Users can update their own audio"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'audiobooks' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'audiobooks' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: Allow users to delete their own audio files
DROP POLICY IF EXISTS "Users can delete their own audio" ON storage.objects;
CREATE POLICY "Users can delete their own audio"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audiobooks' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- Verification
-- ============================================
-- SELECT * FROM storage.buckets WHERE id = 'audiobooks';
