/*
  # Email Verification and Feature Updates

  1. Changes
    - Enforce email verification for all authenticated actions
    - Add feature columns to car_listings table
    - Update RLS policies to require email verification
    
  2. Security
    - Only verified users can create/update listings
    - Only verified users can send messages
*/

-- Add new feature columns to car_listings if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'car_listings' AND column_name = 'features'
  ) THEN
    ALTER TABLE car_listings 
    ADD COLUMN features text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'car_listings' AND column_name = 'warranty'
  ) THEN
    ALTER TABLE car_listings 
    ADD COLUMN warranty boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'car_listings' AND column_name = 'negotiable'
  ) THEN
    ALTER TABLE car_listings 
    ADD COLUMN negotiable boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'car_listings' AND column_name = 'exchange'
  ) THEN
    ALTER TABLE car_listings 
    ADD COLUMN exchange boolean DEFAULT false;
  END IF;
END $$;

-- Create or replace email verification function
CREATE OR REPLACE FUNCTION auth.email_verified() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT email_confirmed_at IS NOT NULL 
    FROM auth.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to require email verification
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
USING (
  auth.uid() = user_id 
  AND auth.email_verified()
)
WITH CHECK (
  auth.uid() = user_id 
  AND auth.email_verified()
);

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
CREATE INDEX IF NOT EXISTS idx_car_listings_features ON car_listings USING gin(features);
CREATE INDEX IF NOT EXISTS idx_car_listings_status ON car_listings(status);