'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Category {
  id: string
  name: string
  slug: string
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
  created_at: string
  updated_at: string
  categories?: Category | null
}

export default function ProductsManagementPage() {
  const mainImageInputRef = useRef<HTMLInputElement>(null)
  
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
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
    is_featured: false
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false })

    if (data && !error) {
      setProducts(data)
    }
    setLoading(false)
  }

  const fetchCategories = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true })

    if (data && !error) {
      setCategories(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    const productData = {
      ...formData,
      price: parseFloat(formData.price?.toString()) || 0,
      compare_price: formData.compare_price ? parseFloat(formData.compare_price?.toString()) : null,
      inventory_quantity: parseInt(formData.inventory_quantity?.toString()) || 0,
      category_id: formData.category_id || null
    }

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id)

      if (!error) {
        fetchProducts()
        setShowForm(false)
        setEditingProduct(null)
        resetForm()
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert([productData])

      if (!error) {
        fetchProducts()
        setShowForm(false)
        resetForm()
      }
    }
  }

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
      images: product.images || ['', '', '', ''],
      inventory_quantity: product.inventory_quantity,
      track_inventory: product.track_inventory,
      is_active: product.is_active,
      is_featured: product.is_featured
    })
    setShowForm(true)
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (!error) {
      fetchProducts()
    }
  }

  const resetForm = () => {
    setFormData({
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
      is_featured: false
    })
    setEditingProduct(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Products</h2>
          <p className="text-sm text-gray-500">Manage your product catalog</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Add Product
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Compare Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.compare_price || 0}
                    onChange={(e) => setFormData({ ...formData, compare_price: parseFloat(e.target.value) || 0 })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Inventory Quantity</label>
                  <input
                    type="number"
                    value={formData.inventory_quantity || 0}
                    onChange={(e) => setFormData({ ...formData, inventory_quantity: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Main Product Image</label>
                <div className="mt-1 flex gap-2 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    ref={mainImageInputRef}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      
                      const supabase = createClient()
                      const fileName = `products/${Date.now()}-${file.name}`
                      
                      const { error, data } = await supabase.storage
                        .from('product-images')
                        .upload(fileName, file)
                        
                      if (!error && data) {
                        const { data: { publicUrl } } = supabase.storage
                          .from('product-images')
                          .getPublicUrl(data.path)
                          
                        setFormData({ ...formData, main_image_url: publicUrl })
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
                <input
                  type="url"
                  value={formData.main_image_url}
                  onChange={(e) => setFormData({ ...formData, main_image_url: e.target.value })}
                  className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                  placeholder="Or paste image URL here"
                />
                {formData.main_image_url && (
                  <div className="mt-2">
                    <img src={formData.main_image_url} alt="Preview" className="h-24 w-full object-cover rounded-md" />
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Gallery / Sliding Images</label>
              <p className="text-sm text-gray-500 mb-3">Add up to 4 images for product slider/carousel</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {formData.images.map((url, index) => (
                  <div key={index}>
                    <label className="block text-xs text-gray-500 mb-1">Image {index + 1}</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        
                        const supabase = createClient()
                        const fileName = `products/gallery/${Date.now()}-${file.name}`
                        
                        const { error, data } = await supabase.storage
                          .from('product-images')
                          .upload(fileName, file)
                          
                        if (!error && data) {
                          const { data: { publicUrl } } = supabase.storage
                            .from('product-images')
                            .getPublicUrl(data.path)
                            
                          const newGallery = [...formData.images]
                          newGallery[index] = publicUrl
                          setFormData({ ...formData, images: newGallery })
                        }
                      }}
                      className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700"
                    />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {
                      const newGallery = [...formData.images]
                      newGallery[index] = e.target.value
                      setFormData({ ...formData, images: newGallery })
                      }}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                      placeholder={`Image ${index + 1} URL`}
                    />
                    {url && (
                      <div className="mt-2">
                        <img src={url} alt={`Preview ${index + 1}`} className="h-20 w-full object-cover rounded-md" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Short Description</label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="track_inventory"
                    checked={formData.track_inventory}
                    onChange={(e) => setFormData({ ...formData, track_inventory: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="track_inventory" className="ml-2 text-sm text-gray-700">
                    Track Inventory
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Active
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="is_featured" className="ml-2 text-sm text-gray-700">
                    Featured
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {editingProduct ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {product.main_image_url ? (
                        <img
                          src={product.main_image_url}
                          alt={product.name}
                          className="h-12 w-12 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-md bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-2xl">📦</span>
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.short_description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{product.sku || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {product.categories?.name || 'Uncategorized'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${product.price.toFixed(2)}
                    </div>
                    {product.compare_price && (
                      <div className="text-sm text-gray-500 line-through">
                        ${product.compare_price.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.inventory_quantity <= 0 
                        ? 'bg-red-100 text-red-800' 
                        : product.inventory_quantity <= 10 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {product.inventory_quantity} in stock
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {product.is_featured && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}