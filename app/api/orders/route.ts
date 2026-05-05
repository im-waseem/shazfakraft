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
      items: items.map((i: any) => ({
        name: i.name,
        price: Number(i.price || 0),
        quantity: Number(i.quantity || 1),
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
