/*
  # Add Message Read Status

  1. Changes
    - Add read status column to messages table
    - Add index for better performance
    - Update RLS policies
    
  2. Security
    - Keep existing RLS policies
    - Allow updating read status
*/

-- Add read status column
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS read boolean DEFAULT false;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);

-- Update RLS policies to allow updating read status
DROP POLICY IF EXISTS "Users can update message read status" ON messages;
CREATE POLICY "Users can update message read status"
ON messages
FOR UPDATE
TO authenticated
USING (receiver_id = auth.uid())
WITH CHECK (receiver_id = auth.uid());