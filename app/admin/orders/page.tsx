'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const fetchOrders = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('orders')
      .select(
        'id, order_number, total_amount, status, payment_status, fulfillment_status, created_at, shipping_address, items, customers(first_name,last_name,email,phone)'
      )
      .order('created_at', { ascending: false })

    if (error) {
      showToast('Failed to load orders: ' + error.message)
    }
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const updateOrder = async (id: string, updates: Record<string, string>) => {
    const supabase = createClient()
    const { error } = await supabase.from('orders').update(updates).eq('id', id)
    if (error) {
      showToast('Update failed: ' + error.message)
      return
    }
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, ...updates } : o)))
    showToast('Order updated successfully.')
  }

  // Permanently deletes the row from Supabase
  const deleteOrder = async (id: string, createdAt: string) => {
    const ageDays = Math.floor(
      (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (ageDays < 30) {
      showToast('Delete is only allowed after 30 days.')
      return
    }
    const confirmed = window.confirm(
      'This will permanently delete the order from the database. This cannot be undone. Continue?'
    )
    if (!confirmed) return

    setDeletingId(id)
    const supabase = createClient()

    // Optional: log to audit table before deleting
    // await supabase.from('deleted_orders_log').insert({ order_id: id, deleted_by: 'admin' })

    const { error } = await supabase.from('orders').delete().eq('id', id)
    setDeletingId(null)

    if (error) {
      showToast('Delete failed: ' + error.message)
      return
    }

    // Remove from local state — order is now gone from Supabase permanently
    setOrders(prev => prev.filter(o => o.id !== id))
    showToast('Order permanently deleted.')
  }

  if (loading)
    return (
      <div style={{ padding: 20, color: '#6b7280' }}>Loading orders…</div>
    )

  return (
    <div style={{ padding: 20, maxWidth: 860, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: '#1e293b',
            color: '#f1f5f9',
            padding: '10px 18px',
            borderRadius: 8,
            zIndex: 9999,
            fontSize: 14,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          {toast}
        </div>
      )}

      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 18 }}>
        Orders Management
      </h1>

      <div style={{ display: 'grid', gap: 14 }}>
        {orders.map((o: any) => {
          const c = Array.isArray(o.customers) ? o.customers[0] : o.customers
          const ageDays = Math.floor(
            (Date.now() - new Date(o.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          )
          const canDelete = ageDays >= 30
          const isDeleting = deletingId === o.id

          return (
            <div
              key={o.id}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 16,
                opacity: isDeleting ? 0.5 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {/* Header row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 4,
                  marginBottom: 6,
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 15 }}>
                  {o.order_number}
                </span>
                <span style={{ color: '#6b7280', fontSize: 13 }}>
                  {new Date(o.created_at).toLocaleString()}
                </span>
              </div>

              <p style={{ margin: '4px 0', fontSize: 14 }}>
                <b>Amount:</b> ₹{Number(o.total_amount || 0).toFixed(0)}
              </p>
              <p style={{ margin: '4px 0', fontSize: 14 }}>
                <b>Customer:</b> {c?.first_name || ''} {c?.last_name || ''} (
                {c?.email || '-'})
              </p>
              <p style={{ margin: '4px 0', fontSize: 14 }}>
                <b>Phone:</b> {c?.phone || '-'}
              </p>
              <p style={{ margin: '4px 0', fontSize: 14 }}>
                <b>Address:</b> {o.shipping_address?.address || '-'},{' '}
                {o.shipping_address?.city || '-'}{' '}
                {o.shipping_address?.pincode || '-'}
              </p>

              {/* Products */}
              <div
                style={{
                  marginTop: 10,
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <p style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
                  Products
                </p>
                {Array.isArray(o.items) && o.items.length > 0 ? (
                  <div style={{ display: 'grid', gap: 5 }}>
                    {o.items.map((it: any, idx: number) => (
                      <div
                        key={`${o.id}-item-${idx}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 13,
                        }}
                      >
                        <span>
                          {it.name || 'Item'} × {Number(it.quantity || 1)}
                        </span>
                        <span>
                          ₹
                          {Number(
                            it.total ??
                              Number(it.price || 0) * Number(it.quantity || 1)
                          ).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: '#6b7280' }}>
                    No items found.
                  </p>
                )}
              </div>

              {/* Controls */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 12,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <select
                  value={o.status}
                  onChange={e => updateOrder(o.id, { status: e.target.value })}
                  style={selectStyle}
                >
                  {[
                    'pending',
                    'confirmed',
                    'processing',
                    'shipped',
                    'delivered',
                    'cancelled',
                    'refunded',
                  ].map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  value={o.payment_status}
                  onChange={e =>
                    updateOrder(o.id, { payment_status: e.target.value })
                  }
                  style={selectStyle}
                >
                  {[
                    'pending',
                    'authorized',
                    'captured',
                    'failed',
                    'refunded',
                  ].map(s => (
                    <option key={s} value={s}>
                      payment: {s}
                    </option>
                  ))}
                </select>

                <select
                  value={o.fulfillment_status}
                  onChange={e =>
                    updateOrder(o.id, { fulfillment_status: e.target.value })
                  }
                  style={selectStyle}
                >
                  {[
                    'unfulfilled',
                    'partially_fulfilled',
                    'fulfilled',
                    'returned',
                  ].map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => deleteOrder(o.id, o.created_at)}
                  disabled={!canDelete || isDeleting}
                  style={{
                    background: !canDelete
                      ? '#e5e7eb'
                      : isDeleting
                      ? '#fca5a5'
                      : '#dc2626',
                    color: !canDelete ? '#9ca3af' : '#fff',
                    border: 0,
                    borderRadius: 6,
                    padding: '6px 14px',
                    cursor: !canDelete || isDeleting ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    transition: 'background 0.2s',
                  }}
                >
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>

              {!canDelete && (
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                  Delete available after 30 days · {30 - ageDays} day
                  {30 - ageDays !== 1 ? 's' : ''} remaining
                </p>
              )}
            </div>
          )
        })}

        {orders.length === 0 && (
          <p style={{ color: '#6b7280' }}>No orders yet.</p>
        )}
      </div>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: 6,
  padding: '5px 8px',
  fontSize: 13,
  background: '#fff',
  cursor: 'pointer',
}