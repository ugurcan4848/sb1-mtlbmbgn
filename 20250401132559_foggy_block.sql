/*
  # Initial Schema Setup for Car Marketplace

  1. Tables
    - car_listings
      - Basic car information
      - Listing status and details
    - car_images
      - Images for car listings
    - messages
      - Communication between users

  2. Security
    - Enable RLS on all tables
    - Add policies for data access
*/

-- Car Listings Table
CREATE TABLE IF NOT EXISTS car_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  mileage integer NOT NULL,
  color text NOT NULL,
  price integer NOT NULL,
  fuel_type text NOT NULL,
  transmission text NOT NULL,
  location text NOT NULL,
  description text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Car Images Table
CREATE TABLE IF NOT EXISTS car_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES car_listings(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) NOT NULL,
  receiver_id uuid REFERENCES auth.users(id) NOT NULL,
  listing_id uuid REFERENCES car_listings(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE car_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view approved listings" ON car_listings;
  DROP POLICY IF EXISTS "Users can create their own listings" ON car_listings;
  DROP POLICY IF EXISTS "Users can update their own listings" ON car_listings;
  DROP POLICY IF EXISTS "Anyone can view car images" ON car_images;
  DROP POLICY IF EXISTS "Users can add images to their listings" ON car_images;
  DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
  DROP POLICY IF EXISTS "Users can send messages" ON messages;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Policies for car_listings
CREATE POLICY "Users can view approved listings"
  ON car_listings
  FOR SELECT
  TO authenticated
  USING (status = 'approved' OR user_id = auth.uid());

CREATE POLICY "Users can create their own listings"
  ON car_listings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings"
  ON car_listings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for car_images
CREATE POLICY "Anyone can view car images"
  ON car_images
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can add images to their listings"
  ON car_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM car_listings
      WHERE id = listing_id AND user_id = auth.uid()
    )
  );

-- Policies for messages
CREATE POLICY "Users can view their own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);