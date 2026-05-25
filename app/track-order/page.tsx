'use client'

import { useMemo, useState } from 'react'

type OrderItem = {
  name: string
  quantity: number
  price: number
  total?: number
  size?: string | null
  color?: string | null
  sku?: string | null
}

type TrackOrder = {
  id: string
  order_number: string
  total_amount: number
  subtotal_amount?: number
  shipping_amount?: number
  status: string
  payment_status: string
  fulfillment_status: string
  created_at: string
  shipping_address?: { address?: string; city?: string; pincode?: string; phone?: string; email?: string }
  items: OrderItem[]
}

const FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

export default function TrackOrderPage() {
  const whatsappNumber = '916361236653'
  const [orderNumber, setOrderNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<TrackOrder | null>(null)

  const step = useMemo(() => FLOW.indexOf(order?.status?.toLowerCase() || ''), [order?.status])

  const botMessage = useMemo(() => {
    if (!order) return 'Hi 👋 I can help you track your order. Enter Order ID + phone/email.'
    const s = order.status.toLowerCase()
    if (s === 'pending') return `Your order ${order.order_number} is placed and waiting confirmation.`
    if (s === 'confirmed' || s === 'processing') return `Good news! ${order.order_number} is being prepared by our team.`
    if (s === 'shipped') return `${order.order_number} has been shipped 🚚 and is on the way.`
    if (s === 'delivered') return `${order.order_number} is delivered ✅. Thank you for shopping with us.`
    if (s === 'cancelled') return `${order.order_number} was cancelled. Please contact support if needed.`
    return `Current status for ${order.order_number}: ${order.status}`
  }, [order])

  const handleTrack = async () => {
    setLoading(true)
    setError('')
    setOrder(null)
    try {
      const q = new URLSearchParams({ orderNumber: orderNumber.trim() })
      const res = await fetch(`/api/orders?${q.toString()}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error || 'Unable to track order')
        return
      }
      setOrder(json.order)
    } catch {
      setError('Network error while tracking order')
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppSupport = () => {
    const lines = [
      'Assalamualaikum, I need help with my order.',
      order ? `Order ID: ${order.order_number}` : orderNumber ? `Order ID: ${orderNumber}` : '',
      order ? `Current Status: ${order.status}` : '',
      'Please assist me with tracking/support.',
    ].filter(Boolean)

    const text = encodeURIComponent(lines.join('\n'))
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fffbf5', padding: 20, fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: 850, margin: '0 auto', background: '#fff', border: '1px solid #eadfce', borderRadius: 16, padding: 20 }}>
        <h1 style={{ marginBottom: 8 }}>Track Order</h1>
        <p style={{ color: '#7a6a58', marginBottom: 16 }}>Enter your Order ID to track (example: ORD-20260520-48c3de).</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
          <input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="Order ID" style={{ padding: 10, border: '1px solid #d8c9b4', borderRadius: 10 }} onKeyDown={e => { if (e.key === 'Enter' && orderNumber.trim()) handleTrack() }} />
          <button onClick={handleTrack} disabled={loading || !orderNumber.trim()} style={{ padding: '10px 16px', borderRadius: 10, border: 0, background: '#1f1a16', color: '#fff', fontWeight: 700 }}>
            {loading ? 'Tracking…' : 'Track'}
          </button>
        </div>

        {!!error && <p style={{ color: '#b42318', marginTop: 12 }}>{error}</p>}

        <div style={{ marginTop: 18, padding: 12, borderRadius: 10, background: '#f8f2e8', border: '1px solid #eadfce' }}>
          <strong>🤖 Tracking Assistant:</strong> {botMessage}
        </div>

        <button
          onClick={handleWhatsAppSupport}
          style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, border: '1px solid #d8c9b4', background: '#fff', fontWeight: 700, cursor: 'pointer' }}
        >
          💬 Discuss on WhatsApp (+91 63612 36653)
        </button>

        {order && (
          <div style={{ marginTop: 16 }}>
            <h3>{order.order_number}</h3>
            <p style={{ color: '#6b5d4e' }}>Status: <strong>{order.status}</strong> · Payment: {order.payment_status}</p>

            <div style={{ display: 'flex', gap: 6, margin: '14px 0' }}>
              {FLOW.map((s, i) => (
                <div key={s} style={{ flex: 1, textAlign: 'center', fontSize: 11 }}>
                  <div style={{ height: 7, borderRadius: 999, background: i <= step ? '#c8860a' : '#eadfce' }} />
                  <div style={{ marginTop: 6, textTransform: 'capitalize' }}>{s}</div>
                </div>
              ))}
            </div>

            <div style={{ border: '1px solid #eadfce', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#faf6ef', textAlign: 'left' }}>
                    <th style={{ padding: 10 }}>Item</th>
                    <th>Size</th>
                    <th>Color</th>
                    <th>Qty</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((it, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid #f0e7da' }}>
                      <td style={{ padding: 10 }}>{it.name}</td>
                      <td>{it.size || '—'}</td>
                      <td>{it.color || '—'}</td>
                      <td>{it.quantity}</td>
                      <td>₹{Number(it.total ?? it.price * it.quantity).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
