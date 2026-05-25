'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const pathname = usePathname()
  const [cartCount, setCartCount] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const updateCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        setCartCount(cart.reduce((s: number, i: any) => s + i.quantity, 0))
      } catch {}
    }
    updateCart()
    window.addEventListener('storage', updateCart)
    const iv = setInterval(updateCart, 2000)

    const sb = createClient()
    sb.auth.getUser().then(({ data }) => setUser(data.user))

    return () => {
      window.removeEventListener('storage', updateCart)
      clearInterval(iv)
    }
  }, [])

  // Don't render on admin pages — must be after all hooks
  if (pathname?.startsWith('/admin')) return null

  return (
    <>
      <style>{`
        .site-navbar {
          background: #fff;
          border-bottom: 1px solid #ecdcc8;
          position: sticky;
          top: 0;
          z-index: 40;
          box-shadow: 0 2px 16px rgba(200,134,10,.05);
          width: 100%;
          font-family: 'Nunito', system-ui, sans-serif;
        }
        .site-nav-inner {
          max-width: 1340px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          align-items: center;
          height: 62px;
          gap: 16px;
        }
        .site-logo {
          font-family: "Cormorant Garamond", serif;
          font-size: 26px;
          font-weight: 700;
          color: #c8860a;
          letter-spacing: -.01em;
          line-height: 1;
          text-decoration: none;
          flex-shrink: 0;
        }
        .site-logo small {
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .22em;
          text-transform: uppercase;
          color: #9a8a7a;
          display: block;
          margin-top: -1px;
        }
        .site-nav-links {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-left: 20px;
        }
        @media (max-width: 768px) {
          .site-nav-links { display: none !important; }
        }
        .site-nav-link {
          color: #5a4a3a;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          padding: 5px 0;
          border-bottom: 2px solid transparent;
          transition: all .18s;
          letter-spacing: .02em;
          white-space: nowrap;
        }
        .site-nav-link:hover { color: #c8860a; border-bottom-color: #c8860a; }
        .site-spacer { flex: 1; }
        .site-icon-btn {
          position: relative;
          color: #5a4a3a;
          display: flex;
          padding: 8px;
          border-radius: 10px;
          text-decoration: none;
          transition: background .15s;
        }
        .site-icon-btn:hover { background: #fdf3e3; }
        .site-badge {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          font-size: 8px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          background: #c8860a;
          border: 2px solid #fff;
        }
        .site-burger {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          color: #1c1410;
          border-radius: 8px;
          display: none;
        }
        @media (max-width: 768px) { .site-burger { display: flex; } }

        /* Mobile menu */
        .site-mob-overlay {
          position: fixed; inset: 0; z-index: 50;
          background: rgba(28,20,16,.5);
          backdrop-filter: blur(4px);
        }
        .site-mob-panel {
          position: fixed; left: 0; top: 0; bottom: 0; z-index: 51;
          width: 280px; background: #fff; padding: 24px;
          display: flex; flex-direction: column; gap: 6px;
          animation: slideRight .25s cubic-bezier(.4,0,.2,1);
        }
        @keyframes slideRight { from { transform: translateX(-100%); } to { transform: none; } }
        .site-mob-link {
          display: block;
          padding: 12px 14px;
          border-radius: 10px;
          color: #1c1410;
          font-weight: 600;
          font-size: 15px;
          text-decoration: none;
          transition: background .15s;
        }
        .site-mob-link:hover { background: #fdf3e3; color: #c8860a; }
      `}</style>

      <header className="site-navbar">
        <div className="site-nav-inner">
          {/* Burger */}
          <button className="site-burger" onClick={() => setMobileOpen(true)} aria-label="Menu">
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <Link href="/" className="site-logo">
            Shazfa<small>Islamic Wall Art Store</small>
          </Link>

          {/* Desktop links */}
          <div className="site-nav-links">
            <Link href="/" className="site-nav-link">Home</Link>
            <Link href="/products" className="site-nav-link">Products</Link>
            <Link href="/about" className="site-nav-link">About</Link>
            <Link href="/contact" className="site-nav-link">Contact</Link>
            <Link href="/track-order" className="site-nav-link">Track Order</Link>
          </div>

          <div className="site-spacer" />

          {/* Search toggle */}
          <button className="site-icon-btn" onClick={() => setSearchOpen(!searchOpen)} title="Search" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </button>

          {/* Icons */}
          <Link href={user ? '/profile' : '/login'} className="site-icon-btn" title={user ? 'Profile' : 'Sign in'}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
          <Link href="/cart" className="site-icon-btn" title="Cart">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && <span className="site-badge">{cartCount > 9 ? '9+' : cartCount}</span>}
          </Link>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <>
          <div className="site-mob-overlay" onClick={() => setMobileOpen(false)} />
          <div className="site-mob-panel">
            <button onClick={() => setMobileOpen(false)} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9a8a7a', padding: 4 }}>✕</button>
            <Link href="/" className="site-mob-link" onClick={() => setMobileOpen(false)}>🏠 Home</Link>
            <Link href="/products" className="site-mob-link" onClick={() => setMobileOpen(false)}>🛍️ Products</Link>
            <Link href="/track-order" className="site-mob-link" onClick={() => setMobileOpen(false)}>📦 Track Order</Link>
            <Link href="/cart" className="site-mob-link" onClick={() => setMobileOpen(false)}>🛒 Cart{cartCount > 0 ? ` (${cartCount})` : ''}</Link>
            <Link href={user ? '/profile' : '/login'} className="site-mob-link" onClick={() => setMobileOpen(false)}>
              {user ? '👤 My Profile' : '🔐 Sign In'}
            </Link>
          </div>
        </>
      )}
    </>
  )
}