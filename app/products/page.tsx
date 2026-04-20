'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ProductsPage() {
  const supabase = createClient()

  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: ''
  })

  // ✅ Fetch Data
  const fetchData = async () => {
    setLoading(true)

    let query = supabase
      .from('products')
      .select(`*, categories (name, slug)`)
      .eq('is_active', true)

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      )
    }

    if (filters.category) {
      query = query.eq('category_id', filters.category)
    }

    if (filters.minPrice) {
      query = query.gte('price', Number(filters.minPrice))
    }

    if (filters.maxPrice) {
      query = query.lte('price', Number(filters.maxPrice))
    }

    const { data: productsData } = await query.order('created_at', {
      ascending: false
    })

    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true })

    setProducts(productsData || [])
    setCategories(categoriesData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [filters])

  // ✅ UI
  return (
    <div style={{ display: 'flex', gap: 24, padding: 20 }}>
      
      {/* Sidebar */}
      <aside style={{ width: 220 }}>
        <input
          placeholder="Search..."
          value={filters.search}
          onChange={(e) =>
            setFilters({ ...filters, search: e.target.value })
          }
        />

        <h4>Categories</h4>
        <button onClick={() => setFilters({ ...filters, category: '' })}>
          All
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              setFilters({ ...filters, category: cat.id })
            }
          >
            {cat.name}
          </button>
        ))}

        <h4>Price</h4>
        <button
          onClick={() =>
            setFilters({ ...filters, minPrice: '0', maxPrice: '500' })
          }
        >
          Under ₹500
        </button>
        <button
          onClick={() =>
            setFilters({ ...filters, minPrice: '500', maxPrice: '2000' })
          }
        >
          ₹500–₹2000
        </button>
      </aside>

      {/* Main */}
      <main style={{ flex: 1 }}>
        <h2>Products ({products.length})</h2>

        {loading ? (
          <p>Loading...</p>
        ) : products.length === 0 ? (
          <p>No products found</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16
            }}
          >
            {products.map((p) => (
              <div
                key={p.id}
                style={{
                  border: '1px solid #ddd',
                  padding: 10,
                  borderRadius: 10
                }}
              >
                {p.main_image_url && (
                  <img
                    src={p.main_image_url}
                    style={{ width: '100%', height: 150, objectFit: 'cover' }}
                  />
                )}

                <h3>{p.name}</h3>
                <p>₹{p.price}</p>

                <Link href={`/products/${p.slug}`}>
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}