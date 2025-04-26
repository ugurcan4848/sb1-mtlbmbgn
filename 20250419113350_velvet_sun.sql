/*
  # Add Social Media Integration

  1. Changes
    - Add social media settings
    - Add auto-share configuration
    
  2. Security
    - Keep existing RLS policies
*/

-- Add social media fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS whatsapp_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS instagram_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS facebook_enabled boolean DEFAULT false;

-- Create function to toggle social media
CREATE OR REPLACE FUNCTION toggle_social_media(
  user_id uuid,
  platform text,
  enabled boolean
) RETURNS void AS $$
BEGIN
  CASE platform
    WHEN 'whatsapp' THEN
      UPDATE users SET whatsapp_enabled = enabled WHERE id = user_id;
    WHEN 'instagram' THEN
      UPDATE users SET instagram_enabled = enabled WHERE id = user_id;
    WHEN 'facebook' THEN
      UPDATE users SET facebook_enabled = enabled WHERE id = user_id;
    ELSE
      RAISE EXCEPTION 'Invalid platform: %', platform;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION toggle_social_media TO authenticated;