/*
  # Fix messages table relationships

  1. Changes
    - Drop existing foreign key constraints for sender_id and receiver_id
    - Add new foreign key constraints to reference public.users table
    - Add indexes to improve query performance
  
  2. Security
    - No changes to RLS policies
*/

-- First, drop the existing foreign key constraints
ALTER TABLE messages 
DROP CONSTRAINT IF EXISTS messages_sender_id_fkey,
DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;

-- Add new foreign key constraints referencing public.users
ALTER TABLE messages
ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) 
  REFERENCES public.users(id) 
  ON DELETE CASCADE,
ADD CONSTRAINT messages_receiver_id_fkey 
  FOREIGN KEY (receiver_id) 
  REFERENCES public.users(id) 
  ON DELETE CASCADE;

-- Add indexes to improve join performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);