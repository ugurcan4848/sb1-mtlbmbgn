/*
  # Add Blocked User Check

  1. Changes
    - Add function to check if user is blocked
    - Add trigger to prevent blocked users from logging in
    
  2. Security
    - Ensure blocked users cannot access the system
    - Keep track of block status
*/

-- Create function to check if user is blocked
CREATE OR REPLACE FUNCTION auth.check_user_blocked()
RETURNS trigger AS $$
DECLARE
  is_blocked boolean;
BEGIN
  -- Check if user is blocked
  SELECT users.is_blocked INTO is_blocked
  FROM public.users
  WHERE id = NEW.id;

  -- If user is blocked, prevent login
  IF is_blocked THEN
    RAISE EXCEPTION 'user_blocked';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to check block status before session creation
DROP TRIGGER IF EXISTS check_blocked_user ON auth.sessions;
CREATE TRIGGER check_blocked_user
  BEFORE INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION auth.check_user_blocked();