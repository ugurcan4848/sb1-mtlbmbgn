/*
  # Fix delete_user_data function

  1. Changes
    - Drop existing function first to avoid parameter name conflicts
    - Recreate function with consistent parameter naming
    - Maintain same deletion logic and security settings
    
  2. Security
    - Keep SECURITY DEFINER setting
    - Maintain execute permissions for authenticated users
*/

-- First drop the existing function
DROP FUNCTION IF EXISTS delete_user_data(uuid);

-- Recreate the function with consistent parameter naming
CREATE OR REPLACE FUNCTION delete_user_data(target_uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete messages where user is sender or receiver
  DELETE FROM messages 
  WHERE sender_id = target_uid 
     OR receiver_id = target_uid;

  -- Delete car listings (car_images will be deleted via CASCADE)
  DELETE FROM car_listings 
  WHERE user_id = target_uid;
  
  -- Finally delete the user profile
  DELETE FROM users 
  WHERE id = target_uid;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_data(uuid) TO authenticated;