-- Note: This seed data uses a placeholder UUID for demo purposes
-- In production, these would be tied to actual user accounts
-- For now, we'll create public sample data that anyone can view

-- Insert sample shared quotes (publicly visible)
INSERT INTO shared_quotes (book_title, author, text, page, shared_by, user_id, likes, created_at)
VALUES 
  ('The Design of Everyday Things', 'Don Norman', 'Good design is actually a lot harder to notice than poor design, in part because good designs fit our needs so well that the design is invisible.', 45, 'Sarah M.', '00000000-0000-0000-0000-000000000001', 24, NOW() - INTERVAL '2 days'),
  ('Thinking, Fast and Slow', 'Daniel Kahneman', 'Nothing in life is as important as you think it is, while you are thinking about it.', 156, 'Alex K.', '00000000-0000-0000-0000-000000000001', 47, NOW() - INTERVAL '3 days'),
  ('Atomic Habits', 'James Clear', 'You do not rise to the level of your goals. You fall to the level of your systems.', 27, 'Jamie L.', '00000000-0000-0000-0000-000000000001', 89, NOW() - INTERVAL '1 day'),
  ('Clean Code', 'Robert C. Martin', 'Truth can only be found in one place: the code.', 89, 'Michael C.', '00000000-0000-0000-0000-000000000001', 56, NOW() - INTERVAL '4 days'),
  ('The Pragmatic Programmer', 'David Thomas', 'Care about your craft. Why spend your life developing software unless you care about doing it well?', 12, 'Emily R.', '00000000-0000-0000-0000-000000000001', 73, NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

-- Insert sample reviews (publicly visible)
INSERT INTO reviews (user_id, user_name, user_avatar, rating, content, likes, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Michael Chen', '/placeholder.svg?height=40&width=40', 5, 'Essential reading for anyone in product design. Norman''s principles are timeless and applicable to any design challenge.', 18, NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0000-000000000001', 'Emily Rodriguez', '/placeholder.svg?height=40&width=40', 5, 'Changed how I write code. Every developer should read this at least once in their career.', 32, NOW() - INTERVAL '10 days'),
  ('00000000-0000-0000-0000-000000000001', 'James Wilson', '/placeholder.svg?height=40&width=40', 4, 'A fascinating look into how we make decisions. Some parts are dense but overall very enlightening.', 21, NOW() - INTERVAL '7 days')
ON CONFLICT DO NOTHING;
