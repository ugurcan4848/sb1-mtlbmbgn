/*
  # Fix Listing Visibility

  1. Changes
    - Update RLS policies to allow viewing all listings
    - Remove status check from select policies
    - Keep write protection intact
    
  2. Security
    - Maintain security while allowing proper visibility
    - Keep write protection intact
    - Ensure users can still manage their own listings
*/

-- Drop existing select policies
DROP POLICY IF EXISTS "Users can view their own listings" ON car_listings;
DROP POLICY IF EXISTS "Users can view approved listings from others" ON car_listings;

-- Create new select policy that allows viewing all listings
CREATE POLICY "Users can view all listings"
ON car_listings
FOR SELECT
TO authenticated
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

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_car_listings_user_id 
ON car_listings(user_id);