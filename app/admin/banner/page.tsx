import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AddBannerForm from './add-banner-form'
import BannerList from './banner-list'

export default async function BannerManagementPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all banners
  const { data: banners, error } = await supabase
    .from('banners')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching banners:', error)
  }

  return (
    <div className="min-h-full flex flex-col bg-zinc-50">
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Manage Banners
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage coupon banners for the homepage
            </p>
          </div>
          <a
            href="/admin"
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            ← Back to Dashboard
          </a>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Add Banner Form */}
          <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
            <h2 className="text-xl font-semibold text-gray-900">
              Add New Banner
            </h2>
            <AddBannerForm />
          </div>

          {/* Banners List */}
          <BannerList banners={banners || []} />
        </div>
      </main>
    </div>
  )
}