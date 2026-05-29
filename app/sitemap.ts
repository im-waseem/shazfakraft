import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600 // Cache sitemap for 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shazfakraft.in'

  // Initialize server-side Supabase client without next/headers cookies
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. Static pages
  const staticPages = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${siteUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ]

  // 2. Fetch active products
  let productPages: MetadataRoute.Sitemap = []
  try {
    const { data: products } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('is_active', true)

    if (products) {
      productPages = products.map((product) => ({
        url: `${siteUrl}/products/${product.slug}`,
        lastModified: new Date(product.updated_at || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    }
  } catch (err) {
    console.error('Error generating product sitemaps:', err)
  }

  // 3. Fetch active categories
  let categoryPages: MetadataRoute.Sitemap = []
  try {
    const { data: categories } = await supabase
      .from('categories')
      .select('id, updated_at')
      .eq('is_active', true)

    if (categories) {
      categoryPages = categories.map((cat) => ({
        url: `${siteUrl}/products?category=${cat.id}`,
        lastModified: new Date(cat.updated_at || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    }
  } catch (err) {
    console.error('Error generating category sitemaps:', err)
  }

  return [...staticPages, ...productPages, ...categoryPages]
}
