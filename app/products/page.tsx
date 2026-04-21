'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const COLOR_MAP: Record<string, string> = {
  gold: '#d4a843', silver: '#c0c0c0', black: '#1a1a1a', white: '#f0f0f0',
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', brown: '#92400e',
  beige: '#d6c7a1', grey: '#6b7280', gray: '#6b7280', bronze: '#cd7f32',
  rose: '#f43f5e', navy: '#1e3a5f', cream: '#fffdd0', orange: '#f97316',
}

function getColorHex(name: string) {
  return COLOR_MAP[name.toLowerCase()] ?? null
}

export default function ProductsPage() {
  const supabase = createClient()

  const [products, setProducts]     = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('')
  const [minPrice, setMinPrice]     = useState(0)
  const [maxPrice, setMaxPrice]     = useState(10000)
  const [priceMax, setPriceMax]     = useState(10000)
  const [sortBy, setSortBy]         = useState('newest')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase
        .from('products')
        .select(`*, categories (id, name, slug), product_variants (id, price, compare_price, inventory_quantity, options, is_active)`)
        .eq('is_active', true),
      supabase.from('categories').select('*').eq('is_active', true).order('position'),
    ])
    setProducts(prods || [])
    setCategories(cats || [])
    if (prods && prods.length > 0) {
      const max = Math.ceil(Math.max(...prods.map((p: any) => Number(p.price))))
      setPriceMax(max)
      setMaxPrice(max)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

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
    if (category) list = list.filter(p => p.category_id === category)
    list = list.filter(p => {
      const price = Number(p.price)
      return price >= minPrice && price <= maxPrice
    })
    switch (sortBy) {
      case 'price_asc':  list.sort((a, b) => Number(a.price) - Number(b.price)); break
      case 'price_desc': list.sort((a, b) => Number(b.price) - Number(a.price)); break
      case 'name_asc':   list.sort((a, b) => a.name.localeCompare(b.name)); break
      case 'featured':   list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)); break
      default:           list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    return list
  }, [products, search, category, minPrice, maxPrice, sortBy])

  const clearAll = () => { setSearch(''); setCategory(''); setMinPrice(0); setMaxPrice(priceMax); setSortBy('newest') }
  const hasFilter = search || category || minPrice > 0 || maxPrice < priceMax || sortBy !== 'newest'

  // Get display price for a product (lowest active variant price or base price)
  function getDisplayPrice(p: any) {
    const active = p.product_variants?.filter((v: any) => v.is_active && v.price != null)
    if (active && active.length > 0) return Math.min(...active.map((v: any) => Number(v.price)))
    return Number(p.price)
  }

  function getComparePrice(p: any) {
    if (p.compare_price) return Number(p.compare_price)
    const active = p.product_variants?.filter((v: any) => v.is_active && v.compare_price != null)
    if (active && active.length > 0) return Math.min(...active.map((v: any) => Number(v.compare_price)))
    return null
  }

  // Get unique color options across all variants
  function getColorOptions(p: any): string[] {
    if (!p.product_variants) return []
    const colors = new Set<string>()
    p.product_variants.filter((v: any) => v.is_active).forEach((v: any) => {
      if (v.options?.color) colors.add(v.options.color)
    })
    return Array.from(colors)
  }

  const Sidebar = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#e8eaf2', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Filters</p>
        {hasFilter && (
          <button onClick={clearAll} style={{ fontSize: 11, color: '#6c63ff', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.04em' }}>
            CLEAR ALL
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(232,234,242,0.3)', pointerEvents: 'none' }} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          style={{
            width: '100%', background: '#1a1d28', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: '9px 12px 9px 36px', fontSize: 13,
            color: '#e8eaf2', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Categories */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(232,234,242,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Categories</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[{ id: '', name: 'All Products' }, ...categories].map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 9, textAlign: 'left',
                border: '1px solid transparent', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: category === cat.id ? 'rgba(108,99,255,0.12)' : 'transparent',
                color: category === cat.id ? '#a78bfa' : 'rgba(232,234,242,0.5)',
                borderColor: category === cat.id ? 'rgba(108,99,255,0.2)' : 'transparent',
                transition: 'all 0.15s',
              }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: category === cat.id ? '#6c63ff' : 'rgba(255,255,255,0.15)',
              }} />
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(232,234,242,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Price Range</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6c63ff', background: 'rgba(108,99,255,0.1)', padding: '3px 10px', borderRadius: 6 }}>₹{minPrice.toLocaleString('en-IN')}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6c63ff', background: 'rgba(108,99,255,0.1)', padding: '3px 10px', borderRadius: 6 }}>₹{maxPrice.toLocaleString('en-IN')}</span>
        </div>
        <style>{`
          .price-range { -webkit-appearance:none; appearance:none; width:100%; height:4px; background:rgba(108,99,255,0.2); border-radius:2px; outline:none; margin-bottom:8px; }
          .price-range::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; background:#6c63ff; border-radius:50%; cursor:pointer; border:2px solid #0c0e14; box-shadow:0 2px 6px rgba(108,99,255,0.4); }
        `}</style>
        <input type="range" className="price-range" min={0} max={priceMax} value={minPrice}
          onChange={e => { const v = Number(e.target.value); if (v <= maxPrice) setMinPrice(v) }} />
        <input type="range" className="price-range" min={0} max={priceMax} value={maxPrice}
          onChange={e => { const v = Number(e.target.value); if (v >= minPrice) setMaxPrice(v) }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
          {[['Under ₹500', 0, 500], ['₹500–₹2,000', 500, 2000], ['₹2,000–₹5,000', 2000, 5000], ['Over ₹5,000', 5000, priceMax]].map(([label, mn, mx]) => (
            <button key={String(label)} onClick={() => { setMinPrice(Number(mn)); setMaxPrice(Number(mx)) }}
              style={{
                textAlign: 'left', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                border: '1px solid transparent', cursor: 'pointer',
                background: minPrice === mn && maxPrice === mx ? 'rgba(108,99,255,0.12)' : 'transparent',
                color: minPrice === mn && maxPrice === mx ? '#a78bfa' : 'rgba(232,234,242,0.45)',
                borderColor: minPrice === mn && maxPrice === mx ? 'rgba(108,99,255,0.2)' : 'transparent',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0c0e14', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#e8eaf2' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .prod-card { background:#13161f; border:1px solid rgba(255,255,255,0.07); border-radius:16px; overflow:hidden; transition:all 0.25s; display:block; text-decoration:none; color:inherit; }
        .prod-card:hover { border-color:rgba(108,99,255,0.35); transform:translateY(-4px); box-shadow:0 16px 36px rgba(0,0,0,0.4); }
        .prod-card:hover .pimg { transform:scale(1.06); }
        .pimg { transition:transform 0.45s cubic-bezier(.4,0,.2,1); width:100%; height:100%; object-fit:cover; }
        .sort-select { background:#1a1d28; border:1px solid rgba(255,255,255,0.08); color:#e8eaf2; border-radius:10px; padding:8px 32px 8px 12px; font-size:13px; outline:none; appearance:none; cursor:pointer; font-family:inherit; }
        .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:40; }
        .mobile-sidebar { position:fixed; left:0; top:0; bottom:0; width:290px; background:#13161f; z-index:50; overflow-y:auto; padding:24px; transform:translateX(-100%); transition:transform 0.3s cubic-bezier(.4,0,.2,1); }
        .mobile-sidebar.open { transform:translateX(0); }
        @media(max-width:768px){ .desktop-sidebar{display:none!important} }
      `}</style>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}
      <div className={`mobile-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Filters</span>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(232,234,242,0.5)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <Sidebar />
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', display: 'flex', gap: 28 }}>

        {/* Desktop Sidebar */}
        <aside className="desktop-sidebar" style={{
          width: 230, flexShrink: 0,
          background: '#13161f', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: '24px 18px',
          position: 'sticky', top: 24, height: 'fit-content', alignSelf: 'flex-start',
        }}>
          <Sidebar />
        </aside>

        {/* Main */}
        <main style={{ flex: 1, minWidth: 0 }}>

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Mobile filter btn */}
              <button onClick={() => setSidebarOpen(true)}
                style={{ display: 'none', background: '#1a1d28', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', color: 'rgba(232,234,242,0.6)', fontSize: 13, cursor: 'pointer', alignItems: 'center', gap: 6 }}
                className="mobile-filter-btn">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M8 12h8M11 20h2" /></svg>
                Filters
              </button>
              <div>
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: '#e8eaf2', letterSpacing: '-0.01em' }}>
                  {search ? `Results for "${search}"` : category ? categories.find(c => c.id === category)?.name || 'Products' : 'All Products'}
                </h1>
                <p style={{ fontSize: 12, color: 'rgba(232,234,242,0.35)', marginTop: 2 }}>{filtered.length} product{filtered.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {hasFilter && (
                <button onClick={clearAll}
                  style={{ fontSize: 12, color: '#a78bfa', background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}>
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
                <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(232,234,242,0.4)' }} width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ background: '#13161f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ aspectRatio: '1', background: '#1a1d28', animation: 'pulse 1.5s ease infinite' }} />
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ height: 10, width: '40%', borderRadius: 6, background: '#1a1d28', marginBottom: 8, animation: 'pulse 1.5s ease infinite' }} />
                    <div style={{ height: 14, width: '80%', borderRadius: 6, background: '#1a1d28', marginBottom: 10, animation: 'pulse 1.5s ease infinite' }} />
                    <div style={{ height: 18, width: '35%', borderRadius: 6, background: '#1a1d28', animation: 'pulse 1.5s ease infinite' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', background: '#13161f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20 }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>No products found</h2>
              <p style={{ color: 'rgba(232,234,242,0.4)', fontSize: 14, marginBottom: 24 }}>Try adjusting your search or filters</p>
              <button onClick={clearAll} style={{ background: '#6c63ff', color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Clear Filters</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {filtered.map(p => {
                const displayPrice = getDisplayPrice(p)
                const comparePrice = getComparePrice(p)
                const discount = comparePrice && comparePrice > displayPrice
                  ? Math.round((1 - displayPrice / comparePrice) * 100) : 0
                const colors = getColorOptions(p)
                const hasVariants = p.product_variants?.length > 0
                const totalStock = hasVariants
                  ? p.product_variants.filter((v: any) => v.is_active).reduce((s: number, v: any) => s + v.inventory_quantity, 0)
                  : p.inventory_quantity

                return (
                  <Link key={p.id} href={`/products/${p.slug}`} className="prod-card">
                    {/* Image */}
                    <div style={{ aspectRatio: '1', background: '#1a1d28', position: 'relative', overflow: 'hidden' }}>
                      {p.main_image_url
                        ? <img src={p.main_image_url} alt={p.name} className="pimg" />
                        : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="48" height="48" fill="none" stroke="rgba(255,255,255,0.1)" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )
                      }
                      {p.is_featured && (
                        <div style={{ position: 'absolute', top: 10, left: 10, background: 'linear-gradient(135deg,#d4a843,#a07820)', color: '#0a0a0a', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                          ★ Featured
                        </div>
                      )}
                      {discount > 0 && (
                        <div style={{ position: 'absolute', top: 10, right: 10, background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>
                          -{discount}%
                        </div>
                      )}
                      {totalStock === 0 && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(232,234,242,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Out of Stock</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: '14px 14px 16px' }}>
                      {p.categories && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#a78bfa', background: 'rgba(108,99,255,0.1)', padding: '2px 8px', borderRadius: 50, letterSpacing: '0.04em', display: 'inline-block', marginBottom: 7 }}>
                          {p.categories.name}
                        </span>
                      )}
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: '#e8eaf2', lineHeight: 1.4, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.name}
                      </p>

                      {/* Color swatches preview */}
                      {colors.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                          {colors.slice(0, 5).map(c => {
                            const hex = getColorHex(c)
                            return hex ? (
                              <div key={c} title={c} style={{ width: 14, height: 14, borderRadius: '50%', background: hex, border: '1.5px solid rgba(255,255,255,0.2)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15)' }} />
                            ) : (
                              <div key={c} style={{ fontSize: 9, color: 'rgba(232,234,242,0.4)', background: '#1a1d28', padding: '1px 5px', borderRadius: 4 }}>{c}</div>
                            )
                          })}
                          {colors.length > 5 && <span style={{ fontSize: 10, color: 'rgba(232,234,242,0.35)' }}>+{colors.length - 5}</span>}
                        </div>
                      )}

                      {/* Price */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: '#e8eaf2' }}>
                          {hasVariants ? 'From ' : ''}₹{displayPrice.toLocaleString('en-IN')}
                        </span>
                        {comparePrice && comparePrice > displayPrice && (
                          <span style={{ fontSize: 12, color: 'rgba(232,234,242,0.3)', textDecoration: 'line-through' }}>₹{comparePrice.toLocaleString('en-IN')}</span>
                        )}
                      </div>

                      {hasVariants && (
                        <p style={{ fontSize: 10, color: 'rgba(232,234,242,0.3)', marginTop: 4 }}>
                          {p.product_variants.filter((v: any) => v.is_active).length} variants available
                        </p>
                      )}
                      {!hasVariants && totalStock > 0 && totalStock <= 10 && (
                        <p style={{ fontSize: 10, color: '#f59e0b', marginTop: 4 }}>Only {totalStock} left</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}