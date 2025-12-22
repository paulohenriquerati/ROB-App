-- Enable Row Level Security on all tables
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;

-- Books policies - users can only access their own books
CREATE POLICY "Users can view their own books" ON books FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own books" ON books FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own books" ON books FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own books" ON books FOR DELETE USING (auth.uid() = user_id);

-- Reading sessions policies
CREATE POLICY "Users can view their own reading sessions" ON reading_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reading sessions" ON reading_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reading sessions" ON reading_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reading sessions" ON reading_sessions FOR DELETE USING (auth.uid() = user_id);

-- Book notes policies
CREATE POLICY "Users can view their own book notes" ON book_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own book notes" ON book_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own book notes" ON book_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own book notes" ON book_notes FOR DELETE USING (auth.uid() = user_id);

-- Highlights policies
CREATE POLICY "Users can view their own highlights" ON highlights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own highlights" ON highlights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own highlights" ON highlights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own highlights" ON highlights FOR DELETE USING (auth.uid() = user_id);

-- Shared quotes policies - anyone can view, only owners can modify
CREATE POLICY "Anyone can view shared quotes" ON shared_quotes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own quotes" ON shared_quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quotes" ON shared_quotes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quotes" ON shared_quotes FOR DELETE USING (auth.uid() = user_id);

-- Reviews policies - anyone can view, only owners can modify
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view their own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- Reading stats policies
CREATE POLICY "Users can view their own stats" ON reading_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own stats" ON reading_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stats" ON reading_stats FOR UPDATE USING (auth.uid() = user_id);

-- Quote likes policies
CREATE POLICY "Anyone can view quote likes" ON quote_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes" ON quote_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON quote_likes FOR DELETE USING (auth.uid() = user_id);

-- Review likes policies
CREATE POLICY "Anyone can view review likes" ON review_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes" ON review_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON review_likes FOR DELETE USING (auth.uid() = user_id);
