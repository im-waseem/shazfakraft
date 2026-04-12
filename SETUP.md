# Shafa eCommerce - Complete Admin Dashboard Setup Guide

A comprehensive full-stack e-commerce admin dashboard using Next.js (App Router) and Supabase with complete RLS controls for frontend access.

## Prerequisites

- Node.js 18+ installed
- A Supabase account
- Basic knowledge of SQL and database management

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Project Settings** → **API**
3. Copy the following values:
   - `Project URL`
   - `anon/public` key

### 2. Configure Environment Variables

1. Copy the `.env.local` file in the project root
2. Update the values:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**IMPORTANT**: Update the admin email in the SQL schema:
- Open `supabase/schema.sql`
- Find the line: `AND email = 'waseemakram060396@gmail.com'`
- Replace with your admin email address

### 3. Set Up the Complete Database

1. In your Supabase project, go to **SQL Editor**
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL to create all tables and functions
4. The schema includes:
   - **Coupons** - Admin-managed discount codes
   - **Banners** - Enhanced banner system with images and positioning
   - **Categories** - Product categorization system
   - **Products** - Complete product catalog with variants
   - **Customers** - Customer profiles and order history
   - **Orders** - Complete order management system
   - **Order Items** - Detailed order item tracking
   - **Payment Transactions** - Payment gateway integration
   - **Analytics Views** - Sales reporting and customer insights
   - **Audit Log** - Admin action tracking

### 4. Create Admin User

1. In your Supabase project, go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter your admin email (must match the email in schema.sql)
4. Set a secure password
5. Confirm the email (or disable email confirmation in Auth settings for testing)

### 5. Enable Row Level Security (RLS)

The schema automatically enables RLS on all tables. No additional setup required.

### 6. Create Storage Buckets (Optional)

For file uploads (product images, banner images):
1. Go to **Storage** → **Buckets**
2. Create buckets for:
   - `product-images`
   - `banner-images`
   - `customer-avatars`
3. Set bucket policies to allow authenticated users to upload

### 5. Install Dependencies

```bash
npm install
```

### 6. Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## Features

### Public Homepage (`/`)
- Displays active banners from the database
- Styled as highlighted offer boxes
- Public access to products and categories

### Admin Login (`/login`)
- Only the admin email can access the dashboard
- Other users are redirected with an error

### Admin Dashboard (`/admin`)
- **Dashboard Overview**: Sales stats, order counts, customer metrics
- **Coupon Management**: Create, edit, delete discount codes
- **Banner Management**: Manage promotional banners with images
- **Product Management**: Full product catalog management
- **Category Management**: Organize products into categories
- **Order Management**: Complete order tracking and fulfillment
- **Customer Management**: View customer details and order history
- **Sales Analytics**: Reports and performance metrics

### Complete Admin Features

#### 1. Coupon Management
- Create percentage or fixed-amount discounts
- Set usage limits and expiration dates
- Minimum order amount requirements
- Automatic usage tracking

#### 2. Banner Management
- Upload banner images
- Set display positions and timing
- Link banners to specific pages
- Control visibility on different pages

#### 3. Product Management
- Full product catalog with variants (sizes, colors)
- Inventory tracking and low stock alerts
- Product categories and subcategories
- SEO metadata management
- Digital vs physical product support

#### 4. Order Management
- Complete order lifecycle tracking
- Multiple order statuses (pending, processing, shipped, delivered, cancelled)
- Payment status tracking
- Fulfillment management
- Order notes and customer communication

#### 5. Customer Management
- Customer profiles with order history
- Customer lifetime value tracking
- Customer segmentation (VIP, Premium, Regular, New)
- Address management

#### 6. Sales Analytics
- Daily sales summaries
- Product performance reports
- Customer lifetime value analysis
- Revenue and order trend analysis

#### 7. Payment Gateway Integration
- Support for multiple payment methods
- Transaction tracking and status management
- Gateway response logging
- Refund and partial refund support

### RLS (Row Level Security) Features

#### Frontend Access Control
- **Public**: Can view active products, categories, banners
- **Customers**: Can view own orders, profile, order history
- **Admin**: Can access all data and perform all operations

#### Security Features
- Admin-only access to sensitive operations
- Customer data privacy protection
- Audit logging for admin actions
- Automatic data validation and constraints

## Project Structure

```
shafa-ecommerce/
├── app/
│   ├── admin/
│   │   ├── page.tsx          # Admin dashboard
│   │   └── banner/
│   │       ├── page.tsx      # Banner management
│   │       ├── add-banner-form.tsx
│   │       ├── edit-banner-button.tsx
│   │       └── delete-banner-button.tsx
│   ├── auth/
│   │   └── signout/
│   │       └── route.ts      # Sign out endpoint
│   ├── login/
│   │   └── page.tsx          # Login page
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Homepage with banners
├── lib/
│   └── supabase/
│       ├── server.ts         # Server-side Supabase client
│       └── client.ts         # Browser-side Supabase client
├── supabase/
│   └── schema.sql            # Database schema
├── middleware.ts             # Auth & admin protection
└── .env.local                # Environment variables
```

## Database Schema

### Core Tables

#### `coupons` - Discount Management
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| code | VARCHAR(50) | Unique coupon code |
| discount_type | VARCHAR(20) | 'percentage' or 'fixed' |
| discount_value | DECIMAL(10,2) | Discount amount |
| minimum_order_amount | DECIMAL(10,2) | Minimum order requirement |
| usage_limit | INTEGER | Maximum usage count |
| expires_at | TIMESTAMP | Expiration date |
| is_active | BOOLEAN | Active status |

#### `banners` - Promotional Banners
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | VARCHAR(255) | Banner title |
| image_url | TEXT | Banner image URL |
| link_url | TEXT | Click-through URL |
| position | INTEGER | Display order |
| display_on_homepage | BOOLEAN | Show on homepage |
| start_date/end_date | TIMESTAMP | Display timing |

#### `categories` - Product Categories
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Category name |
| slug | VARCHAR(255) | URL-friendly identifier |
| parent_id | UUID | For subcategories |
| position | INTEGER | Display order |

#### `products` - Product Catalog
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(500) | Product name |
| price | DECIMAL(10,2) | Product price |
| sku | VARCHAR(100) | Stock keeping unit |
| category_id | UUID | Product category |
| inventory_quantity | INTEGER | Stock count |
| is_featured | BOOLEAN | Featured product |
| images | TEXT[] | Product image URLs |
| dimensions | JSONB | Product dimensions |
| tags | TEXT[] | Product tags |

#### `product_variants` - Product Variants
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| product_id | UUID | Parent product |
| name | VARCHAR(255) | Variant name (e.g., "Large - Blue") |
| price | DECIMAL(10,2) | Variant price |
| options | JSONB | Variant options (size, color, etc.) |
| inventory_quantity | INTEGER | Variant stock |

#### `customers` - Customer Profiles
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (references auth.users) |
| first_name | VARCHAR(255) | Customer first name |
| last_name | VARCHAR(255) | Customer last name |
| total_orders | INTEGER | Number of orders |
| total_spent | DECIMAL(10,2) | Total amount spent |
| last_order_date | TIMESTAMP | Last order date |

#### `orders` - Order Management
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| order_number | VARCHAR(50) | Unique order number |
| customer_id | UUID | Customer reference |
| status | VARCHAR(50) | Order status |
| payment_status | VARCHAR(50) | Payment status |
| fulfillment_status | VARCHAR(50) | Fulfillment status |
| total_amount | DECIMAL(10,2) | Order total |
| coupon_code | VARCHAR(50) | Applied coupon |
| items | JSONB | Order items data |
| shipping_address | JSONB | Shipping details |

#### `order_items` - Order Details
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| order_id | UUID | Order reference |
| product_id | UUID | Product reference |
| variant_id | UUID | Variant reference |
| name | VARCHAR(500) | Item name |
| price | DECIMAL(10,2) | Item price |
| quantity | INTEGER | Item quantity |
| total | DECIMAL(10,2) | Line total |

#### `payment_transactions` - Payment Tracking
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| order_id | UUID | Order reference |
| payment_method | VARCHAR(50) | Payment method |
| gateway | VARCHAR(50) | Payment gateway |
| gateway_transaction_id | VARCHAR(255) | Gateway reference |
| amount | DECIMAL(10,2) | Transaction amount |
| status | VARCHAR(50) | Transaction status |
| gateway_response | JSONB | Gateway response data |

### Analytics Views

#### `admin_sales_summary` - Daily Sales Stats
- Total orders, completed orders, cancelled orders
- Revenue metrics and average order value
- Unique customer counts

#### `admin_product_performance` - Product Analytics
- Times ordered, total quantity sold
- Revenue per product
- Inventory levels

#### `admin_customer_lifetime_value` - Customer Analytics
- Customer spending tiers (VIP, Premium, Regular, New)
- Order history and last order dates

### Security Functions

#### `is_admin()` - Admin Check
Returns true if current user is the admin email

#### `get_user_role()` - Role Detection
Returns 'admin', 'customer', or 'anonymous'

#### `apply_coupon()` - Coupon Validation
Validates coupons and calculates discount amounts

#### `get_products_filtered()` - Product Filtering
Filters products by category, price, tags, etc.

## Security Notes

### Row Level Security (RLS)
- **Public Access**: Can view active products, categories, banners
- **Customer Access**: Can view own orders, profile, and order history
- **Admin Access**: Can access all data and perform all operations

### Admin Protection
- Only the specified admin email can access admin functions
- All admin operations are logged in the audit_log table
- Middleware enforces admin-only access to admin routes

### Data Privacy
- Customer data is protected by RLS policies
- Users can only access their own order history
- Admin can view all customer data for management purposes

### Audit Trail
- All admin actions are logged with user, action, table, and timestamp
- IP address and user agent tracking for security
- Old and new values are recorded for data changes

## API Endpoints

The schema provides the following functions for frontend integration:

### Admin Functions
- `get_admin_dashboard_stats()` - Dashboard statistics
- `apply_coupon(code, amount)` - Coupon validation
- `get_products_filtered(...)` - Product filtering

### Views for Reporting
- `admin_sales_summary` - Sales analytics
- `admin_product_performance` - Product insights
- `admin_customer_lifetime_value` - Customer analytics

## Frontend Integration

### Admin Dashboard Components
1. **Dashboard Overview** - Uses `get_admin_dashboard_stats()`
2. **Coupon Management** - Direct table operations with RLS
3. **Banner Management** - Direct table operations with RLS
4. **Product Management** - Direct table operations with RLS
5. **Order Management** - Direct table operations with RLS
6. **Analytics** - Uses the three analytics views

### Customer-Facing Components
1. **Product Catalog** - Reads from `products` and `categories` tables
2. **Order History** - Reads from `orders` and `order_items` tables
3. **Profile Management** - Reads/writes to `customers` table
4. **Coupon Application** - Uses `apply_coupon()` function

## Troubleshooting

### Common Issues
1. **Admin access denied**: Check that the admin email in schema.sql matches your Supabase user email
2. **RLS errors**: Ensure all tables have RLS enabled (done automatically by the schema)
3. **Function permissions**: All functions use `SECURITY DEFINER` for proper access

### Testing
1. Create test products, orders, and customers
2. Verify RLS policies work correctly
3. Test admin vs customer access levels
4. Check audit logging functionality

### Performance
- Indexes are created on frequently queried columns
- Views are optimized for reporting queries
- Consider adding more indexes based on your query patterns
