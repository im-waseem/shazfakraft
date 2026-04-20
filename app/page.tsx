'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'

async function getBanners() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .eq('display_on_homepage', true)
    .order('position', { ascending: true })
  if (error) { console.error('Error fetching banners:', error); return [] }
  return data || []
}

async function getFeaturedProducts() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`*, categories ( name, slug )`)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(24)
  if (error) { console.error('Error fetching products:', error); return [] }
  return data || []
}

async function getCategories() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true })
    .limit(8)
  if (error) { console.error('Error fetching categories:', error); return [] }
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const [bannersData, productsData, categoriesData] = await Promise.all([
        getBanners(), getFeaturedProducts(), getCategories()
      ])
      setBanners(bannersData)
      setAllProducts(productsData)
      setCategories(categoriesData)
      if (productsData.length > 0) {
        const max = Math.ceil(Math.max(...productsData.map((p: any) => Number(p.price))))
        setMaxPrice(max)
        setPriceRange([0, max])
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const filteredProducts = useMemo(() => {
    let result = [...allProducts]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.short_description?.toLowerCase().includes(q) ||
        p.categories?.name?.toLowerCase().includes(q)
      )
    }
    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.includes(p.category_id))
    }
    result = result.filter(p => Number(p.price) >= priceRange[0] && Number(p.price) <= priceRange[1])
    switch (sortBy) {
      case 'price_asc': result.sort((a, b) => Number(a.price) - Number(b.price)); break
      case 'price_desc': result.sort((a, b) => Number(b.price) - Number(a.price)); break
      case 'name_asc': result.sort((a, b) => a.name.localeCompare(b.name)); break
      case 'featured': result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)); break
      default: result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    return result
  }, [allProducts, searchQuery, selectedCategories, priceRange, sortBy])

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategories([])
    setPriceRange([0, maxPrice])
    setSortBy('newest')
  }

  const hasActiveFilters = searchQuery || selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < maxPrice || sortBy !== 'newest'

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#0f0f0f' }}>
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-400 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-orange-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
          </div>
          <p className="text-amber-400/60 text-sm tracking-widest uppercase font-mono">Loading Store</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', fontFamily: "'DM Sans', sans-serif" }}>
      <style global jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:wght@700;900&display=swap');
        
        :root {
          --gold: #d4a843;
          --gold-light: #f0c060;
          --gold-dark: #a07820;
          --surface: #161616;
          --surface-2: #1e1e1e;
          --surface-3: #252525;
          --border: rgba(255,255,255,0.08);
          --text: #f0ede8;
          --text-muted: rgba(240,237,232,0.5);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body { color: var(--text); }

        .marquee-wrapper { overflow: hidden; }
        .marquee-track { display: flex; width: max-content; animation: marquee 28s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        
        .product-card { 
          background: var(--surface-2); 
          border: 1px solid var(--border); 
          border-radius: 16px; 
          overflow: hidden; 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .product-card:hover { 
          border-color: rgba(212, 168, 67, 0.4); 
          transform: translateY(-4px); 
          box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(212,168,67,0.1);
        }
        .product-card:hover .card-img { transform: scale(1.06); }
        .card-img { transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
        
        .btn-primary {
          background: linear-gradient(135deg, var(--gold), var(--gold-dark));
          color: #0a0a0a;
          font-weight: 600;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.02em;
        }
        .btn-primary:hover { background: linear-gradient(135deg, var(--gold-light), var(--gold)); box-shadow: 0 8px 20px rgba(212,168,67,0.3); transform: translateY(-1px); }
        
        .search-input {
          background: var(--surface-3);
          border: 1px solid var(--border);
          color: var(--text);
          border-radius: 12px;
          transition: all 0.2s;
          outline: none;
          width: 100%;
        }
        .search-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(212,168,67,0.1); }
        .search-input::placeholder { color: var(--text-muted); }
        
        .filter-pill {
          background: var(--surface-3);
          border: 1px solid var(--border);
          border-radius: 50px;
          color: var(--text-muted);
          font-size: 13px;
          padding: 6px 14px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .filter-pill:hover { border-color: var(--gold); color: var(--gold); }
        .filter-pill.active { background: rgba(212,168,67,0.12); border-color: var(--gold); color: var(--gold); font-weight: 500; }
        
        .sidebar { 
          background: var(--surface); 
          border-right: 1px solid var(--border);
          position: sticky;
          top: 72px;
          height: calc(100vh - 72px);
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: var(--surface-3) transparent;
        }
        
        .range-input { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; background: var(--surface-3); border-radius: 2px; outline: none; }
        .range-input::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: var(--gold); border-radius: 50%; cursor: pointer; border: 2px solid #0a0a0a; box-shadow: 0 2px 8px rgba(212,168,67,0.4); }
        .range-input::-moz-range-thumb { width: 18px; height: 18px; background: var(--gold); border-radius: 50%; cursor: pointer; border: 2px solid #0a0a0a; }
        
        .badge { background: rgba(212,168,67,0.15); color: var(--gold); font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 50px; border: 1px solid rgba(212,168,67,0.3); }
        
        .tag { background: rgba(212,168,67,0.08); color: var(--gold-light); font-size: 11px; padding: 3px 8px; border-radius: 6px; font-weight: 500; letter-spacing: 0.03em; }
        
        .empty-state { text-align: center; padding: 80px 20px; }

        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 40; backdrop-filter: blur(4px); }
        .mobile-sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 300px; background: var(--surface); z-index: 50; overflow-y: auto; transform: translateX(-100%); transition: transform 0.3s cubic-bezier(0.4,0,0.2,1); }
        .mobile-sidebar.open { transform: translateX(0); }
        
        .select-input { background: var(--surface-3); border: 1px solid var(--border); color: var(--text); border-radius: 10px; outline: none; cursor: pointer; appearance: none; }
        .select-input:focus { border-color: var(--gold); }

        .featured-badge {
          position: absolute; top: 10px; left: 10px;
          background: linear-gradient(135deg, var(--gold), var(--gold-dark));
          color: #0a0a0a; font-size: 10px; font-weight: 700;
          padding: 3px 10px; border-radius: 50px; letter-spacing: 0.08em; text-transform: uppercase;
        }
        
        .discount-badge {
          position: absolute; top: 10px; right: 10px;
          background: #ef4444; color: white; font-size: 11px; font-weight: 700;
          padding: 3px 8px; border-radius: 6px;
        }

        .nav-link { color: var(--text-muted); font-size: 14px; font-weight: 500; text-decoration: none; transition: color 0.2s; padding: 4px 0; }
        .nav-link:hover { color: var(--gold); }

        @media (max-width: 768px) {
          .sidebar { display: none; }
        }
      `}</style>

      {/* Announcement Bar */}
      <div className="marquee-wrapper" style={{ background: 'linear-gradient(90deg, #1a1200, #2a1e00, #1a1200)', borderBottom: '1px solid rgba(212,168,67,0.2)', padding: '10px 0' }}>
        <div className="marquee-track">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-12 px-8">
              {banners.length > 0 ? banners.map((b, j) => (
                <span key={j} style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 500, letterSpacing: '0.04em' }}>
                  ✦ {b.title}
                </span>
              )) : (
                <>
                  <span style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 500 }}>✦ Free shipping on orders over $50</span>
                  <span style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 500 }}>✦ Use code WELCOME30 for 30% off your first order</span>
                  <span style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 500 }}>✦ New arrivals every week</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <header style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 72, gap: 24 }}>
            {/* Mobile menu button */}
            <button onClick={() => setSidebarOpen(true)} style={{ display: 'none', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px', color: 'var(--text)', cursor: 'pointer' }} className="mobile-filter-btn">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M8 12h8M11 20h2" /></svg>
            </button>

            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: 'var(--gold)', letterSpacing: '-0.02em' }}>Shazfa</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Kraft</span>
              </div>
            </Link>

            {/* Search */}
            <div style={{ flex: 1, maxWidth: 520, position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products, categories..."
                className="search-input"
                style={{ padding: '10px 16px 10px 44px', fontSize: 14 }}
              />
              <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
              )}
            </div>

            {/* Nav Links */}
            <nav style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
              <Link href="/products" className="nav-link">Products</Link>
              <Link href="/about" className="nav-link">About</Link>
              <Link href="/contact" className="nav-link">Contact</Link>
            </nav>

            {/* Right Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, marginLeft: 'auto' }}>
              <Link href="/cart" style={{ position: 'relative', color: 'var(--text-muted)', display: 'flex', textDecoration: 'none', padding: 8 }}>
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span style={{ position: 'absolute', top: 4, right: 4, background: 'var(--gold)', color: '#0a0a0a', fontSize: 10, fontWeight: 700, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>
                )}
              </Link>

              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a0a', fontWeight: 700, fontSize: 14 }}>
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <form action="/auth/signout" method="post">
                    <button type="submit" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}>Logout</button>
                  </form>
                </div>
              ) : (
                <Link href="/login" className="btn-primary" style={{ padding: '9px 20px', fontSize: 14, textDecoration: 'none', display: 'inline-block' }}>Sign In</Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}
      <div className={`mobile-sidebar ${sidebarOpen ? 'open' : ''}`} style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Filters</span>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 24 }}>×</button>
        </div>
        <FilterContent categories={categories} selectedCategories={selectedCategories} toggleCategory={toggleCategory} priceRange={priceRange} setPriceRange={setPriceRange} maxPrice={maxPrice} hasActiveFilters={!!hasActiveFilters} clearFilters={clearFilters} />
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, alignItems: 'start' }}>
        
        {/* Desktop Sidebar */}
        <aside className="sidebar" style={{ borderRadius: 16, padding: 24 }}>
          <FilterContent categories={categories} selectedCategories={selectedCategories} toggleCategory={toggleCategory} priceRange={priceRange} setPriceRange={setPriceRange} maxPrice={maxPrice} hasActiveFilters={!!hasActiveFilters} clearFilters={clearFilters} />
        </aside>

        {/* Main Content */}
        <main>
          {/* Results Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
            <div>
              {searchQuery ? (
                <div>
                  <p style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: 'var(--text)' }}>
                    Results for <span style={{ color: 'var(--gold)' }}>"{searchQuery}"</span>
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>
                    {selectedCategories.length > 0 ? 'Filtered Products' : 'All Products'}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</p>
                </div>
              )}
            </div>

            {/* Active Filter Pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {selectedCategories.map(id => {
                const cat = categories.find(c => c.id === id)
                return cat ? (
                  <button key={id} onClick={() => toggleCategory(id)} className="filter-pill active" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {cat.name} <span style={{ fontSize: 16, lineHeight: 1 }}>×</span>
                  </button>
                ) : null
              })}
              
              {/* Sort */}
              <div style={{ position: 'relative' }}>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="select-input" style={{ padding: '8px 32px 8px 12px', fontSize: 13 }}>
                  <option value="newest">Newest First</option>
                  <option value="featured">Featured</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name A-Z</option>
                </select>
                <svg style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {filteredProducts.map(product => {
                const discount = product.compare_price && Number(product.compare_price) > Number(product.price)
                  ? Math.round((1 - Number(product.price) / Number(product.compare_price)) * 100)
                  : null
                return (
                  <Link key={product.id} href={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="product-card">
                      <div style={{ aspectRatio: '1', background: 'var(--surface-3)', position: 'relative', overflow: 'hidden' }}>
                        {product.main_image_url || product.image_url ? (
                          <img src={product.main_image_url || product.image_url} alt={product.name} className="card-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="48" height="48" fill="none" stroke="rgba(255,255,255,0.15)" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {product.is_featured && <div className="featured-badge">Featured</div>}
                        {discount && <div className="discount-badge">-{discount}%</div>}
                        {product.inventory_quantity === 0 && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Out of Stock</span>
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '14px 16px 16px' }}>
                        {product.categories && (
                          <span className="tag" style={{ marginBottom: 8, display: 'inline-block' }}>{product.categories.name}</span>
                        )}
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginTop: 6, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {product.name}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--gold)' }}>
                            ${Number(product.price).toFixed(2)}
                          </span>
                          {product.compare_price && Number(product.compare_price) > Number(product.price) && (
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                              ${Number(product.compare_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                        {product.inventory_quantity > 0 && product.inventory_quantity <= 10 && (
                          <p style={{ fontSize: 11, color: '#f59e0b', marginTop: 6, fontWeight: 500 }}>
                            Only {product.inventory_quantity} left
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ background: 'var(--surface-2)', borderRadius: 20, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>
                {searchQuery ? '🔍' : '📦'}
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Playfair Display', serif", marginBottom: 8 }}>
                {searchQuery ? 'No results found' : 'No products found'}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
                {searchQuery
                  ? `We couldn't find anything for "${searchQuery}". Try a different search term.`
                  : 'No products match your current filters.'}
              </p>
              <button onClick={clearFilters} className="btn-primary" style={{ padding: '10px 24px', fontSize: 14 }}>
                Clear All Filters
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', marginTop: 64, padding: '48px 24px 32px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900, color: 'var(--gold)', marginBottom: 12 }}>Shafa</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>Your premium destination for quality products, curated with care.</p>
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text)', marginBottom: 16 }}>Shop</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {categories.slice(0, 4).map(c => (
                  <a key={c.id} href={`/products?category=${c.slug}`} style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}>{c.name}</a>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text)', marginBottom: 16 }}>Help</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link href="/orders" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>My Orders</Link>
                <Link href="/profile" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>My Account</Link>
                <Link href="/contact" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>Contact Us</Link>
              </div>
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text)', marginBottom: 16 }}>Contact</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>shazfakraft@gmail.com</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>916361236653</span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>© {new Date().getFullYear()} Shafa eCommerce. All rights reserved.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Crafted with care ✦</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Filter Sidebar Content Component
function FilterContent({ categories, selectedCategories, toggleCategory, priceRange, setPriceRange, maxPrice, hasActiveFilters, clearFilters }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.02em' }}>Filters</span>
        {hasActiveFilters && (
          <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 12, cursor: 'pointer', fontWeight: 600, letterSpacing: '0.04em' }}>
            Clear All
          </button>
        )}
      </div>

      {/* Categories */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 14 }}>Categories</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {categories.map((cat: any) => (
            <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 10px', borderRadius: 10, transition: 'background 0.15s', background: selectedCategories.includes(cat.id) ? 'rgba(212,168,67,0.08)' : 'transparent' }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${selectedCategories.includes(cat.id) ? 'var(--gold)' : 'var(--border)'}`, background: selectedCategories.includes(cat.id) ? 'var(--gold)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }} onClick={() => toggleCategory(cat.id)}>
                {selectedCategories.includes(cat.id) && (
                  <svg width="10" height="10" fill="none" stroke="#0a0a0a" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                )}
              </div>
              <span onClick={() => toggleCategory(cat.id)} style={{ fontSize: 14, color: selectedCategories.includes(cat.id) ? 'var(--gold)' : 'var(--text)', fontWeight: selectedCategories.includes(cat.id) ? 500 : 400 }}>
                {cat.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 14 }}>Price Range</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>
            ${priceRange[0]}
          </div>
          <div style={{ width: 20, height: 1, background: 'var(--border)' }} />
          <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>
            ${priceRange[1]}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Min Price</p>
            <input
              type="range"
              className="range-input"
              min={0}
              max={maxPrice}
              value={priceRange[0]}
              onChange={e => {
                const val = Number(e.target.value)
                if (val <= priceRange[1]) setPriceRange([val, priceRange[1]])
              }}
            />
          </div>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Max Price</p>
            <input
              type="range"
              className="range-input"
              min={0}
              max={maxPrice}
              value={priceRange[1]}
              onChange={e => {
                const val = Number(e.target.value)
                if (val >= priceRange[0]) setPriceRange([priceRange[0], val])
              }}
            />
          </div>
        </div>
      </div>

      {/* Availability */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 14 }}>Quick Filters</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['In Stock', 'On Sale', 'Featured'].map(label => (
            <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 10px', borderRadius: 10 }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, border: '2px solid var(--border)', flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: 'var(--text)' }}>{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}