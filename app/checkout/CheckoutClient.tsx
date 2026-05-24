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
  const total = subtotal + shipping

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
      .input{width:100%;padding:11px 12px;border:1.5px solid #d4c8b8;border-radius:10px}.btn{background:#b8860b;color:#fff;border:none;border-radius:999px;padding:12px 18px;font-weight:700;cursor:pointer}
      .ghost{background:#fff;border:1.5px solid #d4c8b8;color:#6b5c4a}.card{background:#fff;border:1px solid #e8e0d4;border-radius:16px}
      .pay{border:1.5px solid #d4c8b8;border-radius:12px;padding:12px;cursor:pointer}.pay.active{border-color:#b8860b;background:#fef9ed}
      @media(max-width:860px){.grid{grid-template-columns:1fr!important}.sticky{position:static!important}}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                <input className="input" placeholder="First name" value={form.firstName} onChange={e => setField('firstName', e.target.value)} />
                <input className="input" placeholder="Last name" value={form.lastName} onChange={e => setField('lastName', e.target.value)} />
                <input className="input" placeholder="Email" value={form.email} onChange={e => setField('email', e.target.value)} />
                <input className="input" placeholder="Phone" value={form.phone} onChange={e => setField('phone', e.target.value)} />
                <input className="input" placeholder="Address" style={{ gridColumn: '1 / -1' }} value={form.address} onChange={e => setField('address', e.target.value)} />
                <input className="input" placeholder="City" value={form.city} onChange={e => setField('city', e.target.value)} />
                <input className="input" placeholder="State" value={form.state} onChange={e => setField('state', e.target.value)} />
                <input className="input" placeholder="PIN" value={form.pin} onChange={e => setField('pin', e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn ghost" onClick={() => setStep(0)}>Back</button>
                <button className="btn" onClick={() => setStep(2)} disabled={!form.firstName || !form.email || !form.phone || !form.address}>Continue to Payment</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Payment Method</h2>
              <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                {(['card', 'upi', 'cod'] as PayMethod[]).map(m => <div key={m} className={`pay ${payMethod===m?'active':''}`} onClick={() => setPayMethod(m)}>{m.toUpperCase()}</div>)}
              </div>
              {payMethod === 'card' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}><input className="input" placeholder="Card number" value={form.cardNumber} onChange={e => setField('cardNumber', e.target.value)} /><input className="input" placeholder="Expiry" value={form.cardExpiry} onChange={e => setField('cardExpiry', e.target.value)} /></div>}
              {payMethod === 'upi' && <input className="input" style={{ marginTop: 10 }} placeholder="UPI ID" value={form.upiId} onChange={e => setField('upiId', e.target.value)} />}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
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
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn ghost" onClick={() => setStep(2)}>Back</button>
                <button className="btn" onClick={placeOrder} disabled={processing}>{processing ? 'Placing Order...' : `Place Order · ₹${total.toFixed(0)}`}</button>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 18 }}><strong>Total</strong><strong style={{ color: '#b8860b' }}>₹{total.toFixed(0)}</strong></div>
          {orders?.length > 0 && <div style={{ marginTop: 12, fontSize: 12, color: '#6b5c4a' }}>Recent order: {orders[0].order_number}</div>}
        </aside>
      </div>
    </div>
  )
}
