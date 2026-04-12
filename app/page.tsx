'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

async function getBanners() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .eq('display_on_homepage', true)
    .order('position', { ascending: true })

  if (error) {
    console.error('Error fetching banners:', error)
    return []
  }

  return data || []
}

async function getFeaturedProducts() {
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
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) {
    console.error('Error fetching featured products:', error)
    return []
  }

  return data || []
}

async function getCategories() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true })
    .limit(8)

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data || []
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [banners, setBanners] = useState<any[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const handleCategoryFilter = (e: React.ChangeEvent<HTMLInputElement>, categoryId: string) => {
    const newSelectedCategories = e.target.checked 
      ? [...selectedCategories, categoryId]
      : selectedCategories.filter(id => id !== categoryId)
    
    setSelectedCategories(newSelectedCategories)
  }

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const [bannersData, productsData, categoriesData] = await Promise.all([
        getBanners(),
        getFeaturedProducts(),
        getCategories()
      ])

      // Filter products based on selected categories
      const filteredProducts = productsData.filter(product => {
        if (selectedCategories.length === 0) return true
        return selectedCategories.includes(product.category_id || '')
      })

      setBanners(bannersData)
      setFeaturedProducts(filteredProducts)
      setCategories(categoriesData)
      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col bg-zinc-50">
      {/* Sliding Animated Top Banner */}
      <div className="relative overflow-hidden py-2" style={{
        background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #4f46e5)',
        backgroundSize: '200% 100%',
        animation: 'gradient-x 8s ease infinite'
      }}>
        <style global jsx>{`
          @keyframes gradient-x {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes slide-text {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .animate-slide-text {
            animation: slide-text 20s linear infinite;
          }
        `}</style>
        <div className="flex whitespace-nowrap">
          <div className="animate-slide-text inline-flex items-center">
            {banners.map((banner, index) => (
              <span key={index} className="text-white font-medium text-sm mx-12">
                {banner.title}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Header with Navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-indigo-600">Shafa</span>
              <span className="ml-2 text-xl font-semibold text-gray-900">eCommerce</span>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-8">
              <form action="/products" method="GET" className="relative">
                <input
                  type="text"
                  name="search"
                  placeholder="Search products..."
                  className="w-full rounded-full border border-gray-300 px-4 py-2 pl-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </form>
            </div>

            {/* Right Navigation */}
            <div className="flex items-center space-x-4">
              {/* Cart Button */}
              <Link
                href="/cart"
                className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </Link>

              {/* User Menu */}
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-gray-900">
                        {user.user_metadata?.name || user.email?.split('@')[0]}
                      </p>
                    </div>
                  </div>
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      Logout
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="border-t border-gray-100">
            <div className="flex items-center space-x-6 overflow-x-auto py-3">
              <Link href="/" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                Contact
              </Link>
            </div>
          </nav>

          {/* Categories Navigation */}
          <nav className="border-t border-gray-100">
            <div className="flex items-center space-x-6 overflow-x-auto py-3">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center space-x-2 whitespace-nowrap"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={(e) => handleCategoryFilter(e, category.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                    {category.name}
                  </span>
                </label>
              ))}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Products</h2>
            {featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {product.name}
                      </h3>
                      {product.categories && (
                        <p className="text-xs text-gray-500 mt-1">{product.categories.name}</p>
                      )}
                      <p className="text-lg font-semibold text-indigo-600 mt-2">
                        ${Number(product.price).toFixed(2)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-12">No featured products available.</p>
            )}
            <div className="text-center mt-8">
              <Link
                href="/products"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                View All Products
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-6">Shafa eCommerce</h3>
              <p className="text-sm text-gray-400">Your one-stop shop for quality products.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/products" className="hover:text-white">All Products</Link></li>
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Customer Service</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/orders" className="hover:text-white">My Orders</Link></li>
                <li><Link href="/profile" className="hover:text-white">My Account</Link></li>
                <li>Email: support@shafa.com</li>
                <li>Phone: +1 (555) 123-4567</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Shafa eCommerce. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
