'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950 items-center justify-center px-4 relative overflow-hidden"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@300;400&display=swap');

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(40px, -30px) scale(1.1); }
        }
        @keyframes orb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-30px, 40px) scale(0.95); }
        }
        @keyframes shimmer {
          from { background-position: -200% center; }
          to   { background-position:  200% center; }
        }
        .form-card   { animation: fadeSlideUp 0.6s cubic-bezier(.16,1,.3,1) both; }
        .form-field  { animation: fadeSlideUp 0.5s cubic-bezier(.16,1,.3,1) both; }
        .orb-1 { animation: orb1 8s ease-in-out infinite; }
        .orb-2 { animation: orb2 10s ease-in-out infinite; }

        .field-input {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          color: white;
          transition: all 0.2s ease;
        }
        .field-input:focus {
          outline: none;
          background: rgba(139,92,246,0.06);
          border-color: rgba(139,92,246,0.5);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
        }
        .field-input::placeholder { color: rgba(255,255,255,0.2); }

        .btn-primary {
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(124,58,237,0.4); }
        .btn-primary:hover::after { opacity: 1; animation: shimmer 0.8s linear; }
        .btn-primary:active { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.5; transform: none; box-shadow: none; }

        .glass-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(20px);
        }
        .label-float {
          transition: all 0.2s ease;
        }
        .spinner {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="orb-1 absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }}></div>
        <div className="orb-2 absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #4f46e5, transparent 70%)' }}></div>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}></div>
      </div>

      <div className="form-card w-full max-w-md relative z-10">
        {/* Logo mark */}
        <div className="text-center mb-8" style={{ animationDelay: '0.05s' }}>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #7c3aed20, #4f46e520)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {/* Error from redirect */}
          {searchParams.get('error') === 'unauthorized' && (
            <div className="mb-5 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <span className="text-red-400 text-sm">⚠</span>
              <p className="text-red-400 text-sm">You don't have admin access.</p>
            </div>
          )}

          {/* Success from signup */}
          {searchParams.get('message') === 'signup-success' && (
            <div className="mb-5 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
              <span className="text-emerald-400 text-sm">✓</span>
              <p className="text-emerald-400 text-sm">Account created! Check your email to confirm.</p>
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <span className="text-red-400 text-sm">⚠</span>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-field" style={{ animationDelay: '0.1s' }}>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-widest"
                style={{ fontFamily: "'DM Mono', monospace" }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className="field-input w-full rounded-xl px-4 py-3 text-sm"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="form-field" style={{ animationDelay: '0.15s' }}>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-widest"
                style={{ fontFamily: "'DM Mono', monospace" }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className="field-input w-full rounded-xl px-4 py-3 text-sm"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <div className="form-field pt-2" style={{ animationDelay: '0.2s' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="spinner w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>Sign in <span className="opacity-60">→</span></>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center mt-6 space-y-3">
          <p className="text-sm text-slate-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign up
            </Link>
          </p>
          <Link href="/" className="block text-xs text-slate-700 hover:text-slate-500 transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-slate-950 items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}