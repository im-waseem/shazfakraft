'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image: string
  size?: string
  color?: string
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('cart')
    if (saved) setCartItems(JSON.parse(saved))
  }, [])

  const updateQuantity = (productId: string, q: number) => {
    if (q < 1) return
    const updated = cartItems.map(i => i.productId === productId ? { ...i, quantity: q } : i)
    setCartItems(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  const removeItem = (productId: string) => {
    const updated = cartItems.filter(i => i.productId !== productId)
    setCartItems(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const shipping = subtotal > 999 ? 0 : 49
  const total = subtotal + shipping

  if (cartItems.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#faf8f5', display: 'grid', placeItems: 'center', padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
        <div style={{ background: '#fff', border: '1px solid #e8e0d4', borderRadius: 18, padding: 28, textAlign: 'center', maxWidth: 460, width: '100%' }}>
          <div style={{ fontSize: 52 }}>🛒</div>
          <h1 style={{ marginTop: 8, fontFamily: "'Playfair Display', serif", fontSize: 34, color: '#1a1410' }}>Your cart is empty</h1>
          <p style={{ color: '#6b5c4a', marginTop: 8 }}>Looks like you haven’t added any items yet.</p>
          <Link href="/products" style={{ display: 'inline-block', marginTop: 16, background: '#b8860b', color: '#fff', textDecoration: 'none', padding: '11px 18px', borderRadius: 999, fontWeight: 700 }}>Browse Products</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, color: '#1a1410', marginBottom: 16 }}>Shopping Cart</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            {cartItems.map(item => (
              <div key={item.id} style={{ background: '#fff', border: '1px solid #e8e0d4', borderRadius: 16, padding: 14, display: 'flex', gap: 12 }}>
                <div style={{ width: 86, height: 86, borderRadius: 12, overflow: 'hidden', position: 'relative', background: '#f4efe7', flexShrink: 0 }}>
                  {item.image ? <Image src={item.image} alt={item.name} fill style={{ objectFit: 'cover' }} /> : <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>📦</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: 700, color: '#1a1410' }}>{item.name}</h3>
                  <p style={{ color: '#6b5c4a', fontSize: 13 }}>{[item.size ? `Size ${item.size}` : '', item.color ? `Color ${item.color}` : ''].filter(Boolean).join(' · ') || 'Standard'}</p>
                  <p style={{ color: '#b8860b', fontWeight: 700, marginTop: 4 }}>₹{item.price.toFixed(0)}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #d4c8b8', background: '#fff' }}>-</button>
                    <strong>{item.quantity}</strong>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #d4c8b8', background: '#fff' }}>+</button>
                    <button onClick={() => removeItem(item.productId)} style={{ marginLeft: 8, border: 0, background: 'transparent', color: '#b42318', fontSize: 13, cursor: 'pointer' }}>Remove</button>
                  </div>
                </div>
                <div style={{ fontWeight: 700 }}>₹{(item.price * item.quantity).toFixed(0)}</div>
              </div>
            ))}
          </div>

          <aside style={{ background: '#fff', border: '1px solid #e8e0d4', borderRadius: 16, padding: 16, height: 'fit-content', position: 'sticky', top: 80 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Order Summary</h2>
            <div style={{ display: 'grid', gap: 8, color: '#6b5c4a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><strong style={{ color: '#1a1410' }}>₹{subtotal.toFixed(0)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Shipping</span><strong style={{ color: '#1a1410' }}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</strong></div>
              <div style={{ borderTop: '1px solid #e8e0d4', marginTop: 4, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}><strong style={{ color: '#1a1410' }}>Total</strong><strong style={{ color: '#b8860b' }}>₹{total.toFixed(0)}</strong></div>
            </div>
            <button onClick={() => router.push('/checkout')} style={{ marginTop: 16, width: '100%', background: '#b8860b', color: '#fff', border: 0, borderRadius: 999, padding: '12px 14px', fontWeight: 700, cursor: 'pointer' }}>Proceed to Checkout</button>
            <Link href="/products" style={{ display: 'block', textAlign: 'center', marginTop: 10, color: '#6b5c4a' }}>Continue Shopping</Link>
          </aside>
        </div>
      </div>
    </div>
  )
}
