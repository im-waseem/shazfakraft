'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { adminGetReviews, adminApproveReview, adminDeleteReview } from '@/lib/actions/reviews'
import type { Review } from '@/lib/actions/reviews'

/* ─── Helpers ────────────────────────────────────────────────── */
const RATING_COLORS: Record<number, string> = {
  1: '#dc2626', 2: '#ea580c', 3: '#ca8a04', 4: '#65a30d', 5: '#16a34a',
}

function StarDisplay({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span style={{ color: '#c8860a', fontSize: size, letterSpacing: 1.5, whiteSpace: 'nowrap' }}>
      {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
    </span>
  )
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).filter(Boolean).join('').toUpperCase().slice(0, 2) || '?'
}

/* ─── Admin Reviews Page ─────────────────────────────────────── */
export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filterApproved, setFilterApproved] = useState<boolean | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const perPage = 20

  const loadReviews = useCallback(async () => {
    setLoading(true)
    const result = await adminGetReviews({
      is_approved: filterApproved,
      search: search,
      page,
      limit: perPage,
    })
    setReviews(result.reviews)
    setTotal(result.total)
    setLoading(false)
  }, [filterApproved, search, page])

  useEffect(() => { loadReviews() }, [loadReviews])

  const handleApprove = async (id: string, approve: boolean) => {
    setActionMsg(null)
    const result = await adminApproveReview(id, approve)
    if (result.success) {
      setActionMsg({ type: 'success', text: `Review ${approve ? 'approved' : 'rejected'}` })
      setReviews(prev => prev.map(r => r.id === id ? { ...r, is_approved: approve } : r))
    } else {
      setActionMsg({ type: 'error', text: result.error || 'Failed to update review' })
    }
    setTimeout(() => setActionMsg(null), 3000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return
    setActionMsg(null)
    const result = await adminDeleteReview(id)
    if (result.success) {
      setActionMsg({ type: 'success', text: 'Review deleted' })
      loadReviews()
    } else {
      setActionMsg({ type: 'error', text: result.error || 'Failed to delete review' })
    }
    setTimeout(() => setActionMsg(null), 3000)
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", padding: '24px 28px' }}>
      <style>{`
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .msg-in { animation: fadeSlide .25s ease both; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Product Reviews</h1>
          <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
            {total} review{total !== 1 ? 's' : ''} total
            {filterApproved === true && ' · Approved'}
            {filterApproved === false && ' · Pending Approval'}
          </p>
        </div>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className="msg-in" style={{
          padding: '10px 16px', borderRadius: 10, marginBottom: 14, fontSize: 13, fontWeight: 600,
          background: actionMsg.type === 'success' ? '#f0fdf4' : '#fff1f1',
          color: actionMsg.type === 'success' ? '#15803d' : '#b42318',
          border: `1px solid ${actionMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
        }}>
          {actionMsg.text}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1) } }}
            placeholder="Search reviews by comment..."
            style={{
              width: '100%', padding: '9px 12px 9px 34px', border: '1.5px solid #e5e0d8',
              borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit',
            }}
          />
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { label: 'All', value: undefined },
            { label: 'Pending', value: false },
            { label: 'Approved', value: true },
          ].map(opt => (
            <button
              key={opt.label}
              onClick={() => { setFilterApproved(opt.value); setPage(1) }}
              style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                border: '1.5px solid', cursor: 'pointer', fontFamily: 'inherit',
                background: filterApproved === opt.value ? '#b8860b' : '#fff',
                color: filterApproved === opt.value ? '#fff' : '#666',
                borderColor: filterApproved === opt.value ? '#b8860b' : '#e5e0d8',
                transition: 'all .15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div style={{ width: 32, height: 32, border: '3px solid #ede9e0', borderTopColor: '#b8860b', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#bbb', background: '#faf8f4', borderRadius: 12, border: '2px dashed #ede9e0' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>📝</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#888' }}>No reviews found</p>
          <p style={{ fontSize: 12.5, marginTop: 4 }}>Try adjusting your filters.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #ede9e0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#faf8f4', borderBottom: '1px solid #ede9e0' }}>
                <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 700, color: '#555', whiteSpace: 'nowrap' }}>Customer</th>
                <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 700, color: '#555', whiteSpace: 'nowrap' }}>Rating</th>
                <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 700, color: '#555' }}>Comment</th>
                <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 700, color: '#555', whiteSpace: 'nowrap' }}>Date</th>
                <th style={{ textAlign: 'center', padding: '11px 14px', fontWeight: 700, color: '#555', whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ textAlign: 'center', padding: '11px 14px', fontWeight: 700, color: '#555', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review, i) => {
                const name = review.customer_name || 'Anonymous'
                const email = review.customer_email || ''
                const isPending = !review.is_approved

                return (
                  <tr key={review.id} style={{
                    borderBottom: '1px solid #f0ede8',
                    background: isPending && i % 2 === 0 ? '#fffbeb' : i % 2 === 0 ? '#fafafa' : '#fff',
                    transition: 'background .15s',
                  }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #d4a020, #b8860b)',
                          color: '#fff', fontSize: 11, fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {getInitials(name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1a1a1a', fontSize: 13 }}>{name}</div>
                          <div style={{ fontSize: 11, color: '#999' }}>{email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <StarDisplay rating={review.rating} />
                      <span style={{ marginLeft: 6, fontWeight: 700, color: RATING_COLORS[review.rating] || '#888' }}>
                        {review.rating}/5
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', maxWidth: 280 }}>
                      <p style={{ margin: 0, lineHeight: 1.5, color: '#555', wordBreak: 'break-word' }}>
                        {review.comment || <span style={{ color: '#ccc', fontStyle: 'italic' }}>No comment</span>}
                      </p>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#777', fontSize: 12 }}>
                      {new Date(review.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: isPending ? '#fef3c7' : '#dcfce7',
                        color: isPending ? '#b45309' : '#15803d',
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: isPending ? '#b45309' : '#15803d' }} />
                        {isPending ? 'Pending' : 'Approved'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        {isPending && (
                          <button
                            onClick={() => handleApprove(review.id, true)}
                            title="Approve"
                            style={{
                              width: 32, height: 32, borderRadius: 8, border: '1.5px solid #bbf7d0',
                              background: '#f0fdf4', color: '#16a34a', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all .15s', fontSize: 16,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#dcfce7'; e.currentTarget.style.borderColor = '#86efac' }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.borderColor = '#bbf7d0' }}
                          >
                            ✓
                          </button>
                        )}
                        {!isPending && (
                          <button
                            onClick={() => handleApprove(review.id, false)}
                            title="Reject / Unapprove"
                            style={{
                              width: 32, height: 32, borderRadius: 8, border: '1.5px solid #fecaca',
                              background: '#fff5f5', color: '#dc2626', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all .15s', fontSize: 14,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#fca5a5' }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.borderColor = '#fecaca' }}
                          >
                            ✕
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(review.id)}
                          title="Delete"
                          style={{
                            width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e5e0d8',
                            background: '#faf8f4', color: '#999', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all .15s', fontSize: 14,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca'; e.currentTarget.style.color = '#dc2626' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#faf8f4'; e.currentTarget.style.borderColor = '#e5e0d8'; e.currentTarget.style.color = '#999' }}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 18, alignItems: 'center' }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            style={{
              padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e5e0d8',
              background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer',
              fontSize: 12, fontWeight: 700, color: page <= 1 ? '#ccc' : '#555',
              opacity: page <= 1 ? 0.5 : 1, fontFamily: 'inherit',
            }}
          >
            ← Previous
          </button>
          <span style={{ fontSize: 13, color: '#888', fontWeight: 600, padding: '0 8px' }}>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{
              padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e5e0d8',
              background: '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              fontSize: 12, fontWeight: 700, color: page >= totalPages ? '#ccc' : '#555',
              opacity: page >= totalPages ? 0.5 : 1, fontFamily: 'inherit',
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}