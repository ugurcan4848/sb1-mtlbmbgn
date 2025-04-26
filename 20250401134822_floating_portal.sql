/*
  # Fix storage configuration for car images

  1. Storage Configuration
    - Create car-images bucket if it doesn't exist
    - Configure public access and security policies
    
  2. Security
    - Enable RLS on storage.objects
    - Add policies for upload and viewing
*/

-- Create the storage bucket if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'car-images'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('car-images', 'car-images', true);
    END IF;
END $$;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload car images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view car images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Create new policies
CREATE POLICY "Users can upload car images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'car-images'
    AND owner = auth.uid()
);

CREATE POLICY "Anyone can view car images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'car-images');

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'car-images' AND owner = auth.uid());

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO public;