'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type PayMethod = 'card' | 'upi' | 'cod'

interface CartItem {
  id: string
  productId: string
  variantId?: string | null
  name: string
  variantLabel?: string
  size?: string
  color?: string
  sku?: string
  price: number
  quantity: number
  image: string
}

interface Order { id: string; order_number: string; total_amount: number; status: string }

const STEPS = ['Cart', 'Shipping', 'Payment', 'Review']

export default function CheckoutClient({ orders }: { orders: Order[] }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [processing, setProcessing] = useState(false)
  const [payMethod, setPayMethod] = useState<PayMethod>('card')
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', state: '', pin: '',
    cardNumber: '', cardExpiry: '', cardCvv: '', upiId: '',
  })

  // ── Coupon state ──
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discount_amount: number
    discount_type: string
    discount_value: number
  } | null>(null)
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)

  const setField = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem('cart')
      const items = saved ? JSON.parse(saved) : []
      if (!items?.length) return router.push('/cart')
      setCartItems(items)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: customer } = await supabase.from('customers').select('*').eq('id', user.id).maybeSingle()
      if (!customer) return

      setForm(prev => ({
        ...prev,
        firstName: customer.first_name || prev.firstName,
        lastName: customer.last_name || prev.lastName,
        email: customer.email || user.email || prev.email,
        phone: customer.phone || prev.phone,
        address: customer.home_address || customer.shipping_address?.address || prev.address,
        city: customer.city || customer.shipping_address?.city || prev.city,
        pin: customer.pincode || customer.shipping_address?.pincode || prev.pin,
      }))
    }
    init()
  }, [router])

  const subtotal = useMemo(() => cartItems.reduce((s, i) => s + i.price * i.quantity, 0), [cartItems])
  const shipping = subtotal > 999 ? 0 : 49

  // Price after coupon
  const { discountAmount, totalBeforeDiscount, finalTotal } = useMemo(() => {
    const beforeDiscount = subtotal + shipping
    const disc = appliedCoupon ? appliedCoupon.discount_amount : 0
    return {
      discountAmount: disc,
      totalBeforeDiscount: beforeDiscount,
      finalTotal: Math.max(0, beforeDiscount - disc),
    }
  }, [subtotal, shipping, appliedCoupon])

  // ── Apply coupon ──
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setValidatingCoupon(true)
    setCouponMsg(null)

    // Reset if same code re-applied
    if (appliedCoupon && appliedCoupon.code === couponCode.trim().toUpperCase()) {
      setAppliedCoupon(null)
      setCouponCode('')
      setValidatingCoupon(false)
      return
    }

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, orderTotal: subtotal + shipping }),
      })
      const data = await res.json()
      if (data.valid) {
        setAppliedCoupon({
          code: data.coupon_code,
          discount_amount: data.discount_amount,
          discount_type: data.discount_type,
          discount_value: data.discount_value,
        })
        setCouponMsg({ type: 'success', text: data.message })
        setCouponCode('')
      } else {
        setAppliedCoupon(null)
        setCouponMsg({ type: 'error', text: data.message })
      }
    } catch {
      setCouponMsg({ type: 'error', text: 'Failed to validate coupon' })
    }
    setValidatingCoupon(false)
  }

  // ── Remove applied coupon ──
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponMsg(null)
  }

  const placeOrder = async () => {
    setProcessing(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          shipping: {
            firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone,
            address: form.address, city: form.city, state: form.state, pincode: form.pin,
          },
          billing: { address: form.address, city: form.city, state: form.state, pincode: form.pin },
          notes: `Payment method: ${payMethod}`,
          coupon_code: appliedCoupon?.code || null,
          discount_amount: appliedCoupon?.discount_amount || 0,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json?.order?.order_number) {
        alert(json?.error || 'Failed to place order')
        setProcessing(false)
        return
      }
      localStorage.removeItem('cart')
      router.push(`/order-success?orderNumber=${encodeURIComponent(json.order.order_number)}`)
    } catch {
      alert('Unable to place order right now')
      setProcessing(false)
    }
  }

  if (!cartItems.length) return null

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', fontFamily: "'DM Sans', sans-serif", color: '#1a1410' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
      .input{width:100%;padding:11px 12px;border:1.5px solid #d4c8b8;border-radius:10px;font-size:max(16px,1em);font-family:inherit;outline:none;transition:border-color .2s;background:#fff}
      .input:focus{border-color:#b8860b;box-shadow:0 0 0 3px rgba(184,134,11,.1)}
      .btn{background:#b8860b;color:#fff;border:none;border-radius:999px;padding:12px 20px;font-weight:700;cursor:pointer;font-family:inherit;font-size:14px;white-space:nowrap;transition:all .2s}
      .btn:hover:not(:disabled){background:#a07508}
      .btn:disabled{opacity:.5;cursor:not-allowed}
      .ghost{background:#fff;border:1.5px solid #d4c8b8;color:#6b5c4a}
      .ghost:hover:not(:disabled){border-color:#b8860b;color:#b8860b;background:#fef9ed}
      .card{background:#fff;border:1px solid #e8e0d4;border-radius:16px}
      .pay{border:1.5px solid #d4c8b8;border-radius:12px;padding:14px 16px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:600;color:#1a1410;transition:all .2s;text-align:left;width:100%;text-transform:uppercase;letter-spacing:.04em;background:#fff}
      .pay.active{border-color:#b8860b;background:#fef9ed;color:#b8860b}
      .ship-form{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
      .ship-form-full{grid-column:1/-1}
      .btn-row{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}
      .btn-row .btn{flex:1;min-width:120px;justify-content:center;display:inline-flex;align-items:center}
      @media(max-width:860px){
        .grid{grid-template-columns:1fr!important}
        .sticky{position:static!important}
      }
      @media(max-width:600px){
        .ship-form{grid-template-columns:1fr}
        .ship-form-full{grid-column:auto}
        .btn-row{flex-direction:column}
        .btn-row .btn{width:100%;min-width:unset;text-align:center;justify-content:center}
      }
      @media(max-width:480px){
        .pay{padding:12px 14px;font-size:13px}
        .card{padding:16px!important}
      }
      .cpn-input{flex:1;padding:10px 12px;border:1.5px solid #d4c8b8;border-radius:8px;font-size:max(16px,1em);font-family:monospace;text-transform:uppercase;outline:none}
      .cpn-input:focus{border-color:#b8860b}
      .cpn-applied{background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:10px 14px}
      `}</style>

      <header style={{ background: '#fff', borderBottom: '1px solid #e8e0d4', padding: '0 20px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none', fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#b8860b', fontWeight: 900 }}>Shafa</Link>
          <div style={{ display: 'flex', gap: 10 }}>{STEPS.map((s, i) => <span key={s} style={{ fontSize: 12, fontWeight: i===step?700:500, color: i<=step?'#1a1410':'#a89880' }}>{i+1}. {s}</span>)}</div>
        </div>
      </header>

      <div className="grid" style={{ maxWidth: 1160, margin: '0 auto', padding: 20, display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          {step === 0 && (
            <>
              <h2>Cart Review</h2>
              <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                {cartItems.map(item => <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee2d2', paddingBottom: 8 }}><span>{item.name} × {item.quantity}</span><strong>₹{(item.price*item.quantity).toFixed(0)}</strong></div>)}
              </div>
              <button className="btn" style={{ marginTop: 16 }} onClick={() => setStep(1)}>Continue to Shipping</button>
            </>
          )}

          {step === 1 && (
            <>
              <h2>Shipping Details</h2>
              <div className="ship-form">
                <input className="input" placeholder="First name" value={form.firstName} onChange={e => setField('firstName', e.target.value)} />
                <input className="input" placeholder="Last name" value={form.lastName} onChange={e => setField('lastName', e.target.value)} />
                <input className="input" placeholder="Email" type="email" value={form.email} onChange={e => setField('email', e.target.value)} />
                <input className="input" placeholder="Phone" type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} />
                <input className="input ship-form-full" placeholder="Address" value={form.address} onChange={e => setField('address', e.target.value)} />
                <input className="input" placeholder="City" value={form.city} onChange={e => setField('city', e.target.value)} />
                <input className="input" placeholder="State" value={form.state} onChange={e => setField('state', e.target.value)} />
                <input className="input" placeholder="PIN code" type="tel" inputMode="numeric" value={form.pin} onChange={e => setField('pin', e.target.value)} />
              </div>
              <div className="btn-row">
                <button className="btn ghost" onClick={() => setStep(0)}>Back</button>
                <button className="btn" onClick={() => setStep(2)} disabled={!form.firstName || !form.email || !form.phone || !form.address}>Continue to Payment</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Payment Method</h2>
              <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                {(['card', 'upi', 'cod'] as PayMethod[]).map(m => (
                  <button key={m} className={`pay ${payMethod===m?'active':''}`} onClick={() => setPayMethod(m)}>
                    {m === 'card' ? '💳 Credit / Debit Card' : m === 'upi' ? '📱 UPI' : '💵 Cash on Delivery'}
                  </button>
                ))}
              </div>
              {payMethod === 'card' && (
                <div className="ship-form" style={{ marginTop: 12 }}>
                  <input className="input" placeholder="Card number" inputMode="numeric" value={form.cardNumber} onChange={e => setField('cardNumber', e.target.value)} />
                  <input className="input" placeholder="Expiry MM/YY" value={form.cardExpiry} onChange={e => setField('cardExpiry', e.target.value)} />
                </div>
              )}
              {payMethod === 'upi' && <input className="input" style={{ marginTop: 12 }} placeholder="UPI ID (e.g. name@upi)" value={form.upiId} onChange={e => setField('upiId', e.target.value)} />}
              <div className="btn-row">
                <button className="btn ghost" onClick={() => setStep(1)}>Back</button>
                <button className="btn" onClick={() => setStep(3)}>Review Order</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Review & Place Order</h2>
              <p style={{ marginTop: 8, color: '#6b5c4a' }}>{form.firstName} {form.lastName} · {form.phone}</p>
              <p style={{ color: '#6b5c4a' }}>{form.address}, {form.city}, {form.state} - {form.pin}</p>
              <p style={{ marginTop: 8, color: '#6b5c4a' }}>Payment: {payMethod.toUpperCase()}</p>
              {appliedCoupon && (
                <div className="cpn-applied" style={{ marginTop: 8 }}>
                  <span style={{ fontWeight: 700, color: '#15803d' }}>✓ {appliedCoupon.code}</span>
                  <span style={{ marginLeft: 8, color: '#15803d' }}>−₹{appliedCoupon.discount_amount.toFixed(0)}</span>
                </div>
              )}
              <div className="btn-row">
                <button className="btn ghost" onClick={() => setStep(2)}>Back</button>
                <button className="btn" onClick={placeOrder} disabled={processing}>
                  {processing ? 'Placing Order...' : `Place Order · ₹${finalTotal.toFixed(0)}`}
                </button>
              </div>
            </>
          )}
        </div>

        <aside className="card sticky" style={{ padding: 18, position: 'sticky', top: 80, height: 'fit-content' }}>
          <h3 style={{ marginBottom: 10 }}>Order Summary</h3>
          {cartItems.map(item => <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}><span>{item.name} × {item.quantity}</span><span>₹{(item.price*item.quantity).toFixed(0)}</span></div>)}

          <hr style={{ border: 0, borderTop: '1px solid #eee2d2', margin: '10px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><strong>₹{subtotal.toFixed(0)}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Shipping</span><strong>{shipping===0?'FREE':`₹${shipping}`}</strong></div>

          {/* Coupon section */}
          <div style={{ margin: '12px 0', padding: '12px 0', borderTop: '1px solid #eee2d2', borderBottom: '1px solid #eee2d2' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6b5c4a', marginBottom: 6 }}>Have a coupon?</div>

            {appliedCoupon ? (
              <div className="cpn-applied">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: 13, color: '#15803d' }}>{appliedCoupon.code}</span>
                    <span style={{ fontSize: 12, color: '#15803d', marginLeft: 6 }}>
                      {appliedCoupon.discount_type === 'percentage'
                        ? `(${appliedCoupon.discount_value}% off)`
                        : `(₹${appliedCoupon.discount_value} off)`}
                    </span>
                  </div>
                  <button onClick={handleRemoveCoupon} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 16, padding: '0 4px' }} title="Remove">✕</button>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d', marginTop: 4 }}>
                  −₹{appliedCoupon.discount_amount.toFixed(0)}
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="cpn-input"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={e => { if (e.key === 'Enter') handleApplyCoupon() }}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                    style={{
                      padding: '10px 14px', background: '#b8860b', color: '#fff', border: 'none',
                      borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                      opacity: validatingCoupon || !couponCode.trim() ? 0.6 : 1,
                    }}
                  >
                    {validatingCoupon ? '...' : 'Apply'}
                  </button>
                </div>
                {couponMsg && (
                  <div style={{
                    fontSize: 12, marginTop: 6, padding: '6px 10px', borderRadius: 6,
                    fontWeight: 600,
                    background: couponMsg.type === 'success' ? '#f0fdf4' : '#fff1f1',
                    color: couponMsg.type === 'success' ? '#15803d' : '#b42318',
                  }}>
                    {couponMsg.text}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Totals */}
          {appliedCoupon && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b5c4a', fontSize: 13 }}>
              <span>Subtotal + Shipping</span>
              <span>₹{totalBeforeDiscount.toFixed(0)}</span>
            </div>
          )}
          {appliedCoupon && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', fontSize: 13 }}>
              <span>Discount ({appliedCoupon.code})</span>
              <strong>−₹{discountAmount.toFixed(0)}</strong>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 18 }}>
            <strong>Total</strong>
            <strong style={{ color: appliedCoupon ? '#15803d' : '#b8860b' }}>
              ₹{finalTotal.toFixed(0)}
              {appliedCoupon && <span style={{ fontSize: 11, color: '#999', fontWeight: 500, display: 'block', textAlign: 'right' }}>(incl. discount)</span>}
            </strong>
          </div>

          {orders?.length > 0 && <div style={{ marginTop: 12, fontSize: 12, color: '#6b5c4a' }}>Recent order: {orders[0].order_number}</div>}
        </aside>
      </div>
    </div>
  )
}