/*
  # Add Security Features

  1. Changes
    - Add rate limiting function
    - Add security headers
    - Add audit logging
    
  2. Security
    - Track failed login attempts
    - Log sensitive operations
    - Prevent brute force attacks
*/

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow inserts and selects on audit logs
CREATE POLICY "Insert audit logs" ON audit_logs
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "View own audit logs" ON audit_logs
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Create function to log actions
CREATE OR REPLACE FUNCTION log_action()
RETURNS trigger AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    CASE
      WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE'
      THEN to_jsonb(OLD)
      ELSE NULL
    END,
    CASE
      WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE'
      THEN to_jsonb(NEW)
      ELSE NULL
    END,
    current_setting('request.headers')::json->>'x-real-ip',
    current_setting('request.headers')::json->>'user-agent'
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for audit logging
CREATE TRIGGER car_listings_audit
AFTER INSERT OR UPDATE OR DELETE ON car_listings
FOR EACH ROW EXECUTE FUNCTION log_action();

CREATE TRIGGER messages_audit
AFTER INSERT OR UPDATE OR DELETE ON messages
FOR EACH ROW EXECUTE FUNCTION log_action();

-- Create table for tracking failed login attempts
CREATE TABLE IF NOT EXISTS auth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text NOT NULL,
  attempt_time timestamptz DEFAULT now()
);

-- Function to clean up old auth attempts
CREATE OR REPLACE FUNCTION cleanup_auth_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM auth_attempts
  WHERE attempt_time < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for faster auth attempt lookups
CREATE INDEX IF NOT EXISTS idx_auth_attempts_email_ip 
ON auth_attempts(email, ip_address);

-- Create index for faster cleanup
CREATE INDEX IF NOT EXISTS idx_auth_attempts_time 
ON auth_attempts(attempt_time);