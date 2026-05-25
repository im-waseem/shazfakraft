-- =====================================================
-- Coupons System - Standalone SQL
-- Run this in Supabase SQL Editor AFTER your main schema
-- =====================================================

-- Create coupons table (safe to run multiple times)
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_order_amount DECIMAL(10,2) DEFAULT 0,
  maximum_discount_amount DECIMAL(10,2),
  usage_limit INTEGER DEFAULT NULL,
  usage_count INTEGER DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe to re-run)
DROP POLICY IF EXISTS "Admin can view all coupons" ON coupons;
DROP POLICY IF EXISTS "Admin can insert coupons" ON coupons;
DROP POLICY IF EXISTS "Admin can update coupons" ON coupons;
DROP POLICY IF EXISTS "Admin can delete coupons" ON coupons;

-- RLS Policies for coupons
CREATE POLICY "Admin can view all coupons" ON coupons
  FOR SELECT USING (is_admin());

CREATE POLICY "Admin can insert coupons" ON coupons
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admin can update coupons" ON coupons
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admin can delete coupons" ON coupons
  FOR DELETE USING (is_admin());

-- =====================================================
-- END OF COUPONS SCHEMA
-- =====================================================