/*
  # Add delete user function

  1. New Function
    - Creates a stored procedure to delete all user data
    - Handles deletion of:
      - Car listings
      - Car images
      - Messages
      - User profile
    - Ensures data consistency by using transactions
*/

CREATE OR REPLACE FUNCTION delete_user_data(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all car images for user's listings
  DELETE FROM car_images
  WHERE listing_id IN (
    SELECT id FROM car_listings WHERE user_id = $1
  );

  -- Delete all car listings
  DELETE FROM car_listings WHERE user_id = $1;

  -- Delete all messages
  DELETE FROM messages 
  WHERE sender_id = $1 OR receiver_id = $1;

  -- Delete user profile
  DELETE FROM users WHERE id = $1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_data TO authenticated;