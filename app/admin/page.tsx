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

/* ─── Tiny Sparkline (pure SVG, no deps) ─── */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1)
  const w = 80, h = 28, pad = 2
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2)
    const y = h - pad - (v / max) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')
  const areaBottom = `${w - pad},${h - pad} ${pad},${h - pad}`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${pts} ${areaBottom}`} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={pts} stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
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
  trend?: number
  spark?: number[]
  delay?: number
}

function StatCard({ label, value, sub, icon, accent, accentBg, trend, spark, delay = 0 }: StatCardProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setTimeout(() => setMounted(true), delay) }, [delay])

  return (
    <div style={{
      background: 'linear-gradient(145deg, #111420 0%, #0e1019 100%)',
      border: `1px solid rgba(255,255,255,0.06)`,
      borderRadius: 16,
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0)' : 'translateY(12px)',
      cursor: 'default',
    }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = `${accent}30`
        el.style.transform = 'translateY(-3px)'
        el.style.boxShadow = `0 16px 40px rgba(0,0,0,0.35), 0 0 0 1px ${accent}18`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(255,255,255,0.06)'
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
      }}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 100, height: 100, borderRadius: '50%',
        background: accentBg, filter: 'blur(30px)',
        pointerEvents: 'none', opacity: 0.6,
      }} />

      {/* Top row: icon + trend */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: accentBg,
          border: `1px solid ${accent}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent, flexShrink: 0,
        }}>{icon}</div>

        {trend !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 700,
            color: trend >= 0 ? '#22d3a5' : '#f87171',
            background: trend >= 0 ? 'rgba(34,211,165,0.1)' : 'rgba(248,113,113,0.1)',
            border: `1px solid ${trend >= 0 ? 'rgba(34,211,165,0.2)' : 'rgba(248,113,113,0.2)'}`,
            padding: '3px 7px', borderRadius: 6,
          }}>
            {trend >= 0
              ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M7 17l10-10M17 7H7v10" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M17 7L7 17M7 17h10V7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            }
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      {/* Value + label */}
      <div>
        <p style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 30, fontWeight: 800,
          color: '#e4e6f4', lineHeight: 1,
          letterSpacing: '-0.03em',
        }}>{value}</p>
        <p style={{ fontSize: 12, color: 'rgba(200,205,230,0.42)', fontWeight: 500, marginTop: 5 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color: 'rgba(200,205,230,0.25)', marginTop: 3 }}>{sub}</p>}
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

/* ─── Quick Link ─── */
function QuickLink({ href, icon, title, desc, color, colorBg }: {
  href: string; icon: React.ReactNode; title: string; desc: string; color: string; colorBg: string
}) {
  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: 'linear-gradient(145deg, #111420, #0e1019)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14,
      padding: '15px 18px',
      textDecoration: 'none',
      color: 'inherit',
      transition: 'all 0.18s',
      position: 'relative',
      overflow: 'hidden',
    }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.borderColor = `${color}35`
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = `0 10px 30px rgba(0,0,0,0.3)`
        el.style.background = `linear-gradient(145deg, #131622, #0e1019)`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.borderColor = 'rgba(255,255,255,0.06)'
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
        el.style.background = 'linear-gradient(145deg, #111420, #0e1019)'
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 11, flexShrink: 0,
        background: colorBg, border: `1px solid ${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 700, color: '#e4e6f4', marginBottom: 2 }}>{title}</p>
        <p style={{ fontSize: 11.5, color: 'rgba(200,205,230,0.38)', lineHeight: 1.4 }}>{desc}</p>
      </div>
      <div style={{ color: 'rgba(200,205,230,0.18)', flexShrink: 0 }}>
        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

/* ─── Skeleton ─── */
function Skeleton({ h = 120 }: { h?: number }) {
  return (
    <div style={{
      height: h, borderRadius: 16,
      background: 'linear-gradient(90deg, #111420 25%, #161928 50%, #111420 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.6s ease infinite',
    }} />
  )
}

/* ─── Main Page ─── */
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
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
      const h = now.getHours()
      setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  /* Fake spark data for visual richness */
  const orderSpark = [4, 7, 5, 9, 6, 11, 8, 13, 10, 15]
  const revSpark = [3200, 4100, 3800, 5200, 4700, 6100, 5500, 7200, 6800, 8100]
  const custSpark = [12, 18, 14, 22, 19, 27, 24, 31, 28, 35]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .anim-1 { animation: fadeUp 0.4s 0.05s both; }
        .anim-2 { animation: fadeUp 0.4s 0.12s both; }
        .anim-3 { animation: fadeUp 0.4s 0.20s both; }
        .anim-4 { animation: fadeUp 0.4s 0.28s both; }
        .anim-5 { animation: fadeUp 0.4s 0.36s both; }
        .section-label {
          font-size: 9.5px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.14em; color: rgba(200,205,230,0.22);
          margin-bottom: 14px;
        }
      `}</style>

      {/* ── Page header ── */}
      <div className="anim-1" style={{
        marginBottom: 32,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <p style={{ fontSize: 12, color: 'rgba(200,205,230,0.35)', marginBottom: 4, fontWeight: 500 }}>
            {greeting} 👋
          </p>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 28, fontWeight: 800,
            color: '#e4e6f4', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 5,
          }}>Dashboard</h1>
          <p style={{ fontSize: 12.5, color: 'rgba(200,205,230,0.38)', fontWeight: 400 }}>{today}</p>
        </div>

        {/* Live clock pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20,
          padding: '10px 18px',
          background: 'linear-gradient(145deg, #111420, #0e1019)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#22d3a5', boxShadow: '0 0 8px rgba(34,211,165,0.7)',
              animation: 'pulse-ring 2s ease infinite',
            }} />
            <span style={{ fontSize: 12, color: 'rgba(200,205,230,0.5)', fontWeight: 500 }}>Live</span>
          </div>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.07)' }} />
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 14, fontWeight: 800, color: '#e4e6f4', letterSpacing: '0.02em',
          }}>{time}</span>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="anim-2" style={{ marginBottom: 28 }}>
        <div style={{
          display: 'flex', gap: 6, flexWrap: 'wrap',
          padding: '12px 16px',
          background: 'linear-gradient(145deg, #111420, #0e1019)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
        }}>
          {[
            { dot: '#22d3a5', label: 'Store Online', glow: true },
            { dot: '#22d3a5', label: 'Payments Active', glow: true },
            { dot: '#f59e0b', label: `${stats?.low_stock_products ?? '–'} Low Stock`, glow: false },
            {
              dot: (stats?.pending_orders ?? 0) > 0 ? '#f87171' : '#22d3a5',
              label: `${stats?.pending_orders ?? '–'} Pending`,
              glow: false,
            },
            { dot: '#a78bfa', label: `${stats?.active_coupons ?? '–'} Active Coupons`, glow: false },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 11px',
              background: 'rgba(255,255,255,0.035)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 50,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: item.dot,
                boxShadow: item.glow ? `0 0 5px ${item.dot}` : 'none',
              }} />
              <span style={{ fontSize: 11.5, color: 'rgba(200,205,230,0.55)', fontWeight: 500 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main stats grid ── */}
      <p className="section-label anim-2">Overview</p>
      <div className="anim-3" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
        gap: 14, marginBottom: 14,
      }}>
        {loading ? (
          [0,1,2,3].map(i => <Skeleton key={i} h={165} />)
        ) : (
          <>
            <StatCard
              label="Total Orders" value={stats?.total_orders ?? 0}
              sub={`${stats?.pending_orders ?? 0} pending confirmation`}
              accent="#7c6fff" accentBg="rgba(108,99,255,0.13)"
              trend={12} spark={orderSpark} delay={0}
              icon={<svg width="19" height="19" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>}
            />
            <StatCard
              label="Total Revenue"
              value={`₹${(stats?.total_revenue ?? 0).toLocaleString('en-IN')}`}
              sub="From completed orders"
              accent="#22d3a5" accentBg="rgba(34,211,165,0.1)"
              trend={8} spark={revSpark} delay={60}
              icon={<svg width="19" height="19" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            />
            <StatCard
              label="Total Customers" value={stats?.total_customers ?? 0}
              sub="Registered accounts"
              accent="#60a5fa" accentBg="rgba(96,165,250,0.1)"
              trend={5} spark={custSpark} delay={120}
              icon={<svg width="19" height="19" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
            />
            <StatCard
              label="Low Stock Items" value={stats?.low_stock_products ?? 0}
              sub="Needs restocking"
              accent="#f59e0b" accentBg="rgba(245,158,11,0.1)"
              trend={-3} delay={180}
              icon={<svg width="19" height="19" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>}
            />
          </>
        )}
      </div>

      {/* ── Secondary stats ── */}
      <div className="anim-3" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
        gap: 14, marginBottom: 36,
      }}>
        {loading ? (
          [0,1,2].map(i => <Skeleton key={i} h={130} />)
        ) : (
          <>
            <StatCard
              label="Pending Orders" value={stats?.pending_orders ?? 0}
              sub="Awaiting confirmation"
              accent="#f87171" accentBg="rgba(248,113,113,0.1)"
              delay={0}
              icon={<svg width="19" height="19" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            />
            <StatCard
              label="Processing" value={stats?.processing_orders ?? 0}
              sub="In fulfillment pipeline"
              accent="#a78bfa" accentBg="rgba(167,139,250,0.1)"
              delay={60}
              icon={<svg width="19" height="19" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>}
            />
            <StatCard
              label="Active Coupons" value={stats?.active_coupons ?? 0}
              sub="Currently live"
              accent="#34d399" accentBg="rgba(52,211,153,0.1)"
              delay={120}
              icon={<svg width="19" height="19" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>}
            />
          </>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <p className="section-label anim-4">Quick Actions</p>
      <div className="anim-4" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 12,
      }}>
        <QuickLink href="/admin/banner" color="#7c6fff" colorBg="rgba(108,99,255,0.12)"
          title="Manage Banners" desc="Add, edit, or remove homepage banners"
          icon={<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h10"/></svg>}
        />
        <QuickLink href="/admin/categories" color="#22d3a5" colorBg="rgba(34,211,165,0.1)"
          title="Manage Categories" desc="Create and organize product categories"
          icon={<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>}
        />
        <QuickLink href="/admin/products" color="#60a5fa" colorBg="rgba(96,165,250,0.1)"
          title="Add Products" desc="Add new products to your store"
          icon={<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4"/></svg>}
        />
        <QuickLink href="/admin/orders" color="#f59e0b" colorBg="rgba(245,158,11,0.1)"
          title="View Orders" desc="Review and manage customer orders"
          icon={<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
        />
        <QuickLink href="/admin/customers" color="#f87171" colorBg="rgba(248,113,113,0.1)"
          title="Customers" desc="Browse and manage your customer base"
          icon={<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
        />
        <QuickLink href="/" color="#a78bfa" colorBg="rgba(167,139,250,0.1)"
          title="View Storefront" desc="See your store as customers see it"
          icon={<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>}
        />
      </div>
    </>
  )
}