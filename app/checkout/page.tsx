// app/checkout/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getOrders } from '@/lib/orders'
import CheckoutClient from './CheckoutClient'

export default async function CheckoutPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Guest users can checkout without loading protected order history
  let orders: any[] = []
  if (user) {
    try {
      orders = await getOrders(supabase)
    } catch {
      orders = []
    }
  }

  return <CheckoutClient orders={orders} />
}