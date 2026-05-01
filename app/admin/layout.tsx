import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MobileSidebarToggle from './mobile-sidebar-toggle'

const navItems = [
  {
    href: '/admin',
    label: 'Dashboard',
    badge: null,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    href: '/admin/banner',
    label: 'Banners',
    badge: null,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h10" />
      </svg>
    ),
  },
  {
    href: '/admin/categories',
    label: 'Categories',
    badge: null,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    href: '/admin/products',
    label: 'Products',
    badge: null,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    href: '/admin/orders',
    label: 'Orders',
    badge: 'New',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/admin/customers',
    label: 'Customers',
    badge: null,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  const email = user.email ?? ''

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080a10',
      fontFamily: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif",
      display: 'flex',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Syne:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e2235; border-radius: 99px; }
        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 10px;
          font-size: 13px; font-weight: 500;
          color: rgba(200,205,230,0.42);
          text-decoration: none;
          transition: background 0.15s, color 0.15s, transform 0.15s;
          position: relative;
          border: 1px solid transparent;
          cursor: pointer; letter-spacing: 0.01em;
        }
        .nav-item:hover {
          background: rgba(255,255,255,0.04);
          color: rgba(200,205,230,0.75);
          transform: translateX(2px);
        }
        .nav-item.active {
          background: linear-gradient(90deg, rgba(108,99,255,0.13) 0%, rgba(108,99,255,0.04) 100%);
          color: #a48fff;
          border-color: rgba(108,99,255,0.2);
        }
        .nav-item.active .nav-icon-wrap {
          background: rgba(108,99,255,0.2);
          color: #a48fff;
        }
        .nav-active-bar { display: none; }
        .nav-item.active .nav-active-bar {
          display: block; position: absolute;
          left: 0; top: 50%; transform: translateY(-50%);
          width: 3px; height: 55%;
          background: linear-gradient(180deg, #8b7ff5, #6c63ff);
          border-radius: 0 3px 3px 0;
        }
        .nav-icon-wrap {
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          flex-shrink: 0;
          transition: background 0.15s, color 0.15s;
        }
        .nav-badge {
          margin-left: auto; font-size: 9px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          padding: 2px 6px; border-radius: 4px;
          background: rgba(248,113,113,0.15); color: #f87171;
          border: 1px solid rgba(248,113,113,0.2);
        }
        .hdr-btn {
          width: 36px; height: 36px; border-radius: 9px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          display: flex; align-items: center; justify-content: center;
          color: rgba(200,205,230,0.4); cursor: pointer; position: relative;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .hdr-btn:hover {
          background: rgba(255,255,255,0.07);
          color: rgba(200,205,230,0.8);
          border-color: rgba(255,255,255,0.12);
        }
        .sign-out-btn {
          display: flex; align-items: center; justify-content: center; gap: 7px;
          width: 100%; padding: 8px 14px; border-radius: 9px;
          font-size: 12.5px; font-weight: 600; cursor: pointer;
          border: 1px solid rgba(248,113,113,0.15);
          background: rgba(248,113,113,0.06); color: rgba(248,113,113,0.7);
          transition: all 0.15s; font-family: inherit; letter-spacing: 0.01em;
        }
        .sign-out-btn:hover {
          background: rgba(248,113,113,0.12); color: #f87171;
          border-color: rgba(248,113,113,0.25);
        }
        .view-store-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 13px; border-radius: 9px;
          font-size: 12.5px; font-weight: 600; text-decoration: none;
          color: rgba(200,205,230,0.5);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          transition: all 0.15s; white-space: nowrap; letter-spacing: 0.01em;
        }
        .view-store-btn:hover {
          color: rgba(200,205,230,0.85);
          border-color: rgba(255,255,255,0.13);
          background: rgba(255,255,255,0.07);
        }
        .nav-group-label {
          font-size: 9px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.14em; color: rgba(200,205,230,0.18);
          padding: 6px 12px 8px;
        }
        .sidebar-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent);
          margin: 6px 0;
        }
        @keyframes pulse-online {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        .pulse-dot { animation: pulse-online 2.2s ease-in-out infinite; }
        .hdr-search {
          display: flex; align-items: center; gap: 7px;
          padding: 0 12px; height: 34px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 9px; color: rgba(200,205,230,0.35);
          font-size: 12.5px; font-family: inherit; cursor: pointer;
          transition: border-color 0.15s, background 0.15s; white-space: nowrap;
        }
        .hdr-search:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.12);
          color: rgba(200,205,230,0.55);
        }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 228, flexShrink: 0,
        background: '#0d0f18',
        borderRight: '1px solid rgba(255,255,255,0.055)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 50, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{
          padding: '18px 16px 16px',
          display: 'flex', alignItems: 'center', gap: 11,
          borderBottom: '1px solid rgba(255,255,255,0.055)',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #6c63ff 0%, #9f7eff 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 1px rgba(108,99,255,0.4), 0 6px 16px rgba(108,99,255,0.3)',
          }}>
            <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800, fontSize: 15,
              color: '#e4e6f4', letterSpacing: '-0.01em', lineHeight: 1.2,
            }}>Shafa</p>
            <p style={{
              fontSize: 9, color: 'rgba(200,205,230,0.28)',
              fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', lineHeight: 1.1, marginTop: 1,
            }}>Admin Panel</p>
          </div>
          <div style={{
            marginLeft: 'auto', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
            padding: '2px 7px', borderRadius: 4,
            background: 'rgba(108,99,255,0.12)', color: 'rgba(164,143,255,0.7)',
            border: '1px solid rgba(108,99,255,0.18)', textTransform: 'uppercase',
          }}>v2</div>
        </div>

        {/* Nav */}
        <nav style={{
          flex: 1, padding: '12px 8px',
          display: 'flex', flexDirection: 'column', overflowY: 'auto',
        }}>
          <p className="nav-group-label">Main</p>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-item">
              <span className="nav-active-bar" />
              <span className="nav-icon-wrap">{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </Link>
          ))}
          <div className="sidebar-divider" style={{ margin: '14px 4px 10px' }} />
          <p className="nav-group-label">System</p>
          <Link href="/admin/settings" className="nav-item">
            <span className="nav-icon-wrap">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            Settings
          </Link>
          <Link href="/docs" className="nav-item">
            <span className="nav-icon-wrap">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            Help & Docs
          </Link>
        </nav>

        {/* User card */}
        <div style={{ padding: '10px 8px 12px', borderTop: '1px solid rgba(255,255,255,0.055)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 11px', marginBottom: 8, borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #6c63ff 0%, #9f7eff 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: 'white',
              boxShadow: '0 0 0 2px rgba(108,99,255,0.25)',
            }}>{initials}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{
                fontSize: 12.5, fontWeight: 700, color: '#e4e6f4',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3,
              }}>{displayName}</p>
              <p style={{
                fontSize: 10, lineHeight: 1.2, marginTop: 1,
                color: 'rgba(200,205,230,0.32)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{email}</p>
            </div>
            <div className="pulse-dot" style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: '#22d3a5', boxShadow: '0 0 6px rgba(34,211,165,0.7)',
            }} />
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="sign-out-btn">
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{
        marginLeft: 228, flex: 1,
        display: 'flex', flexDirection: 'column', minHeight: '100vh',
      }}>
        {/* Header */}
        <header style={{
          height: 58,
          background: 'rgba(8,10,16,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.055)',
          position: 'sticky', top: 0, zIndex: 40,
          padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MobileSidebarToggle />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 15, fontWeight: 800, color: '#e4e6f4', letterSpacing: '-0.01em',
              }}>Admin</span>
              <svg width="12" height="12" fill="none" stroke="rgba(200,205,230,0.2)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
              <span style={{ fontSize: 12.5, color: 'rgba(200,205,230,0.38)', fontWeight: 500 }}>
                Dashboard
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="hdr-search">
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search…
              <span style={{
                marginLeft: 6, fontSize: 10, fontWeight: 600, padding: '1px 5px',
                borderRadius: 4, background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(200,205,230,0.25)',
              }}>⌘K</span>
            </div>
            <button className="hdr-btn">
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span style={{
                position: 'absolute', top: 7, right: 7,
                width: 6, height: 6, borderRadius: '50%',
                background: '#f87171', border: '1.5px solid #080a10',
              }} />
            </button>
            <Link href="/" target="_blank" className="view-store-btn">
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Store
            </Link>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '30px 28px', background: '#080a10' }}>
          {children}
        </main>
      </div>
    </div>
  )
}