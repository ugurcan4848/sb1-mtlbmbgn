/*
  # Fix Admin Authentication

  1. Changes
    - Drop and recreate auth_attempts table
    - Update authenticate_admin function with proper signature
    - Add proper indexes and constraints
    
  2. Security
    - Rate limiting for login attempts
    - IP-based blocking
    - Secure password comparison
*/

-- Drop existing table and function if they exist
DROP TABLE IF EXISTS auth_attempts CASCADE;
DROP FUNCTION IF EXISTS authenticate_admin(text, text) CASCADE;

-- Create auth_attempts table
CREATE TABLE auth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  username text NOT NULL,
  attempts integer DEFAULT 0,
  last_attempt timestamptz DEFAULT now(),
  blocked_until timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ip_address, username)
);

-- Enable RLS
ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view auth attempts
CREATE POLICY "Admins can view auth attempts"
  ON auth_attempts
  FOR SELECT
  TO authenticated
  USING (has_permission(auth.uid(), 'manage_settings'));

-- Function to authenticate admin with explicit parameter types
CREATE OR REPLACE FUNCTION authenticate_admin(
  input_username text,
  input_password text,
  OUT result json
) AS $$
DECLARE
  admin_record admin_credentials%ROWTYPE;
  attempt_count integer;
  block_duration interval := interval '15 minutes';
  client_ip text;
BEGIN
  -- Get client IP
  client_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';

  -- Check if IP is blocked
  IF EXISTS (
    SELECT 1 FROM auth_attempts
    WHERE ip_address = client_ip
    AND blocked_until > now()
  ) THEN
    result := json_build_object(
      'success', false,
      'error', 'Too many failed attempts. Please try again later.'
    );
    RETURN;
  END IF;

  -- Get admin record
  SELECT * INTO admin_record
  FROM admin_credentials
  WHERE username = input_username;

  -- Record attempt
  INSERT INTO auth_attempts (
    ip_address,
    username,
    attempts
  ) VALUES (
    client_ip,
    input_username,
    1
  )
  ON CONFLICT (ip_address, username)
  DO UPDATE SET
    attempts = auth_attempts.attempts + 1,
    last_attempt = now(),
    blocked_until = CASE
      WHEN auth_attempts.attempts >= 4 THEN now() + block_duration
      ELSE NULL
    END;

  -- Get attempt count
  SELECT attempts INTO attempt_count
  FROM auth_attempts
  WHERE ip_address = client_ip
  AND username = input_username;

  -- Check credentials
  IF admin_record.id IS NULL OR 
     admin_record.password_hash != crypt(input_password, admin_record.password_hash) THEN
    result := json_build_object(
      'success', false,
      'error', 'Invalid username or password',
      'attempts', attempt_count,
      'remaining', greatest(0, 5 - attempt_count)
    );
    RETURN;
  END IF;

  -- Reset attempts on successful login
  DELETE FROM auth_attempts
  WHERE ip_address = client_ip
  AND username = input_username;

  -- Update last login
  UPDATE admin_credentials
  SET last_login = now()
  WHERE id = admin_record.id;

  result := json_build_object(
    'success', true,
    'admin_id', admin_record.id,
    'username', admin_record.username
  );
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip_username 
ON auth_attempts(ip_address, username);

CREATE INDEX IF NOT EXISTS idx_auth_attempts_blocked 
ON auth_attempts(blocked_until)
WHERE blocked_until IS NOT NULL;