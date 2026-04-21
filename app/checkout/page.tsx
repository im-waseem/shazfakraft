'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CartItem { id: string; productId: string; name: string; price: number; quantity: number; image: string }

const steps = ['Cart', 'Shipping', 'Payment', 'Confirm']

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [step, setStep] = useState(1)
  const [processing, setProcessing] = useState(false)
  const [payMethod, setPayMethod] = useState<'card' | 'upi' | 'cod'>('card')
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '', city: '', state: '', pin: '', cardNumber: '', cardExpiry: '', cardCvv: '', upiId: '' })
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('cart')
    if (saved) {
      const items = JSON.parse(saved)
      if (!items.length) router.push('/cart')
      setCartItems(items)
    } else router.push('/cart')
  }, [router])

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const shipping = subtotal > 499 ? 0 : 49
  const total = subtotal + shipping

  const handleOrder = async () => {
    setProcessing(true)
    await new Promise(r => setTimeout(r, 1800))
    localStorage.removeItem('cart')
    router.push('/order-success')
  }

  if (!cartItems.length) return null

  return (
    <div style={{ minHeight: '100vh', background: '#fffbf5', fontFamily: "'Nunito', sans-serif", color: '#1c1410' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Nunito:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        :root{--gold:#c8860a;--gold-pale:#fef3d8;--warm:#fdf3e3;--text:#1c1410;--text-2:#5a4a3a;--text-3:#9a8a7a;--border:#ecdcc8;--border-2:#dccaaa;}
        .f-input{width:100%;padding:12px 14px;border:1.5px solid var(--border-2);border-radius:10px;font-size:14px;font-family:inherit;outline:none;color:var(--text);background:#fff;transition:border .2s}
        .f-input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(200,134,10,.1)}
        .f-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--text-3);display:block;margin-bottom:6px}
        .pay-opt{border:2px solid var(--border-2);border-radius:14px;padding:14px 18px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:12px;background:#fff}
        .pay-opt.active{border-color:var(--gold);background:var(--gold-pale)}
        .pay-opt:hover{border-color:var(--gold)}
        .next-btn{width:100%;background:var(--gold);color:#fff;border:none;border-radius:50px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;letter-spacing:.04em;transition:background .2s;margin-top:24px}
        .next-btn:hover{background:#e09a20}
        .next-btn:disabled{opacity:.5;cursor:not-allowed}
        .step-num{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0}
        @media(max-width:820px){.chk-grid{grid-template-columns:1fr!important}.order-sum{position:static!important}}
      `}</style>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none', fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: 'var(--gold)' }}>Shafa</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {steps.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="step-num" style={{ background: i <= step ? 'var(--gold)' : 'var(--warm)', color: i <= step ? '#fff' : 'var(--text-3)', border: `2px solid ${i <= step ? 'var(--gold)' : 'var(--border-2)'}` }}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: i === step ? 'var(--text)' : 'var(--text-3)', display: window?.innerWidth > 480 ? 'block' : 'none' }}>{s}</span>
                </div>
                {i < steps.length - 1 && <div style={{ width: 32, height: 2, background: i < step ? 'var(--gold)' : 'var(--border-2)', margin: '0 8px' }} />}
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="chk-grid" style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(20px,4vw,40px) 20px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'start' }}>

        {/* Form */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 20, padding: 'clamp(20px,4vw,32px)' }}>
          {step === 1 && (
            <>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Shipping Information</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {[['firstName', 'First Name', 'text'], ['lastName', 'Last Name', 'text']].map(([k, l, t]) => (
                  <div key={k}><label className="f-label">{l} *</label><input className="f-input" type={t} value={(form as any)[k]} onChange={e => set(k, e.target.value)} required /></div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {[['email', 'Email Address', 'email'], ['phone', 'Phone Number', 'tel']].map(([k, l, t]) => (
                  <div key={k}><label className="f-label">{l} *</label><input className="f-input" type={t} value={(form as any)[k]} onChange={e => set(k, e.target.value)} required /></div>
                ))}
              </div>
              <div style={{ marginBottom: 16 }}><label className="f-label">Street Address *</label><input className="f-input" type="text" value={form.address} onChange={e => set('address', e.target.value)} placeholder="House no., street, area" required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                {[['city', 'City'], ['state', 'State'], ['pin', 'PIN Code']].map(([k, l]) => (
                  <div key={k}><label className="f-label">{l} *</label><input className="f-input" type="text" value={(form as any)[k]} onChange={e => set(k, e.target.value)} required /></div>
                ))}
              </div>
              <button className="next-btn" onClick={() => setStep(2)} disabled={!form.firstName || !form.email || !form.phone || !form.address}>
                Continue to Payment →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Payment Method</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {([['card', '💳', 'Credit / Debit Card'], ['upi', '📱', 'UPI Payment'], ['cod', '💵', 'Cash on Delivery']] as const).map(([id, icon, label]) => (
                  <div key={id} className={`pay-opt ${payMethod === id ? 'active' : ''}`} onClick={() => setPayMethod(id)}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${payMethod === id ? 'var(--gold)' : 'var(--border-2)'}`, background: payMethod === id ? 'var(--gold)' : '#fff', flexShrink: 0 }} />
                    <span style={{ fontSize: 20 }}>{icon}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
                  </div>
                ))}
              </div>

              {payMethod === 'card' && (
                <div style={{ background: 'var(--warm)', borderRadius: 14, padding: '20px', border: '1px solid var(--border)' }}>
                  <div style={{ marginBottom: 14 }}><label className="f-label">Card Number</label><input className="f-input" type="text" value={form.cardNumber} onChange={e => set('cardNumber', e.target.value)} placeholder="0000 0000 0000 0000" maxLength={19} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div><label className="f-label">Expiry</label><input className="f-input" type="text" value={form.cardExpiry} onChange={e => set('cardExpiry', e.target.value)} placeholder="MM / YY" /></div>
                    <div><label className="f-label">CVV</label><input className="f-input" type="text" value={form.cardCvv} onChange={e => set('cardCvv', e.target.value)} placeholder="•••" maxLength={4} /></div>
                  </div>
                </div>
              )}
              {payMethod === 'upi' && (
                <div style={{ background: 'var(--warm)', borderRadius: 14, padding: '20px', border: '1px solid var(--border)' }}>
                  <label className="f-label">UPI ID</label>
                  <input className="f-input" type="text" value={form.upiId} onChange={e => set('upiId', e.target.value)} placeholder="yourname@upi" />
                </div>
              )}
              {payMethod === 'cod' && (
                <div style={{ background: 'var(--warm)', borderRadius: 14, padding: '20px', border: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 22 }}>ℹ️</span>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>Pay ₹{total.toFixed(0)} in cash when your order is delivered. ₹20 COD fee applies.</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, background: '#fff', border: '1.5px solid var(--border-2)', borderRadius: 50, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-2)' }}>← Back</button>
                <button className="next-btn" style={{ flex: 2, marginTop: 0 }} onClick={() => setStep(3)}>Review Order →</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Review Your Order</h2>
              <div style={{ background: 'var(--warm)', borderRadius: 14, padding: 18, marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>Delivering to</p>
                <p style={{ fontWeight: 600, fontSize: 15 }}>{form.firstName} {form.lastName}</p>
                <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>{form.address}, {form.city}, {form.state} – {form.pin}</p>
                <p style={{ color: 'var(--text-2)', fontSize: 13 }}>{form.phone} · {form.email}</p>
              </div>
              <div style={{ background: 'var(--warm)', borderRadius: 14, padding: 18, marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>Payment</p>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{payMethod === 'card' ? `Card ending ••••${form.cardNumber.slice(-4) || '----'}` : payMethod === 'upi' ? `UPI: ${form.upiId || '—'}` : 'Cash on Delivery'}</p>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, background: '#fff', border: '1.5px solid var(--border-2)', borderRadius: 50, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-2)' }}>← Back</button>
                <button className="next-btn" style={{ flex: 2, marginTop: 0 }} onClick={handleOrder} disabled={processing}>
                  {processing ? <span>⏳ Placing Order…</span> : `Place Order · ₹${total.toFixed(0)}`}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Order Summary */}
        <div className="order-sum" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 20, padding: 24, position: 'sticky', top: 80 }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, marginBottom: 18 }}>Order Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
            {cartItems.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--warm)', flexShrink: 0, overflow: 'hidden' }}>
                    {item.image && <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Qty {item.quantity}</p>
                  </div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, flexShrink: 0 }}>₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 13, color: 'var(--text-2)' }}>Subtotal</span><span style={{ fontSize: 13, fontWeight: 600 }}>₹{subtotal.toFixed(0)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 13, color: 'var(--text-2)' }}>Shipping</span><span style={{ fontSize: 13, fontWeight: 600, color: shipping === 0 ? '#5a8a40' : 'var(--text)' }}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)', marginTop: 4 }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700 }}>Total</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>₹{total.toFixed(0)}</span>
            </div>
          </div>
          <div style={{ marginTop: 20, padding: '12px', background: 'var(--gold-pale)', borderRadius: 10, border: '1px solid #e8d089' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)', textAlign: 'center' }}>🔒 256-bit SSL Secured Checkout</p>
          </div>
        </div>
      </div>
    </div>
  )
}