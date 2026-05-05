'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, total_amount, status, payment_status, fulfillment_status, created_at, shipping_address, items, customers(first_name,last_name,email,phone)')
      .order('created_at', { ascending: false })

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
      alert(error.message)
      return
    }
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, ...updates } : o)))
  }

  const deleteOrder = async (id: string, createdAt: string) => {
    const ageDays = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
    if (ageDays < 30) {
      alert('Delete allowed only after 30 days (once in a month rule).')
      return
    }

    if (!confirm('Delete this order permanently?')) return

    const supabase = createClient()
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) {
      alert(error.message)
      return
    }
    setOrders(prev => prev.filter(o => o.id !== id))
  }

  if (loading) return <div style={{ padding: 20 }}>Loading orders...</div>

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Orders (CRUD)</h1>
      <div style={{ display: 'grid', gap: 12 }}>
        {orders.map((o: any) => {
          const c = Array.isArray(o.customers) ? o.customers[0] : o.customers
          const ageDays = Math.floor((Date.now() - new Date(o.created_at).getTime()) / (1000 * 60 * 60 * 24))
          return (
            <div key={o.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }}>
              <p><b>{o.order_number}</b></p>
              <p>₹{Number(o.total_amount || 0).toFixed(0)} · {new Date(o.created_at).toLocaleString()}</p>
              <p><b>Customer:</b> {c?.first_name || ''} {c?.last_name || ''} ({c?.email || '-'})</p>
              <p><b>Phone:</b> {c?.phone || '-'}</p>
              <p><b>Address:</b> {o.shipping_address?.address || '-'}, {o.shipping_address?.city || '-'} {o.shipping_address?.pincode || '-'}</p>

              <div style={{ marginTop: 10, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
                <p style={{ fontWeight: 600, marginBottom: 6 }}>Products</p>
                {Array.isArray(o.items) && o.items.length > 0 ? (
                  <div style={{ display: 'grid', gap: 6 }}>
                    {o.items.map((it: any, idx: number) => (
                      <div key={`${o.id}-item-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span>{it.name || 'Item'} × {Number(it.quantity || 1)}</span>
                        <span>₹{Number(it.total ?? (Number(it.price || 0) * Number(it.quantity || 1))).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: '#6b7280' }}>No product items found for this order.</p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <select value={o.status} onChange={e => updateOrder(o.id, { status: e.target.value })}>
                  <option value="pending">pending</option>
                  <option value="confirmed">confirmed</option>
                  <option value="processing">processing</option>
                  <option value="shipped">shipped</option>
                  <option value="delivered">delivered</option>
                  <option value="cancelled">cancelled</option>
                  <option value="refunded">refunded</option>
                </select>

                <select value={o.payment_status} onChange={e => updateOrder(o.id, { payment_status: e.target.value })}>
                  <option value="pending">payment: pending</option>
                  <option value="authorized">authorized</option>
                  <option value="captured">captured</option>
                  <option value="failed">failed</option>
                  <option value="refunded">refunded</option>
                </select>

                <select value={o.fulfillment_status} onChange={e => updateOrder(o.id, { fulfillment_status: e.target.value })}>
                  <option value="unfulfilled">unfulfilled</option>
                  <option value="partially_fulfilled">partially_fulfilled</option>
                  <option value="fulfilled">fulfilled</option>
                  <option value="returned">returned</option>
                </select>

                <button
                  onClick={() => deleteOrder(o.id, o.created_at)}
                  disabled={ageDays < 30}
                  style={{ background: ageDays < 30 ? '#ddd' : '#dc2626', color: '#fff', border: 0, borderRadius: 6, padding: '6px 10px', cursor: ageDays < 30 ? 'not-allowed' : 'pointer' }}
                >
                  Delete
                </button>
              </div>
              {ageDays < 30 && <p style={{ fontSize: 12, color: '#666', marginTop: 6 }}>Delete available after 30 days.</p>}
            </div>
          )
        })}
        {orders.length === 0 && <p>No orders yet.</p>}
      </div>
    </div>
  )
}
