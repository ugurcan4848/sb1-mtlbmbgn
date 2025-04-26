/*
  # Fix User Deletion

  1. Changes
    - Update delete_user_data function to properly handle all user data
    - Add cascade deletion for related data
    - Handle storage cleanup
*/

-- Drop existing function
DROP FUNCTION IF EXISTS delete_user_data(uuid);

-- Create new function with proper cleanup
CREATE OR REPLACE FUNCTION delete_user_data(target_uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  listing record;
BEGIN
  -- Delete all messages
  DELETE FROM messages 
  WHERE sender_id = target_uid 
     OR receiver_id = target_uid;

  -- Get all listings to clean up storage
  FOR listing IN 
    SELECT id FROM car_listings 
    WHERE user_id = target_uid
  LOOP
    -- Delete images from storage
    -- Note: This is handled by storage triggers and RLS
    DELETE FROM car_images 
    WHERE listing_id = listing.id;
  END LOOP;

  -- Delete car listings
  DELETE FROM car_listings 
  WHERE user_id = target_uid;
  
  -- Delete notification settings
  DELETE FROM notification_settings
  WHERE user_id = target_uid;

  -- Delete verification codes
  DELETE FROM verification_codes
  WHERE user_id = target_uid;

  -- Delete email verifications
  DELETE FROM email_verifications
  WHERE user_id = target_uid;

  -- Finally delete the user profile
  DELETE FROM users 
  WHERE id = target_uid;

  -- Delete auth user
  DELETE FROM auth.users
  WHERE id = target_uid;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_data(uuid) TO authenticated;