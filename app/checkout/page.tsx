// app/checkout/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getOrders } from '@/lib/orders'
import CheckoutClient from './CheckoutClient'

export default async function CheckoutPage() {
  const supabase = await createClient()
  const orders = await getOrders(supabase)
  return <CheckoutClient orders={orders} />
}