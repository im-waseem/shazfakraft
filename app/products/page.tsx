import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Suspense } from 'react'
import ProductCard from './product-card'

async function getProducts(searchParams: { category?: string; search?: string; minPrice?: string; maxPrice?: string }) {
  const supabase = await createClient()
  
  let query = supabase
    .from('products')
    .select(`
      *,
      categories (
        name,
        slug
      )
    `)
    .eq('is_active', true)

  // Apply filters
  if (searchParams.search) {
    query = query.or(`name.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`)
  }
  
  if (searchParams.category) {
    query = query.eq('category_id', searchParams.category)
  }
  
  if (searchParams.minPrice) {
    query = query.gte('price', parseFloat(searchParams.minPrice))
  }
  
  if (searchParams.maxPrice) {
    query = query.lte('price', parseFloat(searchParams.maxPrice))
  }

  // Order by featured first, then by creation date
  query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data || []
}

async function getCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data || []
}

async function ProductsContent({ searchParams }: { searchParams: { category?: string; search?: string; minPrice?: string; maxPrice?: string } }) {
  const [products, categories] = await Promise.all([
    getProducts(searchParams),
    getCategories()
  ])

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Categories Sidebar */}
      <aside className="w-full lg:w-64 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
          <div className="space-y-2">
            <Link
              href="/products"
              className={`block text-sm font-medium ${!searchParams.category ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              All Products
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className={`block text-sm ${searchParams.category === category.id ? 'text-indigo-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {category.name}
              </Link>
            ))}
          </div>

          {/* Price Filters */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Price Range</h3>
            <div className="space-y-2">
              <Link
                href="/products"
                className={`block text-sm ${!searchParams.minPrice && !searchParams.maxPrice ? 'text-indigo-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
              >
                All Prices
              </Link>
              <Link
                href="/products?minPrice=0&maxPrice=50"
                className={`block text-sm ${searchParams.maxPrice === '50' ? 'text-indigo-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Under $50
              </Link>
              <Link
                href="/products?minPrice=50&maxPrice=100"
                className={`block text-sm ${searchParams.minPrice === '50' && searchParams.maxPrice === '100' ? 'text-indigo-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
              >
                $50 - $100
              </Link>
              <Link
                href="/products?minPrice=100"
                className={`block text-sm ${searchParams.minPrice === '100' && !searchParams.maxPrice ? 'text-indigo-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Over $100
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Product Grid */}
      <main className="flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {searchParams.search ? `Search: "${searchParams.search}"` : 'All Products'}
          </h1>
          <p className="text-gray-600 mt-1">
            {products.length} product{products.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <span className="text-6xl mb-4 block">🔍</span>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No products found</h2>
            <p className="text-gray-600">Try adjusting your search or filters</p>
            <Link
              href="/products"
              className="mt-4 inline-block text-indigo-600 hover:text-indigo-500 font-medium"
            >
              View all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function ProductsLoading() {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <aside className="w-full lg:w-64 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="aspect-square bg-gray-200 animate-pulse"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string; minPrice?: string; maxPrice?: string }
}) {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsContent searchParams={searchParams} />
    </Suspense>
  )
}