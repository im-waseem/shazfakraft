-- =====================================================
-- Reviews System - Standalone SQL
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create reviews table (safe to run multiple times)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment VARCHAR(500) NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Enforce one review per user per product
  CONSTRAINT unique_user_product_review UNIQUE (product_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe to re-run)
DROP POLICY IF EXISTS "Public can view approved reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view own reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can insert own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
DROP POLICY IF EXISTS "Admin can view all reviews" ON reviews;
DROP POLICY IF EXISTS "Admin can update all reviews" ON reviews;
DROP POLICY IF EXISTS "Admin can delete reviews" ON reviews;

-- RLS Policies for reviews
CREATE POLICY "Public can view approved reviews" ON reviews
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can view own reviews" ON reviews
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert own reviews" ON reviews
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND user_id = auth.uid()
  );

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admin can view all reviews" ON reviews
  FOR SELECT USING (is_admin());

CREATE POLICY "Admin can update all reviews" ON reviews
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admin can delete reviews" ON reviews
  FOR DELETE USING (is_admin());

-- =====================================================
-- END OF REVIEWS SCHEMA
-- =====================================================