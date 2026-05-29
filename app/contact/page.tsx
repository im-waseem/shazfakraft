import { Metadata } from 'next'
import ContactClient from './ContactClient'
import { getMetadata } from '@/lib/seo'
import JsonLd from '@/components/JsonLd'

export const metadata: Metadata = getMetadata({
  title: 'Contact Us',
  description: 'Have questions, feedback, or just want to say salaam? Reach out to Shazfa Kraft based in Bangalore, Karnataka, India.',
  path: '/contact',
})

export default function ContactPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shazfakraft.in'

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'Do you ship across India?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes, we ship pan-India. Most orders arrive within 3–5 business days.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Are your products Shariah-compliant?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Every product is reviewed before listing. We source from trusted suppliers only.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How do I track my order?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Once shipped, you\'ll receive an SMS and email with tracking details.'
        }
      },
      {
        '@type': 'Question',
        'name': 'What is your return policy?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'We accept returns within 7 days for damaged or incorrect items.'
        }
      }
    ]
  }

  return (
    <>
      <JsonLd data={faqSchema} />
      <ContactClient />
    </>
  )
}