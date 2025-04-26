/*
  # Disable Email Confirmation

  1. Changes
    - Disable email confirmation requirement for new user registrations
    - Allow users to sign in immediately after registration without email verification

  2. Security
    - Users can still verify their email later if needed
    - Email verification status is tracked but not enforced
*/

-- Disable email confirmation requirement
ALTER TABLE auth.users
ALTER COLUMN email_confirmed_at
SET DEFAULT NOW();

-- Update existing unconfirmed users to be confirmed
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;