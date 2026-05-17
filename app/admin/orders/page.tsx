'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
interface OrderItem {
  name: string
  quantity: number
  price: number
  total?: number
  image_url?: string
}
interface Customer {
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
}
interface Order {
  id: string
  order_number: string
  total_amount: number
  status: string
  payment_status: string
  fulfillment_status: string
  created_at: string
  shipping_address: any
  items: OrderItem[]
  customers: Customer | Customer[] | null
}

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n)

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const ageDays = (s: string) =>
  Math.floor((Date.now() - new Date(s).getTime()) / 86_400_000)

/* Status colour maps */
const ORDER_STATUS_CFG: Record<string, { bg: string; text: string; dot: string }> = {
  pending:    { bg: 'rgba(251,191,36,.12)',  text: '#fbbf24', dot: '#f59e0b' },
  confirmed:  { bg: 'rgba(56,189,248,.10)',  text: '#38bdf8', dot: '#0ea5e9' },
  processing: { bg: 'rgba(167,139,250,.12)', text: '#a78bfa', dot: '#8b5cf6' },
  shipped:    { bg: 'rgba(34,211,170,.10)',  text: '#2dd4bf', dot: '#14b8a6' },
  delivered:  { bg: 'rgba(52,211,153,.10)',  text: '#34d399', dot: '#10b981' },
  cancelled:  { bg: 'rgba(248,113,113,.10)', text: '#f87171', dot: '#ef4444' },
  refunded:   { bg: 'rgba(148,163,184,.08)', text: '#94a3b8', dot: '#64748b' },
}
const PAYMENT_CFG: Record<string, { bg: string; text: string; dot: string }> = {
  pending:    { bg: 'rgba(251,191,36,.12)',  text: '#fbbf24', dot: '#f59e0b' },
  authorized: { bg: 'rgba(56,189,248,.10)',  text: '#38bdf8', dot: '#0ea5e9' },
  captured:   { bg: 'rgba(52,211,153,.10)',  text: '#34d399', dot: '#10b981' },
  failed:     { bg: 'rgba(248,113,113,.10)', text: '#f87171', dot: '#ef4444' },
  refunded:   { bg: 'rgba(148,163,184,.08)', text: '#94a3b8', dot: '#64748b' },
}
const FULFIL_CFG: Record<string, { bg: string; text: string; dot: string }> = {
  unfulfilled:         { bg: 'rgba(251,191,36,.12)',  text: '#fbbf24', dot: '#f59e0b' },
  partially_fulfilled: { bg: 'rgba(167,139,250,.12)', text: '#a78bfa', dot: '#8b5cf6' },
  fulfilled:           { bg: 'rgba(52,211,153,.10)',  text: '#34d399', dot: '#10b981' },
  returned:            { bg: 'rgba(248,113,113,.10)', text: '#f87171', dot: '#ef4444' },
}

const badge = (cfg: Record<string, any>, val: string) => {
  const c = cfg[val] ?? { bg: 'rgba(255,255,255,.06)', text: '#94a3b8', dot: '#64748b' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 7,
      fontSize: 11, fontWeight: 700, letterSpacing: '.03em',
      background: c.bg, color: c.text,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0 }}/>
      {val.replace(/_/g, ' ')}
    </span>
  )
}

/* ─────────────────────────────────────────
   CSS
───────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@300;400;500&display=swap');

  .ord-root {
    min-height: 100vh;
    background: #020409;
    color: #e2e8f0;
    font-family: 'DM Sans', system-ui, sans-serif;
    position: relative; overflow-x: hidden;
  }

  /* Orbs */
  .ord-orb {
    position: fixed; pointer-events: none; z-index: 0;
    border-radius: 50%; filter: blur(110px); opacity: .22;
  }
  .ord-orb-1 { width: 650px; height: 650px; background: radial-gradient(circle,#4c1d95,transparent 70%); top:-200px; right:-120px; }
  .ord-orb-2 { width: 500px; height: 500px; background: radial-gradient(circle,#0f172a,#1e1b4b 60%,transparent); bottom:0; left:-150px; }

  .ord-inner { max-width: 1100px; margin: 0 auto; padding: 36px 28px 60px; position: relative; z-index: 1; }

  /* Animations */
  @keyframes ord-up   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ord-in   { from{opacity:0;transform:scale(.97)}       to{opacity:1;transform:scale(1)} }
  @keyframes ord-fade { from{opacity:0}                            to{opacity:1} }
  @keyframes ord-spin { to{transform:rotate(360deg)} }
  @keyframes ord-pulse{ 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes ord-skel {
    0%   { background-position:200% 0; }
    100% { background-position:-200% 0; }
  }
  .a-up   { animation: ord-up   .42s cubic-bezier(.16,1,.3,1) both; }
  .a-in   { animation: ord-in   .38s cubic-bezier(.16,1,.3,1) both; }
  .a-fade { animation: ord-fade .5s ease both; }

  /* Scrollbar */
  .ord-root ::-webkit-scrollbar { width:4px; height:4px; }
  .ord-root ::-webkit-scrollbar-track { background:transparent; }
  .ord-root ::-webkit-scrollbar-thumb { background:rgba(124,58,237,.3); border-radius:2px; }

  /* Header */
  .ord-eyebrow {
    display:flex; align-items:center; gap:8px;
    font-family:'DM Mono',monospace;
    font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:#6b7280;
    margin-bottom:8px;
  }
  .ord-eyebrow-dot {
    width:6px; height:6px; border-radius:50%;
    background:#7c3aed; box-shadow:0 0 8px #7c3aed;
    animation: ord-pulse 2.5s ease-in-out infinite;
  }
  .ord-title {
    font-size:34px; font-weight:600; color:#f1f5f9;
    letter-spacing:-.025em; line-height:1.15; margin:0 0 6px;
  }
  .ord-subtitle { font-size:13.5px; color:#475569; }

  /* Stats */
  .ord-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
  @media(max-width:768px){ .ord-stats{ grid-template-columns:1fr 1fr; } }
  .ord-stat {
    background:rgba(255,255,255,.025);
    border:1px solid rgba(255,255,255,.07);
    border-radius:16px; padding:18px 20px;
    transition:border-color .2s, transform .2s;
    position:relative; overflow:hidden;
  }
  .ord-stat::before {
    content:''; position:absolute; inset:0;
    background:linear-gradient(135deg,rgba(255,255,255,.03) 0%,transparent 60%);
    pointer-events:none;
  }
  .ord-stat:hover { border-color:rgba(124,58,237,.35); transform:translateY(-2px); }
  .ord-stat-icon {
    width:32px; height:32px; border-radius:9px;
    display:flex; align-items:center; justify-content:center;
    font-size:14px; margin-bottom:12px;
  }
  .ord-stat-val {
    font-size:24px; font-weight:600; letter-spacing:-.02em; line-height:1;
    font-family:'DM Mono',monospace;
  }
  .ord-stat-label { font-size:11px; color:#475569; margin-top:5px; font-weight:500; letter-spacing:.02em; }

  /* Toolbar */
  .ord-toolbar { display:flex; align-items:center; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
  .ord-search-wrap { position:relative; flex:1; min-width:200px; max-width:300px; }
  .ord-search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#475569; pointer-events:none; }
  .ord-search {
    width:100%; height:36px; padding:0 12px 0 38px;
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
    border-radius:10px; font-size:13px; color:#e2e8f0;
    font-family:'DM Sans',system-ui,sans-serif; outline:none;
    transition:border-color .18s, box-shadow .18s;
  }
  .ord-search::placeholder { color:#374151; }
  .ord-search:focus { border-color:rgba(124,58,237,.5); box-shadow:0 0 0 3px rgba(124,58,237,.1); background:rgba(255,255,255,.06); }

  /* Filter pills */
  .ord-filters { display:flex; gap:6px; flex-wrap:wrap; }
  .ord-filter-btn {
    height:32px; padding:0 12px;
    border-radius:8px; border:1px solid rgba(255,255,255,.08);
    font-size:11.5px; font-weight:600; cursor:pointer;
    font-family:'DM Sans',system-ui,sans-serif;
    background:transparent; color:#475569;
    transition:all .18s; display:flex; align-items:center; gap:5px;
    text-transform:capitalize;
  }
  .ord-filter-btn:hover { border-color:rgba(124,58,237,.4); color:#a78bfa; }
  .ord-filter-btn.active { background:rgba(124,58,237,.18); border-color:rgba(124,58,237,.4); color:#a78bfa; }

  .ord-sort {
    height:32px; padding:0 10px; margin-left:auto;
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
    border-radius:8px; font-size:11.5px; color:#64748b;
    font-family:'DM Sans',system-ui,sans-serif; outline:none; cursor:pointer;
    transition:border-color .18s;
  }
  .ord-sort option { background:#0f172a; }
  .ord-sort:focus { border-color:rgba(124,58,237,.4); }

  /* Order cards */
  .ord-card {
    background:rgba(255,255,255,.025);
    border:1px solid rgba(255,255,255,.07);
    border-radius:18px; overflow:hidden;
    transition:border-color .2s, transform .2s;
    animation: ord-up .42s cubic-bezier(.16,1,.3,1) both;
  }
  .ord-card:hover { border-color:rgba(124,58,237,.25); }
  .ord-card.deleting { opacity:.45; pointer-events:none; }

  /* Card header */
  .ord-card-head {
    padding:16px 20px 14px;
    border-bottom:1px solid rgba(255,255,255,.05);
    display:flex; align-items:flex-start; gap:12px; flex-wrap:wrap;
  }
  .ord-card-head-left { flex:1; min-width:0; }
  .ord-order-num {
    font-size:14px; font-weight:700; color:#f1f5f9;
    font-family:'DM Mono',monospace; letter-spacing:.01em;
  }
  .ord-date { font-size:11px; color:#374151; margin-top:3px; font-family:'DM Mono',monospace; }
  .ord-badges { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
  .ord-amount {
    font-size:18px; font-weight:700; color:#a78bfa;
    font-family:'DM Mono',monospace; letter-spacing:-.01em;
    white-space:nowrap; align-self:flex-start;
    margin-left:auto;
  }

  /* Customer row */
  .ord-customer {
    padding:13px 20px;
    border-bottom:1px solid rgba(255,255,255,.05);
    display:flex; align-items:center; gap:12px; flex-wrap:wrap;
  }
  .ord-cust-avatar {
    width:34px; height:34px; border-radius:10px; flex-shrink:0;
    background:rgba(124,58,237,.18); border:1px solid rgba(124,58,237,.2);
    display:flex; align-items:center; justify-content:center;
    font-size:12px; font-weight:700; color:#a78bfa;
    font-family:'DM Sans',system-ui,sans-serif;
  }
  .ord-cust-name { font-size:13.5px; font-weight:600; color:#e2e8f0; }
  .ord-cust-email { font-size:11.5px; color:#475569; font-family:'DM Mono',monospace; }
  .ord-cust-phone { font-size:12px; color:#374151; }
  .ord-address {
    font-size:12px; color:#475569; font-family:'DM Mono',monospace;
    margin-left:auto; text-align:right;
    display:flex; flex-direction:column; gap:1px;
  }

  /* Items */
  .ord-items {
    padding:14px 20px;
    border-bottom:1px solid rgba(255,255,255,.05);
  }
  .ord-items-label {
    font-size:9.5px; font-weight:500; letter-spacing:.16em; text-transform:uppercase;
    color:#334155; font-family:'DM Mono',monospace; margin-bottom:10px;
  }
  .ord-item-row {
    display:flex; align-items:center; gap:10px;
    padding:7px 0; border-bottom:1px solid rgba(255,255,255,.03);
  }
  .ord-item-row:last-child { border-bottom:none; }
  .ord-item-dot {
    width:6px; height:6px; border-radius:50%;
    background:rgba(124,58,237,.4); flex-shrink:0;
  }
  .ord-item-name { font-size:13px; color:#cbd5e1; flex:1; }
  .ord-item-qty  { font-size:12px; color:#475569; font-family:'DM Mono',monospace; }
  .ord-item-price{ font-size:13px; font-weight:600; color:#a78bfa; font-family:'DM Mono',monospace; }

  /* Controls */
  .ord-controls {
    padding:14px 20px;
    display:flex; align-items:center; gap:8px; flex-wrap:wrap;
  }
  .ord-select {
    height:34px; padding:0 10px;
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
    border-radius:8px; font-size:12px; color:#94a3b8;
    font-family:'DM Sans',system-ui,sans-serif; outline:none; cursor:pointer;
    transition:border-color .18s, box-shadow .18s;
    text-transform:capitalize;
  }
  .ord-select option { background:#0f172a; text-transform:capitalize; }
  .ord-select:focus { border-color:rgba(124,58,237,.5); box-shadow:0 0 0 3px rgba(124,58,237,.1); }
  .ord-select:hover { border-color:rgba(255,255,255,.15); }

  .ord-del-wrap { margin-left:auto; display:flex; align-items:center; gap:8px; }
  .ord-del-hint { font-size:11px; color:#334155; font-family:'DM Mono',monospace; }
  .ord-del-confirm {
    display:inline-flex; align-items:center; gap:6px;
    padding:4px 8px; border-radius:8px;
    background:rgba(220,38,38,.1); border:1px solid rgba(220,38,38,.2);
  }
  .ord-del-confirm span { font-size:11.5px; color:#f87171; font-weight:600; }
  .ord-del-yes {
    padding:3px 9px; border-radius:5px;
    font-size:11.5px; font-weight:700; cursor:pointer;
    border:none; font-family:'DM Sans',system-ui,sans-serif;
    background:#dc2626; color:white; transition:opacity .15s;
  }
  .ord-del-yes:disabled { opacity:.6; }
  .ord-del-no {
    padding:3px 9px; border-radius:5px;
    font-size:11.5px; font-weight:700; cursor:pointer;
    background:rgba(255,255,255,.06); color:#64748b;
    border:1px solid rgba(255,255,255,.08);
    font-family:'DM Sans',system-ui,sans-serif;
  }
  .ord-del-btn {
    height:34px; padding:0 14px;
    background:rgba(220,38,38,.1); border:1px solid rgba(220,38,38,.2);
    border-radius:8px; font-size:12px; font-weight:700; color:#f87171;
    font-family:'DM Sans',system-ui,sans-serif; cursor:pointer;
    transition:all .18s; white-space:nowrap;
  }
  .ord-del-btn:hover { background:rgba(220,38,38,.2); border-color:rgba(220,38,38,.4); }
  .ord-del-btn:disabled { opacity:.4; cursor:not-allowed; }
  .ord-del-btn.locked {
    background:transparent; border-color:rgba(255,255,255,.06);
    color:#334155; cursor:not-allowed;
  }

  /* Empty */
  .ord-empty {
    padding:72px 20px; text-align:center;
    display:flex; flex-direction:column; align-items:center; gap:10px;
  }
  .ord-empty-icon {
    width:54px; height:54px; border-radius:15px;
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07);
    display:flex; align-items:center; justify-content:center; color:#334155;
    margin-bottom:4px;
  }
  .ord-empty-title { font-size:15px; font-weight:600; color:#64748b; }
  .ord-empty-sub   { font-size:13px; color:#334155; }

  /* Skeleton */
  .ord-skel {
    height:200px; border-radius:18px; margin-bottom:0;
    background:linear-gradient(90deg,rgba(255,255,255,.03) 25%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.03) 75%);
    background-size:200% 100%; animation:ord-skel 1.6s ease-in-out infinite;
  }

  /* Toast */
  .ord-toast {
    position:fixed; bottom:24px; right:24px; z-index:9999;
    padding:12px 18px; border-radius:12px;
    font-size:13px; font-weight:600; font-family:'DM Sans',system-ui,sans-serif;
    box-shadow:0 8px 28px rgba(0,0,0,.35);
    display:flex; align-items:center; gap:8px;
    animation:ord-in .28s cubic-bezier(.16,1,.3,1) both;
    pointer-events:none; max-width:340px;
    background:#1e1b4b; color:#e2e8f0;
    border:1px solid rgba(124,58,237,.3);
  }
  .ord-toast.err { background:#1f0a0a; color:#fca5a5; border-color:rgba(220,38,38,.3); }
  .ord-toast.ok  { background:#052e16; color:#86efac; border-color:rgba(52,211,153,.25); }
`

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function AdminOrdersPage() {
  const [orders, setOrders]             = useState<Order[]>([])
  const [loading, setLoading]           = useState(true)
  const [deletingId, setDeletingId]     = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast]               = useState<{ msg: string; type: 'ok' | 'err' | 'info' } | null>(null)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortKey, setSortKey]           = useState('newest')

  const showToast = (msg: string, type: 'ok' | 'err' | 'info' = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchOrders = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, total_amount, status, payment_status, fulfillment_status, created_at, shipping_address, items, customers(first_name,last_name,email,phone)')
      .order('created_at', { ascending: false })
    if (error) { showToast('Failed to load orders: ' + error.message, 'err'); setLoading(false); return }
    setOrders((data || []) as Order[])
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [])

  const updateOrder = async (id: string, updates: Record<string, string>) => {
    const supabase = createClient()
    const { error } = await supabase.from('orders').update(updates).eq('id', id)
    if (error) { showToast('Update failed: ' + error.message, 'err'); return }
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o))
    showToast('Order updated.', 'ok')
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    setDeleteConfirm(null)
    const supabase = createClient()
    const { error } = await supabase.from('orders').delete().eq('id', id)
    setDeletingId(null)
    if (error) { showToast('Delete failed: ' + error.message, 'err'); return }
    setOrders(prev => prev.filter(o => o.id !== id))
    showToast('Order permanently deleted.', 'ok')
  }

  /* ── Filter + sort ── */
  const filtered = orders
    .filter(o => {
      const c = Array.isArray(o.customers) ? o.customers[0] : o.customers
      const q = search.toLowerCase()
      const matchQ = !q || [
        o.order_number, c?.first_name, c?.last_name, c?.email, c?.phone,
      ].some(v => v?.toLowerCase().includes(q))
      const matchS = statusFilter === 'all' || o.status === statusFilter
      return matchQ && matchS
    })
    .sort((a, b) => {
      if (sortKey === 'oldest')  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortKey === 'amount')  return b.total_amount - a.total_amount
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  /* Stats */
  const stats = {
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue:   orders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
                     .reduce((s, o) => s + (o.total_amount || 0), 0),
  }
  const STATS = [
    { label: 'Total Orders',    value: stats.total,          color: '#e2e8f0', icon: '📦', iconBg: 'rgba(255,255,255,.06)' },
    { label: 'Pending',         value: stats.pending,        color: '#fbbf24', icon: '⏳', iconBg: 'rgba(251,191,36,.1)' },
    { label: 'Delivered',       value: stats.delivered,      color: '#34d399', icon: '✅', iconBg: 'rgba(52,211,153,.1)' },
    { label: 'Net Revenue',     value: fmt(stats.revenue),   color: '#a78bfa', icon: '₹',  iconBg: 'rgba(124,58,237,.12)' },
  ]

  const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

  /* ─── Loading ─── */
  if (loading) return (
    <div className="ord-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <style>{CSS}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', width: 52, height: 52, margin: '0 auto 16px' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(255,255,255,.06)' }}/>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#7c3aed', animation: 'ord-spin 1s linear infinite' }}/>
        </div>
        <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: '#334155', animation: 'ord-pulse 2s ease-in-out infinite' }}>
          Loading orders
        </p>
      </div>
    </div>
  )

  return (
    <div className="ord-root">
      <style>{CSS}</style>

      {/* Orbs */}
      <div className="ord-orb ord-orb-1"/>
      <div className="ord-orb ord-orb-2"/>

      {/* Toast */}
      {toast && (
        <div className={`ord-toast ${toast.type === 'err' ? 'err' : toast.type === 'ok' ? 'ok' : ''}`}>
          {toast.type === 'ok'
            ? <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
            : toast.type === 'err'
            ? <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
            : <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          }
          {toast.msg}
        </div>
      )}

      <div className="ord-inner">

        {/* ── Header ── */}
        <div style={{ marginBottom: 32 }} className="a-up">
          <div className="ord-eyebrow">
            <span className="ord-eyebrow-dot"/>
            Order Management
          </div>
          <h1 className="ord-title">Orders</h1>
          <p className="ord-subtitle">{orders.length} total orders</p>
        </div>

        {/* ── Stats ── */}
        <div className="ord-stats a-fade" style={{ animationDelay: '.08s' }}>
          {STATS.map((s, i) => (
            <div key={s.label} className="ord-stat" style={{ animationDelay: `${.04 * i}s` }}>
              <div className="ord-stat-icon" style={{ background: s.iconBg }}>
                <span style={{ fontSize: 15 }}>{s.icon}</span>
              </div>
              <div className="ord-stat-val" style={{ color: s.color }}>{s.value}</div>
              <div className="ord-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="ord-toolbar a-up" style={{ animationDelay: '.1s' }}>
          <div className="ord-search-wrap">
            <span className="ord-search-icon">
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </span>
            <input
              className="ord-search" type="text"
              placeholder="Search order, customer…"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="ord-filters">
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                className={`ord-filter-btn ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
                style={statusFilter === s && s !== 'all' && ORDER_STATUS_CFG[s] ? {
                  background: ORDER_STATUS_CFG[s].bg,
                  borderColor: ORDER_STATUS_CFG[s].dot + '66',
                  color: ORDER_STATUS_CFG[s].text,
                } : {}}
              >
                {s === 'all' ? 'All' : (
                  <>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: ORDER_STATUS_CFG[s]?.dot ?? '#64748b', display: 'inline-block' }}/>
                    {s.replace(/_/g,' ')}
                  </>
                )}
              </button>
            ))}
          </div>
          <select className="ord-sort" value={sortKey} onChange={e => setSortKey(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount">Highest amount</option>
          </select>
        </div>

        {/* ── Results count ── */}
        <div style={{ marginBottom: 14, fontSize: 12, color: '#334155', fontFamily: "'DM Mono',monospace" }}>
          {filtered.length} / {orders.length} orders
          {search && (
            <button onClick={() => setSearch('')} style={{ marginLeft: 10, fontSize: 11, color: '#475569', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,system-ui' }}>
              Clear
            </button>
          )}
        </div>

        {/* ── Order cards ── */}
        {filtered.length === 0 ? (
          <div className="ord-empty a-in">
            <div className="ord-empty-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div className="ord-empty-title">No orders found</div>
            <div className="ord-empty-sub">Try adjusting your search or filters</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((o, i) => {
              const c = Array.isArray(o.customers) ? o.customers[0] : o.customers
              const days = ageDays(o.created_at)
              const canDelete = days >= 30
              const isDeleting = deletingId === o.id
              const isConfirming = deleteConfirm === o.id
              const initials = `${c?.first_name?.charAt(0) ?? ''}${c?.last_name?.charAt(0) ?? ''}` || '?'

              return (
                <div
                  key={o.id}
                  className={`ord-card ${isDeleting ? 'deleting' : ''}`}
                  style={{ animationDelay: `${.05 + i * .04}s` }}
                >
                  {/* ── Card header ── */}
                  <div className="ord-card-head">
                    <div className="ord-card-head-left">
                      <div className="ord-order-num">{o.order_number}</div>
                      <div className="ord-date">{fmtDate(o.created_at)}</div>
                    </div>
                    <div className="ord-badges">
                      {badge(ORDER_STATUS_CFG, o.status)}
                      {badge(PAYMENT_CFG, o.payment_status)}
                      {badge(FULFIL_CFG, o.fulfillment_status)}
                    </div>
                    <div className="ord-amount">{fmt(o.total_amount)}</div>
                  </div>

                  {/* ── Customer ── */}
                  <div className="ord-customer">
                    <div className="ord-cust-avatar">{initials}</div>
                    <div>
                      <div className="ord-cust-name">{c?.first_name} {c?.last_name}</div>
                      <div className="ord-cust-email">{c?.email || '—'}</div>
                      {c?.phone && <div className="ord-cust-phone">{c.phone}</div>}
                    </div>
                    {o.shipping_address && (
                      <div className="ord-address">
                        <span>{o.shipping_address.address || o.shipping_address.street || ''}</span>
                        <span>{[o.shipping_address.city, o.shipping_address.state, o.shipping_address.pincode || o.shipping_address.zip].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* ── Items ── */}
                  {Array.isArray(o.items) && o.items.length > 0 && (
                    <div className="ord-items">
                      <div className="ord-items-label">Order Items · {o.items.length} product{o.items.length !== 1 ? 's' : ''}</div>
                      {o.items.map((it, idx) => (
                        <div key={idx} className="ord-item-row">
                          <span className="ord-item-dot"/>
                          <span className="ord-item-name">{it.name || 'Item'}</span>
                          <span className="ord-item-qty">× {it.quantity || 1}</span>
                          <span className="ord-item-price">
                            {fmt(it.total ?? (Number(it.price || 0) * Number(it.quantity || 1)))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Controls ── */}
                  <div className="ord-controls">
                    {/* Status selects */}
                    {[
                      { key: 'status',             label: 'Status',      options: ['pending','confirmed','processing','shipped','delivered','cancelled','refunded'], val: o.status },
                      { key: 'payment_status',     label: 'Payment',     options: ['pending','authorized','captured','failed','refunded'],                           val: o.payment_status },
                      { key: 'fulfillment_status', label: 'Fulfillment', options: ['unfulfilled','partially_fulfilled','fulfilled','returned'],                      val: o.fulfillment_status },
                    ].map(sel => (
                      <select
                        key={sel.key}
                        className="ord-select"
                        value={sel.val}
                        onChange={e => updateOrder(o.id, { [sel.key]: e.target.value })}
                      >
                        {sel.options.map(opt => (
                          <option key={opt} value={opt}>{sel.label}: {opt.replace(/_/g,' ')}</option>
                        ))}
                      </select>
                    ))}

                    {/* Delete zone */}
                    <div className="ord-del-wrap">
                      {!canDelete && (
                        <span className="ord-del-hint">{30 - days}d until deletable</span>
                      )}
                      {isConfirming ? (
                        <div className="ord-del-confirm">
                          <span>Delete permanently?</span>
                          <button className="ord-del-yes" disabled={isDeleting} onClick={() => handleDelete(o.id)}>
                            {isDeleting ? '…' : 'Yes'}
                          </button>
                          <button className="ord-del-no" onClick={() => setDeleteConfirm(null)}>No</button>
                        </div>
                      ) : (
                        <button
                          className={`ord-del-btn ${!canDelete ? 'locked' : ''}`}
                          disabled={!canDelete || isDeleting}
                          onClick={() => canDelete && setDeleteConfirm(o.id)}
                        >
                          {isDeleting ? (
                            <svg className="ord-spinner" width="12" height="12" style={{ animation: 'ord-spin 1s linear infinite' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 8z"/>
                            </svg>
                          ) : (
                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          )}
                          {isDeleting ? 'Deleting…' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}