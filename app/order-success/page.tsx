'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function OrderSuccessPage() {
  const [visible, setVisible] = useState(false)
  const orderNo = `SHF-${Date.now().toString().slice(-6)}`

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  const steps = [
    { icon: '✅', label: 'Order Placed', done: true },
    { icon: '📦', label: 'Packing', done: false },
    { icon: '🚚', label: 'Out for Delivery', done: false },
    { icon: '🏠', label: 'Delivered', done: false },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#fffbf5', fontFamily: "'Nunito', sans-serif", color: '#1c1410', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Nunito:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        :root{--gold:#c8860a;--gold-pale:#fef3d8;--warm:#fdf3e3;--text:#1c1410;--text-2:#5a4a3a;--text-3:#9a8a7a;--border:#ecdcc8;}
        .pop-in{opacity:0;transform:scale(.88) translateY(20px);transition:opacity .6s cubic-bezier(.4,0,.2,1),transform .6s cubic-bezier(.4,0,.2,1)}
        .pop-in.in{opacity:1;transform:scale(1) translateY(0)}
        .pop-in.d1{transition-delay:.1s}.pop-in.d2{transition-delay:.25s}.pop-in.d3{transition-delay:.4s}.pop-in.d4{transition-delay:.55s}
        .confetti{position:absolute;width:8px;height:8px;border-radius:2px;animation:fall linear forwards}
        @keyframes fall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
        .track-line{height:3px;background:var(--border);flex:1;position:relative;overflow:hidden}
        .track-fill{position:absolute;left:0;top:0;height:100%;background:var(--gold);width:0%;transition:width 1.2s ease .8s}
        .track-fill.done{width:100%}
      `}</style>

      {/* Confetti */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {[...Array(18)].map((_, i) => (
          <div key={i} className="confetti" style={{
            left: `${Math.random() * 100}%`,
            background: ['#c8860a', '#e8d089', '#6b7c5c', '#c04e2a', '#fef3d8'][i % 5],
            animationDuration: `${2.5 + Math.random() * 3}s`,
            animationDelay: `${Math.random() * 1.5}s`,
          }} />
        ))}
      </div>

      <header style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none', fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: 'var(--gold)' }}>Shafa</Link>
          <nav style={{ display: 'flex', gap: 20 }}>
            {[['/', 'Home'], ['/products', 'Products']].map(([h, l]) => (
              <Link key={h} href={h} style={{ color: 'var(--text-2)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>{l}</Link>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 720, margin: '0 auto', padding: 'clamp(32px,6vw,72px) 20px', width: '100%', position: 'relative', zIndex: 1 }}>

        {/* Success icon */}
        <div className={`pop-in ${visible ? 'in' : ''}`} style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg,#e8f5e0,#c8e6b8)', border: '3px solid #7ab850', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 44, boxShadow: '0 8px 32px rgba(122,184,80,.25)' }}>
            ✓
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
            Order Placed!
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.7, maxWidth: 440, margin: '0 auto' }}>
            JazakAllah khair for your order. We've received it and will start processing soon.
          </p>
        </div>

        {/* Order detail card */}
        <div className={`pop-in d1 ${visible ? 'in' : ''}`} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 20, padding: 'clamp(20px,4vw,32px)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, paddingBottom: 20, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4 }}>Order Number</p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: 'var(--gold)' }}>{orderNo}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4 }}>Expected Delivery</p>
              <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                {new Date(Date.now() + 4 * 86400000).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 16 }}>
            {[['📧', 'Confirmation', 'Sent to your email'], ['🚚', 'Shipping', 'In 1-2 business days'], ['📍', 'Tracking', 'SMS on dispatch']].map(([icon, title, sub]) => (
              <div key={title} style={{ background: 'var(--warm)', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>{title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Order tracking bar */}
        <div className={`pop-in d2 ${visible ? 'in' : ''}`} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 20, padding: 'clamp(20px,4vw,28px)', marginBottom: 24 }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Order Progress</h3>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {steps.map((s, i) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: s.done ? 'var(--gold-pale)' : 'var(--warm)', border: `2px solid ${s.done ? 'var(--gold)' : 'var(--border-2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 20 }}>{s.icon}</div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: s.done ? 'var(--gold)' : 'var(--text-3)', whiteSpace: 'nowrap' }}>{s.label}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="track-line" style={{ margin: '0 4px', marginBottom: 22 }}>
                    <div className={`track-fill ${visible ? 'done' : ''}`} style={{ width: i === 0 ? undefined : '0%' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className={`pop-in d3 ${visible ? 'in' : ''}`} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/" style={{ flex: 1, minWidth: 160, display: 'block', background: 'var(--gold)', color: '#fff', padding: '14px 24px', borderRadius: 50, fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center', letterSpacing: '.04em' }}>
            Continue Shopping
          </Link>
          <Link href="/orders" style={{ flex: 1, minWidth: 160, display: 'block', background: '#fff', color: 'var(--text)', padding: '14px 24px', borderRadius: 50, fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center', border: '1.5px solid var(--border-2)' }}>
            View My Orders
          </Link>
        </div>

        {/* Thank you */}
        <div className={`pop-in d4 ${visible ? 'in' : ''}`} style={{ textAlign: 'center', marginTop: 40 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: 'italic', color: 'var(--text-3)' }}>"Every good deed is rewarded. Thank you for trusting Shafa."</p>
        </div>
      </main>
    </div>
  )
}