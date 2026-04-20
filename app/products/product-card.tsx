'use client'

import Link from 'next/link'

export default function ProductCard({ product }: { product: any }) {
  const discount = product.compare_price 
    ? Math.round((1 - product.price / product.compare_price) * 100) 
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Add to cart using localStorage
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingItemIndex = existingCart.findIndex((item: any) => item.productId === product.id)
    
    if (existingItemIndex > -1) {
      existingCart[existingItemIndex].quantity += 1
    } else {
      existingCart.push({
        id: Date.now().toString(),
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.main_image_url
      })
    }
    
    localStorage.setItem('cart', JSON.stringify(existingCart))
    
    // Show success feedback
    const button = e.currentTarget as HTMLButtonElement
    const originalText = button.textContent
    button.textContent = '✓ Added!'
    button.classList.add('bg-green-600')
    button.classList.remove('bg-indigo-600')
    
    setTimeout(() => {
      button.textContent = originalText
      button.classList.remove('bg-green-600')
      button.classList.add('bg-indigo-600')
    }, 1500)
  }

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-gray-100">
      {/* Product Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <Link href={`/products/${product.slug}`} className="block h-full w-full">
          {product.main_image_url ? (
<img
              src={product.main_image_url}
              alt={product.name}
              className="h-full w-full object-cover object-center transition-all duration-700 group-hover:scale-110 group-hover:rotate-1 shadow-lg hover:shadow-xl"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-product.jpg'
              }}
            />
          ) : (
<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="text-gray-400 text-6xl">📦</div>
            </div>
          )}
        </Link>
        
        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              -{discount}% OFF
            </span>
          </div>
        )}

        {/* Quick Action Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
          <button
            onClick={handleAddToCart}
            className="bg-white text-gray-900 px-6 py-2.5 rounded-full font-semibold shadow-xl transform translate-y-8 group-hover:translate-y-0 transition-all duration-300 hover:bg-indigo-600 hover:text-white"
          >
            Quick Add
          </button>
        </div>

        {/* Out of Stock Overlay */}
        {product.inventory_quantity <= 0 && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-gray-900 text-white px-4 py-2 rounded-lg font-semibold">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info Card */}
      <div className="p-5">
        {/* Category Label */}
        {product.categories && (
          <div className="mb-2">
            <span className="inline-flex items-center text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
              {product.categories.name}
            </span>
          </div>
        )}

        {/* Product Name */}
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2 leading-tight">
          <Link href={`/products/${product.slug}`} className="hover:text-indigo-600 transition-colors">
            {product.name}
          </Link>
        </h3>

        {/* Price Row */}
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.compare_price && (
              <span className="text-sm text-gray-400 line-through">
                ${product.compare_price.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Stock Indicator */}
        {product.inventory_quantity > 0 && product.inventory_quantity <= 10 && (
          <div className="mt-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            <span className="text-xs text-orange-600 font-medium">
              Only {product.inventory_quantity} left
            </span>
          </div>
        )}

        {/* Bottom Action Bar */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={handleAddToCart}
            disabled={product.inventory_quantity <= 0}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {product.inventory_quantity <= 0 ? 'Unavailable' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}
