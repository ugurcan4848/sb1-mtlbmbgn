/*
  # Fix Account Deletion Function

  1. Changes
    - Drop existing function to avoid conflicts
    - Create new function with proper error handling
    - Add proper permissions
    
  2. Security
    - Function runs with SECURITY DEFINER
    - Only authenticated users can execute
*/

-- First drop the existing function
DROP FUNCTION IF EXISTS delete_user_data(uuid);

-- Create new function with proper CASCADE handling
CREATE OR REPLACE FUNCTION delete_user_data(target_uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete messages first to avoid foreign key conflicts
  DELETE FROM messages 
  WHERE sender_id = target_uid 
     OR receiver_id = target_uid;

  -- Delete car listings (car_images will be deleted via CASCADE)
  DELETE FROM car_listings 
  WHERE user_id = target_uid;
  
  -- Finally delete the user profile
  DELETE FROM users 
  WHERE id = target_uid;

  -- Commit the transaction
  RETURN;
EXCEPTION
  WHEN OTHERS THEN
    -- Roll back the transaction
    RAISE EXCEPTION 'Failed to delete user data: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_data(uuid) TO authenticated;