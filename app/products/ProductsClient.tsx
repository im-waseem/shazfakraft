'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const WHATSAPP_NUMBER = '917022831935'

const COLOR_MAP: Record<string, string> = {
  gold: '#d4a843', silver: '#c0c0c0', black: '#1a1a1a', white: '#f0f0f0',
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', brown: '#92400e',
  beige: '#d6c7a1', grey: '#6b7280', gray: '#6b7280', bronze: '#cd7f32',
  rose: '#f43f5e', navy: '#1e3a5f', cream: '#fffdd0', orange: '#f97316',
  'rose gold': '#b76e79',
}
function getColorHex(name: string) {
  return COLOR_MAP[name.toLowerCase()] ?? null
}

/* ─── Stock helper ───────────────────────────────────────────────────────────
   Priority:
   1. track_inventory = false → always in stock (999)
   2. Active variants exist   → sum their inventory_quantity
   3. No active variants      → fall back to product.inventory_quantity
*/
function getTotalStock(p: any): number {
  if (p.track_inventory === false) return 999
  const active = (p.product_variants ?? []).filter((v: any) => v.is_active === true)
  if (active.length > 0)
    return active.reduce((sum: number, v: any) => sum + (Number(v.inventory_quantity) || 0), 0)
  return Number(p.inventory_quantity) || 0
}

function getDisplayPrice(p: any): number {
  const active = (p.product_variants ?? []).filter((v: any) => v.is_active && v.price != null)
  if (active.length > 0) return Math.min(...active.map((v: any) => Number(v.price)))
  return Number(p.price) || 0
}

function getComparePrice(p: any): number | null {
  if (p.compare_price) return Number(p.compare_price)
  const active = (p.product_variants ?? []).filter((v: any) => v.is_active && v.compare_price != null)
  if (active.length > 0) return Math.min(...active.map((v: any) => Number(v.compare_price)))
  return null
}

function getColorOptions(p: any): string[] {
  const colors = new Set<string>()
  ;(p.product_variants ?? []).filter((v: any) => v.is_active).forEach((v: any) => {
    if (v.options?.color) colors.add(v.options.color)
  })
  return Array.from(colors)
}

export default function ProductsClient() {
  const supabase = createClient()
  const [products,    setProducts]    = useState<any[]>([])
  const [categories,  setCategories]  = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [category,    setCategory]    = useState('')
  const [minPrice,    setMinPrice]    = useState(0)
  const [maxPrice,    setMaxPrice]    = useState(10000)
  const [priceMax,    setPriceMax]    = useState(10000)
  const [sortBy,      setSortBy]      = useState('newest')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: prodsActive }, { data: cats }] = await Promise.all([
      supabase
        .from('products')
        .select(`
          *,
          categories (id, name, slug),
          product_variants (id, price, compare_price, inventory_quantity, options, is_active, image_url)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').eq('is_active', true).order('position'),
    ])

    let prods = prodsActive || []
    // Fallback: if too few active products, fetch all
    if (prods.length <= 1) {
      const { data: prodsAll } = await supabase
        .from('products')
        .select(`
          *,
          categories (id, name, slug),
          product_variants (id, price, compare_price, inventory_quantity, options, is_active, image_url)
        `)
        .order('created_at', { ascending: false })
      if (prodsAll && prodsAll.length > prods.length) prods = prodsAll
    }

    setProducts(prods)
    setCategories(cats || [])
    if (prods.length > 0) {
      const computedMax = Math.ceil(Math.max(...prods.map((p: any) => getDisplayPrice(p) || 0)))
      const safeMax = computedMax > 0 ? computedMax : 10000
      setPriceMax(safeMax)
      setMaxPrice(safeMax)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  /* ─── Filter + sort ───────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...products]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.categories?.name?.toLowerCase().includes(q)
      )
    }
    if (category) list = list.filter(p => String(p.category_id) === String(category))
    list = list.filter(p => {
      const price = getDisplayPrice(p)
      return price >= minPrice && price <= maxPrice
    })
    switch (sortBy) {
      case 'price_asc':  list.sort((a, b) => getDisplayPrice(a) - getDisplayPrice(b)); break
      case 'price_desc': list.sort((a, b) => getDisplayPrice(b) - getDisplayPrice(a)); break
      case 'name_asc':   list.sort((a, b) => a.name.localeCompare(b.name)); break
      case 'featured':   list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)); break
      default:           list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    return list
  }, [products, search, category, minPrice, maxPrice, sortBy])

  const clearAll  = () => { setSearch(''); setCategory(''); setMinPrice(0); setMaxPrice(priceMax); setSortBy('newest') }
  const hasFilter = !!(search || category || minPrice > 0 || maxPrice < priceMax || sortBy !== 'newest')

  const addToCart = (e: React.MouseEvent, product: any, buyNow = false) => {
    e.preventDefault()
    e.stopPropagation()
    const cart: any[] = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = cart.find((i: any) => i.productId === String(product.id))
    if (existing) {
      existing.quantity += 1
    } else {
      cart.push({
        id: `${product.id}-${Date.now()}`,
        productId: String(product.id),
        name: product.name,
        price: getDisplayPrice(product),
        quantity: 1,
        image: product.main_image_url || '',
      })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('storage'))
    if (buyNow) window.location.href = '/cart'
  }

  /* ─── Sidebar ─────────────────────────────────────────────────────────── */
  const Sidebar = () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1410', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Filters</p>
        {hasFilter && (
          <button onClick={clearAll} style={{ fontSize: 11, color: '#b8860b', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.04em' }}>
            CLEAR ALL
          </button>
        )}
      </div>
      {/* Search */}
      <div style={{ position: 'relative' }}>
        <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(26,20,16,0.35)', pointerEvents: 'none' }} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
          style={{ width: '100%', background: '#fff', border: '1px solid #d4c8b8', borderRadius: 10, padding: '9px 12px 9px 36px', fontSize: 13, color: '#1a1410', outline: 'none', boxSizing: 'border-box' }} />
      </div>
      {/* Categories */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(26,20,16,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Categories</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[{ id: '', name: 'All Products' }, ...categories].map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 9,
                textAlign: 'left', border: '1px solid transparent', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background:   category === cat.id ? 'rgba(184,134,11,0.10)' : 'transparent',
                color:        category === cat.id ? '#b8860b' : 'rgba(26,20,16,0.65)',
                borderColor:  category === cat.id ? 'rgba(184,134,11,0.25)' : 'transparent',
                transition: 'all 0.15s',
              }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: category === cat.id ? '#b8860b' : 'rgba(26,20,16,0.2)' }} />
              {cat.name}
            </button>
          ))}
        </div>
      </div>
      {/* Price Range */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(26,20,16,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Price Range</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#b8860b', background: 'rgba(184,134,11,0.12)', padding: '3px 10px', borderRadius: 6 }}>₹{minPrice.toLocaleString('en-IN')}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#b8860b', background: 'rgba(184,134,11,0.12)', padding: '3px 10px', borderRadius: 6 }}>₹{maxPrice.toLocaleString('en-IN')}</span>
        </div>
        <style>{`
          .price-range{-webkit-appearance:none;appearance:none;width:100%;height:4px;background:rgba(108,99,255,0.2);border-radius:2px;outline:none;margin-bottom:8px}
          .price-range::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;background:#6c63ff;border-radius:50%;cursor:pointer;border:2px solid #0c0e14;box-shadow:0 2px 6px rgba(108,99,255,0.4)}
        `}</style>
        <input type="range" className="price-range" min={0} max={priceMax} value={minPrice}
          onChange={e => { const v = Number(e.target.value); if (v <= maxPrice) setMinPrice(v) }} />
        <input type="range" className="price-range" min={0} max={priceMax} value={maxPrice}
          onChange={e => { const v = Number(e.target.value); if (v >= minPrice) setMaxPrice(v) }} />
        <p style={{ marginTop: 8, fontSize: 11, color: 'rgba(26,20,16,0.5)' }}>
          Use the sliders to set your custom price range.
        </p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#1a1410' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Syne:wght@700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .prod-card { background:#fff; border:1px solid #e8e0d4; border-radius:16px; overflow:hidden; transition:all 0.28s; display:block; text-decoration:none; color:inherit; }
        .prod-card:hover { border-color:rgba(184,134,11,0.35); transform:translateY(-4px); box-shadow:0 16px 36px rgba(184,134,11,0.16); }
        .prod-card:hover .pimg { transform:scale(1.06); }
        .pimg { transition:transform 0.45s cubic-bezier(.4,0,.2,1); width:100%; height:100%; object-fit:cover; display:block; }
        .card-hover-actions { position:absolute; inset:0; background:rgba(10,8,6,0.48); display:flex; flex-direction:column; align-items:center; justify-content:flex-end; padding:14px 12px; gap:7px; opacity:0; transition:opacity 0.25s; pointer-events:none; }
        .prod-card:hover .card-hover-actions { opacity:1; pointer-events:auto; }
        .btn-cart { width:100%; background:#fff; color:#1a1410; border:none; border-radius:9px; padding:9px 14px; font-size:12.5px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; letter-spacing:0.01em; transition:background 0.15s; }
        .btn-cart:hover { background:#f3ece1; }
        .btn-buy  { width:100%; background:#b8860b; color:#fff; border:none; border-radius:9px; padding:9px 14px; font-size:12.5px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; letter-spacing:0.01em; transition:background 0.15s; }
        .btn-buy:hover  { background:#9a710a; }
        .sort-select { background:#fff; border:1px solid #d4c8b8; color:#1a1410; border-radius:10px; padding:8px 32px 8px 12px; font-size:13px; outline:none; appearance:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }
        .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:40; }
        .mobile-sidebar { position:fixed; left:0; top:0; bottom:0; width:290px; background:#fff; z-index:50; overflow-y:auto; padding:24px; transform:translateX(-100%); transition:transform 0.3s cubic-bezier(.4,0,.2,1); }
        .mobile-sidebar.open { transform:translateX(0); }
        .products-grid { display:grid; gap:18px; grid-template-columns:repeat(3,1fr); }
        @media(max-width:1100px){ .products-grid{ grid-template-columns:repeat(3,1fr); } }
        @media(max-width:860px) { .products-grid{ grid-template-columns:repeat(2,1fr); } }
        @media(max-width:640px) { .products-grid{ grid-template-columns:repeat(2,1fr); gap:12px; } }
        @media(max-width:400px) { .products-grid{ grid-template-columns:1fr; } }
        @media(max-width:768px){ .desktop-sidebar{display:none!important} .mobile-filter-btn{display:flex!important} }
        @media(max-width:640px){ .products-wrap{ padding:20px 14px!important; } .prod-card{ border-radius:12px; } }
        .prod-name { font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; font-weight:600; color:#1a1410; line-height:1.4; margin-bottom:8px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .prod-price { display:flex; align-items:baseline; gap:4px; flex-wrap:wrap; }
        .prod-price-from { font-family:'Plus Jakarta Sans',sans-serif; font-size:11px; font-weight:500; color:rgba(26,20,16,0.5); }
        .prod-price-amount { font-family:'Plus Jakarta Sans',sans-serif; font-size:18px; font-weight:800; color:#1a1410; letter-spacing:-0.01em; }
        .prod-compare { font-family:'Plus Jakarta Sans',sans-serif; font-size:12px; color:rgba(26,20,16,0.38); text-decoration:line-through; align-self:center; }
        .prod-cat { font-size:10px; font-weight:600; color:#a78bfa; background:rgba(108,99,255,0.1); padding:2px 8px; border-radius:50px; letter-spacing:0.04em; display:inline-block; margin-bottom:7px; }
        .prod-variants { font-size:10px; color:rgba(26,20,16,0.4); margin-top:3px; }
        .prod-lowstock { font-size:10px; color:#f59e0b; margin-top:4px; font-weight:600; }
        .page-title { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:#1a1410; letter-spacing:-0.01em; }
        .page-count { font-size:12px; color:rgba(26,20,16,0.45); margin-top:2px; }
      `}</style>

      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}
      <div className={`mobile-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color:'#1a1410' }}>Filters</span>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(26,20,16,0.5)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <Sidebar />
      </div>

      <div className="products-wrap" style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', display: 'flex', gap: 28 }}>
        {/* Desktop Sidebar */}
        <aside className="desktop-sidebar" style={{ width: 230, flexShrink: 0, background: '#fff', border: '1px solid #e8e0d4', borderRadius: 16, padding: '24px 18px', position: 'sticky', top: 24, height: 'fit-content', alignSelf: 'flex-start' }}>
          <Sidebar />
        </aside>

        {/* Main */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setSidebarOpen(true)} className="mobile-filter-btn"
                style={{ display: 'none', background: '#fff', border: '1px solid #d4c8b8', borderRadius: 10, padding: '8px 12px', color: 'rgba(26,20,16,0.7)', fontSize: 13, cursor: 'pointer', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M8 12h8M11 20h2" /></svg>
                Filters
              </button>
              <div>
                  <h1 className="page-title">
                  {search ? `Results for "${search}"` : category ? categories.find(c => c.id === category)?.name || 'Products' : 'All Products'}
                </h1>
                <p className="page-count">{filtered.length} product{filtered.length !== 1 ? 's' : ''} found</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => { setCategory(''); setSearch(''); setMinPrice(0); setMaxPrice(priceMax || 10000); setSortBy('newest') }} style={{ fontSize: 12, color: '#1a1410', background: '#fff', border: '1px solid #d4c8b8', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}>
                All Products
              </button>
              {hasFilter && (
                <button onClick={clearAll} style={{ fontSize: 12, color: '#b8860b', background: 'rgba(184,134,11,0.1)', border: '1px solid rgba(184,134,11,0.2)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}>
                  ✕ Clear
                </button>
              )}
              <div style={{ position: 'relative' }}>
                <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="newest">Newest</option>
                  <option value="featured">Featured</option>
                  <option value="price_asc">Price ↑</option>
                  <option value="price_desc">Price ↓</option>
                  <option value="name_asc">Name A–Z</option>
                </select>
                <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(26,20,16,0.45)' }} width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="products-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e8e0d4', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ aspectRatio: '1', background: '#f3ece1', animation: 'pulse 1.5s ease infinite' }} />
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ height: 10, width: '40%', borderRadius: 6, background: '#f3ece1', marginBottom: 8, animation: 'pulse 1.5s ease infinite' }} />
                    <div style={{ height: 14, width: '80%', borderRadius: 6, background: '#f3ece1', marginBottom: 10, animation: 'pulse 1.5s ease infinite' }} />
                    <div style={{ height: 18, width: '35%', borderRadius: 6, background: '#f3ece1', animation: 'pulse 1.5s ease infinite' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', background: '#fff', border: '1px solid #e8e0d4', borderRadius: 20 }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>No products found</h2>
              <p style={{ color: 'rgba(26,20,16,0.5)', fontSize: 14, marginBottom: 24 }}>Try adjusting your search or filters</p>
              <button onClick={clearAll} style={{ background: '#b8860b', color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Clear Filters</button>
            </div>
          ) : (
            <div className="products-grid">
              {filtered.map(p => {
                const displayPrice   = getDisplayPrice(p)
                const comparePrice   = getComparePrice(p)
                const discount       = comparePrice && comparePrice > displayPrice
                  ? Math.round((1 - displayPrice / comparePrice) * 100) : 0
                const colors         = getColorOptions(p)
                const activeVariants = (p.product_variants ?? []).filter((v: any) => v.is_active === true)
                const hasVariants    = activeVariants.length > 0
                const productUrl = `/products/${p.slug}`
                const waText = encodeURIComponent(`Hi, I'm interested in ${p.name} - ${typeof window !== 'undefined' ? window.location.origin : ''}${productUrl}`)
                const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`

                const totalStock  = getTotalStock(p)
                const isOOS       = totalStock === 0
                const showLowStock = p.track_inventory !== false && totalStock > 0 && totalStock <= 10

                return (
                  <div key={p.id} className="prod-card"
                    style={{ opacity: isOOS && p.track_inventory !== false ? 0.75 : 1 }}>
                    {/* Image */}
                    <div style={{ aspectRatio: '1', background: '#f3ece1', position: 'relative', overflow: 'hidden' }}>
                      <Link href={`/products/${p.slug}`} style={{ display: 'block', height: '100%' }}>
                        {p.main_image_url
                          ? <img src={p.main_image_url} alt={p.name} className="pimg" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="48" height="48" fill="none" stroke="rgba(26,20,16,0.12)" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )
                        }
                      </Link>
                      {p.is_featured && (
                        <div style={{ position: 'absolute', top: 10, left: 10, background: 'linear-gradient(135deg,#d4a843,#a07820)', color: '#0a0a0a', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, letterSpacing: '0.07em', textTransform: 'uppercase', zIndex: 2 }}>
                          ★ Featured
                        </div>
                      )}
                      {discount > 0 && !isOOS && (
                        <div style={{ position: 'absolute', top: 10, right: 10, background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6, zIndex: 2 }}>
                          -{discount}%
                        </div>
                      )}
                      {isOOS && p.track_inventory !== false && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(232,234,242,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'rgba(0,0,0,0.4)', padding: '5px 12px', borderRadius: 6 }}>
                            Out of Stock
                          </span>
                        </div>
                      )}
                      {!isOOS && (
                        <div className="card-hover-actions">
                          <button className="btn-cart" onClick={e => addToCart(e, p)}>Add to Cart</button>
                          <button className="btn-buy"  onClick={e => addToCart(e, p, true)}>Buy Now</button>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: '14px 14px 16px' }}>
                      {p.categories && (
                        <span className="prod-cat">{p.categories.name}</span>
                      )}
                      <Link href={`/products/${p.slug}`} style={{ textDecoration: 'none' }}>
                        <p className="prod-name">{p.name}</p>
                      </Link>

                      {/* Color swatches */}
                      {colors.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                          {colors.slice(0, 5).map(c => {
                            const hex = getColorHex(c)
                            return hex ? (
                              <div key={c} title={c} style={{ width: 14, height: 14, borderRadius: '50%', background: hex, border: '1.5px solid rgba(255,255,255,0.2)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15)' }} />
                            ) : (
                              <div key={c} style={{ fontSize: 9, color: 'rgba(26,20,16,0.5)', background: '#f3ece1', padding: '1px 5px', borderRadius: 4 }}>{c}</div>
                            )
                          })}
                          {colors.length > 5 && <span style={{ fontSize: 10, color: 'rgba(26,20,16,0.4)' }}>+{colors.length - 5}</span>}
                        </div>
                      )}

                      {/* Price */}
                      <div className="prod-price">
                        <span className="prod-price-amount">
                          {hasVariants && <span className="prod-price-from">From&nbsp;</span>}
                          ₹{displayPrice.toLocaleString('en-IN')}
                        </span>
                        {comparePrice && comparePrice > displayPrice && (
                          <span className="prod-compare">₹{comparePrice.toLocaleString('en-IN')}</span>
                        )}
                      </div>

                      {hasVariants && !isOOS && (
                        <p className="prod-variants">
                          {activeVariants.length} variant{activeVariants.length !== 1 ? 's' : ''} available
                        </p>
                      )}
                      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#25D366', padding: '6px 10px', borderRadius: 999, textDecoration: 'none' }}
                        >
                          WhatsApp
                        </a>
                      </div>
                      {showLowStock && (
                        <p className="prod-lowstock">Only {totalStock} left!</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
