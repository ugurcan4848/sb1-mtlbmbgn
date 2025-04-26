/*
  # Add User Roles and Permissions

  1. Changes
    - Add role enum type
    - Add role column to users table
    - Add permissions table
    - Add role_permissions table
    
  2. Security
    - Enforce role-based access control
    - Add policies for permission checks
*/

-- Create role enum type
CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'corporate', 'user');

-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  role user_role NOT NULL,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (role, permission_id)
);

-- Insert default permissions
INSERT INTO permissions (name, description) VALUES
  ('manage_users', 'Can manage all users'),
  ('manage_listings', 'Can manage all listings'),
  ('manage_messages', 'Can manage all messages'),
  ('view_analytics', 'Can view analytics'),
  ('manage_settings', 'Can manage system settings')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions;

INSERT INTO role_permissions (role, permission_id)
SELECT 'moderator', id FROM permissions
WHERE name IN ('manage_listings', 'manage_messages', 'view_analytics');

-- Create function to check permissions
CREATE OR REPLACE FUNCTION has_permission(
  user_id uuid,
  permission_name text
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users u
    JOIN role_permissions rp ON u.role::text::user_role = rp.role
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = user_id AND p.name = permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage permissions
CREATE POLICY "Admins can manage permissions"
ON permissions
TO authenticated
USING (has_permission(auth.uid(), 'manage_settings'))
WITH CHECK (has_permission(auth.uid(), 'manage_settings'));

CREATE POLICY "Admins can manage role permissions"
ON role_permissions
TO authenticated
USING (has_permission(auth.uid(), 'manage_settings'))
WITH CHECK (has_permission(auth.uid(), 'manage_settings'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);