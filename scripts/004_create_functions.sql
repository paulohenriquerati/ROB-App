-- Function to increment quote likes
CREATE OR REPLACE FUNCTION increment_quote_likes(quote_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE shared_quotes
  SET likes = likes + 1
  WHERE id = quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement quote likes
CREATE OR REPLACE FUNCTION decrement_quote_likes(quote_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE shared_quotes
  SET likes = GREATEST(likes - 1, 0)
  WHERE id = quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment review likes
CREATE OR REPLACE FUNCTION increment_review_likes(review_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE reviews
  SET likes = likes + 1
  WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement review likes
CREATE OR REPLACE FUNCTION decrement_review_likes(review_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE reviews
  SET likes = GREATEST(likes - 1, 0)
  WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
