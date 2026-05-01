'use server'

import { createClient } from '@/lib/supabase/server'

export async function getOrders() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Get orders error:', error.message)
    return []
  }

  return data ?? []
}