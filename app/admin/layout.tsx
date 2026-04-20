import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MobileSidebarToggle from './mobile-sidebar-toggle'

const navItems = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: (
      <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    href: '/admin/banner',
    label: 'Banners',
    icon: (
      <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h10" />
      </svg>
    ),
  },
  {
    href: '/admin/categories',
    label: 'Categories',
    icon: (
      <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    href: '/admin/products',
    label: 'Products',
    icon: (
      <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    href: '/admin/orders',
    label: 'Orders',
    icon: (
      <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/admin/customers',
    label: 'Customers',
    icon: (
      <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const initials = user.email?.charAt(0).toUpperCase() ?? 'A'
  const displayName = user.user_metadata?.name || user.email?.split('@')[0] || 'Admin'

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0c0e14',
      fontFamily: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif",
      display: 'flex',
    }}>
      {/* Inject Google Fonts + nav hover styles as a plain <style> tag — 
          this is in the server component but it's just a static string,
          not styled-jsx, so Next.js is fine with it */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        .admin-nav-link {
          display: flex; align-items: center; gap: 11px;
          padding: 9px 13px; border-radius: 10px;
          color: rgba(232,234,242,0.45); font-size: 13.5px; font-weight: 500;
          text-decoration: none; transition: all 0.18s; position: relative;
          border: 1px solid transparent;
        }
        .admin-nav-link:hover {
          background: #1a1d28; color: #e8eaf2;
        }
        .admin-nav-link.active {
          background: rgba(108,99,255,0.12);
          color: #a78bfa;
          border-color: rgba(108,99,255,0.18);
        }
        .admin-nav-link.active::before {
          content: '';
          position: absolute; left: -1px; top: 50%; transform: translateY(-50%);
          width: 3px; height: 58%; background: #6c63ff; border-radius: 0 2px 2px 0;
        }
        .admin-sign-out {
          display: flex; align-items: center; justify-content: center; gap: 7px;
          width: 100%; padding: 9px 16px; border-radius: 10px; font-size: 13px;
          font-weight: 600; cursor: pointer; border: 1px solid rgba(248,113,113,0.2);
          background: rgba(248,113,113,0.08); color: #f87171;
          transition: all 0.18s; font-family: inherit;
        }
        .admin-sign-out:hover { background: rgba(248,113,113,0.14); }
        .admin-header-btn {
          background: #1a1d28; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; width: 38px; height: 38px;
          display: flex; align-items: center; justify-content: center;
          color: rgba(232,234,242,0.45); cursor: pointer; position: relative;
          transition: border-color 0.18s;
        }
        .admin-header-btn:hover { border-color: rgba(255,255,255,0.14); color: #e8eaf2; }
        .view-store-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 8px 15px; border-radius: 10px; font-size: 12.5px; font-weight: 600;
          text-decoration: none; color: rgba(232,234,242,0.55);
          background: #1a1d28; border: 1px solid rgba(255,255,255,0.07);
          transition: all 0.18s; white-space: nowrap;
        }
        .view-store-btn:hover { color: #e8eaf2; border-color: rgba(255,255,255,0.14); }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #21253a; border-radius: 2px; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 232,
        flexShrink: 0,
        background: '#13161f',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 50,
        height: '100vh',
      }}>

        {/* Logo area */}
        <div style={{
          padding: '20px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 11,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #6c63ff 0%, #a78bfa 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(108,99,255,0.35)',
          }}>
            <svg width="17" height="17" fill="white" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800, fontSize: 15.5,
              color: '#e8eaf2', letterSpacing: '-0.01em', lineHeight: 1.2,
            }}>
              Shafa
            </p>
            <p style={{
              fontSize: 9.5, color: 'rgba(232,234,242,0.35)',
              fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase', lineHeight: 1,
            }}>
              Admin Panel
            </p>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{
          flex: 1, padding: '14px 10px',
          display: 'flex', flexDirection: 'column', gap: 2,
          overflowY: 'auto',
        }}>
          <p style={{
            fontSize: 9.5, fontWeight: 700,
            color: 'rgba(232,234,242,0.2)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            padding: '4px 13px 10px',
          }}>
            Navigation
          </p>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="admin-nav-link">
              <span style={{ opacity: 0.8, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User card + sign out */}
        <div style={{
          padding: '12px 10px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* User info row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', marginBottom: 10,
            borderRadius: 10, background: '#1a1d28',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: 'white',
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: 12, fontWeight: 700, color: '#e8eaf2',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                lineHeight: 1.3,
              }}>
                {displayName}
              </p>
              <p style={{ fontSize: 10, color: 'rgba(232,234,242,0.35)', lineHeight: 1 }}>
                Administrator
              </p>
            </div>
            {/* online dot */}
            <div style={{
              marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: '#22d3a5', boxShadow: '0 0 5px #22d3a5',
            }} />
          </div>

          <form action="/auth/signout" method="post">
            <button type="submit" className="admin-sign-out">
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div style={{
        marginLeft: 232,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>

        {/* Top bar */}
        <header style={{
          background: 'rgba(12,14,20,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'sticky', top: 0, zIndex: 40,
          padding: '0 26px', height: 62,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MobileSidebarToggle />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* breadcrumb-style title */}
              <span style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 16, fontWeight: 800,
                color: '#e8eaf2', letterSpacing: '-0.01em',
              }}>
                Admin
              </span>
              <svg width="14" height="14" fill="none" stroke="rgba(232,234,242,0.2)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span style={{ fontSize: 13, color: 'rgba(232,234,242,0.4)', fontWeight: 500 }}>
                Dashboard
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Notification bell */}
            <button className="admin-header-btn">
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span style={{
                position: 'absolute', top: 7, right: 7,
                width: 7, height: 7,
                background: '#f87171', borderRadius: '50%',
                border: '1.5px solid #0c0e14',
              }} />
            </button>

            <Link href="/" target="_blank" className="view-store-btn">
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Store
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main style={{
          flex: 1,
          padding: '28px 28px',
          background: '#0c0e14',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}