'use client'

import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, useCallback, use } from 'react'

/* ================= TYPES ================= */

interface Product {
  id: string
  name: string
  slug: string
  description: string
  short_description: string
  price: number
  compare_price: number | null
  main_image_url: string
  images: string[]
  inventory_quantity: number
}

interface Variant {
  id: string
  price: number | null
  inventory_quantity: number
  options: Record<string, string>
}

/* ================= UTILS ================= */

function parseOptions(variants: Variant[]) {
  const map: Record<string, Set<string>> = {}
  variants.forEach(v => {
    Object.entries(v.options || {}).forEach(([k, val]) => {
      if (!map[k]) map[k] = new Set()
      map[k].add(val)
    })
  })
  return Object.fromEntries(
    Object.entries(map).map(([k, v]) => [k, Array.from(v)])
  )
}

/* ================= PAGE ================= */

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)

  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<Variant[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)

  const [zoom, setZoom] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })

  /* ================= FETCH ================= */

  const fetchData = useCallback(async () => {
    const supabase = createClient()

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (!data) {
      setLoading(false)
      return
    }

    setProduct(data)

    const { data: vData } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', data.id)

    const vList: Variant[] = vData || []
    setVariants(vList)

    const opts = parseOptions(vList)
    const defaults: Record<string, string> = {}
    Object.entries(opts).forEach(([k, v]) => (defaults[k] = v[0]))
    setSelectedOptions(defaults)

    setLoading(false)
  }, [slug])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /* ================= HANDLERS ================= */

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }

  const addToCart = () => {
    if (!product) return
    alert('Added to cart')
  }

  /* ================= DATA ================= */

  if (loading) return <p>Loading...</p>
  if (!product) return <p>Not found</p>

  const images = [product.main_image_url, ...(product.images || [])]

  const price = product.price

  /* ================= UI ================= */

  return (
    <div style={{ maxWidth: 1100, margin: 'auto', padding: 20 }}>
      
      {/* TITLE */}
      <h1 style={{ marginBottom: 10 }}>{product.name}</h1>

      {/* GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>

        {/* IMAGE */}
        <div>
          <div
            onMouseEnter={() => setZoom(true)}
            onMouseLeave={() => setZoom(false)}
            onMouseMove={handleMouseMove}
            style={{
              width: '100%',
              height: 400,
              overflow: 'hidden',
              border: '1px solid #ddd',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                transform: zoom ? 'scale(1.5)' : 'scale(1)',
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                transition: zoom ? 'none' : '0.3s',
              }}
            >
              <Image
                src={images[selectedImage]}
                alt={product.name}
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>

          {/* THUMBNAILS */}
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                width={70}
                height={70}
                onClick={() => setSelectedImage(i)}
                style={{
                  cursor: 'pointer',
                  border: i === selectedImage ? '2px solid orange' : '1px solid #ccc',
                }}
              />
            ))}
          </div>
        </div>

        {/* INFO */}
        <div>

          <h2>₹{price}</h2>

          <p style={{ color: '#555', marginBottom: 10 }}>
            {product.short_description}
          </p>

          {/* OPTIONS */}
          {Object.entries(parseOptions(variants)).map(([key, values]) => (
            <div key={key} style={{ marginBottom: 10 }}>
              <strong>{key}:</strong>
              <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                {values.map(val => (
                  <button
                    key={val}
                    onClick={() =>
                      setSelectedOptions(p => ({ ...p, [key]: val }))
                    }
                    style={{
                      padding: '6px 10px',
                      border:
                        selectedOptions[key] === val
                          ? '2px solid orange'
                          : '1px solid #ccc',
                      cursor: 'pointer',
                    }}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* QTY */}
          <div style={{ marginTop: 10 }}>
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
            <span style={{ margin: '0 10px' }}>{quantity}</span>
            <button onClick={() => setQuantity(q => q + 1)}>+</button>
          </div>

          {/* CTA */}
          <button
            onClick={addToCart}
            style={{
              marginTop: 20,
              padding: '12px 20px',
              background: 'orange',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* DESCRIPTION */}
      <div style={{ marginTop: 40 }}>
        <h3>Description</h3>
        <p>{product.description}</p>
      </div>
    </div>
  )
}