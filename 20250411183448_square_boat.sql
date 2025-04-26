/*
  # Enable Email Verification

  1. Changes
    - Enable email verification requirement
    - Update RLS policies to require verified email
    - Add function to check email verification status
*/

-- Enable email confirmation requirement
ALTER TABLE auth.users
ALTER COLUMN email_confirmed_at
DROP DEFAULT;

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