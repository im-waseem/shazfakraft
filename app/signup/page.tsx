'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function SignupForm() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    if (password !== confirmPassword) return setError('Passwords do not match'), setLoading(false)
    if (password.length < 6) return setError('Password must be at least 6 characters'), setLoading(false)

    const supabase = createClient()
    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } },
    })
    if (signUpError) return setError(signUpError.message || 'Unable to create account'), setLoading(false)

    if (data?.user?.id) {
      await supabase.from('customers').upsert([{ id: data.user.id, first_name: firstName, last_name: lastName, email, total_orders: 0, total_spent: 0, is_active: true }], { onConflict: 'id' })
    }
    router.push('/login?message=signup-success')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
      @keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
      .card{animation:rise .45s ease;background:#fff;border:1px solid #e8e0d4;border-radius:18px;padding:28px;width:100%;max-width:460px}
      .input{color:#1a1410;background-color:#ffffff;width:100%;padding:12px 14px;border:1.5px solid #d4c8b8;border-radius:10px;outline:none}.input:focus{border-color:#b8860b;box-shadow:0 0 0 3px rgba(184,134,11,.12)}
      .btn{width:100%;padding:12px;border-radius:999px;border:none;background:#b8860b;color:#fff;font-weight:700;cursor:pointer}.btn:disabled{opacity:.6}
      `}</style>

      <div className="card">
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, color: '#1a1410', marginBottom: 4 }}>Create Account</h1>
        <p style={{ color: '#6b5c4a', marginBottom: 18 }}>Join us in less than a minute</p>
        {error && <p style={{ background: '#fff1f1', color: '#b42318', padding: 10, borderRadius: 10, marginBottom: 10 }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input className="input" required placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} />
            <input className="input" required placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
          <input className="input" type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <div style={{ position: 'relative' }}>
            <input className="input" type={showPassword ? 'text' : 'password'} required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 10, top: 10, border: 0, background: 'transparent', color: '#6b5c4a' }}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>
          <div style={{ position: 'relative' }}>
            <input className="input" type={showConfirmPassword ? 'text' : 'password'} required placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            <button type="button" onClick={() => setShowConfirmPassword(v => !v)} style={{ position: 'absolute', right: 10, top: 10, border: 0, background: 'transparent', color: '#6b5c4a' }}>{showConfirmPassword ? 'Hide' : 'Show'}</button>
          </div>
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create Account'}</button>
        </form>

        <p style={{ marginTop: 14, color: '#6b5c4a', fontSize: 14 }}>Already have an account? <Link href="/login" style={{ color: '#b8860b', fontWeight: 700 }}>Sign in</Link></p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', background: '#faf8f5' }} />}><SignupForm /></Suspense>
}
