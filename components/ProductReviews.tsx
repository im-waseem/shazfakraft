'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRecentReviews, submitReview, getProductRating } from '@/lib/actions/reviews'
import type { Review } from '@/lib/actions/reviews'

/* ─── Star rating display ────────────────────────────────────── */
function StarRating({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span style={{ color: '#c8860a', fontSize: size, letterSpacing: 2, whiteSpace: 'nowrap' }}>
      {'★'.repeat(Math.floor(value))}
      {value % 1 >= 0.5 && '½'}
      {'☆'.repeat(5 - Math.ceil(value))}
    </span>
  )
}

/* ─── Single review card ─────────────────────────────────────── */
function ReviewCard({ review }: { review: Review }) {
  const name = review.customer_name || 'Anonymous'

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div style={{
      padding: '14px 0',
      borderBottom: '1px solid #ede9e0',
      animation: 'fadeUp 0.35s ease both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #d4a020, #b8860b)',
          color: '#fff', fontSize: 13, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1a1a1a' }}>{name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StarRating value={review.rating} size={11} />
            <span style={{ fontSize: 11, color: '#999' }}>
              {new Date(review.created_at).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'short', day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 13.5, color: '#555', lineHeight: 1.7, marginLeft: 46 }}>
        {review.comment}
      </p>
    </div>
  )
}

/* ─── Review submission form ──────────────────────────────────── */
function ReviewForm({
  productId,
  onSubmitted,
}: {
  productId: string
  onSubmitted: () => void
}) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setSubmitting(true)

    if (!user) {
      setMessage({ type: 'error', text: 'Please log in to submit a review' })
      setSubmitting(false)
      return
    }

    const result = await submitReview(productId, rating, comment.slice(0, 100))
    if (result.success) {
      setMessage({ type: 'success', text: 'Review submitted! It will appear after admin approval.' })
      setRating(0)
      setComment('')
      onSubmitted()
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to submit review' })
    }
    setSubmitting(false)
  }

  if (!user) {
    return (
      <div style={{
        textAlign: 'center', padding: '20px 0', color: '#888',
        background: '#faf8f4', borderRadius: 12, border: '1px dashed #ddd',
      }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          <a href="/login" style={{ color: '#b8860b', fontWeight: 700 }}>Sign in</a> to write a review
        </p>
      </div>
    )
  }

  const charCount = comment.length
  const remaining = 100 - charCount

  return (
    <form onSubmit={handleSubmit} style={{ padding: '16px 0', borderTop: '1px solid #ede9e0' }}>
      <h4 style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 10 }}>
        Write a Review
      </h4>

      {message && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 12, fontSize: 13, fontWeight: 600,
          background: message.type === 'success' ? '#f0fdf4' : '#fff1f1',
          color: message.type === 'success' ? '#15803d' : '#b42318',
        }}>
          {message.text}
        </div>
      )}

      {/* Star selector */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#666', display: 'block', marginBottom: 4 }}>
          Your Rating *
        </label>
        <div style={{ display: 'flex', gap: 3 }}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 24, padding: '0 1px',
                color: (hoverRating || rating) >= star ? '#c8860a' : '#ddd',
                transition: 'color .15s, transform .15s',
                transform: (hoverRating || rating) >= star ? 'scale(1.1)' : 'scale(1)',
              }}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Comment input */}
      <div style={{ marginBottom: 10 }}>
        <label style={{
          fontSize: 12, fontWeight: 700, color: '#666', display: 'block', marginBottom: 4,
        }}>
          Your Review *
          <span style={{
            float: 'right', fontWeight: 500,
            color: remaining < 10 ? '#dc2626' : remaining < 30 ? '#c2410c' : '#999',
            fontSize: 11,
          }}>
            {remaining} characters left
          </span>
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value.slice(0, 100))}
          placeholder="Share your thoughts about this product (max 100 characters)"
          maxLength={100}
          required
          rows={3}
          style={{
            width: '100%', padding: '10px 12px', border: '1.5px solid #e5e0d8',
            borderRadius: 10, fontSize: 13, fontFamily: 'inherit', resize: 'vertical',
            outline: 'none', transition: 'border-color .2s',
          }}
          onFocus={e => e.target.style.borderColor = '#b8860b'}
          onBlur={e => e.target.style.borderColor = '#e5e0d8'}
        />
      </div>

      <button
        type="submit"
        disabled={submitting || rating === 0 || !comment.trim()}
        style={{
          padding: '10px 24px', background: '#b8860b', color: '#fff', border: 'none',
          borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: 'pointer',
          transition: 'all .2s', fontFamily: 'inherit',
          opacity: submitting || rating === 0 || !comment.trim() ? 0.6 : 1,
        }}
        onMouseEnter={e => { if (!(e.currentTarget as HTMLButtonElement).disabled) e.currentTarget.style.background = '#d4a020' }}
        onMouseLeave={e => e.currentTarget.style.background = '#b8860b'}
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  )
}

/* ─── Main component ──────────────────────────────────────────── */
interface Props {
  productId: string
  productName: string
}

export default function ProductReviews({ productId, productName }: Props) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [ratingInfo, setRatingInfo] = useState({ avg: 0, count: 0 })
  const [loading, setLoading] = useState(true)

  const loadReviews = useCallback(async () => {
    setLoading(true)
    const [r, rt] = await Promise.all([
      getRecentReviews(productId),
      getProductRating(productId),
    ])
    setReviews(r)
    setRatingInfo(rt)
    setLoading(false)
  }, [productId])

  useEffect(() => { loadReviews() }, [loadReviews])

  const ratingDistribution = [0, 0, 0, 0, 0]
  reviews.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) ratingDistribution[r.rating - 1]++
  })

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Summary header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 0', borderBottom: '1px solid #ede9e0', flexWrap: 'wrap',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#1a1a1a', lineHeight: 1.1, fontFamily: "'Syne', sans-serif" }}>
            {ratingInfo.avg > 0 ? ratingInfo.avg : '—'}
          </div>
          {ratingInfo.avg > 0 && <StarRating value={ratingInfo.avg} size={12} />}
          <div style={{ fontSize: 12, color: '#999', marginTop: 2, fontWeight: 600 }}>
            {ratingInfo.count} review{ratingInfo.count !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Rating bars */}
        <div style={{ flex: 1, minWidth: 140 }}>
          {[5, 4, 3, 2, 1].map(star => {
            const count = ratingDistribution[star - 1] || 0
            const pct = ratingInfo.count > 0 ? (count / ratingInfo.count) * 100 : 0
            return (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#888', width: 30, textAlign: 'right' }}>{star}★</span>
                <div style={{
                  flex: 1, height: 6, background: '#ede9e0', borderRadius: 3, overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${pct}%`, height: '100%', background: '#c8860a',
                    borderRadius: 3, transition: 'width .5s ease',
                  }} />
                </div>
                <span style={{ fontSize: 11, color: '#bbb', width: 24 }}>{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reviews list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{
            width: 28, height: 28, border: '2.5px solid #ede9e0',
            borderTopColor: '#b8860b', borderRadius: '50%',
            animation: 'spin 0.7s linear infinite', margin: '0 auto',
          }} />
        </div>
      ) : reviews.length > 0 ? (
        <div>
          {reviews.map(r => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center', padding: '24px 0', color: '#bbb',
        }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>⭐</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#777' }}>No reviews yet</p>
          <p style={{ fontSize: 12.5, marginTop: 4 }}>Be the first to review this product.</p>
        </div>
      )}

      {/* Submit form */}
      <ReviewForm productId={productId} onSubmitted={loadReviews} />
    </div>
  )
}