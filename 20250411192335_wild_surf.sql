/*
  # Update Listing Visibility Policies

  1. Changes
    - Allow public access to view listings and images
    - Keep email verification requirement for creating/updating listings
    - Keep authentication requirement for messaging

  2. Security
    - Public can view listings without authentication
    - Only authenticated users can create/update listings
    - Email verification still required for sensitive operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view listings" ON car_listings;
DROP POLICY IF EXISTS "Anyone can view car images" ON car_images;

-- Create new policies for public viewing
CREATE POLICY "Public can view listings"
ON car_listings
FOR SELECT
USING (true);

CREATE POLICY "Public can view car images"
ON car_images
FOR SELECT
USING (true);

-- Keep other policies unchanged
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