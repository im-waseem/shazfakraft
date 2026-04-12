'use client'

import Link from 'next/link'

export default function OrderSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
        <p className="text-gray-500 mb-6">
          Thank you for your purchase. Your order has been received and is being processed.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
          <p className="text-sm text-gray-600">
            You will receive an email confirmation with your order number and tracking information shortly.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/products"
            className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            href="/"
            className="text-indigo-600 hover:underline"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}