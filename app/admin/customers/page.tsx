'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
interface Customer {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  avatar_url: string | null
  billing_address: any
  shipping_address: any
  total_orders: number
  total_spent: number
  last_order_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  email: string
}

type SortKey = 'name' | 'total_spent' | 'total_orders' | 'created_at'
type TierKey = 'All' | 'VIP' | 'Premium' | 'Regular' | 'New'

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const getCustomerTier = (spent: number): TierKey => {
  if (spent >= 1000) return 'VIP'
  if (spent >= 500)  return 'Premium'
  if (spent >= 100)  return 'Regular'
  return 'New'
}

const TIER_CFG: Record<TierKey, { bg: string; text: string; dot: string; glow: string }> = {
  All:     { bg: 'rgba(255,255,255,0.06)',  text: '#94a3b8', dot: '#64748b', glow: 'transparent' },
  VIP:     { bg: 'rgba(251,191,36,0.12)',   text: '#fbbf24', dot: '#f59e0b', glow: 'rgba(251,191,36,0.15)' },
  Premium: { bg: 'rgba(167,139,250,0.12)',  text: '#a78bfa', dot: '#8b5cf6', glow: 'rgba(139,92,246,0.15)' },
  Regular: { bg: 'rgba(56,189,248,0.10)',   text: '#38bdf8', dot: '#0ea5e9', glow: 'rgba(56,189,248,0.12)' },
  New:     { bg: 'rgba(148,163,184,0.08)',  text: '#94a3b8', dot: '#64748b', glow: 'transparent' },
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n)

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null

/* ─────────────────────────────────────────
   CSS
───────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@300;400;500&display=swap');

  .cust-root {
    min-height: 100vh;
    background: #020409;
    color: #e2e8f0;
    font-family: 'DM Sans', system-ui, sans-serif;
    position: relative;
    overflow-x: hidden;
  }

  /* ── Ambient background ── */
  .cust-bg-orb {
    position: fixed; pointer-events: none; z-index: 0;
    border-radius: 50%; filter: blur(100px); opacity: .28;
  }
  .cust-bg-orb-1 {
    width: 600px; height: 600px;
    background: radial-gradient(circle, #4c1d95, transparent 70%);
    top: -200px; right: -100px;
  }
  .cust-bg-orb-2 {
    width: 500px; height: 500px;
    background: radial-gradient(circle, #0f172a, #1e1b4b 60%, transparent);
    bottom: 0; left: -150px;
  }

  .cust-inner { max-width: 1300px; margin: 0 auto; padding: 36px 28px 60px; position: relative; z-index: 1; }

  /* ── Animations ── */
  @keyframes cust-up   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes cust-in   { from{opacity:0;transform:scale(.97)}       to{opacity:1;transform:scale(1)} }
  @keyframes cust-fade { from{opacity:0}                            to{opacity:1} }
  @keyframes cust-spin { to{transform:rotate(360deg)} }
  @keyframes cust-pulse{ 0%,100%{opacity:1} 50%{opacity:.4} }
  .a-up   { animation: cust-up   .42s cubic-bezier(.16,1,.3,1) both; }
  .a-in   { animation: cust-in   .38s cubic-bezier(.16,1,.3,1) both; }
  .a-fade { animation: cust-fade .5s ease both; }

  /* ── Header ── */
  .cust-header { margin-bottom: 32px; }
  .cust-eyebrow {
    display: flex; align-items: center; gap: 8px;
    font-family: 'DM Mono', monospace;
    font-size: 10.5px; letter-spacing: .18em;
    text-transform: uppercase; color: #6b7280;
    margin-bottom: 8px;
  }
  .cust-eyebrow-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #7c3aed;
    box-shadow: 0 0 8px #7c3aed;
    animation: cust-pulse 2.5s ease-in-out infinite;
  }
  .cust-title {
    font-size: 34px; font-weight: 600; color: #f1f5f9;
    letter-spacing: -.025em; line-height: 1.15;
    margin: 0 0 6px;
  }
  .cust-subtitle { font-size: 13.5px; color: #475569; }

  /* ── Stats grid ── */
  .cust-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px; margin-bottom: 24px;
  }
  @media(max-width:768px){ .cust-stats{ grid-template-columns:1fr 1fr; } }
  .cust-stat {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px; padding: 18px 20px;
    transition: border-color .2s, transform .2s;
    position: relative; overflow: hidden;
  }
  .cust-stat::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,.03) 0%, transparent 60%);
    pointer-events: none;
  }
  .cust-stat:hover {
    border-color: rgba(124,58,237,.35);
    transform: translateY(-2px);
  }
  .cust-stat-icon {
    width: 32px; height: 32px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; margin-bottom: 12px;
  }
  .cust-stat-val {
    font-size: 26px; font-weight: 600;
    letter-spacing: -.02em; line-height: 1;
    font-family: 'DM Mono', monospace;
  }
  .cust-stat-label {
    font-size: 11px; color: #475569;
    margin-top: 5px; font-weight: 500; letter-spacing: .02em;
  }

  /* ── Toolbar ── */
  .cust-toolbar {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 16px; flex-wrap: wrap;
  }
  .cust-search-wrap {
    position: relative; flex: 1; min-width: 200px; max-width: 320px;
  }
  .cust-search-icon {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    color: #475569; pointer-events: none;
  }
  .cust-search {
    width: 100%; height: 38px;
    padding: 0 12px 0 38px;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 10px;
    font-size: 13px; color: #e2e8f0;
    font-family: 'DM Sans', system-ui, sans-serif;
    outline: none; transition: border-color .18s, box-shadow .18s;
  }
  .cust-search::placeholder { color: #374151; }
  .cust-search:focus {
    border-color: rgba(124,58,237,.5);
    box-shadow: 0 0 0 3px rgba(124,58,237,.1);
    background: rgba(255,255,255,.06);
  }

  /* Tier filter pills */
  .cust-filters { display: flex; gap: 6px; flex-wrap: wrap; }
  .cust-filter-btn {
    height: 32px; padding: 0 12px;
    border-radius: 8px; border: 1px solid rgba(255,255,255,.08);
    font-size: 11.5px; font-weight: 600; cursor: pointer;
    font-family: 'DM Sans', system-ui, sans-serif;
    background: transparent; color: #475569;
    transition: all .18s; letter-spacing: .01em;
    display: flex; align-items: center; gap: 5px;
  }
  .cust-filter-btn:hover { border-color: rgba(124,58,237,.4); color: #a78bfa; }
  .cust-filter-btn.active {
    background: rgba(124,58,237,.18);
    border-color: rgba(124,58,237,.4);
    color: #a78bfa;
  }

  /* Sort select */
  .cust-sort {
    height: 32px; padding: 0 10px;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 8px;
    font-size: 11.5px; color: #64748b;
    font-family: 'DM Sans', system-ui, sans-serif;
    outline: none; cursor: pointer;
    transition: border-color .18s;
    margin-left: auto;
  }
  .cust-sort:focus { border-color: rgba(124,58,237,.4); }

  /* ── Table card ── */
  .cust-card {
    background: rgba(255,255,255,.025);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 20px; overflow: hidden;
  }
  .cust-card-top {
    padding: 16px 22px;
    border-bottom: 1px solid rgba(255,255,255,.05);
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .cust-results-count {
    font-size: 12.5px; color: #475569;
    font-family: 'DM Mono', monospace;
  }

  /* Table */
  .cust-tbl-wrap { overflow-x: auto; }
  .cust-tbl { width: 100%; border-collapse: collapse; }
  .cust-tbl thead tr { border-bottom: 1px solid rgba(255,255,255,.05); }
  .cust-tbl th {
    padding: 11px 20px;
    text-align: left;
    font-size: 10px; font-weight: 500;
    text-transform: uppercase; letter-spacing: .14em;
    color: #334155;
    font-family: 'DM Mono', monospace;
    white-space: nowrap;
  }
  .cust-tbl th:last-child { text-align: right; }
  .cust-tbl tbody tr {
    border-bottom: 1px solid rgba(255,255,255,.03);
    cursor: pointer;
    transition: background .15s;
  }
  .cust-tbl tbody tr:last-child { border-bottom: none; }
  .cust-tbl tbody tr:hover { background: rgba(255,255,255,.03); }
  .cust-tbl tbody tr.selected { background: rgba(124,58,237,.07); }
  .cust-tbl td { padding: 14px 20px; vertical-align: middle; }
  .cust-tbl td:last-child { text-align: right; }

  /* Customer name cell */
  .cust-name-cell { display: flex; align-items: center; gap: 11px; }
  .cust-avatar {
    width: 36px; height: 36px; border-radius: 11px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 12.5px; font-weight: 700; color: #a78bfa;
    background: rgba(124,58,237,.18);
    border: 1px solid rgba(124,58,237,.2);
    object-fit: cover;
    font-family: 'DM Sans', system-ui, sans-serif;
  }
  .cust-name-primary { font-size: 13.5px; font-weight: 600; color: #e2e8f0; }
  .cust-name-id {
    font-size: 10px; color: #374151;
    font-family: 'DM Mono', monospace; margin-top: 1px;
  }
  .cust-email {
    font-size: 12.5px; color: #475569;
    font-family: 'DM Mono', monospace;
    max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .cust-phone { font-size: 13px; color: #374151; }
  .cust-orders-val {
    font-size: 14px; font-weight: 600; color: #e2e8f0;
    font-family: 'DM Mono', monospace;
  }
  .cust-spent-val {
    font-size: 13.5px; font-weight: 600; color: #a78bfa;
    font-family: 'DM Mono', monospace;
  }
  .cust-tier-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 7px;
    font-size: 11px; font-weight: 700; letter-spacing: .03em;
    white-space: nowrap;
  }
  .cust-tier-dot { width: 5px; height: 5px; border-radius: 50%; }
  .cust-view-btn {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 5px 12px; border-radius: 8px;
    font-size: 12px; font-weight: 600;
    color: #6d28d9; background: rgba(124,58,237,.1);
    border: 1px solid rgba(124,58,237,.2);
    cursor: pointer; font-family: 'DM Sans', system-ui, sans-serif;
    transition: all .18s; white-space: nowrap;
  }
  .cust-view-btn:hover {
    background: rgba(124,58,237,.2);
    color: #a78bfa; border-color: rgba(124,58,237,.4);
  }
  .cust-active-dot {
    width: 7px; height: 7px; border-radius: 50%;
    display: inline-block; margin-right: 5px;
  }

  /* ── Detail panel ── */
  .cust-detail {
    background: rgba(124,58,237,.06);
    border: 1px solid rgba(124,58,237,.18);
    border-radius: 18px; padding: 24px;
    margin-bottom: 18px;
    position: relative; overflow: hidden;
  }
  .cust-detail::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(124,58,237,.5), transparent);
  }
  .cust-detail-header {
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 16px; margin-bottom: 22px;
  }
  .cust-detail-avatar {
    width: 52px; height: 52px; border-radius: 15px;
    background: rgba(124,58,237,.2);
    border: 1px solid rgba(124,58,237,.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 700; color: #a78bfa;
    flex-shrink: 0;
  }
  .cust-detail-name { font-size: 17px; font-weight: 600; color: #f1f5f9; }
  .cust-detail-email { font-size: 12.5px; color: #475569; font-family: 'DM Mono', monospace; margin-top: 2px; }
  .cust-close-btn {
    width: 30px; height: 30px; border-radius: 8px;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
    display: flex; align-items: center; justify-content: center;
    color: #475569; cursor: pointer; transition: all .18s;
    font-size: 13px; flex-shrink: 0;
  }
  .cust-close-btn:hover { background: rgba(255,255,255,.1); color: #e2e8f0; }
  .cust-detail-grid {
    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;
  }
  @media(max-width:640px){ .cust-detail-grid{ grid-template-columns:1fr; } }
  .cust-detail-section-label {
    font-size: 9.5px; font-weight: 500;
    text-transform: uppercase; letter-spacing: .16em;
    color: #334155; font-family: 'DM Mono', monospace;
    margin-bottom: 10px;
  }
  .cust-detail-row {
    display: flex; justify-content: space-between; align-items: baseline;
    padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,.03);
    font-size: 12.5px;
  }
  .cust-detail-row:last-child { border-bottom: none; }
  .cust-detail-key { color: #475569; }
  .cust-detail-val { color: #cbd5e1; font-weight: 500; font-family: 'DM Mono', monospace; }
  .cust-detail-val.accent { color: #a78bfa; }
  .cust-detail-val.green  { color: #34d399; }

  /* ── Empty ── */
  .cust-empty {
    padding: 64px 20px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
  }
  .cust-empty-icon {
    width: 52px; height: 52px; border-radius: 14px;
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07);
    display: flex; align-items: center; justify-content: center;
    color: #334155; margin-bottom: 4px;
  }
  .cust-empty-title { font-size: 14px; font-weight: 600; color: #64748b; }
  .cust-empty-sub   { font-size: 12.5px; color: #334155; }

  /* ── Skeleton ── */
  .cust-skel {
    height: 54px; border-radius: 8px; margin-bottom: 2px;
    background: linear-gradient(90deg,
      rgba(255,255,255,.03) 25%,
      rgba(255,255,255,.07) 50%,
      rgba(255,255,255,.03) 75%);
    background-size: 200% 100%;
    animation: cust-skel 1.6s ease-in-out infinite;
  }
  @keyframes cust-skel {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Scrollbar ── */
  .cust-root ::-webkit-scrollbar { width: 4px; height: 4px; }
  .cust-root ::-webkit-scrollbar-track { background: transparent; }
  .cust-root ::-webkit-scrollbar-thumb { background: rgba(124,58,237,.3); border-radius: 2px; }
`

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function CustomersManagementPage() {
  const [customers, setCustomers]           = useState<Customer[]>([])
  const [loading, setLoading]               = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [searchQuery, setSearchQuery]       = useState('')
  const [tierFilter, setTierFilter]         = useState<TierKey>('All')
  const [sortKey, setSortKey]               = useState<SortKey>('created_at')
  const detailRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    if (data && !error) {
      setCustomers(data.map((c: any) => ({ ...c, email: c.email || 'N/A' })))
    }
    setLoading(false)
  }

  const handleView = (customer: Customer) => {
    setSelectedCustomer(prev => prev?.id === customer.id ? null : customer)
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
  }

  /* Filter + sort */
  const filtered = customers
    .filter(c => {
      const q = searchQuery.toLowerCase()
      const matchQ = !q || [c.first_name, c.last_name, c.email, c.phone]
        .some(v => v?.toLowerCase().includes(q))
      const matchT = tierFilter === 'All' || getCustomerTier(c.total_spent) === tierFilter
      return matchQ && matchT
    })
    .sort((a, b) => {
      if (sortKey === 'name')         return (a.first_name ?? '').localeCompare(b.first_name ?? '')
      if (sortKey === 'total_spent')  return b.total_spent - a.total_spent
      if (sortKey === 'total_orders') return b.total_orders - a.total_orders
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const stats = {
    total:   customers.length,
    vip:     customers.filter(c => getCustomerTier(c.total_spent) === 'VIP').length,
    active:  customers.filter(c => c.is_active).length,
    revenue: customers.reduce((s, c) => s + (c.total_spent || 0), 0),
  }

  const STATS = [
    { label: 'Total Customers', value: stats.total,         color: '#e2e8f0', icon: '👥', iconBg: 'rgba(255,255,255,.06)' },
    { label: 'VIP Members',     value: stats.vip,           color: '#fbbf24', icon: '⭐', iconBg: 'rgba(251,191,36,.1)' },
    { label: 'Active',          value: stats.active,        color: '#34d399', icon: '🟢', iconBg: 'rgba(52,211,153,.1)' },
    { label: 'Total Revenue',   value: fmt(stats.revenue),  color: '#a78bfa', icon: '₹',  iconBg: 'rgba(124,58,237,.12)' },
  ]

  const TIERS: TierKey[] = ['All', 'VIP', 'Premium', 'Regular', 'New']

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="cust-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <style>{CSS}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 52, height: 52, margin: '0 auto 16px' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(255,255,255,.06)' }}/>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#7c3aed', animation: 'cust-spin 1s linear infinite' }}/>
          </div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: '#334155', animation: 'cust-pulse 2s ease-in-out infinite' }}>
            Loading customers
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="cust-root">
      <style>{CSS}</style>

      {/* Ambient orbs */}
      <div className="cust-bg-orb cust-bg-orb-1"/>
      <div className="cust-bg-orb cust-bg-orb-2"/>

      <div className="cust-inner">

        {/* ── Header ── */}
        <div className="cust-header a-up">
          <div className="cust-eyebrow">
            <span className="cust-eyebrow-dot"/>
            Customer Management
          </div>
          <h1 className="cust-title">Customers</h1>
          <p className="cust-subtitle">{customers.length} total customers across all tiers</p>
        </div>

        {/* ── Stats ── */}
        <div className="cust-stats a-fade" style={{ animationDelay: '.08s' }}>
          {STATS.map((s, i) => (
            <div key={s.label} className="cust-stat" style={{ animationDelay: `${.04 * i}s` }}>
              <div className="cust-stat-icon" style={{ background: s.iconBg }}>
                <span style={{ fontSize: 15 }}>{s.icon}</span>
              </div>
              <div className="cust-stat-val" style={{ color: s.color }}>{s.value}</div>
              <div className="cust-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Detail panel ── */}
        {selectedCustomer && (
          <div className="cust-detail a-in" ref={detailRef}>
            <div className="cust-detail-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="cust-detail-avatar">
                  {selectedCustomer.first_name?.charAt(0)}{selectedCustomer.last_name?.charAt(0)}
                </div>
                <div>
                  <div className="cust-detail-name">
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                    {' '}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 6,
                      fontSize: 10.5, fontWeight: 700,
                      background: TIER_CFG[getCustomerTier(selectedCustomer.total_spent)].bg,
                      color: TIER_CFG[getCustomerTier(selectedCustomer.total_spent)].text,
                      verticalAlign: 'middle', marginLeft: 4,
                    }}>
                      {getCustomerTier(selectedCustomer.total_spent)}
                    </span>
                  </div>
                  <div className="cust-detail-email">{selectedCustomer.email}</div>
                </div>
              </div>
              <button className="cust-close-btn" onClick={() => setSelectedCustomer(null)}>
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="cust-detail-grid">
              {/* Contact */}
              <div>
                <div className="cust-detail-section-label">Contact</div>
                {[
                  { k: 'Phone',    v: selectedCustomer.phone || '—' },
                  { k: 'Status',   v: selectedCustomer.is_active ? 'Active' : 'Inactive',
                    cls: selectedCustomer.is_active ? 'green' : '' },
                  { k: 'Member since', v: fmtDate(selectedCustomer.created_at) ?? '—' },
                  { k: 'Last updated', v: fmtDate(selectedCustomer.updated_at) ?? '—' },
                ].map(r => (
                  <div key={r.k} className="cust-detail-row">
                    <span className="cust-detail-key">{r.k}</span>
                    <span className={`cust-detail-val ${r.cls ?? ''}`}>{r.v}</span>
                  </div>
                ))}
              </div>

              {/* Orders */}
              <div>
                <div className="cust-detail-section-label">Order History</div>
                {[
                  { k: 'Total Orders', v: String(selectedCustomer.total_orders) },
                  { k: 'Total Spent',  v: fmt(selectedCustomer.total_spent), cls: 'accent' },
                  { k: 'Avg Order',    v: selectedCustomer.total_orders > 0
                    ? fmt(selectedCustomer.total_spent / selectedCustomer.total_orders) : '—', cls: 'accent' },
                  { k: 'Last Order',   v: fmtDate(selectedCustomer.last_order_date) ?? 'Never' },
                ].map(r => (
                  <div key={r.k} className="cust-detail-row">
                    <span className="cust-detail-key">{r.k}</span>
                    <span className={`cust-detail-val ${r.cls ?? ''}`}>{r.v}</span>
                  </div>
                ))}
              </div>

              {/* Address */}
              <div>
                <div className="cust-detail-section-label">Billing Address</div>
                {selectedCustomer.billing_address ? (
                  <>
                    {[
                      { k: 'Street', v: selectedCustomer.billing_address.street },
                      { k: 'City',   v: selectedCustomer.billing_address.city },
                      { k: 'State',  v: `${selectedCustomer.billing_address.state} ${selectedCustomer.billing_address.zip}` },
                      { k: 'Country',v: selectedCustomer.billing_address.country },
                    ].map(r => r.v ? (
                      <div key={r.k} className="cust-detail-row">
                        <span className="cust-detail-key">{r.k}</span>
                        <span className="cust-detail-val">{r.v}</span>
                      </div>
                    ) : null)}
                  </>
                ) : (
                  <p style={{ fontSize: 12.5, color: '#334155', fontStyle: 'italic' }}>No address on file</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="cust-toolbar a-up" style={{ animationDelay: '.12s' }}>
          <div className="cust-search-wrap">
            <span className="cust-search-icon">
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </span>
            <input
              className="cust-search"
              type="text"
              placeholder="Search name, email, phone…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="cust-filters">
            {TIERS.map(t => (
              <button
                key={t}
                className={`cust-filter-btn ${tierFilter === t ? 'active' : ''}`}
                onClick={() => setTierFilter(t)}
                style={tierFilter === t && t !== 'All' ? {
                  background: TIER_CFG[t].bg,
                  borderColor: TIER_CFG[t].dot + '66',
                  color: TIER_CFG[t].text,
                } : {}}
              >
                {t !== 'All' && (
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: TIER_CFG[t].dot, display: 'inline-block' }}/>
                )}
                {t}
              </button>
            ))}
          </div>

          <select
            className="cust-sort"
            value={sortKey}
            onChange={e => setSortKey(e.target.value as SortKey)}
          >
            <option value="created_at">Newest first</option>
            <option value="total_spent">Highest spend</option>
            <option value="total_orders">Most orders</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        {/* ── Table card ── */}
        <div className="cust-card a-up" style={{ animationDelay: '.16s' }}>
          <div className="cust-card-top">
            <span className="cust-results-count">
              {filtered.length} / {customers.length} customers
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ fontSize: 11.5, color: '#475569', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, system-ui' }}
              >
                Clear search
              </button>
            )}
          </div>

          <div className="cust-tbl-wrap">
            <table className="cust-tbl">
              <thead>
                <tr>
                  {['Customer', 'Email', 'Phone', 'Orders', 'Spent', 'Tier', 'Status', ''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="cust-empty">
                        <div className="cust-empty-icon">
                          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                          </svg>
                        </div>
                        <div className="cust-empty-title">No customers found</div>
                        <div className="cust-empty-sub">Try adjusting your search or filters</div>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((c, i) => {
                  const tier = getCustomerTier(c.total_spent)
                  const cfg  = TIER_CFG[tier]
                  const isSelected = selectedCustomer?.id === c.id
                  return (
                    <tr
                      key={c.id}
                      className={isSelected ? 'selected' : ''}
                      style={{ animation: `cust-up .4s cubic-bezier(.16,1,.3,1) ${.03 + i * .03}s both` }}
                      onClick={() => handleView(c)}
                    >
                      {/* Name */}
                      <td>
                        <div className="cust-name-cell">
                          {c.avatar_url
                            ? <img src={c.avatar_url} alt="" className="cust-avatar" style={{ borderRadius: 11 }}/>
                            : (
                              <div className="cust-avatar">
                                {c.first_name?.charAt(0)}{c.last_name?.charAt(0)}
                              </div>
                            )
                          }
                          <div>
                            <div className="cust-name-primary">{c.first_name} {c.last_name}</div>
                            <div className="cust-name-id">#{c.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      {/* Email */}
                      <td><div className="cust-email">{c.email}</div></td>
                      {/* Phone */}
                      <td><span className="cust-phone">{c.phone || '—'}</span></td>
                      {/* Orders */}
                      <td><span className="cust-orders-val">{c.total_orders}</span></td>
                      {/* Spent */}
                      <td><span className="cust-spent-val">{fmt(c.total_spent)}</span></td>
                      {/* Tier */}
                      <td>
                        <span className="cust-tier-badge" style={{ background: cfg.bg, color: cfg.text }}>
                          <span className="cust-tier-dot" style={{ background: cfg.dot }}/>
                          {tier}
                        </span>
                      </td>
                      {/* Status */}
                      <td>
                        <span style={{ fontSize: 12, color: c.is_active ? '#34d399' : '#475569' }}>
                          <span className="cust-active-dot" style={{ background: c.is_active ? '#34d399' : '#334155' }}/>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {/* Action */}
                      <td>
                        <button
                          className="cust-view-btn"
                          onClick={e => { e.stopPropagation(); handleView(c) }}
                        >
                          {isSelected ? 'Close' : 'View'}
                          {!isSelected && (
                            <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}