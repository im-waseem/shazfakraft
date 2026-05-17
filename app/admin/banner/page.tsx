'use client'
import { useState, useTransition, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
interface Banner {
  id: string
  title: string
  description: string
  is_active: boolean
  created_at: string
}

/* ─────────────────────────────────────────
   Shared styles (injected once)
───────────────────────────────────────── */
const CSS = `
  /* ── Form ── */
  .ban-form { display: flex; flex-direction: column; gap: 14px; }
  .ban-field { display: flex; flex-direction: column; gap: 5px; }
  .ban-label {
    font-size: 11.5px; font-weight: 600; color: var(--sand-600);
    letter-spacing: -.01em;
  }
  .ban-input {
    height: 38px; padding: 0 12px;
    border: 1px solid var(--sand-200); border-radius: 9px;
    font-size: 13.5px; color: var(--ink);
    font-family: var(--font-body);
    background: var(--sand-50); outline: none;
    transition: border-color .18s, box-shadow .18s, background .18s;
    width: 100%;
  }
  .ban-input:focus {
    border-color: var(--accent); background: white;
    box-shadow: 0 0 0 3px var(--accent-dim);
  }
  .ban-textarea {
    padding: 10px 12px; resize: vertical;
    border: 1px solid var(--sand-200); border-radius: 9px;
    font-size: 13.5px; color: var(--ink);
    font-family: var(--font-body);
    background: var(--sand-50); outline: none;
    transition: border-color .18s, box-shadow .18s, background .18s;
    line-height: 1.55; width: 100%;
  }
  .ban-textarea:focus {
    border-color: var(--accent); background: white;
    box-shadow: 0 0 0 3px var(--accent-dim);
  }
  .ban-submit-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 7px;
    height: 38px; padding: 0 18px;
    background: var(--ink); color: white;
    border: none; border-radius: 9px;
    font-size: 13px; font-weight: 600;
    font-family: var(--font-body);
    cursor: pointer; letter-spacing: -.01em;
    transition: all .18s; align-self: flex-start;
  }
  .ban-submit-btn:hover:not(:disabled) {
    background: var(--sand-800);
    box-shadow: 0 4px 14px rgba(0,0,0,.18);
    transform: translateY(-1px);
  }
  .ban-submit-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; }

  /* ── List ── */
  .ban-list { display: flex; flex-direction: column; gap: 0; }
  .ban-item {
    padding: 16px 0;
    border-bottom: 1px solid var(--sand-100);
    display: flex; align-items: flex-start; gap: 14px;
    transition: background .15s;
  }
  .ban-item:first-child { padding-top: 0; }
  .ban-item:last-child  { border-bottom: none; padding-bottom: 0; }

  /* Banner colour swatch */
  .ban-swatch {
    width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    display: flex; align-items: center; justify-content: center;
    color: white; font-size: 13px; font-weight: 700;
    font-family: var(--font-serif);
    box-shadow: 0 2px 8px rgba(200,98,42,.25);
  }
  .ban-item-body { flex: 1; min-width: 0; }
  .ban-item-title {
    font-size: 14px; font-weight: 600; color: var(--ink);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .ban-item-desc {
    font-size: 12.5px; color: var(--sand-500);
    margin-top: 2px; line-height: 1.5;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
  }
  .ban-item-meta {
    font-size: 10.5px; color: var(--sand-400);
    margin-top: 5px; display: flex; align-items: center; gap: 8px;
  }
  .ban-status-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: #16a34a; display: inline-block;
  }
  .ban-status-dot.off { background: var(--sand-300); }

  /* Inline edit fields */
  .ban-edit-fields { display: flex; flex-direction: column; gap: 8px; }

  /* Action buttons */
  .ban-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .ban-btn {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 5px 11px; border-radius: 7px;
    border: 1px solid var(--sand-200);
    font-size: 12px; font-weight: 600;
    font-family: var(--font-body); cursor: pointer;
    transition: all .15s; background: white; color: var(--sand-600);
    white-space: nowrap;
  }
  .ban-btn:disabled { opacity: .5; cursor: not-allowed; }
  .ban-btn:hover:not(:disabled) {
    border-color: var(--sand-300); color: var(--ink);
    box-shadow: 0 1px 6px rgba(0,0,0,.07);
  }
  .ban-btn.edit:hover:not(:disabled)   { border-color: var(--accent); color: var(--accent); }
  .ban-btn.save:hover:not(:disabled)   { border-color: #16a34a; color: #16a34a; }
  .ban-btn.delete:hover:not(:disabled) { border-color: #dc2626; color: #dc2626; background: #fef2f2; }
  .ban-btn.cancel                      { background: var(--sand-50); }

  /* Inline delete confirm */
  .ban-del-confirm {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 8px; border-radius: 8px;
    background: #fef2f2; border: 1px solid rgba(220,38,38,.2);
  }
  .ban-del-confirm span { font-size: 11.5px; color: #dc2626; font-weight: 600; }
  .ban-del-yes {
    padding: 3px 9px; border-radius: 5px;
    font-size: 11.5px; font-weight: 700;
    cursor: pointer; border: none; font-family: var(--font-body);
    background: #dc2626; color: white;
    transition: opacity .15s;
  }
  .ban-del-yes:disabled { opacity: .6; }
  .ban-del-no {
    padding: 3px 9px; border-radius: 5px;
    font-size: 11.5px; font-weight: 700;
    cursor: pointer; background: white; color: var(--sand-600);
    border: 1px solid var(--sand-200); font-family: var(--font-body);
  }

  /* Empty state */
  .ban-empty {
    text-align: center; padding: 40px 20px;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  }
  .ban-empty-icon {
    width: 46px; height: 46px; border-radius: 12px;
    background: var(--sand-100); border: 1px solid var(--sand-200);
    display: flex; align-items: center; justify-content: center;
    color: var(--sand-300); margin-bottom: 4px;
  }
  .ban-empty-title { font-size: 14px; font-weight: 700; color: var(--ink); }
  .ban-empty-sub   { font-size: 12.5px; color: var(--sand-400); }

  /* Toast */
  .ban-toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 999;
    padding: 12px 18px; border-radius: 11px;
    font-size: 13px; font-weight: 600; font-family: var(--font-body);
    box-shadow: 0 8px 24px rgba(0,0,0,.14);
    display: flex; align-items: center; gap: 8px;
    animation: toast-in .28s ease both;
    pointer-events: none;
  }
  .ban-toast.ok  { background: #166534; color: white; }
  .ban-toast.err { background: #dc2626; color: white; }
  @keyframes toast-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Spinner */
  @keyframes ban-spin { to { transform: rotate(360deg); } }
  .ban-spinner { animation: ban-spin 1s linear infinite; }
`

/* ─────────────────────────────────────────
   Toast helper
───────────────────────────────────────── */
function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
  return (
    <div className={`ban-toast ${type}`}>
      {type === 'ok'
        ? <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
        : <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
      }
      {msg}
    </div>
  )
}

/* ─────────────────────────────────────────
   Add Banner Form
───────────────────────────────────────── */
function AddBannerForm({ onAdded }: { onAdded: () => void }) {
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading]       = useState(false)
  const [toast, setToast]           = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const showToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('banners').insert([{ title, description }])
    if (error) {
      showToast('Failed to add banner.', 'err')
    } else {
      setTitle('')
      setDescription('')
      showToast('Banner added!', 'ok')
      onAdded()
    }
    setLoading(false)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="ban-form">
        <div className="ban-field">
          <label className="ban-label">Title *</label>
          <input
            className="ban-input"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Summer Sale Coupon"
            required
          />
        </div>
        <div className="ban-field">
          <label className="ban-label">Description *</label>
          <textarea
            className="ban-textarea"
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Apply this coupon to get 30% off your order"
            required
          />
        </div>
        <button type="submit" className="ban-submit-btn" disabled={loading}>
          {loading
            ? <><svg className="ban-spinner" width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 8z"/></svg>Adding…</>
            : <><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14"/></svg>Add Banner</>
          }
        </button>
      </form>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </>
  )
}

/* ─────────────────────────────────────────
   Single banner row
───────────────────────────────────────── */
function BannerItem({
  banner,
  onRefresh,
}: {
  banner: Banner
  onRefresh: () => void
}) {
  const [isEditing, setIsEditing]   = useState(false)
  const [title, setTitle]           = useState(banner.title)
  const [description, setDescription] = useState(banner.description)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [isPending, startTransition]  = useTransition()
  const [toast, setToast]           = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const showToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = () => {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('banners').update({ title, description }).eq('id', banner.id)
      if (error) {
        showToast('Failed to update banner.', 'err')
      } else {
        showToast('Banner updated!', 'ok')
        setIsEditing(false)
        onRefresh()
      }
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setTitle(banner.title)
    setDescription(banner.description)
  }

  const handleDelete = () => {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('banners').delete().eq('id', banner.id)
      if (error) {
        showToast('Failed to delete banner.', 'err')
        setDeleteConfirm(false)
      } else {
        onRefresh()
      }
    })
  }

  const initial = banner.title.charAt(0).toUpperCase()

  return (
    <>
      <li className="ban-item">
        {/* Swatch */}
        <div className="ban-swatch">{initial}</div>

        {/* Body */}
        <div className="ban-item-body">
          {isEditing ? (
            <div className="ban-edit-fields">
              <input
                className="ban-input"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Banner title"
              />
              <textarea
                className="ban-textarea"
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Banner description"
              />
            </div>
          ) : (
            <>
              <div className="ban-item-title">{banner.title}</div>
              <div className="ban-item-desc">{banner.description}</div>
              <div className="ban-item-meta">
                <span className={`ban-status-dot ${banner.is_active === false ? 'off' : ''}`}/>
                {banner.is_active === false ? 'Inactive' : 'Active'}
                <span style={{ color: 'var(--sand-300)' }}>·</span>
                {new Date(banner.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="ban-actions">
          {isEditing ? (
            <>
              <button className="ban-btn save" onClick={handleSave} disabled={isPending}>
                {isPending
                  ? <svg className="ban-spinner" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 8z"/></svg>
                  : <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                }
                {isPending ? 'Saving…' : 'Save'}
              </button>
              <button className="ban-btn cancel" onClick={handleCancel} disabled={isPending}>Cancel</button>
            </>
          ) : deleteConfirm ? (
            <div className="ban-del-confirm">
              <span>Delete?</span>
              <button className="ban-del-yes" onClick={handleDelete} disabled={isPending}>
                {isPending ? '…' : 'Yes'}
              </button>
              <button className="ban-del-no" onClick={() => setDeleteConfirm(false)}>No</button>
            </div>
          ) : (
            <>
              <button className="ban-btn edit" onClick={() => setIsEditing(true)}>
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Edit
              </button>
              <button className="ban-btn delete" onClick={() => setDeleteConfirm(true)}>
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Delete
              </button>
            </>
          )}
        </div>
      </li>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </>
  )
}

/* ─────────────────────────────────────────
   Banner List
───────────────────────────────────────── */
function BannerList({ banners, onRefresh }: { banners: Banner[]; onRefresh: () => void }) {
  if (!banners || banners.length === 0) {
    return (
      <div className="ban-empty">
        <div className="ban-empty-icon">
          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h10"/>
          </svg>
        </div>
        <div className="ban-empty-title">No banners yet</div>
        <div className="ban-empty-sub">Add your first banner using the form above</div>
      </div>
    )
  }
  return (
    <ul className="ban-list">
      {banners.map(banner => (
        <BannerItem key={banner.id} banner={banner} onRefresh={onRefresh} />
      ))}
    </ul>
  )
}

/* ─────────────────────────────────────────
   Page — default export
───────────────────────────────────────── */
export default function BannerManagementPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchBanners = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('banners')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setBanners(data)
    setLoading(false)
  }

  useEffect(() => { fetchBanners() }, [])

  const total    = banners.length
  const active   = banners.filter(b => b.is_active !== false).length
  const inactive = total - active

  return (
    <>
      <style>{CSS}</style>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>
            Content Management
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--ink)', letterSpacing: '-.02em', lineHeight: 1.2, margin: 0 }}>
            Banners
          </h1>
          <p style={{ fontSize: 13, color: 'var(--sand-500)', marginTop: 4 }}>
            Create and manage homepage coupon banners
          </p>
        </div>
        <a href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '0 14px', height: 36, background: 'white', color: 'var(--sand-600)', border: '1px solid var(--sand-200)', borderRadius: 9, fontSize: 12.5, fontWeight: 600, textDecoration: 'none', transition: 'all .18s', letterSpacing: '-.01em', whiteSpace: 'nowrap' }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Dashboard
        </a>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 26, flexWrap: 'wrap' }}>
        {[
          { label: 'Total',    value: total,    color: 'var(--accent)' },
          { label: 'Active',   value: active,   color: '#16a34a' },
          { label: 'Inactive', value: inactive, color: 'var(--sand-500)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid var(--sand-200)', borderRadius: 12, padding: '13px 18px', minWidth: 110, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--sand-400)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, lineHeight: 1, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Cards ── */}
      <div style={{ maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Add Banner */}
        <div style={{ background: 'white', border: '1px solid var(--sand-200)', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,.04)', overflow: 'hidden', animation: 'cat-card-in .35s ease both' }}>
          <div style={{ padding: '18px 22px 16px', borderBottom: '1px solid var(--sand-100)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="15" height="15" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Add New Banner</div>
              <div style={{ fontSize: 11.5, color: 'var(--sand-400)', marginTop: 2 }}>Fill in the details below</div>
            </div>
          </div>
          <div style={{ padding: 22 }}>
            <AddBannerForm onAdded={fetchBanners} />
          </div>
        </div>

        {/* Banner list */}
        <div style={{ background: 'white', border: '1px solid var(--sand-200)', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,.04)', overflow: 'hidden', animation: 'cat-card-in .38s ease .08s both' }}>
          <div style={{ padding: '18px 22px 16px', borderBottom: '1px solid var(--sand-100)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="15" height="15" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>All Banners</div>
              <div style={{ fontSize: 11.5, color: 'var(--sand-400)', marginTop: 2 }}>{total} banner{total !== 1 ? 's' : ''} total</div>
            </div>
          </div>
          <div style={{ padding: 22 }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ height: 52, borderRadius: 8, background: 'linear-gradient(90deg, var(--sand-100) 25%, var(--sand-200) 50%, var(--sand-100) 75%)', backgroundSize: '200% 100%', animation: `skel-wave 1.4s ease-in-out ${i * 0.1}s infinite` }}/>
                ))}
                <style>{`@keyframes skel-wave { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
              </div>
            ) : (
              <BannerList banners={banners} onRefresh={fetchBanners} />
            )}
          </div>
        </div>
      </div>

      {/* Reuse card animation from categories page */}
      <style>{`@keyframes cat-card-in { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </>
  )
}