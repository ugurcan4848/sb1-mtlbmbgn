/*
  # Add Email Notifications

  1. Changes
    - Add notification_settings table
    - Add notification_templates table
    - Add notification_logs table
    
  2. Security
    - Users can only manage their own notification settings
    - Only system can send notifications
*/

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_new_message boolean DEFAULT true,
  email_listing_update boolean DEFAULT true,
  email_trial_expiry boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  subject text NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  template_id uuid REFERENCES notification_templates(id),
  status text NOT NULL,
  error text,
  created_at timestamptz DEFAULT now()
);

-- Insert default templates
INSERT INTO notification_templates (name, subject, body) VALUES
  ('new_message', 'Yeni Mesajınız Var', 'Sayın {{full_name}}, {{sender_name}} size yeni bir mesaj gönderdi.'),
  ('listing_update', 'İlan Güncellendi', 'Sayın {{full_name}}, {{listing_title}} ilanınız güncellendi.'),
  ('trial_expiry', 'Deneme Süreniz Bitiyor', 'Sayın {{full_name}}, kurumsal deneme sürenizin bitmesine {{days_left}} gün kaldı.')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can manage their notification settings"
ON notification_settings
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage notification templates"
ON notification_templates
TO authenticated
USING (has_permission(auth.uid(), 'manage_settings'))
WITH CHECK (has_permission(auth.uid(), 'manage_settings'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at DESC);