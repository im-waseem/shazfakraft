'use client'

import Link from 'next/link'
import { useState } from 'react'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    price: number
    compare_price?: number
    main_image_url?: string
    image_url?: string
    is_featured?: boolean
    inventory_quantity?: number
    categories?: { name: string; slug: string }
  }
  onAddToCart?: (product: any) => void
  onToggleWishlist?: (id: string) => void
  inWishlist?: boolean
}

export default function ProductCard({ product, onAddToCart, onToggleWishlist, inWishlist }: ProductCardProps) {
  const [added, setAdded] = useState(false)
  const [imgErr, setImgErr] = useState(false)

  const discount = product.compare_price && Number(product.compare_price) > Number(product.price)
    ? Math.round((1 - Number(product.price) / Number(product.compare_price)) * 100) : null

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!onAddToCart) return
    onAddToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  const outOfStock = product.inventory_quantity === 0
  const lowStock = !outOfStock && (product.inventory_quantity || 0) > 0 && (product.inventory_quantity || 99) <= 10

  return (
    <div style={{ background: '#fff', border: '1px solid #ecdcc8', borderRadius: 16, overflow: 'hidden', position: 'relative', transition: 'all .3s cubic-bezier(.4,0,.2,1)', cursor: 'pointer' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-5px)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#dccaaa'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 40px rgba(200,134,10,.12)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.borderColor = '#ecdcc8'; (e.currentTarget as HTMLDivElement).style.boxShadow = '' }}>

      {/* Image */}
      <Link href={`/products/${product.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{ aspectRatio: '1', background: '#fdf3e3', position: 'relative', overflow: 'hidden' }}>
          {(product.main_image_url || product.image_url) && !imgErr ? (
            <img src={product.main_image_url || product.image_url} alt={product.name} onError={() => setImgErr(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .5s cubic-bezier(.4,0,.2,1)' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🎁</div>
          )}

          {/* Badges */}
          {product.is_featured && (
            <span style={{ position: 'absolute', top: 10, left: 10, background: '#fef3d8', color: '#c8860a', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 50, border: '1px solid #e8d089', letterSpacing: '.06em' }}>Featured</span>
          )}
          {discount && (
            <span style={{ position: 'absolute', top: 10, right: 10, background: '#c04e2a', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>−{discount}%</span>
          )}
          {outOfStock && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,251,245,.78)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9a8a7a' }}>Out of Stock</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '12px 14px 8px' }}>
          {product.categories && (
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#6b7c5c' }}>{product.categories.name}</span>
          )}
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1c1410', marginTop: 4, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 700, color: '#c8860a' }}>₹{Number(product.price).toFixed(0)}</span>
            {discount && <span style={{ fontSize: 12, color: '#9a8a7a', textDecoration: 'line-through' }}>₹{Number(product.compare_price).toFixed(0)}</span>}
          </div>
          {lowStock && <p style={{ fontSize: 11, color: '#c04e2a', fontWeight: 600, marginTop: 4 }}>Only {product.inventory_quantity} left!</p>}
        </div>
      </Link>

      {/* Actions */}
      <div style={{ padding: '0 14px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={handleAdd} disabled={outOfStock}
          style={{ flex: 1, background: added ? '#5a8a40' : '#c8860a', color: '#fff', border: 'none', borderRadius: 50, padding: '10px', fontSize: 12, fontWeight: 700, cursor: outOfStock ? 'not-allowed' : 'pointer', fontFamily: "'Nunito', sans-serif", letterSpacing: '.03em', transition: 'background .2s', opacity: outOfStock ? 0.5 : 1 }}>
          {outOfStock ? 'Out of Stock' : added ? '✓ Added!' : '+ Add to Cart'}
        </button>
        {onToggleWishlist && (
          <button onClick={e => { e.preventDefault(); onToggleWishlist(product.id) }}
            style={{ width: 38, height: 38, borderRadius: '50%', background: inWishlist ? '#fff0ed' : '#fff', border: `1.5px solid ${inWishlist ? '#c04e2a' : '#dccaaa'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, transition: 'all .2s', flexShrink: 0 }}>
            {inWishlist ? '❤️' : '🤍'}
          </button>
        )}
      </div>
    </div>
  )
}