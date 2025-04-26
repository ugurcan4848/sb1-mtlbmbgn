/*
  # Add social media toggles to users table

  1. Changes
    - Add WhatsApp and Instagram toggle columns to users table
    - Add default values
    
  2. Security
    - Keep existing RLS policies
*/

-- Add social media toggle columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS whatsapp_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS instagram_enabled boolean DEFAULT false;