'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    home_address: '',
    city: '',
    pincode: '',
  })

  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser()
      const currentUser = authData.user
      setUser(currentUser)

      if (!currentUser) {
        setLoading(false)
        return
      }

      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle()

      setForm({
        first_name: customer?.first_name || '',
        last_name: customer?.last_name || '',
        email: customer?.email || currentUser.email || '',
        phone: customer?.phone || '',
        home_address: customer?.home_address || customer?.shipping_address?.address || '',
        city: customer?.city || customer?.shipping_address?.city || '',
        pincode: customer?.pincode || customer?.shipping_address?.pincode || '',
      })

      const { data: userOrders } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, status, created_at, shipping_address')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      setOrders(userOrders || [])
      setLoading(false)
    }
    load()
  }, [])

  const saveProfile = async () => {
    if (!user) return

    const payload = {
      id: user.id,
      ...form,
      shipping_address: {
        address: form.home_address,
        city: form.city,
        pincode: form.pincode,
      },
      billing_address: {
        address: form.home_address,
        city: form.city,
        pincode: form.pincode,
      },
      is_active: true,
    }

    const { error } = await supabase.from('customers').upsert(payload, { onConflict: 'id' })
    if (error) {
      alert(error.message)
      return
    }
    alert('Profile updated successfully')
  }

  if (loading) return <div style={{ padding: 24 }}>Loading profile...</div>

  if (!user) {
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <Link href="/login">Please login to view your profile</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>My Profile</h1>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input placeholder="First name" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} />
          <input placeholder="Last name" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
          <input placeholder="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          <input placeholder="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          <input placeholder="Home address" value={form.home_address} onChange={e => setForm(p => ({ ...p, home_address: e.target.value }))} />
          <input placeholder="City" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
          <input placeholder="Pincode" value={form.pincode} onChange={e => setForm(p => ({ ...p, pincode: e.target.value }))} />
        </div>
        <button onClick={saveProfile} style={{ marginTop: 12, background: '#111', color: '#fff', borderRadius: 8, border: 0, padding: '8px 12px' }}>Save Profile</button>
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
