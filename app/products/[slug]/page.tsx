
'use client'
import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

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
}

interface Props {
  params: Promise<{ slug: string }>
}

export default function ProductDetailPage({ params }: Props) {
  const { slug } = use(params)
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    fetchProduct()
  }, [slug])

  const fetchProduct = async () => {
    const supabase = createClient()
    // First try exact slug match
    let { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    // If no exact match, try case-insensitive search
    if (!data || error) {
      const { data: allProducts } = await supabase
        .from('products')
        .select('*')
        .ilike('slug', `%${slug}%`)
        .limit(1)
      
      if (allProducts && allProducts.length > 0) {
        data = allProducts[0]
        error = null
      }
    }

    if (data && !error) {
      setProduct(data)
    }
    setLoading(false)
  }

  const handleAddToCart = () => {
    if (!product) return
    
    // Get existing cart from localStorage
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
    
    // Check if product already in cart
    const existingItemIndex = existingCart.findIndex((item: any) => item.productId === product.id)
    
    if (existingItemIndex > -1) {
      // Update quantity if already exists
      existingCart[existingItemIndex].quantity += quantity
    } else {
      // Add new item
      existingCart.push({
        id: Date.now().toString(),
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        image: product.main_image_url
      })
    }
    
    // Save back to localStorage
    localStorage.setItem('cart', JSON.stringify(existingCart))
    
    alert(`Added ${quantity} ${product.name} to cart!`)
    
    // Redirect to cart page
    window.location.href = '/cart'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
        <p className="mt-2 text-gray-500">The product you are looking for does not exist.</p>
      </div>
    )
  }

  const discount = product.compare_price 
    ? Math.round((1 - product.price / product.compare_price) * 100) 
    : 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
          <div className="relative">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 relative">
              {product.main_image_url ? (
                <Image
                  src={selectedImage === 0 ? product.main_image_url : (product.images?.[selectedImage - 1] || product.main_image_url)}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gray-200">
                  <span className="text-gray-400 text-6xl">📦</span>
                </div>
              )}
              
              {/* Slider Navigation Buttons */}
              {(product.images?.length > 0 || product.main_image_url) && (
                <>
                  <button
                    onClick={() => setSelectedImage(prev => Math.max(0, prev - 1))}
                    disabled={selectedImage === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center disabled:opacity-30 transition-opacity"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedImage(prev => Math.min(product.images?.length || 0, prev + 1))}
                    disabled={selectedImage >= (product.images?.length || 0)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center disabled:opacity-30 transition-opacity"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

          {/* Gallery Thumbnails */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedImage(0)}
              className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${selectedImage === 0 ? 'border-indigo-600' : 'border-transparent'}`}
            >
              {product.main_image_url ? (
                <Image
                  src={product.main_image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gray-200">
                  <span className="text-gray-400">📦</span>
                </div>
              )}
            </button>

            {product.images?.filter(img => img).map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index + 1)}
                className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${selectedImage === index + 1 ? 'border-indigo-600' : 'border-transparent'}`}
              >
                <Image
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          
          {product.short_description && (
            <p className="mt-2 text-lg text-gray-600">{product.short_description}</p>
          )}

          <div className="mt-6 flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.compare_price && (
              <>
                <span className="text-xl text-gray-500 line-through">
                  ${product.compare_price.toFixed(2)}
                </span>
                {discount > 0 && (
                  <span className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    {discount}% OFF
                  </span>
                )}
              </>
            )}
          </div>

          {/* Product Description */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Description</h3>
            {product.description ? (
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {product.description}
              </div>
            ) : (
              <p className="text-gray-500 italic">No description available for this product.</p>
            )}
          </div>

          {/* Inventory Status */}
          <div className="mt-6">
            {product.inventory_quantity <= 0 ? (
              <span className="text-red-600 font-medium">
                This product is currently out of stock
              </span>
            ) : product.inventory_quantity <= 10 ? (
              <span className="text-orange-600 font-medium">
                Only {product.inventory_quantity} left in stock
              </span>
            ) : (
              <span className="text-green-600 font-medium">
                In stock
              </span>
            )}
          </div>

          {/* Quantity Selector */}
          {product.inventory_quantity > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-16 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.inventory_quantity, quantity + 1))}
                  className="w-10 h-10 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          {product.inventory_quantity > 0 && (
            <div className="mt-8">
              <button
                onClick={handleAddToCart}
                className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Add to Cart
              </button>
            </div>
          )}

          {/* Additional Info */}
          <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-gray-600">
            {product.sku && (
              <div>
                <span className="font-medium text-gray-900">SKU:</span> {product.sku}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}