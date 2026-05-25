import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Coupon } from '@/lib/actions/coupons'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { code, orderTotal } = body || {}

    if (!code?.trim()) {
      return NextResponse.json({ valid: false, discount_amount: 0, message: 'Coupon code is required' })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json({ valid: false, discount_amount: 0, message: 'Invalid coupon code' })
    }

    const coupon = data as Coupon

    // Check active
    if (!coupon.is_active) {
      return NextResponse.json({ valid: false, discount_amount: 0, message: 'This coupon is no longer active' })
    }

    // Check dates
    const now = new Date()
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return NextResponse.json({ valid: false, discount_amount: 0, message: 'This coupon is not yet valid' })
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return NextResponse.json({ valid: false, discount_amount: 0, message: 'This coupon has expired' })
    }

    // Check usage limit
    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
      return NextResponse.json({ valid: false, discount_amount: 0, message: 'This coupon has reached its usage limit' })
    }

    const orderAmt = Number(orderTotal) || 0

    // Check minimum order
    if (orderAmt < coupon.minimum_order_amount) {
      return NextResponse.json({
        valid: false,
        discount_amount: 0,
        message: `Minimum order amount of ₹${Number(coupon.minimum_order_amount).toLocaleString('en-IN')} required`,
      })
    }

    // Calculate discount
    let discountAmount: number
    if (coupon.discount_type === 'percentage') {
      discountAmount = (orderAmt * coupon.discount_value) / 100
      if (coupon.maximum_discount_amount !== null && discountAmount > coupon.maximum_discount_amount) {
        discountAmount = coupon.maximum_discount_amount
      }
    } else {
      discountAmount = coupon.discount_value
    }

    discountAmount = Math.round(discountAmount * 100) / 100

    return NextResponse.json({
      valid: true,
      discount_amount: discountAmount,
      message: `Coupon applied! You save ₹${discountAmount.toLocaleString('en-IN')}`,
      coupon_code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
    })
  } catch (e: any) {
    return NextResponse.json({ valid: false, discount_amount: 0, message: e?.message || 'Validation error' })
  }
}