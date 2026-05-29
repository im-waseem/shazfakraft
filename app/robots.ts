import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shazfakraft.in'
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/dashboard/',
        '/auth/',
        '/cart/',
        '/checkout/',
        '/profile/',
        '/api/',
        '/login/',
        '/signup/',
        '/order-success/',
        '/track-order/',
        '/private/',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
