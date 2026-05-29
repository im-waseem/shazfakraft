import { Metadata } from 'next'

export function getMetadata({
  title,
  description,
  path = '',
  image = '/icon.png',
  noIndex = false,
}: {
  title: string
  description: string
  path?: string
  image?: string
  noIndex?: boolean
}): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shazfakraft.in'
  const canonicalUrl = `${siteUrl}${path}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: `${title} | Shazfa Kraft`,
      description,
      url: canonicalUrl,
      siteName: 'Shazfa Kraft',
      locale: 'en_IN',
      type: 'website',
      images: [
        {
          url: image.startsWith('http') ? image : `${siteUrl}${image}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Shazfa Kraft`,
      description,
      images: [image.startsWith('http') ? image : `${siteUrl}${image}`],
    },
  }
}
