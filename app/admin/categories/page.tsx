'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  position: number
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    position: 0,
    is_active: true,
  })

  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchCategories() }, [])

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const fetchCategories = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('position', { ascending: true })
    if (error) {
      console.error('Fetch error:', error)
      setError(`Failed to load categories: ${error.message}`)
    } else {
      setCategories(data ?? [])
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const supabase = createClient()

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim() || null,
      image_url: formData.image_url.trim() || null,
      position: formData.position,
      is_active: formData.is_active,
    }

    if (editingCategory) {
      const { error } = await supabase
        .from('categories')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editingCategory.id)

      if (error) {
        console.error('Update error:', error)
        setError(`Update failed: ${error.message}`)
      } else {
        showSuccess(`"${payload.name}" updated successfully`)
        fetchCategories()
        setShowForm(false)
        setEditingCategory(null)
        resetForm()
      }
    } else {
      const { error } = await supabase
        .from('categories')
        .insert([payload])

      if (error) {
        console.error('Insert error:', error)
        setError(`Create failed: ${error.message}`)
      } else {
        showSuccess(`"${payload.name}" created successfully`)
        fetchCategories()
        setShowForm(false)
        resetForm()
      }
    }

    setSaving(false)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      position: category.position,
      is_active: category.is_active,
    })
    setShowForm(true)
    setError(null)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
  }

  const handleDelete = async (categoryId: string) => {
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.from('categories').delete().eq('id', categoryId)
    if (error) {
      console.error('Delete error:', error)
      setError(`Delete failed: ${error.message}`)
    } else {
      showSuccess('Category deleted')
      fetchCategories()
      setDeleteConfirm(null)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', slug: '', description: '', image_url: '', position: 0, is_active: true })
    setEditingCategory(null)
    setError(null)
  }

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const handleNameChange = (name: string) => {
    setFormData(f => ({
      ...f,
      name,
      // Only auto-generate slug when creating new, or if slug is still empty
      slug: !editingCategory ? autoSlug(name) : f.slug,
    }))
  }

  return (
    <>
      <style>{`
        .cat-page { --accent: #c8622a; --accent-2: #e07a3d; --accent-dim: rgba(200,98,42,.12); }

        /* ── Toast ── */
        .cat-toast {
          position: fixed; top: 20px; right: 20px; z-index: 9999;
          padding: 12px 18px; border-radius: 10px;
          font-size: 13.5px; font-weight: 600;
          box-shadow: 0 8px 24px rgba(0,0,0,.15);
          animation: toast-in .25s ease;
          display: flex; align-items: center; gap: 8px;
          max-width: 360px;
        }
        .cat-toast.success { background: #16a34a; color: white; }
        .cat-toast.error   { background: #dc2626; color: white; }
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-10px) scale(.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Page header ── */
        .cat-page-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 16px;
          margin-bottom: 28px; flex-wrap: wrap;
        }
        .cat-page-eyebrow {
          font-size: 10.5px; font-weight: 700; letter-spacing: .14em;
          text-transform: uppercase; color: var(--accent); margin-bottom: 4px;
        }
        .cat-page-title {
          font-family: var(--font-serif);
          font-size: 26px; color: var(--ink);
          letter-spacing: -.02em; line-height: 1.2; margin: 0;
        }
        .cat-page-sub { font-size: 13px; color: var(--sand-500); margin-top: 4px; }

        /* ── Stat chips ── */
        .cat-stats { display: flex; gap: 10px; margin-bottom: 26px; flex-wrap: wrap; }
        .cat-stat {
          background: white; border: 1px solid var(--sand-200);
          border-radius: 12px; padding: 13px 18px;
          box-shadow: 0 1px 4px rgba(0,0,0,.04); min-width: 110px;
        }
        .cat-stat-label {
          font-size: 9.5px; font-weight: 700; text-transform: uppercase;
          letter-spacing: .12em; color: var(--sand-400); margin-bottom: 4px;
        }
        .cat-stat-val {
          font-family: var(--font-serif); font-size: 26px; line-height: 1; color: var(--ink);
        }
        .cat-stat-val.green  { color: #16a34a; }
        .cat-stat-val.muted  { color: var(--sand-500); }

        /* ── Buttons ── */
        .cat-add-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 0 18px; height: 38px;
          background: var(--ink); color: white;
          border: none; border-radius: 10px;
          font-size: 13px; font-weight: 600;
          font-family: var(--font-body);
          cursor: pointer; letter-spacing: -.01em;
          transition: all .18s; white-space: nowrap;
        }
        .cat-add-btn:hover:not(:disabled) {
          background: var(--sand-800);
          box-shadow: 0 4px 14px rgba(0,0,0,.18);
          transform: translateY(-1px);
        }
        .cat-add-btn:disabled { opacity: .6; cursor: not-allowed; }
        .cat-add-btn.secondary {
          background: white; color: var(--sand-600);
          border: 1px solid var(--sand-200); box-shadow: none;
        }
        .cat-add-btn.secondary:hover {
          background: var(--sand-50); color: var(--ink);
          transform: none; box-shadow: 0 2px 8px rgba(0,0,0,.07);
        }

        /* ── Card shell ── */
        .cat-card {
          background: white; border: 1px solid var(--sand-200);
          border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,.04);
          overflow: hidden;
          animation: cat-card-in .35s ease both;
        }
        @keyframes cat-card-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cat-card-head {
          padding: 18px 22px 16px; border-bottom: 1px solid var(--sand-100);
          display: flex; align-items: center; gap: 12px;
        }
        .cat-card-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--ink);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .cat-card-title { font-size: 14px; font-weight: 700; color: var(--ink); margin: 0; }
        .cat-card-sub   { font-size: 11.5px; color: var(--sand-400); margin-top: 2px; }
        .cat-card-body  { padding: 22px; }

        /* ── Inline error banner ── */
        .cat-error-banner {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px 16px; border-radius: 10px;
          background: #fef2f2; border: 1px solid rgba(220,38,38,.2);
          color: #dc2626; font-size: 13px; font-weight: 500;
          margin-bottom: 16px;
        }

        /* ── Form ── */
        .cat-form { display: flex; flex-direction: column; gap: 18px; }
        .cat-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 640px) { .cat-form-grid { grid-template-columns: 1fr; } }
        .cat-field { display: flex; flex-direction: column; gap: 5px; }
        .cat-label {
          font-size: 11.5px; font-weight: 600; color: var(--sand-600); letter-spacing: -.01em;
        }
        .cat-input {
          height: 38px; padding: 0 12px;
          border: 1px solid var(--sand-200); border-radius: 9px;
          font-size: 13.5px; color: var(--ink); font-family: var(--font-body);
          background: var(--sand-50); outline: none; transition: all .18s;
        }
        .cat-input:focus {
          border-color: var(--accent); background: white;
          box-shadow: 0 0 0 3px var(--accent-dim);
        }
        .cat-textarea {
          padding: 10px 12px; height: 80px; resize: vertical;
          border: 1px solid var(--sand-200); border-radius: 9px;
          font-size: 13.5px; color: var(--ink); font-family: var(--font-body);
          background: var(--sand-50); outline: none; transition: all .18s; line-height: 1.5;
        }
        .cat-textarea:focus {
          border-color: var(--accent); background: white;
          box-shadow: 0 0 0 3px var(--accent-dim);
        }
        .cat-slug-hint {
          font-size: 11px; color: var(--sand-400); margin-top: 2px;
        }
        .cat-toggle-row {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 14px; border-radius: 10px;
          background: var(--sand-50); border: 1px solid var(--sand-200);
          cursor: pointer; user-select: none;
        }
        .cat-toggle { position: relative; width: 36px; height: 20px; flex-shrink: 0; }
        .cat-toggle input { opacity: 0; width: 0; height: 0; }
        .cat-toggle-slider {
          position: absolute; inset: 0; border-radius: 99px;
          background: var(--sand-300); transition: background .18s;
        }
        .cat-toggle-slider::after {
          content: ''; position: absolute;
          width: 14px; height: 14px; border-radius: 50%; background: white;
          top: 3px; left: 3px; transition: transform .18s;
          box-shadow: 0 1px 3px rgba(0,0,0,.15);
        }
        .cat-toggle input:checked + .cat-toggle-slider { background: #16a34a; }
        .cat-toggle input:checked + .cat-toggle-slider::after { transform: translateX(16px); }
        .cat-toggle-label { font-size: 13px; font-weight: 500; color: var(--ink); }
        .cat-toggle-hint  { font-size: 11px; color: var(--sand-400); margin-left: auto; }
        .cat-form-actions { display: flex; gap: 8px; flex-wrap: wrap; }

        /* ── Table ── */
        .cat-table-wrap { overflow-x: auto; }
        .cat-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .cat-table thead tr { border-bottom: 1px solid var(--sand-100); }
        .cat-table th {
          padding: 10px 16px; text-align: left;
          font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: .12em;
          color: var(--sand-400); white-space: nowrap; background: var(--sand-50);
        }
        .cat-table th:last-child { text-align: right; }
        .cat-table tbody tr { border-bottom: 1px solid var(--sand-100); transition: background .15s; }
        .cat-table tbody tr:last-child { border-bottom: none; }
        .cat-table tbody tr:hover { background: var(--sand-50); }
        .cat-table td { padding: 14px 16px; vertical-align: middle; }
        .cat-table td:last-child { text-align: right; }

        .cat-name-cell { display: flex; align-items: center; gap: 10px; }
        .cat-name-avatar {
          width: 34px; height: 34px; border-radius: 9px;
          background: var(--sand-100); border: 1px solid var(--sand-200);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; font-size: 14px; overflow: hidden;
        }
        .cat-name-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .cat-name-primary { font-size: 13.5px; font-weight: 600; color: var(--ink); }
        .cat-name-pos     { font-size: 11px; color: var(--sand-400); margin-top: 1px; }

        .cat-slug-pill {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 8px; border-radius: 6px;
          background: var(--sand-100); border: 1px solid var(--sand-200);
          font-size: 11px; color: var(--sand-600);
          font-family: 'SF Mono', 'Fira Code', monospace;
          letter-spacing: -.01em; white-space: nowrap;
        }
        .cat-status-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 9px; border-radius: 6px;
          font-size: 11px; font-weight: 700; letter-spacing: .04em; white-space: nowrap;
        }
        .cat-status-badge.active   { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .cat-status-badge.inactive { background: var(--sand-100); color: var(--sand-500); border: 1px solid var(--sand-200); }
        .cat-status-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

        .cat-desc-text {
          color: var(--sand-500); max-width: 200px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px;
        }
        .cat-action-btns { display: inline-flex; align-items: center; gap: 6px; }
        .cat-action-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 11px; border-radius: 7px; border: 1px solid var(--sand-200);
          font-size: 12px; font-weight: 600; cursor: pointer;
          font-family: var(--font-body); transition: all .15s;
          background: white; color: var(--sand-600);
        }
        .cat-action-btn:hover        { border-color: var(--sand-300); color: var(--ink); box-shadow: 0 1px 6px rgba(0,0,0,.07); }
        .cat-action-btn.edit:hover   { border-color: var(--accent); color: var(--accent); }
        .cat-action-btn.delete:hover { border-color: #dc2626; color: #dc2626; background: #fef2f2; }

        .cat-delete-confirm {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 6px; border-radius: 8px;
          background: #fef2f2; border: 1px solid rgba(220,38,38,.2);
        }
        .cat-delete-confirm span { font-size: 11.5px; color: #dc2626; font-weight: 600; white-space: nowrap; }
        .cat-del-yes, .cat-del-no {
          padding: 3px 9px; border-radius: 5px;
          font-size: 11.5px; font-weight: 700;
          cursor: pointer; border: none; font-family: var(--font-body);
        }
        .cat-del-yes { background: #dc2626; color: white; }
        .cat-del-no  { background: white; color: var(--sand-600); border: 1px solid var(--sand-200); }

        /* ── Empty state ── */
        .cat-empty {
          text-align: center; padding: 52px 20px;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .cat-empty-icon {
          width: 52px; height: 52px; border-radius: 14px;
          background: var(--sand-100); border: 1px solid var(--sand-200);
          display: flex; align-items: center; justify-content: center;
          color: var(--sand-300); margin-bottom: 4px;
        }
        .cat-empty-title { font-size: 14px; font-weight: 700; color: var(--ink); }
        .cat-empty-sub   { font-size: 13px; color: var(--sand-400); }

        /* ── Skeleton ── */
        .cat-skel {
          height: 52px; border-radius: 8px;
          background: linear-gradient(90deg, var(--sand-100) 25%, var(--sand-200) 50%, var(--sand-100) 75%);
          background-size: 200% 100%;
          animation: skel-wave 1.4s ease-in-out infinite;
          margin-bottom: 1px;
        }
        @keyframes skel-wave {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Success Toast */}
      {successMsg && (
        <div className="cat-toast success">
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
          </svg>
          {successMsg}
        </div>
      )}

      <div className="cat-page">
        {/* Header */}
        <div className="cat-page-header">
          <div>
            <div className="cat-page-eyebrow">Catalog</div>
            <h1 className="cat-page-title">Categories</h1>
            <p className="cat-page-sub">Organise your product taxonomy</p>
          </div>
          {!showForm && (
            <button className="cat-add-btn" onClick={() => { resetForm(); setShowForm(true) }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14"/>
              </svg>
              New Category
            </button>
          )}
        </div>

        {/* Stat strip */}
        <div className="cat-stats">
          {[
            { label: 'Total',    value: categories.length,                          cls: '' },
            { label: 'Active',   value: categories.filter(c => c.is_active).length, cls: 'green' },
            { label: 'Inactive', value: categories.filter(c => !c.is_active).length, cls: 'muted' },
          ].map(s => (
            <div key={s.label} className="cat-stat">
              <div className="cat-stat-label">{s.label}</div>
              <div className={`cat-stat-val ${s.cls}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Global error banner */}
        {error && !showForm && (
          <div className="cat-error-banner" style={{ marginBottom: 20 }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            {error}
            <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 0 }}>✕</button>
          </div>
        )}

        {/* Form card */}
        {showForm && (
          <div className="cat-card" style={{ marginBottom: 20 }} ref={formRef}>
            <div className="cat-card-head">
              <div className="cat-card-icon">
                <svg width="15" height="15" fill="none" stroke="white" viewBox="0 0 24 24">
                  {editingCategory
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14"/>
                  }
                </svg>
              </div>
              <div>
                <div className="cat-card-title">
                  {editingCategory ? `Edit "${editingCategory.name}"` : 'New Category'}
                </div>
                <div className="cat-card-sub">
                  {editingCategory ? 'Update category details' : 'Fill in the details below to create a category'}
                </div>
              </div>
              <button
                onClick={() => { setShowForm(false); resetForm() }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sand-400)', padding: 4 }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="cat-card-body">
              {/* Inline form error */}
              {error && (
                <div className="cat-error-banner">
                  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  </svg>
                  {error}
                  <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 0 }}>✕</button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="cat-form">
                <div className="cat-form-grid">
                  {/* Name */}
                  <div className="cat-field">
                    <label className="cat-label">Name *</label>
                    <input
                      className="cat-input"
                      type="text"
                      placeholder="e.g. Summer Collection"
                      value={formData.name}
                      onChange={e => handleNameChange(e.target.value)}
                      required
                    />
                  </div>

                  {/* Slug */}
                  <div className="cat-field">
                    <label className="cat-label">Slug *</label>
                    <input
                      className="cat-input"
                      type="text"
                      placeholder="summer-collection"
                      value={formData.slug}
                      onChange={e => setFormData(f => ({ ...f, slug: autoSlug(e.target.value) }))}
                      required
                    />
                    <span className="cat-slug-hint">Auto-generated from name. Lowercase, hyphens only.</span>
                  </div>

                  {/* Image URL */}
                  <div className="cat-field">
                    <label className="cat-label">Image URL</label>
                    <input
                      className="cat-input"
                      type="url"
                      placeholder="https://..."
                      value={formData.image_url}
                      onChange={e => setFormData(f => ({ ...f, image_url: e.target.value }))}
                    />
                  </div>

                  {/* Sort Position */}
                  <div className="cat-field">
                    <label className="cat-label">Sort Position</label>
                    <input
                      className="cat-input"
                      type="number"
                      min={0}
                      value={formData.position}
                      onChange={e => setFormData(f => ({ ...f, position: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="cat-field">
                  <label className="cat-label">Description</label>
                  <textarea
                    className="cat-textarea"
                    placeholder="Brief description of this category…"
                    value={formData.description}
                    onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  />
                </div>

                {/* Active toggle */}
                <label className="cat-toggle-row">
                  <span className="cat-toggle">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={e => setFormData(f => ({ ...f, is_active: e.target.checked }))}
                    />
                    <span className="cat-toggle-slider"/>
                  </span>
                  <span className="cat-toggle-label">Active</span>
                  <span className="cat-toggle-hint">Visible to customers</span>
                </label>

                {/* Actions */}
                <div className="cat-form-actions">
                  <button type="submit" className="cat-add-btn" disabled={saving}>
                    {saving ? (
                      <>
                        <svg width="13" height="13" style={{ animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 8z"/>
                        </svg>
                        {editingCategory ? 'Saving…' : 'Creating…'}
                      </>
                    ) : editingCategory ? 'Save Changes' : 'Create Category'}
                  </button>
                  <button
                    type="button"
                    className="cat-add-btn secondary"
                    onClick={() => { setShowForm(false); resetForm() }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table card */}
        <div className="cat-card">
          <div className="cat-card-head">
            <div className="cat-card-icon" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>
              <svg width="15" height="15" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
              </svg>
            </div>
            <div>
              <div className="cat-card-title">All Categories</div>
              <div className="cat-card-sub">{categories.length} total</div>
            </div>
            {!showForm && (
              <button className="cat-add-btn secondary" style={{ marginLeft: 'auto' }} onClick={() => { resetForm(); setShowForm(true) }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14"/>
                </svg>
                Add
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="cat-skel" style={{ animationDelay: `${i * 0.1}s` }}/>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="cat-empty">
              <div className="cat-empty-icon">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                </svg>
              </div>
              <div className="cat-empty-title">No categories yet</div>
              <div className="cat-empty-sub">Create your first category to get started</div>
              <button className="cat-add-btn" style={{ marginTop: 8 }} onClick={() => { resetForm(); setShowForm(true) }}>
                Create Category
              </button>
            </div>
          ) : (
            <div className="cat-table-wrap">
              <table className="cat-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Slug</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id}>
                      <td>
                        <div className="cat-name-cell">
                          <div className="cat-name-avatar">
                            {cat.image_url
                              ? <img src={cat.image_url} alt={cat.name} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}/>
                              : cat.name.charAt(0).toUpperCase()
                            }
                          </div>
                          <div>
                            <div className="cat-name-primary">{cat.name}</div>
                            <div className="cat-name-pos">Position {cat.position}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="cat-slug-pill">
                          <svg width="9" height="9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                          </svg>
                          {cat.slug}
                        </span>
                      </td>
                      <td>
                        <div className="cat-desc-text">{cat.description || '—'}</div>
                      </td>
                      <td>
                        <span className={`cat-status-badge ${cat.is_active ? 'active' : 'inactive'}`}>
                          <span className="cat-status-dot"/>
                          {cat.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {deleteConfirm === cat.id ? (
                          <div className="cat-delete-confirm">
                            <span>Delete?</span>
                            <button className="cat-del-yes" onClick={() => handleDelete(cat.id)}>Yes</button>
                            <button className="cat-del-no" onClick={() => setDeleteConfirm(null)}>No</button>
                          </div>
                        ) : (
                          <div className="cat-action-btns">
                            <button className="cat-action-btn edit" onClick={() => handleEdit(cat)}>
                              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                              </svg>
                              Edit
                            </button>
                            <button className="cat-action-btn delete" onClick={() => setDeleteConfirm(cat.id)}>
                              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}