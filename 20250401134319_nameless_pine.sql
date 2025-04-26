/*
  # Add created_at column to users table

  1. Changes
    - Add created_at column to users table if it doesn't exist
*/

-- Add created_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE users ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;