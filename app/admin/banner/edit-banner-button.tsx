'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Banner {
  id: string
  title: string
  description: string
  created_at: string
}

export default function EditBannerButton({ banner }: { banner: Banner }) {
  const [isPending, startTransition] = useTransition()
  const [showEdit, setShowEdit] = useState(false)
  const [title, setTitle] = useState(banner.title)
  const [description, setDescription] = useState(banner.description)
  const router = useRouter()

  const handleEdit = () => {
    startTransition(async () => {
      const supabase = createClient()

      const { error } = await supabase
        .from('banners')
        .update({ title, description })
        .eq('id', banner.id)

      if (error) {
        console.error('Error updating banner:', error)
        alert('Failed to update banner. Please try again.')
      } else {
        setShowEdit(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      {showEdit ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <button
            onClick={handleEdit}
            disabled={isPending}
            className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => {
              setShowEdit(false)
              setTitle(banner.title)
              setDescription(banner.description)
            }}
            className="rounded bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowEdit(true)}
          className="rounded bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200"
        >
          Edit
        </button>
      )}
    </>
  )
}