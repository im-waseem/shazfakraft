// lib/actions/coupons.ts - Server actions for coupon CRUD + validation

import { createClient } from '@/lib/supabase/client'

/* ─── Types ──────────────────────────────────────────────────────── */
export interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  minimum_order_amount: number
  maximum_discount_amount: number | null
  usage_limit: number | null
  usage_count: number
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CouponFormData {
  code: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  minimum_order_amount: number
  maximum_discount_amount: string
  usage_limit: string
  starts_at: string
  expires_at: string
  is_active: boolean
}

/* ─── Validate & apply coupon at checkout ──────────────────── */
export async function validateCoupon(
  code: string,
  orderTotal: number
): Promise<{
  valid: boolean
  discount_amount: number
  message: string
  coupon?: Coupon
}> {
  if (!code?.trim()) {
    return { valid: false, discount_amount: 0, message: 'Please enter a coupon code' }
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .maybeSingle()

  if (error || !data) {
    return { valid: false, discount_amount: 0, message: 'Invalid coupon code' }
  }

  const coupon = data as Coupon

  // Check active
  if (!coupon.is_active) {
    return { valid: false, discount_amount: 0, message: 'This coupon is no longer active' }
  }

  // Check dates
  const now = new Date()
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return { valid: false, discount_amount: 0, message: 'This coupon is not yet valid' }
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return { valid: false, discount_amount: 0, message: 'This coupon has expired' }
  }

  // Check usage limit
  if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
    return { valid: false, discount_amount: 0, message: 'This coupon has reached its usage limit' }
  }

  // Check minimum order
  if (orderTotal < coupon.minimum_order_amount) {
    return {
      valid: false,
      discount_amount: 0,
      message: `Minimum order amount of ₹${Number(coupon.minimum_order_amount).toLocaleString('en-IN')} required`,
    }
  }

  // Calculate discount
  let discountAmount: number
  if (coupon.discount_type === 'percentage') {
    discountAmount = (orderTotal * coupon.discount_value) / 100
    if (coupon.maximum_discount_amount !== null && discountAmount > coupon.maximum_discount_amount) {
      discountAmount = coupon.maximum_discount_amount
    }
  } else {
    discountAmount = coupon.discount_value
  }

  // Round to 2 decimals
  discountAmount = Math.round(discountAmount * 100) / 100

  return {
    valid: true,
    discount_amount: discountAmount,
    message: `Coupon applied! You save ₹${discountAmount.toLocaleString('en-IN')}`,
    coupon,
  }
}

/* ─── Admin: fetch all coupons ─────────────────────────────── */
export async function adminGetCoupons(): Promise<Coupon[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return []
  }
  return (data || []) as Coupon[]
}

/* ─── Admin: get single coupon ─────────────────────────────── */
export async function adminGetCoupon(id: string): Promise<Coupon | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) return null
  return data as Coupon | null
}

/* ─── Admin: create coupon ─────────────────────────────────── */
export async function adminCreateCoupon(formData: CouponFormData) {
  const supabase = createClient()

  if (!formData.code?.trim()) {
    return { success: false, error: 'Coupon code is required' }
  }
  if (!formData.discount_value || formData.discount_value <= 0) {
    return { success: false, error: 'Discount value must be greater than 0' }
  }

  const payload: any = {
    code: formData.code.trim().toUpperCase(),
    description: formData.description?.trim() || null,
    discount_type: formData.discount_type,
    discount_value: Number(formData.discount_value),
    minimum_order_amount: Number(formData.minimum_order_amount) || 0,
    maximum_discount_amount: formData.maximum_discount_amount ? Number(formData.maximum_discount_amount) : null,
    usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
    starts_at: formData.starts_at || null,
    expires_at: formData.expires_at || null,
    is_active: formData.is_active,
  }

  const { error } = await supabase.from('coupons').insert(payload)

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'A coupon with this code already exists' }
    }
    return { success: false, error: error.message }
  }
  return { success: true }
}

/* ─── Admin: update coupon ─────────────────────────────────── */
export async function adminUpdateCoupon(id: string, formData: CouponFormData) {
  const supabase = createClient()

  const payload: any = {
    code: formData.code.trim().toUpperCase(),
    description: formData.description?.trim() || null,
    discount_type: formData.discount_type,
    discount_value: Number(formData.discount_value),
    minimum_order_amount: Number(formData.minimum_order_amount) || 0,
    maximum_discount_amount: formData.maximum_discount_amount ? Number(formData.maximum_discount_amount) : null,
    usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
    starts_at: formData.starts_at || null,
    expires_at: formData.expires_at || null,
    is_active: formData.is_active,
  }

  const { error } = await supabase
    .from('coupons')
    .update(payload)
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'A coupon with this code already exists' }
    }
    return { success: false, error: error.message }
  }
  return { success: true }
}

/* ─── Admin: delete coupon ─────────────────────────────────── */
export async function adminDeleteCoupon(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}

/* ─── Admin: increment usage count after order ────────────── */
export async function incrementCouponUsage(code: string) {
  const supabase = createClient()
  const { error } = await supabase.rpc('increment_coupon_usage', { coupon_code: code })
  if (error) {
    // Fallback: direct update
    const { error: updateErr } = await supabase
      .from('coupons')
      .update({ usage_count: supabase.rpc('increment') as any })
      .eq('code', code)
    if (updateErr) console.error('Failed to increment coupon usage:', updateErr)
  }
}