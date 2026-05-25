-- =====================================================
-- Fix: 403 Forbidden when deleting orders from admin
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop the old policy that didn't allow DELETE
DROP POLICY IF EXISTS "Admin can update all orders" ON orders;
DROP POLICY IF EXISTS "Admin can manage orders" ON orders;

-- Create explicit policies for admin order management
CREATE POLICY "Admin can manage orders" ON orders
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Explicit DELETE policy (fixes 403)
CREATE POLICY "Admin can delete orders" ON orders
  FOR DELETE
  USING (is_admin());

-- =====================================================
-- END OF FIX
-- =====================================================