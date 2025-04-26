-- Add policy for message deletion
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

CREATE POLICY "Users can delete their own messages"
ON messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id_created_at 
ON messages(sender_id, created_at DESC);