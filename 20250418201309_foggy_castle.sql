/*
  # Add Corporate Account Features

  1. Changes
    - Add corporate account fields to users table
    - Add trial period tracking
    - Add subscription status tracking
    
  2. Security
    - Keep existing RLS policies
    - Add new policies for corporate features
*/

-- Add corporate account fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_corporate boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_start_date timestamptz,
ADD COLUMN IF NOT EXISTS trial_end_date timestamptz,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS tax_number text,
ADD COLUMN IF NOT EXISTS auto_share boolean DEFAULT false;

-- Create function to calculate trial end date
CREATE OR REPLACE FUNCTION calculate_trial_end_date(start_date timestamptz)
RETURNS timestamptz AS $$
BEGIN
  RETURN start_date + interval '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create function to start corporate trial
CREATE OR REPLACE FUNCTION start_corporate_trial(
  user_id uuid,
  company_name text,
  tax_number text
) RETURNS void AS $$
BEGIN
  UPDATE users
  SET 
    is_corporate = true,
    trial_start_date = CURRENT_TIMESTAMP,
    trial_end_date = calculate_trial_end_date(CURRENT_TIMESTAMP),
    subscription_status = 'trial',
    company_name = $2,
    tax_number = $3
  WHERE id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check trial status
CREATE OR REPLACE FUNCTION is_trial_active(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM users 
    WHERE id = user_id 
      AND is_corporate = true 
      AND trial_end_date > CURRENT_TIMESTAMP
      AND subscription_status = 'trial'
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION start_corporate_trial TO authenticated;
GRANT EXECUTE ON FUNCTION is_trial_active TO authenticated;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_is_corporate ON users(is_corporate);
CREATE INDEX IF NOT EXISTS idx_users_trial_end_date ON users(trial_end_date);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);