/*
  # Add admin authentication

  1. New Tables
    - `auth_attempts`
      - `id` (uuid, primary key)
      - `ip_address` (text)
      - `username` (text)
      - `attempts` (integer)
      - `last_attempt` (timestamptz)
      - `blocked_until` (timestamptz)
      - `created_at` (timestamptz)

  2. Functions
    - `authenticate_admin`: Validates admin credentials and manages login attempts
    - `reset_auth_attempts`: Resets failed login attempts after successful login
    - `update_auth_attempts`: Updates failed login attempts and manages blocking

  3. Security
    - Enable RLS on auth_attempts table
    - Add policy for admins to view auth attempts
*/

-- Create auth_attempts table
CREATE TABLE IF NOT EXISTS auth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  username text NOT NULL,
  attempts integer DEFAULT 0,
  last_attempt timestamptz DEFAULT now(),
  blocked_until timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view auth attempts
CREATE POLICY "Admins can view auth attempts"
  ON auth_attempts
  FOR SELECT
  TO authenticated
  USING (has_permission(auth.uid(), 'manage_settings'));

-- Function to update auth attempts
CREATE OR REPLACE FUNCTION update_auth_attempts(
  input_ip text,
  input_username text
) RETURNS json AS $$
DECLARE
  attempt_record auth_attempts%ROWTYPE;
  max_attempts constant int := 5;
  block_duration constant interval := interval '15 minutes';
BEGIN
  -- Get or create attempt record
  SELECT * INTO attempt_record
  FROM auth_attempts
  WHERE ip_address = input_ip AND username = input_username;

  IF NOT FOUND THEN
    INSERT INTO auth_attempts (ip_address, username, attempts)
    VALUES (input_ip, input_username, 1)
    RETURNING * INTO attempt_record;
    
    RETURN json_build_object(
      'blocked', false,
      'attempts', 1,
      'remaining', max_attempts - 1
    );
  END IF;

  -- Check if blocked
  IF attempt_record.blocked_until IS NOT NULL AND attempt_record.blocked_until > now() THEN
    RETURN json_build_object(
      'blocked', true,
      'blocked_until', attempt_record.blocked_until,
      'attempts', attempt_record.attempts,
      'remaining', 0
    );
  END IF;

  -- Update attempts
  UPDATE auth_attempts
  SET 
    attempts = CASE 
      WHEN blocked_until IS NULL OR blocked_until <= now()
      THEN attempts + 1 
      ELSE attempts
    END,
    last_attempt = now(),
    blocked_until = CASE 
      WHEN attempts + 1 >= max_attempts THEN now() + block_duration
      ELSE blocked_until
    END
  WHERE id = attempt_record.id
  RETURNING * INTO attempt_record;

  RETURN json_build_object(
    'blocked', attempt_record.blocked_until > now(),
    'blocked_until', attempt_record.blocked_until,
    'attempts', attempt_record.attempts,
    'remaining', greatest(0, max_attempts - attempt_record.attempts)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset auth attempts
CREATE OR REPLACE FUNCTION reset_auth_attempts(
  input_ip text,
  input_username text
) RETURNS void AS $$
BEGIN
  UPDATE auth_attempts
  SET 
    attempts = 0,
    blocked_until = NULL
  WHERE ip_address = input_ip AND username = input_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to authenticate admin
CREATE OR REPLACE FUNCTION authenticate_admin(
  input_username text,
  input_password text,
  input_ip text DEFAULT NULL
) RETURNS json AS $$
DECLARE
  admin_record admin_credentials%ROWTYPE;
  attempt_status json;
BEGIN
  -- Check auth attempts if IP is provided
  IF input_ip IS NOT NULL THEN
    attempt_status := update_auth_attempts(input_ip, input_username);
    IF (attempt_status->>'blocked')::boolean THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Too many failed attempts. Please try again later.',
        'blocked_until', attempt_status->>'blocked_until'
      );
    END IF;
  END IF;

  -- Get admin record
  SELECT * INTO admin_record
  FROM admin_credentials
  WHERE username = input_username;

  -- Check if admin exists and password matches
  IF admin_record.id IS NULL OR 
     admin_record.password_hash != crypt(input_password, admin_record.password_hash) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid username or password',
      'attempts', attempt_status->>'attempts',
      'remaining', attempt_status->>'remaining'
    );
  END IF;

  -- Reset auth attempts on successful login
  IF input_ip IS NOT NULL THEN
    PERFORM reset_auth_attempts(input_ip, input_username);
  END IF;

  -- Update last login
  UPDATE admin_credentials
  SET last_login = now()
  WHERE id = admin_record.id;

  RETURN json_build_object(
    'success', true,
    'admin_id', admin_record.id,
    'username', admin_record.username
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;