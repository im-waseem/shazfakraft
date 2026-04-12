-- =====================================================
-- Shafa eCommerce - Complete Admin Dashboard SQL Schema
-- =====================================================
-- Run this entire SQL script in Supabase SQL Editor
-- to set up the complete e-commerce database with RLS
-- =====================================================

-- =====================================================
-- STEP 0: Create Admin Role and Helper Functions
-- =====================================================

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email = 'waseemakram060396@gmail.com'  -- CHANGE THIS to your admin email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  IF is_admin() THEN
    RETURN 'admin';
  ELSIF auth.role() = 'authenticated' THEN
    RETURN 'customer';
  ELSE
    RETURN 'anonymous';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to validate admin password (for additional security)
-- Note: This is for demonstration/optional use. Password validation 
-- should primarily be handled by Supabase Authentication
CREATE OR REPLACE FUNCTION validate_admin_password(p_email TEXT, p_password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- This function can be used for additional password validation
  -- For now, it just checks if the email matches the admin email
  -- The actual password validation happens in Supabase Auth
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = p_email
    AND email = 'waseemakram060396@gmail.com'  -- CHANGE THIS to your admin email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 1: COUPON MANAGEMENT (Admin Only)
-- =====================================================

-- Create coupon table
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

-- Create index for coupon code lookup
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coupons
CREATE POLICY "Admin can view all coupons" ON coupons
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin can insert coupons" ON coupons
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admin can update coupons" ON coupons
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can delete coupons" ON coupons
  FOR DELETE
  USING (is_admin());

-- =====================================================
-- STEP 2: BANNER MANAGEMENT (Admin Only)
-- =====================================================

-- Drop existing banners table if exists and recreate with enhanced schema
DROP TABLE IF EXISTS banners CASCADE;

CREATE TABLE IF NOT EXISTS banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_on_homepage BOOLEAN DEFAULT true,
  display_on_category BOOLEAN DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for banner ordering
CREATE INDEX IF NOT EXISTS idx_banners_position ON banners(position) WHERE is_active = true;

-- Enable RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for banners
CREATE POLICY "Public can view active banners" ON banners
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can view all banners" ON banners
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin can manage banners" ON banners
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- STEP 3: PRODUCT MANAGEMENT (Admin Only)
-- =====================================================

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Public can view active categories" ON categories
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can view all categories" ON categories
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin can manage categories" ON categories
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  sku VARCHAR(100) UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  compare_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  images TEXT[],
  main_image_url TEXT,
  inventory_quantity INTEGER DEFAULT 0,
  track_inventory BOOLEAN DEFAULT true,
  allow_backorder BOOLEAN DEFAULT false,
  weight DECIMAL(10,2),
  dimensions JSONB,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_digital BOOLEAN DEFAULT false,
  requires_shipping BOOLEAN DEFAULT true,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Public can view active products" ON products
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can view all products" ON products
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin can manage products" ON products
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create product variants table (for sizes, colors, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2),
  compare_price DECIMAL(10,2),
  inventory_quantity INTEGER DEFAULT 0,
  options JSONB,
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product variants
CREATE POLICY "Public can view active product variants" ON product_variants
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can view all product variants" ON product_variants
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin can manage product variants" ON product_variants
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- STEP 4: CUSTOMER MANAGEMENT
-- =====================================================

-- Create customers table (extends auth.users)
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,
  billing_address JSONB,
  shipping_address JSONB,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_order_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(id);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Users can view own profile" ON customers
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON customers
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admin can view all customers" ON customers
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin can update all customers" ON customers
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- STEP 5: ORDER MANAGEMENT
-- =====================================================

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  )),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'authorized', 'captured', 'partially_refunded', 'refunded', 'failed'
  )),
  fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled' CHECK (fulfillment_status IN (
    'unfulfilled', 'partially_fulfilled', 'fulfilled', 'returned'
  )),
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  coupon_code VARCHAR(50),
  coupon_discount DECIMAL(10,2) DEFAULT 0,
  items JSONB NOT NULL,
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  customer_notes TEXT,
  tracking_number VARCHAR(255),
  shipping_carrier VARCHAR(100),
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancel_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admin can view all orders" ON orders
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin can update all orders" ON orders
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create order items table (for detailed tracking)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  name VARCHAR(500) NOT NULL,
  sku VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  options JSONB,
  fulfilled_quantity INTEGER DEFAULT 0,
  refunded_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order items
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Admin can view all order items" ON order_items
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin can manage order items" ON order_items
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- STEP 6: PAYMENT GATEWAY INTEGRATION
-- =====================================================

-- Create payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  payment_method VARCHAR(50) NOT NULL,
  gateway VARCHAR(50) NOT NULL,
  gateway_transaction_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded', 'cancelled'
  )),
  gateway_response JSONB,
  error_message TEXT,
  refunded_amount DECIMAL(10,2) DEFAULT 0,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway ON payment_transactions(gateway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment transactions
CREATE POLICY "Users can view own payment transactions" ON payment_transactions
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = payment_transactions.order_id AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Admin can view all payment transactions" ON payment_transactions
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin can manage payment transactions" ON payment_transactions
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- STEP 7: SALES REPORTING & ANALYTICS
-- =====================================================

-- Create sales summary view for admin dashboard
CREATE OR REPLACE VIEW admin_sales_summary AS
SELECT
  DATE_TRUNC('day', created_at) AS date,
  COUNT(*) AS total_orders,
  COUNT(*) FILTER (WHERE status = 'delivered') AS completed_orders,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_orders,
  SUM(total_amount) AS total_revenue,
  SUM(total_amount) FILTER (WHERE status = 'delivered') AS completed_revenue,
  AVG(total_amount) AS avg_order_value,
  COUNT(DISTINCT customer_id) AS unique_customers
FROM orders
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Create product performance view
CREATE OR REPLACE VIEW admin_product_performance AS
SELECT
  p.id,
  p.name,
  p.sku,
  p.category_id,
  c.name AS category_name,
  COUNT(oi.id) AS times_ordered,
  SUM(oi.quantity) AS total_quantity_sold,
  SUM(oi.total) AS total_revenue,
  p.inventory_quantity,
  p.is_active
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
LEFT JOIN categories c ON p.category_id = c.id
GROUP BY p.id, p.name, p.sku, p.category_id, c.name, p.inventory_quantity, p.is_active
ORDER BY total_quantity_sold DESC NULLS LAST;

-- Create customer lifetime value view
CREATE OR REPLACE VIEW admin_customer_lifetime_value AS
SELECT
  cust.id,
  cust.first_name,
  cust.last_name,
  au.email,
  cust.total_orders,
  cust.total_spent,
  cust.last_order_date,
  CASE
    WHEN cust.total_spent >= 1000 THEN 'VIP'
    WHEN cust.total_spent >= 500 THEN 'Premium'
    WHEN cust.total_spent >= 100 THEN 'Regular'
    ELSE 'New'
  END AS customer_tier
FROM customers cust
JOIN auth.users au ON cust.id = au.id
ORDER BY cust.total_spent DESC;

-- =====================================================
-- STEP 8: ADMIN DASHBOARD FUNCTIONS
-- =====================================================

-- Function to get dashboard stats
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_orders', (SELECT COUNT(*) FROM orders),
    'pending_orders', (SELECT COUNT(*) FROM orders WHERE status = 'pending'),
    'processing_orders', (SELECT COUNT(*) FROM orders WHERE status = 'processing'),
    'total_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status IN ('delivered', 'shipped')),
    'total_customers', (SELECT COUNT(*) FROM customers),
    'low_stock_products', (SELECT COUNT(*) FROM products WHERE inventory_quantity <= 10 AND is_active = true),
    'active_coupons', (SELECT COUNT(*) FROM coupons WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW()))
  ) INTO stats;
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update customer stats after order
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE customers
    SET
      total_orders = (SELECT COUNT(*) FROM orders WHERE customer_id = NEW.customer_id AND status != 'cancelled'),
      total_spent = (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = NEW.customer_id AND status = 'delivered'),
      last_order_date = (SELECT MAX(created_at) FROM orders WHERE customer_id = NEW.customer_id)
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for customer stats update
CREATE TRIGGER trigger_update_customer_stats
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_customer_stats();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NEW.created_at, 'YYYYMMDD') || '-' || LPAD(NEW.id::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order number generation
CREATE TRIGGER trigger_generate_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_number();

-- =====================================================
-- STEP 9: AUDIT LOG (Track Admin Actions)
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit log
CREATE POLICY "Admin can view audit log" ON audit_log
  FOR SELECT
  USING (is_admin());

-- =====================================================
-- STEP 10: HELPER FUNCTIONS FOR ADMIN
-- =====================================================

-- Function to apply coupon
CREATE OR REPLACE FUNCTION apply_coupon(
  p_coupon_code VARCHAR,
  p_order_total DECIMAL
)
RETURNS TABLE(
  valid BOOLEAN,
  discount_amount DECIMAL,
  message TEXT
) AS $$
DECLARE
  v_coupon RECORD;
BEGIN
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = p_coupon_code
    AND is_active = true
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (usage_limit IS NULL OR usage_count < usage_limit);

  IF v_coupon IS NULL THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Invalid or expired coupon';
    RETURN;
  END IF;

  IF p_order_total < v_coupon.minimum_order_amount THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 
      'Minimum order amount not met (₹' || v_coupon.minimum_order_amount || ')';
    RETURN;
  END IF;

  IF v_coupon.discount_type = 'percentage' THEN
    discount_amount := p_order_total * v_coupon.discount_value / 100;
    IF v_coupon.maximum_discount_amount IS NOT NULL AND discount_amount > v_coupon.maximum_discount_amount THEN
      discount_amount := v_coupon.maximum_discount_amount;
    END IF;
  ELSE
    discount_amount := v_coupon.discount_value;
  END IF;

  -- Increment usage count
  UPDATE coupons SET usage_count = usage_count + 1 WHERE id = v_coupon.id;

  RETURN QUERY SELECT true, discount_amount, 'Coupon applied successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get products with filters
CREATE OR REPLACE FUNCTION get_products_filtered(
  p_category_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_min_price DECIMAL DEFAULT NULL,
  p_max_price DECIMAL DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  name VARCHAR,
  slug VARCHAR,
  price DECIMAL,
  compare_price DECIMAL,
  main_image_url TEXT,
  inventory_quantity INTEGER,
  is_featured BOOLEAN,
  category_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.slug,
    p.price,
    p.compare_price,
    p.main_image_url,
    p.inventory_quantity,
    p.is_featured,
    c.name::TEXT
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  WHERE p.is_active = true
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%' OR p.description ILIKE '%' || p_search || '%')
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_tags IS NULL OR p.tags && p.tags)
  ORDER BY p.is_featured DESC, p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 11: INSERT DEFAULT ADMIN DATA
-- =====================================================

-- Insert sample categories
INSERT INTO categories (name, slug, description, position, is_active) VALUES
  ('Electronics', 'electronics', 'Electronic devices and gadgets', 1, true),
  ('Clothing', 'clothing', 'Fashion and apparel', 2, true),
  ('Home & Garden', 'home-garden', 'Home improvement and garden supplies', 3, true),
  ('Sports', 'sports', 'Sports equipment and accessories', 4, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample coupon
INSERT INTO coupons (code, description, discount_type, discount_value, minimum_order_amount, is_active) VALUES
  ('WELCOME30', 'Welcome discount - 30% off', 'percentage', 30, 50, true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- STEP 12: CLEANUP AND OPTIMIZATION
-- =====================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables 
           WHERE table_schema = 'public' 
           AND table_name IN (
             'coupons', 'banners', 'categories', 'products', 'product_variants',
             'customers', 'orders', 'order_items', 'payment_transactions', 'audit_log'
           )
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trigger_update_updated_at ON %I;
      CREATE TRIGGER trigger_update_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    ', t, t);
  END LOOP;
END $$;

-- =====================================================
-- END OF SCHEMA
-- =====================================================