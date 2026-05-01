'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/* ─── Types ─── */
interface OrderItem {
  name: string
  quantity: number
  price: number
  total: number
}

interface Customer {
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
}

interface Order {
  id: string
  order_number: string
  customer_id: string | null
  status: string
  payment_status: string
  fulfillment_status: string
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total_amount: number
  currency: string
  items: OrderItem[]
  shipping_address: any
  tracking_number: string | null
  shipping_carrier: string | null
  created_at: string
  customers: Customer | null
}

/* ─── Status config ─── */
const ORDER_STATUS_CFG: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  pending:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.22)',  dot: '#f59e0b' },
  confirmed:  { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.22)',  dot: '#60a5fa' },
  processing: { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.22)', dot: '#a78bfa' },
  shipped:    { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.22)',  dot: '#34d399' },
  delivered:  { color: '#22d3a5', bg: 'rgba(34,211,165,0.1)',   border: 'rgba(34,211,165,0.22)',  dot: '#22d3a5' },
  cancelled:  { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.22)', dot: '#f87171' },
  refunded:   { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.18)', dot: '#94a3b8' },
}

const PAY_STATUS_CFG: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  pending:            { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.22)',  dot: '#f59e0b' },
  authorized:         { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.22)',  dot: '#60a5fa' },
  captured:           { color: '#22d3a5', bg: 'rgba(34,211,165,0.1)',   border: 'rgba(34,211,165,0.22)',  dot: '#22d3a5' },
  partially_refunded: { color: '#fb923c', bg: 'rgba(251,146,60,0.1)',   border: 'rgba(251,146,60,0.22)',  dot: '#fb923c' },
  refunded:           { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.18)', dot: '#94a3b8' },
  failed:             { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.22)', dot: '#f87171' },
}

const FALLBACK_CFG = { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.18)', dot: '#94a3b8' }

const safeMoney = (n?: number) => `₹${(n ?? 0).toFixed(2)}`

/* ─── Status Badge ─── */
function StatusBadge({ status, cfg }: { status: string; cfg: Record<string, any> }) {
  const c = cfg[status] ?? FALLBACK_CFG
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 6,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
      textTransform: 'capitalize',
      color: c.color, background: c.bg,
      border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {status.replace(/_/g, ' ')}
    </span>
  )
}

/* ─── Order Drawer ─── */
function OrderDrawer({ order, onClose, onStatusChange, updatingId }: {
  order: Order
  onClose: () => void
  onStatusChange: (id: string, status: string) => void
  updatingId: string | null
}) {
  const isUpdating = updatingId === order.id
  const customerName = order.customers
    ? `${order.customers.first_name ?? ''} ${order.customers.last_name ?? ''}`.trim() || order.customers.email
    : 'Guest'

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 480, zIndex: 101,
        background: '#0d0f18',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.25s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        overflowY: 'auto',
      }}>
        {/* Drawer header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 12,
          position: 'sticky', top: 0, zIndex: 10,
          background: '#0d0f18',
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: 'rgba(200,205,230,0.35)', fontWeight: 500, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Order Details</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800, color: '#e4e6f4', letterSpacing: '-0.01em' }}>
              {order.order_number}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(200,205,230,0.5)', cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Status badges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 10, color: 'rgba(200,205,230,0.32)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>Order Status</p>
              <StatusBadge status={order.status} cfg={ORDER_STATUS_CFG} />
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 10, color: 'rgba(200,205,230,0.32)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>Payment</p>
              <StatusBadge status={order.payment_status} cfg={PAY_STATUS_CFG} />
            </div>
          </div>

          {/* Update status */}
          <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.15)' }}>
            <p style={{ fontSize: 11, color: 'rgba(164,143,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Update Status</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => {
                const isActive = order.status === s
                const cfg = ORDER_STATUS_CFG[s]
                return (
                  <button
                    key={s}
                    disabled={isActive || isUpdating}
                    onClick={() => onStatusChange(order.id, s)}
                    style={{
                      padding: '5px 11px', borderRadius: 6, fontSize: 11.5, fontWeight: 600,
                      cursor: isActive || isUpdating ? 'default' : 'pointer',
                      textTransform: 'capitalize',
                      color: isActive ? cfg.color : 'rgba(200,205,230,0.45)',
                      background: isActive ? cfg.bg : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isActive ? cfg.border : 'rgba(255,255,255,0.07)'}`,
                      opacity: isUpdating && !isActive ? 0.4 : 1,
                      transition: 'all 0.15s',
                      fontFamily: 'inherit',
                    }}
                  >
                    {isUpdating && !isActive ? '…' : s}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Customer */}
          <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 10, color: 'rgba(200,205,230,0.32)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Customer</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: 'white',
              }}>
                {(order.customers?.first_name?.[0] ?? order.customers?.email?.[0] ?? '?').toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: '#e4e6f4', marginBottom: 2 }}>{customerName}</p>
                <p style={{ fontSize: 12, color: 'rgba(200,205,230,0.4)' }}>{order.customers?.email ?? '—'}</p>
                {order.customers?.phone && (
                  <p style={{ fontSize: 11.5, color: 'rgba(200,205,230,0.3)', marginTop: 1 }}>{order.customers.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 10, color: 'rgba(200,205,230,0.32)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Order Summary</p>
            {[
              ['Subtotal',  safeMoney(order.subtotal)],
              ['Tax',       safeMoney(order.tax_amount)],
              ['Shipping',  safeMoney(order.shipping_amount)],
              ...(order.discount_amount > 0 ? [['Discount', `-${safeMoney(order.discount_amount)}`]] : []),
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, color: 'rgba(200,205,230,0.42)' }}>{label}</span>
                <span style={{ fontSize: 12.5, color: 'rgba(200,205,230,0.65)', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '10px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e4e6f4' }}>Total</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#7c6fff' }}>{safeMoney(order.total_amount)}</span>
            </div>
          </div>

          {/* Items */}
          <div>
            <p style={{ fontSize: 10, color: 'rgba(200,205,230,0.32)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              Items ({order.items.length})
            </p>
            {order.items.length === 0 ? (
              <p style={{ fontSize: 13, color: 'rgba(200,205,230,0.3)', padding: '10px 0' }}>No items recorded</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 13px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: 'rgba(108,99,255,0.12)',
                      border: '1px solid rgba(108,99,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#a78bfa', fontSize: 12, fontWeight: 800,
                    }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#e4e6f4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                      <p style={{ fontSize: 11, color: 'rgba(200,205,230,0.38)' }}>Qty: {item.quantity} · {safeMoney(item.price)} each</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#e4e6f4', flexShrink: 0 }}>{safeMoney(item.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tracking */}
          {order.tracking_number && (
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(34,211,165,0.06)', border: '1px solid rgba(34,211,165,0.15)' }}>
              <p style={{ fontSize: 10, color: 'rgba(34,211,165,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Tracking</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#22d3a5' }}>{order.tracking_number}</p>
              {order.shipping_carrier && <p style={{ fontSize: 11.5, color: 'rgba(200,205,230,0.38)', marginTop: 2 }}>via {order.shipping_carrier}</p>}
            </div>
          )}

          <p style={{ fontSize: 11, color: 'rgba(200,205,230,0.22)', textAlign: 'center' }}>
            Placed {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
      </div>
    </>
  )
}

/* ─── Main Page ─── */
const STATUSES = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

export default function OrdersManagementPage() {
  const [orders, setOrders]               = useState<Order[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filterStatus, setFilterStatus]   = useState('all')
  const [search, setSearch]               = useState('')
  const [updatingId, setUpdatingId]       = useState<string | null>(null)

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    try {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_id,
          status,
          payment_status,
          fulfillment_status,
          subtotal,
          tax_amount,
          shipping_amount,
          discount_amount,
          total_amount,
          currency,
          items,
          shipping_address,
          tracking_number,
          shipping_carrier,
          created_at,
          customers!orders_customer_id_fkey (
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Supabase error:', fetchError)
        setError(`${fetchError.message} (${fetchError.code})`)
        return
      }

      const normalized: Order[] = (data ?? []).map((o: any) => ({
        ...o,
        items: Array.isArray(o.items) ? o.items : [],
        customers: Array.isArray(o.customers)
          ? (o.customers[0] ?? null)
          : (o.customers ?? null),
      }))

      setOrders(normalized)
    } catch (err: any) {
      console.error('Fetch failed:', err)
      setError(err?.message ?? 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    const supabase = createClient()
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)

      if (updateError) throw updateError

      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
      setSelectedOrder(prev => prev && prev.id === id ? { ...prev, status } : prev)
    } catch (err: any) {
      console.error('Update failed:', err)
      alert('Failed to update status: ' + (err?.message ?? 'Unknown error'))
    } finally {
      setUpdatingId(null)
    }
  }

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = s === 'all' ? orders.length : orders.filter(o => o.status === s).length
    return acc
  }, {} as Record<string, number>)

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === 'all' || o.status === filterStatus
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      o.order_number.toLowerCase().includes(q) ||
      `${o.customers?.first_name ?? ''} ${o.customers?.last_name ?? ''}`.toLowerCase().includes(q) ||
      (o.customers?.email ?? '').toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        @keyframes fadeIn  { from{opacity:0}                        to{opacity:1} }
        @keyframes slideIn { from{transform:translateX(40px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .orders-row { transition: background 0.12s; }
        .orders-row:hover { background: rgba(255,255,255,0.025) !important; cursor: pointer; }
        .orders-row:hover .row-view-btn { opacity: 1 !important; }
        .row-view-btn { opacity: 0; transition: opacity 0.15s; }
        .filter-pill {
          padding: 5px 13px; border-radius: 7px; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; border: 1px solid transparent;
          display: flex; align-items: center; gap: 6px; white-space: nowrap;
          font-family: inherit; background: transparent;
        }
        .filter-pill:hover { background: rgba(255,255,255,0.04); }
        .search-input {
          background: transparent; border: none; outline: none;
          color: rgba(200,205,230,0.8); font-size: 13px; font-family: inherit; width: 220px;
        }
        .search-input::placeholder { color: rgba(200,205,230,0.25); }
        .anim-page { animation: fadeUp 0.35s ease both; }
        .refresh-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 9px; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; font-family: inherit;
          color: rgba(200,205,230,0.55);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .refresh-btn:hover { background: rgba(255,255,255,0.07); color: rgba(200,205,230,0.85); }
      `}</style>

      <div className="anim-page" style={{ minHeight: '100vh', background: '#0a0c14', color: '#e8eaf6', padding: 24, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: '#e4e6f4', letterSpacing: '-0.02em', marginBottom: 4 }}>
              Orders
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(200,205,230,0.38)' }}>
              {orders.length} total · {counts['pending'] ?? 0} pending
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10,
            }}>
              <svg width="14" height="14" fill="none" stroke="rgba(200,205,230,0.3)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="search-input"
                placeholder="Search order, customer…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(200,205,230,0.3)', display: 'flex', padding: 0 }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Refresh */}
            <button className="refresh-btn" onClick={fetchOrders} disabled={loading}>
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transition: 'transform .5s', transform: loading ? 'rotate(360deg)' : 'none' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <p style={{ color: '#f87171', fontWeight: 700, fontSize: 13, marginBottom: 3 }}>⚠ Error loading orders</p>
              <p style={{ color: 'rgba(248,113,113,0.7)', fontSize: 12 }}>{error}</p>
            </div>
            <button
              onClick={fetchOrders}
              style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: 'rgba(248,113,113,0.15)', color: '#f87171', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', flexShrink: 0 }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Filter pills ── */}
        <div style={{
          display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 18,
          padding: '6px', background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: 11, width: 'fit-content',
        }}>
          {STATUSES.map(s => {
            const isActive = filterStatus === s
            const cfg = ORDER_STATUS_CFG[s]
            return (
              <button
                key={s}
                className="filter-pill"
                onClick={() => setFilterStatus(s)}
                style={{
                  color: isActive ? (cfg?.color ?? '#a78bfa') : 'rgba(200,205,230,0.4)',
                  background: isActive ? (cfg?.bg ?? 'rgba(167,139,250,0.12)') : 'transparent',
                  borderColor: isActive ? (cfg?.border ?? 'rgba(167,139,250,0.25)') : 'transparent',
                  textTransform: 'capitalize',
                }}
              >
                {s === 'all' ? 'All' : s}
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                  color: isActive ? 'inherit' : 'rgba(200,205,230,0.3)',
                }}>
                  {counts[s] ?? 0}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── Table ── */}
        <div style={{ background: 'linear-gradient(145deg, #111420, #0e1019)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>

          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 1fr 1fr 1fr 0.9fr 80px',
            padding: '11px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.055)',
            background: 'rgba(255,255,255,0.018)',
          }}>
            {['Order', 'Customer', 'Date', 'Status', 'Payment', 'Total', ''].map((h, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(200,205,230,0.28)', textAlign: i === 6 ? 'right' : 'left' }}>
                {h}
              </span>
            ))}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{ height: 48, borderRadius: 8, background: 'rgba(255,255,255,0.03)', animation: `shimmer 1.5s ${i * 0.1}s ease infinite` }} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, margin: '0 auto 16px',
                background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c6fff',
              }}>
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(200,205,230,0.6)', marginBottom: 5 }}>No orders found</p>
              <p style={{ fontSize: 12, color: 'rgba(200,205,230,0.28)' }}>
                {search || filterStatus !== 'all' ? 'Try adjusting your filters or search' : 'Orders will appear here once customers place them'}
              </p>
            </div>
          )}

          {/* Rows */}
          {!loading && filtered.map((order, i) => {
            const customerName = order.customers
              ? `${order.customers.first_name ?? ''} ${order.customers.last_name ?? ''}`.trim() || order.customers.email
              : 'Guest'

            return (
              <div
                key={order.id}
                className="orders-row"
                onClick={() => setSelectedOrder(order)}
                style={{
                  display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 1fr 1fr 1fr 0.9fr 80px',
                  padding: '13px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  alignItems: 'center',
                }}
              >
                {/* Order # */}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#e4e6f4' }}>{order.order_number}</p>
                  {order.items.length > 0 && (
                    <p style={{ fontSize: 11, color: 'rgba(200,205,230,0.3)', marginTop: 1 }}>
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Customer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: `hsl(${(order.customer_id ?? 'g').charCodeAt(0) * 50 % 360 + 200},50%,32%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, color: 'white',
                  }}>
                    {(order.customers?.first_name?.[0] ?? order.customers?.email?.[0] ?? 'G').toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: '#e4e6f4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customerName}</p>
                    <p style={{ fontSize: 11, color: 'rgba(200,205,230,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.customers?.email ?? '—'}</p>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <p style={{ fontSize: 12, color: 'rgba(200,205,230,0.55)' }}>
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                  <p style={{ fontSize: 10.5, color: 'rgba(200,205,230,0.28)', marginTop: 1 }}>
                    {new Date(order.created_at).getFullYear()}
                  </p>
                </div>

                {/* Order status */}
                <div><StatusBadge status={order.status} cfg={ORDER_STATUS_CFG} /></div>

                {/* Payment status */}
                <div><StatusBadge status={order.payment_status} cfg={PAY_STATUS_CFG} /></div>

                {/* Total */}
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 800, color: '#e4e6f4' }}>{safeMoney(order.total_amount)}</p>
                </div>

                {/* View btn */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="row-view-btn"
                    onClick={e => { e.stopPropagation(); setSelectedOrder(order) }}
                    style={{
                      padding: '5px 11px', borderRadius: 7, fontSize: 11.5, fontWeight: 600,
                      cursor: 'pointer', color: '#a78bfa',
                      background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)',
                      fontFamily: 'inherit',
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <p style={{ fontSize: 12, color: 'rgba(200,205,230,0.28)', marginTop: 12, textAlign: 'right' }}>
            Showing {filtered.length} of {orders.length} orders
          </p>
        )}
      </div>

      {/* ── Drawer ── */}
      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={updateStatus}
          updatingId={updatingId}
        />
      )}
    </>
  )
}