'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message || 'Unable to sign in')
      setLoading(false)
      return
    }
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
      @keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
      .card{animation:rise .45s ease;background:#fff;border:1px solid #e8e0d4;border-radius:18px;padding:28px;width:100%;max-width:430px}
      .input{color:#1a1410;background-color:#ffffff;width:100%;padding:12px 14px;border:1.5px solid #d4c8b8;border-radius:10px;outline:none}.input:focus{border-color:#b8860b;box-shadow:0 0 0 3px rgba(184,134,11,.12)}
      .btn{width:100%;padding:12px;border-radius:999px;border:none;background:#b8860b;color:#fff;font-weight:700;cursor:pointer}
      .btn:disabled{opacity:.6;cursor:not-allowed}
      `}</style>

      <div className="card">
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, color: '#1a1410', marginBottom: 4 }}>Welcome Back</h1>
        <p style={{ color: '#6b5c4a', marginBottom: 18 }}>Sign in to continue</p>

        {searchParams.get('message') === 'signup-success' && <p style={{ background: '#f0f9f2', color: '#2d7a3a', padding: 10, borderRadius: 10, marginBottom: 10 }}>Account created successfully.</p>}
        {error && <p style={{ background: '#fff1f1', color: '#b42318', padding: 10, borderRadius: 10, marginBottom: 10 }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <input className="input" type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <div style={{ position: 'relative' }}>
            <input className="input" type={showPassword ? 'text' : 'password'} required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 10, top: 10, border: 0, background: 'transparent', color: '#6b5c4a', cursor: 'pointer' }}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>
          <button className="btn" type="submit" disabled={loading || !email || !password}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>

        <p style={{ marginTop: 14, color: '#6b5c4a', fontSize: 14 }}>New here? <Link href="/signup" style={{ color: '#b8860b', fontWeight: 700 }}>Create account</Link></p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', background: '#faf8f5' }} />}><LoginForm /></Suspense>
}
