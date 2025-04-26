-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all listings" ON car_listings;
DROP POLICY IF EXISTS "Public can view listings" ON car_listings;
DROP POLICY IF EXISTS "Public can view car images" ON car_images;

-- Create new policies for public viewing
CREATE POLICY "Public can view listings"
ON car_listings
FOR SELECT
TO public
USING (true);

CREATE POLICY "Public can view car images"
ON car_images
FOR SELECT
TO public
USING (true);

-- Keep other policies unchanged but ensure they require authentication
DROP POLICY IF EXISTS "Users can create their own listings" ON car_listings;
CREATE POLICY "Users can create their own listings"
ON car_listings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND auth.email_verified()
);

DROP POLICY IF EXISTS "Users can update their own listings" ON car_listings;
CREATE POLICY "Users can update their own listings"
ON car_listings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND auth.email_verified()
);

DROP POLICY IF EXISTS "Users can delete their own listings" ON car_listings;
CREATE POLICY "Users can delete their own listings"
ON car_listings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Update message policies to require authentication
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id 
  AND auth.email_verified()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_car_listings_created_at ON car_listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_car_listings_price ON car_listings(price);
CREATE INDEX IF NOT EXISTS idx_car_listings_year ON car_listings(year);