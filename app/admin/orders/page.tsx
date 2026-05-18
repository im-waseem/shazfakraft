'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface OrderItem {
  name: string; quantity: number; price: number; total?: number; image_url?: string
}
interface Customer {
  first_name: string | null; last_name: string | null; email: string | null; phone: string | null
}
interface Order {
  id: string; order_number: string; total_amount: number; status: string
  payment_status: string; fulfillment_status: string; created_at: string
  shipping_address: any; items: OrderItem[]; customers: Customer | Customer[] | null
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n)
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const ageDays = (s: string) =>
  Math.floor((Date.now() - new Date(s).getTime()) / 86_400_000)

/* ─── Status configs (sand-palette friendly) ──────────────────────────────── */
const ORDER_CFG: Record<string, { bg: string; text: string; dot: string }> = {
  pending:    { bg: 'rgba(217,119,6,.1)',   text: '#b45309', dot: '#d97706' },
  confirmed:  { bg: 'rgba(37,99,235,.08)',  text: '#1d4ed8', dot: '#3b82f6' },
  processing: { bg: 'rgba(124,58,237,.08)', text: '#6d28d9', dot: '#8b5cf6' },
  shipped:    { bg: 'rgba(8,145,178,.08)',  text: '#0e7490', dot: '#06b6d4' },
  delivered:  { bg: 'rgba(22,163,74,.09)',  text: '#15803d', dot: '#16a34a' },
  cancelled:  { bg: 'rgba(220,38,38,.08)',  text: '#b91c1c', dot: '#dc2626' },
  refunded:   { bg: 'rgba(107,114,128,.08)',text: '#6b7280', dot: '#9ca3af' },
}
const PAYMENT_CFG: Record<string, { bg: string; text: string; dot: string }> = {
  pending:    { bg: 'rgba(217,119,6,.1)',   text: '#b45309', dot: '#d97706' },
  authorized: { bg: 'rgba(37,99,235,.08)',  text: '#1d4ed8', dot: '#3b82f6' },
  captured:   { bg: 'rgba(22,163,74,.09)',  text: '#15803d', dot: '#16a34a' },
  failed:     { bg: 'rgba(220,38,38,.08)',  text: '#b91c1c', dot: '#dc2626' },
  refunded:   { bg: 'rgba(107,114,128,.08)',text: '#6b7280', dot: '#9ca3af' },
}
const FULFIL_CFG: Record<string, { bg: string; text: string; dot: string }> = {
  unfulfilled:         { bg: 'rgba(217,119,6,.1)',   text: '#b45309', dot: '#d97706' },
  partially_fulfilled: { bg: 'rgba(124,58,237,.08)', text: '#6d28d9', dot: '#8b5cf6' },
  fulfilled:           { bg: 'rgba(22,163,74,.09)',  text: '#15803d', dot: '#16a34a' },
  returned:            { bg: 'rgba(220,38,38,.08)',  text: '#b91c1c', dot: '#dc2626' },
}

function StatusBadge({ cfg, val }: { cfg: Record<string, any>; val: string }) {
  const c = cfg[val] ?? { bg: 'var(--sand-100)', text: 'var(--sand-500)', dot: 'var(--sand-300)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 6,
      fontSize: 11, fontWeight: 700, letterSpacing: '.02em',
      background: c.bg, color: c.text, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {val.replace(/_/g, ' ')}
    </span>
  )
}

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');

  :root {
    --sand-50:  #faf8f5;
    --sand-100: #f3f0ea;
    --sand-200: #e8e3d8;
    --sand-300: #d4cdbf;
    --sand-400: #b5ab98;
    --sand-500: #958a78;
    --sand-600: #756c5d;
    --sand-700: #524d43;
    --sand-800: #322f28;
    --ink:      #14120e;
    --accent:   #c8622a;
    --accent-lite: rgba(200,98,42,.1);
    --green:    #16a34a;
    --red:      #dc2626;
    --radius:   10px;
    --font: 'Instrument Sans', system-ui, sans-serif;
    --serif: 'Instrument Serif', Georgia, serif;
  }

  .ord-root { font-family: var(--font); color: var(--ink); animation: ord-in .35s ease both; }
  @keyframes ord-in { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

  /* Header */
  .ord-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:24px; flex-wrap:wrap; }
  .ord-title   { font-family:var(--serif); font-size:26px; letter-spacing:-.02em; color:var(--ink); line-height:1; }
  .ord-eyebrow { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.12em; color:var(--accent); margin-bottom:6px; }
  .ord-subtitle{ font-size:12.5px; color:var(--sand-400); margin-top:5px; font-weight:500; }

  /* Stats */
  .ord-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:22px; }
  @media(max-width:900px){ .ord-stats{ grid-template-columns:repeat(2,1fr); } }
  @media(max-width:500px){ .ord-stats{ grid-template-columns:1fr 1fr; } }
  .stat-card {
    background:white; border:1px solid var(--sand-200); border-radius:var(--radius);
    padding:14px 18px; transition:box-shadow .18s, transform .18s;
  }
  .stat-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.07); transform:translateY(-1px); }
  .stat-label { font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--sand-400); margin-bottom:6px; }
  .stat-value { font-size:26px; font-weight:700; letter-spacing:-.03em; line-height:1; }
  .stat-sub   { font-size:11px; color:var(--sand-400); margin-top:4px; font-weight:500; }
  .stat-icon  { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:15px; margin-bottom:10px; }

  /* Toolbar */
  .ord-toolbar { display:flex; align-items:center; gap:10px; margin-bottom:14px; flex-wrap:wrap; }
  .search-box { position:relative; flex:1; min-width:180px; max-width:280px; }
  .search-box svg { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:var(--sand-400); pointer-events:none; }
  .search-input {
    display:block; width:100%;
    border:1px solid var(--sand-200); border-radius:8px;
    padding:8px 30px 8px 34px;
    font-size:13px; font-family:var(--font); color:var(--ink);
    background:white; outline:none;
    transition:border-color .15s, box-shadow .15s;
  }
  .search-input::placeholder { color:var(--sand-300); }
  .search-input:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-lite); }
  .search-clear {
    position:absolute; right:9px; top:50%; transform:translateY(-50%);
    background:none; border:none; cursor:pointer;
    color:var(--sand-400); font-size:13px; padding:2px; transition:color .15s;
  }
  .search-clear:hover { color:var(--ink); }

  /* Filter pills */
  .filter-scroll { display:flex; gap:5px; flex-wrap:wrap; }
  .filter-pill {
    height:32px; padding:0 12px;
    border:1px solid var(--sand-200); border-radius:7px;
    font-size:11.5px; font-weight:600; cursor:pointer;
    font-family:var(--font); background:white; color:var(--sand-500);
    transition:all .15s; display:flex; align-items:center; gap:5px; white-space:nowrap;
    text-transform:capitalize;
  }
  .filter-pill:hover { border-color:var(--sand-300); color:var(--ink); }
  .filter-pill.active { background:var(--ink); color:white; border-color:var(--ink); }
  .filter-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }

  .sort-select {
    height:32px; padding:0 10px; margin-left:auto;
    background:white; border:1px solid var(--sand-200); border-radius:8px;
    font-size:12px; color:var(--sand-600);
    font-family:var(--font); outline:none; cursor:pointer;
    transition:border-color .15s;
  }
  .sort-select:focus { border-color:var(--accent); }

  .result-count { font-size:12px; color:var(--sand-400); font-weight:500; white-space:nowrap; }

  /* Order cards */
  .ord-card {
    background:white;
    border:1px solid var(--sand-200);
    border-radius:14px;
    overflow:hidden;
    transition:border-color .18s, box-shadow .18s;
    animation:card-rise .3s ease both;
  }
  @keyframes card-rise { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .ord-card:hover { border-color:var(--sand-300); box-shadow:0 4px 20px rgba(0,0,0,.07); }
  .ord-card.deleting { opacity:.4; pointer-events:none; }

  /* Card header */
  .card-head {
    padding:14px 18px 12px;
    border-bottom:1px solid var(--sand-100);
    display:flex; align-items:flex-start; gap:12px; flex-wrap:wrap;
    background:var(--sand-50);
  }
  .order-num { font-size:13.5px; font-weight:700; color:var(--ink); font-family:monospace; letter-spacing:.01em; }
  .order-date { font-size:11px; color:var(--sand-400); margin-top:3px; font-family:monospace; }
  .badge-row { display:flex; gap:5px; flex-wrap:wrap; align-items:center; margin-top:4px; }
  .order-amount {
    font-size:18px; font-weight:700; color:var(--ink);
    font-family:monospace; letter-spacing:-.01em;
    white-space:nowrap; margin-left:auto; align-self:flex-start;
  }

  /* Customer row */
  .cust-row {
    padding:12px 18px;
    border-bottom:1px solid var(--sand-100);
    display:flex; align-items:center; gap:12px; flex-wrap:wrap;
  }
  .cust-avatar {
    width:34px; height:34px; border-radius:9px; flex-shrink:0;
    background:var(--sand-100); border:1px solid var(--sand-200);
    display:flex; align-items:center; justify-content:center;
    font-size:12px; font-weight:700; color:var(--sand-600);
  }
  .cust-name  { font-size:13.5px; font-weight:600; color:var(--ink); }
  .cust-email { font-size:11.5px; color:var(--sand-400); font-family:monospace; margin-top:2px; }
  .cust-phone { font-size:12px; color:var(--sand-500); margin-top:1px; }
  .cust-address {
    margin-left:auto; text-align:right;
    font-size:11.5px; color:var(--sand-400); font-family:monospace;
    display:flex; flex-direction:column; gap:1px;
  }

  /* Items */
  .items-row { padding:12px 18px; border-bottom:1px solid var(--sand-100); }
  .items-label {
    font-size:9.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase;
    color:var(--sand-400); margin-bottom:8px;
  }
  .item-line {
    display:flex; align-items:center; gap:10px;
    padding:6px 0; border-bottom:1px solid var(--sand-100);
  }
  .item-line:last-child { border-bottom:none; }
  .item-dot { width:5px; height:5px; border-radius:50%; background:var(--sand-300); flex-shrink:0; }
  .item-name  { font-size:13px; color:var(--sand-700); flex:1; }
  .item-qty   { font-size:12px; color:var(--sand-400); font-family:monospace; }
  .item-price { font-size:13px; font-weight:700; color:var(--ink); font-family:monospace; }

  /* Controls */
  .controls-row {
    padding:12px 18px;
    display:flex; align-items:center; gap:8px; flex-wrap:wrap;
  }
  .ord-select {
    height:32px; padding:0 10px;
    background:white; border:1px solid var(--sand-200); border-radius:7px;
    font-size:12px; color:var(--sand-600);
    font-family:var(--font); outline:none; cursor:pointer;
    transition:border-color .15s; text-transform:capitalize;
  }
  .ord-select option { text-transform:capitalize; }
  .ord-select:focus { border-color:var(--accent); box-shadow:0 0 0 2px var(--accent-lite); }
  .ord-select:hover { border-color:var(--sand-300); }

  /* Delete zone */
  .del-wrap { margin-left:auto; display:flex; align-items:center; gap:8px; }
  .del-hint { font-size:11px; color:var(--sand-300); font-family:monospace; }
  .del-btn {
    height:32px; padding:0 13px;
    background:white; border:1px solid rgba(220,38,38,.2);
    border-radius:7px; font-size:12px; font-weight:600;
    color:var(--red); font-family:var(--font); cursor:pointer;
    transition:all .15s; white-space:nowrap;
  }
  .del-btn:hover:not(:disabled) { background:rgba(220,38,38,.05); border-color:rgba(220,38,38,.35); }
  .del-btn:disabled { opacity:.35; cursor:not-allowed; color:var(--sand-300); border-color:var(--sand-100); }
  .del-confirm {
    display:inline-flex; align-items:center; gap:8px;
    padding:5px 10px; border-radius:7px;
    background:rgba(220,38,38,.06); border:1px solid rgba(220,38,38,.18);
  }
  .del-confirm-text { font-size:12px; color:var(--red); font-weight:600; }
  .del-yes {
    padding:3px 10px; border-radius:5px;
    font-size:12px; font-weight:700; cursor:pointer;
    border:none; font-family:var(--font);
    background:var(--red); color:white; transition:opacity .15s;
  }
  .del-yes:disabled { opacity:.6; }
  .del-no {
    padding:3px 9px; border-radius:5px;
    font-size:12px; font-weight:600; cursor:pointer;
    background:white; color:var(--sand-500);
    border:1px solid var(--sand-200); font-family:var(--font);
  }

  /* Empty */
  .empty-state {
    padding:64px 24px; text-align:center;
    display:flex; flex-direction:column; align-items:center; gap:10px;
  }
  .empty-icon  { font-size:36px; opacity:.4; }
  .empty-title { font-size:14px; font-weight:600; color:var(--ink); }
  .empty-sub   { font-size:13px; color:var(--sand-400); }

  /* Toast */
  .toast {
    position:fixed; bottom:22px; right:22px; z-index:100;
    display:flex; align-items:center; gap:9px;
    padding:11px 17px; border-radius:10px;
    font-size:13.5px; font-weight:600;
    box-shadow:0 8px 28px rgba(0,0,0,.14);
    animation:toast-in .25s cubic-bezier(.16,1,.3,1) both;
    pointer-events:none; max-width:340px; font-family:var(--font);
  }
  @keyframes toast-in { from{opacity:0;transform:translateY(8px) scale(.97)} to{opacity:1;transform:none} }
  .toast.ok  { background:#15803d; color:white; }
  .toast.err { background:var(--red); color:white; }
  .toast.info{ background:var(--ink); color:white; }
  .toast-icon {
    width:20px; height:20px; border-radius:50%;
    background:rgba(255,255,255,.2);
    display:flex; align-items:center; justify-content:center;
    font-size:10px; font-weight:900; flex-shrink:0;
  }

  .spinner { animation:spin .7s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
`

const STATUS_FILTERS = ['all','pending','confirmed','processing','shipped','delivered','cancelled','refunded']

export default function AdminOrdersPage() {
  const [orders,        setOrders]        = useState<Order[]>([])
  const [loading,       setLoading]       = useState(true)
  const [deletingId,    setDeletingId]    = useState<string|null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string|null>(null)
  const [toast,         setToast]         = useState<{ msg:string; type:'ok'|'err'|'info' }|null>(null)
  const [search,        setSearch]        = useState('')
  const [statusFilter,  setStatusFilter]  = useState('all')
  const [sortKey,       setSortKey]       = useState('newest')

  const showToast = (msg: string, type: 'ok'|'err'|'info' = 'info') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500)
  }

  const fetchOrders = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('orders')
      .select('id,order_number,total_amount,status,payment_status,fulfillment_status,created_at,shipping_address,items,customers(first_name,last_name,email,phone)')
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
    showToast('Order updated', 'ok')
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id); setDeleteConfirm(null)
    const supabase = createClient()
    const { error } = await supabase.from('orders').delete().eq('id', id)
    setDeletingId(null)
    if (error) { showToast('Delete failed: ' + error.message, 'err'); return }
    setOrders(prev => prev.filter(o => o.id !== id))
    showToast('Order deleted', 'ok')
  }

  const filtered = orders
    .filter(o => {
      const c = Array.isArray(o.customers) ? o.customers[0] : o.customers
      const q = search.toLowerCase()
      const matchQ = !q || [o.order_number, c?.first_name, c?.last_name, c?.email, c?.phone].some(v => v?.toLowerCase().includes(q))
      const matchS = statusFilter === 'all' || o.status === statusFilter
      return matchQ && matchS
    })
    .sort((a, b) => {
      if (sortKey === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortKey === 'amount') return b.total_amount - a.total_amount
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const stats = {
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue:   orders.filter(o => !['cancelled','refunded'].includes(o.status)).reduce((s, o) => s + (o.total_amount || 0), 0),
  }

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:260, gap:12, fontFamily:'var(--font)' }}>
        <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sand-300)" strokeWidth="2.5">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        <span style={{ fontSize:13, color:'var(--sand-400)', fontWeight:500 }}>Loading orders…</span>
      </div>
    </>
  )

  return (
    <>
      <style>{CSS}</style>
      <div className="ord-root">

        {/* Toast */}
        {toast && (
          <div className={`toast ${toast.type}`}>
            <div className="toast-icon">{toast.type === 'ok' ? '✓' : toast.type === 'err' ? '✕' : 'i'}</div>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="ord-header">
          <div>
            <p className="ord-eyebrow">Commerce</p>
            <h1 className="ord-title">Orders</h1>
            <p className="ord-subtitle">{orders.length} total orders</p>
          </div>
        </div>

        {/* Stats */}
        <div className="ord-stats">
          {[
            { label: 'Total Orders', value: stats.total,        color: 'var(--ink)',   icon: '📦', iconBg: 'var(--sand-100)' },
            { label: 'Pending',      value: stats.pending,      color: '#b45309',      icon: '⏳', iconBg: 'rgba(217,119,6,.1)' },
            { label: 'Delivered',    value: stats.delivered,    color: 'var(--green)', icon: '✅', iconBg: 'rgba(22,163,74,.09)' },
            { label: 'Net Revenue',  value: fmt(stats.revenue), color: 'var(--ink)',   icon: '₹',  iconBg: 'var(--sand-100)', mono: true },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.iconBg }}>{s.icon}</div>
              <div className="stat-value" style={{ color: s.color, fontFamily: s.mono ? 'monospace' : 'inherit', fontSize: s.mono ? 20 : 26 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="ord-toolbar">
          <div className="search-box">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="search" className="search-input" placeholder="Search order, customer…"
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
          </div>

          <div className="filter-scroll">
            {STATUS_FILTERS.map(s => (
              <button key={s} className={`filter-pill ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}>
                {s !== 'all' && <span className="filter-dot" style={{ background: ORDER_CFG[s]?.dot ?? 'var(--sand-300)' }} />}
                {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <select className="sort-select" value={sortKey} onChange={e => setSortKey(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount">Highest amount</option>
          </select>

          <span className="result-count">{filtered.length} / {orders.length}</span>
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div style={{ background:'white', border:'1px solid var(--sand-200)', borderRadius:14, overflow:'hidden' }}>
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-title">No orders found</div>
              <div className="empty-sub">Try adjusting your search or filters</div>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map((o, i) => {
              const c = Array.isArray(o.customers) ? o.customers[0] : o.customers
              const days = ageDays(o.created_at)
              const canDelete = days >= 30
              const isDeleting = deletingId === o.id
              const isConfirming = deleteConfirm === o.id
              const initials = `${c?.first_name?.charAt(0) ?? ''}${c?.last_name?.charAt(0) ?? ''}` || '?'

              return (
                <div key={o.id} className={`ord-card ${isDeleting ? 'deleting' : ''}`} style={{ animationDelay: `${i * .04}s` }}>

                  {/* Header */}
                  <div className="card-head">
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="order-num">{o.order_number}</div>
                      <div className="order-date">{fmtDate(o.created_at)}</div>
                      <div className="badge-row">
                        <StatusBadge cfg={ORDER_CFG}   val={o.status} />
                        <StatusBadge cfg={PAYMENT_CFG} val={o.payment_status} />
                        <StatusBadge cfg={FULFIL_CFG}  val={o.fulfillment_status} />
                      </div>
                    </div>
                    <div className="order-amount">{fmt(o.total_amount)}</div>
                  </div>

                  {/* Customer */}
                  <div className="cust-row">
                    <div className="cust-avatar">{initials}</div>
                    <div>
                      <div className="cust-name">{c?.first_name} {c?.last_name}</div>
                      <div className="cust-email">{c?.email || '—'}</div>
                      {c?.phone && <div className="cust-phone">{c.phone}</div>}
                    </div>
                    {o.shipping_address && (
                      <div className="cust-address">
                        <span>{o.shipping_address.address || o.shipping_address.street || ''}</span>
                        <span>{[o.shipping_address.city, o.shipping_address.state, o.shipping_address.pincode || o.shipping_address.zip].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  {Array.isArray(o.items) && o.items.length > 0 && (
                    <div className="items-row">
                      <div className="items-label">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</div>
                      {o.items.map((it, idx) => (
                        <div key={idx} className="item-line">
                          <span className="item-dot" />
                          <span className="item-name">{it.name || 'Item'}</span>
                          <span className="item-qty">× {it.quantity || 1}</span>
                          <span className="item-price">{fmt(it.total ?? (Number(it.price||0) * Number(it.quantity||1)))}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Controls */}
                  <div className="controls-row">
                    {[
                      { key:'status',             label:'Status',      options:['pending','confirmed','processing','shipped','delivered','cancelled','refunded'], val:o.status },
                      { key:'payment_status',     label:'Payment',     options:['pending','authorized','captured','failed','refunded'],                           val:o.payment_status },
                      { key:'fulfillment_status', label:'Fulfillment', options:['unfulfilled','partially_fulfilled','fulfilled','returned'],                      val:o.fulfillment_status },
                    ].map(sel => (
                      <select key={sel.key} className="ord-select" value={sel.val}
                        onChange={e => updateOrder(o.id, { [sel.key]: e.target.value })}>
                        {sel.options.map(opt => (
                          <option key={opt} value={opt}>{sel.label}: {opt.replace(/_/g,' ')}</option>
                        ))}
                      </select>
                    ))}

                    <div className="del-wrap">
                      {!canDelete && <span className="del-hint">{30 - days}d until deletable</span>}
                      {isConfirming ? (
                        <div className="del-confirm">
                          <span className="del-confirm-text">Delete permanently?</span>
                          <button className="del-yes" disabled={isDeleting} onClick={() => handleDelete(o.id)}>
                            {isDeleting ? '…' : 'Yes'}
                          </button>
                          <button className="del-no" onClick={() => setDeleteConfirm(null)}>No</button>
                        </div>
                      ) : (
                        <button
                          className="del-btn"
                          disabled={!canDelete || isDeleting}
                          onClick={() => canDelete && setDeleteConfirm(o.id)}
                        >
                          {isDeleting ? (
                            <svg className="spinner" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display:'inline', verticalAlign:'middle', marginRight:4 }}>
                              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                            </svg>
                          ) : (
                            <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ display:'inline', verticalAlign:'middle', marginRight:4 }}>
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
    </>
  )
}