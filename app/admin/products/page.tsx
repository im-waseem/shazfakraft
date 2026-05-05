'use client'

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductVariant {
  id: string
  product_id: string
  sku: string
  name: string
  price: number
  compare_price: number | null
  cost_price: number | null
  inventory_quantity: number
  options: { size?: string; color?: string; style?: string }
  position: number
  is_active: boolean
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
  updated_at: string
  categories?: Category | null
  variants?: ProductVariant[]
}

// ─── Variant Row Builder ──────────────────────────────────────────────────────

type VariantRow = {
  id: string            // tmp-uuid for new rows
  sku: string
  size: string
  color: string
  style: string
  price: number
  compare_price: number
  inventory_quantity: number
  is_active: boolean
  _isNew?: boolean
  _delete?: boolean
}

const EMPTY_VARIANT: VariantRow = {
  id: '',
  sku: '',
  size: '',
  color: '',
  style: '',
  price: 0,
  compare_price: 0,
  inventory_quantity: 0,
  is_active: true,
  _isNew: true
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2)

function groupVariantsBySizeColor(variants: ProductVariant[]) {
  const sizeMap: Record<string, Record<string, ProductVariant>> = {}
  for (const v of variants) {
    const size = v.options?.size ?? '—'
    const color = v.options?.color ?? '—'
    if (!sizeMap[size]) sizeMap[size] = {}
    sizeMap[size][color] = v
  }
  return sizeMap
}

// ─── Price Badge ─────────────────────────────────────────────────────────────

function PriceBadge({ price, compare }: { price: number; compare?: number | null }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-semibold text-gray-900">₹{price.toLocaleString('en-IN')}</span>
      {compare && compare > price && (
        <span className="text-xs text-gray-400 line-through">₹{compare.toLocaleString('en-IN')}</span>
      )}
    </span>
  )
}

// ─── Variant Matrix (read-only table per product) ────────────────────────────

function VariantMatrix({ variants }: { variants: ProductVariant[] }) {
  const grouped = groupVariantsBySizeColor(variants)
  const sizes = Object.keys(grouped)
  const colors = Array.from(new Set(variants.map(v => v.options?.color ?? '—')))

  if (!sizes.length) return <p className="text-xs text-gray-400 italic">No variants</p>

  return (
    <div className="overflow-x-auto mt-2">
      <table className="min-w-full text-xs border border-gray-200 rounded">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-1 text-left font-medium text-gray-500 border-b">Size</th>
            {colors.map(c => (
              <th key={c} className="px-2 py-1 text-center font-medium text-gray-500 border-b">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sizes.map(size => (
            <tr key={size} className="border-b last:border-0">
              <td className="px-2 py-1 font-medium text-gray-700 whitespace-nowrap">{size}</td>
              {colors.map(color => {
                const v = grouped[size]?.[color]
                return (
                  <td key={color} className="px-2 py-1 text-center">
                    {v ? (
                      <PriceBadge price={v.price} compare={v.compare_price} />
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
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

// ─── Variant Editor ───────────────────────────────────────────────────────────

function VariantEditor({
  rows,
  onChange,
}: {
  rows: VariantRow[]
  onChange: (rows: VariantRow[]) => void
}) {
  const update = (id: string, patch: Partial<VariantRow>) => {
    onChange(rows.map(r => (r.id === id ? { ...r, ...patch } : r)))
  }

  const remove = (id: string) => {
    onChange(rows.map(r => (r.id === id ? { ...r, _delete: true } : r)))
  }

  const add = () => {
    onChange([...rows, { ...EMPTY_VARIANT, id: uid() }])
  }

  const visible = rows.filter(r => !r._delete)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b">
        <span className="text-sm font-medium text-gray-700">
          Variants — Size &amp; Color → Price
        </span>
        <button
          type="button"
          onClick={add}
          className="text-xs px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          + Add Row
        </button>
      </div>

      {visible.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-gray-400">
          No variants yet. Click <strong>+ Add Row</strong> to begin.
        </p>
      )}

      {visible.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Size', 'Color', 'Style', 'SKU', 'Price (₹)', 'Compare (₹)', 'Stock', 'Active', ''].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {/* Size */}
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={row.size}
                      placeholder="e.g. 30cm"
                      onChange={e => update(row.id, { size: e.target.value })}
                      className="w-24 rounded border border-gray-300 px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </td>
                  {/* Color */}
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={row.color}
                      placeholder="e.g. Gold"
                      onChange={e => update(row.id, { color: e.target.value })}
                      className="w-20 rounded border border-gray-300 px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </td>
                  {/* Style */}
                  <td className="px-2 py-1">
                    <select
                      value={row.style}
                      onChange={e => update(row.id, { style: e.target.value })}
                      className="w-28 rounded border border-gray-300 px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">— Style —</option>
                      <option>English Number</option>
                      <option>Arabic Number</option>
                    </select>
                  </td>
                  {/* SKU */}
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={row.sku}
                      placeholder="SKU"
                      onChange={e => update(row.id, { sku: e.target.value })}
                      className="w-28 rounded border border-gray-300 px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </td>
                  {/* Price */}
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={0}
                      value={row.price}
                      onChange={e => update(row.id, { price: parseFloat(e.target.value) || 0 })}
                      className="w-24 rounded border border-gray-300 px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </td>
                  {/* Compare */}
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={0}
                      value={row.compare_price}
                      onChange={e => update(row.id, { compare_price: parseFloat(e.target.value) || 0 })}
                      className="w-24 rounded border border-gray-300 px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </td>
                  {/* Stock */}
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={0}
                      value={row.inventory_quantity}
                      onChange={e => update(row.id, { inventory_quantity: parseInt(e.target.value) || 0 })}
                      className="w-16 rounded border border-gray-300 px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </td>
                  {/* Active */}
                  <td className="px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={row.is_active}
                      onChange={e => update(row.id, { is_active: e.target.checked })}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                    />
                  </td>
                  {/* Delete */}
                  <td className="px-2 py-1">
                    <button
                      type="button"
                      onClick={() => remove(row.id)}
                      className="text-red-400 hover:text-red-600 text-xs font-medium"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Live price preview grouped by size */}
      {visible.length > 0 && (
        <div className="border-t px-4 py-3 bg-indigo-50">
          <p className="text-xs font-medium text-indigo-700 mb-2">Price Preview (Size → Colors)</p>
          <div className="flex flex-wrap gap-3">
            {Array.from(new Set(visible.map(r => r.size).filter(Boolean))).map(size => {
              const sizeRows = visible.filter(r => r.size === size && r.price > 0)
              const minPrice = Math.min(...sizeRows.map(r => r.price))
              const maxPrice = Math.max(...sizeRows.map(r => r.price))
              return (
                <div key={size} className="bg-white border border-indigo-100 rounded px-3 py-2 text-xs shadow-sm">
                  <span className="font-semibold text-gray-700">{size}</span>
                  <span className="mx-1 text-gray-400">→</span>
                  <span className="text-indigo-700 font-bold">
                    ₹{minPrice.toLocaleString('en-IN')}
                    {maxPrice !== minPrice && ` – ₹${maxPrice.toLocaleString('en-IN')}`}
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {sizeRows.map(r => (
                      <span key={r.id} className="bg-gray-100 rounded px-1.5 py-0.5 text-gray-600">
                        {r.color || '?'}: ₹{r.price.toLocaleString('en-IN')}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  short_description: '',
  sku: '',
  price: 0,
  compare_price: 0,
  category_id: '',
  main_image_url: '',
  images: ['', '', '', ''],
  inventory_quantity: 0,
  track_inventory: true,
  is_active: true,
  is_featured: false,
  option_keys: ['size', 'color', 'style'],
}

export default function ProductsManagementPage() {
  const mainImageInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const [products, setProducts]       = useState<Product[]>([])
  const [categories, setCategories]   = useState<Category[]>([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData]       = useState({ ...EMPTY_FORM })
  const [variantRows, setVariantRows] = useState<VariantRow[]>([])
  const [saving, setSaving]           = useState(false)
  const [expandedId, setExpandedId]   = useState<string | null>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select(`*, categories(name, slug), variants:product_variants(*)`)
      .order('created_at', { ascending: false })
    if (data) setProducts(data)
    setLoading(false)
  }, [supabase])

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true })
    if (data) setCategories(data)
  }, [supabase])

  useEffect(() => { fetchProducts(); fetchCategories() }, [fetchProducts, fetchCategories])

  // ── Variant persistence ────────────────────────────────────────────────────

  const saveVariants = async (productId: string) => {
    const toDelete = variantRows.filter(r => r._delete && !r._isNew).map(r => r.id)
    const toUpsert = variantRows
      .filter(r => !r._delete)
      .map(r => ({
        ...(r._isNew ? {} : { id: r.id }),
        product_id: productId,
        sku: r.sku || null,
        name: [r.size, r.color, r.style].filter(Boolean).join(' · '),
        price: r.price,
        compare_price: r.compare_price || null,
        inventory_quantity: r.inventory_quantity,
        options: {
          ...(r.size  ? { size: r.size }   : {}),
          ...(r.color ? { color: r.color } : {}),
          ...(r.style ? { style: r.style } : {}),
        },
        is_active: r.is_active,
      }))

    if (toDelete.length)
      await supabase.from('product_variants').delete().in('id', toDelete)

    if (toUpsert.length)
      await supabase.from('product_variants').upsert(toUpsert)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const productData = {
      ...formData,
      price: parseFloat(String(formData.price)) || 0,
      compare_price: formData.compare_price ? parseFloat(String(formData.compare_price)) : null,
      inventory_quantity: parseInt(String(formData.inventory_quantity)) || 0,
      category_id: formData.category_id || null,
    }

    let productId = editingProduct?.id ?? ''

    if (editingProduct) {
      await supabase.from('products').update(productData).eq('id', editingProduct.id)
    } else {
      const { data } = await supabase.from('products').insert([productData]).select('id').single()
      productId = data?.id ?? ''
    }

    if (productId) await saveVariants(productId)

    await fetchProducts()
    setSaving(false)
    setShowForm(false)
    resetForm()
  }

  // ── Edit ───────────────────────────────────────────────────────────────────

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      short_description: product.short_description || '',
      sku: product.sku || '',
      price: product.price,
      compare_price: product.compare_price || 0,
      category_id: product.category_id || '',
      main_image_url: product.main_image_url || '',
      images: product.images?.length ? product.images : ['', '', '', ''],
      inventory_quantity: product.inventory_quantity,
      track_inventory: product.track_inventory,
      is_active: product.is_active,
      is_featured: product.is_featured,
      option_keys: product.option_keys || ['size', 'color', 'style'],
    })
    // Map existing variants to rows
    const rows: VariantRow[] = (product.variants ?? []).map(v => ({
      id: v.id,
      sku: v.sku ?? '',
      size: v.options?.size ?? '',
      color: v.options?.color ?? '',
      style: v.options?.style ?? '',
      price: v.price,
      compare_price: v.compare_price ?? 0,
      inventory_quantity: v.inventory_quantity,
      is_active: v.is_active,
      _isNew: false,
    }))
    setVariantRows(rows)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (productId: string) => {
    if (!confirm('Delete this product and all its variants?')) return
    await supabase.from('product_variants').delete().eq('product_id', productId)
    await supabase.from('products').delete().eq('id', productId)
    await fetchProducts()
  }

  // ── Image Upload ───────────────────────────────────────────────────────────

  const uploadImage = async (file: File, folder = 'products') => {
    const fileName = `${folder}/${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage.from('product-images').upload(fileName, file)
    if (error || !data) return ''
    return supabase.storage.from('product-images').getPublicUrl(data.path).data.publicUrl
  }

  // ── Reset ──────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormData({ ...EMPTY_FORM })
    setVariantRows([])
    setEditingProduct(null)
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Products</h2>
          <p className="text-sm text-gray-500">Manage your catalog with size &amp; color-based pricing</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            + Add Product
          </button>
        )}
      </div>

      {/* ── Form ──────────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingProduct ? 'Edit Product' : 'New Product'}
            </h3>
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm() }}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Basic info */}
            <section>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Basic Info</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Product Name', key: 'name', required: true },
                  { label: 'Slug', key: 'slug', required: true },
                  { label: 'SKU', key: 'sku' },
                  { label: 'Short Description', key: 'short_description' },
                ].map(({ label, key, required }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input
                      type="text"
                      required={required}
                      value={(formData as any)[key]}
                      onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                ))}

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Base price (fallback when no variants) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Price (₹) <span className="text-gray-400 text-xs font-normal">— fallback if no variants</span>
                  </label>
                  <input
                    type="number" min={0} step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Inventory */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Stock</label>
                  <input
                    type="number" min={0}
                    value={formData.inventory_quantity}
                    onChange={e => setFormData({ ...formData, inventory_quantity: parseInt(e.target.value) || 0 })}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-6 mt-4">
                {[
                  { key: 'track_inventory', label: 'Track Inventory' },
                  { key: 'is_active',       label: 'Active' },
                  { key: 'is_featured',     label: 'Featured' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={(formData as any)[key]}
                      onChange={e => setFormData({ ...formData, [key]: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Description */}
            <section>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Description</h4>
              <textarea
                rows={4}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </section>

            {/* Images */}
            <section>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Images</h4>
              <div className="space-y-4">
                {/* Main image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Main Image</label>
                  <input
                    type="file" accept="image/*" ref={mainImageInputRef}
                    onChange={async e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const url = await uploadImage(file)
                      if (url) setFormData({ ...formData, main_image_url: url })
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-sm hover:file:bg-indigo-100"
                  />
                  <input
                    type="url" placeholder="Or paste URL"
                    value={formData.main_image_url}
                    onChange={e => setFormData({ ...formData, main_image_url: e.target.value })}
                    className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  {formData.main_image_url && (
                    <img src={formData.main_image_url} alt="preview" className="mt-2 h-28 w-full object-cover rounded-md" />
                  )}
                </div>

                {/* Gallery */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gallery (up to 4)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {formData.images.map((url, i) => (
                      <div key={i}>
                        <input
                          type="file" accept="image/*"
                          onChange={async e => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const publicUrl = await uploadImage(file, 'products/gallery')
                            if (publicUrl) {
                              const imgs = [...formData.images]
                              imgs[i] = publicUrl
                              setFormData({ ...formData, images: imgs })
                            }
                          }}
                          className="block w-full text-xs text-gray-500 file:py-1 file:px-2 file:rounded file:border-0 file:bg-gray-100 file:text-gray-700"
                        />
                        <input
                          type="url" placeholder={`Image ${i + 1} URL`}
                          value={url}
                          onChange={e => {
                            const imgs = [...formData.images]
                            imgs[i] = e.target.value
                            setFormData({ ...formData, images: imgs })
                          }}
                          className="mt-1 block w-full rounded border border-gray-300 px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                        {url && (
                          <img src={url} alt={`g${i}`} className="mt-1 h-20 w-full object-cover rounded" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Variants */}
            <section>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Variants — Size &amp; Color Based Pricing
              </h4>
              <VariantEditor rows={variantRows} onChange={setVariantRows} />
            </section>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              >
                {saving ? 'Saving…' : editingProduct ? 'Update Product' : 'Create Product'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm() }}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Products Table ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Product', 'SKU', 'Category', 'Price', 'Sizes', 'Stock', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map(product => {
                const variants = product.variants ?? []
                const minPrice = variants.length
                  ? Math.min(...variants.filter(v => v.is_active).map(v => v.price))
                  : product.price
                const maxPrice = variants.length
                  ? Math.max(...variants.filter(v => v.is_active).map(v => v.price))
                  : product.price
                const sizes = Array.from(new Set(variants.map(v => v.options?.size).filter(Boolean)))
                const isExpanded = expandedId === product.id

                return (
                  <Fragment key={product.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      {/* Product */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {product.main_image_url ? (
                            <img src={product.main_image_url} alt={product.name}
                              className="h-12 w-12 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                              <span className="text-2xl">📦</span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-400 truncate max-w-45">{product.short_description}</p>
                            {variants.length > 0 && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : product.id)}
                                className="text-xs text-indigo-500 hover:text-indigo-700 mt-0.5"
                              >
                                {isExpanded ? '▲ Hide' : '▼ Show'} {variants.length} variants
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-5 py-4 text-xs text-gray-500">{product.sku || '—'}</td>

                      {/* Category */}
                      <td className="px-5 py-4 text-xs text-gray-500">
                        {product.categories?.name || 'Uncategorized'}
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {variants.length > 0 ? (
                          <div className="text-sm font-semibold text-indigo-700">
                            ₹{minPrice.toLocaleString('en-IN')}
                            {maxPrice !== minPrice && (
                              <span className="text-gray-400 font-normal"> – ₹{maxPrice.toLocaleString('en-IN')}</span>
                            )}
                          </div>
                        ) : (
                          <PriceBadge price={product.price} compare={product.compare_price} />
                        )}
                      </td>

                      {/* Sizes */}
                      <td className="px-5 py-4">
                        {sizes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {sizes.map(s => (
                              <span key={s} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>

                      {/* Stock */}
                      <td className="px-5 py-4">
                        {variants.length > 0 ? (
                          <span className="text-xs text-gray-500">
                            {variants.reduce((a, v) => a + v.inventory_quantity, 0)} total
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            product.inventory_quantity <= 0 ? 'bg-red-100 text-red-700'
                            : product.inventory_quantity <= 10 ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                          }`}>
                            {product.inventory_quantity} in stock
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {product.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {product.is_featured && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">
                              Featured
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button onClick={() => handleEdit(product)}
                          className="text-indigo-600 hover:text-indigo-900 text-xs font-medium mr-3">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(product.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium">
                          Delete
                        </button>
                      </td>
                    </tr>

                    {/* Expanded variant matrix */}
                    {isExpanded && (
                      <tr key={`${product.id}-variants`}>
                        <td colSpan={8} className="px-5 py-3 bg-indigo-50 border-t border-indigo-100">
                          <p className="text-xs font-medium text-indigo-700 mb-1">Variant Price Matrix</p>
                          <VariantMatrix variants={variants} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}

              {products.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-400">
                    No products yet. Click <strong>+ Add Product</strong> to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}