-- ============================================
-- Audio Fields Migration
-- Add audio support fields to books table
-- ============================================

-- 1. Add is_audiobook flag
ALTER TABLE books ADD COLUMN IF NOT EXISTS is_audiobook BOOLEAN DEFAULT FALSE;

-- 2. Add audio source type (file upload or external link)
ALTER TABLE books ADD COLUMN IF NOT EXISTS audio_source_type TEXT CHECK (audio_source_type IN ('file', 'link'));

-- 3. Add audio URL (storage URL or external link)
ALTER TABLE books ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- 4. Add audio duration in seconds
ALTER TABLE books ADD COLUMN IF NOT EXISTS audio_duration INTEGER;

-- 5. Add last played position for resume functionality
ALTER TABLE books ADD COLUMN IF NOT EXISTS last_played_position INTEGER DEFAULT 0;

-- 6. Create index for audiobooks for faster filtering
CREATE INDEX IF NOT EXISTS idx_books_is_audiobook ON books(is_audiobook) WHERE is_audiobook = TRUE;

-- ============================================
-- Verification
-- ============================================
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'books';
