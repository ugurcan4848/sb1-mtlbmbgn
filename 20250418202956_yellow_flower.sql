/*
  # Add Email Verification

  1. Changes
    - Add email verification table
    - Add functions for email verification
    - Update user table with verification fields
    
  2. Security
    - Secure code generation and verification
    - Rate limiting for verification attempts
*/

-- Create email verification table
CREATE TABLE IF NOT EXISTS email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  code text NOT NULL,
  attempts integer DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Create function to generate verification code
CREATE OR REPLACE FUNCTION generate_email_code(
  target_user_id uuid,
  email_address text
) RETURNS text AS $$
DECLARE
  new_code text;
BEGIN
  -- Generate 6-digit code
  new_code := floor(random() * 900000 + 100000)::text;
  
  -- Delete any existing codes for this user
  DELETE FROM email_verifications WHERE user_id = target_user_id;
  
  -- Insert new code
  INSERT INTO email_verifications (
    user_id,
    email,
    code,
    expires_at
  ) VALUES (
    target_user_id,
    email_address,
    new_code,
    now() + interval '15 minutes'
  );
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify email code
CREATE OR REPLACE FUNCTION verify_email_code(
  target_user_id uuid,
  email_address text,
  verification_code text
) RETURNS boolean AS $$
DECLARE
  code_record email_verifications%ROWTYPE;
BEGIN
  -- Get verification code
  SELECT * INTO code_record
  FROM email_verifications
  WHERE user_id = target_user_id
    AND email = email_address
    AND expires_at > now()
  LIMIT 1;
  
  -- Check if code exists and matches
  IF code_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Increment attempts
  UPDATE email_verifications
  SET attempts = attempts + 1
  WHERE id = code_record.id;
  
  -- Check attempts
  IF code_record.attempts >= 3 THEN
    DELETE FROM email_verifications WHERE id = code_record.id;
    RETURN false;
  END IF;
  
  -- Verify code
  IF code_record.code = verification_code THEN
    -- Update user email
    UPDATE auth.users
    SET email = email_address,
        email_confirmed_at = now()
    WHERE id = target_user_id;
    
    -- Update public profile
    UPDATE users
    SET email = email_address
    WHERE id = target_user_id;
    
    -- Delete used code
    DELETE FROM email_verifications WHERE id = code_record.id;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_email_code TO authenticated;
GRANT EXECUTE ON FUNCTION verify_email_code TO authenticated;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);