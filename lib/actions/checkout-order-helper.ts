/**
 * checkout-order-helper.ts
 *
 * Drop this into your checkout page / API route.
 * Replaces the raw cart array with a fully-enriched items payload
 * before INSERT into the `orders` table.
 *
 * Cart item shape (from localStorage):
 * {
 *   cartKey, productId, variantId?, name, variantLabel,
 *   size, color, price, quantity, image, sku
 * }
 *
 * The enriched item stored in orders.items:
 * {
 *   product_id, variant_id, name, category, sku,
 *   size, color, price, quantity, total, image_url
 * }
 */

import { createClient } from '@/lib/supabase/client'

interface CartItem {
  cartKey:     string
  productId:   string
  variantId?:  string | null
  name:        string
  variantLabel?: string
  size:        string
  color:       string
  price:       number
  quantity:    number
  image:       string
  sku:         string
}

export interface EnrichedOrderItem {
  product_id:  string
  variant_id:  string | null
  name:        string
  category:    string
  sku:         string
  size:        string
  color:       string
  price:       number
  quantity:    number
  total:       number
  image_url:   string
}

/**
 * Enriches cart items with category name fetched from Supabase.
 * Call this before building your order INSERT payload.
 */
export async function enrichCartItems(cartItems: CartItem[]): Promise<EnrichedOrderItem[]> {
  const supabase = createClient()

  // Fetch products with their category for all unique product IDs
  const productIds = [...new Set(cartItems.map(i => i.productId))]
  const { data: products } = await supabase
    .from('products')
    .select('id, categories(name)')
    .in('id', productIds)

  const categoryMap: Record<string, string> = {}
  for (const p of products ?? []) {
    const cat = Array.isArray((p as any).categories)
      ? (p as any).categories[0]?.name
      : (p as any).categories?.name
    categoryMap[p.id] = cat ?? 'Uncategorized'
  }

  return cartItems.map(item => ({
    product_id:  item.productId,
    variant_id:  item.variantId ?? null,
    name:        item.name,
    category:    categoryMap[item.productId] ?? 'Uncategorized',
    sku:         item.sku ?? '',
    size:        item.size ?? '',
    color:       item.color ?? '',
    price:       Number(item.price),
    quantity:    Number(item.quantity),
    total:       Number(item.price) * Number(item.quantity),
    image_url:   item.image ?? '',
  }))
}

/**
 * Example — build & insert an order.
 * Replace with your actual checkout form data.
 */
export async function createOrder(params: {
  cartItems:       CartItem[]
  customerId:      string
  shippingAddress: {
    first_name: string; last_name: string
    address: string; city: string; state: string
    pincode: string; phone: string; email: string
  }
  paymentMethod?:  string
}) {
  const supabase = createClient()

  const items        = await enrichCartItems(params.cartItems)
  const subtotal     = items.reduce((s, i) => s + i.total, 0)
  const shippingFee  = subtotal >= 499 ? 0 : 49
  const totalAmount  = subtotal + shippingFee

  const orderNumber  = `SKF-${Date.now().toString(36).toUpperCase()}`

  const { data, error } = await supabase
    .from('orders')
    .insert({
      order_number:        orderNumber,
      customer_id:         params.customerId,
      items,                            // ← enriched, has category/size/color/image
      subtotal_amount:     subtotal,
      shipping_amount:     shippingFee,
      total_amount:        totalAmount,
      shipping_address:    params.shippingAddress,
      status:              'pending',
      payment_status:      'pending',
      fulfillment_status:  'unfulfilled',
      payment_method:      params.paymentMethod ?? 'cod',
    })
    .select()
    .single()

  if (error) throw error
  return data
}