// lib/actions/reviews.ts - Server actions for product reviews

import { createClient } from '@/lib/supabase/client'

/* ─── Types ──────────────────────────────────────────────────────── */
export interface Review {
  id: string
  product_id: string
  user_id: string
  rating: number
  comment: string
  is_approved: boolean
  created_at: string
  updated_at: string
  customer_email?: string
  customer_name?: string
}

/* ─── Frontend: fetch last 5 approved reviews for a product ────── */
export async function getRecentReviews(productId: string): Promise<Review[]> {
  const supabase = createClient()

  // First get the reviews
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    return []
  }

  // Enrich with customer info from customers table
  const enriched: Review[] = []
  for (const review of data || []) {
    let customerEmail = ''
    let customerName = 'Anonymous'
    try {
      const { data: custData } = await supabase
        .from('customers')
        .select('email, first_name, last_name')
        .eq('id', review.user_id)
        .maybeSingle()
      if (custData) {
        customerEmail = custData.email || ''
        customerName = custData.first_name
          ? `${custData.first_name} ${custData.last_name || ''}`
          : 'Anonymous'
      }
    } catch {
      // ignore enrichment errors
    }
    enriched.push({
      ...review,
      customer_email: customerEmail,
      customer_name: customerName,
    })
  }

  return enriched
}

/* ─── Frontend: get average rating for a product ───────────────── */
export async function getProductRating(productId: string): Promise<{ avg: number; count: number }> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('is_approved', true)

  if (error || !data || data.length === 0) return { avg: 0, count: 0 }

  const total = data.reduce((sum, r) => sum + r.rating, 0)
  return {
    avg: Math.round((total / data.length) * 10) / 10,
    count: data.length,
  }
}

/* ─── Frontend: submit a new review (requires login) ──────────── */
export async function submitReview(
  productId: string,
  rating: number,
  comment: string
): Promise<{ success: boolean; error?: string }> {
  if (!rating || rating < 1 || rating > 5) {
    return { success: false, error: 'Rating must be between 1 and 5' }
  }
  if (!comment || comment.trim().length === 0) {
    return { success: false, error: 'Comment is required' }
  }
  if (comment.length > 100) {
    return { success: false, error: 'Comment must be 100 characters or less' }
  }

  const supabase = createClient()

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'You must be logged in to submit a review' }
  }

  // Check if user already reviewed this product
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('product_id', productId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return { success: false, error: 'You have already reviewed this product' }
  }

  const { error } = await supabase.from('reviews').insert({
    product_id: productId,
    user_id: user.id,
    rating,
    comment: comment.trim(),
    is_approved: false, // Requires admin approval
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/* ─── Admin: fetch all reviews (with filters, pagination) ────── */
export async function adminGetReviews(options?: {
  is_approved?: boolean
  product_id?: string
  search?: string
  page?: number
  limit?: number
}): Promise<{ reviews: Review[]; total: number }> {
  const supabase = createClient()
  const page = options?.page || 1
  const limit = options?.limit || 20
  const offset = (page - 1) * limit

  let query = supabase
    .from('reviews')
    .select('*', { count: 'exact' })

  if (options?.is_approved !== undefined) {
    query = query.eq('is_approved', options.is_approved)
  }
  if (options?.product_id) {
    query = query.eq('product_id', options.product_id)
  }
  if (options?.search) {
    query = query.ilike('comment', `%${options.search}%`)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return { reviews: [], total: 0 }
  }

  // Enrich with customer info from customers table
  const reviews: Review[] = []
  for (const review of data || []) {
    let customerEmail = ''
    let customerName = 'Anonymous'
    try {
      const { data: custData } = await supabase
        .from('customers')
        .select('email, first_name, last_name')
        .eq('id', review.user_id)
        .maybeSingle()
      if (custData) {
        customerEmail = custData.email || ''
        customerName = custData.first_name
          ? `${custData.first_name} ${custData.last_name || ''}`
          : 'Anonymous'
      }
    } catch {
      // ignore enrichment errors
    }
    reviews.push({
      ...review,
      customer_email: customerEmail,
      customer_name: customerName,
    })
  }

  return { reviews, total: count || 0 }
}

/* ─── Admin: approve/reject a review ─────────────────────────── */
export async function adminApproveReview(reviewId: string, approve: boolean) {
  const supabase = createClient()
  const { error } = await supabase
    .from('reviews')
    .update({ is_approved: approve })
    .eq('id', reviewId)

  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}

/* ─── Admin: delete a review ─────────────────────────────────── */
export async function adminDeleteReview(reviewId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)

  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}