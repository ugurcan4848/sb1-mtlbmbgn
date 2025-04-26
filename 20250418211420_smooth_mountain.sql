/*
  # Add Corporate User Fields

  1. Changes
    - Add corporate status field to users table
    - Add phone number field
    - Add company details fields
    
  2. Security
    - Keep existing RLS policies
*/

-- Add corporate fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_corporate boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS tax_number text;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_is_corporate ON users(is_corporate);