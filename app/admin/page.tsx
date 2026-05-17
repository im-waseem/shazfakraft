'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface DashboardStats {
  total_orders: number
  pending_orders: number
  processing_orders: number
  total_revenue: number
  total_customers: number
  low_stock_products: number
  active_coupons: number
}

/* ─── Sparkline ─── */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1)
  const w = 88, h = 30, pad = 2
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2)
    const y = h - pad - (v / max) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')
  const areaBottom = `${w - pad},${h - pad} ${pad},${h - pad}`
  const gradId = `sg-${color.replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${pts} ${areaBottom}`} fill={`url(#${gradId})`} />
      <polyline points={pts} stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {/* Last point dot */}
      {(() => {
        const lastPt = pts.split(' ').pop()!
        const [lx, ly] = lastPt.split(',')
        return <circle cx={lx} cy={ly} r="3" fill={color} />
      })()}
    </svg>
  )
}

/* ─── Stat Card ─── */
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
  delay?: number
}

function StatCard({ label, value, sub, icon, accent, accentBg, accentBorder, trend, spark, delay = 0 }: StatCardProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), delay); return () => clearTimeout(t) }, [delay])
  return (
    <div
      className="group relative bg-white rounded-2xl border p-5 flex flex-col gap-4 cursor-default transition-all duration-300 hover:-translate-y-1"
      style={{
        borderColor: accentBorder,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(14px)',
        transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms, box-shadow 0.2s ease, border-color 0.2s ease`,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 32px rgba(0,0,0,0.08), 0 0 0 1px ${accentBorder}`
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)'
      }}
    >
      {/* Subtle corner glow */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-3xl rounded-tr-2xl opacity-40 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${accentBg}, transparent 70%)` }} />

      {/* Icon + trend */}
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: accentBg, color: accent, border: `1px solid ${accentBorder}` }}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg"
            style={{
              color: trend >= 0 ? '#059669' : '#dc2626',
              background: trend >= 0 ? '#d1fae5' : '#fee2e2',
            }}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d={trend >= 0 ? 'M7 17l10-10M17 7H7v10' : 'M17 7L7 17M7 17h10V7'} />
            </svg>
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      {/* Value */}
      <div>
        <p className="text-3xl font-black tracking-tight leading-none mb-1.5"
          style={{ fontFamily: "'Syne', sans-serif", color: '#1c1917' }}>{value}</p>
        <p className="text-xs font-semibold text-stone-500">{label}</p>
        {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
      </div>

      {/* Sparkline */}
      {spark && (
        <div className="-mt-2">
          <Sparkline values={spark} color={accent} />
        </div>
      )}
    </div>
  )
}

/* ─── Quick Link ─── */
function QuickLink({ href, icon, title, desc, color, colorBg, colorBorder }: {
  href: string; icon: React.ReactNode; title: string; desc: string
  color: string; colorBg: string; colorBorder: string
}) {
  return (
    <Link href={href}
      className="group flex items-center gap-4 bg-white rounded-2xl border p-4 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: colorBorder, color: 'inherit' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px ${colorBorder}`
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = ''
      }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
        style={{ background: colorBg, color, border: `1px solid ${colorBorder}` }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-stone-800 mb-0.5 group-hover:text-stone-900 transition-colors">{title}</p>
        <p className="text-xs text-stone-500 leading-snug">{desc}</p>
      </div>
      <div className="text-stone-300 shrink-0 group-hover:translate-x-1 group-hover:text-stone-400 transition-all duration-200">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

/* ─── Skeleton ─── */
function Skeleton({ h = 120, delay = 0 }: { h?: number; delay?: number }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-stone-100"
      style={{ height: h, animationDelay: `${delay}ms` }}>
      <div className="h-full w-full animate-pulse bg-linear-to-r from-stone-100 via-stone-50 to-stone-100" />
    </div>
  )
}

/* ─── Status Pill ─── */
function StatusPill({ dot, label, glow }: { dot: string; label: string; glow: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-100 rounded-full shadow-sm">
      <div className="w-2 h-2 rounded-full shrink-0"
        style={{ background: dot, boxShadow: glow ? `0 0 6px ${dot}80` : 'none' }} />
      <span className="text-xs font-semibold text-stone-600 whitespace-nowrap">{label}</span>
    </div>
  )
}

/* ─── Main Page ─── */
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState('')
  const [greeting, setGreeting] = useState('Good morning')
  const [pageReady, setPageReady] = useState(false)

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
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      const h = now.getHours()
      setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')
    }
    tick()
    const id = setInterval(tick, 1000)

    setTimeout(() => setPageReady(true), 60)
    return () => clearInterval(id)
  }, [])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  })

  const orderSpark  = [4, 7, 5, 9, 6, 11, 8, 13, 10, 15]
  const revSpark    = [3200, 4100, 3800, 5200, 4700, 6100, 5500, 7200, 6800, 8100]
  const custSpark   = [12, 18, 14, 22, 19, 27, 24, 31, 28, 35]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.97) } to { opacity:1; transform:scale(1) } }
        .anim-1 { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .anim-2 { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.13s both; }
        .anim-3 { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.21s both; }
        .anim-4 { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.30s both; }
        .anim-5 { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.38s both; }
        .section-label {
          font-size: 9px; font-weight: 900; text-transform: uppercase;
          letter-spacing: 0.18em; color: #a8a29e; margin-bottom: 14px;
          display: flex; align-items: center; gap: 10px;
        }
        .section-label::after {
          content: ''; flex: 1; height: 1px; background: #e7e5e4;
        }
        @keyframes pulse-dot { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.6; transform:scale(1.4) } }
        .pulse-dot { animation: pulse-dot 2s ease infinite; }
      `}</style>

      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: '100vh', background: '#fafaf9' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

          {/* ── Page Header ── */}
          <div className="anim-1 flex items-start justify-between flex-wrap gap-4 mb-8">
            <div>
              <p className="text-sm text-stone-400 font-medium mb-1.5">{greeting} 👋</p>
              <h1 style={{ fontFamily: "'Syne', sans-serif" }}
                className="text-3xl font-black text-stone-900 tracking-tight leading-tight mb-1.5">
                Dashboard
              </h1>
              <p className="text-sm text-stone-400">{today}</p>
            </div>

            {/* Live clock */}
            <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-2xl px-5 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="pulse-dot w-2 h-2 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.6)' }} />
                <span className="text-xs text-stone-500 font-semibold">Live</span>
              </div>
              <div className="w-px h-5 bg-stone-100" />
              <span style={{ fontFamily: "'Syne', sans-serif" }} className="text-base font-black text-stone-800 tabular-nums">
                {time}
              </span>
            </div>
          </div>

          {/* ── Status Bar ── */}
          <div className="anim-2 mb-8">
            <div className="flex gap-2 flex-wrap bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 shadow-sm">
              <StatusPill dot="#10b981" label="Store Online" glow />
              <StatusPill dot="#10b981" label="Payments Active" glow />
              <StatusPill
                dot={(stats?.low_stock_products ?? 0) > 0 ? '#f59e0b' : '#10b981'}
                label={`${stats?.low_stock_products ?? '–'} Low Stock`}
                glow={false}
              />
              <StatusPill
                dot={(stats?.pending_orders ?? 0) > 0 ? '#ef4444' : '#10b981'}
                label={`${stats?.pending_orders ?? '–'} Pending`}
                glow={false}
              />
              <StatusPill dot="#8b5cf6" label={`${stats?.active_coupons ?? '–'} Active Coupons`} glow={false} />
            </div>
          </div>

          {/* ── Overview ── */}
          <p className="section-label anim-2">Overview</p>
          <div className="anim-3 grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {loading ? (
              [0,1,2,3].map(i => <Skeleton key={i} h={170} delay={i * 60} />)
            ) : (
              <>
                <StatCard
                  label="Total Orders" value={stats?.total_orders ?? 0}
                  sub={`${stats?.pending_orders ?? 0} pending confirmation`}
                  accent="#7c3aed" accentBg="#ede9fe" accentBorder="#ddd6fe"
                  trend={12} spark={orderSpark} delay={0}
                  icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>}
                />
                <StatCard
                  label="Total Revenue" value={`₹${(stats?.total_revenue ?? 0).toLocaleString('en-IN')}`}
                  sub="From completed orders"
                  accent="#059669" accentBg="#d1fae5" accentBorder="#a7f3d0"
                  trend={8} spark={revSpark} delay={80}
                  icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
                />
                <StatCard
                  label="Total Customers" value={stats?.total_customers ?? 0}
                  sub="Registered accounts"
                  accent="#2563eb" accentBg="#dbeafe" accentBorder="#bfdbfe"
                  trend={5} spark={custSpark} delay={160}
                  icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
                />
                <StatCard
                  label="Low Stock Items" value={stats?.low_stock_products ?? 0}
                  sub="Needs restocking"
                  accent="#d97706" accentBg="#fef3c7" accentBorder="#fde68a"
                  trend={-3} delay={240}
                  icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>}
                />
              </>
            )}
          </div>

          {/* ── Secondary Stats ── */}
          <div className="anim-3 grid gap-4 mb-10" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {loading ? (
              [0,1,2].map(i => <Skeleton key={i} h={130} delay={i * 60} />)
            ) : (
              <>
                <StatCard
                  label="Pending Orders" value={stats?.pending_orders ?? 0}
                  sub="Awaiting confirmation"
                  accent="#dc2626" accentBg="#fee2e2" accentBorder="#fecaca"
                  delay={0}
                  icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
                />
                <StatCard
                  label="Processing" value={stats?.processing_orders ?? 0}
                  sub="In fulfillment pipeline"
                  accent="#7c3aed" accentBg="#ede9fe" accentBorder="#ddd6fe"
                  delay={80}
                  icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>}
                />
                <StatCard
                  label="Active Coupons" value={stats?.active_coupons ?? 0}
                  sub="Currently live"
                  accent="#059669" accentBg="#d1fae5" accentBorder="#a7f3d0"
                  delay={160}
                  icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>}
                />
              </>
            )}
          </div>

          {/* ── Quick Actions ── */}
          <p className="section-label anim-4">Quick Actions</p>
          <div className="anim-5 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))' }}>
            <QuickLink href="/admin/banner"
              color="#7c3aed" colorBg="#ede9fe" colorBorder="#ddd6fe"
              title="Manage Banners" desc="Add, edit, or remove homepage banners"
              icon={<svg width="19" height="19" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h10"/></svg>}
            />
            <QuickLink href="/admin/categories"
              color="#059669" colorBg="#d1fae5" colorBorder="#a7f3d0"
              title="Manage Categories" desc="Create and organize product categories"
              icon={<svg width="19" height="19" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>}
            />
            <QuickLink href="/admin/products"
              color="#2563eb" colorBg="#dbeafe" colorBorder="#bfdbfe"
              title="Add Products" desc="Add new products to your store catalog"
              icon={<svg width="19" height="19" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4"/></svg>}
            />
            <QuickLink href="/admin/orders"
              color="#d97706" colorBg="#fef3c7" colorBorder="#fde68a"
              title="View Orders" desc="Review and manage customer orders"
              icon={<svg width="19" height="19" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
            />
            <QuickLink href="/admin/customers"
              color="#dc2626" colorBg="#fee2e2" colorBorder="#fecaca"
              title="Customers" desc="Browse and manage your customer base"
              icon={<svg width="19" height="19" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
            />
            <QuickLink href="/"
              color="#0891b2" colorBg="#cffafe" colorBorder="#a5f3fc"
              title="View Storefront" desc="See your store as customers see it"
              icon={<svg width="19" height="19" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>}
            />
          </div>

        </div>
      </div>
    </>
  )
}
