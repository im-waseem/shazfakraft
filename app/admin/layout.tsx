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
      <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
          d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    href: '/admin/banner',
    label: 'Banners',
    badge: null,
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4 6h16M4 10h16M4 14h10" />
      </svg>
    ),
  },
  {
    href: '/admin/categories',
    label: 'Categories',
    badge: null,
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    href: '/admin/products',
    label: 'Products',
    badge: null,
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    href: '/admin/orders',
    label: 'Orders',
    badge: 'New',
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/admin/customers',
    label: 'Customers',
    badge: null,
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/admin/reviews',
    label: 'Reviews',
    badge: null,
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    href: '/admin/coupons',
    label: 'Coupons',
    badge: null,
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const initials = user.email?.charAt(0).toUpperCase() ?? 'A'
  const displayName = user.user_metadata?.name || user.email?.split('@')[0] || 'Admin'
  const email = user.email ?? ''

  return (
    <div className="admin-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --sand-50:  #faf8f5;
          --sand-100: #f3f0ea;
          --sand-200: #e8e3d8;
          --sand-300: #d6cfc0;
          --sand-400: #b8ae9a;
          --sand-500: #998f7a;
          --sand-600: #7a7163;
          --sand-700: #5a5349;
          --sand-800: #3d3830;
          --sand-900: #201e19;
          --ink:      #14120e;
          --accent:   #c8622a;
          --accent-2: #e07a3d;
          --accent-dim: rgba(200,98,42,.12);
          --sidebar-w: 228px;
          --header-h:  58px;
          --radius:    10px;
          --font-body: 'Instrument Sans', system-ui, sans-serif;
          --font-serif: 'Instrument Serif', Georgia, serif;
        }

        .admin-root {
          min-height: 100vh;
          background: var(--sand-100);
          font-family: var(--font-body);
          display: flex;
          color: var(--ink);
        }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--sand-300); border-radius: 99px; }

        /* ══════════════════════════════
           SIDEBAR
        ══════════════════════════════ */
        .sidebar {
          width: var(--sidebar-w);
          flex-shrink: 0;
          background: var(--sand-50);
          border-right: 1px solid var(--sand-200);
          display: flex;
          flex-direction: column;
          position: fixed;
          inset: 0 auto 0 0;
          z-index: 50;
          height: 100vh;
        }

        /* Logo */
        .sidebar-logo {
          padding: 20px 16px 18px;
          border-bottom: 1px solid var(--sand-200);
          display: flex;
          align-items: center;
          gap: 11px;
          text-decoration: none;
        }
        .logo-mark {
          width: 34px; height: 34px;
          border-radius: 9px;
          background: var(--ink);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }
        .logo-mark::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,.08));
        }
        .logo-mark svg { position: relative; z-index: 1; }
        .logo-text-primary {
          font-family: var(--font-serif);
          font-size: 18px;
          color: var(--ink);
          letter-spacing: -.02em;
          line-height: 1;
        }
        .logo-text-secondary {
          font-size: 9.5px;
          color: var(--sand-400);
          font-weight: 600;
          letter-spacing: .12em;
          text-transform: uppercase;
          margin-top: 2px;
        }

        /* Nav */
        .sidebar-nav {
          flex: 1;
          padding: 14px 10px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .nav-section-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: var(--sand-300);
          padding: 10px 8px 6px;
          margin-top: 2px;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: var(--radius);
          font-size: 13.5px;
          font-weight: 500;
          color: var(--sand-600);
          text-decoration: none;
          transition: all .18s ease;
          position: relative;
          border: 1px solid transparent;
          letter-spacing: -.01em;
        }
        .nav-link:hover {
          background: var(--sand-100);
          color: var(--ink);
          border-color: var(--sand-200);
        }
        .nav-link.active {
          background: white;
          color: var(--ink);
          border-color: var(--sand-200);
          box-shadow: 0 1px 8px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.03);
          font-weight: 600;
        }
        .nav-link.active::before {
          content: '';
          position: absolute;
          left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 60%;
          background: var(--accent);
          border-radius: 0 3px 3px 0;
        }
        .nav-icon {
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 7px;
          background: var(--sand-100);
          color: var(--sand-500);
          flex-shrink: 0;
          transition: all .18s ease;
        }
        .nav-link:hover .nav-icon {
          background: var(--sand-200);
          color: var(--ink);
        }
        .nav-link.active .nav-icon {
          background: var(--ink);
          color: white;
        }
        .nav-badge {
          margin-left: auto;
          font-size: 9px; font-weight: 700;
          letter-spacing: .06em; text-transform: uppercase;
          padding: 2px 6px; border-radius: 4px;
          background: var(--accent);
          color: white;
        }
        .nav-divider {
          height: 1px;
          background: var(--sand-200);
          margin: 10px 6px;
        }

        /* User card */
        .sidebar-footer {
          padding: 10px 10px 14px;
          border-top: 1px solid var(--sand-200);
        }
        .user-card {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 10px;
          border-radius: var(--radius);
          background: var(--sand-100);
          border: 1px solid var(--sand-200);
          margin-bottom: 8px;
          cursor: default;
          transition: background .18s;
        }
        .user-card:hover { background: var(--sand-200); }
        .user-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: var(--ink);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: white;
          flex-shrink: 0;
          letter-spacing: -.01em;
        }
        .user-name {
          font-size: 12.5px; font-weight: 600; color: var(--ink);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          line-height: 1.3;
        }
        .user-email {
          font-size: 10px; color: var(--sand-400);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          margin-top: 1px;
        }
        .online-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #22c55e;
          flex-shrink: 0;
          margin-left: auto;
          box-shadow: 0 0 0 2px rgba(34,197,94,.2), 0 0 6px rgba(34,197,94,.4);
          animation: online-pulse 2.5s ease-in-out infinite;
        }
        @keyframes online-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        .signout-btn {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          padding: 8px 12px;
          border-radius: var(--radius);
          font-size: 12.5px; font-weight: 600;
          color: #dc2626;
          background: transparent;
          border: 1px solid rgba(220,38,38,.15);
          cursor: pointer;
          font-family: inherit;
          transition: all .18s;
          letter-spacing: -.01em;
        }
        .signout-btn:hover {
          background: rgba(220,38,38,.06);
          border-color: rgba(220,38,38,.3);
        }

        /* ══════════════════════════════
           HEADER
        ══════════════════════════════ */
        .admin-header {
          height: var(--header-h);
          background: rgba(250,248,245,.9);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--sand-200);
          position: sticky;
          top: 0;
          z-index: 40;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--sand-400);
        }
        .breadcrumb-current {
          color: var(--ink);
          font-weight: 600;
          letter-spacing: -.01em;
        }
        .breadcrumb svg { opacity: .3; }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .hdr-search {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          height: 35px;
          background: white;
          border: 1px solid var(--sand-200);
          border-radius: 8px;
          font-size: 12.5px;
          color: var(--sand-400);
          cursor: text;
          font-family: inherit;
          transition: all .18s;
          white-space: nowrap;
          min-width: 180px;
        }
        .hdr-search:hover { border-color: var(--sand-300); }
        .kbd {
          font-size: 9.5px; font-weight: 600;
          padding: 1px 5px; border-radius: 4px;
          background: var(--sand-100);
          border: 1px solid var(--sand-200);
          color: var(--sand-400);
          margin-left: auto;
        }
        .hdr-btn {
          width: 35px; height: 35px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px;
          background: white;
          border: 1px solid var(--sand-200);
          color: var(--sand-500);
          cursor: pointer;
          position: relative;
          transition: all .18s;
        }
        .hdr-btn:hover {
          border-color: var(--sand-300);
          color: var(--ink);
          box-shadow: 0 2px 8px rgba(0,0,0,.07);
        }
        .notif-dot {
          position: absolute;
          top: 7px; right: 7px;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--accent);
          border: 1.5px solid white;
        }
        .view-store-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 14px;
          height: 35px;
          background: var(--ink);
          color: white;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 600;
          text-decoration: none;
          letter-spacing: -.01em;
          transition: all .18s;
          white-space: nowrap;
        }
        .view-store-link:hover {
          background: var(--sand-800);
          box-shadow: 0 4px 14px rgba(0,0,0,.18);
          transform: translateY(-1px);
        }
        .view-store-link svg { transition: transform .18s; }
        .view-store-link:hover svg { transform: translate(1px,-1px); }

        /* ══════════════════════════════
           MAIN CONTENT
        ══════════════════════════════ */
        .admin-main-wrap {
          margin-left: var(--sidebar-w);
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .admin-content {
          flex: 1;
          padding: 28px 28px 48px;
          background: var(--sand-100);
        }

        /* Animation */
        @keyframes content-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .admin-content { animation: content-in .35s ease both; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-mark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="0"/>
              <path stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div className="logo-text-primary">Auromin</div>
            <div className="logo-text-secondary">Admin</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Workspace</div>

          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </Link>
          ))}

          <div className="nav-divider" />
          <div className="nav-section-label">System</div>

          <Link href="/admin/settings" className="nav-link">
            <span className="nav-icon">
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </span>
            Settings
          </Link>
          <Link href="/docs" className="nav-link">
            <span className="nav-icon">
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            Help & Docs
          </Link>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="user-name">{displayName}</div>
              <div className="user-email">{email}</div>
            </div>
            <div className="online-dot" />
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="signout-btn">
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="admin-main-wrap">
        <header className="admin-header">
          <div className="breadcrumb">
            <MobileSidebarToggle />
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--ink)' }}>Admin</span>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
            <span className="breadcrumb-current">Dashboard</span>
          </div>

          <div className="header-actions">
            <div className="hdr-search">
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              Search anything…
              <span className="kbd">⌘K</span>
            </div>
            <button className="hdr-btn">
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <span className="notif-dot" />
            </button>
            <Link href="/" target="_blank" className="view-store-link">
              View Store
              <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </Link>
          </div>
        </header>

        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  )
}