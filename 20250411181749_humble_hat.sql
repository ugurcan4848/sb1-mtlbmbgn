/*
  # Enable Email Verification

  1. Changes
    - Enable email verification requirement for all users
    - Update RLS policies to require email verification
    - Add helper function to check email verification status

  2. Security
    - Users must verify their email before accessing protected features
    - Existing policies are updated to include email verification check
*/

-- Enable email confirmation requirement
ALTER TABLE auth.users
ALTER COLUMN email_confirmed_at
DROP DEFAULT;

-- Update existing policies to check email verification
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
ALTER POLICY "Users can create their own listings" ON car_listings
WITH CHECK (
  auth.uid() = user_id 
  AND auth.email_verified()
);

ALTER POLICY "Users can update their own listings" ON car_listings
USING (
  auth.uid() = user_id 
  AND auth.email_verified()
)
WITH CHECK (
  auth.uid() = user_id 
  AND auth.email_verified()
);

ALTER POLICY "Users can send messages" ON messages
WITH CHECK (
  auth.uid() = sender_id 
  AND auth.email_verified()
);