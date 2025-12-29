-- ============================================
-- Audio Processing Status Migration
-- Add audio processing status tracking for AAX conversion
-- ============================================

-- 1. Add processing status field
ALTER TABLE books ADD COLUMN IF NOT EXISTS audio_processing_status TEXT 
  CHECK (audio_processing_status IN ('uploading', 'processing', 'ready', 'failed'));

-- 2. Add original filename for reference
ALTER TABLE books ADD COLUMN IF NOT EXISTS audio_original_filename TEXT;

-- 3. Add narrator field (common in audiobooks)
ALTER TABLE books ADD COLUMN IF NOT EXISTS audio_narrator TEXT;

-- 4. Create index for processing status queries
CREATE INDEX IF NOT EXISTS idx_books_audio_processing_status 
  ON books(audio_processing_status) 
  WHERE audio_processing_status IS NOT NULL;

-- ============================================
-- Verification
-- ============================================
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'books';
