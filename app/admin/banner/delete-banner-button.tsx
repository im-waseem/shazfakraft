'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DeleteBannerButton({ bannerId }: { bannerId: string }) {
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleDelete = () => {
    startTransition(async () => {
      const supabase = createClient()

      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', bannerId)

      if (error) {
        console.error('Error deleting banner:', error)
        alert('Failed to delete banner. Please try again.')
      } else {
        router.refresh()
      }
    })
  }

  return (
    <>
      {showConfirm ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sure?</span>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="rounded bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? 'Deleting...' : 'Yes'}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="rounded bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            No
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className="rounded bg-red-100 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-200"
        >
          Delete
        </button>
      )}
    </>
  )
}