/*
  # Add Phone Number Field to Users

  1. Changes
    - Add phone field to users table
    - Update policies to allow phone number updates
    
  2. Security
    - Keep existing RLS policies
    - Allow users to update their own phone number
*/

-- Add phone field to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone text;
  END IF;
END $$;