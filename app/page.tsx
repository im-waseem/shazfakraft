import { Metadata } from 'next'
import HomeClient from './HomeClient'
import JsonLd from '@/components/JsonLd'
import { getMetadata } from '@/lib/seo'

export const metadata: Metadata = getMetadata({
  title: 'Home',
  description: 'Premium Islamic wall art, calligraphy, and home decor. Authentic products, ethically sourced.',
  path: '/',
})

export default function HomePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shazfakraft.in'

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Shazfa Kraft',
    'url': siteUrl,
    'logo': `${siteUrl}/icon.png`,
    'contactPoint': {
      '@type': 'ContactPoint',
      'telephone': '+917022831935',
      'contactType': 'customer service'
    },
    'sameAs': [
      'https://instagram.com/shazfa_kraft'
    ]
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Shazfa Kraft',
    'url': siteUrl,
    'potentialAction': {
      '@type': 'SearchAction',
      'target': `${siteUrl}/products?search={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': 'Shazfa Kraft',
    'image': `${siteUrl}/icon.png`,
    '@id': `${siteUrl}/#local-business`,
    'url': siteUrl,
    'telephone': '+917022831935',
    'priceRange': '₹₹',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': 'Bangalore',
      'addressLocality': 'Bangalore',
      'addressRegion': 'Karnataka',
      'postalCode': '560001',
      'addressCountry': 'IN'
    },
    'geo': {
      '@type': 'GeoCoordinates',
      'latitude': 12.9716,
      'longitude': 77.5946
    },
    'openingHoursSpecification': {
      '@type': 'OpeningHoursSpecification',
      'dayOfWeek': [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ],
      'opens': '09:00',
      'closes': '21:00'
    }
  }

  return (
    <>
      <JsonLd data={orgSchema} />
      <JsonLd data={websiteSchema} />
      <JsonLd data={localBusinessSchema} />
      <HomeClient />
    </>
  )
}