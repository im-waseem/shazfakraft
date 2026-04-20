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

const S = {
  page: {
    fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
    color: '#e8eaf2',
  } as React.CSSProperties,

  heading: {
    fontFamily: "'Syne', 'Plus Jakarta Sans', sans-serif",
    fontSize: 26,
    fontWeight: 800,
    color: '#e8eaf2',
    letterSpacing: '-0.02em',
    marginBottom: 4,
  } as React.CSSProperties,

  subheading: {
    fontSize: 13,
    color: 'rgba(232,234,242,0.45)',
    fontWeight: 400,
    marginBottom: 28,
  } as React.CSSProperties,

  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'rgba(232,234,242,0.3)',
    marginBottom: 14,
  } as React.CSSProperties,

  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 32,
  } as React.CSSProperties,

  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 16,
    marginBottom: 32,
  } as React.CSSProperties,
}

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  accent: string
  accentBg: string
  sub?: string
}

function StatCard({ label, value, icon, accent, accentBg, sub }: StatCardProps) {
  return (
    <div style={{
      background: '#13161f',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      transition: 'border-color 0.2s, transform 0.2s',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.14)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
      }}
    >
      {/* accent glow blob */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: accentBg, filter: 'blur(24px)', pointerEvents: 'none',
      }} />
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: accentBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accent,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 12, color: 'rgba(232,234,242,0.45)', fontWeight: 500, marginBottom: 4 }}>{label}</p>
        <p style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 28, fontWeight: 800,
          color: '#e8eaf2', lineHeight: 1,
        }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: 'rgba(232,234,242,0.3)', marginTop: 6 }}>{sub}</p>}
      </div>
    </div>
  )
}

interface QuickLinkProps {
  href: string
  icon: React.ReactNode
  title: string
  desc: string
  color: string
  colorBg: string
}

function QuickLink({ href, icon, title, desc, color, colorBg }: QuickLinkProps) {
  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: 16,
      background: '#13161f',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14,
      padding: '18px 20px',
      textDecoration: 'none',
      transition: 'all 0.2s',
      color: 'inherit',
    }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.borderColor = color + '55'
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = `0 8px 24px rgba(0,0,0,0.2)`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.borderColor = 'rgba(255,255,255,0.07)'
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
      }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 12, flexShrink: 0,
        background: colorBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#e8eaf2', marginBottom: 3 }}>{title}</p>
        <p style={{ fontSize: 12, color: 'rgba(232,234,242,0.4)', lineHeight: 1.4 }}>{desc}</p>
      </div>
      <div style={{ marginLeft: 'auto', color: 'rgba(232,234,242,0.2)', flexShrink: 0 }}>
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div style={{
      background: '#13161f', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: '#1a1d28', animation: 'pulse 1.5s ease infinite' }} />
      <div>
        <div style={{ height: 10, width: '50%', borderRadius: 6, background: '#1a1d28', marginBottom: 10, animation: 'pulse 1.5s ease infinite' }} />
        <div style={{ height: 28, width: '60%', borderRadius: 8, background: '#1a1d28', animation: 'pulse 1.5s ease infinite' }} />
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats')
      if (data && !error) setStats(data)
      setLoading(false)
    }
    fetchStats()

    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .dash-animate { animation: fadeUp 0.4s ease both; }
      `}</style>

      {/* Page header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}
        className="dash-animate">
        <div>
          <h1 style={S.heading}>Dashboard</h1>
          <p style={S.subheading}>{today}</p>
        </div>
        <div style={{
          background: '#13161f', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10, padding: '8px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, color: 'rgba(232,234,242,0.5)',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22d3a5', boxShadow: '0 0 6px #22d3a5' }} />
          Live · {time}
        </div>
      </div>

      {/* Stat Cards */}
      <p style={S.sectionLabel}>Overview</p>
      <div style={S.grid4} className="dash-animate">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Orders"
              value={stats?.total_orders ?? 0}
              accent="#6c63ff"
              accentBg="rgba(108,99,255,0.15)"
              sub={`${stats?.pending_orders ?? 0} pending`}
              icon={
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              }
            />
            <StatCard
              label="Total Revenue"
              value={`₹${(stats?.total_revenue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`}
              accent="#22d3a5"
              accentBg="rgba(34,211,165,0.12)"
              sub="Completed orders"
              icon={
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="Total Customers"
              value={stats?.total_customers ?? 0}
              accent="#60a5fa"
              accentBg="rgba(96,165,250,0.12)"
              sub="Registered users"
              icon={
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            <StatCard
              label="Low Stock Items"
              value={stats?.low_stock_products ?? 0}
              accent="#f59e0b"
              accentBg="rgba(245,158,11,0.12)"
              sub="Needs restocking"
              icon={
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
          </>
        )}
      </div>

      {/* Second row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 36 }} className="dash-animate">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              label="Pending Orders"
              value={stats?.pending_orders ?? 0}
              accent="#f87171"
              accentBg="rgba(248,113,113,0.12)"
              sub="Awaiting confirmation"
              icon={
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="Processing"
              value={stats?.processing_orders ?? 0}
              accent="#a78bfa"
              accentBg="rgba(167,139,250,0.12)"
              sub="In fulfillment"
              icon={
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
            />
            <StatCard
              label="Active Coupons"
              value={stats?.active_coupons ?? 0}
              accent="#34d399"
              accentBg="rgba(52,211,153,0.12)"
              sub="Currently live"
              icon={
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              }
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <p style={S.sectionLabel}>Quick Actions</p>
      <div style={S.grid3} className="dash-animate">
        <QuickLink
          href="/admin/banner"
          color="#6c63ff"
          colorBg="rgba(108,99,255,0.12)"
          title="Manage Banners"
          desc="Add, edit, or remove homepage banners"
          icon={
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h10" />
            </svg>
          }
        />
        <QuickLink
          href="/admin/categories"
          color="#22d3a5"
          colorBg="rgba(34,211,165,0.12)"
          title="Manage Categories"
          desc="Create and organize product categories"
          icon={
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
        />
        <QuickLink
          href="/admin/products"
          color="#60a5fa"
          colorBg="rgba(96,165,250,0.12)"
          title="Add Products"
          desc="Add new products to your store"
          icon={
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
            </svg>
          }
        />
        <QuickLink
          href="/admin/orders"
          color="#f59e0b"
          colorBg="rgba(245,158,11,0.12)"
          title="View Orders"
          desc="Review and manage customer orders"
          icon={
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <QuickLink
          href="/admin/customers"
          color="#f87171"
          colorBg="rgba(248,113,113,0.12)"
          title="Customers"
          desc="Browse and manage your customer base"
          icon={
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <QuickLink
          href="/"
          color="#a78bfa"
          colorBg="rgba(167,139,250,0.12)"
          title="View Storefront"
          desc="See your store as customers see it"
          icon={
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          }
        />
      </div>

      {/* Status strip */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap',
        padding: '16px 20px',
        background: '#13161f',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
      }} className="dash-animate">
        {[
          { dot: '#22d3a5', label: 'Store Online' },
          { dot: '#22d3a5', label: 'Payments Active' },
          { dot: '#f59e0b', label: `${stats?.low_stock_products ?? 0} Low Stock` },
          { dot: stats?.pending_orders ? '#f87171' : '#22d3a5', label: `${stats?.pending_orders ?? 0} Pending Orders` },
        ].map(item => (
          <div key={item.label} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 12px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 50, border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.dot, boxShadow: `0 0 5px ${item.dot}` }} />
            <span style={{ fontSize: 12, color: 'rgba(232,234,242,0.6)', fontWeight: 500 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}