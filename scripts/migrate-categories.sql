// Migration script to update categories
// Run this in your Supabase SQL Editor

-- Remove hardcoded categories and replace with dynamic ones
DELETE FROM categories WHERE slug IN ('electronics', 'clothing', 'home-garden', 'sports');

-- Insert new dynamic categories (you can customize these)
INSERT INTO categories (name, slug, description, position, is_active) VALUES
  ('Electronics', 'electronics', 'Electronic devices and gadgets', 1, true),
  ('Fashion', 'fashion', 'Clothing, shoes, and accessories', 2, true),
  ('Home & Garden', 'home-garden', 'Home improvement and garden supplies', 3, true),
  ('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear', 4, true),
  ('Beauty & Personal Care', 'beauty-care', 'Beauty products and personal care items', 5, true),
  ('Books', 'books', 'Books, magazines, and educational materials', 6, true)
ON CONFLICT (slug) DO NOTHING;

-- Update any products that reference the old category IDs to use new ones
-- This is a safety measure to ensure data integrity
UPDATE products SET category_id = (
  SELECT id FROM categories WHERE slug = 'electronics'
) WHERE category_id IN (
  SELECT id FROM categories WHERE slug = 'electronics'
);

UPDATE products SET category_id = (
  SELECT id FROM categories WHERE slug = 'fashion'
) WHERE category_id IN (
  SELECT id FROM categories WHERE slug = 'clothing'
);

UPDATE products SET category_id = (
  SELECT id FROM categories WHERE slug = 'home-garden'
) WHERE category_id IN (
  SELECT id FROM categories WHERE slug = 'home-garden'
);

UPDATE products SET category_id = (
  SELECT id FROM categories WHERE slug = 'sports-outdoors'
) WHERE category_id IN (
  SELECT id FROM categories WHERE slug = 'sports'
);

-- Clean up any products with invalid category references
UPDATE products SET category_id = NULL WHERE category_id NOT IN (
  SELECT id FROM categories WHERE is_active = true
);