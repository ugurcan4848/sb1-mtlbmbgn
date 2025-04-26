/*
  # Fix ambiguous user_id reference in delete_user_data function

  1. Changes
    - Update delete_user_data function to use explicit table references for user_id columns
    - Ensure proper cascading deletion of user data across all related tables
  
  2. Security
    - Function remains accessible only to service role
*/

CREATE OR REPLACE FUNCTION delete_user_data(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete messages where user is sender or receiver
  DELETE FROM messages 
  WHERE messages.sender_id = user_id 
  OR messages.receiver_id = user_id;

  -- Delete car images (will cascade from car_listings deletion)
  -- No need to explicitly delete as we have ON DELETE CASCADE

  -- Delete car listings
  DELETE FROM car_listings 
  WHERE car_listings.user_id = user_id;

  -- Delete user profile
  DELETE FROM users 
  WHERE users.id = user_id;
END;
$$;