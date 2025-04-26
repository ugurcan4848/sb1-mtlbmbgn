/*
  # Fix Users Table RLS Policies

  1. Changes
    - Drop existing RLS policies on users table
    - Add new RLS policies that properly handle:
      - User registration (INSERT)
      - User profile access (SELECT)
      - Profile updates (UPDATE)
      - Account deletion (DELETE)
  
  2. Security
    - Enable RLS on users table
    - Add policies to ensure users can only:
      - Create their own profile during registration
      - Read their own profile data
      - Update their own profile
      - Delete their own profile
*/

-- First, drop existing policies
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for creating profile during registration
CREATE POLICY "Users can create their own profile"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
);

-- Policy for reading own profile
CREATE POLICY "Users can read their own profile"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- Policy for updating own profile
CREATE POLICY "Users can update their own profile"
ON users
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);

-- Policy for deleting own profile
CREATE POLICY "Users can delete their own profile"
ON users
FOR DELETE
TO authenticated
USING (
  auth.uid() = id
);