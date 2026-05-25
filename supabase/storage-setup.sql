-- =====================================================
-- Storage Bucket Setup for Product & Banner Images
-- =====================================================
-- Run this SQL in your Supabase SQL Editor AFTER
-- running schema.sql
-- =====================================================

-- 1. Create the 'product-images' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create the 'banner-images' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banner-images',
  'banner-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Allow public read access to all files in product-images bucket
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 4. Allow authenticated users (admins) to upload to product-images
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- 5. Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- 6. Allow authenticated users to delete their own files
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- 7. Allow public read access to all files in banner-images bucket
CREATE POLICY "Public can view banner images"
ON storage.objects FOR SELECT
USING (bucket_id = 'banner-images');

-- 8. Allow authenticated users to upload to banner-images
CREATE POLICY "Authenticated users can upload banner images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'banner-images'
  AND auth.role() = 'authenticated'
);

-- 9. Allow authenticated users to update banner images
CREATE POLICY "Authenticated users can update banner images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'banner-images'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'banner-images'
  AND auth.role() = 'authenticated'
);

-- 10. Allow authenticated users to delete banner images
CREATE POLICY "Authenticated users can delete banner images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'banner-images'
  AND auth.role() = 'authenticated'
);