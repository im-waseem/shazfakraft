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

export default function BannerList({ banners }: { banners: Banner[] }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return

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

  const handleEdit = (bannerId: string, title: string, description: string) => {
    startTransition(async () => {
      const supabase = createClient()

      const { error } = await supabase
        .from('banners')
        .update({ title, description })
        .eq('id', bannerId)

      if (error) {
        console.error('Error updating banner:', error)
        alert('Failed to update banner. Please try again.')
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="rounded-lg bg-white shadow-md">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Existing Banners
        </h2>
      </div>

      {(!banners || banners.length === 0) ? (
        <div className="px-6 py-8 text-center text-gray-500">
          No banners created yet. Add your first banner above.
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {banners.map((banner) => (
            <BannerItem
              key={banner.id}
              banner={banner}
              onDelete={handleDelete}
              onEdit={handleEdit}
              isPending={isPending}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function BannerItem({ 
  banner, 
  onDelete, 
  onEdit, 
  isPending 
}: { 
  banner: Banner
  onDelete: (id: string) => void
  onEdit: (id: string, title: string, description: string) => void
  isPending: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(banner.title)
  const [description, setDescription] = useState(banner.description)

  const handleSave = () => {
    onEdit(banner.id, title, description)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setTitle(banner.title)
    setDescription(banner.description)
  }

  return (
    <li className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
      <div className="flex-1">
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Banner title"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Banner description"
              rows={2}
            />
          </div>
        ) : (
          <>
            <h3 className="font-medium text-gray-900">
              {banner.title}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {banner.description}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Created: {new Date(banner.created_at).toLocaleDateString()}
            </p>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="rounded bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="rounded bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(banner.id)}
              disabled={isPending}
              className="rounded bg-red-100 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>
    </li>
  )
}