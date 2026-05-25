'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminGetCoupons, adminCreateCoupon, adminUpdateCoupon, adminDeleteCoupon } from '@/lib/actions/coupons'
import type { Coupon, CouponFormData } from '@/lib/actions/coupons'

/* ─── Empty form data ──────────────────────────────────────────── */
const EMPTY_FORM: CouponFormData = {
  code: '', description: '', discount_type: 'percentage', discount_value: 0,
  minimum_order_amount: 0, maximum_discount_amount: '', usage_limit: '',
  starts_at: '', expires_at: '', is_active: true,
}

/* ─── Helpers ──────────────────────────────────────────────────── */
const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n)

function statusBadge(c: Coupon) {
  const now = new Date()
  if (!c.is_active) return { label: 'Disabled', cls: '#fef3c7', text: '#b45309' }
  if (c.expires_at && new Date(c.expires_at) < now) return { label: 'Expired', cls: '#fee2e2', text: '#dc2626' }
  if (c.starts_at && new Date(c.starts_at) > now) return { label: 'Scheduled', cls: '#dbeafe', text: '#2563eb' }
  if (c.usage_limit !== null && c.usage_count >= c.usage_limit) return { label: 'Used Up', cls: '#f3e8ff', text: '#7c3aed' }
  return { label: 'Active', cls: '#dcfce7', text: '#15803d' }
}

/* ─── Coupon Form Modal ────────────────────────────────────────── */
function CouponModal({
  coupon, editing, onClose, onSaved,
}: {
  coupon?: Coupon | null
  editing: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<CouponFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (coupon && editing) {
      setForm({
        code: coupon.code,
        description: coupon.description || '',
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        minimum_order_amount: coupon.minimum_order_amount,
        maximum_discount_amount: coupon.maximum_discount_amount?.toString() || '',
        usage_limit: coupon.usage_limit?.toString() || '',
        starts_at: coupon.starts_at ? coupon.starts_at.slice(0, 16) : '',
        expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : '',
        is_active: coupon.is_active,
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [coupon, editing])

  const handleSave = async () => {
    setError('')
    setSaving(true)
    const result = editing && coupon
      ? await adminUpdateCoupon(coupon.id, form)
      : await adminCreateCoupon(form)
    if (result.success) {
      onSaved()
      onClose()
    } else {
      setError(result.error || 'Failed to save')
    }
    setSaving(false)
  }

  const set = (k: keyof CouponFormData, v: any) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, maxWidth: 560, width: '100%',
        padding: 28, maxHeight: '90vh', overflow: 'auto', fontFamily: "'Inter', system-ui, sans-serif",
      }} onClick={e => e.stopPropagation()}>
        <style>{`@keyframes fadeSlide{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
        .modal-in{animation:fadeSlide .25s ease both}`}</style>

        <div className="modal-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>
              {editing ? 'Edit Coupon' : 'New Coupon'}
            </h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>✕</button>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: '#fff1f1', color: '#b42318', borderRadius: 10, marginBottom: 14, fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gap: 12 }}>
            {/* Code */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>Coupon Code *</label>
              <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME30" maxLength={50}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e0d8', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', fontWeight: 700, outline: 'none', textTransform: 'uppercase' }} />
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>Description</label>
              <input value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Coupon description" maxLength={255}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e0d8', borderRadius: 8, fontSize: 13, outline: 'none' }} />
            </div>

            {/* Discount type + value */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>Discount Type *</label>
                <select value={form.discount_type} onChange={e => set('discount_type', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e0d8', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (₹)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>Discount Value *</label>
                <input type="number" value={form.discount_value || ''} onChange={e => set('discount_value', Number(e.target.value))}
                  min={1} step={form.discount_type === 'percentage' ? 1 : 0.01}
                  placeholder={form.discount_type === 'percentage' ? '30' : '100'}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e0d8', borderRadius: 8, fontSize: 13, outline: 'none' }} />
              </div>
            </div>

            {/* Min order + max discount */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>Min. Order Amount (₹)</label>
                <input type="number" value={form.minimum_order_amount || ''} onChange={e => set('minimum_order_amount', Number(e.target.value))}
                  min={0} placeholder="0"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e0d8', borderRadius: 8, fontSize: 13, outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>Max Discount (₹, optional)</label>
                <input type="number" value={form.maximum_discount_amount} onChange={e => set('maximum_discount_amount', e.target.value)}
                  min={0} placeholder="Leave empty for no limit"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e0d8', borderRadius: 8, fontSize: 13, outline: 'none' }} />
              </div>
            </div>

            {/* Usage limit + dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>Usage Limit (optional)</label>
                <input type="number" value={form.usage_limit} onChange={e => set('usage_limit', e.target.value)}
                  min={1} placeholder="No limit"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e0d8', borderRadius: 8, fontSize: 13, outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>&nbsp;</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#b8860b' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>Active</span>
                </label>
              </div>
            </div>

            {/* Start / Expiry */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>Valid From</label>
                <input type="datetime-local" value={form.starts_at} onChange={e => set('starts_at', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e0d8', borderRadius: 8, fontSize: 13, outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>Expires At</label>
                <input type="datetime-local" value={form.expires_at} onChange={e => set('expires_at', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e0d8', borderRadius: 8, fontSize: 13, outline: 'none' }} />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={onClose}
              style={{
                flex: 1, padding: '11px', borderRadius: 8, border: '1.5px solid #e5e0d8',
                background: '#fff', fontSize: 13, fontWeight: 700, color: '#666', cursor: 'pointer', fontFamily: 'inherit',
              }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !form.code || !form.discount_value}
              style={{
                flex: 1, padding: '11px', borderRadius: 8, border: 'none',
                background: '#b8860b', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                opacity: saving || !form.code || !form.discount_value ? 0.6 : 1,
              }}>
              {saving ? 'Saving...' : editing ? 'Update Coupon' : 'Create Coupon'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Admin Coupons Page ────────────────────────────────────────── */
export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null)
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await adminGetCoupons()
    setCoupons(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (c: Coupon) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return
    const r = await adminDeleteCoupon(c.id)
    setActionMsg(r.success
      ? { type: 'success', text: `Coupon "${c.code}" deleted` }
      : { type: 'error', text: r.error || 'Delete failed' })
    if (r.success) load()
    setTimeout(() => setActionMsg(null), 3000)
  }

  const openEdit = (c: Coupon) => {
    setEditCoupon(c)
    setShowModal(true)
  }
  const openNew = () => {
    setEditCoupon(null)
    setShowModal(true)
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", padding: '24px 28px' }}>
      <style>{`
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Coupons</h1>
          <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{coupons.length} coupon{coupons.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew}
          style={{
            padding: '10px 20px', background: '#b8860b', color: '#fff', border: 'none',
            borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
          + New Coupon
        </button>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div style={{
          padding: '10px 16px', borderRadius: 10, marginBottom: 14, fontSize: 13, fontWeight: 600,
          background: actionMsg.type === 'success' ? '#f0fdf4' : '#fff1f1',
          color: actionMsg.type === 'success' ? '#15803d' : '#b42318',
          border: `1px solid ${actionMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
        }}>
          {actionMsg.text}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div style={{ width: 32, height: 32, border: '3px solid #ede9e0', borderTopColor: '#b8860b', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : coupons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#bbb', background: '#faf8f4', borderRadius: 12, border: '2px dashed #ede9e0' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>🏷️</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#888' }}>No coupons yet</p>
          <p style={{ fontSize: 12.5, marginTop: 4 }}>Create your first coupon to start offering discounts.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #ede9e0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#faf8f4', borderBottom: '1px solid #ede9e0' }}>
                <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 700, color: '#555' }}>Code</th>
                <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 700, color: '#555' }}>Discount</th>
                <th style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 700, color: '#555' }}>Min Order</th>
                <th style={{ textAlign: 'center', padding: '11px 14px', fontWeight: 700, color: '#555' }}>Usage</th>
                <th style={{ textAlign: 'center', padding: '11px 14px', fontWeight: 700, color: '#555' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '11px 14px', fontWeight: 700, color: '#555' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c, i) => {
                const badge = statusBadge(c)
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f0ede8', background: i % 2 === 0 ? '#fafafa' : '#fff' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14, color: '#1a1a1a', letterSpacing: '.03em' }}>{c.code}</span>
                      {c.description && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{c.description}</div>}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>
                      {c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${fmt(c.discount_value)}`}
                      {c.maximum_discount_amount !== null && (
                        <div style={{ fontSize: 11, fontWeight: 500, color: '#888' }}>Max ₹{fmt(c.maximum_discount_amount)}</div>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#666' }}>
                      {c.minimum_order_amount > 0 ? `₹${fmt(c.minimum_order_amount)}` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{ fontWeight: 700 }}>
                        {c.usage_count}
                      </span>
                      {c.usage_limit !== null && <span style={{ color: '#999' }}> / {c.usage_limit}</span>}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: badge.cls, color: badge.text,
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: badge.text }} />
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => openEdit(c)}
                          style={{
                            width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e5e0d8',
                            background: '#faf8f4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, color: '#666', transition: 'all .15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#b8860b'; e.currentTarget.style.color = '#b8860b' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e0d8'; e.currentTarget.style.color = '#666' }}
                          title="Edit">✏️</button>
                        <button onClick={() => handleDelete(c)}
                          style={{
                            width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e5e0d8',
                            background: '#faf8f4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, color: '#999', transition: 'all .15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#fecaca'; e.currentTarget.style.color = '#dc2626' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e0d8'; e.currentTarget.style.color = '#999' }}
                          title="Delete">🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CouponModal
          coupon={editCoupon}
          editing={!!editCoupon}
          onClose={() => setShowModal(false)}
          onSaved={load}
        />
      )}
    </div>
  )
}