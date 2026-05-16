'use client'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category { id: string; name: string; slug: string }
interface ProductVariant {
  id: string
  product_id: string
  sku: string | null
  name: string | null
  price: number
  compare_price: number | null
  cost_price: number | null
  inventory_quantity: number
  options: { size_inches?: string; color?: string }
  position: number
  is_active: boolean
  // ✅ NEW: per-variant image URL stored in DB
  image_url?: string | null
}
interface Product {
  id: string
  name: string
  slug: string
  description: string
  short_description: string
  sku: string
  price: number
  compare_price: number | null
  category_id: string | null
  main_image_url: string
  images: string[]
  inventory_quantity: number
  track_inventory: boolean
  is_active: boolean
  is_featured: boolean
  option_keys: string[]
  created_at: string
  categories?: Category | null
  variants?: ProductVariant[]
}
type VariantRow = {
  id: string
  size_inches: string
  color: string
  sku: string
  price: number
  compare_price: number
  inventory_quantity: number
  is_active: boolean
  // ✅ NEW: image URL per variant
  image_url: string
  _isNew?: boolean
  _delete?: boolean
}

const uid = () => Math.random().toString(36).slice(2)
const INCH_PRESETS = ['6x8', '8x10', '9x12', '12x16', '16x20', '18x24', '24x32', '24x36']
const COLOR_OPTIONS = [
  { name: 'Gold',      hex: '#d4a843' },
  { name: 'Silver',    hex: '#c0c0c0' },
  { name: 'Black',     hex: '#1a1a1a' },
  { name: 'Rose Gold', hex: '#b76e79' },
  { name: 'Bronze',    hex: '#cd7f32' },
  { name: 'White',     hex: '#f0f0f0' },
]

// ✅ FIX: flex-shrink-0 → shrink-0  (Tailwind v4 canonical)
const inp = 'block w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all bg-white/80 placeholder:text-stone-400 hover:border-stone-300'

// ─── Variant Matrix ────────────────────────────────────────────────────────────
function VariantMatrix({ variants }: { variants: ProductVariant[] }) {
  const sizes  = Array.from(new Set(variants.map(v => v.options?.size_inches).filter(Boolean))) as string[]
  const colors = Array.from(new Set(variants.map(v => v.options?.color).filter(Boolean))) as string[]
  const map: Record<string, Record<string, ProductVariant>> = {}
  variants.forEach(v => {
    const s = v.options?.size_inches ?? ''
    const c = v.options?.color ?? ''
    if (!map[s]) map[s] = {}
    map[s][c] = v
  })
  if (!sizes.length) return <p className="text-xs text-stone-400 italic py-2">No variants yet</p>
  return (
    <div className="overflow-x-auto mt-2">
      {/* ✅ FIX: bg-gradient-to-r → bg-linear-to-r */}
      <table className="text-xs border border-amber-100 rounded-xl overflow-hidden w-full">
        <thead>
          <tr className="bg-linear-to-r from-amber-50 to-orange-50">
            <th className="px-3 py-2.5 text-left font-bold text-amber-800 border-b border-amber-100 tracking-wide">Size (in)</th>
            {colors.map(c => (
              <th key={c} className="px-3 py-2.5 text-center font-bold text-amber-800 border-b border-amber-100">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sizes.map((size, i) => (
            <tr key={size} className={i % 2 === 0 ? 'bg-white' : 'bg-amber-50/40'}>
              <td className="px-3 py-2.5 font-bold text-stone-700 border-b border-stone-100">{size}"</td>
              {colors.map(color => {
                const v = map[size]?.[color]
                return (
                  <td key={color} className="px-3 py-2.5 text-center border-b border-stone-100">
                    {v ? (
                      <div>
                        <span className="font-bold text-stone-900">₹{v.price.toLocaleString('en-IN')}</span>
                        {v.compare_price && v.compare_price > v.price && (
                          <span className="ml-1 text-stone-400 line-through text-xs">₹{v.compare_price.toLocaleString('en-IN')}</span>
                        )}
                        <div className="text-stone-400 mt-0.5">qty: {v.inventory_quantity}</div>
                        {/* ✅ NEW: show color image thumbnail in matrix */}
                        {v.image_url && (
                          <img src={v.image_url} alt={color}
                            className="mt-1 mx-auto w-10 h-10 object-cover rounded-lg border border-amber-100 shadow-sm" />
                        )}
                      </div>
                    ) : <span className="text-stone-300">—</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Variant Editor ────────────────────────────────────────────────────────────
function VariantEditor({ rows, onChange }: { rows: VariantRow[]; onChange: (r: VariantRow[]) => void }) {
  const supabase = createClient()

  const update = (id: string, patch: Partial<VariantRow>) =>
    onChange(rows.map(r => r.id === id ? { ...r, ...patch } : r))
  const remove = (id: string) =>
    onChange(rows.map(r => r.id === id ? { ...r, _delete: true } : r))
  const addRow = (size = '', color = '') =>
    onChange([...rows, {
      id: uid(), size_inches: size, color, sku: '', price: 0,
      compare_price: 0, inventory_quantity: 0, is_active: true,
      image_url: '', _isNew: true
    }])

  // ✅ NEW: upload image for a specific variant row
  const uploadVariantImage = async (rowId: string, file: File) => {
    const path = `products/variants/${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage.from('product-images').upload(path, file)
    if (error || !data) return
    const url = supabase.storage.from('product-images').getPublicUrl(data.path).data.publicUrl
    update(rowId, { image_url: url })
  }

  const visible    = rows.filter(r => !r._delete)
  const totalStock = visible.reduce((a, r) => a + r.inventory_quantity, 0)

  return (
    <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      {/* ✅ FIX: bg-gradient-to-r → bg-linear-to-r */}
      <div className="bg-linear-to-r from-amber-50 via-orange-50 to-amber-50 px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-amber-100">
        <div>
          <h4 className="text-sm font-bold text-stone-800 flex items-center gap-2">
            <span className="text-base">📐</span> Size × Color Pricing Matrix
          </h4>
          <p className="text-xs text-stone-500 mt-0.5">Each size+color combo has its own price, stock & image</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            onChange={e => { if (e.target.value) { addRow(e.target.value); e.target.value = '' } }}
            className="text-xs border border-amber-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer hover:border-amber-300 transition-colors font-medium text-stone-700 shadow-sm"
            defaultValue=""
          >
            <option value="">＋ Size preset…</option>
            {INCH_PRESETS.map(s => <option key={s} value={s}>{s} inches</option>)}
          </select>
          <button
            type="button"
            onClick={() => addRow()}
            className="group text-xs px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-semibold transition-all shadow-sm hover:shadow-amber-200 hover:shadow-md active:scale-95 flex items-center gap-1.5"
          >
            <span className="text-sm leading-none group-hover:rotate-90 transition-transform duration-200">+</span>
            Custom Row
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="px-5 py-14 text-center text-sm text-stone-400 bg-stone-50/50">
          <div className="text-4xl mb-3 opacity-60">📐</div>
          <p className="font-medium">No variants yet</p>
          <p className="text-xs mt-1 text-stone-400">Add size presets or custom rows above</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                {/* ✅ NEW: added "Color Image" column header */}
                {['Size (in)', 'Color', 'Color Image', 'SKU', 'Price (₹)', 'Compare (₹)', 'Stock', 'Active', ''].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-bold text-stone-500 whitespace-nowrap uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {visible.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`${idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/30'} hover:bg-amber-50/50 transition-colors duration-150`}
                >
                  {/* Size */}
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1 items-center">
                      <input type="text" value={row.size_inches} placeholder="12x16"
                        onChange={e => update(row.id, { size_inches: e.target.value })}
                        className="w-20 rounded-lg border border-stone-200 px-2 py-1.5 text-xs focus:ring-1 focus:ring-amber-400 outline-none hover:border-stone-300 transition-colors"
                      />
                      <span className="text-xs text-stone-400 font-medium">"</span>
                    </div>
                  </td>
                  {/* Color */}
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1.5 items-center">
                      <select value={row.color} onChange={e => update(row.id, { color: e.target.value })}
                        className="w-24 rounded-lg border border-stone-200 px-2 py-1.5 text-xs focus:ring-1 focus:ring-amber-400 outline-none hover:border-stone-300 transition-colors cursor-pointer">
                        <option value="">— Color —</option>
                        {COLOR_OPTIONS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                      {row.color && (
                        <span className="w-4 h-4 rounded-full border border-stone-300 shadow-sm shrink-0 ring-2 ring-white"
                          style={{ background: COLOR_OPTIONS.find(c => c.name === row.color)?.hex || '#ccc' }} />
                      )}
                    </div>
                  </td>
                  {/* ✅ NEW: Color Image upload per variant */}
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col gap-1.5 min-w-[120px]">
                      {row.image_url ? (
                        <div className="relative w-14 h-14 group">
                          <img src={row.image_url} alt="variant"
                            className="w-full h-full object-cover rounded-xl border-2 border-amber-200 shadow-sm" />
                          <button
                            type="button"
                            onClick={() => update(row.id, { image_url: '' })}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                          >✕</button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center gap-1 w-14 h-14 border-2 border-dashed border-stone-200 rounded-xl cursor-pointer hover:border-amber-300 hover:bg-amber-50 transition-all">
                          <input
                            type="file" accept="image/*" className="sr-only"
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (file) uploadVariantImage(row.id, file)
                            }}
                          />
                          <span className="text-xl mt-2">🖼</span>
                          <span className="text-[9px] text-stone-400 font-medium">Upload</span>
                        </label>
                      )}
                      <input
                        type="url" placeholder="or paste URL"
                        value={row.image_url}
                        onChange={e => update(row.id, { image_url: e.target.value })}
                        className="w-28 rounded-lg border border-stone-200 px-2 py-1 text-[10px] focus:ring-1 focus:ring-amber-400 outline-none placeholder:text-stone-300"
                      />
                    </div>
                  </td>
                  {/* SKU */}
                  <td className="px-3 py-2.5">
                    <input type="text" value={row.sku} placeholder="SKU"
                      onChange={e => update(row.id, { sku: e.target.value })}
                      className="w-24 rounded-lg border border-stone-200 px-2 py-1.5 text-xs focus:ring-1 focus:ring-amber-400 outline-none hover:border-stone-300 transition-colors font-mono"
                    />
                  </td>
                  {/* Price */}
                  <td className="px-3 py-2.5">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium">₹</span>
                      <input type="number" min={0} value={row.price}
                        onChange={e => update(row.id, { price: parseFloat(e.target.value) || 0 })}
                        className="w-24 rounded-lg border border-stone-200 pl-5 pr-2 py-1.5 text-xs focus:ring-1 focus:ring-amber-400 outline-none hover:border-stone-300 transition-colors"
                      />
                    </div>
                  </td>
                  {/* Compare price */}
                  <td className="px-3 py-2.5">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium">₹</span>
                      <input type="number" min={0} value={row.compare_price}
                        onChange={e => update(row.id, { compare_price: parseFloat(e.target.value) || 0 })}
                        className="w-24 rounded-lg border border-stone-200 pl-5 pr-2 py-1.5 text-xs focus:ring-1 focus:ring-amber-400 outline-none hover:border-stone-300 transition-colors"
                      />
                    </div>
                  </td>
                  {/* Stock */}
                  <td className="px-3 py-2.5">
                    <input type="number" min={0} value={row.inventory_quantity}
                      onChange={e => update(row.id, { inventory_quantity: parseInt(e.target.value) || 0 })}
                      className="w-16 rounded-lg border border-stone-200 px-2 py-1.5 text-xs focus:ring-1 focus:ring-amber-400 outline-none hover:border-stone-300 transition-colors text-center"
                    />
                  </td>
                  {/* Active toggle */}
                  <td className="px-3 py-2.5 text-center">
                    <button type="button" onClick={() => update(row.id, { is_active: !row.is_active })}
                      className={`relative w-9 h-5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 ${row.is_active ? 'bg-amber-500' : 'bg-stone-300'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${row.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  {/* Delete */}
                  <td className="px-3 py-2.5">
                    <button type="button" onClick={() => remove(row.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90 group border border-transparent hover:border-red-100">
                      <svg className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {visible.length > 0 && (
        <div className="border-t border-amber-100 bg-linear-to-r from-amber-50 to-orange-50 px-5 py-3">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-xs text-amber-800 font-bold">
              {visible.length} variant{visible.length !== 1 ? 's' : ''} · {totalStock} total units
            </span>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(visible.map(r => r.size_inches).filter(Boolean))).map(size => {
                const sRows = visible.filter(r => r.size_inches === size && r.price > 0)
                if (!sRows.length) return null
                const min = Math.min(...sRows.map(r => r.price))
                const max = Math.max(...sRows.map(r => r.price))
                return (
                  <span key={size} className="bg-white border border-amber-200 rounded-lg px-2.5 py-1 text-xs text-amber-900 shadow-sm font-medium">
                    <span className="font-bold">{size}"</span>
                    <span className="mx-1 text-amber-300">→</span>
                    <span className="font-bold text-amber-700">₹{min.toLocaleString('en-IN')}{max !== min ? `–₹${max.toLocaleString('en-IN')}` : ''}</span>
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Animated Buttons ────────────────────────────────────────────────────────────
function PrimaryBtn({ children, onClick, type = 'button', disabled, className = '' }: {
  children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit';
  disabled?: boolean; className?: string
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`group relative overflow-hidden px-6 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold transition-all duration-200
        hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-200 hover:-translate-y-0.5
        active:translate-y-0 active:shadow-sm active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2
        ${className}`}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <div className="absolute inset-0 bg-white/10 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 rounded-xl" />
    </button>
  )
}
function GhostBtn({ children, onClick, className = '' }: {
  children: React.ReactNode; onClick?: () => void; className?: string
}) {
  return (
    <button type="button" onClick={onClick}
      className={`px-6 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-sm font-medium transition-all duration-200
        hover:bg-stone-50 hover:border-stone-300 hover:text-stone-800
        active:scale-[0.98] active:bg-stone-100
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2
        ${className}`}
    >
      {children}
    </button>
  )
}

// ─── Main Admin Products Page ────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '', slug: '', description: '', short_description: '', sku: '',
  price: 0, compare_price: 0, category_id: '', main_image_url: '',
  images: ['', '', '', ''],
  inventory_quantity: 0, track_inventory: true, is_active: true,
  is_featured: false, option_keys: ['size_inches', 'color'],
}

export default function AdminProductsPage() {
  const supabase = createClient()
  const mainImageRef = useRef<HTMLInputElement>(null)
  const [products, setProducts]       = useState<Product[]>([])
  const [categories, setCategories]   = useState<Category[]>([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [editing, setEditing]         = useState<Product | null>(null)
  const [formData, setFormData]       = useState({ ...EMPTY_FORM })
  const [variantRows, setVariantRows] = useState<VariantRow[]>([])
  const [saving, setSaving]           = useState(false)
  const [expandedId, setExpandedId]   = useState<string | null>(null)
  const [search, setSearch]           = useState('')
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchAll = useCallback(async () => {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products')
        .select('*, categories(name,slug), variants:product_variants(*)')
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').eq('is_active', true).order('position'),
    ])
    setProducts(prods || [])
    setCategories(cats || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchAll() }, [fetchAll])

  const saveVariants = async (productId: string) => {
    const toDelete = variantRows.filter(r => r._delete && !r._isNew).map(r => r.id)
    const toUpsert = variantRows.filter(r => !r._delete).map(r => ({
      ...(r._isNew ? {} : { id: r.id }),
      product_id: productId,
      name: [r.size_inches ? `${r.size_inches} inch` : '', r.color].filter(Boolean).join(' · '),
      sku: r.sku || null,
      price: r.price,
      compare_price: r.compare_price || null,
      inventory_quantity: r.inventory_quantity,
      options: {
        ...(r.size_inches ? { size_inches: r.size_inches } : {}),
        ...(r.color       ? { color: r.color }             : {}),
      },
      is_active: r.is_active,
      // ✅ NEW: persist image_url per variant
      image_url: r.image_url || null,
    }))
    if (toDelete.length) await supabase.from('product_variants').delete().in('id', toDelete)
    if (toUpsert.length) await supabase.from('product_variants').upsert(toUpsert)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...formData,
      price: parseFloat(String(formData.price)) || 0,
      compare_price: formData.compare_price ? parseFloat(String(formData.compare_price)) : null,
      inventory_quantity: parseInt(String(formData.inventory_quantity)) || 0,
      category_id: formData.category_id || null,
    }
    let productId = editing?.id ?? ''
    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id)
      if (error) { showToast(error.message, 'error'); setSaving(false); return }
    } else {
      const { data, error } = await supabase.from('products').insert([payload]).select('id').single()
      if (error || !data) { showToast(error?.message || 'Insert failed', 'error'); setSaving(false); return }
      productId = data.id
    }
    if (productId) await saveVariants(productId)
    await fetchAll()
    showToast(editing ? 'Product updated successfully!' : 'Product created successfully!')
    setSaving(false)
    setShowForm(false)
    resetForm()
  }

  const handleEdit = (p: Product) => {
    setEditing(p)
    setFormData({
      name: p.name, slug: p.slug, description: p.description || '',
      short_description: p.short_description || '', sku: p.sku || '',
      price: p.price, compare_price: p.compare_price || 0,
      category_id: p.category_id || '', main_image_url: p.main_image_url || '',
      images: p.images?.length ? p.images : ['', '', '', ''],
      inventory_quantity: p.inventory_quantity, track_inventory: p.track_inventory,
      is_active: p.is_active, is_featured: p.is_featured,
      option_keys: p.option_keys || ['size_inches', 'color'],
    })
    setVariantRows((p.variants ?? []).map(v => ({
      id: v.id,
      size_inches: v.options?.size_inches ?? '',
      color: v.options?.color ?? '',
      sku: v.sku ?? '',
      price: v.price,
      compare_price: v.compare_price ?? 0,
      inventory_quantity: v.inventory_quantity,
      is_active: v.is_active,
      // ✅ NEW: load image_url when editing
      image_url: v.image_url ?? '',
      _isNew: false,
    })))
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product and all its variants permanently?')) return
    await supabase.from('product_variants').delete().eq('product_id', id)
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) { showToast(error.message, 'error'); return }
    await fetchAll()
    showToast('Product deleted.')
  }

  const uploadImage = async (file: File, folder = 'products') => {
    const path = `${folder}/${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage.from('product-images').upload(path, file)
    if (error || !data) return ''
    return supabase.storage.from('product-images').getPublicUrl(data.path).data.publicUrl
  }

  const resetForm = () => { setFormData({ ...EMPTY_FORM }); setVariantRows([]); setEditing(null) }

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.includes(search)
  )

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-amber-100" />
        <div className="absolute inset-0 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
      <p className="text-sm text-stone-400 font-medium animate-pulse">Loading products…</p>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeSlideDown { from { opacity:0; transform:translateY(-16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateX(24px) scale(0.95); } to { opacity:1; transform:translateX(0) scale(1); } }
        .form-enter { animation: fadeSlideDown 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .toast-enter { animation: toastIn 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .product-row { transition: background 0.15s, box-shadow 0.15s; }
        .product-row:hover { background: rgb(255,251,235); }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 py-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

        {/* Toast */}
        {toast && (
          <div className={`toast-enter fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold text-white ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
              {toast.type === 'success' ? '✓' : '✕'}
            </div>
            {toast.msg}
          </div>
        )}

        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif" }} className="text-2xl font-black text-stone-900 tracking-tight">Products</h1>
            <p className="text-sm text-stone-500 mt-1">Manage catalog · inch-based sizing · color variants with images</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
              </svg>
              <input type="search" placeholder="Search products…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="text-sm border border-stone-200 rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none w-56 bg-white hover:border-stone-300 transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {!showForm && (
              <PrimaryBtn onClick={() => { resetForm(); setShowForm(true) }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </PrimaryBtn>
            )}
          </div>
        </div>

        {/* ── Product Form ─────────────────────────────────────── */}
        {showForm && (
          <div className="form-enter bg-white rounded-3xl shadow-xl border border-stone-100 p-7 mb-8 ring-1 ring-stone-900/5">
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 style={{ fontFamily: "'Syne', sans-serif" }} className="text-xl font-black text-stone-900">
                  {editing ? 'Edit Product' : 'New Product'}
                </h2>
                <p className="text-sm text-stone-500 mt-0.5">{editing ? `Editing: ${editing.name}` : 'Fill in the details below'}</p>
              </div>
              <button onClick={() => { setShowForm(false); resetForm() }}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-all active:scale-90 border border-transparent hover:border-stone-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Info */}
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xs font-black text-stone-400 uppercase tracking-widest">Basic Info</span>
                  <div className="flex-1 h-px bg-stone-100" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">Product Name <span className="text-amber-500">*</span></label>
                    <input required type="text" value={formData.name}
                      onChange={e => {
                        const name = e.target.value
                        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                        setFormData({ ...formData, name, slug })
                      }}
                      className={inp} placeholder="e.g. Ayatul Kursi Acrylic Wall Art" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">Slug <span className="text-amber-500">*</span></label>
                    <input required type="text" value={formData.slug}
                      onChange={e => setFormData({ ...formData, slug: e.target.value })}
                      className={inp + ' font-mono text-xs'} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">SKU</label>
                    <input type="text" value={formData.sku}
                      onChange={e => setFormData({ ...formData, sku: e.target.value })}
                      className={inp + ' font-mono'} placeholder="AK-WALL-001" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">Category</label>
                    <select value={formData.category_id}
                      onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                      className={inp + ' cursor-pointer'}>
                      <option value="">Select category…</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                      Base Price (₹) <span className="text-stone-400 text-xs font-normal">— fallback if no variants</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-medium">₹</span>
                      <input type="number" min={0} step="0.01" value={formData.price}
                        onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className={inp + ' pl-8'} />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">Short Description</label>
                    <input type="text" value={formData.short_description}
                      onChange={e => setFormData({ ...formData, short_description: e.target.value })}
                      className={inp} placeholder="One-line description shown under product name" />
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap gap-5 mt-5 p-4 bg-stone-50 rounded-xl border border-stone-100">
                  {[
                    { k: 'track_inventory', l: 'Track Inventory', icon: '📦' },
                    { k: 'is_active',       l: 'Active',          icon: '✅' },
                    { k: 'is_featured',     l: 'Featured',        icon: '⭐' },
                  ].map(({ k, l, icon }) => (
                    <label key={k} className="flex items-center gap-3 cursor-pointer select-none group">
                      <button type="button"
                        onClick={() => setFormData({ ...formData, [k]: !(formData as any)[k] })}
                        className={`w-11 h-6 rounded-full transition-all duration-300 relative focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${(formData as any)[k] ? 'bg-amber-500 shadow-sm shadow-amber-200' : 'bg-stone-300'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${(formData as any)[k] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                      <span className="text-sm text-stone-700 font-medium group-hover:text-stone-900 transition-colors">
                        {icon} {l}
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Description */}
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xs font-black text-stone-400 uppercase tracking-widest">Description</span>
                  <div className="flex-1 h-px bg-stone-100" />
                </div>
                <textarea rows={4} value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className={inp + ' resize-none'} placeholder="Full product description…" />
              </section>

              {/* Images */}
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xs font-black text-stone-400 uppercase tracking-widest">Images</span>
                  <div className="flex-1 h-px bg-stone-100" />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Main Image</label>
                    <div className="p-4 bg-stone-50 rounded-xl border border-dashed border-stone-200 hover:border-amber-300 transition-colors">
                      <input type="file" accept="image/*" ref={mainImageRef}
                        onChange={async e => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const url = await uploadImage(file)
                          if (url) setFormData({ ...formData, main_image_url: url })
                        }}
                        className="block w-full text-sm text-stone-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:bg-amber-50 file:text-amber-700 file:text-sm file:font-semibold hover:file:bg-amber-100 file:cursor-pointer file:transition-colors" />
                      <input type="url" placeholder="Or paste image URL…" value={formData.main_image_url}
                        onChange={e => setFormData({ ...formData, main_image_url: e.target.value })}
                        className="block w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none mt-3 bg-white" />
                    </div>
                    {formData.main_image_url && (
                      <div className="mt-3 relative inline-block">
                        <img src={formData.main_image_url} alt="preview"
                          className="h-32 w-32 object-cover rounded-xl border border-stone-200 shadow-sm" />
                        <button type="button"
                          onClick={() => setFormData({ ...formData, main_image_url: '' })}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow-md hover:bg-red-600 transition-colors">✕</button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Gallery (up to 4)</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {formData.images.map((url, i) => (
                        <div key={i} className="border border-dashed border-stone-200 rounded-xl p-3 space-y-2 hover:border-amber-300 transition-colors bg-stone-50/50">
                          <input type="file" accept="image/*"
                            onChange={async e => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              const pu = await uploadImage(file, 'products/gallery')
                              if (pu) { const imgs = [...formData.images]; imgs[i] = pu; setFormData({ ...formData, images: imgs }) }
                            }}
                            className="block w-full text-xs text-stone-400 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-stone-100 file:text-stone-600 file:cursor-pointer file:font-medium" />
                          <input type="url" placeholder={`Image ${i + 1} URL`} value={url}
                            onChange={e => {
                              const imgs = [...formData.images]; imgs[i] = e.target.value
                              setFormData({ ...formData, images: imgs })
                            }}
                            className="block w-full rounded-lg border border-stone-200 px-2 py-1.5 text-xs focus:ring-1 focus:ring-amber-400 outline-none bg-white" />
                          {url && <img src={url} alt="" className="h-20 w-full object-cover rounded-lg shadow-sm" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Variants */}
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xs font-black text-stone-400 uppercase tracking-widest">Variants — Size × Color → Price + Image</span>
                  <div className="flex-1 h-px bg-stone-100" />
                </div>
                {/* ✅ NEW: hint about color images */}
                <div className="mb-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">
                  <span className="text-sm">💡</span>
                  <span>Upload a <strong>Color Image</strong> for each variant row. On the storefront, clicking a color swatch will automatically swap the gallery to show that color's image.</span>
                </div>
                <VariantEditor rows={variantRows} onChange={setVariantRows} />
              </section>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-stone-100">
                <PrimaryBtn type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {editing ? 'Update Product' : 'Create Product'}
                    </>
                  )}
                </PrimaryBtn>
                <GhostBtn onClick={() => { setShowForm(false); resetForm() }}>Cancel</GhostBtn>
              </div>
            </form>
          </div>
        )}

        {/* ── Product Table ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <span className="text-sm font-bold text-stone-600">
              {filtered.length} product{filtered.length !== 1 ? 's' : ''}
              {search && <span className="text-stone-400 font-normal ml-1.5">matching "{search}"</span>}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-50">
              <thead className="bg-stone-50">
                <tr>
                  {['Product', 'SKU', 'Category', 'Price Range', 'Sizes', 'Stock', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-stone-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filtered.map(product => {
                  const variants = (product.variants ?? []).filter(v => v.is_active)
                  const minPrice = variants.length ? Math.min(...variants.map(v => v.price)) : product.price
                  const maxPrice = variants.length ? Math.max(...variants.map(v => v.price)) : product.price
                  const sizes = Array.from(new Set(variants.map(v => v.options?.size_inches).filter(Boolean))) as string[]
                  const totalStock = variants.reduce((a, v) => a + v.inventory_quantity, product.inventory_quantity)
                  const isExpanded = expandedId === product.id
                  return (
                    <Fragment key={product.id}>
                      <tr className="product-row hover:bg-amber-50/50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                              {product.main_image_url
                                ? <img src={product.main_image_url} alt={product.name} className="h-full w-full object-cover" />
                                : <div className="h-full w-full flex items-center justify-center text-xl">📦</div>}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-stone-900 leading-tight">{product.name}</p>
                              <p className="text-xs text-stone-400 mt-0.5 line-clamp-1 max-w-48">{product.short_description}</p>
                              {variants.length > 0 && (
                                <button
                                  onClick={() => setExpandedId(isExpanded ? null : product.id)}
                                  className="text-xs text-amber-600 hover:text-amber-800 mt-1 font-semibold flex items-center gap-1 transition-colors"
                                >
                                  <svg className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                  </svg>
                                  {isExpanded ? 'Hide' : 'Show'} {variants.length} variants
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-stone-500 font-mono">{product.sku || '—'}</td>
                        <td className="px-5 py-4 text-xs text-stone-600">{product.categories?.name || 'Uncategorized'}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-sm font-black text-amber-600">
                            ₹{minPrice.toLocaleString('en-IN')}
                            {maxPrice !== minPrice && <span className="text-stone-400 font-normal text-xs"> – ₹{maxPrice.toLocaleString('en-IN')}</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {sizes.slice(0, 3).map(s => (
                              <span key={s} className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold border border-amber-100">{s}"</span>
                            ))}
                            {sizes.length > 3 && <span className="text-xs text-stone-400 font-medium">+{sizes.length - 3}</span>}
                            {!sizes.length && <span className="text-xs text-stone-400">—</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                            totalStock <= 0 ? 'bg-red-100 text-red-700'
                            : totalStock <= 10 ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                          }`}>{totalStock} units</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full w-fit ${product.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {product.is_featured && (
                              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-700 w-fit">⭐ Featured</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleEdit(product)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 transition-all active:scale-95">
                              Edit
                            </button>
                            <button onClick={() => handleDelete(product.id)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 transition-all active:scale-95">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="px-5 py-4 bg-amber-50/60 border-t border-amber-100" style={{ animation: 'fadeSlideIn 0.25s ease both' }}>
                            <p className="text-xs font-bold text-amber-700 mb-2">📊 Price Matrix — Size × Color (with color images)</p>
                            <VariantMatrix variants={product.variants ?? []} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-20 text-center">
                      <div className="text-4xl mb-3 opacity-40">📦</div>
                      <p className="text-sm font-semibold text-stone-500">
                        {search ? `No products matching "${search}"` : 'No products yet'}
                      </p>
                      {!search && (
                        <button onClick={() => { resetForm(); setShowForm(true) }}
                          className="mt-4 text-sm text-amber-600 hover:text-amber-800 font-semibold underline underline-offset-2">
                          + Add your first product
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}