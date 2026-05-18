'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface DashboardStats {
  total_orders: number
  pending_orders: number
  processing_orders: number
  total_revenue: number
  total_customers: number
  low_stock_products: number
  active_coupons: number
}

/* ─── CSS (unified sand palette + dashboard tokens) ───────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Instrument+Serif:ital@0;1&display=swap');

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
    --accent-border: rgba(200,98,42,.25);
    --green:    #16a34a;
    --green-bg: rgba(22,163,74,.09);
    --green-border: rgba(22,163,74,.2);
    --red:      #dc2626;
    --red-bg:   rgba(220,38,38,.08);
    --red-border: rgba(220,38,38,.2);
    --blue:     #2563eb;
    --blue-bg:  rgba(37,99,235,.08);
    --blue-border: rgba(37,99,235,.18);
    --violet:   #7c3aed;
    --violet-bg: rgba(124,58,237,.08);
    --violet-border: rgba(124,58,237,.2);
    --amber:    #d97706;
    --amber-bg: rgba(217,119,6,.1);
    --amber-border: rgba(217,119,6,.22);
    --cyan:     #0891b2;
    --cyan-bg:  rgba(8,145,178,.08);
    --cyan-border: rgba(8,145,178,.18);
    --radius:   12px;
    --font: 'Instrument Sans', system-ui, sans-serif;
    --serif: 'Instrument Serif', Georgia, serif;
  }

  .dash-root {
    font-family: var(--font);
    color: var(--ink);
    background: var(--sand-50);
    min-height: 100vh;
  }

  /* ── Animations ── */
  @keyframes fade-up   { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
  @keyframes scale-in  { from { opacity:0; transform:scale(.97)       } to { opacity:1; transform:scale(1)     } }
  @keyframes spin      { to   { transform:rotate(360deg) } }
  @keyframes pulse-glow {
    0%,100% { box-shadow: 0 0 0 0 currentColor }
    50%      { box-shadow: 0 0 8px 3px currentColor }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0 }
    100% { background-position:  400px 0 }
  }

  .anim-1 { animation: fade-up .45s cubic-bezier(.16,1,.3,1) .05s both }
  .anim-2 { animation: fade-up .45s cubic-bezier(.16,1,.3,1) .12s both }
  .anim-3 { animation: fade-up .45s cubic-bezier(.16,1,.3,1) .20s both }
  .anim-4 { animation: fade-up .45s cubic-bezier(.16,1,.3,1) .28s both }
  .anim-5 { animation: fade-up .45s cubic-bezier(.16,1,.3,1) .36s both }
  .anim-6 { animation: fade-up .45s cubic-bezier(.16,1,.3,1) .44s both }

  .spinner { animation: spin .7s linear infinite }

  /* ── Section label ── */
  .section-label {
    font-size: 9.5px; font-weight: 800; text-transform: uppercase;
    letter-spacing: .16em; color: var(--sand-400);
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 14px;
  }
  .section-label::after {
    content: ''; flex: 1; height: 1px; background: var(--sand-200);
  }

  /* ── Page header ── */
  .dash-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 16px; flex-wrap: wrap; margin-bottom: 28px;
  }
  .dash-eyebrow {
    font-size: 10.5px; font-weight: 700; text-transform: uppercase;
    letter-spacing: .14em; color: var(--accent); margin-bottom: 6px;
  }
  .dash-title {
    font-family: var(--serif); font-size: 30px;
    letter-spacing: -.025em; color: var(--ink); line-height: 1;
    margin: 0 0 5px;
  }
  .dash-subtitle { font-size: 12.5px; color: var(--sand-400); font-weight: 500 }

  /* ── Live clock ── */
  .clock-pill {
    display: flex; align-items: center; gap: 10px;
    background: white; border: 1px solid var(--sand-200);
    border-radius: 10px; padding: 10px 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,.04);
  }
  .clock-divider { width: 1px; height: 18px; background: var(--sand-200) }
  .clock-time {
    font-family: monospace; font-size: 14px; font-weight: 700;
    color: var(--ink); letter-spacing: .04em; tabular-nums: normal;
  }
  .live-dot {
    width: 7px; height: 7px; border-radius: 50%; background: var(--green);
    box-shadow: 0 0 6px rgba(22,163,74,.7);
    animation: pulse-glow 2s ease infinite; color: var(--green);
  }
  .live-label { font-size: 11px; font-weight: 700; color: var(--sand-500) }

  /* ── Status bar ── */
  .status-bar {
    display: flex; gap: 6px; flex-wrap: wrap;
    background: white; border: 1px solid var(--sand-200);
    border-radius: 10px; padding: 10px 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,.04);
    margin-bottom: 28px;
  }
  .status-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; border-radius: 6px;
    background: var(--sand-50); border: 1px solid var(--sand-200);
    font-size: 11px; font-weight: 700;
  }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0 }

  /* ── Stat grid ── */
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 12px; margin-bottom: 12px;
  }

  /* ── Stat card ── */
  .stat-card {
    position: relative; background: white;
    border: 1px solid var(--sand-200);
    border-radius: var(--radius);
    padding: 18px 20px;
    display: flex; flex-direction: column; gap: 14px;
    transition: box-shadow .18s, transform .18s, border-color .18s;
    overflow: hidden;
  }
  .stat-card:hover {
    transform: translateY(-2px);
    border-color: var(--sand-300);
    box-shadow: 0 8px 24px rgba(0,0,0,.08);
  }
  .stat-card-glow {
    position: absolute; top: 0; right: 0;
    width: 80px; height: 80px; border-radius: 0 var(--radius) 0 50%;
    pointer-events: none; opacity: .45;
  }
  .stat-icon-wrap {
    width: 36px; height: 36px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .stat-top { display: flex; align-items: flex-start; justify-content: space-between }
  .stat-value {
    font-size: 28px; font-weight: 800; letter-spacing: -.035em;
    line-height: 1; color: var(--ink); font-family: monospace;
    margin-bottom: 3px;
  }
  .stat-label {
    font-size: 9.5px; font-weight: 800; text-transform: uppercase;
    letter-spacing: .12em; color: var(--sand-400);
  }
  .stat-sub { font-size: 11.5px; color: var(--sand-400); margin-top: 3px; font-weight: 500 }
  .trend-badge {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 3px 8px; border-radius: 6px;
    font-size: 11px; font-weight: 800; flex-shrink: 0;
  }

  /* ── Skeleton ── */
  .skeleton {
    border-radius: var(--radius); overflow: hidden;
    border: 1px solid var(--sand-100); background: var(--sand-100);
  }
  .skeleton-inner {
    width: 100%; height: 100%;
    background: linear-gradient(90deg, var(--sand-100) 25%, var(--sand-50) 50%, var(--sand-100) 75%);
    background-size: 400px 100%;
    animation: shimmer 1.4s ease infinite;
  }

  /* ── Quick link ── */
  .quick-link {
    display: flex; align-items: center; gap: 14px;
    background: white; border: 1px solid var(--sand-200);
    border-radius: var(--radius); padding: 14px 16px;
    text-decoration: none; color: inherit;
    transition: all .18s;
  }
  .quick-link:hover {
    border-color: var(--sand-300);
    box-shadow: 0 6px 20px rgba(0,0,0,.07);
    transform: translateY(-1px);
  }
  .quick-icon {
    width: 42px; height: 42px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    transition: transform .18s;
  }
  .quick-link:hover .quick-icon { transform: scale(1.08) }
  .quick-title { font-size: 13.5px; font-weight: 700; color: var(--ink); margin-bottom: 2px }
  .quick-desc  { font-size: 11.5px; color: var(--sand-400); font-weight: 500 }
  .quick-arrow {
    margin-left: auto; flex-shrink: 0; color: var(--sand-300);
    transition: transform .18s, color .18s;
  }
  .quick-link:hover .quick-arrow { transform: translateX(3px); color: var(--sand-500) }

  /* ── Quick link grid ── */
  .quick-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 10px;
  }

  /* ── Activity feed (bonus) ── */
  .activity-wrap {
    background: white; border: 1px solid var(--sand-200);
    border-radius: var(--radius); overflow: hidden;
  }
  .activity-head {
    padding: 14px 18px 12px; border-bottom: 1px solid var(--sand-100);
    background: var(--sand-50); font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .12em; color: var(--sand-500);
  }
  .activity-row {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 18px; border-bottom: 1px solid var(--sand-100);
    transition: background .15s;
  }
  .activity-row:last-child { border-bottom: none }
  .activity-row:hover { background: var(--sand-50) }
  .activity-dot-wrap {
    width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .activity-text { font-size: 12.5px; color: var(--sand-700); flex: 1; font-weight: 500 }
  .activity-time { font-size: 11px; color: var(--sand-400); font-family: monospace; white-space: nowrap }

  /* ── Bottom grid ── */
  .bottom-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px; margin-top: 28px;
  }
  @media(max-width: 780px) { .bottom-grid { grid-template-columns: 1fr } }
  @media(max-width: 640px) { .stat-grid { grid-template-columns: 1fr 1fr } }
  @media(max-width: 400px) { .stat-grid { grid-template-columns: 1fr } }
`

/* ─── Sparkline ──────────────────────────────────────────────────────────── */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1)
  const w = 90, h = 28, pad = 2
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2)
    const y = h - pad - (v / max) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const areaBottom = `${w - pad},${h - pad} ${pad},${h - pad}`
  const gradId = `sg${color.replace(/[^a-z0-9]/gi, '').slice(0, 8)}`
  const lastPt = pts.split(' ').pop()!
  const [lx, ly] = lastPt.split(',')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${pts} ${areaBottom}`} fill={`url(#${gradId})`} />
      <polyline points={pts} stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="3" fill={color} />
    </svg>
  )
}

/* ─── Status Pill ────────────────────────────────────────────────────────── */
function StatusPill({ dot, label, glow }: { dot: string; label: string; glow?: boolean }) {
  return (
    <span className="status-pill" style={{ color: 'var(--sand-600)' }}>
      <span className="status-dot" style={{
        background: dot,
        boxShadow: glow ? `0 0 6px ${dot}90` : 'none',
      }} />
      {label}
    </span>
  )
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function Skeleton({ h = 140 }: { h?: number }) {
  return (
    <div className="skeleton" style={{ height: h }}>
      <div className="skeleton-inner" />
    </div>
  )
}

/* ─── Trend Badge ────────────────────────────────────────────────────────── */
function TrendBadge({ value }: { value: number }) {
  const up = value >= 0
  return (
    <span className="trend-badge" style={{
      color: up ? '#16a34a' : '#dc2626',
      background: up ? 'rgba(22,163,74,.1)' : 'rgba(220,38,38,.08)',
    }}>
      <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d={up ? 'M7 17l10-10M17 7H7v10' : 'M17 7L7 17M7 17h10V7'} />
      </svg>
      {Math.abs(value)}%
    </span>
  )
}

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  accent: string
  accentBg: string
  accentBorder: string
  trend?: number
  spark?: number[]
  mono?: boolean
  delay?: number
}
function StatCard({ label, value, sub, icon, accent, accentBg, accentBorder, trend, spark, mono, delay = 0 }: StatCardProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div
      className="stat-card"
      style={{
        borderColor: accentBorder,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(12px)',
        transition: `opacity .4s ease ${delay}ms, transform .4s ease ${delay}ms, box-shadow .18s, border-color .18s`,
      }}
    >
      {/* Corner glow */}
      <div className="stat-card-glow" style={{
        background: `radial-gradient(circle at top right, ${accentBg}, transparent 70%)`,
      }} />
      {/* Top row */}
      <div className="stat-top">
        <div className="stat-icon-wrap" style={{ background: accentBg, border: `1px solid ${accentBorder}`, color: accent }}>
          {icon}
        </div>
        {trend !== undefined && <TrendBadge value={trend} />}
      </div>
      {/* Value + labels */}
      <div>
        <div className="stat-value" style={{ fontFamily: mono ? 'monospace' : "'Instrument Sans', sans-serif", fontSize: mono ? 22 : 28 }}>
          {value}
        </div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
      {/* Sparkline */}
      {spark && (
        <div style={{ marginTop: -6 }}>
          <Sparkline values={spark} color={accent} />
        </div>
      )}
    </div>
  )
}

/* ─── Quick Link ─────────────────────────────────────────────────────────── */
function QuickLink({ href, icon, title, desc, accent, accentBg, accentBorder }: {
  href: string; icon: React.ReactNode; title: string; desc: string
  accent: string; accentBg: string; accentBorder: string
}) {
  return (
    <Link href={href} className="quick-link" style={{ borderColor: accentBorder }}>
      <div className="quick-icon" style={{ background: accentBg, border: `1px solid ${accentBorder}`, color: accent }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="quick-title">{title}</div>
        <div className="quick-desc">{desc}</div>
      </div>
      <div className="quick-arrow">
        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

/* ─── Activity Feed ──────────────────────────────────────────────────────── */
const ACTIVITY = [
  { icon: '📦', text: 'New order #ORD-8821 placed', time: '2m ago', dot: '#7c3aed', bg: 'rgba(124,58,237,.08)' },
  { icon: '✅', text: 'Order #ORD-8814 delivered', time: '18m ago', dot: '#16a34a', bg: 'rgba(22,163,74,.08)' },
  { icon: '⚠️', text: 'Product "Silk Scarf" is low stock', time: '1h ago', dot: '#d97706', bg: 'rgba(217,119,6,.1)' },
  { icon: '👤', text: 'New customer registered', time: '2h ago', dot: '#2563eb', bg: 'rgba(37,99,235,.08)' },
  { icon: '🔖', text: 'Coupon SAVE20 redeemed ×4', time: '3h ago', dot: '#0891b2', bg: 'rgba(8,145,178,.08)' },
]

/* ─── Main Page ──────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n)

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState('')
  const [greeting, setGreeting] = useState('Good morning')

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats')
      if (data && !error) setStats(data)
      setLoading(false)
    }
    fetchStats()

    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      const h = now.getHours()
      setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  const orderSpark = [4, 7, 5, 9, 6, 11, 8, 13, 10, 15]
  const revSpark   = [3200, 4100, 3800, 5200, 4700, 6100, 5500, 7200, 6800, 8100]
  const custSpark  = [12, 18, 14, 22, 19, 27, 24, 31, 28, 35]

  return (
    <>
      <style>{CSS}</style>
      <div className="dash-root">
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px' }}>

          {/* ── Page Header ── */}
          <div className="dash-header anim-1">
            <div>
              <p className="dash-eyebrow">{greeting} 👋</p>
              <h1 className="dash-title">Dashboard</h1>
              <p className="dash-subtitle">{today}</p>
            </div>
            <div className="clock-pill">
              <div className="live-dot" />
              <span className="live-label">Live</span>
              <div className="clock-divider" />
              <span className="clock-time">{time || '-- : -- : --'}</span>
            </div>
          </div>

          {/* ── Status Bar ── */}
          <div className="status-bar anim-2">
            <StatusPill dot="#16a34a" label="Store Online" glow />
            <StatusPill dot="#16a34a" label="Payments Active" glow />
            <StatusPill
              dot={(stats?.low_stock_products ?? 0) > 0 ? '#d97706' : '#16a34a'}
              label={`${stats?.low_stock_products ?? '–'} Low Stock`}
            />
            <StatusPill
              dot={(stats?.pending_orders ?? 0) > 0 ? '#dc2626' : '#16a34a'}
              label={`${stats?.pending_orders ?? '–'} Pending`}
            />
            <StatusPill dot="#7c3aed" label={`${stats?.active_coupons ?? '–'} Active Coupons`} />
          </div>

          {/* ── Overview ── */}
          <p className="section-label anim-2">Overview</p>
          <div className="stat-grid anim-3">
            {loading ? (
              [0, 1, 2, 3].map(i => <Skeleton key={i} h={170} />)
            ) : (
              <>
                <StatCard
                  label="Total Orders" value={stats?.total_orders ?? 0}
                  sub={`${stats?.pending_orders ?? 0} pending`}
                  accent="#7c3aed" accentBg="rgba(124,58,237,.08)" accentBorder="rgba(124,58,237,.2)"
                  trend={12} spark={orderSpark} delay={0}
                  icon={<svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>}
                />
                <StatCard
                  label="Total Revenue" value={fmt(stats?.total_revenue ?? 0)}
                  sub="From completed orders"
                  accent="#16a34a" accentBg="rgba(22,163,74,.09)" accentBorder="rgba(22,163,74,.2)"
                  trend={8} spark={revSpark} mono delay={80}
                  icon={<svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
                />
                <StatCard
                  label="Total Customers" value={stats?.total_customers ?? 0}
                  sub="Registered accounts"
                  accent="#2563eb" accentBg="rgba(37,99,235,.08)" accentBorder="rgba(37,99,235,.18)"
                  trend={5} spark={custSpark} delay={160}
                  icon={<svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
                />
                <StatCard
                  label="Low Stock Items" value={stats?.low_stock_products ?? 0}
                  sub="Needs restocking soon"
                  accent="#d97706" accentBg="rgba(217,119,6,.1)" accentBorder="rgba(217,119,6,.22)"
                  trend={-3} delay={240}
                  icon={<svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>}
                />
              </>
            )}
          </div>

          {/* ── Secondary Stats ── */}
          <div className="stat-grid anim-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}>
            {loading ? (
              [0, 1, 2].map(i => <Skeleton key={i} h={130} />)
            ) : (
              <>
                <StatCard
                  label="Pending Orders" value={stats?.pending_orders ?? 0}
                  sub="Awaiting confirmation"
                  accent="#dc2626" accentBg="rgba(220,38,38,.08)" accentBorder="rgba(220,38,38,.2)"
                  delay={0}
                  icon={<svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
                />
                <StatCard
                  label="Processing" value={stats?.processing_orders ?? 0}
                  sub="In fulfillment pipeline"
                  accent="#7c3aed" accentBg="rgba(124,58,237,.08)" accentBorder="rgba(124,58,237,.2)"
                  delay={80}
                  icon={<svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>}
                />
                <StatCard
                  label="Active Coupons" value={stats?.active_coupons ?? 0}
                  sub="Currently live"
                  accent="#16a34a" accentBg="rgba(22,163,74,.09)" accentBorder="rgba(22,163,74,.2)"
                  delay={160}
                  icon={<svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>}
                />
              </>
            )}
          </div>

          {/* ── Bottom: Quick Actions + Activity ── */}
          <div className="bottom-grid">
            {/* Quick Actions */}
            <div className="anim-5">
              <p className="section-label">Quick Actions</p>
              <div className="quick-grid" style={{ gridTemplateColumns: '1fr' }}>
                <QuickLink href="/admin/banner"
                  accent="#7c3aed" accentBg="rgba(124,58,237,.08)" accentBorder="rgba(124,58,237,.2)"
                  title="Manage Banners" desc="Add, edit, or remove homepage banners"
                  icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h10"/></svg>}
                />
                <QuickLink href="/admin/categories"
                  accent="#16a34a" accentBg="rgba(22,163,74,.09)" accentBorder="rgba(22,163,74,.2)"
                  title="Manage Categories" desc="Create and organize product categories"
                  icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>}
                />
                <QuickLink href="/admin/products"
                  accent="#2563eb" accentBg="rgba(37,99,235,.08)" accentBorder="rgba(37,99,235,.18)"
                  title="Add Products" desc="Add new products to your store catalog"
                  icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4"/></svg>}
                />
                <QuickLink href="/admin/orders"
                  accent="#d97706" accentBg="rgba(217,119,6,.1)" accentBorder="rgba(217,119,6,.22)"
                  title="View Orders" desc="Review and manage customer orders"
                  icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
                />
                <QuickLink href="/admin/customers"
                  accent="#dc2626" accentBg="rgba(220,38,38,.08)" accentBorder="rgba(220,38,38,.2)"
                  title="Customers" desc="Browse and manage your customer base"
                  icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
                />
                <QuickLink href="/"
                  accent="#0891b2" accentBg="rgba(8,145,178,.08)" accentBorder="rgba(8,145,178,.18)"
                  title="View Storefront" desc="See your store as customers see it"
                  icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>}
                />
              </div>
            </div>

            {/* Activity Feed */}
            <div className="anim-6">
              <p className="section-label">Recent Activity</p>
              <div className="activity-wrap">
                <div className="activity-head">Latest events</div>
                {ACTIVITY.map((a, i) => (
                  <div key={i} className="activity-row">
                    <div className="activity-dot-wrap" style={{ background: a.bg, color: a.dot }}>
                      <span style={{ fontSize: 14 }}>{a.icon}</span>
                    </div>
                    <span className="activity-text">{a.text}</span>
                    <span className="activity-time">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}