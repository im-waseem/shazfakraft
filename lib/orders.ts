// lib/orders.ts
import { SupabaseClient } from '@supabase/supabase-js'

/* ─── Types matching your DB schema ─── */

export interface OrderItem {
  name: string
  quantity: number
  price: number
  total: number
}

export interface Address {
  line1?: string
  line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export interface Customer {
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
}

export interface Order {
  id: string
  order_number: string
  customer_id: string | null
  status: string
  payment_status: string
  fulfillment_status: string
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total_amount: number
  currency: string
  items: OrderItem[]
  shipping_address: Address | null
  billing_address: Address | null
  created_at: string
  updated_at: string
  customers: Customer | null
}

/* ─── Helper to normalize Supabase relation ─── */
function normalizeCustomer(input: any): Customer | null {
  if (!input) return null
  if (Array.isArray(input)) return input[0] ?? null
  return input
}

/* ─── Fetch all orders ─── */
export async function getOrders(supabase: SupabaseClient): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      customer_id,
      status,
      payment_status,
      fulfillment_status,
      subtotal,
      tax_amount,
      shipping_amount,
      discount_amount,
      total_amount,
      currency,
      items,
      shipping_address,
      billing_address,
      created_at,
      updated_at,
      customers:customer_id (
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getOrders error:', error)
    throw error
  }

  return (data || []).map((o: any) => ({
    id: o.id,
    order_number: o.order_number,
    customer_id: o.customer_id,
    status: o.status,
    payment_status: o.payment_status,
    fulfillment_status: o.fulfillment_status ?? 'pending',
    subtotal: o.subtotal,
    tax_amount: o.tax_amount,
    shipping_amount: o.shipping_amount,
    discount_amount: o.discount_amount,
    total_amount: o.total_amount,
    currency: o.currency ?? 'INR',
    items: Array.isArray(o.items) ? o.items : [],
    shipping_address: o.shipping_address ?? null,
    billing_address: o.billing_address ?? null,
    created_at: o.created_at,
    updated_at: o.updated_at,
    customers: normalizeCustomer(o.customers),
  }))
}

/* ─── Fetch single order ─── */
export async function getOrderById(
  supabase: SupabaseClient,
  id: string
): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      customer_id,
      status,
      payment_status,
      fulfillment_status,
      subtotal,
      tax_amount,
      shipping_amount,
      discount_amount,
      total_amount,
      currency,
      items,
      shipping_address,
      billing_address,
      created_at,
      updated_at,
      customers:customer_id (
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('getOrderById error:', error)
    return null
  }

  return {
    id: data.id,
    order_number: data.order_number,
    customer_id: data.customer_id,
    status: data.status,
    payment_status: data.payment_status,
    fulfillment_status: data.fulfillment_status ?? 'pending',
    subtotal: data.subtotal,
    tax_amount: data.tax_amount,
    shipping_amount: data.shipping_amount,
    discount_amount: data.discount_amount,
    total_amount: data.total_amount,
    currency: data.currency ?? 'INR',
    items: Array.isArray(data.items) ? data.items : [],
    shipping_address: data.shipping_address ?? null,
    billing_address: data.billing_address ?? null,
    created_at: data.created_at,
    updated_at: data.updated_at,
    customers: normalizeCustomer(data.customers),
  }
}

/* ─── Update order status ─── */
export async function updateOrderStatus(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Pick<Order, 'status' | 'payment_status' | 'fulfillment_status'>>
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('updateOrderStatus error:', error)
    throw error
  }
}

/* ─── Helpers ─── */

export const formatMoney = (amount?: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount ?? 0)

export const getCustomerName = (order: Order): string => {
  if (!order.customers) return 'Guest'

  const { first_name, last_name, email } = order.customers
  return [first_name, last_name].filter(Boolean).join(' ') || email
}