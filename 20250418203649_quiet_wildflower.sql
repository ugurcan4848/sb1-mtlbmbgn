-- Add featured flag to car_listings
ALTER TABLE car_listings
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Add function to feature corporate listings
CREATE OR REPLACE FUNCTION feature_listing(listing_id uuid)
RETURNS boolean AS $$
DECLARE
  is_corporate boolean;
BEGIN
  -- Check if user is corporate
  SELECT is_corporate INTO is_corporate
  FROM users u
  JOIN car_listings cl ON cl.user_id = u.id
  WHERE cl.id = listing_id;
  
  -- Only allow featuring corporate listings
  IF is_corporate THEN
    UPDATE car_listings
    SET is_featured = true
    WHERE id = listing_id;
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_car_listings_is_featured 
ON car_listings(is_featured);

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION feature_listing TO authenticated;