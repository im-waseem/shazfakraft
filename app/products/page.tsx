import { Metadata } from 'next'
import ProductsClient from './ProductsClient'
import JsonLd from '@/components/JsonLd'
import { getMetadata } from '@/lib/seo'

export const metadata: Metadata = getMetadata({
  title: 'Our Products',
  description: 'Browse our exclusive collection of premium Islamic wall art, calligraphy, prayer mats, and home decor.',
  path: '/products',
})

export default function ProductsPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shazfakraft.in'

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': siteUrl,
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Products',
        'item': `${siteUrl}/products`,
      },
    ],
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <ProductsClient />
    </>
  )
}