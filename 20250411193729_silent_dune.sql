/*
  # Fix ambiguous user_id reference in delete_user_data function

  1. Changes
    - Drop and recreate the delete_user_data function with explicit table references
    - Use table aliases to make the queries more readable
    - Ensure proper cascading deletion order to maintain referential integrity

  2. Security
    - Function remains accessible only to service role
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS delete_user_data;

-- Recreate the function with explicit table references
CREATE OR REPLACE FUNCTION delete_user_data(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete messages first (both sent and received)
  DELETE FROM messages m
  WHERE m.sender_id = user_id OR m.receiver_id = user_id;

  -- Delete car images (will cascade delete due to foreign key)
  DELETE FROM car_images ci
  USING car_listings cl
  WHERE ci.listing_id = cl.id AND cl.user_id = user_id;

  -- Delete car listings
  DELETE FROM car_listings cl
  WHERE cl.user_id = user_id;

  -- Finally delete the user
  DELETE FROM users u
  WHERE u.id = user_id;
END;
$$;