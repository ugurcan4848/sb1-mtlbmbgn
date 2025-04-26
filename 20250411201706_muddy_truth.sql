-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all listings" ON car_listings;
DROP POLICY IF EXISTS "Public can view listings" ON car_listings;
DROP POLICY IF EXISTS "Public can view car images" ON car_images;

-- Create new policies for public viewing without any restrictions
CREATE POLICY "Public can view listings"
ON car_listings
FOR SELECT
USING (true);

CREATE POLICY "Public can view car images"
ON car_images
FOR SELECT
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_car_listings_created_at ON car_listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_car_listings_price ON car_listings(price);
CREATE INDEX IF NOT EXISTS idx_car_listings_year ON car_listings(year);

-- Grant public access to necessary tables
GRANT SELECT ON car_listings TO anon;
GRANT SELECT ON car_images TO anon;
GRANT SELECT ON users TO anon;