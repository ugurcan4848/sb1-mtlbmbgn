/*
  # Update Listing Visibility Policies

  1. Changes
    - Allow public access to view listings
    - Keep email verification requirement for creating/updating listings
    - Keep authentication requirement for messaging

  2. Security
    - Public can view listings without authentication
    - Only authenticated users can create/update listings
    - Email verification still required for sensitive operations
*/

-- Drop existing select policies
DROP POLICY IF EXISTS "Users can view their own listings" ON car_listings;
DROP POLICY IF EXISTS "Users can view approved listings from others" ON car_listings;
DROP POLICY IF EXISTS "Users can view all listings" ON car_listings;
DROP POLICY IF EXISTS "Anyone can view listings" ON car_listings;
DROP POLICY IF EXISTS "Public can view listings" ON car_listings;

-- Create new select policy that allows public viewing
CREATE POLICY "Public can view listings"
ON car_listings
FOR SELECT
TO public
USING (true);

-- Keep other policies unchanged but ensure they require email verification
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

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_car_listings_user_id 
ON car_listings(user_id);