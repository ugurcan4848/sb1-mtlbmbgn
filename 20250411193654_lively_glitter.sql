/*
  # Add delete_user_data function

  1. New Functions
    - `delete_user_data(user_id UUID)`
      - Deletes all data associated with a user
      - Handles messages, car listings, and user profile
      - Returns void
  
  2. Security
    - Function is accessible to authenticated users
    - Executes with security definer to bypass RLS
*/

CREATE OR REPLACE FUNCTION public.delete_user_data(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all messages where user is sender or receiver
  DELETE FROM public.messages 
  WHERE sender_id = user_id 
  OR receiver_id = user_id;

  -- Delete all car images from listings owned by the user
  -- (This will cascade delete due to foreign key constraint)
  DELETE FROM public.car_listings 
  WHERE user_id = user_id;

  -- Delete the user profile
  DELETE FROM public.users 
  WHERE id = user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_data(UUID) TO authenticated;