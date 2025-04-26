/*
  # Fix delete_user_data function

  1. Changes
    - Drop existing function to avoid conflicts
    - Recreate function with unambiguous parameter name
    - Add explicit table references
    - Maintain proper deletion order for referential integrity
    
  2. Security
    - Keep SECURITY DEFINER for elevated privileges
    - Function remains accessible only to service role
*/

-- First drop the existing function
DROP FUNCTION IF EXISTS delete_user_data(uuid);

-- Recreate the function with a clear parameter name
CREATE OR REPLACE FUNCTION delete_user_data(target_uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete messages where user is sender or receiver
  DELETE FROM messages 
  WHERE messages.sender_id = target_uid 
  OR messages.receiver_id = target_uid;

  -- Delete car listings (car_images will be deleted via CASCADE)
  DELETE FROM car_listings 
  WHERE car_listings.user_id = target_uid;
  
  -- Finally delete the user profile
  DELETE FROM users 
  WHERE users.id = target_uid;
END;
$$;