/*
  # Configure Auth Settings

  1. Changes
    - Configure auth settings to disable email confirmation requirement
    - Set up auth policies for immediate access after registration

  2. Security
    - This configuration is suitable for development environments
    - For production, email confirmation should be enabled
*/

-- Configure auth settings to disable email confirmation
ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMPTZ DEFAULT NOW();

-- Set up auth policies
CREATE OR REPLACE FUNCTION auth.email_confirmed(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;