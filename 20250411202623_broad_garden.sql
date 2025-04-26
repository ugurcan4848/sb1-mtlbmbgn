/*
  # Restore Messages Table and Update Policies

  1. Changes
    - Recreate messages table if it doesn't exist
    - Add policies for message access and creation
    - Keep public listing visibility
    
  2. Security
    - Only authenticated users can send messages
    - Users can only view their own messages
    - Keep public access to listings and profiles
*/

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES car_listings(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- Create policies for messages
CREATE POLICY "Users can view their own messages"
ON messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id 
  OR auth.uid() = receiver_id
);

CREATE POLICY "Users can send messages"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id 
  AND auth.email_verified()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);