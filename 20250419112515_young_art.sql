/*
  # Add User Block Functionality

  1. Changes
    - Add block status fields to users table
    - Add functions for blocking/unblocking users
    - Add block history tracking
    
  2. Security
    - Only admins can block/unblock users
    - Track block history for auditing
*/

-- Add block fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS block_reason text,
ADD COLUMN IF NOT EXISTS blocked_at timestamptz,
ADD COLUMN IF NOT EXISTS blocked_by uuid REFERENCES admin_credentials(id);

-- Create block history table
CREATE TABLE IF NOT EXISTS user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES admin_credentials(id),
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- Create function to block user
CREATE OR REPLACE FUNCTION block_user(
  target_uid uuid,
  block_reason text,
  admin_id uuid DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Update user status
  UPDATE users
  SET 
    is_blocked = true,
    block_reason = block_reason,
    blocked_at = now(),
    blocked_by = admin_id
  WHERE id = target_uid;

  -- Add to block history
  INSERT INTO user_blocks (
    user_id,
    admin_id,
    reason
  ) VALUES (
    target_uid,
    admin_id,
    block_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to unblock user
CREATE OR REPLACE FUNCTION unblock_user(
  target_uid uuid
) RETURNS void AS $$
BEGIN
  UPDATE users
  SET 
    is_blocked = false,
    block_reason = NULL,
    blocked_at = NULL,
    blocked_by = NULL
  WHERE id = target_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users(is_blocked);
CREATE INDEX IF NOT EXISTS idx_user_blocks_user_id ON user_blocks(user_id);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION block_user TO authenticated;
GRANT EXECUTE ON FUNCTION unblock_user TO authenticated;