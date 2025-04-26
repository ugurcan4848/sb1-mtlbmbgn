/*
  # Add Admin Authentication

  1. Changes
    - Add admin credentials table
    - Add functions for admin authentication
    - Add secure password hashing
    
  2. Security
    - Passwords are hashed with bcrypt
    - Rate limiting for login attempts
    - Session management
*/

-- Create admin_credentials table
CREATE TABLE IF NOT EXISTS admin_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  email text UNIQUE NOT NULL,
  last_login timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;

-- Create function to hash password
CREATE OR REPLACE FUNCTION hash_password(password text)
RETURNS text AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify password
CREATE OR REPLACE FUNCTION verify_admin_password(
  input_username text,
  input_password text
) RETURNS boolean AS $$
DECLARE
  stored_hash text;
BEGIN
  -- Get stored hash
  SELECT password_hash INTO stored_hash
  FROM admin_credentials
  WHERE username = input_username;
  
  -- Return false if user not found
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verify password
  RETURN stored_hash = crypt(input_password, stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to authenticate admin
CREATE OR REPLACE FUNCTION authenticate_admin(
  input_username text,
  input_password text
) RETURNS json AS $$
DECLARE
  admin_record admin_credentials%ROWTYPE;
BEGIN
  -- Check login attempts
  IF EXISTS (
    SELECT 1 FROM auth_attempts
    WHERE ip_address = current_setting('request.headers')::json->>'x-real-ip'
    AND attempt_time > now() - interval '15 minutes'
    GROUP BY ip_address
    HAVING count(*) >= 5
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Too many login attempts. Please try again later.'
    );
  END IF;

  -- Get admin record
  SELECT * INTO admin_record
  FROM admin_credentials
  WHERE username = input_username;

  -- Record login attempt
  INSERT INTO auth_attempts (email, ip_address)
  VALUES (
    COALESCE(admin_record.email, input_username),
    current_setting('request.headers')::json->>'x-real-ip'
  );

  -- Verify password
  IF admin_record.password_hash = crypt(input_password, admin_record.password_hash) THEN
    -- Update last login
    UPDATE admin_credentials
    SET last_login = now()
    WHERE id = admin_record.id;

    -- Return success
    RETURN json_build_object(
      'success', true,
      'admin_id', admin_record.id,
      'username', admin_record.username
    );
  END IF;

  -- Return error
  RETURN json_build_object(
    'success', false,
    'error', 'Invalid username or password'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default admin (password: admin123)
INSERT INTO admin_credentials (username, password_hash, email)
VALUES (
  'admin',
  crypt('admin123', gen_salt('bf', 10)),
  'admin@example.com'
) ON CONFLICT (username) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_credentials_username ON admin_credentials(username);
CREATE INDEX IF NOT EXISTS idx_admin_credentials_email ON admin_credentials(email);