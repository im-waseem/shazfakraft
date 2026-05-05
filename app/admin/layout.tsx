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
      background: '#f5f4f0',
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      display: 'flex',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:wght@600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d5d2c8; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #bfbbb0; }

        /* ── NAV ITEMS ── */
        .nav-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 9px 13px;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 500;
          color: #8a8680;
          text-decoration: none;
          transition:
            background 0.2s cubic-bezier(.4,0,.2,1),
            color 0.2s,
            transform 0.2s cubic-bezier(.34,1.56,.64,1),
            box-shadow 0.2s;
          position: relative;
          border: 1px solid transparent;
          cursor: pointer;
          letter-spacing: -0.01em;
          will-change: transform;
        }
        .nav-item:hover {
          background: #ffffff;
          color: #1a1916;
          transform: translateX(3px);
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          border-color: rgba(0,0,0,0.06);
        }
        .nav-item.active {
          background: #ffffff;
          color: #1a1916;
          border-color: rgba(0,0,0,0.08);
          box-shadow: 0 2px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04);
        }
        .nav-item.active .nav-icon-wrap {
          background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(255,107,53,0.35);
        }

        .nav-active-bar {
          display: none;
          position: absolute;
          left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 50%;
          background: linear-gradient(180deg, #ff6b35, #f7931e);
          border-radius: 0 3px 3px 0;
        }
        .nav-item.active .nav-active-bar { display: block; }

        .nav-icon-wrap {
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 9px;
          background: #f0ede8;
          color: #8a8680;
          flex-shrink: 0;
          transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.2s cubic-bezier(.34,1.56,.64,1);
        }
        .nav-item:hover .nav-icon-wrap {
          background: #f7f5f2;
          transform: scale(1.08);
        }

        .nav-badge {
          margin-left: auto;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          padding: 2px 7px; border-radius: 5px;
          background: linear-gradient(135deg, #ff6b35, #f7931e);
          color: white;
          box-shadow: 0 2px 8px rgba(255,107,53,0.3);
          animation: badge-pulse 2.5s ease-in-out infinite;
        }
        @keyframes badge-pulse {
          0%, 100% { box-shadow: 0 2px 8px rgba(255,107,53,0.3); }
          50% { box-shadow: 0 2px 16px rgba(255,107,53,0.55); }
        }

        /* ── HEADER BUTTONS ── */
        .hdr-btn {
          width: 38px; height: 38px; border-radius: 11px;
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.07);
          display: flex; align-items: center; justify-content: center;
          color: #8a8680;
          cursor: pointer; position: relative;
          transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.18s cubic-bezier(.34,1.56,.64,1);
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .hdr-btn:hover {
          background: #fff;
          color: #1a1916;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          transform: translateY(-1px) scale(1.04);
          border-color: rgba(0,0,0,0.1);
        }
        .hdr-btn:active { transform: scale(0.97); }

        /* ── SIGN OUT BUTTON ── */
        .sign-out-btn {
          display: flex; align-items: center; justify-content: center; gap: 7px;
          width: 100%; padding: 9px 14px; border-radius: 11px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          border: 1px solid rgba(239,68,68,0.18);
          background: rgba(239,68,68,0.06);
          color: #dc2626;
          transition: all 0.2s cubic-bezier(.4,0,.2,1);
          font-family: inherit; letter-spacing: -0.01em;
          position: relative; overflow: hidden;
        }
        .sign-out-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05));
          opacity: 0;
          transition: opacity 0.2s;
        }
        .sign-out-btn:hover::before { opacity: 1; }
        .sign-out-btn:hover {
          border-color: rgba(239,68,68,0.3);
          box-shadow: 0 4px 16px rgba(239,68,68,0.15);
          transform: translateY(-1px);
        }
        .sign-out-btn:active { transform: scale(0.98); }

        /* ── VIEW STORE BUTTON ── */
        .view-store-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 11px;
          font-size: 13px; font-weight: 600; text-decoration: none;
          color: #ffffff;
          background: linear-gradient(135deg, #1a1916 0%, #3a3832 100%);
          border: 1px solid rgba(0,0,0,0.12);
          transition: all 0.2s cubic-bezier(.4,0,.2,1);
          white-space: nowrap; letter-spacing: -0.01em;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          position: relative; overflow: hidden;
        }
        .view-store-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,107,53,0.2), rgba(247,147,30,0.1));
          opacity: 0;
          transition: opacity 0.2s;
        }
        .view-store-btn:hover::before { opacity: 1; }
        .view-store-btn:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.18);
          transform: translateY(-1px);
        }
        .view-store-btn:active { transform: scale(0.98); }
        .view-store-btn svg {
          transition: transform 0.2s cubic-bezier(.34,1.56,.64,1);
        }
        .view-store-btn:hover svg { transform: translate(2px,-2px); }

        /* ── SEARCH ── */
        .hdr-search {
          display: flex; align-items: center; gap: 8px;
          padding: 0 13px; height: 38px;
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 11px; color: #b0aba4;
          font-size: 13px; font-family: inherit; cursor: pointer;
          transition: all 0.2s cubic-bezier(.4,0,.2,1);
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .hdr-search:hover {
          background: #fff;
          border-color: rgba(0,0,0,0.12);
          color: #8a8680;
          box-shadow: 0 4px 14px rgba(0,0,0,0.08);
        }

        /* ── LABELS ── */
        .nav-group-label {
          font-size: 9.5px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.14em; color: #c8c4bc;
          padding: 8px 13px 6px;
        }

        .sidebar-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,0,0,0.06) 30%, rgba(0,0,0,0.06) 70%, transparent);
          margin: 8px 0;
        }

        /* ── PULSE ── */
        @keyframes pulse-online {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.8); }
        }
        .pulse-dot { animation: pulse-online 2.2s ease-in-out infinite; }

        /* ── SIDEBAR SLIDE-IN ── */
        @keyframes sidebar-in {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .sidebar-anim {
          animation: sidebar-in 0.4s cubic-bezier(.4,0,.2,1) both;
        }

        /* ── STAGGERED NAV ITEMS ── */
        .nav-item:nth-child(1) { animation: nav-fade 0.35s 0.08s both; }
        .nav-item:nth-child(2) { animation: nav-fade 0.35s 0.13s both; }
        .nav-item:nth-child(3) { animation: nav-fade 0.35s 0.18s both; }
        .nav-item:nth-child(4) { animation: nav-fade 0.35s 0.23s both; }
        .nav-item:nth-child(5) { animation: nav-fade 0.35s 0.28s both; }
        .nav-item:nth-child(6) { animation: nav-fade 0.35s 0.33s both; }
        @keyframes nav-fade {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* ── CONTENT FADE ── */
        @keyframes content-rise {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .content-anim {
          animation: content-rise 0.45s 0.15s cubic-bezier(.4,0,.2,1) both;
        }

        /* ── USER CARD ── */
        .user-card {
          transition: background 0.18s, box-shadow 0.18s, transform 0.18s;
        }
        .user-card:hover {
          background: #f7f5f2 !important;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }

        /* ── LOGO HOVER ── */
        .logo-icon {
          transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s;
        }
        .logo-wrap:hover .logo-icon {
          transform: rotate(-8deg) scale(1.08);
          box-shadow: 0 0 0 2px rgba(255,107,53,0.5), 0 8px 24px rgba(255,107,53,0.3);
        }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside className="sidebar-anim" style={{
        width: 236, flexShrink: 0,
        background: '#faf9f6',
        borderRight: '1px solid rgba(0,0,0,0.07)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 50, height: '100vh',
        boxShadow: '4px 0 24px rgba(0,0,0,0.04)',
      }}>

        {/* Logo */}
        <div className="logo-wrap" style={{
          padding: '18px 16px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <div className="logo-icon" style={{
            width: 36, height: 36, borderRadius: 11, flexShrink: 0,
            background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 2px rgba(255,107,53,0.25), 0 6px 18px rgba(255,107,53,0.3)',
          }}>
            <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 800, fontSize: 16,
              color: '#1a1916', letterSpacing: '-0.02em', lineHeight: 1.2,
            }}>Shafa</p>
            <p style={{
              fontSize: 9, color: '#b0aba4',
              fontWeight: 700, letterSpacing: '0.13em',
              textTransform: 'uppercase', lineHeight: 1.1, marginTop: 1,
            }}>Admin Panel</p>
          </div>
          <div style={{
            marginLeft: 'auto', fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
            padding: '3px 7px', borderRadius: 5,
            background: 'linear-gradient(135deg, rgba(255,107,53,0.1), rgba(247,147,30,0.08))',
            color: '#e85d26',
            border: '1px solid rgba(255,107,53,0.2)', textTransform: 'uppercase',
          }}>v2</div>
        </div>

        {/* Nav */}
        <nav style={{
          flex: 1, padding: '14px 8px',
          display: 'flex', flexDirection: 'column', overflowY: 'auto', gap: 2,
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

          <div className="sidebar-divider" style={{ margin: '12px 4px 10px' }} />
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
        <div style={{ padding: '10px 8px 14px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="user-card" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', marginBottom: 8, borderRadius: 12,
            background: '#f0ede8',
            border: '1px solid rgba(0,0,0,0.06)',
            cursor: 'default',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: 'white',
              boxShadow: '0 0 0 2px rgba(255,107,53,0.25), 0 3px 10px rgba(255,107,53,0.25)',
            }}>{initials}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{
                fontSize: 13, fontWeight: 700, color: '#1a1916',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3,
              }}>{displayName}</p>
              <p style={{
                fontSize: 10.5, lineHeight: 1.2, marginTop: 1,
                color: '#b0aba4',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{email}</p>
            </div>
            <div className="pulse-dot" style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: '#10b981',
              boxShadow: '0 0 0 2px rgba(16,185,129,0.2), 0 0 8px rgba(16,185,129,0.5)',
            }} />
          </div>

          <form action="/auth/signout" method="post">
            <button type="submit" className="sign-out-btn">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        marginLeft: 236, flex: 1,
        display: 'flex', flexDirection: 'column', minHeight: '100vh',
      }}>
        {/* Header */}
        <header style={{
          height: 62,
          background: 'rgba(250,249,246,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.065)',
          position: 'sticky', top: 0, zIndex: 40,
          padding: '0 26px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MobileSidebarToggle />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 15, fontWeight: 700, color: '#1a1916', letterSpacing: '-0.01em',
              }}>Admin</span>
              <svg width="12" height="12" fill="none" stroke="rgba(0,0,0,0.18)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
              <span style={{ fontSize: 13, color: '#b0aba4', fontWeight: 500 }}>Dashboard</span>
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
                marginLeft: 6, fontSize: 10, fontWeight: 600, padding: '1px 6px',
                borderRadius: 5, background: '#f0ede8',
                border: '1px solid rgba(0,0,0,0.08)', color: '#b0aba4',
              }}>⌘K</span>
            </div>

            <button className="hdr-btn">
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span style={{
                position: 'absolute', top: 8, right: 8,
                width: 7, height: 7, borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
                border: '1.5px solid #faf9f6',
                boxShadow: '0 1px 4px rgba(255,107,53,0.4)',
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
        <main className="content-anim" style={{
          flex: 1,
          padding: '32px 30px',
          background: '#f5f4f0',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}