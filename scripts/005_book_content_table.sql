-- ================================================
-- Book Content Table for Transcribed PDFs
-- ================================================
-- This table stores the transcribed content from PDFs
-- with preserved structure, images, and layout information

-- Add transcription status columns to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS transcription_status TEXT 
  DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed'));
ALTER TABLE books ADD COLUMN IF NOT EXISTS transcription_progress INTEGER DEFAULT 0;

-- Create book_content table for storing transcribed pages
CREATE TABLE IF NOT EXISTS book_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  -- Structured content with text blocks, images, and positions
  content JSONB NOT NULL DEFAULT '{"blocks": []}',
  -- Plain text for full-text search
  text_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, page_number)
);

-- Create book_images table for tracking extracted images
CREATE TABLE IF NOT EXISTS book_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  bounds JSONB, -- { x, y, width, height }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_book_content_book_id ON book_content(book_id);
CREATE INDEX IF NOT EXISTS idx_book_content_page ON book_content(book_id, page_number);
CREATE INDEX IF NOT EXISTS idx_book_images_book_id ON book_images(book_id);
CREATE INDEX IF NOT EXISTS idx_books_transcription_status ON books(transcription_status);

-- Full-text search index on transcribed content
CREATE INDEX IF NOT EXISTS idx_book_content_text_search 
  ON book_content USING gin(to_tsvector('portuguese', COALESCE(text_content, '')));

-- Enable RLS (Row Level Security)
ALTER TABLE book_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for book_content
CREATE POLICY "Users can view their own book content" ON book_content
  FOR SELECT USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert their own book content" ON book_content
  FOR INSERT WITH CHECK (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own book content" ON book_content
  FOR UPDATE USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own book content" ON book_content
  FOR DELETE USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );

-- RLS Policies for book_images
CREATE POLICY "Users can view their own book images" ON book_images
  FOR SELECT USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert their own book images" ON book_images
  FOR INSERT WITH CHECK (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own book images" ON book_images
  FOR DELETE USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );
