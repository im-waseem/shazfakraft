import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <Link href="/login">Please login to view your profile</Link>
      </div>
    )
  }

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, total_amount, status, created_at, shipping_address')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>My Profile</h1>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <p><b>Name:</b> {(customer?.first_name || '')} {(customer?.last_name || '')}</p>
        <p><b>Email:</b> {customer?.email || user.email}</p>
        <p><b>Phone:</b> {customer?.phone || '-'}</p>
        <p><b>Address:</b> {customer?.home_address || customer?.shipping_address?.address || '-'}</p>
        <p><b>City:</b> {customer?.city || customer?.shipping_address?.city || '-'}</p>
        <p><b>Pincode:</b> {customer?.pincode || customer?.shipping_address?.pincode || '-'}</p>
      </div>

      <h2 style={{ fontSize: 22, marginBottom: 12 }}>My Orders</h2>
      <div style={{ display: 'grid', gap: 10 }}>
        {(orders || []).map((o: any) => (
          <div key={o.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
            <p><b>{o.order_number}</b> · {o.status}</p>
            <p>₹{Number(o.total_amount || 0).toFixed(0)} · {new Date(o.created_at).toLocaleString()}</p>
            <p style={{ color: '#555' }}>{o.shipping_address?.address || ''}, {o.shipping_address?.city || ''} {o.shipping_address?.pincode || ''}</p>
          </div>
        ))}
        {(!orders || orders.length === 0) && <p>No orders yet.</p>}
      </div>
    </div>
  )
}
