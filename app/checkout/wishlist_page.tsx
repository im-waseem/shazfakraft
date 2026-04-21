'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function WishlistPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const ids: string[] = JSON.parse(localStorage.getItem('wishlist') || '[]')
      if (ids.length === 0) { setLoading(false); return }
      const supabase = createClient()
      const { data } = await supabase.from('products').select('*, categories(name,slug)').in('id', ids)
      setProducts(data || [])
      setLoading(false)
    }
    load()
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    setCartCount(cart.reduce((s: number, i: any) => s + i.quantity, 0))
  }, [])

  const removeFromWishlist = (id: string) => {
    const updated = products.filter(p => p.id !== id)
    setProducts(updated)
    localStorage.setItem('wishlist', JSON.stringify(updated.map(p => p.id)))
  }

  const addToCart = (product: any) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const idx = cart.findIndex((i: any) => i.productId === product.id)
    if (idx >= 0) cart[idx].quantity += 1
    else cart.push({ id: product.id, productId: product.id, name: product.name, price: Number(product.price), quantity: 1, image: product.main_image_url || product.image_url || '' })
    localStorage.setItem('cart', JSON.stringify(cart))
    setCartCount(cart.reduce((s: number, i: any) => s + i.quantity, 0))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fffbf5', fontFamily: "'Nunito', sans-serif", color: '#1c1410' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Nunito:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        :root{--gold:#c8860a;--gold-pale:#fef3d8;--warm:#fdf3e3;--text:#1c1410;--text-2:#5a4a3a;--text-3:#9a8a7a;--border:#ecdcc8;--border-2:#dccaaa;--brick:#c04e2a;}
        .w-card{background:#fff;border:1px solid var(--border);border-radius:16px;overflow:hidden;position:relative;transition:all .3s cubic-bezier(.4,0,.2,1)}
        .w-card:hover{border-color:var(--border-2);transform:translateY(-4px);box-shadow:0 12px 32px rgba(200,134,10,.1)}
        .w-card:hover .w-img{transform:scale(1.06)}
        .w-img{transition:transform .5s cubic-bezier(.4,0,.2,1);width:100%;height:100%;object-fit:cover}
        .cart-btn{background:var(--gold);color:#fff;border:none;border-radius:50px;padding:10px 18px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;flex:1;letter-spacing:.03em}
        .cart-btn:hover{background:#e09a20}
        .rem-btn{background:#fff;border:1.5px solid var(--border-2);border-radius:50px;padding:10px 14px;font-family:inherit;font-size:13px;cursor:pointer;color:var(--brick);font-weight:600;transition:all .2s}
        .rem-btn:hover{background:#fff0ed;border-color:var(--brick)}
        .nav-link{color:#5a4a3a;font-size:14px;font-weight:600;text-decoration:none}
        .nav-link:hover{color:var(--gold)}
      `}</style>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '0 20px', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/" style={{ textDecoration: 'none', fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: 'var(--gold)', marginRight: 16 }}>Shafa</Link>
          <nav style={{ display: 'flex', gap: 20, flex: 1 }}>
            {[['/', 'Home'], ['/products', 'Products'], ['/about', 'About'], ['/contact', 'Contact']].map(([h, l]) => (
              <Link key={h} href={h} className="nav-link">{l}</Link>
            ))}
          </nav>
          <Link href="/cart" style={{ position: 'relative', color: '#5a4a3a', textDecoration: 'none', padding: 8 }}>
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            {cartCount > 0 && <span style={{ position: 'absolute', top: 4, right: 4, background: 'var(--gold)', color: '#fff', fontSize: 9, fontWeight: 700, width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>}
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(24px,4vw,48px) 20px' }}>
        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>Saved Items</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 700 }}>My Wishlist</h1>
          {!loading && <p style={{ color: 'var(--text-3)', fontSize: 14, marginTop: 6 }}>{products.length} item{products.length !== 1 ? 's' : ''} saved</p>}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', animation: 'pulse 1.5s ease infinite' }}>
                <div style={{ aspectRatio: '1', background: 'var(--warm)' }} />
                <div style={{ padding: 14 }}>
                  <div style={{ height: 14, background: 'var(--warm)', borderRadius: 6, marginBottom: 8, width: '80%' }} />
                  <div style={{ height: 12, background: 'var(--warm)', borderRadius: 6, width: '50%' }} />
                </div>
              </div>
            ))}
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 20, border: '1px solid var(--border)' }}>
            <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'var(--gold-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 38 }}>🤍</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, marginBottom: 10 }}>Your wishlist is empty</h2>
            <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>Save products you love by tapping the heart icon on any product card.</p>
            <Link href="/" style={{ display: 'inline-block', background: 'var(--gold)', color: '#fff', padding: '12px 30px', borderRadius: 50, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Explore Products</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20 }}>
            {products.map(product => {
              const discount = product.compare_price && Number(product.compare_price) > Number(product.price)
                ? Math.round((1 - Number(product.price) / Number(product.compare_price)) * 100) : null
              return (
                <div key={product.id} className="w-card">
                  <Link href={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div style={{ aspectRatio: '1', background: 'var(--warm)', position: 'relative', overflow: 'hidden' }}>
                      {product.main_image_url || product.image_url
                        ? <img src={product.main_image_url || product.image_url} alt={product.name} className="w-img" />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🎁</div>}
                      {discount && <span style={{ position: 'absolute', top: 10, left: 10, background: 'var(--brick)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>-{discount}%</span>}
                    </div>
                    <div style={{ padding: '12px 14px 10px' }}>
                      {product.categories && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#6b7c5c' }}>{product.categories.name}</span>}
                      <p style={{ fontSize: 14, fontWeight: 600, marginTop: 4, lineHeight: 1.3, color: 'var(--text)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>₹{Number(product.price).toFixed(0)}</span>
                        {discount && <span style={{ fontSize: 12, color: 'var(--text-3)', textDecoration: 'line-through' }}>₹{Number(product.compare_price).toFixed(0)}</span>}
                      </div>
                    </div>
                  </Link>
                  <div style={{ padding: '0 14px 14px', display: 'flex', gap: 8 }}>
                    <button className="cart-btn" onClick={() => addToCart(product)} disabled={product.inventory_quantity === 0}>
                      {product.inventory_quantity === 0 ? 'Out of Stock' : '+ Add to Cart'}
                    </button>
                    <button className="rem-btn" onClick={() => removeFromWishlist(product.id)} title="Remove from wishlist">🗑</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}