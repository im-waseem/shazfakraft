'use client'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, use, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

/* ─── Types ──────────────────────────────────────────────────────────────────*/
interface Product {
  id: string; name: string; slug: string; description: string
  short_description: string; sku: string; price: number
  compare_price: number | null; category_id: string | null
  main_image_url: string; images: string[]; inventory_quantity: number
  track_inventory: boolean; is_active: boolean; is_featured: boolean
  tags: string[]; option_keys: string[]
  categories?: { name: string; slug: string }
}
interface Variant {
  id: string; name: string | null; sku: string | null
  price: number; compare_price: number | null
  inventory_quantity: number
  options: { size_inches?: string; color?: string }
  is_active: boolean; image_url?: string | null; color_hex?: string | null
}

/* ─── Color map fallback ────────────────────────────────────────────────────*/
const COLOR_HEX: Record<string, string> = {
  gold: '#d4a843', silver: '#c0c0c0', black: '#1a1a1a',
  white: '#f5f5f0', 'rose gold': '#b76e79', bronze: '#cd7f32',
}

/* ─── Helpers ────────────────────────────────────────────────────────────────*/
/** Get the one variant matching both size AND color */
function getVariant(variants: Variant[], size: string, color: string): Variant | null {
  return variants.find(v =>
    v.is_active &&
    (!size  || v.options.size_inches === size) &&
    (!color || v.options.color?.toLowerCase() === color.toLowerCase())
  ) ?? null
}

/** ★ Price for a size = price of the first active variant with that size (size drives price) */
function priceForSize(variants: Variant[], size: string): number | null {
  const v = variants.find(vv => vv.is_active && vv.options.size_inches === size)
  return v?.price ?? null
}

/** Stock for a size+color combo, or just size if no color given */
function stockForSize(variants: Variant[], size: string): number {
  return variants
    .filter(v => v.is_active && v.options.size_inches === size)
    .reduce((a, v) => a + v.inventory_quantity, 0)
}

/** All distinct colors available (optionally scoped to a size) */
function colorsForSize(variants: Variant[], size: string): string[] {
  return Array.from(new Set(
    variants
      .filter(v => v.is_active && (!size || v.options.size_inches === size))
      .map(v => v.options.color).filter(Boolean)
  )) as string[]
}

/** All distinct sizes */
function allSizes(variants: Variant[]): string[] {
  return Array.from(new Set(
    variants.filter(v => v.is_active).map(v => v.options.size_inches).filter(Boolean)
  )) as string[]
}

/* ─── Component ──────────────────────────────────────────────────────────────*/
export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router   = useRouter()

  const [product,       setProduct]       = useState<Product | null>(null)
  const [variants,      setVariants]      = useState<Variant[]>([])
  const [loading,       setLoading]       = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity,      setQuantity]      = useState(1)
  const [selectedSize,  setSelectedSize]  = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [addedToCart,   setAddedToCart]   = useState(false)
  const [isWishlisted,  setIsWishlisted]  = useState(false)
  const [activeTab,     setActiveTab]     = useState<'description'|'shipping'|'reviews'>('description')
  const [moreProducts,  setMoreProducts]  = useState<Product[]>([])
  const [priceFlash,    setPriceFlash]    = useState(false)
  const [colorDropOpen, setColorDropOpen] = useState(false)

  const colorDropRef = useRef<HTMLDivElement>(null)
  const galleryRef   = useRef<HTMLDivElement>(null)
  const touchStartX  = useRef<number>(0)
  const touchStartY  = useRef<number>(0)
  const isDragging   = useRef<boolean>(false)

  /* ── Fetch ───────────────────────────────────────────────────────────────*/
  const fetchProduct = useCallback(async () => {
    const supabase = createClient()
    let { data } = await supabase
      .from('products').select('*, categories(name, slug)')
      .eq('slug', slug).maybeSingle()
    if (!data) {
      const { data: all } = await supabase
        .from('products').select('*, categories(name, slug)')
        .ilike('slug', `%${slug}%`).limit(1)
      if (all?.length) data = all[0]
    }
    if (data) {
      setProduct(data)
      const { data: vData } = await supabase
        .from('product_variants').select('*')
        .eq('product_id', data.id).eq('is_active', true).order('position')
      const vList: Variant[] = vData || []
      setVariants(vList)
      // Default: pick first size, then first color for that size
      if (vList.length > 0) {
        const sizes     = allSizes(vList)
        const firstSize = sizes[0] ?? ''
        const firstColor = colorsForSize(vList, firstSize)[0] ?? ''
        setSelectedSize(firstSize)
        setSelectedColor(firstColor)
      }
      const relQ = supabase
        .from('products')
        .select('id,name,slug,price,compare_price,main_image_url,inventory_quantity')
        .eq('is_active', true).neq('id', data.id)
        .order('created_at', { ascending: false }).limit(8)
      const { data: rel } = data.category_id
        ? await relQ.eq('category_id', data.category_id) : await relQ
      setMoreProducts((rel as Product[]) || [])
    }
    setLoading(false)
  }, [slug])

  useEffect(() => { fetchProduct() }, [fetchProduct])

  /* Close color dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorDropRef.current && !colorDropRef.current.contains(e.target as Node))
        setColorDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const flashPrice = () => { setPriceFlash(true); setTimeout(() => setPriceFlash(false), 400) }

  /* ── Derived state ───────────────────────────────────────────────────────*/
  const sizesAvailable  = allSizes(variants)
  const colorsAvailable = colorsForSize(variants, selectedSize)

  // Exact variant matching size + color
  const selectedVariant = getVariant(variants, selectedSize, selectedColor)

  // ★ PRICE is SIZE-driven
  const sizePrice      = selectedSize ? priceForSize(variants, selectedSize) : null
  const displayPrice   = sizePrice ?? product?.price ?? 0
  const displayCompare = (() => {
    if (!selectedSize) return product?.compare_price ?? null
    const v = variants.find(vv => vv.is_active && vv.options.size_inches === selectedSize)
    return v?.compare_price ?? product?.compare_price ?? null
  })()
  const discount = displayCompare && displayCompare > displayPrice
    ? Math.round((1 - displayPrice / displayCompare) * 100) : 0

  // ★ COLOR drives the GALLERY IMAGE — look up the variant's image_url
  const colorVariant = variants.find(v =>
    v.is_active &&
    v.options.color?.toLowerCase() === selectedColor.toLowerCase() &&
    (!selectedSize || v.options.size_inches === selectedSize)
  )
  const colorDrivenImage = colorVariant?.image_url ?? null

  // Gallery: product images (static set)
  const allImages = product ? [
    ...(product.main_image_url ? [product.main_image_url] : []),
    ...(product.images?.filter(Boolean) || []),
  ] : []

  // Main displayed image: color-specific if available, else gallery index
  const mainDisplayImage = colorDrivenImage || allImages[selectedImage] || null

  // ★ STOCK: exact variant when both selected, else sum for size
  const stock = (() => {
    if (selectedVariant) return selectedVariant.inventory_quantity
    if (selectedSize)    return stockForSize(variants, selectedSize)
    if (variants.length) return variants.reduce((a, v) => a + v.inventory_quantity, 0)
    return product?.inventory_quantity ?? 0
  })()

  const stockLabel = (() => {
    if (!selectedSize && variants.length > 0)
      return { text: 'Select a size to check availability', cls: 'in-stock' }
    if (selectedSize && !selectedColor && colorsAvailable.length > 0)
      return { text: 'Select a color to confirm stock', cls: 'in-stock' }
    if (stock <= 0)  return { text: 'Currently Unavailable', cls: 'oos' }
    if (stock <= 10) return { text: `Only ${stock} left — order soon!`, cls: 'low-stock' }
    return { text: `In Stock · ${stock} units available`, cls: 'in-stock' }
  })()

  const isSizeAvailable = (size: string) =>
    variants.some(v => v.is_active && v.options.size_inches === size && v.inventory_quantity > 0)

  const isColorAvailable = (color: string) =>
    variants.some(v =>
      v.is_active &&
      v.options.color?.toLowerCase() === color.toLowerCase() &&
      (!selectedSize || v.options.size_inches === selectedSize) &&
      v.inventory_quantity > 0
    )

  /* ── Handlers ────────────────────────────────────────────────────────────*/
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size)
    const newColors  = colorsForSize(variants, size)
    const keepColor  = newColors.find(c => c.toLowerCase() === selectedColor.toLowerCase())
    const nextColor  = keepColor ?? newColors[0] ?? ''
    setSelectedColor(nextColor)
    // If the new color has an image, reflect it; else reset to main gallery
    const cv = variants.find(v =>
      v.is_active && v.options.size_inches === size &&
      v.options.color?.toLowerCase() === nextColor.toLowerCase()
    )
    if (cv?.image_url) {
      const idx = allImages.findIndex(img => img === cv.image_url)
      if (idx > -1) setSelectedImage(idx)
    }
    flashPrice()
  }

  /** ★ Color selection: update image immediately, no price change */
  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    setColorDropOpen(false)
    // Find the variant's image for this color (scoped to current size)
    const cv = variants.find(v =>
      v.is_active &&
      v.options.color?.toLowerCase() === color.toLowerCase() &&
      (!selectedSize || v.options.size_inches === selectedSize)
    )
    if (cv?.image_url) {
      const idx = allImages.findIndex(img => img === cv.image_url)
      if (idx > -1) setSelectedImage(idx)
      // If not in gallery, the colorDrivenImage derived value will show it automatically
    }
  }

  /* ── Gallery navigation ──────────────────────────────────────────────────*/
  const goToImage = (index: number) => {
    if (!allImages.length) return
    setSelectedImage(Math.max(0, Math.min(allImages.length - 1, index)))
  }
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isDragging.current  = false
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
    if (dx > dy && dx > 10) { isDragging.current = true; e.preventDefault() }
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) goToImage(dx < 0 ? selectedImage + 1 : selectedImage - 1)
    isDragging.current = false
  }

  /* ── Cart ────────────────────────────────────────────────────────────────*/
  const handleAddToCart = () => {
    if (!product) return
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const cartKey = [product.id, selectedSize, selectedColor.toLowerCase()].filter(Boolean).join('::')
    const variantLabel = [
      selectedSize ? `${selectedSize}"` : '',
      selectedColor,
    ].filter(Boolean).join(' · ')
    const idx = cart.findIndex((i: any) => i.cartKey === cartKey)
    if (idx > -1) {
      cart[idx].quantity += quantity
    } else {
      cart.push({
        id: Date.now().toString(),
        cartKey,
        productId: product.id,
        variantId: selectedVariant?.id ?? null,
        name: product.name,
        variantLabel,
        size: selectedSize,
        color: selectedColor,
        price: displayPrice,           // price is SIZE-based
        quantity,
        image: colorDrivenImage || product.main_image_url,  // color-specific image
        sku: selectedVariant?.sku || product.sku,
      })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2800)
  }

  /* ── Color swatch hex ────────────────────────────────────────────────────*/
  const swatchHex = (color: string) => {
    const v = variants.find(vv =>
      vv.is_active && vv.options.color?.toLowerCase() === color.toLowerCase()
    )
    return (v as any)?.color_hex || COLOR_HEX[color.toLowerCase()] || '#ccc'
  }

  const selectedColorHex = swatchHex(selectedColor)
  const colorsCount      = colorsAvailable.length

  /* ─── Loading / Not Found ────────────────────────────────────────────────*/
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f9f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '3px solid #ede9e0', borderTopColor: '#b8860b', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto 14px' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: '#aaa', fontSize: 13, fontFamily: 'sans-serif', letterSpacing: '.04em' }}>Loading product...</p>
      </div>
    </div>
  )

  if (!product) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, fontFamily: 'sans-serif' }}>
      <p style={{ fontSize: 52 }}>📦</p>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>Product not found</h1>
      <Link href="/" style={{ background: '#b8860b', color: '#fff', padding: '10px 26px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>← Back to Home</Link>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#1a1a1a' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes popIn    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes checkIn  { 0%{transform:scale(0) rotate(-10deg)} 60%{transform:scale(1.15)} 100%{transform:scale(1)} }
        @keyframes priceFlash { 0%{opacity:0.3;transform:scale(0.96)} 100%{opacity:1;transform:scale(1)} }
        @keyframes dropDown { from{opacity:0;transform:translateY(-6px) scaleY(0.95)} to{opacity:1;transform:translateY(0) scaleY(1)} }
        @keyframes slideImg { from{opacity:0;transform:scale(1.03)} to{opacity:1;transform:scale(1)} }
        .price-flash { animation: priceFlash 0.35s ease both; }
        .page-enter  { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        /* NAV */
        .sk-nav {
          background: #fff; height: 58px; padding: 0 20px;
          display: flex; align-items: center; gap: 14px;
          position: sticky; top: 0; z-index: 100;
          border-bottom: 1px solid #ede9e0;
          box-shadow: 0 1px 8px rgba(0,0,0,.06);
        }
        .sk-back { width: 36px; height: 36px; border-radius: 10px; border: 1.5px solid #e5e0d8; background: #faf8f4; color: #555; display:flex; align-items:center; justify-content:center; text-decoration:none; transition: all .2s; flex-shrink:0; }
        .sk-back:hover { background:#fdf5e0; border-color:#d4a843; color:#8b6914; transform:translateX(-1px); }
        .sk-logo { font-size:18px; font-weight:800; color:#1a1a1a; text-decoration:none; letter-spacing:-.02em; font-family:'Syne',sans-serif; }
        .sk-logo small { display:block; font-size:8px; font-weight:500; letter-spacing:.16em; color:#aaa; text-transform:uppercase; font-family:'Plus Jakarta Sans',sans-serif; }
        .sk-cart-btn { margin-left:auto; background:#1a1a1a; color:#fff; border:none; border-radius:10px; padding:9px 18px; font-size:13px; font-weight:700; cursor:pointer; text-decoration:none; display:flex; align-items:center; gap:7px; transition: all .2s; font-family:inherit; }
        .sk-cart-btn:hover { background:#b8860b; transform:translateY(-1px); box-shadow: 0 4px 14px rgba(184,134,11,.3); }
        /* BREADCRUMB */
        .sk-crumb { background:#fff; border-bottom:1px solid #ede9e0; padding:10px 20px; font-size:12px; color:#999; display:flex; align-items:center; gap:5px; overflow-x:auto; white-space:nowrap; }
        .sk-crumb a { color:#8b6914; text-decoration:none; font-weight:500; }
        .sk-crumb a:hover { text-decoration:underline; }
        /* LAYOUT */
        .sk-main { max-width: 1120px; margin: 20px auto; display: grid; grid-template-columns: 1fr; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); border: 1px solid #ede9e0; }
        @media(min-width: 768px) { .sk-main { grid-template-columns: 500px 1fr; margin: 24px auto; } }
        @media(min-width: 1024px) { .sk-main { grid-template-columns: 520px 1fr; } }
        /* GALLERY */
        .sk-gallery { background: #f9f7f4; position: relative; }
        .gallery-touch-wrap { position: relative; touch-action: pan-y; user-select: none; -webkit-user-select: none; }
        .sk-img-main { position: relative; aspect-ratio: 1; background: #f2efe9; overflow: hidden; }
        @media(min-width: 768px) { .sk-img-main { cursor: zoom-in; } }
        .sk-img-main img { transition: transform 0.4s cubic-bezier(.25,.46,.45,.94); }
        .sk-img-main:hover img { transform: scale(1.04); }
        .slide-anim { animation: slideImg 0.3s ease both; }
        .gal-arrow { display: none; position: absolute; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; border-radius: 50%; border: none; background: rgba(255,255,255,.92); cursor: pointer; z-index: 3; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,.14); transition: all .18s; backdrop-filter: blur(4px); }
        @media(min-width: 768px) { .gal-arrow { display: flex; } .gal-arrow:hover { background: #fff; box-shadow: 0 4px 16px rgba(0,0,0,.2); transform: translateY(-50%) scale(1.08); } .gal-arrow:disabled { opacity: .25; cursor: not-allowed; transform: translateY(-50%); box-shadow: none; } }
        .gal-arrow.left { left: 12px; } .gal-arrow.right { right: 12px; }
        .swipe-hint { display: flex; position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); align-items: center; gap: 4px; z-index: 4; background: rgba(0,0,0,.45); color: #fff; font-size: 10px; font-weight: 700; letter-spacing: .06em; padding: 4px 10px; border-radius: 50px; pointer-events: none; backdrop-filter: blur(4px); }
        @media(min-width: 768px) { .swipe-hint { display: none; } }
        .gal-dots { position: absolute; bottom: 12px; left: 0; right: 0; display: flex; justify-content: center; gap: 5px; z-index: 3; }
        .gal-dot { width: 7px; height: 7px; border-radius: 4px; border: none; cursor: pointer; padding: 0; background: rgba(255,255,255,.5); transition: all .22s; }
        .gal-dot.active { width: 22px; background: #b8860b; }
        .sk-thumbs { display: flex; gap: 7px; padding: 12px 14px; background: #faf8f4; border-top: 1px solid #ede9e0; overflow-x: auto; scroll-behavior: smooth; }
        .sk-thumb { flex-shrink: 0; width: 62px; height: 62px; border-radius: 10px; overflow: hidden; border: 2.5px solid transparent; cursor: pointer; transition: all .2s; background: #ede9e0; }
        .sk-thumb.active { border-color: #b8860b; box-shadow: 0 0 0 2px rgba(184,134,11,.2); }
        .sk-thumb:hover:not(.active) { border-color: #c8a060; transform: translateY(-1px); }
        /* Color-driven image badge */
        .color-img-badge { position: absolute; bottom: 44px; right: 12px; z-index: 4; background: rgba(0,0,0,.6); color: #fff; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 50px; backdrop-filter: blur(4px); display: flex; align-items: center; gap: 5px; }
        .sk-disc-ribbon { position: absolute; top: 14px; left: 0; z-index: 4; background: #1a1a1a; color: #fff; font-size: 11px; font-weight: 800; padding: 5px 15px 5px 10px; letter-spacing: .04em; clip-path: polygon(0 0,100% 0,calc(100% - 8px) 50%,100% 100%,0 100%); }
        .sk-feat-pill { position: absolute; top: 14px; right: 12px; z-index: 4; background: linear-gradient(135deg,#d4a020,#b8860b); color: #fff; font-size: 9.5px; font-weight: 800; padding: 4px 10px; border-radius: 50px; letter-spacing: .07em; text-transform: uppercase; }
        /* INFO */
        .sk-info { padding: 20px 16px; overflow-y: auto; }
        @media(min-width: 768px) { .sk-info { padding: 26px 24px; } }
        .sk-category-tag { font-size: 10px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; color: #b8860b; margin-bottom: 8px; display: block; }
        .sk-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; line-height: 1.35; color: #1a1a1a; margin-bottom: 8px; }
        @media(min-width: 768px) { .sk-title { font-size: 24px; } }
        .sk-short-desc { font-size: 13.5px; color: #777; line-height: 1.7; margin-bottom: 16px; }
        .sk-rating { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid #ede9e0; }
        .sk-stars { color: #c8860a; font-size: 14px; letter-spacing: 2px; }
        /* Price — size-driven */
        .sk-price-box { background: linear-gradient(135deg, #fdf9f0 0%, #faf5e6 100%); border: 1px solid #e8d898; border-radius: 14px; padding: 14px 16px; margin-bottom: 18px; }
        .sk-price-label { font-size: 10px; color: #bbb; text-transform: uppercase; letter-spacing: .07em; margin-bottom: 5px; display: flex; align-items: center; gap: 6px; }
        .sk-price-size-note { font-size: 10px; background: #f0e8cc; color: #8b6914; padding: 2px 8px; border-radius: 50px; font-weight: 700; }
        .sk-price-main { font-size: 32px; font-weight: 900; color: #1a1a1a; line-height: 1; font-variant-numeric: tabular-nums; font-family: 'Syne', sans-serif; }
        .sk-price-main sup { font-size: 16px; vertical-align: super; }
        .sk-price-was { font-size: 13px; color: #bbb; text-decoration: line-through; margin-top: 5px; }
        .sk-save-badge { display: inline-flex; align-items: center; gap: 4px; background: #e8f5e9; color: #2e7d32; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 50px; margin-top: 8px; border: 1px solid #c8e6c9; }
        /* SIZE selector */
        .sk-section-title { font-size: 13px; font-weight: 800; color: #1a1a1a; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .sk-section-title .selected-val { color: #b8860b; font-weight: 700; }
        .sk-section-note { font-size: 11px; color: #aaa; font-weight: 500; }
        .sk-size-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 18px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
        .sk-size-scroll::-webkit-scrollbar { height: 3px; }
        .sk-size-scroll::-webkit-scrollbar-thumb { background: #e0d9cc; border-radius: 2px; }
        @media(min-width: 768px) { .sk-size-scroll { flex-wrap: wrap; overflow-x: visible; padding-bottom: 0; } }
        .sk-size-box { position: relative; flex-shrink: 0; scroll-snap-align: start; min-width: 76px; padding: 10px 14px; border: 2px solid #e5e0d8; border-radius: 12px; background: #fff; cursor: pointer; transition: all .2s cubic-bezier(.34,1.56,.64,1); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 3px; font-family: inherit; outline: none; }
        .sk-size-box:hover:not(:disabled):not(.selected) { border-color: #c8a060; background: #fdf9f0; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(184,134,11,.14); }
        .sk-size-box.selected { border-color: #b8860b; background: linear-gradient(135deg, #fdf9f0, #faf3dd); box-shadow: 0 0 0 3px rgba(184,134,11,.18), 0 4px 12px rgba(184,134,11,.14); transform: translateY(-1px); }
        .sk-size-box:disabled { opacity: .35; cursor: not-allowed; transform: none; box-shadow: none; }
        .sk-size-box .size-label { font-size: 13.5px; font-weight: 800; color: #1a1a1a; white-space: nowrap; }
        .sk-size-box.selected .size-label { color: #b8860b; }
        .sk-size-box .size-price { font-size: 11.5px; color: #888; font-weight: 700; white-space: nowrap; }
        .sk-size-box.selected .size-price { color: #8b6914; }
        .sk-size-box .size-oos { font-size: 9px; color: #ddd; font-weight: 600; }
        .sk-size-box .size-check { position: absolute; top: -6px; right: -6px; width: 16px; height: 16px; border-radius: 50%; background: #b8860b; color: #fff; font-size: 9px; font-weight: 900; display: flex; align-items: center; justify-content: center; animation: checkIn .25s ease; box-shadow: 0 2px 6px rgba(184,134,11,.4); }
        /* COLOR DROPDOWN */
        .sk-color-dropdown-wrap { position: relative; margin-bottom: 8px; }
        .sk-color-trigger { width: 100%; padding: 11px 14px; border: 2px solid #e5e0d8; border-radius: 12px; background: #fff; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: all .2s; font-family: inherit; outline: none; }
        .sk-color-trigger:hover, .sk-color-trigger.open { border-color: #b8860b; box-shadow: 0 0 0 3px rgba(184,134,11,.12); }
        .sk-color-trigger .color-swatch { width: 26px; height: 26px; border-radius: 8px; border: 2px solid rgba(0,0,0,.1); flex-shrink: 0; transition: transform .2s; }
        .sk-color-trigger:hover .color-swatch { transform: scale(1.1); }
        .sk-color-trigger .color-name { font-size: 14px; font-weight: 700; color: #1a1a1a; flex: 1; text-align: left; }
        .sk-color-trigger .color-count { font-size: 12px; color: #aaa; font-weight: 500; }
        .sk-color-trigger .chevron { width: 18px; height: 18px; color: #aaa; transition: transform .25s; flex-shrink: 0; }
        .sk-color-trigger.open .chevron { transform: rotate(180deg); }
        /* COLOR PANEL */
        .sk-color-panel { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: #fff; border: 1.5px solid #e5e0d8; border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,.14); z-index: 50; overflow: hidden; animation: dropDown .22s cubic-bezier(0.16,1,0.3,1) both; transform-origin: top; max-height: 320px; overflow-y: auto; }
        .sk-color-option { width: 100%; padding: 10px 14px; border: none; background: none; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: background .15s; font-family: inherit; text-align: left; }
        .sk-color-option:hover { background: #fdf9f0; }
        .sk-color-option.selected { background: linear-gradient(135deg, #fdf9f0, #faf3dd); }
        .sk-color-option:disabled { opacity: .4; cursor: not-allowed; }
        .sk-color-option + .sk-color-option { border-top: 1px solid #f0ede8; }
        /* ★ Color option image preview */
        .sk-color-opt-img { width: 44px; height: 44px; border-radius: 9px; object-fit: cover; border: 1.5px solid #e5e0d8; flex-shrink: 0; background: #f2efe9; }
        .sk-color-opt-img-placeholder { width: 44px; height: 44px; border-radius: 9px; border: 1.5px solid #e5e0d8; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 18px; background: #f9f7f4; }
        .sk-color-opt-swatch { width: 16px; height: 16px; border-radius: 5px; border: 1.5px solid rgba(0,0,0,.12); flex-shrink: 0; }
        .sk-color-opt-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .sk-color-opt-name { font-size: 13.5px; font-weight: 600; color: #1a1a1a; }
        .sk-color-option.selected .sk-color-opt-name { color: #b8860b; font-weight: 700; }
        .sk-color-opt-tag { font-size: 10px; color: #aaa; font-weight: 500; }
        .opt-check { width: 20px; height: 20px; border-radius: 50%; background: #b8860b; color: #fff; font-size: 10px; font-weight: 900; display: flex; align-items: center; justify-content: center; animation: checkIn .2s ease; flex-shrink: 0; }
        /* Quick swatch row */
        .sk-color-note { font-size: 10px; color: #aaa; margin-bottom: 10px; display: flex; align-items: center; gap: 4px; }
        .sk-swatch-row { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 18px; }
        .sk-mini-swatch { width: 30px; height: 30px; border-radius: 8px; border: 2.5px solid transparent; cursor: pointer; transition: all .2s cubic-bezier(.34,1.56,.64,1); position: relative; }
        .sk-mini-swatch:hover { transform: scale(1.15); box-shadow: 0 3px 10px rgba(0,0,0,.2); }
        .sk-mini-swatch.selected { border-color: #b8860b; box-shadow: 0 0 0 3px rgba(184,134,11,.25); transform: scale(1.1); }
        .sk-mini-swatch:disabled { opacity: .3; cursor: not-allowed; transform: none !important; }
        .sk-mini-swatch .mini-check { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 900; text-shadow: 0 1px 3px rgba(0,0,0,.5); animation: checkIn .2s ease; }
        /* Stock */
        .sk-stock { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; margin-bottom: 16px; padding: 10px 14px; border-radius: 10px; }
        .sk-stock.in-stock  { background: #f0fdf4; color: #15803d; }
        .sk-stock.low-stock { background: #fff7ed; color: #c2410c; }
        .sk-stock.oos       { background: #fff5f5; color: #dc2626; }
        .sk-stock-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        /* Selection summary */
        .sk-summary-bar { background: linear-gradient(135deg, #fdf9f0, #faf3dd); border: 1.5px solid #e8d898; border-radius: 11px; padding: 10px 14px; margin-bottom: 16px; font-size: 13px; font-weight: 700; color: #8b6914; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .sk-summary-price { margin-left: auto; font-size: 15px; font-family: 'Syne',sans-serif; color: #1a1a1a; }
        /* Qty */
        .sk-qty-row { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
        .sk-qty-label { font-size: 13px; font-weight: 700; color: #555; }
        .sk-qty-box { display: flex; align-items: center; border: 2px solid #e5e0d8; border-radius: 12px; overflow: hidden; transition: border-color .2s; }
        .sk-qty-box:focus-within { border-color: #b8860b; box-shadow: 0 0 0 3px rgba(184,134,11,.12); }
        .sk-qty-btn { width: 42px; height: 42px; background: #faf8f4; border: none; font-size: 20px; cursor: pointer; color: #444; display: flex; align-items: center; justify-content: center; transition: all .15s; font-family: inherit; font-weight: 700; }
        .sk-qty-btn:hover:not(:disabled) { background: #ede9e0; color: #b8860b; }
        .sk-qty-btn:active:not(:disabled) { transform: scale(0.9); }
        .sk-qty-btn:disabled { opacity: .3; cursor: not-allowed; }
        .sk-qty-num { width: 50px; text-align: center; font-size: 16px; font-weight: 800; border-left: 2px solid #e5e0d8; border-right: 2px solid #e5e0d8; height: 42px; line-height: 42px; color: #1a1a1a; font-family: 'Syne', sans-serif; }
        .sk-qty-total { font-size: 13px; color: #555; }
        .sk-qty-total strong { color: #1a1a1a; font-weight: 800; }
        /* CTA */
        .sk-cta-stack { display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px; }
        .sk-btn-cart { width: 100%; padding: 15px; background: #1a1a1a; border: 2.5px solid #1a1a1a; border-radius: 13px; font-size: 15px; font-weight: 800; color: #fff; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 9px; transition: all .22s; position: relative; overflow: hidden; }
        .sk-btn-cart::after { content:''; position:absolute; inset:0; background: linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent); transform: translateX(-100%); transition: transform .5s; }
        .sk-btn-cart:hover:not(:disabled)::after { transform: translateX(100%); }
        .sk-btn-cart:hover:not(:disabled) { background: #333; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,.2); }
        .sk-btn-cart:disabled { opacity: .4; cursor: not-allowed; }
        .sk-btn-cart.success { background: #15803d; border-color: #15803d; animation: popIn .35s ease; }
        .sk-btn-buy { width: 100%; padding: 14px; background: linear-gradient(135deg, #d4a020 0%, #b8860b 100%); border: none; border-radius: 13px; font-size: 15px; font-weight: 800; color: #fff; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 9px; transition: all .22s; box-shadow: 0 4px 18px rgba(184,134,11,.35); }
        .sk-btn-buy:hover:not(:disabled) { box-shadow: 0 8px 28px rgba(184,134,11,.5); transform: translateY(-2px); }
        .sk-btn-buy:disabled { opacity: .4; cursor: not-allowed; box-shadow: none; }
        .sk-btn-wish { width: 100%; padding: 12px; background: #fff; border: 2px solid #e5e0d8; border-radius: 13px; font-size: 14px; font-weight: 700; color: #666; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all .2s; }
        .sk-btn-wish:hover { border-color: #c8a060; color: #8b6914; background: #fdf9f0; }
        .sk-btn-wish.active { border-color: #ef4444; color: #dc2626; background: #fff5f5; }
        /* Trust badges */
        .sk-badges { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 0; flex-wrap: wrap; border-top: 1px solid #ede9e0; border-bottom: 1px solid #ede9e0; margin-bottom: 18px; }
        .sk-badge { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: #777; font-weight: 600; padding: 5px 10px; border-radius: 8px; background: #faf8f4; border: 1px solid #ede9e0; }
        /* Seller */
        .sk-seller { background: #faf8f4; border: 1px solid #ede9e0; border-radius: 13px; padding: 14px; margin-bottom: 16px; }
        .sk-seller-row { display: flex; justify-content: space-between; font-size: 13px; padding: 5px 0; }
        .sk-seller-row + .sk-seller-row { border-top: 1px solid #f0ede8; }
        .sk-seller-key { color: #888; }
        .sk-seller-val { font-weight: 700; color: #8b6914; }
        .sk-seller-val.green { color: #15803d; }
        .sk-oos { background: #fff5f5; border: 1.5px solid #fecaca; border-radius: 13px; padding: 14px; text-align: center; color: #dc2626; font-size: 14px; font-weight: 700; margin-bottom: 18px; }
        /* Tabs */
        .tab-section { max-width: 1120px; margin: 0 auto 16px; }
        .sk-tab-bar { display: flex; background: #fff; border-bottom: 2px solid #ede9e0; overflow: hidden; }
        .sk-tab-btn { flex: 1; padding: 14px 10px; font-size: 13.5px; font-weight: 700; cursor: pointer; background: none; border: none; border-bottom: 3px solid transparent; color: #aaa; transition: all .2s; font-family: inherit; margin-bottom: -2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sk-tab-btn.active { color: #b8860b; border-bottom-color: #b8860b; background: #fdf9f0; }
        .sk-tab-btn:hover:not(.active) { color: #1a1a1a; background: #f5f2ec; }
        .sk-tab-content { background: #fff; padding: 24px 20px; font-size: 14px; color: #555; line-height: 1.85; animation: fadeUp .22s ease; border-bottom: 1px solid #ede9e0; }
        .sk-ship-row { display: flex; gap: 14px; padding: 14px 0; border-bottom: 1px solid #f0ede8; }
        .sk-ship-row:last-child { border-bottom: none; }
        /* More products */
        .sk-more-wrap { max-width: 1120px; margin: 24px auto 40px; padding: 0 12px; }
        .sk-more-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(155px, 1fr)); gap: 12px; }
        .sk-more-card { background: #fff; border: 1.5px solid #ede9e0; border-radius: 14px; overflow: hidden; text-decoration: none; color: inherit; transition: all .22s cubic-bezier(.34,1.56,.64,1); display: block; }
        .sk-more-card:hover { border-color: #b8860b; transform: translateY(-4px); box-shadow: 0 10px 28px rgba(0,0,0,.1); }
        .sk-more-img { width: 100%; aspect-ratio: 1; background: #f2efe9; position: relative; }
        .sk-more-body { padding: 11px; }
        .sk-more-name { font-size: 12.5px; line-height: 1.4; color: #1a1a1a; margin-bottom: 5px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-weight: 600; }
        .sk-more-price { font-size: 14px; font-weight: 900; color: #b8860b; font-family: 'Syne', sans-serif; }
      `}</style>

      {/* NAV */}
      <header className="sk-nav">
        <Link href="/" className="sk-back" aria-label="Back">
          <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>
        <Link href="/" className="sk-logo">Shazfa Kraft<small>Islamic Wall Art Store</small></Link>
        <Link href="/cart" className="sk-cart-btn">
          <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          Cart
        </Link>
      </header>

      {/* BREADCRUMB */}
      <nav className="sk-crumb">
        <Link href="/">Home</Link><span>›</span>
        <Link href="/products">Products</Link>
        {product.categories && (<><span>›</span><Link href={`/products?category=${product.category_id}`}>{product.categories.name}</Link></>)}
        <span>›</span>
        <span style={{ color: '#1a1a1a', fontWeight: 700 }}>{product.name}</span>
      </nav>

      {/* MAIN */}
      <div style={{ padding: '0 12px' }}>
        <div className="sk-main page-enter">

          {/* ── GALLERY ── */}
          <div className="sk-gallery">
            <div className="gallery-touch-wrap" ref={galleryRef}
              onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
              <div className="sk-img-main">
                {mainDisplayImage
                  ? <Image
                      key={`${selectedColor}-${selectedImage}`}
                      src={mainDisplayImage}
                      alt={`${product.name}${selectedColor ? ` — ${selectedColor}` : ''}`}
                      fill style={{ objectFit: 'cover' }} className="slide-anim" priority
                    />
                  : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:64 }}>📦</div>
                }
                {discount > 0 && <div className="sk-disc-ribbon">−{discount}% OFF</div>}
                {product.is_featured && <div className="sk-feat-pill">★ Featured</div>}
                {/* Color-driven image indicator badge */}
                {colorDrivenImage && selectedColor && (
                  <div className="color-img-badge">
                    <span style={{ width:10, height:10, borderRadius:'50%', background: selectedColorHex, border:'1px solid rgba(255,255,255,.4)', display:'inline-block' }} />
                    {selectedColor}
                  </div>
                )}
                {allImages.length > 1 && (
                  <>
                    <button className="gal-arrow left" onClick={() => goToImage(selectedImage - 1)} disabled={selectedImage === 0}>
                      <svg width="14" height="14" fill="none" stroke="#333" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <button className="gal-arrow right" onClick={() => goToImage(selectedImage + 1)} disabled={selectedImage === allImages.length - 1}>
                      <svg width="14" height="14" fill="none" stroke="#333" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
                    </button>
                    <div className="gal-dots">
                      {allImages.map((_, i) => (
                        <button key={i} className={`gal-dot${selectedImage === i ? ' active' : ''}`} onClick={() => goToImage(i)} />
                      ))}
                    </div>
                    <div className="swipe-hint" style={{ bottom: 36 }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18"/></svg>
                      Swipe
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="sk-thumbs">
                {allImages.map((img, i) => (
                  <div key={i}
                    className={`sk-thumb${selectedImage === i && !colorDrivenImage ? ' active' : ''}`}
                    onClick={() => { setSelectedImage(i); setSelectedColor('') }}>
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <Image src={img} alt={`View ${i + 1}`} fill style={{ objectFit: 'cover' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── INFO PANEL ── */}
          <div className="sk-info">
            {product.categories && <span className="sk-category-tag">{product.categories.name}</span>}
            <h1 className="sk-title">{product.name}</h1>
            {product.short_description && <p className="sk-short-desc">{product.short_description}</p>}
            <div className="sk-rating">
              <span className="sk-stars">★★★★☆</span>
              <span style={{ fontSize:13, color:'#555', fontWeight:600 }}>4.4</span>
              <span style={{ fontSize:13, color:'#b8860b', cursor:'pointer', fontWeight:600 }}>(99 ratings)</span>
            </div>

            {/* ★ PRICE — size-driven */}
            <div className="sk-price-box">
              <div className="sk-price-label">
                M.R.P.
                {selectedSize && (
                  <span className="sk-price-size-note">for {selectedSize}" size</span>
                )}
              </div>
              <div
                className={`sk-price-main${priceFlash ? ' price-flash' : ''}`}
                key={`${displayPrice}-${selectedSize}`}
              >
                <sup>₹</sup>{Math.floor(displayPrice).toLocaleString('en-IN')}
                <sup style={{ fontSize:15 }}>.{String(Math.round((displayPrice % 1) * 100)).padStart(2,'0')}</sup>
              </div>
              {displayCompare && displayCompare > displayPrice && (
                <div className="sk-price-was">M.R.P.: ₹{Number(displayCompare).toLocaleString('en-IN')}</div>
              )}
              {discount > 0 && (
                <div className="sk-save-badge">
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                  {discount}% off · Save ₹{(Number(displayCompare) - displayPrice).toLocaleString('en-IN', { maximumFractionDigits:0 })}
                </div>
              )}
              {!selectedSize && sizesAvailable.length > 0 && (
                <p style={{ fontSize:11, color:'#aaa', marginTop:8 }}>↑ Select a size to see exact pricing</p>
              )}
            </div>

            {/* ★ SIZES — price shown per button, price changes on select */}
            {sizesAvailable.length > 0 && (
              <div style={{ marginBottom: 4 }}>
                <div className="sk-section-title">
                  Size:{selectedSize && <span className="selected-val">{selectedSize} inches</span>}
                  <span className="sk-section-note">· price varies by size</span>
                </div>
                <div className="sk-size-scroll">
                  {sizesAvailable.map(size => {
                    const available  = variants.some(v => v.is_active && v.options.size_inches === size && v.inventory_quantity > 0)
                    const price      = priceForSize(variants, size)
                    const isSelected = selectedSize === size
                    return (
                      <button key={size}
                        className={`sk-size-box${isSelected ? ' selected' : ''}`}
                        disabled={!available}
                        onClick={() => handleSizeSelect(size)}
                      >
                        {isSelected && <span className="size-check">✓</span>}
                        <span className="size-label">{size}"</span>
                        {price !== null && (
                          <span className="size-price">₹{price.toLocaleString('en-IN')}</span>
                        )}
                        {!available && <span className="size-oos">Out of stock</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ★ COLORS — dropdown with image preview per option, color changes gallery image only */}
            {colorsAvailable.length > 0 && (
              <div style={{ marginBottom: 4 }}>
                <div className="sk-section-title">
                  Color:{selectedColor && <span className="selected-val">{selectedColor}</span>}
                  <span className="sk-section-note">· changes photo only</span>
                </div>

                {/* Dropdown trigger */}
                <div className="sk-color-dropdown-wrap" ref={colorDropRef}>
                  <button
                    className={`sk-color-trigger${colorDropOpen ? ' open' : ''}`}
                    onClick={() => setColorDropOpen(o => !o)}
                    type="button"
                  >
                    {/* Show selected color's variant image or swatch */}
                    {colorVariant?.image_url
                      ? <img src={colorVariant.image_url} alt={selectedColor}
                          style={{ width:28, height:28, borderRadius:8, objectFit:'cover', border:'1.5px solid #e5e0d8', flexShrink:0 }} />
                      : <span className="color-swatch" style={{ background: selectedColorHex }} />
                    }
                    <span className="color-name">{selectedColor || 'Select color'}</span>
                    {colorsCount > 1 && <span className="color-count">{colorsCount} colors</span>}
                    <svg className="chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>

                  {/* ★ Dropdown panel — each option shows variant image */}
                  {colorDropOpen && (
                    <div className="sk-color-panel">
                      {colorsAvailable.map(color => {
                        const hex       = swatchHex(color)
                        const available = variants.some(v =>
                          v.is_active &&
                          v.options.color?.toLowerCase() === color.toLowerCase() &&
                          (!selectedSize || v.options.size_inches === selectedSize) &&
                          v.inventory_quantity > 0
                        )
                        const isSelected = selectedColor.toLowerCase() === color.toLowerCase()
                        // Get color-specific image for this option
                        const cv = variants.find(vv =>
                          vv.is_active &&
                          vv.options.color?.toLowerCase() === color.toLowerCase() &&
                          (!selectedSize || vv.options.size_inches === selectedSize)
                        )
                        return (
                          <button key={color}
                            className={`sk-color-option${isSelected ? ' selected' : ''}`}
                            disabled={!available}
                            onClick={() => handleColorSelect(color)}
                          >
                            {/* ★ Variant image in dropdown */}
                            {cv?.image_url
                              ? <img src={cv.image_url} alt={color} className="sk-color-opt-img" />
                              : <div className="sk-color-opt-img-placeholder">🖼</div>
                            }
                            {/* Color swatch dot */}
                            <span className="sk-color-opt-swatch" style={{ background: hex, opacity: available ? 1 : .4 }} />
                            <div className="sk-color-opt-info">
                              <span className="sk-color-opt-name">
                                {color}{!available ? ' — Out of stock' : ''}
                              </span>
                              {cv?.image_url && (
                                <span className="sk-color-opt-tag">Tap to preview</span>
                              )}
                            </div>
                            {isSelected && <span className="opt-check">✓</span>}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <p className="sk-color-note" style={{ marginTop: 8 }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Choosing a color updates the product photo · price is set by size
                </p>

                {/* Quick mini swatch row */}
                <div className="sk-swatch-row">
                  {colorsAvailable.map(color => {
                    const hex        = swatchHex(color)
                    const available  = variants.some(v =>
                      v.is_active &&
                      v.options.color?.toLowerCase() === color.toLowerCase() &&
                      (!selectedSize || v.options.size_inches === selectedSize) &&
                      v.inventory_quantity > 0
                    )
                    const isSelected = selectedColor.toLowerCase() === color.toLowerCase()
                    return (
                      <button key={color}
                        className={`sk-mini-swatch${isSelected ? ' selected' : ''}`}
                        disabled={!available}
                        title={color}
                        onClick={() => handleColorSelect(color)}
                        style={{ background: hex }}
                        type="button"
                      >
                        {isSelected && <span className="mini-check">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Selection summary */}
            {(selectedSize || selectedColor) && (
              <div className="sk-summary-bar">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                </svg>
                {[selectedSize ? `${selectedSize}" inches` : '', selectedColor].filter(Boolean).join(' · ')}
                {selectedSize && (
                  <span className="sk-summary-price">
                    ₹{displayPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                )}
              </div>
            )}

            {/* Stock */}
            <div className={`sk-stock ${stockLabel.cls}`}>
              <div className="sk-stock-dot" style={{
                background: stockLabel.cls === 'oos' ? '#dc2626' : stockLabel.cls === 'low-stock' ? '#ea580c' : '#15803d',
                boxShadow: `0 0 0 3px ${stockLabel.cls === 'oos' ? 'rgba(220,38,38,.2)' : stockLabel.cls === 'low-stock' ? 'rgba(234,88,12,.2)' : 'rgba(21,128,61,.2)'}`,
              }} />
              {stockLabel.text}
            </div>

            {/* Qty + CTA */}
            {stockLabel.cls !== 'oos' && (
              <>
                <div className="sk-qty-row">
                  <span className="sk-qty-label">Qty:</span>
                  <div className="sk-qty-box">
                    <button className="sk-qty-btn" onClick={() => setQuantity(p => Math.max(1, p - 1))} disabled={quantity <= 1}>−</button>
                    <div className="sk-qty-num">{quantity}</div>
                    <button className="sk-qty-btn" onClick={() => setQuantity(p => Math.min(Math.max(stock, 1), p + 1))} disabled={quantity >= Math.max(stock, 1)}>+</button>
                  </div>
                  <span className="sk-qty-total">
                    Total: <strong>₹{(displayPrice * quantity).toLocaleString('en-IN', { maximumFractionDigits:0 })}</strong>
                  </span>
                </div>
                <div className="sk-cta-stack">
                  <button
                    onClick={handleAddToCart}
                    className={`sk-btn-cart${addedToCart ? ' success' : ''}`}
                    disabled={!selectedSize || !selectedColor}
                  >
                    {addedToCart ? (
                      <>
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ animation:'checkIn .3s ease' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                        </svg>
                        Added to Cart!
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                        {!selectedSize ? 'Select a Size First' : !selectedColor ? 'Select a Color' : `Add to Cart · ₹${(displayPrice * quantity).toLocaleString('en-IN', { maximumFractionDigits:0 })}`}
                      </>
                    )}
                  </button>
                  <button className="sk-btn-buy" disabled={!selectedSize || !selectedColor}
                    onClick={() => { handleAddToCart(); router.push('/checkout') }}>
                    <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    Buy Now
                  </button>
                  <button className={`sk-btn-wish${isWishlisted ? ' active' : ''}`} onClick={() => setIsWishlisted(p => !p)}>
                    <svg width="16" height="16" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                    {isWishlisted ? '♥ Saved to Wishlist' : 'Add to Wishlist'}
                  </button>
                </div>
              </>
            )}
            {stockLabel.cls === 'oos' && <div className="sk-oos">⚠️ Currently Out of Stock</div>}

            {/* Trust badges */}
            <div className="sk-badges">
              {[{i:'🔒',l:'Secure Payment'},{i:'🚚',l:'Free Ship ₹499+'},{i:'↩️',l:'7-Day Returns'},{i:'✅',l:'Authentic'}].map(b => (
                <div key={b.l} className="sk-badge"><span>{b.i}</span><span>{b.l}</span></div>
              ))}
            </div>

            {/* Seller info */}
            <div className="sk-seller">
              {[
                {k:'Sold by',       v:'Shazfa Kraft',          cls:''},
                {k:'Dispatches from',v:'Shazfa Kraft',         cls:''},
                {k:'Est. delivery', v:'3–7 business days',     cls:'green'},
              ].map(r => (
                <div key={r.k} className="sk-seller-row">
                  <span className="sk-seller-key">{r.k}</span>
                  <span className={`sk-seller-val${r.cls?' '+r.cls:''}`}>{r.v}</span>
                </div>
              ))}
            </div>
            {(selectedVariant?.sku || product.sku) && (
              <p style={{ fontSize:11, color:'#ccc' }}>
                SKU: <code style={{ color:'#bbb' }}>{selectedVariant?.sku || product.sku}</code>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="tab-section" style={{ padding:'0 12px' }}>
        <div className="sk-tab-bar" style={{ borderRadius:'14px 14px 0 0', marginTop:16, overflow:'hidden' }}>
          {(['description','shipping','reviews'] as const).map(tab => (
            <button key={tab} className={`sk-tab-btn${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab==='description'?'📄 Description':tab==='shipping'?'🚚 Shipping':'⭐ Reviews'}
            </button>
          ))}
        </div>
        <div className="sk-tab-content" style={{ borderRadius:'0 0 14px 14px', border:'1px solid #ede9e0', borderTop:'none' }}>
          {activeTab === 'description' && (
            product.description
              ? <p style={{ whiteSpace:'pre-line' }}>{product.description}</p>
              : <p style={{ color:'#ccc', fontStyle:'italic' }}>No description available.</p>
          )}
          {activeTab === 'shipping' && (
            <div>
              {[
                {i:'🚚',t:'Free Shipping',       b:'Available on all orders above ₹499. Delivered within 3–7 business days.'},
                {i:'⚡',t:'Express Delivery',    b:'Next-day delivery in select cities for an additional charge.'},
                {i:'↩️',t:'Return Policy',       b:'Returns accepted within 7 days of delivery. Item must be unused and in original packaging.'},
                {i:'💳',t:'Prepaid Discount',    b:'Get an extra 5% off when you pay online at checkout.'},
              ].map(s => (
                <div key={s.t} className="sk-ship-row">
                  <div style={{ fontSize:22, flexShrink:0, width:30, textAlign:'center' }}>{s.i}</div>
                  <div>
                    <div style={{ fontWeight:800, fontSize:13.5, marginBottom:4, color:'#1a1a1a' }}>{s.t}</div>
                    <div style={{ fontSize:13.5, color:'#777', lineHeight:1.7 }}>{s.b}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'reviews' && (
            <div style={{ textAlign:'center', padding:'28px 0', color:'#bbb' }}>
              <p style={{ fontSize:40, marginBottom:12 }}>⭐</p>
              <p style={{ fontSize:15, fontWeight:700, color:'#777' }}>No reviews yet</p>
              <p style={{ fontSize:13, marginTop:6 }}>Be the first to review this product.</p>
            </div>
          )}
        </div>
      </div>

      {/* MORE PRODUCTS */}
      {moreProducts.length > 0 && (
        <section className="sk-more-wrap">
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, marginBottom:16, color:'#1a1a1a' }}>More Products</h2>
          <div className="sk-more-grid">
            {moreProducts.map(item => (
              <Link key={item.id} href={`/products/${item.slug}`} className="sk-more-card">
                <div className="sk-more-img">
                  {item.main_image_url
                    ? <Image src={item.main_image_url} alt={item.name} fill style={{ objectFit:'cover' }} />
                    : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32 }}>📦</div>}
                </div>
                <div className="sk-more-body">
                  <p className="sk-more-name">{item.name}</p>
                  <p className="sk-more-price">₹{Number(item.price||0).toLocaleString('en-IN')}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}