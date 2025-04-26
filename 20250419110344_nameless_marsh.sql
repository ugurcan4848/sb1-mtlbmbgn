/*
  # Add Listing Moderation Features

  1. Changes
    - Add status and moderation fields to car_listings table
    - Add report system for listings
    - Add moderation history tracking
    
  2. Security
    - Only admins can approve/reject listings
    - Track all moderation actions
*/

-- Add moderation fields to car_listings
ALTER TABLE car_listings
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS moderation_reason text,
ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES admin_credentials(id);

-- Create table for listing reports
CREATE TABLE IF NOT EXISTS listing_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES car_listings(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES users(id),
  reason text NOT NULL,
  details text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES admin_credentials(id)
);

-- Create table for moderation history
CREATE TABLE IF NOT EXISTS moderation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES car_listings(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES admin_credentials(id),
  action text NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE listing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_history ENABLE ROW LEVEL SECURITY;

-- Create function to moderate listing
CREATE OR REPLACE FUNCTION moderate_listing(
  listing_id uuid,
  new_status text,
  reason text,
  admin_id uuid
) RETURNS void AS $$
BEGIN
  -- Update listing status
  UPDATE car_listings
  SET 
    status = new_status,
    moderation_reason = reason,
    moderated_at = now(),
    moderated_by = admin_id
  WHERE id = listing_id;

  -- Add to moderation history
  INSERT INTO moderation_history (
    listing_id,
    admin_id,
    action,
    reason
  ) VALUES (
    listing_id,
    admin_id,
    new_status,
    reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to report listing
CREATE OR REPLACE FUNCTION report_listing(
  listing_id uuid,
  reporter_id uuid,
  report_reason text,
  report_details text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO listing_reports (
    listing_id,
    reporter_id,
    reason,
    details
  ) VALUES (
    listing_id,
    reporter_id,
    report_reason,
    report_details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_car_listings_status ON car_listings(status);
CREATE INDEX IF NOT EXISTS idx_listing_reports_status ON listing_reports(status);
CREATE INDEX IF NOT EXISTS idx_moderation_history_listing_id ON moderation_history(listing_id);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION moderate_listing TO authenticated;
GRANT EXECUTE ON FUNCTION report_listing TO authenticated;