'use client'

import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, use } from 'react'

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
}

interface Variant {
  id: string
  name: string
  price: number | null
  compare_price: number | null
  inventory_quantity: number
  options: Record<string, string>
  is_active: boolean
}

interface Props {
  params: Promise<{ slug: string }>
}

// Parse size/color options from variants or tags
function parseOptions(variants: Variant[]) {
  const optionMap: Record<string, Set<string>> = {}
  variants.forEach(v => {
    if (v.options && typeof v.options === 'object') {
      Object.entries(v.options).forEach(([key, val]) => {
        if (!optionMap[key]) optionMap[key] = new Set()
        optionMap[key].add(val as string)
      })
    }
  })
  return Object.fromEntries(Object.entries(optionMap).map(([k, v]) => [k, Array.from(v)]))
}

const COLOR_MAP: Record<string, string> = {
  gold: '#d4a843', silver: '#c0c0c0', black: '#1a1a1a', white: '#f5f5f5',
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', brown: '#92400e',
  beige: '#d6c7a1', grey: '#6b7280', gray: '#6b7280', bronze: '#cd7f32',
}

export default function ProductDetailPage({ params }: Props) {
  const { slug } = use(params)

  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<Variant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [addedToCart, setAddedToCart] = useState(false)
  const [activeTab, setActiveTab] = useState<'description' | 'shipping'>('description')

  useEffect(() => { fetchProduct() }, [slug])

  const fetchProduct = async () => {
    const supabase = createClient()
    let { data, error } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle()
    if (!data || error) {
      const { data: all } = await supabase.from('products').select('*').ilike('slug', `%${slug}%`).limit(1)
      if (all && all.length > 0) { data = all[0]; error = null }
    }
    if (data && !error) {
      setProduct(data)
      // Fetch variants
      const { data: variantData } = await supabase.from('product_variants').select('*').eq('product_id', data.id).eq('is_active', true).order('position')
      if (variantData) setVariants(variantData)
    }
    setLoading(false)
  }

  const allImages = product ? [
    ...(product.main_image_url ? [product.main_image_url] : []),
    ...(product.images?.filter(Boolean) || [])
  ] : []

  const parsedOptions = parseOptions(variants)
  const hasVariants = Object.keys(parsedOptions).length > 0

  const selectedVariant = hasVariants ? variants.find(v =>
    Object.entries(selectedOptions).every(([k, val]) => v.options?.[k] === val)
  ) : null

  const displayPrice = selectedVariant?.price ?? product?.price ?? 0
  const displayCompare = selectedVariant?.compare_price ?? product?.compare_price ?? null
  const discount = displayCompare && displayCompare > displayPrice
    ? Math.round((1 - displayPrice / displayCompare) * 100) : 0
  const stock = selectedVariant?.inventory_quantity ?? product?.inventory_quantity ?? 0

  const handleAddToCart = () => {
    if (!product) return
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const itemId = selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id
    const idx = cart.findIndex((i: any) => i.productId === itemId)
    if (idx > -1) { cart[idx].quantity += quantity } else {
      cart.push({ id: Date.now().toString(), productId: itemId, name: product.name + (selectedVariant ? ` (${Object.values(selectedOptions).join(', ')})` : ''), price: displayPrice, quantity, image: product.main_image_url, variant: selectedVariant?.name || null })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2500)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c0e14' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#6c63ff', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: 'rgba(232,234,242,0.4)', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Loading product...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!product) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0c0e14', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>📦</p>
        <h1 style={{ color: '#e8eaf2', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Product not found</h1>
        <p style={{ color: 'rgba(232,234,242,0.45)', marginBottom: 24 }}>This product doesn't exist or has been removed.</p>
        <Link href="/products" style={{ background: '#6c63ff', color: 'white', padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Browse Products</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0c0e14', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#e8eaf2' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pop { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        
        .thumb-btn { border: 2px solid transparent; border-radius: 10px; overflow: hidden; cursor: pointer; transition: all 0.2s; background: #1a1d28; padding: 0; }
        .thumb-btn:hover { border-color: rgba(108,99,255,0.5); }
        .thumb-btn.active { border-color: #6c63ff; }
        
        .option-chip {
          padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
          border: 1.5px solid rgba(255,255,255,0.1); background: #1a1d28;
          color: rgba(232,234,242,0.6); cursor: pointer; transition: all 0.2s;
        }
        .option-chip:hover { border-color: rgba(108,99,255,0.5); color: #e8eaf2; }
        .option-chip.selected { background: rgba(108,99,255,0.15); border-color: #6c63ff; color: #a78bfa; }
        
        .color-swatch {
          width: 34px; height: 34px; border-radius: 50%;
          cursor: pointer; transition: all 0.2s;
          border: 3px solid transparent;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
          position: relative;
        }
        .color-swatch.selected { border-color: #6c63ff; box-shadow: 0 0 0 3px rgba(108,99,255,0.3); }
        
        .qty-btn {
          width: 38px; height: 38px; border-radius: 8px;
          background: #1a1d28; border: 1.5px solid rgba(255,255,255,0.1);
          color: #e8eaf2; font-size: 18px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; font-weight: 300;
        }
        .qty-btn:hover:not(:disabled) { background: #21253a; border-color: rgba(108,99,255,0.4); }
        .qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        
        .add-btn {
          flex: 1; padding: 14px 24px; border-radius: 12px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          border: none; transition: all 0.25s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .add-btn-primary { background: #6c63ff; color: white; }
        .add-btn-primary:hover { background: #7c73ff; box-shadow: 0 8px 24px rgba(108,99,255,0.35); transform: translateY(-1px); }
        .add-btn-primary.success { background: #22d3a5; animation: pop 0.3s ease; }
        .add-btn-secondary {
          padding: 14px 20px; border-radius: 12px;
          background: #1a1d28; border: 1.5px solid rgba(255,255,255,0.1);
          color: rgba(232,234,242,0.7); cursor: pointer; font-size: 13px; transition: all 0.2s;
        }
        .add-btn-secondary:hover { border-color: rgba(108,99,255,0.4); color: #e8eaf2; }
        
        .tab-btn { padding: 10px 20px; font-size: 13.5px; font-weight: 600; cursor: pointer; background: none; border: none; border-bottom: 2px solid transparent; color: rgba(232,234,242,0.4); transition: all 0.2s; }
        .tab-btn.active { color: #e8eaf2; border-bottom-color: #6c63ff; }
        
        .trust-badge { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 11px; color: rgba(232,234,242,0.4); font-weight: 500; text-align: center; }
        
        .product-detail { animation: fadeUp 0.5s ease both; }
      `}</style>

      {/* Breadcrumb */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(232,234,242,0.4)' }}>
        <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
        <span>/</span>
        <Link href="/products" style={{ color: 'inherit', textDecoration: 'none' }}>Products</Link>
        <span>/</span>
        <span style={{ color: 'rgba(232,234,242,0.7)' }}>{product.name}</span>
      </div>

      <div className="product-detail" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>

        {/* ── LEFT: Image Gallery ── */}
        <div style={{ display: 'flex', gap: 14 }}>
          {/* Thumbnails column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 72, flexShrink: 0 }}>
            {allImages.map((img, i) => (
              <button key={i} className={`thumb-btn ${selectedImage === i ? 'active' : ''}`} onClick={() => setSelectedImage(i)} style={{ width: 72, height: 72 }}>
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill style={{ objectFit: 'cover' }} />
                </div>
              </button>
            ))}
          </div>

          {/* Main image */}
          <div style={{ flex: 1 }}>
            <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', background: '#13161f', border: '1px solid rgba(255,255,255,0.07)', aspectRatio: '1' }}>
              {allImages[selectedImage] ? (
                <Image src={allImages[selectedImage]} alt={product.name} fill style={{ objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>📦</div>
              )}
              {discount > 0 && (
                <div style={{ position: 'absolute', top: 14, right: 14, background: '#ef4444', color: 'white', fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 8 }}>
                  -{discount}% OFF
                </div>
              )}
              {product.is_featured && (
                <div style={{ position: 'absolute', top: 14, left: 14, background: 'linear-gradient(135deg, #d4a843, #a07820)', color: '#0a0a0a', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  ★ Featured
                </div>
              )}
              {/* Nav arrows */}
              {allImages.length > 1 && (
                <>
                  <button onClick={() => setSelectedImage(p => Math.max(0, p - 1))} disabled={selectedImage === 0} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(12,14,20,0.7)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8eaf2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: selectedImage === 0 ? 0.3 : 1 }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => setSelectedImage(p => Math.min(allImages.length - 1, p + 1))} disabled={selectedImage === allImages.length - 1} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(12,14,20,0.7)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8eaf2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: selectedImage === allImages.length - 1 ? 0.3 : 1 }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </>
              )}
            </div>
            {/* Dot indicators */}
            {allImages.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
                {allImages.map((_, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)} style={{ width: i === selectedImage ? 20 : 7, height: 7, borderRadius: 4, background: i === selectedImage ? '#6c63ff' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', transition: 'all 0.25s', padding: 0 }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Product Info ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Name + rating area */}
          <div style={{ marginBottom: 8 }}>
            {product.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                {product.tags.slice(0, 3).map(tag => (
                  <span key={tag} style={{ background: 'rgba(108,99,255,0.1)', color: '#a78bfa', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 50, border: '1px solid rgba(108,99,255,0.25)', letterSpacing: '0.04em' }}>{tag}</span>
                ))}
              </div>
            )}
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: '#e8eaf2', lineHeight: 1.25, letterSpacing: '-0.02em' }}>{product.name}</h1>
            {product.short_description && (
              <p style={{ color: 'rgba(232,234,242,0.55)', fontSize: 14, marginTop: 10, lineHeight: 1.6 }}>{product.short_description}</p>
            )}
          </div>

          {/* Pricing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 0', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', margin: '16px 0' }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: '#e8eaf2' }}>
              ₹{Number(displayPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            {displayCompare && (
              <span style={{ fontSize: 18, color: 'rgba(232,234,242,0.35)', textDecoration: 'line-through' }}>
                ₹{Number(displayCompare).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            )}
            {discount > 0 && (
              <span style={{ background: 'rgba(34,211,165,0.12)', color: '#22d3a5', fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 8, border: '1px solid rgba(34,211,165,0.25)' }}>
                {discount}% OFF
              </span>
            )}
          </div>

          {/* EMI line */}
          <p style={{ fontSize: 12, color: 'rgba(232,234,242,0.4)', marginBottom: 20 }}>
            or 3 Monthly Payments of <strong style={{ color: '#a78bfa' }}>₹{(displayPrice / 3).toFixed(0)}</strong> with 0% EMI
          </p>

          {/* Options (variants) */}
          {Object.entries(parsedOptions).map(([optionName, values]) => {
            const isColor = optionName.toLowerCase().includes('color') || optionName.toLowerCase().includes('colour')
            return (
              <div key={optionName} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(232,234,242,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{optionName}</p>
                  {selectedOptions[optionName] && (
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(232,234,242,0.7)' }}>{selectedOptions[optionName]} · {values.length} {isColor ? 'colors' : 'options'}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {values.map(val => {
                    const colorHex = isColor ? (COLOR_MAP[val.toLowerCase()] || null) : null
                    return isColor && colorHex ? (
                      <button key={val} className={`color-swatch ${selectedOptions[optionName] === val ? 'selected' : ''}`} onClick={() => setSelectedOptions(p => ({ ...p, [optionName]: val }))} style={{ background: colorHex }} title={val} />
                    ) : (
                      <button key={val} className={`option-chip ${selectedOptions[optionName] === val ? 'selected' : ''}`} onClick={() => setSelectedOptions(p => ({ ...p, [optionName]: val }))}>
                        {val}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Stock Status */}
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: stock <= 0 ? '#f87171' : stock <= 10 ? '#f59e0b' : '#22d3a5', boxShadow: `0 0 6px ${stock <= 0 ? '#f87171' : stock <= 10 ? '#f59e0b' : '#22d3a5'}` }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: stock <= 0 ? '#f87171' : stock <= 10 ? '#f59e0b' : '#22d3a5' }}>
              {stock <= 0 ? 'Out of Stock' : stock <= 10 ? `Only ${stock} left in stock — order soon` : 'In Stock'}
            </span>
          </div>

          {/* Quantity */}
          {stock > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(232,234,242,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>Qty</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#13161f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '4px 6px' }}>
                <button className="qty-btn" onClick={() => setQuantity(p => Math.max(1, p - 1))} disabled={quantity <= 1}>−</button>
                <span style={{ width: 32, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>{quantity}</span>
                <button className="qty-btn" onClick={() => setQuantity(p => Math.min(stock, p + 1))} disabled={quantity >= stock}>+</button>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            {stock > 0 ? (
              <>
                <button onClick={handleAddToCart} className={`add-btn add-btn-primary ${addedToCart ? 'success' : ''}`}>
                  {addedToCart ? (
                    <><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> Added!</>
                  ) : (
                    <><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg> Add to Cart · ₹{(displayPrice * quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</>
                  )}
                </button>
                <button className="add-btn-secondary" title="Add to Wishlist">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>
              </>
            ) : (
              <div style={{ flex: 1, padding: '14px', borderRadius: 12, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', textAlign: 'center', fontSize: 14, fontWeight: 600 }}>
                Out of Stock
              </div>
            )}
          </div>

          {/* Offers section */}
          <div style={{ background: '#13161f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(232,234,242,0.8)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>🏷️</span> Offers
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14 }}>🎁</span>
                <p style={{ fontSize: 12.5, color: 'rgba(232,234,242,0.55)', lineHeight: 1.5 }}>
                  Get <strong style={{ color: '#22d3a5' }}>10% OFF</strong> on purchase ₹6999. Code <strong style={{ color: '#a78bfa', fontFamily: 'monospace' }}>FIRST10</strong>
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14 }}>💳</span>
                <p style={{ fontSize: 12.5, color: 'rgba(232,234,242,0.55)', lineHeight: 1.5 }}>
                  <strong style={{ color: '#22d3a5' }}>Extra 5% OFF</strong> on all prepaid orders
                </p>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { icon: '🚚', label: 'Free Shipping' },
              { icon: '🔒', label: 'Secure Checkout' },
              { icon: '💬', label: 'Customer Support' },
              { icon: '↩️', label: 'Friendly Return Policy' },
            ].map(b => (
              <div key={b.label} className="trust-badge" style={{ background: '#13161f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 8px' }}>
                <span style={{ fontSize: 22 }}>{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>

          {/* SKU */}
          {product.sku && (
            <p style={{ fontSize: 11.5, color: 'rgba(232,234,242,0.3)', marginBottom: 8 }}>
              SKU: <span style={{ fontFamily: 'monospace', color: 'rgba(232,234,242,0.45)' }}>{product.sku}</span>
            </p>
          )}
        </div>
      </div>

      {/* Description / Shipping Tabs */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 4, marginBottom: 24 }}>
          <button className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`} onClick={() => setActiveTab('description')}>Description</button>
          <button className={`tab-btn ${activeTab === 'shipping' ? 'active' : ''}`} onClick={() => setActiveTab('shipping')}>Shipping & Return</button>
        </div>
        <div style={{ background: '#13161f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 32px', maxWidth: 760 }}>
          {activeTab === 'description' ? (
            product.description ? (
              <div style={{ color: 'rgba(232,234,242,0.65)', fontSize: 14.5, lineHeight: 1.9, whiteSpace: 'pre-line' }}>{product.description}</div>
            ) : (
              <p style={{ color: 'rgba(232,234,242,0.3)', fontStyle: 'italic', fontSize: 14 }}>No description available for this product.</p>
            )
          ) : (
            <div style={{ color: 'rgba(232,234,242,0.65)', fontSize: 14.5, lineHeight: 1.9 }}>
              <p><strong style={{ color: '#e8eaf2' }}>Free Shipping</strong> — Available on all orders above ₹499.</p>
              <br />
              <p><strong style={{ color: '#e8eaf2' }}>Delivery Time</strong> — 3–7 business days after order confirmation.</p>
              <br />
              <p><strong style={{ color: '#e8eaf2' }}>Return Policy</strong> — Returns accepted within 7 days of delivery. Item must be unused and in original packaging.</p>
              <br />
              <p><strong style={{ color: '#e8eaf2' }}>Prepaid Orders</strong> — Get an extra 5% discount when you pay online.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}