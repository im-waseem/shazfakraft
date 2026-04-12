'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function About() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
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
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-indigo-600">Shafa</span>
              <span className="ml-2 text-xl font-semibold text-gray-900">eCommerce</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/cart" className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </Link>
              <Link href="/login" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">About Us</h1>
          <div className="max-w-3xl mx-auto text-gray-600 leading-relaxed">
            <p className="mb-6">
              Welcome to Shafa eCommerce, your one-stop destination for quality products. 
              We are committed to providing our customers with the best shopping experience 
              through our wide range of products and excellent customer service.
            </p>
            <p className="mb-6">
              Founded with a vision to make online shopping convenient and enjoyable, 
              we have grown to become a trusted name in the eCommerce industry.
            </p>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 mt-8">Our Mission</h2>
            <p className="mb-6">
              To provide high-quality products at competitive prices while ensuring 
              customer satisfaction through exceptional service and support.
            </p>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 mt-8">Why Choose Us?</h2>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2 mt-0.5">&#x2713;</span>
                <span>Wide range of quality products</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2 mt-0.5">&#x2713;</span>
                <span>Competitive prices</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2 mt-0.5">&#x2713;</span>
                <span>Excellent customer service</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2 mt-0.5">&#x2713;</span>
                <span>Secure and convenient shopping</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

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
                <li><Link href="/" className="hover:text-white">Home</Link></li>
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