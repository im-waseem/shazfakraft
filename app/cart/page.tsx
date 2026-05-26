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

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');

        .cart-wrap { padding: 24px 20px; max-width: 1160px; margin: 0 auto; }
        .cart-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(22px, 5vw, 36px);
          color: #1a1410;
          margin-bottom: 20px;
          line-height: 1.2;
        }
        .cart-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px;
          align-items: start;
        }
        .cart-items-col { display: grid; gap: 12px; }

        .cart-item {
          background: #fff;
          border: 1px solid #e8e0d4;
          border-radius: 16px;
          padding: 14px;
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }
        .cart-item-img {
          width: 88px;
          height: 88px;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          background: #f4efe7;
          flex-shrink: 0;
        }
        .cart-item-body { flex: 1; min-width: 0; }
        .cart-item-name {
          font-weight: 700;
          color: #1a1410;
          font-size: 14px;
          line-height: 1.4;
          margin-bottom: 3px;
        }
        .cart-item-variant { color: #6b5c4a; font-size: 12.5px; }
        .cart-item-price-mobile {
          color: #b8860b;
          font-weight: 700;
          font-size: 14px;
          margin-top: 5px;
          display: none;
        }
        .cart-item-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          flex-wrap: wrap;
        }
        .cart-qty-btn {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1.5px solid #d4c8b8;
          background: #fff;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #5a4a3a;
          transition: all .15s;
          flex-shrink: 0;
          font-family: inherit;
        }
        .cart-qty-btn:hover { border-color: #b8860b; color: #b8860b; background: #fef9ed; }
        .cart-qty-num { font-weight: 700; font-size: 15px; color: #1a1410; min-width: 20px; text-align: center; }
        .cart-remove-btn {
          background: none;
          border: none;
          color: #b42318;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 6px 8px;
          border-radius: 6px;
          transition: background .15s;
          font-family: inherit;
        }
        .cart-remove-btn:hover { background: #fff1f0; }
        .cart-item-price-desktop {
          font-weight: 700;
          color: #1a1410;
          font-size: 15px;
          flex-shrink: 0;
          padding-top: 2px;
          white-space: nowrap;
        }

        .cart-summary {
          background: #fff;
          border: 1px solid #e8e0d4;
          border-radius: 16px;
          padding: 20px;
          position: sticky;
          top: 80px;
        }
        .cart-summary-title { font-size: 18px; font-weight: 700; color: #1a1410; margin-bottom: 14px; }
        .cart-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          color: #6b5c4a;
          padding: 5px 0;
        }
        .cart-summary-divider { border: none; border-top: 1.5px solid #e8e0d4; margin: 10px 0 4px; }
        .cart-summary-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 17px;
          font-weight: 700;
          color: #1a1410;
          padding: 6px 0 0;
        }
        .cart-checkout-btn {
          width: 100%;
          background: #b8860b;
          color: #fff;
          border: none;
          border-radius: 999px;
          padding: 14px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          margin-top: 16px;
          font-family: inherit;
          transition: all .2s;
          letter-spacing: .02em;
          display: block;
        }
        .cart-checkout-btn:hover { background: #a07508; box-shadow: 0 4px 14px rgba(184,134,11,.3); }
        .cart-continue-link {
          display: block;
          text-align: center;
          margin-top: 12px;
          color: #6b5c4a;
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
        }
        .cart-continue-link:hover { color: #b8860b; }
        .shipping-note {
          font-size: 12px;
          color: #7a6050;
          text-align: center;
          margin-top: 10px;
          padding: 8px 10px;
          background: #fef9ed;
          border-radius: 8px;
          border: 1px solid #f0dcaa;
        }

        .cart-empty {
          max-width: 440px;
          margin: 60px auto;
          background: #fff;
          border: 1px solid #e8e0d4;
          border-radius: 20px;
          padding: 40px 28px;
          text-align: center;
        }
        .cart-empty-icon { font-size: 56px; line-height: 1; }
        .cart-empty-title {
          margin-top: 12px;
          font-family: 'Playfair Display', serif;
          font-size: clamp(22px, 5vw, 30px);
          color: #1a1410;
        }
        .cart-empty-desc { color: #6b5c4a; margin-top: 8px; font-size: 14px; line-height: 1.6; }
        .cart-empty-btn {
          display: inline-block;
          margin-top: 20px;
          background: #b8860b;
          color: #fff;
          text-decoration: none;
          padding: 13px 28px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 14px;
          transition: all .2s;
        }
        .cart-empty-btn:hover { background: #a07508; }

        @media (max-width: 768px) {
          .cart-layout { grid-template-columns: 1fr; }
          .cart-summary { position: static; order: -1; }
          .cart-item-price-desktop { display: none; }
          .cart-item-price-mobile { display: block; }
        }
        @media (max-width: 480px) {
          .cart-wrap { padding: 16px 12px; }
          .cart-item { padding: 12px 10px; gap: 10px; }
          .cart-item-img { width: 72px; height: 72px; border-radius: 10px; }
          .cart-item-name { font-size: 13px; }
          .cart-summary { padding: 16px; }
          .cart-checkout-btn { padding: 13px; font-size: 14px; }
          .cart-empty { padding: 32px 20px; margin: 40px auto; }
        }
        @media (max-width: 360px) {
          .cart-wrap { padding: 12px 10px; }
          .cart-item { padding: 10px 8px; gap: 8px; }
          .cart-item-img { width: 64px; height: 64px; }
          .cart-qty-btn { width: 30px; height: 30px; font-size: 16px; }
        }
      `}</style>

      <div className="cart-wrap">
        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">🛒</div>
            <h1 className="cart-empty-title">Your cart is empty</h1>
            <p className="cart-empty-desc">Looks like you haven&apos;t added any items yet.</p>
            <Link href="/products" className="cart-empty-btn">Browse Products</Link>
          </div>
        ) : (
          <>
            <h1 className="cart-title">Shopping Cart</h1>
            <div className="cart-layout">

              <div className="cart-items-col">
                {cartItems.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-img">
                      {item.image
                        ? <Image src={item.image} alt={item.name} fill style={{ objectFit: 'cover' }} />
                        : <div style={{ display: 'grid', placeItems: 'center', height: '100%', fontSize: 28 }}>📦</div>
                      }
                    </div>
                    <div className="cart-item-body">
                      <p className="cart-item-name">{item.name}</p>
                      <p className="cart-item-variant">
                        {[item.size ? `Size ${item.size}` : '', item.color ? `Color ${item.color}` : ''].filter(Boolean).join(' · ') || 'Standard'}
                      </p>
                      <p className="cart-item-price-mobile">₹{(item.price * item.quantity).toFixed(0)}</p>
                      <div className="cart-item-controls">
                        <button className="cart-qty-btn" onClick={() => updateQuantity(item.productId, item.quantity - 1)} aria-label="Decrease quantity">−</button>
                        <span className="cart-qty-num">{item.quantity}</span>
                        <button className="cart-qty-btn" onClick={() => updateQuantity(item.productId, item.quantity + 1)} aria-label="Increase quantity">+</button>
                        <button className="cart-remove-btn" onClick={() => removeItem(item.productId)}>Remove</button>
                      </div>
                    </div>
                    <div className="cart-item-price-desktop">₹{(item.price * item.quantity).toFixed(0)}</div>
                  </div>
                ))}
              </div>

              <aside className="cart-summary">
                <h2 className="cart-summary-title">Order Summary</h2>
                <div className="cart-summary-row">
                  <span>Subtotal</span>
                  <strong style={{ color: '#1a1410' }}>₹{subtotal.toFixed(0)}</strong>
                </div>
                <div className="cart-summary-row">
                  <span>Shipping</span>
                  <strong style={{ color: shipping === 0 ? '#15803d' : '#1a1410' }}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</strong>
                </div>
                <hr className="cart-summary-divider" />
                <div className="cart-summary-total">
                  <span>Total</span>
                  <span style={{ color: '#b8860b' }}>₹{total.toFixed(0)}</span>
                </div>
                {subtotal < 999 && (
                  <p className="shipping-note">Add ₹{(999 - subtotal).toFixed(0)} more for free shipping 🚚</p>
                )}
                <button className="cart-checkout-btn" onClick={() => router.push('/checkout')}>
                  Proceed to Checkout
                </button>
                <Link href="/products" className="cart-continue-link">← Continue Shopping</Link>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
