import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import ProductDetailClient from './ProductDetailClient'
import JsonLd from '@/components/JsonLd'
import { getMetadata } from '@/lib/seo'

// Setup supabase client for server-side SEO rendering
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getProductData(slug: string) {
  let { data: product } = await supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('slug', slug)
    .maybeSingle()

  if (!product) {
    const { data: all } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .ilike('slug', `%${slug}%`)
      .limit(1)
    if (all?.length) product = all[0]
  }

  if (!product) return null

  const { data: variants } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', product.id)
    .eq('is_active', true)
    .order('position')

  const relQ = supabase
    .from('products')
    .select('id,name,slug,price,compare_price,main_image_url,inventory_quantity')
    .eq('is_active', true)
    .neq('id', product.id)
    .order('created_at', { ascending: false })
    .limit(8)

  const { data: moreProducts } = product.category_id
    ? await relQ.eq('category_id', product.category_id)
    : await relQ

  // Fetch reviews for schema validation
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating, comment, created_at, user_id')
    .eq('product_id', product.id)
    .eq('is_approved', true)

  return {
    product,
    variants: variants || [],
    moreProducts: (moreProducts as any[]) || [],
    reviews: reviews || []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const data = await getProductData(slug)
  if (!data) {
    return {
      title: 'Product Not Found',
    }
  }

  const { product } = data
  return getMetadata({
    title: product.meta_title || product.name,
    description: product.meta_description || product.short_description || product.description?.slice(0, 155) || '',
    path: `/products/${product.slug}`,
    image: product.main_image_url || '/icon.png',
  })
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getProductData(slug)
  if (!data) {
    notFound()
  }

  const { product, variants, moreProducts, reviews } = data

  const reviewCount = reviews.length
  const avgRating = reviewCount > 0 
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
    : 0

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shazfakraft.in'
  const isOOS = product.inventory_quantity <= 0 && product.track_inventory !== false

  const productSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name,
    'image': product.main_image_url ? (product.main_image_url.startsWith('http') ? product.main_image_url : `${siteUrl}${product.main_image_url}`) : `${siteUrl}/icon.png`,
    'description': product.short_description || product.description || '',
    'sku': product.sku || product.id,
    'offers': {
      '@type': 'Offer',
      'url': `${siteUrl}/products/${product.slug}`,
      'priceCurrency': 'INR',
      'price': product.price,
      'priceValidUntil': '2027-12-31',
      'itemCondition': 'https://schema.org/NewCondition',
      'availability': isOOS ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      'shippingDetails': {
        '@type': 'OfferShippingDetails',
        'shippingRate': {
          '@type': 'MonetaryAmount',
          'value': product.price >= 499 ? 0 : 50,
          'currency': 'INR'
        },
        'shippingDestination': {
          '@type': 'DefinedRegion',
          'addressCountry': 'IN'
        }
      }
    }
  }

  if (reviewCount > 0) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      'ratingValue': avgRating,
      'reviewCount': reviewCount,
      'bestRating': 5,
      'worstRating': 1
    }
    productSchema.review = reviews.slice(0, 3).map((r, i) => ({
      '@type': 'Review',
      'reviewRating': {
        '@type': 'Rating',
        'ratingValue': r.rating
      },
      'author': {
        '@type': 'Person',
        'name': `Customer ${i + 1}`
      },
      'reviewBody': r.comment,
      'datePublished': r.created_at
    }))
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': siteUrl
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Products',
        'item': `${siteUrl}/products`
      }
    ]
  }

  if (product.categories) {
    breadcrumbSchema.itemListElement.push({
      '@type': 'ListItem',
      'position': 3,
      'name': product.categories.name,
      'item': `${siteUrl}/products?category=${product.category_id}`
    })
    breadcrumbSchema.itemListElement.push({
      '@type': 'ListItem',
      'position': 4,
      'name': product.name,
      'item': `${siteUrl}/products/${product.slug}`
    })
  } else {
    breadcrumbSchema.itemListElement.push({
      '@type': 'ListItem',
      'position': 3,
      'name': product.name,
      'item': `${siteUrl}/products/${product.slug}`
    })
  }

  return (
    <>
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      <ProductDetailClient
        product={product}
        variants={variants}
        moreProducts={moreProducts}
        slug={slug}
      />
    </>
  )
}
