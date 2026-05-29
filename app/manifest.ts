import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Shazfa Kraft',
    short_name: 'Shazfa Kraft',
    description: 'Premium Islamic wall art, calligraphy, and home decor. Authentic products, ethically sourced.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fffbf5',
    theme_color: '#c8860a',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
