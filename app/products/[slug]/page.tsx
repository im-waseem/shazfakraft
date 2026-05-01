'use client'

import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()

  const [product, setProduct]             = useState<Product | null>(null)
  const [variants, setVariants]           = useState<Variant[]>([])
  const [loading, setLoading]             = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity]           = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [addedToCart, setAddedToCart]     = useState(false)
  const [isWishlisted, setIsWishlisted]   = useState(false)
  const [activeTab, setActiveTab]         = useState<'description' | 'shipping' | 'reviews'>('description')
  const [imgZoom, setImgZoom]             = useState(false)
  const [zoomPos, setZoomPos]             = useState({ x: 50, y: 50 })

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

  const allImages = product ? [
    ...(product.main_image_url ? [product.main_image_url] : []),
    ...(product.images?.filter(Boolean) || []),
  ] : []

  const parsedOptions = parseOptions(variants)
  const optionKeys    = product?.option_keys?.filter(k => parsedOptions[k]) || Object.keys(parsedOptions)

  const selectedVariant = variants.find(v =>
    Object.entries(selectedOptions).every(([k, val]) => v.options[k] === val)
  ) ?? null

  const displayPrice   = selectedVariant?.price    ?? product?.price    ?? 0
  const displayCompare = selectedVariant?.compare_price ?? product?.compare_price ?? null
  const discount       = displayCompare && displayCompare > displayPrice
    ? Math.round((1 - displayPrice / displayCompare) * 100) : 0
  const stock          = selectedVariant?.inventory_quantity ?? product?.inventory_quantity ?? 0
  const allSelected    = optionKeys.length > 0 && optionKeys.every(k => selectedOptions[k])

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f6f6f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '3px solid #e8e8e8', borderTopColor: '#c8860a', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: '#888', fontSize: 14, fontFamily: 'sans-serif' }}>Loading…</p>
      </div>
    </div>
  )

  if (!product) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f6f6f6', fontFamily: 'sans-serif', gap: 12 }}>
      <p style={{ fontSize: 48 }}>📦</p>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Product not found</h1>
      <Link href="/" style={{ background: '#c8860a', color: 'white', padding: '10px 24px', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>Back to Home</Link>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f6f6f6', fontFamily: "'Amazon Ember', 'Segoe UI', Arial, sans-serif", color: '#0f1111' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,600;1,400&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes checkPop { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }

        .page-enter { animation: fadeIn 0.4s ease both; }

        /* ── TOP BAR ── */
        .topbar {
          background: linear-gradient(135deg, #1c1410 0%, #2d1f0e 50%, #1c1410 100%);
          padding: 0 16px;
          height: 56px;
          display: flex;
          align-items: center;
          gap: 12px;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        }
        .back-btn {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          color: #fff;
          border-radius: 8px;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          text-decoration: none;
        }
        .back-btn:hover {
          background: rgba(200,134,10,0.25);
          border-color: rgba(200,134,10,0.5);
          transform: translateX(-2px);
        }
        .topbar-logo {
          font-family: 'Noto Serif', serif;
          font-size: 22px;
          font-weight: 600;
          color: #d4a843;
          text-decoration: none;
          letter-spacing: -0.01em;
          line-height: 1;
        }
        .topbar-logo span {
          display: block;
          font-size: 8px;
          font-family: sans-serif;
          font-weight: 400;
          letter-spacing: 0.18em;
          color: rgba(255,255,255,0.45);
          text-transform: uppercase;
          margin-top: -1px;
        }
        .topbar-cart-btn {
          margin-left: auto;
          background: #c8860a;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
          text-decoration: none;
          transition: background 0.2s;
        }
        .topbar-cart-btn:hover { background: #e09610; }

        /* ── BREADCRUMB ── */
        .breadcrumb {
          background: #fff;
          border-bottom: 1px solid #ddd;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #555;
          overflow-x: auto;
          white-space: nowrap;
        }
        .breadcrumb a { color: #007185; text-decoration: none; }
        .breadcrumb a:hover { color: #c45500; text-decoration: underline; }

        /* ── MAIN CARD ── */
        .product-card {
          background: #fff;
          margin: 10px;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          animation: slideUp 0.45s ease both;
        }

        /* ── IMAGE PANEL ── */
        .img-main-wrap {
          position: relative;
          background: #f8f8f8;
          overflow: hidden;
          cursor: zoom-in;
        }
        .img-main-wrap:hover .zoom-lens { opacity: 1; }
        .zoom-lens {
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          background: radial-gradient(circle 60px at var(--mx) var(--my), rgba(255,255,255,0.25) 0%, transparent 70%);
          transition: opacity 0.2s;
        }

        /* Thumb strip */
        .thumb-strip { display: flex; gap: 6px; padding: 10px 12px; overflow-x: auto; background: #fafafa; border-top: 1px solid #eee; }
        .thumb-strip::-webkit-scrollbar { height: 3px; }
        .thumb-strip::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
        .thumb-item {
          flex-shrink: 0;
          width: 60px;
          height: 60px;
          border-radius: 6px;
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          transition: border-color 0.18s;
          background: #f0f0f0;
        }
        .thumb-item.active { border-color: #c8860a; }
        .thumb-item:hover:not(.active) { border-color: #aaa; }

        /* ── INFO PANEL ── */
        .info-panel { padding: 16px; }

        .product-title {
          font-size: 17px;
          font-weight: 400;
          line-height: 1.45;
          color: #0f1111;
          margin-bottom: 8px;
        }

        .rating-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
          padding-bottom: 14px;
          border-bottom: 1px solid #e7e7e7;
        }
        .stars { color: #c8860a; font-size: 14px; letter-spacing: 1px; }
        .rating-count { font-size: 13px; color: #007185; cursor: pointer; }
        .rating-count:hover { color: #c45500; text-decoration: underline; }

        /* Price block */
        .price-block {
          background: linear-gradient(135deg, #fffbf3 0%, #fff8ec 100%);
          border: 1px solid #f0d090;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 14px;
        }
        .price-label { font-size: 11px; color: #888; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.06em; }
        .price-main {
          font-size: 30px;
          font-weight: 700;
          color: #0f1111;
          font-family: 'Noto Serif', serif;
          line-height: 1;
        }
        .price-main sup { font-size: 16px; vertical-align: super; font-weight: 700; }
        .price-was { font-size: 13px; color: #888; text-decoration: line-through; margin-top: 4px; }
        .price-saving {
          display: inline-block;
          background: #e8f5e9;
          color: #2e7d32;
          font-size: 12px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 50px;
          margin-top: 6px;
          border: 1px solid #c8e6c9;
        }

        /* EMI note */
        .emi-note {
          font-size: 12px;
          color: #555;
          margin-bottom: 16px;
          padding: 8px 12px;
          background: #f6f0ff;
          border-radius: 8px;
          border: 1px solid #e0d0ff;
        }
        .emi-note strong { color: #6a0dad; }

        /* ── VARIANT OPTIONS ── */
        .option-section { margin-bottom: 16px; }
        .option-label {
          font-size: 13px;
          font-weight: 600;
          color: #0f1111;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .option-label span { color: #888; font-weight: 400; }

        /* Color variant – image tile (Amazon style) */
        .color-tile-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .color-tile {
          border: 2px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          width: 90px;
          cursor: pointer;
          transition: all 0.2s;
          background: #f8f8f8;
          position: relative;
        }
        .color-tile:hover { border-color: #c8860a; transform: scale(1.03); }
        .color-tile.selected { border-color: #c8860a; box-shadow: 0 0 0 2px rgba(200,134,10,0.3); }
        .color-tile.unavailable { opacity: 0.35; cursor: not-allowed; filter: grayscale(0.6); }
        .color-tile-img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
        .color-tile-label {
          text-align: center;
          font-size: 11px;
          font-weight: 600;
          padding: 5px 4px;
          color: #333;
          border-top: 1px solid #eee;
          background: #fff;
        }
        .color-tile.selected .color-tile-label { color: #c8860a; }

        /* Size chips */
        .size-chip-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .size-chip {
          border: 1px solid #888;
          border-radius: 6px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.18s;
          background: #fff;
          color: #0f1111;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          min-width: 72px;
        }
        .size-chip:hover:not(:disabled) { border-color: #c8860a; background: #fffbf3; }
        .size-chip.selected { border-color: #c8860a; background: #fffbf3; box-shadow: 0 0 0 2px rgba(200,134,10,0.25); font-weight: 700; }
        .size-chip.unavailable { opacity: 0.4; cursor: not-allowed; text-decoration: line-through; }
        .size-chip-price { font-size: 10px; color: #888; font-weight: 400; }
        .size-chip.selected .size-chip-price { color: #c8860a; }

        /* Generic text chip */
        .text-chip {
          border: 1px solid #aaa;
          border-radius: 6px;
          padding: 8px 14px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.18s;
          background: #fff;
          color: #0f1111;
          font-family: inherit;
        }
        .text-chip:hover:not(:disabled) { border-color: #c8860a; background: #fffbf3; }
        .text-chip.selected { border-color: #c8860a; background: #fffbf3; font-weight: 600; }
        .text-chip.unavailable { opacity: 0.35; cursor: not-allowed; text-decoration: line-through; }

        /* Stock */
        .stock-row {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 14px;
        }
        .stock-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Qty */
        .qty-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .qty-label { font-size: 13px; color: #555; font-weight: 600; min-width: 40px; }
        .qty-box {
          display: flex;
          align-items: center;
          border: 1px solid #ccc;
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
        }
        .qty-btn {
          width: 38px;
          height: 38px;
          background: #f0f0f0;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #333;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
          font-weight: 300;
          font-family: inherit;
        }
        .qty-btn:hover:not(:disabled) { background: #e0e0e0; }
        .qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .qty-num {
          width: 44px;
          text-align: center;
          font-size: 16px;
          font-weight: 700;
          color: #0f1111;
          border-left: 1px solid #ddd;
          border-right: 1px solid #ddd;
          height: 38px;
          line-height: 38px;
        }
        .qty-total { font-size: 13px; color: #555; }
        .qty-total strong { color: #0f1111; font-weight: 700; }

        /* CTA buttons */
        .cta-stack { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
        .btn-add-cart {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #f0b429 0%, #d4920a 100%);
          border: 1px solid #c8860a;
          border-radius: 50px;
          font-size: 15px;
          font-weight: 700;
          color: #0f1111;
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.22s;
          box-shadow: 0 2px 8px rgba(200,134,10,0.3);
          letter-spacing: 0.01em;
        }
        .btn-add-cart:hover:not(:disabled) {
          background: linear-gradient(135deg, #f5c040 0%, #e09610 100%);
          box-shadow: 0 4px 16px rgba(200,134,10,0.45);
          transform: translateY(-1px);
        }
        .btn-add-cart:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }
        .btn-add-cart.success {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border-color: #16a34a;
          animation: popIn 0.3s ease;
          color: #fff;
          box-shadow: 0 4px 16px rgba(34,197,94,0.4);
        }
        .btn-wishlist {
          width: 100%;
          padding: 12px;
          background: #fff;
          border: 1px solid #ccc;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .btn-wishlist:hover { border-color: #c8860a; color: #c8860a; background: #fffbf3; }
        .btn-wishlist.active { background: #fff0ed; border-color: #c04e2a; color: #c04e2a; }

        /* Security badges */
        .security-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 12px 0;
          border-top: 1px solid #eee;
          border-bottom: 1px solid #eee;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .security-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: #555;
          font-weight: 500;
        }

        /* Seller box */
        .seller-box {
          background: #f8f8f8;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          padding: 14px;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .seller-row { display: flex; justify-content: space-between; font-size: 13px; }
        .seller-row-key { color: #555; }
        .seller-row-val { color: #007185; font-weight: 600; }
        .seller-row-val.green { color: #2e7d32; }

        /* Tab section */
        .tab-bar {
          display: flex;
          border-bottom: 2px solid #e7e7e7;
          background: #fff;
          margin: 10px;
          border-radius: 10px 10px 0 0;
          overflow: hidden;
        }
        .tab-btn {
          flex: 1;
          padding: 14px 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          color: #555;
          transition: all 0.2s;
          font-family: inherit;
          margin-bottom: -2px;
        }
        .tab-btn.active { color: #c8860a; border-bottom-color: #c8860a; background: #fffbf3; }
        .tab-btn:hover:not(.active) { color: #0f1111; background: #f6f6f6; }
        .tab-content {
          background: #fff;
          margin: 0 10px 10px;
          border-radius: 0 0 10px 10px;
          padding: 20px 16px;
          border: 1px solid #e7e7e7;
          border-top: none;
          min-height: 80px;
          animation: fadeIn 0.25s ease;
        }
        .tab-content p { font-size: 14px; color: #444; line-height: 1.8; white-space: pre-line; }

        /* Shipping info rows */
        .ship-row { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
        .ship-row:last-child { border-bottom: none; }
        .ship-icon { font-size: 20px; flex-shrink: 0; width: 28px; text-align: center; }
        .ship-title { font-size: 13px; font-weight: 700; margin-bottom: 3px; }
        .ship-body { font-size: 13px; color: #555; line-height: 1.6; }

        /* Out of stock banner */
        .oos-banner {
          background: #fff3f3;
          border: 1px solid #ffcdd2;
          border-radius: 10px;
          padding: 14px;
          text-align: center;
          color: #c62828;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        /* SKU */
        .sku-row { font-size: 11px; color: #aaa; margin-top: 8px; }
        .sku-row code { font-size: 11px; color: #888; }

        /* ── DISCOUNT RIBBON ── */
        .disc-ribbon {
          position: absolute;
          top: 14px;
          left: 0;
          background: linear-gradient(90deg, #c8860a, #e09610);
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          padding: 5px 14px 5px 10px;
          clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 50%, 100% 100%, 0 100%);
          letter-spacing: 0.04em;
          z-index: 2;
        }
        .feat-ribbon {
          position: absolute;
          top: 14px;
          right: 10px;
          background: #1c1410;
          color: #d4a843;
          font-size: 9px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 5px;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          z-index: 2;
        }

        @media (min-width: 768px) {
          .product-card {
            display: grid;
            grid-template-columns: 420px 1fr;
            margin: 16px auto;
            max-width: 1100px;
          }
          .tab-bar { margin: 0 auto; max-width: 1100px; border-radius: 0; }
          .tab-content { margin: 0 auto 16px; max-width: 1100px; border-radius: 0 0 10px 10px; }
          .product-title { font-size: 20px; }
          .price-main { font-size: 36px; }
        }
      `}</style>

      {/* ── TOP BAR ── */}
      <header className="topbar">
        <Link href="/" className="back-btn" title="Back to Home">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <Link href="/" className="topbar-logo">
          Shazfa kraft
          <span>Islamic Store</span>
        </Link>
        <Link href="/cart" className="topbar-cart-btn">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Cart
        </Link>
      </header>

      {/* ── BREADCRUMB ── */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span>›</span>
        <Link href="/products">Products</Link>
        {product.categories && (
          <>
            <span>›</span>
            <Link href={`/products?category=${product.category_id}`}>{product.categories.name}</Link>
          </>
        )}
        <span>›</span>
        <span style={{ color: '#0f1111', fontWeight: 500 }}>{product.name}</span>
      </nav>

      {/* ── PRODUCT CARD ── */}
      <div className="product-card page-enter">

        {/* ══ LEFT: IMAGE GALLERY ══ */}
        <div>
          {/* Main image */}
      <div
  className="img-main-wrap"
  onMouseEnter={() => setImgZoom(true)}
  onMouseLeave={() => setImgZoom(false)}
  onMouseMove={handleMouseMove}
  style={{
    position: 'relative',
    background: '#f8f8f8',
    overflow: 'hidden',
    aspectRatio: '1',
    cursor: imgZoom ? 'zoom-in' : 'default',
  }}
>
            {allImages[selectedImage]
              ? (
                <div style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  transform: imgZoom ? 'scale(1.5)' : 'scale(1)',
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transition: imgZoom ? 'none' : 'transform 0.3s ease',
                }}>
                  <Image src={allImages[selectedImage]} alt={product.name} fill style={{ objectFit: 'cover' }} priority />
                </div>
              )
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60 }}>📦</div>
            }
            {discount > 0 && <div className="disc-ribbon">-{discount}% OFF</div>}
            {product.is_featured && <div className="feat-ribbon">★ Featured</div>}

            {/* Arrow nav */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage(p => Math.max(0, p - 1))}
                  disabled={selectedImage === 0}
                  style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, border: 'none', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', zIndex: 3, opacity: selectedImage === 0 ? 0.3 : 1 }}
                >
                  <svg width="14" height="14" fill="none" stroke="#333" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                  onClick={() => setSelectedImage(p => Math.min(allImages.length - 1, p + 1))}
                  disabled={selectedImage === allImages.length - 1}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, border: 'none', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', zIndex: 3, opacity: selectedImage === allImages.length - 1 ? 0.3 : 1 }}
                >
                  <svg width="14" height="14" fill="none" stroke="#333" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}

            {/* Dot indicators */}
            {allImages.length > 1 && (
              <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5, zIndex: 3 }}>
                {allImages.map((_, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)} style={{ width: i === selectedImage ? 22 : 7, height: 7, borderRadius: 4, border: 'none', cursor: 'pointer', background: i === selectedImage ? '#c8860a' : 'rgba(255,255,255,0.7)', transition: 'all 0.22s', padding: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <div className="thumb-strip">
              {allImages.map((img, i) => (
                <div key={i} className={`thumb-item ${selectedImage === i ? 'active' : ''}`} onClick={() => setSelectedImage(i)}>
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <Image src={img} alt={`View ${i + 1}`} fill style={{ objectFit: 'cover' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══ RIGHT: INFO ══ */}
        <div className="info-panel">

          {/* Category tag */}
          {product.categories && (
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#007185', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {product.categories.name}
              </span>
            </div>
          )}

          {/* Title */}
          <h1 className="product-title">{product.name}</h1>
          {product.short_description && (
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 10 }}>{product.short_description}</p>
          )}

          {/* Rating row (static for now) */}
          <div className="rating-row">
            <span className="stars">★★★★☆</span>
            <span style={{ fontSize: 13, color: '#555' }}>4.4</span>
            <span className="rating-count">(99 ratings)</span>
            {product.tags?.slice(0, 1).map(tag => (
              <span key={tag} style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: '#888', background: '#f0f0f0', padding: '2px 8px', borderRadius: 50 }}>{tag}</span>
            ))}
          </div>

          {/* ── PRICE ── */}
          <div className="price-block">
            <div className="price-label">M.R.P.</div>
            <div className="price-main" key={displayPrice}>
              <sup>₹</sup>{Math.floor(displayPrice).toLocaleString('en-IN')}
              <sup style={{ fontSize: 14 }}>.{String(Math.round((displayPrice % 1) * 100)).padStart(2, '0')}</sup>
            </div>
            {displayCompare && displayCompare > displayPrice && (
              <div className="price-was">M.R.P.: ₹{Number(displayCompare).toLocaleString('en-IN')}</div>
            )}
            {discount > 0 && (
              <div className="price-saving">You save {discount}% · ₹{(Number(displayCompare) - displayPrice).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            )}
            {selectedVariant && (
              <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>{selectedVariant.name}</div>
            )}
          </div>

          {/* EMI */}
          <div className="emi-note">
            💳 0% EMI from <strong>₹{Math.round(displayPrice / 3).toLocaleString('en-IN')}/month</strong> · 3 months · No cost EMI on select cards
          </div>

          {/* ── VARIANT OPTIONS ── */}
          {optionKeys.map(optionKey => {
            const values = parsedOptions[optionKey] || []
            const isColor = optionKey.toLowerCase().includes('color') || optionKey.toLowerCase().includes('colour')
            const isSize  = optionKey.toLowerCase() === 'size'

            return (
              <div key={optionKey} className="option-section">
                <div className="option-label">
                  {optionKey}:
                  {selectedOptions[optionKey] && (
                    <span style={{ color: '#0f1111', fontWeight: 700 }}>{selectedOptions[optionKey]}</span>
                  )}
                </div>

                {isColor ? (
                  /* Amazon-style image tiles for color */
                  <div className="color-tile-row">
                    {values.map(val => {
                      const available = isComboAvailable(variants, selectedOptions, optionKey, val)
                      const isSelected = selectedOptions[optionKey] === val
                      const colorHex = COLOR_MAP[val.toLowerCase()]
                      // Try to find the variant's image for this color
                      const colorVariant = variants.find(v => v.options[optionKey] === val)
                      return (
                        <div
                          key={val}
                          className={`color-tile ${isSelected ? 'selected' : ''} ${!available ? 'unavailable' : ''}`}
                          onClick={() => available && setSelectedOptions(p => ({ ...p, [optionKey]: val }))}
                          title={!available ? 'Out of stock' : val}
                        >
                          {colorHex ? (
                            <div style={{ width: '100%', aspectRatio: '1', background: colorHex }} />
                          ) : (
                            <div style={{ width: '100%', aspectRatio: '1', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎨</div>
                          )}
                          <div className="color-tile-label">{val}</div>
                        </div>
                      )
                    })}
                  </div>
                ) : isSize ? (
                  /* Size chips with price */
                  <div className="size-chip-row">
                    {values.map(val => {
                      const available = isComboAvailable(variants, selectedOptions, optionKey, val)
                      const isSelected = selectedOptions[optionKey] === val
                      const matchV = variants.find(v => v.options[optionKey] === val && Object.entries(selectedOptions).filter(([k]) => k !== optionKey).every(([k, sv]) => v.options[k] === sv))
                      return (
                        <button
                          key={val}
                          className={`size-chip ${isSelected ? 'selected' : ''} ${!available ? 'unavailable' : ''}`}
                          onClick={() => available && setSelectedOptions(p => ({ ...p, [optionKey]: val }))}
                          disabled={!available}
                        >
                          {val}
                          {matchV?.price && (
                            <span className="size-chip-price">₹{Number(matchV.price).toLocaleString('en-IN')}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  /* Generic text chips */
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {values.map(val => {
                      const available = isComboAvailable(variants, selectedOptions, optionKey, val)
                      const isSelected = selectedOptions[optionKey] === val
                      return (
                        <button
                          key={val}
                          className={`text-chip ${isSelected ? 'selected' : ''} ${!available ? 'unavailable' : ''}`}
                          onClick={() => available && setSelectedOptions(p => ({ ...p, [optionKey]: val }))}
                          disabled={!available}
                        >
                          {val}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* ── STOCK ── */}
          <div className="stock-row">
            <div className="stock-dot" style={{
              background: stock <= 0 ? '#d32f2f' : stock <= 10 ? '#f57c00' : '#2e7d32',
              boxShadow: `0 0 0 3px ${stock <= 0 ? 'rgba(211,47,47,0.2)' : stock <= 10 ? 'rgba(245,124,0,0.2)' : 'rgba(46,125,50,0.2)'}`,
            }} />
            <span style={{ color: stock <= 0 ? '#d32f2f' : stock <= 10 ? '#f57c00' : '#2e7d32' }}>
              {stock <= 0 ? 'Currently Unavailable' : stock <= 10 ? `Only ${stock} left in stock — order soon!` : 'In Stock'}
            </span>
          </div>

          {optionKeys.length > 0 && !allSelected && (
            <div style={{ fontSize: 12, color: '#c45500', marginBottom: 12, padding: '8px 12px', background: '#fff8f0', borderRadius: 8, border: '1px solid #ffd699' }}>
              ⚠️ Please select {optionKeys.filter(k => !selectedOptions[k]).join(' and ')} to continue
            </div>
          )}

          {/* ── QTY + CTA ── */}
          {stock > 0 && (
            <>
              <div className="qty-row">
                <span className="qty-label">Qty:</span>
                <div className="qty-box">
                  <button className="qty-btn" onClick={() => setQuantity(p => Math.max(1, p - 1))} disabled={quantity <= 1}>−</button>
                  <div className="qty-num">{quantity}</div>
                  <button className="qty-btn" onClick={() => setQuantity(p => Math.min(stock, p + 1))} disabled={quantity >= stock}>+</button>
                </div>
                <span className="qty-total">Total: <strong>₹{(displayPrice * quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong></span>
              </div>

              <div className="cta-stack">
                <button
                  onClick={handleAddToCart}
                  disabled={!allSelected}
                  className={`btn-add-cart${addedToCart ? ' success' : ''}`}
                >
                  {addedToCart ? (
                    <>
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ animation: 'checkPop 0.3s ease' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      Add to Cart · ₹{(displayPrice * quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </>
                  )}
                </button>
                <button
                  className={`btn-wishlist${isWishlisted ? ' active' : ''}`}
                  onClick={() => setIsWishlisted(p => !p)}
                >
                  <svg width="17" height="17" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {isWishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
                </button>
              </div>
            </>
          )}

          {stock <= 0 && (
            <div className="oos-banner">
              <span style={{ fontSize: 20 }}>⚠️</span> Currently Out of Stock
            </div>
          )}

          {/* Security badges */}
          <div className="security-row">
            {[
              { icon: '🔒', label: 'Secure Payment' },
              { icon: '🚚', label: 'Free Shipping ₹499+' },
              { icon: '↩️', label: '7-Day Returns' },
              { icon: '✅', label: 'Authentic Products' },
            ].map(b => (
              <div key={b.label} className="security-item">
                <span>{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>

          {/* Seller / dispatch box */}
          <div className="seller-box">
            <div className="seller-row">
              <span className="seller-row-key">Sold by</span>
              <span className="seller-row-val">Shazfa kraft</span>
            </div>
            <div className="seller-row">
              <span className="seller-row-key">Dispatches from</span>
              <span className="seller-row-val">Shazfa kraft</span>
            </div>
            <div className="seller-row">
              <span className="seller-row-key">Estimated delivery</span>
              <span className="seller-row-val green">3–7 business days</span>
            </div>
          </div>

          {/* SKU */}
          {(selectedVariant?.sku || product.sku) && (
            <div className="sku-row">SKU: <code>{selectedVariant?.sku || product.sku}</code></div>
          )}
        </div>
      </div>

      {/* ── DESCRIPTION TABS ── */}
      <div className="tab-bar">
        {(['description', 'shipping', 'reviews'] as const).map(tab => (
          <button key={tab} className={`tab-btn${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'description' ? '📄 Description' : tab === 'shipping' ? '🚚 Shipping & Returns' : '⭐ Reviews'}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'description' && (
          product.description
            ? <p>{product.description}</p>
            : <p style={{ color: '#aaa', fontStyle: 'italic' }}>No description available.</p>
        )}

        {activeTab === 'shipping' && (
          <div>
            {[
              { icon: '🚚', title: 'Free Shipping', body: 'Available on all orders above ₹499. Delivered within 3–7 business days.' },
              { icon: '⚡', title: 'Express Delivery', body: 'Next-day delivery in select cities for an additional charge.' },
              { icon: '↩️', title: 'Return Policy', body: 'Returns accepted within 7 days of delivery. Item must be unused and in original packaging.' },
              { icon: '💳', title: 'Prepaid Discount', body: 'Get an extra 5% off when you pay online at checkout.' },
            ].map(s => (
              <div key={s.title} className="ship-row">
                <div className="ship-icon">{s.icon}</div>
                <div>
                  <div className="ship-title">{s.title}</div>
                  <div className="ship-body">{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#aaa' }}>
            <p style={{ fontSize: 36, marginBottom: 10 }}>⭐</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#555' }}>No reviews yet</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>Be the first to review this product.</p>
          </div>
        )}
      </div>

    </div>
  )
}