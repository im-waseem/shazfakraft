import { createClient } from '@/lib/supabase/server'

interface CreateOrderInput {
  items: {
    name: string
    price: number
    quantity: number
  }[]
  customer_id?: string | null
  user_id?: string | null
  shipping_address?: any
  billing_address?: any
  notes?: string
}

export async function createOrder(input: CreateOrderInput) {
  const supabase = createClient()

  // ✅ Normalize items
  const items = (input.items || []).map(item => ({
    ...item,
    total: item.price * item.quantity,
  }))

  // ✅ Calculate totals
  const subtotal = items.reduce((sum, i) => sum + i.total, 0)
  const tax_amount = 0
  const shipping_amount = 0
  const discount_amount = 0
  const total_amount = subtotal + tax_amount + shipping_amount - discount_amount

  // ✅ Generate order number
  const order_number = `ORD-${Date.now()}`

  const { data, error } = await supabase
    .from('orders')
    .insert({
      order_number,
      customer_id: input.customer_id ?? null,
      user_id: input.user_id ?? null,

      status: 'pending',
      payment_status: 'pending',
      fulfillment_status: 'pending',

      subtotal,
      tax_amount,
      shipping_amount,
      discount_amount,
      total_amount,
      currency: 'INR',

      items,
      shipping_address: input.shipping_address ?? {},
      billing_address: input.billing_address ?? {},

      notes: input.notes ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('Create order error:', error.message)
    return { data: null, error }
  }

  return { data, error: null }
}