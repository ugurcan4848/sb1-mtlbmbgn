/*
  # Fix Listing Visibility

  1. Changes
    - Allow public access to view listings and related data
    - Remove authentication requirement for viewing listings
    - Keep write operations secured
    
  2. Security
    - Anyone can view listings without authentication
    - Only authenticated users can create/update/delete listings
    - Email verification still required for write operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view listings" ON car_listings;
DROP POLICY IF EXISTS "Public can view car images" ON car_images;

-- Create new policies for public viewing
CREATE POLICY "Anyone can view listings"
ON car_listings
FOR SELECT
USING (true);

CREATE POLICY "Anyone can view car images"
ON car_images
FOR SELECT
USING (true);

CREATE POLICY "Anyone can view user profiles"
ON users
FOR SELECT
USING (true);

-- Grant necessary permissions to anonymous users
GRANT SELECT ON car_listings TO anon;
GRANT SELECT ON car_images TO anon;
GRANT SELECT ON users TO anon;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_car_listings_created_at ON car_listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_car_listings_price ON car_listings(price);
CREATE INDEX IF NOT EXISTS idx_car_listings_year ON car_listings(year);