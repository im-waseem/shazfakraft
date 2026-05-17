'use client'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────
interface CustomerForm {
  first_name: string
  last_name: string
  email: string
  phone: string
  home_address: string
  city: string
  pincode: string
  avatar_color: string
}
interface Order {
  id: string
  order_number: string
  total_amount: number
  status: string
  created_at: string
  shipping_address?: { address?: string; city?: string; pincode?: string }
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string; icon: string }> = {
  pending:    { bg: '#fdf4ff', text: '#7e22ce', dot: '#a855f7', label: 'Pending',    icon: '🕐' },
  captured:   { bg: '#eff6ff', text: '#1e40af', dot: '#3b82f6', label: 'Captured',   icon: '💳' },
  processing: { bg: '#fefce8', text: '#a16207', dot: '#eab308', label: 'Processing', icon: '⚙️' },
  confirmed:  { bg: '#f0fdf4', text: '#166534', dot: '#4ade80', label: 'Confirmed',  icon: '✅' },
  shipped:    { bg: '#e0f2fe', text: '#0369a1', dot: '#0ea5e9', label: 'Shipped',    icon: '🚚' },
  delivered:  { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e', label: 'Delivered',  icon: '📦' },
  cancelled:  { bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444', label: 'Cancelled',  icon: '❌' },
  refunded:   { bg: '#fdf2f8', text: '#9d174d', dot: '#ec4899', label: 'Refunded',   icon: '↩️' },
}
const STATUS_FLOW   = ['pending', 'captured', 'processing', 'confirmed', 'shipped', 'delivered']
const AVATAR_COLORS = ['#c8860a', '#c04e2a', '#6b7c5c', '#1d4ed8', '#7e22ce', '#be185d']
const FIELDS: { key: keyof CustomerForm; label: string; placeholder: string; type?: string; full?: boolean }[] = [
  { key: 'first_name',   label: 'First Name', placeholder: 'Waseem'           },
  { key: 'last_name',    label: 'Last Name',  placeholder: 'Akram'             },
  { key: 'email',        label: 'Email',      placeholder: 'you@example.com', type: 'email', full: true },
  { key: 'phone',        label: 'Phone',      placeholder: '+91 98765 43210', type: 'tel'   },
  { key: 'home_address', label: 'Address',    placeholder: '12, MG Road',     full: true    },
  { key: 'city',         label: 'City',       placeholder: 'Bangalore'         },
  { key: 'pincode',      label: 'Pincode',    placeholder: '560001'            },
]

function getStatusStyle(status: string) {
  return STATUS_CONFIG[status?.toLowerCase()] ?? { bg: '#f5f5f5', text: '#555', dot: '#999', label: status || 'Unknown', icon: '•' }
}
function getStatusStep(status: string) {
  return STATUS_FLOW.indexOf(status?.toLowerCase())
}

// ═════════════════════════════════════════════════════════════════════════════
export default function ProfilePage() {
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [user,          setUser]          = useState<any>(null)
  const [orders,        setOrders]        = useState<Order[]>([])
  const [profileOpen,   setProfileOpen]   = useState(false)
  const [toast,         setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [activeTab,     setActiveTab]     = useState<'profile' | 'orders'>('profile')
  const [liveOrderId,   setLiveOrderId]   = useState<string | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [form, setForm] = useState<CustomerForm>({
    first_name: '', last_name: '', email: '', phone: '',
    home_address: '', city: '', pincode: '', avatar_color: AVATAR_COLORS[0],
  })

  const supabase = createClient()
  const modalRef = useRef<HTMLDivElement>(null)
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user: u } } = await supabase.auth.getUser()
        setUser(u)
        if (!u) { setLoading(false); return }

        const [{ data: customer, error: ce }, { data: userOrders, error: oe }] = await Promise.all([
          supabase.from('customers').select('*').eq('id', u.id).maybeSingle(),
          supabase.from('orders')
            .select('id, order_number, total_amount, status, created_at, shipping_address')
            .eq('user_id', u.id)
            .order('created_at', { ascending: false }),
        ])

        if (ce) console.error('Customer fetch error:', ce.message)
        if (oe) console.error('Orders fetch error:', oe.message)

        setForm({
          first_name:   customer?.first_name   ?? '',
          last_name:    customer?.last_name    ?? '',
          email:        customer?.email        ?? u.email ?? '',
          phone:        customer?.phone        ?? '',
          home_address: customer?.home_address ?? (customer?.shipping_address as any)?.address ?? '',
          city:         customer?.city         ?? (customer?.shipping_address as any)?.city    ?? '',
          pincode:      customer?.pincode      ?? (customer?.shipping_address as any)?.pincode ?? '',
          avatar_color: customer?.avatar_color ?? AVATAR_COLORS[0],
        })
        setOrders(userOrders ?? [])
      } catch (err) {
        console.error('Load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Realtime: admin order updates ─────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`profile-orders-${user.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as Order
          setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))
          setLiveOrderId(updated.id)
          setExpandedOrder(updated.id)
          setTimeout(() => setLiveOrderId(null), 5000)
          setActiveTab('orders')
          const s = getStatusStyle(updated.status)
          showToast(`${s.icon} Order ${updated.order_number} is now ${s.label}`)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  // ── Modal outside click ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setProfileOpen(false); setDeleteConfirm(false)
      }
    }
    if (profileOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [profileOpen])

  // ── Scroll lock ───────────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = profileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [profileOpen])

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 4500)
  }

  // ── Save profile ──────────────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!user) return
    setSaving(true)
    try {
      const addressObj = { address: form.home_address, city: form.city, pincode: form.pincode }

      // ✅ Only columns guaranteed to exist after running fix_customers_schema.sql
      const { error } = await supabase.from('customers').upsert({
        id:               user.id,
        first_name:       form.first_name   || null,
        last_name:        form.last_name    || null,
        email:            form.email        || null,
        phone:            form.phone        || null,
        home_address:     form.home_address || null,
        city:             form.city         || null,
        pincode:          form.pincode      || null,
        avatar_color:     form.avatar_color,
        shipping_address: addressObj,
        billing_address:  addressObj,
        is_active:        true,
        updated_at:       new Date().toISOString(),
      }, { onConflict: 'id' })

      if (error) {
        console.error('Supabase upsert error:', error)
        showToast(error.message || 'Save failed — check console', 'error')
        return
      }

      showToast('Profile saved ✓')
      setProfileOpen(false)
    } catch (err: any) {
      console.error('saveProfile exception:', err)
      showToast(err?.message || 'Unexpected error', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete account ────────────────────────────────────────────────────────
  const deleteAccount = async () => {
    if (!user) return
    setDeleting(true)
    try {
      await supabase.from('customers').delete().eq('id', user.id)
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (err) {
      console.error('Delete error:', err)
      setDeleting(false)
    }
  }

  const initials = [form.first_name, form.last_name]
    .filter(Boolean).map(s => s[0].toUpperCase()).join('')
    || user?.email?.[0]?.toUpperCase() || '?'
  const fullName = [form.first_name, form.last_name].filter(Boolean).join(' ') || 'Your Profile'

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', background: '#fffbf5' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, margin: '0 auto 12px', border: '3px solid #e8d5b0', borderTop: '3px solid #c8860a', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: '#c8860a', fontSize: 14 }}>Loading profile…</p>
      </div>
    </div>
  )

  if (!user) return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', background: '#fffbf5' }}>
      <div style={{ textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Please sign in</p>
        <p style={{ color: '#9a8a7a', marginBottom: 20 }}>You need to be logged in to view your profile.</p>
        <Link href="/login" style={{ background: '#c8860a', color: '#fff', padding: '12px 28px', borderRadius: 50, textDecoration: 'none', fontWeight: 700 }}>Sign In</Link>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Nunito:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box}
        :root{
          --gold:#c8860a;--gold-pale:#fef3d8;--warm:#fdf3e3;--cream:#fffbf5;
          --border:#ecdcc8;--text:#1c1410;--t2:#5a4a3a;--t3:#9a8a7a;
        }
        .prof-page{min-height:100vh;background:var(--cream);font-family:'Nunito',sans-serif;color:var(--text)}
        .hero-card{background:linear-gradient(135deg,#1c1410 0%,#3a2510 60%,#7c4e1a 100%);padding:40px 24px 80px;position:relative;overflow:hidden}
        .hero-card::before{content:'';position:absolute;top:-60px;right:-60px;width:220px;height:220px;border-radius:50%;background:rgba(200,134,10,.15)}
        .hero-card::after{content:'';position:absolute;bottom:-40px;left:-40px;width:160px;height:160px;border-radius:50%;background:rgba(200,134,10,.08)}
        .avatar-lg{width:84px;height:84px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff;border:4px solid rgba(255,255,255,.25);flex-shrink:0}
        .content-wrap{max-width:900px;margin:-52px auto 40px;padding:0 16px;position:relative;z-index:2}
        .main-card{background:#fff;border-radius:20px;box-shadow:0 16px 48px rgba(28,20,16,.10);overflow:hidden}
        .tabs{display:flex;border-bottom:1px solid var(--border)}
        .tab-btn{flex:1;padding:14px;font-family:inherit;font-size:14px;font-weight:600;background:none;border:none;cursor:pointer;color:var(--t3);border-bottom:2px solid transparent;transition:all .2s;margin-bottom:-1px}
        .tab-btn.active{color:var(--gold);border-bottom-color:var(--gold)}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:24px}
        @media(max-width:540px){.info-grid{grid-template-columns:1fr;padding:16px}}
        .info-chip{background:var(--warm);border-radius:10px;padding:12px 14px}
        .info-chip label{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--t3);display:block;margin-bottom:4px}
        .info-chip p{font-size:14px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .info-chip.full{grid-column:1/-1}
        .order-card{border:1.5px solid var(--border);border-radius:14px;margin:0 16px 12px;overflow:hidden;transition:all .35s}
        .order-card:hover{border-color:#dab96a}
        .order-card.live{border-color:#22c55e!important;box-shadow:0 0 0 3px rgba(34,197,94,.18),0 4px 20px rgba(34,197,94,.1);animation:livePulse 2.5s ease-in-out 3}
        @keyframes livePulse{0%,100%{box-shadow:0 0 0 3px rgba(34,197,94,.18)}50%{box-shadow:0 0 0 7px rgba(34,197,94,.06)}}
        @media(max-width:540px){.order-card{margin:0 10px 10px}}
        .order-header{padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;cursor:pointer;user-select:none;transition:background .15s}
        .order-header:hover{background:#fffbf5}
        .order-body{padding:0 16px 16px;border-top:1px solid var(--border);animation:expandIn .2s ease}
        @keyframes expandIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
        .status-badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:800;padding:4px 11px;border-radius:50px;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap}
        .live-tag{background:#dcfce7;color:#15803d;font-size:10px;font-weight:800;padding:2px 8px;border-radius:50px;display:inline-flex;align-items:center;gap:4px;animation:fadeIn .3s ease}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .blink{width:6px;height:6px;border-radius:50%;background:#22c55e;animation:blink 1.4s ease-in-out infinite}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        .live-indicator{display:flex;align-items:center;gap:5px;font-size:11px;color:rgba(255,255,255,.4);margin-top:6px}
        .live-indicator .blink{background:#4ade80}
        .progress-wrap{padding:14px 0 6px}
        .p-track{display:flex;align-items:flex-start}
        .p-step{display:flex;flex-direction:column;align-items:center;flex:1}
        .p-step:last-child{flex:none}
        .p-dot{width:24px;height:24px;border-radius:50%;border:2.5px solid #e5e7eb;background:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;transition:all .4s;flex-shrink:0;z-index:1}
        .p-dot.done{background:var(--gold);border-color:var(--gold);color:#fff}
        .p-dot.current{background:#fff;border-color:var(--gold);box-shadow:0 0 0 4px rgba(200,134,10,.15)}
        .p-name{font-size:8px;font-weight:800;color:#9a8a7a;margin-top:5px;text-align:center;letter-spacing:.05em;text-transform:uppercase;line-height:1.3;max-width:52px}
        .p-name.done{color:var(--gold)}
        .p-name.current{color:var(--text);font-weight:800}
        .p-line{flex:1;height:2.5px;background:#e5e7eb;margin-top:11px;transition:background .4s}
        .p-line.done{background:var(--gold)}
        .modal-overlay{position:fixed;inset:0;background:rgba(28,20,16,.55);z-index:100;display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .2s ease}
        @media(min-width:600px){.modal-overlay{align-items:center;padding:20px}}
        .modal-box{background:#fff;border-radius:24px 24px 0 0;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;animation:slideUp .3s cubic-bezier(.4,0,.2,1)}
        @media(min-width:600px){.modal-box{border-radius:20px}}
        @keyframes slideUp{from{transform:translateY(60px);opacity:0}to{transform:none;opacity:1}}
        .modal-header{position:sticky;top:0;background:#fff;z-index:2;padding:18px 20px 14px;border-bottom:1px solid var(--border);margin-bottom:18px}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 20px}
        @media(max-width:480px){.form-grid{grid-template-columns:1fr}}
        .form-field{display:flex;flex-direction:column;gap:6px}
        .form-field.full{grid-column:1/-1}
        .form-field label{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--t3)}
        .form-input{background:var(--warm);border:1.5px solid var(--border);border-radius:10px;padding:11px 14px;font-size:14px;font-family:inherit;color:var(--text);outline:none;transition:all .2s;width:100%}
        .form-input:focus{border-color:var(--gold);background:#fff;box-shadow:0 0 0 3px rgba(200,134,10,.1)}
        .btn-save{background:var(--gold);color:#fff;border:none;border-radius:50px;padding:12px 28px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s}
        .btn-save:hover:not(:disabled){background:#e09a12;transform:translateY(-1px)}
        .btn-save:disabled{opacity:.6;cursor:not-allowed}
        .btn-outline{background:none;border:1.5px solid var(--border);border-radius:50px;padding:10px 18px;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;color:var(--t2);transition:all .2s}
        .btn-outline:hover{border-color:var(--gold);color:var(--gold)}
        .btn-danger{background:none;border:1.5px solid #fecaca;border-radius:50px;padding:10px 18px;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;color:#b91c1c;transition:all .2s}
        .btn-danger:hover{background:#fef2f2}
        .edit-btn{display:inline-flex;align-items:center;gap:6px;background:var(--gold);color:#fff;border:none;border-radius:50px;padding:10px 20px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;margin:0 24px 24px}
        .edit-btn:hover{background:#e09a12;transform:translateY(-1px)}
        .color-dot{width:24px;height:24px;border-radius:50%;cursor:pointer;transition:transform .15s;border:3px solid transparent}
        .color-dot.selected{border-color:#fff;box-shadow:0 0 0 2px #c8860a;transform:scale(1.15)}
        .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:13px 28px;border-radius:50px;font-size:13px;font-weight:700;z-index:200;animation:toastIn .3s ease;white-space:nowrap;box-shadow:0 8px 28px rgba(0,0,0,.2);max-width:90vw;text-align:center}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
      `}</style>

      <div className="prof-page">

        {/* ── HERO ── */}
        <div className="hero-card">
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div className="avatar-lg" style={{ background: form.avatar_color }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{fullName}</p>
              <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, marginBottom: 2 }}>{form.email || user.email}</p>
              {form.city && <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 12 }}>📍 {form.city}</p>}
              <div className="live-indicator"><span className="blink" />Order updates are live</div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setProfileOpen(true)} className="edit-btn"
                style={{ margin: 0, background: 'rgba(255,255,255,.15)', border: '1.5px solid rgba(255,255,255,.3)' }}>
                ✎ Edit Profile
              </button>
              <form action="/auth/signout" method="post" style={{ display: 'inline' }}>
                <button type="submit" style={{ background: 'none', border: '1.5px solid rgba(255,255,255,.25)', color: 'rgba(255,255,255,.7)', borderRadius: 50, padding: '9px 16px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="content-wrap">
          <div className="main-card">
            <div className="tabs">
              <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>👤 Profile Details</button>
              <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                📦 My Orders {orders.length > 0 && `(${orders.length})`}
              </button>
            </div>

            {/* ── PROFILE TAB ── */}
            {activeTab === 'profile' && (
              <>
                <div className="info-grid">
                  {FIELDS.map(f => (
                    <div key={f.key} className={`info-chip${f.full ? ' full' : ''}`}>
                      <label>{f.label}</label>
                      <p>{(form[f.key] as string) || <span style={{ color: '#c9b9a8', fontStyle: 'italic', fontWeight: 400 }}>Not set</span>}</p>
                    </div>
                  ))}
                  <div className="info-chip">
                    <label>Avatar Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: form.avatar_color, border: '2px solid #ecdcc8' }} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{form.avatar_color}</span>
                    </div>
                  </div>
                </div>
                <button className="edit-btn" onClick={() => setProfileOpen(true)}>✎ Edit Profile</button>
              </>
            )}

            {/* ── ORDERS TAB ── */}
            {activeTab === 'orders' && (
              <div style={{ padding: '12px 0 20px' }}>
                {orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '52px 24px', color: 'var(--t3)' }}>
                    <div style={{ fontSize: 52, marginBottom: 14 }}>📭</div>
                    <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: 'var(--text)' }}>No orders yet</p>
                    <p style={{ fontSize: 13, marginBottom: 20 }}>Your orders will appear here and update in real-time.</p>
                    <Link href="/products" style={{ background: 'var(--gold)', color: '#fff', padding: '10px 24px', borderRadius: 50, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>Browse Products</Link>
                  </div>
                ) : orders.map(o => {
                  const s          = getStatusStyle(o.status)
                  const step       = getStatusStep(o.status)
                  const isLive     = liveOrderId === o.id
                  const isOpen     = expandedOrder === o.id
                  const isTerminal = ['cancelled', 'refunded'].includes(o.status?.toLowerCase())
                  return (
                    <div key={o.id} className={`order-card ${isLive ? 'live' : ''}`}>
                      <div className="order-header" onClick={() => setExpandedOrder(isOpen ? null : o.id)}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: 15 }}>{o.order_number}</span>
                            {isLive && (
                              <span className="live-tag">
                                <span className="blink" style={{ width: 6, height: 6 }} />
                                JUST UPDATED
                              </span>
                            )}
                          </div>
                          <p style={{ color: 'var(--t3)', fontSize: 12 }}>
                            {new Date(o.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 17, color: '#c8860a', fontFamily: "'Cormorant Garamond', serif", marginBottom: 5 }}>
                            ₹{Number(o.total_amount || 0).toLocaleString('en-IN')}
                          </p>
                          <span className="status-badge" style={{ background: s.bg, color: s.text }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block', flexShrink: 0 }} />
                            {s.icon} {s.label}
                          </span>
                        </div>
                        <span style={{ color: '#c9b9a8', fontSize: 18, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>▾</span>
                      </div>

                      {isOpen && (
                        <div className="order-body">
                          {!isTerminal && step >= 0 && (
                            <div className="progress-wrap">
                              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 14 }}>Order Progress</p>
                              <div className="p-track">
                                {STATUS_FLOW.map((flowStatus, i) => {
                                  const isDone    = i < step
                                  const isCurrent = i === step
                                  const isLast    = i === STATUS_FLOW.length - 1
                                  const cfg       = getStatusStyle(flowStatus)
                                  return (
                                    <div key={flowStatus} style={{ display: 'flex', alignItems: 'flex-start', flex: isLast ? 'none' : 1 }}>
                                      <div className="p-step">
                                        <div className={`p-dot ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                                          {isDone ? '✓' : isCurrent ? cfg.icon : ''}
                                        </div>
                                        <span className={`p-name ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>{flowStatus}</span>
                                      </div>
                                      {!isLast && <div className={`p-line ${isDone ? 'done' : ''}`} />}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {isTerminal && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginTop: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                              <span style={{ fontSize: 22 }}>{s.icon}</span>
                              <div>
                                <p style={{ fontWeight: 700, fontSize: 13, color: '#b91c1c' }}>Order {s.label}</p>
                                <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Contact our support team for assistance.</p>
                              </div>
                            </div>
                          )}

                          {o.shipping_address && (
                            <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--warm)', borderRadius: 10 }}>
                              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 6 }}>Shipping To</p>
                              <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                                📍 {[o.shipping_address.address, o.shipping_address.city, o.shipping_address.pincode].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── EDIT PROFILE MODAL ── */}
      {profileOpen && (
        <div className="modal-overlay">
          <div className="modal-box" ref={modalRef}>
            <div className="modal-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700 }}>Edit Profile</h2>
                <button onClick={() => { setProfileOpen(false); setDeleteConfirm(false) }}
                  style={{ background: '#f5f5f5', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            </div>

            {/* Avatar color picker */}
            <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: form.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', border: '3px solid #ecdcc8', flexShrink: 0 }}>
                {initials}
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>Avatar Color</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {AVATAR_COLORS.map(c => (
                    <div key={c} className={`color-dot ${form.avatar_color === c ? 'selected' : ''}`}
                      style={{ background: c }} onClick={() => setForm(p => ({ ...p, avatar_color: c }))} />
                  ))}
                </div>
              </div>
            </div>

            {/* Form fields */}
            <div className="form-grid">
              {FIELDS.map(f => (
                <div key={f.key} className={`form-field${f.full ? ' full' : ''}`}>
                  <label>{f.label}</label>
                  <input type={f.type || 'text'} placeholder={f.placeholder}
                    value={form[f.key] as string}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="form-input" />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ padding: '20px', display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <button className="btn-outline" onClick={() => { setProfileOpen(false); setDeleteConfirm(false) }}>Cancel</button>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                {!deleteConfirm
                  ? <button className="btn-danger" onClick={() => setDeleteConfirm(true)}>🗑 Delete Account</button>
                  : (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#fef2f2', padding: '8px 12px', borderRadius: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c' }}>Are you sure?</span>
                      <button className="btn-danger" onClick={deleteAccount} disabled={deleting} style={{ padding: '6px 12px', fontSize: 12 }}>
                        {deleting ? 'Deleting…' : 'Yes'}
                      </button>
                      <button className="btn-outline" onClick={() => setDeleteConfirm(false)} style={{ padding: '6px 12px', fontSize: 12 }}>No</button>
                    </div>
                  )}
                <button className="btn-save" onClick={saveProfile} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className="toast" style={{ background: toast.type === 'success' ? '#1c1410' : '#b91c1c', color: '#fff' }}>
          {toast.type === 'success' ? '✓ ' : '⚠ '}{toast.msg}
        </div>
      )}
    </>
  )
}