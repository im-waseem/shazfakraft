import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOrder } from '@/lib/supabase/createOrder'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await req.json()
    const { items = [], shipping = {}, billing = {}, notes = null } = body || {}

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart items are required' }, { status: 400 })
    }

    if (!shipping?.email || !shipping?.phone || !shipping?.address || !shipping?.city || !shipping?.pincode) {
      return NextResponse.json({ error: 'Missing required shipping fields' }, { status: 400 })
    }

    let customerId: string | null = user?.id ?? null

    if (user?.id) {
      const { error: customerErr } = await supabase.from('customers').upsert({
        id: user.id,
        first_name: shipping.firstName || null,
        last_name: shipping.lastName || null,
        email: shipping.email,
        phone: shipping.phone,
        shipping_address: {
          address: shipping.address,
          city: shipping.city,
          state: shipping.state || null,
          pincode: shipping.pincode,
          country: 'India',
        },
        billing_address: {
          address: billing.address || shipping.address,
          city: billing.city || shipping.city,
          state: billing.state || shipping.state || null,
          pincode: billing.pincode || shipping.pincode,
          country: 'India',
        },
        is_active: true,
      }, { onConflict: 'id' })

      if (customerErr) {
        console.error('Customer upsert failed:', customerErr.message)
      }
    }

    const orderResult = await createOrder({
      // Preserve item details for invoice/tracking (size, color, sku, image, etc.)
      items: items.map((i: any) => ({
        name: i.name,
        price: Number(i.price || 0),
        quantity: Number(i.quantity || 1),
        size: i.size || null,
        color: i.color || null,
        sku: i.sku || null,
        image_url: i.image || i.image_url || null,
        product_id: i.productId || i.product_id || null,
        variant_id: i.variantId || i.variant_id || null,
        variant_label: i.variantLabel || i.variant_label || null,
      })),
      customer_id: customerId,
      user_id: user?.id ?? null,
      shipping_address: {
        name: `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim(),
        email: shipping.email,
        phone: shipping.phone,
        address: shipping.address,
        city: shipping.city,
        state: shipping.state || null,
        pincode: shipping.pincode,
        country: 'India',
      },
      billing_address: {
        name: `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim(),
        email: shipping.email,
        phone: shipping.phone,
        address: billing.address || shipping.address,
        city: billing.city || shipping.city,
        state: billing.state || shipping.state || null,
        pincode: billing.pincode || shipping.pincode,
        country: 'India',
      },
      notes,
    })

    if (orderResult.error || !orderResult.data) {
      return NextResponse.json({ error: orderResult.error?.message || 'Failed to place order' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order: orderResult.data,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const url = new URL(req.url)
    const orderNumber = url.searchParams.get('orderNumber')?.trim()
    const phone = url.searchParams.get('phone')?.trim()
    const email = url.searchParams.get('email')?.trim()?.toLowerCase()

    if (!orderNumber) {
      return NextResponse.json({ error: 'orderNumber is required' }, { status: 400 })
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('id,order_number,total_amount,subtotal_amount,shipping_amount,status,payment_status,fulfillment_status,created_at,shipping_address,items,payment_method')
      .eq('order_number', orderNumber)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const ship = (order.shipping_address || {}) as any
    const orderPhone = String(ship.phone || '').trim()
    const orderEmail = String(ship.email || '').trim().toLowerCase()

    // Guest-safe verification: require phone or email match
    if (!phone && !email) {
      return NextResponse.json({ error: 'Please provide phone or email to verify order' }, { status: 400 })
    }

    const phoneOk = phone ? orderPhone === phone : false
    const emailOk = email ? orderEmail === email : false
    if (!phoneOk && !emailOk) {
      return NextResponse.json({ error: 'Order verification failed' }, { status: 403 })
    }

    return NextResponse.json({ success: true, order })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
