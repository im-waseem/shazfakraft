import { Metadata } from 'next'
import AboutClient from './AboutClient'
import { getMetadata } from '@/lib/seo'

export const metadata: Metadata = getMetadata({
  title: 'About Us',
  description: 'Shazfa Kraft was founded with a single belief — that every Muslim deserves access to quality, authentic products that enrich their daily worship and lifestyle.',
  path: '/about',
})

export default function AboutPage() {
  return <AboutClient />
}