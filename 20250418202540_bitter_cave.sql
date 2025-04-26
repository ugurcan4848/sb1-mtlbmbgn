/*
  # Add Phone Verification

  1. Changes
    - Add phone verification fields to users table
    - Add verification code table
    - Add functions for verification
    
  2. Security
    - Secure verification codes
    - Time-limited codes
*/

-- Add phone verification fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;

-- Create verification codes table
CREATE TABLE IF NOT EXISTS verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  phone text NOT NULL,
  code text NOT NULL,
  attempts int DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Create function to generate verification code
CREATE OR REPLACE FUNCTION generate_verification_code(
  target_user_id uuid,
  phone_number text
) RETURNS text AS $$
DECLARE
  new_code text;
BEGIN
  -- Generate 6-digit code
  new_code := floor(random() * 900000 + 100000)::text;
  
  -- Delete any existing codes for this user
  DELETE FROM verification_codes WHERE user_id = target_user_id;
  
  -- Insert new code
  INSERT INTO verification_codes (
    user_id,
    phone,
    code,
    expires_at
  ) VALUES (
    target_user_id,
    phone_number,
    new_code,
    now() + interval '15 minutes'
  );
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify code
CREATE OR REPLACE FUNCTION verify_phone_code(
  target_user_id uuid,
  phone_number text,
  verification_code text
) RETURNS boolean AS $$
DECLARE
  code_record verification_codes%ROWTYPE;
BEGIN
  -- Get verification code
  SELECT * INTO code_record
  FROM verification_codes
  WHERE user_id = target_user_id
    AND phone = phone_number
    AND expires_at > now()
  LIMIT 1;
  
  -- Check if code exists and matches
  IF code_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Increment attempts
  UPDATE verification_codes
  SET attempts = attempts + 1
  WHERE id = code_record.id;
  
  -- Check attempts
  IF code_record.attempts >= 3 THEN
    DELETE FROM verification_codes WHERE id = code_record.id;
    RETURN false;
  END IF;
  
  -- Verify code
  IF code_record.code = verification_code THEN
    -- Mark phone as verified
    UPDATE users
    SET 
      phone = phone_number,
      phone_verified = true,
      phone_verified_at = now()
    WHERE id = target_user_id;
    
    -- Delete used code
    DELETE FROM verification_codes WHERE id = code_record.id;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_verification_code TO authenticated;
GRANT EXECUTE ON FUNCTION verify_phone_code TO authenticated;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);