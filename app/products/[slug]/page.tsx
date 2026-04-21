'use client'

import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, use, useCallback } from 'react'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  short_description: string
  sku: string
  price: number
  compare_price: number | null
  category_id: string | null
  main_image_url: string
  images: string[]
  inventory_quantity: number
  track_inventory: boolean
  is_active: boolean
  is_featured: boolean
  tags: string[]
  option_keys: string[]
  categories?: { name: string; slug: string }
}

interface Variant {
  id: string
  name: string
  sku: string | null
  price: number | null
  compare_price: number | null
  cost_price: number | null
  inventory_quantity: number
  options: Record<string, string>
  position: number
  is_active: boolean
}

const COLOR_MAP: Record<string, string> = {
  gold: '#d4a843', silver: '#c0c0c0', black: '#1a1a1a', white: '#f0f0f0',
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', brown: '#92400e',
  beige: '#d6c7a1', grey: '#6b7280', gray: '#6b7280', bronze: '#cd7f32',
  rose: '#f43f5e', navy: '#1e3a5f', cream: '#fffdd0', orange: '#f97316',
}

function parseOptions(variants: Variant[]): Record<string, string[]> {
  const map: Record<string, Set<string>> = {}
  variants.forEach(v => {
    if (v.options && typeof v.options === 'object') {
      Object.entries(v.options).forEach(([k, val]) => {
        if (!map[k]) map[k] = new Set()
        map[k].add(val)
      })
    }
  })
  return Object.fromEntries(Object.entries(map).map(([k, s]) => [k, Array.from(s)]))
}

// Check if a given selection combo is available / has stock
function isComboAvailable(variants: Variant[], selected: Record<string, string>, optionKey: string, optionVal: string) {
  const check = { ...selected, [optionKey]: optionVal }
  return variants.some(v =>
    v.is_active &&
    Object.entries(check).every(([k, val]) => v.options[k] === val) &&
    v.inventory_quantity > 0
  )
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const [product, setProduct]             = useState<Product | null>(null)
  const [variants, setVariants]           = useState<Variant[]>([])
  const [loading, setLoading]             = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity]           = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [addedToCart, setAddedToCart]     = useState(false)
  const [activeTab, setActiveTab]         = useState<'description' | 'shipping' | 'reviews'>('description')
  const [isWishlisted, setIsWishlisted]   = useState(false)

  const fetchProduct = useCallback(async () => {
    const supabase = createClient()
    let { data, error } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('slug', slug)
      .maybeSingle()

    if (!data || error) {
      const { data: all } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .ilike('slug', `%${slug}%`)
        .limit(1)
      if (all?.length) { data = all[0]; error = null }
    }

    if (data && !error) {
      setProduct(data)
      const { data: vData } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', data.id)
        .eq('is_active', true)
        .order('position')
      const vList: Variant[] = vData || []
      setVariants(vList)

      // Auto-select first available option per key
      if (vList.length > 0) {
        const opts = parseOptions(vList)
        const auto: Record<string, string> = {}
        Object.entries(opts).forEach(([k, vals]) => { auto[k] = vals[0] })
        setSelectedOptions(auto)
      }
    }
    setLoading(false)
  }, [slug])

  useEffect(() => { fetchProduct() }, [fetchProduct])

  /* ── Derived state ── */
  const allImages = product ? [
    ...(product.main_image_url ? [product.main_image_url] : []),
    ...(product.images?.filter(Boolean) || []),
  ] : []

  const parsedOptions = parseOptions(variants)
  const optionKeys    = product?.option_keys?.filter(k => parsedOptions[k]) || Object.keys(parsedOptions)

  // Find matching variant for current selection
  const selectedVariant = variants.find(v =>
    Object.entries(selectedOptions).every(([k, val]) => v.options[k] === val)
  ) ?? null

  const displayPrice   = selectedVariant?.price    ?? product?.price    ?? 0
  const displayCompare = selectedVariant?.compare_price ?? product?.compare_price ?? null
  const discount       = displayCompare && displayCompare > displayPrice
    ? Math.round((1 - displayPrice / displayCompare) * 100) : 0
  const stock          = selectedVariant?.inventory_quantity ?? product?.inventory_quantity ?? 0
  const allSelected    = optionKeys.length > 0 && optionKeys.every(k => selectedOptions[k])

  /* ── Cart ── */
  const handleAddToCart = () => {
    if (!product || !allSelected) return
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const itemId = selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id
    const variantLabel = selectedVariant
      ? Object.entries(selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ')
      : ''
    const idx = cart.findIndex((i: any) => i.productId === itemId)
    if (idx > -1) {
      cart[idx].quantity += quantity
    } else {
      cart.push({
        id: Date.now().toString(),
        productId: itemId,
        name: product.name,
        variantLabel,
        price: displayPrice,
        quantity,
        image: product.main_image_url,
        sku: selectedVariant?.sku || product.sku,
      })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2800)
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c0e14' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid rgba(108,99,255,0.2)', borderTopColor: '#6c63ff', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ color: 'rgba(232,234,242,0.35)', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Loading product…</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0c0e14', fontFamily: 'Plus Jakarta Sans, sans-serif', gap: 12 }}>
        <p style={{ fontSize: 52 }}>📦</p>
        <h1 style={{ color: '#e8eaf2', fontSize: 22, fontWeight: 700 }}>Product not found</h1>
        <p style={{ color: 'rgba(232,234,242,0.4)', fontSize: 14 }}>This product doesn't exist or has been removed.</p>
        <Link href="/products" style={{ marginTop: 8, background: '#6c63ff', color: 'white', padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Browse Products</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0c0e14', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#e8eaf2' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        @keyframes spin    { to   { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0;transform:translateY(10px); } to { opacity:1;transform:translateY(0); } }
        @keyframes pop     { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .thumb { border:2px solid transparent; border-radius:10px; overflow:hidden; cursor:pointer; background:#1a1d28; padding:0; transition:border-color 0.18s; flex-shrink:0; }
        .thumb:hover { border-color:rgba(108,99,255,0.45); }
        .thumb.active { border-color:#6c63ff; }

        .opt-chip { padding:9px 16px; border-radius:9px; font-size:13px; font-weight:600; border:1.5px solid rgba(255,255,255,0.1); background:#1a1d28; color:rgba(232,234,242,0.55); cursor:pointer; transition:all 0.18s; display:inline-flex; align-items:center; gap:6px; position:relative; }
        .opt-chip:hover:not(:disabled) { border-color:rgba(108,99,255,0.5); color:#e8eaf2; }
        .opt-chip.selected { background:rgba(108,99,255,0.14); border-color:#6c63ff; color:#a78bfa; }
        .opt-chip.unavailable { opacity:0.3; cursor:not-allowed; }
        .opt-chip.unavailable::after { content:''; position:absolute; left:4px; right:4px; top:50%; height:1px; background:rgba(248,113,113,0.5); transform:rotate(-10deg); }

        .color-swatch { width:32px; height:32px; border-radius:50%; cursor:pointer; border:2.5px solid transparent; transition:all 0.18s; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.2); flex-shrink:0; }
        .color-swatch:hover { transform:scale(1.12); }
        .color-swatch.selected { border-color:#6c63ff; box-shadow:0 0 0 3px rgba(108,99,255,0.3),inset 0 0 0 1px rgba(255,255,255,0.2); }
        .color-swatch.unavailable { opacity:0.25; cursor:not-allowed; filter:grayscale(1); }

        .qty-btn { width:36px; height:36px; border-radius:8px; background:#1a1d28; border:1.5px solid rgba(255,255,255,0.1); color:#e8eaf2; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; font-weight:300; }
        .qty-btn:hover:not(:disabled) { background:#21253a; border-color:rgba(108,99,255,0.4); }
        .qty-btn:disabled { opacity:0.28; cursor:not-allowed; }

        .add-btn { flex:1; padding:14px 20px; border-radius:12px; font-size:15px; font-weight:700; cursor:pointer; border:none; transition:all 0.22s; display:flex; align-items:center; justify-content:center; gap:8px; font-family:inherit; }
        .add-btn-primary { background:#6c63ff; color:white; }
        .add-btn-primary:hover:not(:disabled) { background:#7c73ff; box-shadow:0 8px 24px rgba(108,99,255,0.35); transform:translateY(-1px); }
        .add-btn-primary:disabled { opacity:0.4; cursor:not-allowed; transform:none; box-shadow:none; }
        .add-btn-primary.success { background:#22d3a5; animation:pop 0.3s ease; }

        .wish-btn { padding:14px 16px; border-radius:12px; background:#1a1d28; border:1.5px solid rgba(255,255,255,0.1); color:rgba(232,234,242,0.6); cursor:pointer; transition:all 0.18s; display:flex; align-items:center; justify-content:center; }
        .wish-btn:hover { border-color:rgba(248,113,113,0.5); color:#f87171; }
        .wish-btn.active { background:rgba(248,113,113,0.1); border-color:rgba(248,113,113,0.4); color:#f87171; }

        .tab-btn { padding:11px 20px; font-size:13.5px; font-weight:600; cursor:pointer; background:none; border:none; border-bottom:2px solid transparent; color:rgba(232,234,242,0.35); transition:all 0.18s; font-family:inherit; }
        .tab-btn.active { color:#e8eaf2; border-bottom-color:#6c63ff; }
        .tab-btn:hover:not(.active) { color:rgba(232,234,242,0.65); }

        .trust-item { display:flex; flex-direction:column; align-items:center; gap:7px; padding:14px 8px; background:#13161f; border:1px solid rgba(255,255,255,0.06); border-radius:12px; font-size:10.5px; color:rgba(232,234,242,0.4); font-weight:500; text-align:center; }

        .img-nav { position:absolute; top:50%; transform:translateY(-50%); width:36px; height:36px; border-radius:50%; background:rgba(12,14,20,0.75); border:1px solid rgba(255,255,255,0.12); color:#e8eaf2; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.18s; }
        .img-nav:hover { background:rgba(108,99,255,0.5); border-color:#6c63ff; }
        .img-nav:disabled { opacity:0.25; cursor:not-allowed; }

        .detail-page { animation: fadeUp 0.45s ease both; }

        .price-change { animation: pop 0.25s ease; }
      `}</style>

      {/* ── Breadcrumb ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'rgba(232,234,242,0.35)', flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
        <span>/</span>
        <Link href="/products" style={{ color: 'inherit', textDecoration: 'none' }}>Products</Link>
        {product.categories && (
          <>
            <span>/</span>
            <Link href={`/products?category=${product.category_id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{product.categories.name}</Link>
          </>
        )}
        <span>/</span>
        <span style={{ color: 'rgba(232,234,242,0.6)' }}>{product.name}</span>
      </div>

      {/* ── Main Grid ── */}
      <div className="detail-page" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>

        {/* ════════ LEFT — Image Gallery ════════ */}
        <div style={{ display: 'flex', gap: 12 }}>

          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 72, flexShrink: 0 }}>
              {allImages.map((img, i) => (
                <button key={i} className={`thumb ${selectedImage === i ? 'active' : ''}`} onClick={() => setSelectedImage(i)} style={{ width: 72, height: 72 }}>
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <Image src={img} alt={`View ${i + 1}`} fill style={{ objectFit: 'cover' }} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Main image */}
          <div style={{ flex: 1 }}>
            <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', background: '#13161f', border: '1px solid rgba(255,255,255,0.07)', aspectRatio: '1' }}>
              {allImages[selectedImage]
                ? <Image src={allImages[selectedImage]} alt={product.name} fill style={{ objectFit: 'cover' }} priority />
                : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>📦</div>
                )
              }
              {product.is_featured && (
                <div style={{ position: 'absolute', top: 14, left: 14, background: 'linear-gradient(135deg,#d4a843,#a07820)', color: '#0a0a0a', fontSize: 9, fontWeight: 800, padding: '4px 10px', borderRadius: 7, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  ★ Featured
                </div>
              )}
              {discount > 0 && (
                <div style={{ position: 'absolute', top: 14, right: 14, background: '#ef4444', color: 'white', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 7 }}>
                  -{discount}% OFF
                </div>
              )}
              {allImages.length > 1 && (
                <>
                  <button className="img-nav" onClick={() => setSelectedImage(p => Math.max(0, p - 1))} disabled={selectedImage === 0} style={{ left: 10 }}>
                    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button className="img-nav" onClick={() => setSelectedImage(p => Math.min(allImages.length - 1, p + 1))} disabled={selectedImage === allImages.length - 1} style={{ right: 10 }}>
                    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </>
              )}
            </div>

            {/* Dot indicators */}
            {allImages.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 12 }}>
                {allImages.map((_, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)} style={{ width: i === selectedImage ? 20 : 7, height: 7, borderRadius: 4, border: 'none', cursor: 'pointer', background: i === selectedImage ? '#6c63ff' : 'rgba(255,255,255,0.18)', transition: 'all 0.22s', padding: 0 }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ════════ RIGHT — Product Info ════════ */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>

          {/* Category + Tags */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {product.categories && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'rgba(108,99,255,0.1)', padding: '3px 10px', borderRadius: 50, border: '1px solid rgba(108,99,255,0.22)', letterSpacing: '0.04em' }}>
                {product.categories.name}
              </span>
            )}
            {product.tags?.slice(0, 2).map(tag => (
              <span key={tag} style={{ fontSize: 11, fontWeight: 600, color: 'rgba(232,234,242,0.4)', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: 50, border: '1px solid rgba(255,255,255,0.08)' }}>
                {tag}
              </span>
            ))}
          </div>

          {/* Name */}
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: '#e8eaf2', lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: 8 }}>
            {product.name}
          </h1>

          {product.short_description && (
            <p style={{ fontSize: 14, color: 'rgba(232,234,242,0.5)', lineHeight: 1.65, marginBottom: 4 }}>{product.short_description}</p>
          )}

          {/* ── PRICE BLOCK (updates when variant selected) ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', margin: '16px 0', flexWrap: 'wrap' }}>
            <span key={displayPrice} style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800, color: '#e8eaf2', animation: 'pop 0.25s ease' }}>
              ₹{Number(displayPrice).toLocaleString('en-IN')}
            </span>
            {displayCompare && displayCompare > displayPrice && (
              <span style={{ fontSize: 17, color: 'rgba(232,234,242,0.3)', textDecoration: 'line-through' }}>
                ₹{Number(displayCompare).toLocaleString('en-IN')}
              </span>
            )}
            {discount > 0 && (
              <span style={{ fontSize: 13, fontWeight: 700, color: '#22d3a5', background: 'rgba(34,211,165,0.1)', padding: '4px 12px', borderRadius: 8, border: '1px solid rgba(34,211,165,0.22)' }}>
                {discount}% OFF
              </span>
            )}
            {selectedVariant && (
              <span style={{ fontSize: 11, color: 'rgba(232,234,242,0.35)', marginLeft: 'auto' }}>
                {selectedVariant.name}
              </span>
            )}
          </div>

          {/* EMI */}
          <p style={{ fontSize: 12, color: 'rgba(232,234,242,0.38)', marginBottom: 20 }}>
            or 3 Monthly Payments of{' '}
            <strong style={{ color: '#a78bfa' }}>₹{Math.round(displayPrice / 3).toLocaleString('en-IN')}</strong>
            {' '}with 0% EMI
          </p>

          {/* ── VARIANT OPTIONS ── */}
          {optionKeys.map(optionKey => {
            const values = parsedOptions[optionKey] || []
            const isColor = optionKey.toLowerCase().includes('color') || optionKey.toLowerCase().includes('colour')

            return (
              <div key={optionKey} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(232,234,242,0.4)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                    {optionKey}
                  </p>
                  {selectedOptions[optionKey] && (
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(232,234,242,0.65)' }}>
                      {selectedOptions[optionKey]}
                      {optionKey.toLowerCase() === 'size' && ' — ₹' + Number(
                        variants.find(v =>
                          Object.entries({ ...selectedOptions, [optionKey]: selectedOptions[optionKey] }).every(([k, val]) => v.options[k] === val)
                        )?.price ?? displayPrice
                      ).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {values.map(val => {
                    const colorHex = isColor ? (COLOR_MAP[val.toLowerCase()] ?? null) : null
                    const available = isComboAvailable(variants, selectedOptions, optionKey, val)
                    const isSelected = selectedOptions[optionKey] === val

                    // Price preview for size option
                    let pricePreview = ''
                    if (optionKey.toLowerCase() === 'size') {
                      const matchingVariant = variants.find(v =>
                        v.options[optionKey] === val &&
                        Object.entries(selectedOptions).filter(([k]) => k !== optionKey).every(([k, sv]) => v.options[k] === sv)
                      )
                      if (matchingVariant?.price && matchingVariant.price !== displayPrice) {
                        pricePreview = `₹${Number(matchingVariant.price).toLocaleString('en-IN')}`
                      }
                    }

                    return isColor && colorHex ? (
                      <div key={val} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <button
                          className={`color-swatch ${isSelected ? 'selected' : ''} ${!available ? 'unavailable' : ''}`}
                          onClick={() => available && setSelectedOptions(p => ({ ...p, [optionKey]: val }))}
                          style={{ background: colorHex }}
                          title={`${val}${!available ? ' (out of stock)' : ''}`}
                        />
                        <span style={{ fontSize: 9, color: isSelected ? '#a78bfa' : 'rgba(232,234,242,0.3)', fontWeight: 600 }}>{val}</span>
                      </div>
                    ) : (
                      <button
                        key={val}
                        className={`opt-chip ${isSelected ? 'selected' : ''} ${!available ? 'unavailable' : ''}`}
                        onClick={() => available && setSelectedOptions(p => ({ ...p, [optionKey]: val }))}
                        disabled={!available}
                        title={!available ? 'Out of stock' : undefined}
                      >
                        {val}
                        {pricePreview && <span style={{ fontSize: 10, color: isSelected ? '#a78bfa' : 'rgba(232,234,242,0.35)', marginLeft: 2 }}>{pricePreview}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* ── Stock indicator ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: stock <= 0 ? '#f87171' : stock <= 10 ? '#f59e0b' : '#22d3a5',
              boxShadow: `0 0 6px ${stock <= 0 ? '#f87171' : stock <= 10 ? '#f59e0b' : '#22d3a5'}`,
            }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: stock <= 0 ? '#f87171' : stock <= 10 ? '#f59e0b' : '#22d3a5' }}>
              {stock <= 0 ? 'Out of Stock' : stock <= 10 ? `Only ${stock} left — order soon` : 'In Stock'}
            </span>
            {optionKeys.length > 0 && !allSelected && (
              <span style={{ marginLeft: 8, fontSize: 11, color: 'rgba(232,234,242,0.3)' }}>
                (select all options above)
              </span>
            )}
          </div>

          {/* ── Quantity + CTA ── */}
          {stock > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(232,234,242,0.35)', textTransform: 'uppercase', letterSpacing: '0.09em', flexShrink: 0 }}>Qty</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#13161f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '4px 6px' }}>
                  <button className="qty-btn" onClick={() => setQuantity(p => Math.max(1, p - 1))} disabled={quantity <= 1}>−</button>
                  <span style={{ width: 32, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>{quantity}</span>
                  <button className="qty-btn" onClick={() => setQuantity(p => Math.min(stock, p + 1))} disabled={quantity >= stock}>+</button>
                </div>
                <span style={{ fontSize: 12, color: 'rgba(232,234,242,0.3)' }}>
                  Total: <strong style={{ color: '#e8eaf2' }}>₹{(displayPrice * quantity).toLocaleString('en-IN')}</strong>
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleAddToCart}
                  disabled={!allSelected}
                  className={`add-btn add-btn-primary${addedToCart ? ' success' : ''}`}
                  title={!allSelected ? 'Please select all options first' : ''}
                >
                  {addedToCart ? (
                    <>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      Add to Cart · ₹{(displayPrice * quantity).toLocaleString('en-IN')}
                    </>
                  )}
                </button>
                <button className={`wish-btn${isWishlisted ? ' active' : ''}`} onClick={() => setIsWishlisted(p => !p)} title="Wishlist">
                  <svg width="18" height="18" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {stock <= 0 && (
            <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', color: '#f87171', textAlign: 'center', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>
              Currently Out of Stock
            </div>
          )}

          {/* ── Offers ── */}
          <div style={{ background: '#13161f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px', marginBottom: 18 }}>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(232,234,242,0.7)', marginBottom: 12, letterSpacing: '0.04em' }}>🏷️ Offers & Discounts</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[
                { icon: '🎁', text: <>Get <strong style={{ color: '#22d3a5' }}>10% OFF</strong> on orders above ₹6,999. Code <strong style={{ color: '#a78bfa', fontFamily: 'monospace', fontSize: 12 }}>FIRST10</strong></> },
                { icon: '💳', text: <><strong style={{ color: '#22d3a5' }}>Extra 5% OFF</strong> on prepaid orders</> },
                { icon: '🚚', text: <>Free shipping on orders above ₹499</> },
              ].map((o, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{o.icon}</span>
                  <p style={{ fontSize: 12.5, color: 'rgba(232,234,242,0.5)', lineHeight: 1.55 }}>{o.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Trust Badges ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 18 }}>
            {[
              { icon: '🚚', label: 'Free Shipping' },
              { icon: '🔒', label: 'Secure Checkout' },
              { icon: '💬', label: 'Support 24/7' },
              { icon: '↩️', label: 'Easy Returns' },
            ].map(b => (
              <div key={b.label} className="trust-item">
                <span style={{ fontSize: 20 }}>{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>

          {/* SKU */}
          {(selectedVariant?.sku || product.sku) && (
            <p style={{ fontSize: 11, color: 'rgba(232,234,242,0.25)' }}>
              SKU: <span style={{ fontFamily: 'monospace', color: 'rgba(232,234,242,0.4)' }}>{selectedVariant?.sku || product.sku}</span>
            </p>
          )}
        </div>
      </div>

      {/* ── Description / Shipping Tabs ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 56px' }}>
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 0, marginBottom: 24 }}>
          {(['description', 'shipping', 'reviews'] as const).map(tab => (
            <button key={tab} className={`tab-btn${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'description' ? 'Description' : tab === 'shipping' ? 'Shipping & Returns' : 'Reviews'}
            </button>
          ))}
        </div>

        <div style={{ background: '#13161f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 32px', maxWidth: 800 }}>
          {activeTab === 'description' && (
            product.description
              ? <div style={{ color: 'rgba(232,234,242,0.62)', fontSize: 14.5, lineHeight: 1.95, whiteSpace: 'pre-line' }}>{product.description}</div>
              : <p style={{ color: 'rgba(232,234,242,0.25)', fontStyle: 'italic', fontSize: 14 }}>No description available.</p>
          )}

          {activeTab === 'shipping' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { title: 'Free Shipping', body: 'Available on all orders above ₹499. Delivered within 3–7 business days after confirmation.' },
                { title: 'Express Delivery', body: 'Next-day delivery available in select cities for an additional charge at checkout.' },
                { title: 'Return Policy', body: 'Returns accepted within 7 days of delivery. Item must be unused, undamaged, and in original packaging.' },
                { title: 'Prepaid Discount', body: 'Get an extra 5% off when you choose to pay online during checkout.' },
              ].map(s => (
                <div key={s.title}>
                  <p style={{ fontWeight: 700, color: '#e8eaf2', marginBottom: 5, fontSize: 14 }}>{s.title}</p>
                  <p style={{ color: 'rgba(232,234,242,0.5)', fontSize: 13.5, lineHeight: 1.7 }}>{s.body}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(232,234,242,0.3)' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>⭐</p>
              <p style={{ fontSize: 15, fontWeight: 600 }}>No reviews yet</p>
              <p style={{ fontSize: 13, marginTop: 6 }}>Be the first to review this product.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}