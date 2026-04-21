'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useEffect, useState, useMemo, useRef } from 'react'

async function getBanners() {
  const supabase = createClient()
  const { data, error } = await supabase.from('banners').select('*').eq('is_active', true).eq('display_on_homepage', true).order('position', { ascending: true })
  if (error) { console.error(error); return [] }
  return data || []
}
async function getFeaturedProducts() {
  const supabase = createClient()
  const { data, error } = await supabase.from('products').select(`*, categories(name,slug)`).eq('is_active', true).order('created_at', { ascending: false }).limit(24)
  if (error) { console.error(error); return [] }
  return data || []
}
async function getCategories() {
  const supabase = createClient()
  const { data, error } = await supabase.from('categories').select('*').eq('is_active', true).order('position', { ascending: true }).limit(8)
  if (error) { console.error(error); return [] }
  return data || []
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [banners, setBanners] = useState<any[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [maxPrice, setMaxPrice] = useState(10000)
  const [sortBy, setSortBy] = useState('newest')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [currentBanner, setCurrentBanner] = useState(0)
  const [wishlist, setWishlist] = useState<string[]>([])
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const [b, p, c] = await Promise.all([getBanners(), getFeaturedProducts(), getCategories()])
      setBanners(b)
      setAllProducts(p)
      setCategories(c)
      if (p.length > 0) {
        const max = Math.ceil(Math.max(...p.map((x: any) => Number(x.price))))
        setMaxPrice(max); setPriceRange([0, max])
      }
      setLoading(false)
    }
    loadData()
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    setCartCount(cart.reduce((s: number, i: any) => s + i.quantity, 0))
    const wl = JSON.parse(localStorage.getItem('wishlist') || '[]')
    setWishlist(wl)
  }, [])

  // Auto-rotate announcement banners
  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(() => setCurrentBanner(p => (p + 1) % banners.length), 3500)
    return () => clearInterval(t)
  }, [banners.length])

  const filteredProducts = useMemo(() => {
    let r = [...allProducts]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      r = r.filter(p => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.categories?.name?.toLowerCase().includes(q))
    }
    if (selectedCategories.length > 0) r = r.filter(p => selectedCategories.includes(p.category_id))
    r = r.filter(p => Number(p.price) >= priceRange[0] && Number(p.price) <= priceRange[1])
    switch (sortBy) {
      case 'price_asc': r.sort((a, b) => Number(a.price) - Number(b.price)); break
      case 'price_desc': r.sort((a, b) => Number(b.price) - Number(a.price)); break
      case 'name_asc': r.sort((a, b) => a.name.localeCompare(b.name)); break
      case 'featured': r.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)); break
      default: r.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    return r
  }, [allProducts, searchQuery, selectedCategories, priceRange, sortBy])

  const toggleCategory = (id: string) => setSelectedCategories(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const clearFilters = () => { setSearchQuery(''); setSelectedCategories([]); setPriceRange([0, maxPrice]); setSortBy('newest') }
  const hasFilters = !!(searchQuery || selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < maxPrice || sortBy !== 'newest')

  const toggleWishlist = (id: string) => {
    const next = wishlist.includes(id) ? wishlist.filter(x => x !== id) : [...wishlist, id]
    setWishlist(next)
    localStorage.setItem('wishlist', JSON.stringify(next))
  }

  const addToCart = (product: any) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const idx = cart.findIndex((i: any) => i.productId === product.id)
    if (idx >= 0) cart[idx].quantity += 1
    else cart.push({ id: product.id, productId: product.id, name: product.name, price: Number(product.price), quantity: 1, image: product.main_image_url || product.image_url || '' })
    localStorage.setItem('cart', JSON.stringify(cart))
    setCartCount(cart.reduce((s: number, i: any) => s + i.quantity, 0))
  }

  const announcementTexts = banners.length > 0 ? banners.map((b: any) => b.title) : ['Free shipping on orders over ₹499', 'Authentic Islamic products', 'New arrivals every week', 'Trusted by 5000+ customers']

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#fffbf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, margin: '0 auto 16px', border: '3px solid #e8d5b0', borderTop: '3px solid #c8860a', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
        <p style={{ fontFamily: "'Cormorant Garamond', serif", color: '#c8860a', fontSize: 16, letterSpacing: '0.1em' }}>Loading Shazfa kraft…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#fffbf5', fontFamily: "'Nunito', sans-serif", color: '#1c1410' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Nunito:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        :root{
          --cream:#fffbf5;
          --warm:#fdf3e3;
          --gold:#c8860a;
          --gold-light:#e8a020;
          --gold-pale:#fef3d8;
          --sage:#6b7c5c;
          --brick:#c04e2a;
          --text:#1c1410;
          --text-2:#5a4a3a;
          --text-3:#9a8a7a;
          --border:#ecdcc8;
          --border-2:#dccaaa;
          --white:#ffffff;
          --radius:14px;
          --radius-sm:8px;
        }
        body{color:var(--text)}

        /* Announcement bar animation */
        .ann-text{animation:fadeSlide 0.5s ease}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

        /* Nav */
        .nav-link{color:var(--text-2);font-size:14px;font-weight:600;text-decoration:none;padding:6px 2px;border-bottom:2px solid transparent;transition:all .2s;letter-spacing:.02em}
        .nav-link:hover{color:var(--gold);border-bottom-color:var(--gold)}

        /* Search */
        .search-wrap{position:relative;width:100%}
        .search-input{width:100%;padding:18px 24px 18px 58px;font-size:16px;font-family:inherit;background:#fff;border:2px solid var(--border-2);border-radius:50px;outline:none;color:var(--text);transition:all .25s;box-shadow:0 4px 20px rgba(200,134,10,.08)}
        .search-input:focus{border-color:var(--gold);box-shadow:0 4px 30px rgba(200,134,10,.18)}
        .search-input::placeholder{color:var(--text-3)}
        .search-btn{position:absolute;right:6px;top:50%;transform:translateY(-50%);background:var(--gold);border:none;color:#fff;padding:10px 24px;border-radius:50px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;letter-spacing:.04em;transition:all .2s}
        .search-btn:hover{background:var(--gold-light);transform:translateY(-50%) scale(1.03)}

        /* Product card */
        .p-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;transition:all .3s cubic-bezier(.4,0,.2,1);position:relative;cursor:pointer}
        .p-card:hover{border-color:var(--gold-light);transform:translateY(-5px);box-shadow:0 16px 40px rgba(200,134,10,.12)}
        .p-card:hover .p-img{transform:scale(1.07)}
        .p-img{transition:transform .5s cubic-bezier(.4,0,.2,1);width:100%;height:100%;object-fit:cover}
        .p-card-actions{position:absolute;bottom:0;left:0;right:0;padding:12px;background:linear-gradient(0deg,rgba(255,251,245,.98) 60%,transparent);transform:translateY(100%);transition:transform .25s cubic-bezier(.4,0,.2,1)}
        .p-card:hover .p-card-actions{transform:translateY(0)}
        .btn-add{background:var(--gold);color:#fff;border:none;border-radius:50px;padding:10px 20px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;width:100%;letter-spacing:.03em;transition:all .2s}
        .btn-add:hover{background:var(--gold-light)}
        .wishlist-btn{position:absolute;top:10px;right:10px;background:#fff;border:1px solid var(--border);border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;font-size:16px}
        .wishlist-btn:hover{border-color:var(--brick);background:var(--warm)}
        .wishlist-btn.active{background:#fff0ed;border-color:var(--brick)}

        /* Pill / filter */
        .cat-pill{background:#fff;border:1.5px solid var(--border);border-radius:50px;padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;color:var(--text-2);white-space:nowrap}
        .cat-pill:hover{border-color:var(--gold);color:var(--gold);background:var(--gold-pale)}
        .cat-pill.active{background:var(--gold);border-color:var(--gold);color:#fff}

        /* Sidebar */
        .sidebar-section{margin-bottom:28px;padding-bottom:28px;border-bottom:1px solid var(--border)}
        .sidebar-label{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--text-3);margin-bottom:14px}
        .check-row{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:8px;cursor:pointer;transition:background .15s}
        .check-row:hover{background:var(--warm)}
        .check-box{width:18px;height:18px;border-radius:5px;border:2px solid var(--border-2);background:#fff;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .15s}
        .check-box.checked{background:var(--gold);border-color:var(--gold)}
        .range-slider{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:2px;background:var(--border-2);outline:none}
        .range-slider::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:var(--gold);cursor:pointer;border:3px solid #fff;box-shadow:0 2px 8px rgba(200,134,10,.3)}

        /* Sort select */
        .sort-sel{background:#fff;border:1.5px solid var(--border-2);border-radius:var(--radius-sm);padding:9px 36px 9px 12px;font-size:13px;font-family:inherit;color:var(--text);outline:none;cursor:pointer;appearance:none}
        .sort-sel:focus{border-color:var(--gold)}

        /* Footer */
        .footer-link{color:var(--text-3);font-size:13px;text-decoration:none;transition:color .2s;display:block;margin-bottom:8px}
        .footer-link:hover{color:var(--gold)}

        /* Mobile overlay */
        .overlay{position:fixed;inset:0;background:rgba(28,20,16,.5);z-index:40;backdrop-filter:blur(3px)}
        .mobile-sidebar{position:fixed;left:0;top:0;bottom:0;width:290px;background:#fff;z-index:50;overflow-y:auto;transform:translateX(-100%);transition:transform .3s cubic-bezier(.4,0,.2,1);padding:24px}
        .mobile-sidebar.open{transform:translateX(0)}
        .mobile-menu{position:fixed;left:0;right:0;top:64px;background:#fff;z-index:50;border-top:1px solid var(--border);padding:20px 24px;transform:translateY(-8px);opacity:0;pointer-events:none;transition:all .25s}
        .mobile-menu.open{transform:translateY(0);opacity:1;pointer-events:all}

        /* Badge */
        .badge{background:var(--gold-pale);color:var(--gold);font-size:10px;font-weight:700;padding:2px 8px;border-radius:50px;border:1px solid #e8d089}
        .disc-badge{position:absolute;top:10px;left:10px;background:var(--brick);color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px}

        /* Category cards on homepage */
        .cat-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius);padding:20px 16px;text-align:center;cursor:pointer;transition:all .25s;text-decoration:none;color:var(--text)}
        .cat-card:hover{border-color:var(--gold-light);box-shadow:0 8px 24px rgba(200,134,10,.1);transform:translateY(-3px)}
        .cat-icon{width:52px;height:52px;border-radius:50%;background:var(--gold-pale);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:22px}

        @media(max-width:768px){
          .desktop-sidebar{display:none!important}
          .main-grid{grid-template-columns:1fr!important}
          .hide-mobile{display:none!important}
        }
        @media(max-width:480px){
          .product-grid{grid-template-columns:repeat(2,1fr)!important}
        }
      `}</style>

      {/* ── ANNOUNCEMENT BAR ─────────────────────────── */}
      <div style={{ background: 'linear-gradient(90deg,#7c4e1a,#c8860a,#7c4e1a)', padding: '11px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* shimmer sweep */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,.18) 50%,transparent 100%)', animation: 'shimmer 2.8s ease-in-out infinite', backgroundSize: '200% 100%' }} />
        <style>{`@keyframes shimmer{0%,100%{background-position:200% 0}50%{background-position:-200% 0}}`}</style>
        <p key={currentBanner} className="ann-text" style={{ color: '#fff', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', position: 'relative' }}>
          ✦&nbsp; {announcementTexts[currentBanner % announcementTexts.length]} &nbsp;✦
        </p>
        {announcementTexts.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 6 }}>
            {announcementTexts.map((_, i) => (
              <div key={i} onClick={() => setCurrentBanner(i)} style={{ width: i === currentBanner ? 18 : 6, height: 6, borderRadius: 3, background: i === currentBanner ? '#fff' : 'rgba(255,255,255,.4)', cursor: 'pointer', transition: 'all .3s' }} />
            ))}
          </div>
        )}
      </div>

      {/* ── NAVBAR ─────────────────────────────────── */}
      <header style={{ background: '#fff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 2px 12px rgba(200,134,10,.06)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 64, gap: 20 }}>
            {/* Hamburger mobile */}
            <button onClick={() => setMobileMenuOpen(p => !p)} className="hide-desktop" style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--text)' }}>
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>

            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <div>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: 'var(--gold)', letterSpacing: '-0.01em', lineHeight: 1 }}>Shazfa kraft</span>
                <span style={{ display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: -2 }}>Islamic Store</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hide-mobile" style={{ display: 'flex', gap: 24, marginLeft: 16 }}>
              <Link href="/" className="nav-link">Home</Link>
              <Link href="/products" className="nav-link">Products</Link>
              <Link href="/about" className="nav-link">About</Link>
              <Link href="/contact" className="nav-link">Contact</Link>
            </nav>

            <div style={{ flex: 1 }} />

            {/* Icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link href="/wishlist" style={{ position: 'relative', color: 'var(--text-2)', display: 'flex', textDecoration: 'none', padding: '8px', borderRadius: 10, transition: 'background .2s' }}>
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                {wishlist.length > 0 && <span style={{ position: 'absolute', top: 4, right: 4, background: 'var(--brick)', color: '#fff', fontSize: 9, fontWeight: 700, width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{wishlist.length}</span>}
              </Link>
              <Link href="/cart" style={{ position: 'relative', color: 'var(--text-2)', display: 'flex', textDecoration: 'none', padding: '8px', borderRadius: 10, transition: 'background .2s' }}>
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {cartCount > 0 && <span style={{ position: 'absolute', top: 4, right: 4, background: 'var(--gold)', color: '#fff', fontSize: 9, fontWeight: 700, width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>}
              </Link>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--gold-pale)', border: '2px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontWeight: 700, fontSize: 13 }}>{user.email?.charAt(0).toUpperCase()}</div>
                  <form action="/auth/signout" method="post">
                    <button type="submit" style={{ background: 'none', border: '1.5px solid var(--border-2)', color: 'var(--text-2)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Logout</button>
                  </form>
                </div>
              ) : (
                <Link href="/login" style={{ background: 'var(--gold)', color: '#fff', padding: '9px 18px', borderRadius: 50, fontSize: 13, fontWeight: 700, textDecoration: 'none', letterSpacing: '.03em', transition: 'background .2s' }}>Sign In</Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {['/', '/products', '/about', '/contact'].map((href, i) => (
              <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text)', fontWeight: 600, fontSize: 15, textDecoration: 'none', padding: '10px 8px', borderRadius: 8, transition: 'background .15s' }}>
                {['Home', 'Products', 'About', 'Contact'][i]}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* ── HERO SEARCH ─────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg,#fffbf5 0%,#fdf3e3 60%,#fef3d8 100%)', padding: 'clamp(40px,6vw,80px) 20px clamp(32px,4vw,56px)', textAlign: 'center', borderBottom: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div aria-hidden style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, border: '1px solid rgba(200,134,10,.12)', borderRadius: '50%' }} />
        <div aria-hidden style={{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, border: '1px solid rgba(200,134,10,.1)', borderRadius: '50%' }} />

        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(13px,2vw,15px)', color: 'var(--gold)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 12, fontStyle: 'italic' }}>Your Islamic Lifestyle Store</p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2.2rem,5vw,4rem)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.1, marginBottom: 8 }}>
          Discover Authentic
          <br /><span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Islamic Products</span>
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: 'clamp(14px,2vw,16px)', fontWeight: 400, marginBottom: 36, maxWidth: 480, margin: '10px auto 36px' }}>
          Curated with care — books, prayer items, home décor & more.
        </p>

        {/* Big search bar */}
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div className="search-wrap">
            <svg style={{ position: 'absolute', left: 22, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', zIndex: 1 }} width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input ref={searchRef} type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search books, prayer mats, tasbih…" className="search-input" />
            {searchQuery ? (
              <button onClick={() => setSearchQuery('')} className="search-btn" style={{ background: 'var(--text-3)' }}>Clear</button>
            ) : (
              <button className="search-btn" onClick={() => searchRef.current?.focus()}>Search</button>
            )}
          </div>
        </div>

        {/* Category pills quick filter */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 20 }}>
            {categories.slice(0, 6).map(c => (
              <button key={c.id} onClick={() => toggleCategory(c.id)} className={`cat-pill ${selectedCategories.includes(c.id) ? 'active' : ''}`}>{c.name}</button>
            ))}
          </div>
        )}
      </section>

      {/* ── CATEGORY SHOWCASE ─────────────────────── */}
      {categories.length > 0 && !searchQuery && selectedCategories.length === 0 && (
        <section style={{ maxWidth: 1320, margin: '0 auto', padding: '40px 20px 0' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>Shop by Category</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 14 }}>
            {categories.map((c, i) => {
              const icons = ['📖', '🕌', '📿', '🎁', '🏠', '✨', '🌙', '⭐']
              return (
                <button key={c.id} onClick={() => { setSelectedCategories([c.id]); window.scrollTo({ top: 600, behavior: 'smooth' }) }} className="cat-card">
                  <div className="cat-icon">{icons[i % icons.length]}</div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.name}</p>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* ── MAIN LAYOUT ───────────────────────────── */}
      <div className="main-grid" style={{ maxWidth: 1320, margin: '0 auto', padding: '32px 20px 60px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32, alignItems: 'start' }}>

        {/* Desktop Sidebar */}
        <aside className="desktop-sidebar" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 24, position: 'sticky', top: 80 }}>
          <SidebarContent categories={categories} selectedCategories={selectedCategories} toggleCategory={toggleCategory} priceRange={priceRange} setPriceRange={setPriceRange} maxPrice={maxPrice} hasFilters={hasFilters} clearFilters={clearFilters} />
        </aside>

        {/* Mobile Sidebar */}
        {mobileSidebarOpen && <div className="overlay" onClick={() => setMobileSidebarOpen(false)} />}
        <div className={`mobile-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Filters</span>
            <button onClick={() => setMobileSidebarOpen(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-2)' }}>×</button>
          </div>
          <SidebarContent categories={categories} selectedCategories={selectedCategories} toggleCategory={toggleCategory} priceRange={priceRange} setPriceRange={setPriceRange} maxPrice={maxPrice} hasFilters={hasFilters} clearFilters={clearFilters} />
        </div>

        {/* Products */}
        <main>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Mobile filter toggle */}
              <button onClick={() => setMobileSidebarOpen(true)} style={{ display: 'none', background: '#fff', border: '1.5px solid var(--border-2)', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, alignItems: 'center', gap: 6, color: 'var(--text)' }} className="show-mobile">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M8 12h8M11 20h2" /></svg> Filters
              </button>
              <div>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700 }}>
                  {searchQuery ? <>Results for <span style={{ color: 'var(--gold)' }}>"{searchQuery}"</span></> : selectedCategories.length > 0 ? 'Filtered Products' : 'All Products'}
                </p>
                <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 2 }}>{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {selectedCategories.map(id => {
                const cat = categories.find(c => c.id === id)
                return cat ? <button key={id} onClick={() => toggleCategory(id)} className="cat-pill active" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{cat.name} ×</button> : null
              })}
              <div style={{ position: 'relative' }}>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="sort-sel">
                  <option value="newest">Newest</option>
                  <option value="featured">Featured</option>
                  <option value="price_asc">Price ↑</option>
                  <option value="price_desc">Price ↓</option>
                  <option value="name_asc">A–Z</option>
                </select>
                <svg style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-3)' }} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* Grid */}
          {filteredProducts.length > 0 ? (
            <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 18 }}>
              {filteredProducts.map(product => {
                const discount = product.compare_price && Number(product.compare_price) > Number(product.price)
                  ? Math.round((1 - Number(product.price) / Number(product.compare_price)) * 100) : null
                const inWishlist = wishlist.includes(product.id)
                return (
                  <div key={product.id} className="p-card">
                    <Link href={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                      <div style={{ aspectRatio: '1', background: 'var(--warm)', position: 'relative', overflow: 'hidden' }}>
                        {product.main_image_url || product.image_url ? (
                          <img src={product.main_image_url || product.image_url} alt={product.name} className="p-img" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🎁</div>
                        )}
                        {product.is_featured && <span className="badge" style={{ position: 'absolute', top: 10, left: 10 }}>Featured</span>}
                        {discount && <span className="disc-badge">-{discount}%</span>}
                        {product.inventory_quantity === 0 && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,251,245,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: 'var(--text-3)', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Out of Stock</span>
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '12px 14px 6px' }}>
                        {product.categories && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--sage)' }}>{product.categories.name}</span>}
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginTop: 4, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)', fontFamily: "'Cormorant Garamond', serif" }}>₹{Number(product.price).toFixed(0)}</span>
                          {discount && <span style={{ fontSize: 12, color: 'var(--text-3)', textDecoration: 'line-through' }}>₹{Number(product.compare_price).toFixed(0)}</span>}
                        </div>
                        {product.inventory_quantity > 0 && product.inventory_quantity <= 10 && (
                          <p style={{ fontSize: 11, color: '#e07a40', marginTop: 4, fontWeight: 600 }}>Only {product.inventory_quantity} left</p>
                        )}
                      </div>
                    </Link>
                    <div className="p-card-actions">
                      <button className="btn-add" onClick={() => addToCart(product)} disabled={product.inventory_quantity === 0}>
                        {product.inventory_quantity === 0 ? 'Out of Stock' : '＋ Add to Cart'}
                      </button>
                    </div>
                    <button className={`wishlist-btn ${inWishlist ? 'active' : ''}`} onClick={() => toggleWishlist(product.id)} title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}>
                      {inWishlist ? '❤️' : '🤍'}
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 20, padding: '60px 30px', textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>{searchQuery ? '🔍' : '📦'}</div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                {searchQuery ? 'No results found' : 'No products found'}
              </p>
              <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 24 }}>
                {searchQuery ? `Nothing matched "${searchQuery}". Try a different term.` : 'Try clearing your filters.'}
              </p>
              <button onClick={clearFilters} style={{ background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 50, padding: '11px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Clear Filters</button>
            </div>
          )}
        </main>
      </div>

      {/* ── FOOTER ─────────────────────────────────── */}
      <footer style={{ background: '#1c1410', color: '#e8d5b0', padding: '52px 20px 28px', marginTop: 20 }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 36, marginBottom: 40 }}>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: '#d4a843', marginBottom: 10 }}>Shafa</div>
              <p style={{ color: '#9a7a5a', fontSize: 13, lineHeight: 1.7 }}>Your trusted Islamic lifestyle store. Authentic products, ethically sourced.</p>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.1em', color: '#d4a843', marginBottom: 14 }}>Shop</p>
              {categories.slice(0, 4).map(c => <a key={c.id} href={`/products?category=${c.slug}`} className="footer-link">{c.name}</a>)}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.1em', color: '#d4a843', marginBottom: 14 }}>Account</p>
              <Link href="/orders" className="footer-link">My Orders</Link>
              <Link href="/wishlist" className="footer-link">Wishlist</Link>
              <Link href="/profile" className="footer-link">Profile</Link>
              <Link href="/contact" className="footer-link">Contact Us</Link>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.1em', color: '#d4a843', marginBottom: 14 }}>Contact</p>
              <p style={{ color: '#9a7a5a', fontSize: 13, marginBottom: 6 }}>support@shafa.in</p>
              <p style={{ color: '#9a7a5a', fontSize: 13 }}>+91 91234 56789</p>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ color: '#6a5a4a', fontSize: 12 }}>© {new Date().getFullYear()} Shafa Islamic Store. All rights reserved.</p>
            <p style={{ color: '#6a5a4a', fontSize: 12 }}>Made with ✦ in India</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function SidebarContent({ categories, selectedCategories, toggleCategory, priceRange, setPriceRange, maxPrice, hasFilters, clearFilters }: any) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Filters</span>
        {hasFilters && <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 12, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>Clear All</button>}
      </div>
      <div className="sidebar-section">
        <p className="sidebar-label">Categories</p>
        {categories.map((cat: any) => (
          <div key={cat.id} className="check-row" onClick={() => toggleCategory(cat.id)}>
            <div className={`check-box ${selectedCategories.includes(cat.id) ? 'checked' : ''}`}>
              {selectedCategories.includes(cat.id) && <svg width="10" height="10" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span style={{ fontSize: 13, color: selectedCategories.includes(cat.id) ? 'var(--gold)' : 'var(--text)', fontWeight: selectedCategories.includes(cat.id) ? 600 : 400 }}>{cat.name}</span>
          </div>
        ))}
      </div>
      <div className="sidebar-section">
        <p className="sidebar-label">Price Range</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>₹{priceRange[0]}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>₹{priceRange[1]}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(['Min', 'Max'] as const).map((label, i) => (
            <div key={label}>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>{label} Price</p>
              <input type="range" className="range-slider" min={0} max={maxPrice} value={priceRange[i]}
                onChange={e => {
                  const v = Number(e.target.value)
                  if (i === 0 && v <= priceRange[1]) setPriceRange([v, priceRange[1]])
                  if (i === 1 && v >= priceRange[0]) setPriceRange([priceRange[0], v])
                }} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="sidebar-label">Quick Filters</p>
        {['In Stock', 'On Sale', 'Featured'].map(l => (
          <div key={l} className="check-row">
            <div className="check-box" />
            <span style={{ fontSize: 13, color: 'var(--text)' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}