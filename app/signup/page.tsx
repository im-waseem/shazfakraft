'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function SignupForm() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'success'>('form')
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Create customer profile linked to the auth user
    if (data?.user?.id) {
      const { error: profileError } = await supabase
        .from('customers')
        .upsert([
          {
            id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            // Do NOT store email here if your customers table uses a FK to auth.users
            // Only store if your schema has an email column directly on customers
            ...(/* include email only if column exists */ true && { email }),
            total_orders: 0,
            total_spent: 0,
            is_active: true,
          },
        ], { onConflict: 'id' })

      if (profileError) {
        console.error('Profile creation error:', profileError.message)
        // Non-blocking — auth succeeded, just log
      }
    }

    router.push('/login?message=signup-success')
  }

  const getPasswordStrength = () => {
    if (!password) return 0
    let score = 0
    if (password.length >= 6) score++
    if (password.length >= 10) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }

  const strengthScore = getPasswordStrength()
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strengthScore]
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'][strengthScore]

  return (
    <div className="flex min-h-screen bg-slate-950 items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@300;400&display=swap');

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(50px, -40px) scale(1.1); }
        }
        @keyframes orb2 {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(-40px, 50px); }
        }
        @keyframes checkIn {
          0%   { transform: scale(0) rotate(-180deg); opacity: 0; }
          60%  { transform: scale(1.2) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes progressFill {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes shimmer {
          from { background-position: -200% center; }
          to   { background-position:  200% center; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .form-card { animation: fadeSlideUp 0.6s cubic-bezier(.16,1,.3,1) both; }
        .form-field { animation: fadeSlideUp 0.5s cubic-bezier(.16,1,.3,1) both; }
        .orb-1 { animation: orb1 8s ease-in-out infinite; }
        .orb-2 { animation: orb2 11s ease-in-out infinite; }
        .check-icon { animation: checkIn 0.5s cubic-bezier(.34,1.56,.64,1) both; }
        .spinner { animation: spin 0.8s linear infinite; }

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
        .field-input::placeholder { color: rgba(255,255,255,0.18); }

        .btn-primary {
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(124,58,237,0.4); }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.5; }

        .glass-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(20px);
        }
        .strength-bar {
          transition: width 0.4s cubic-bezier(.16,1,.3,1), background-color 0.4s ease;
          height: 3px;
          border-radius: 2px;
        }
      `}</style>

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="orb-1 absolute top-1/3 right-1/4 w-96 h-96 rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }}></div>
        <div className="orb-2 absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #4f46e5, transparent 70%)' }}></div>
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}></div>
      </div>

      <div className="form-card w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #7c3aed20, #4f46e520)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="7" r="4" stroke="#a78bfa" strokeWidth="1.5"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Create account</h1>
          <p className="text-slate-500 text-sm mt-1">Join us and start shopping</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {error && (
            <div className="mb-5 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <span className="text-red-400 text-sm">⚠</span>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name row */}
            <div className="form-field grid grid-cols-2 gap-3" style={{ animationDelay: '0.08s' }}>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-widest"
                  style={{ fontFamily: "'DM Mono', monospace" }}>First</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="field-input w-full rounded-xl px-4 py-3 text-sm"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-widest"
                  style={{ fontFamily: "'DM Mono', monospace" }}>Last</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="field-input w-full rounded-xl px-4 py-3 text-sm"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="form-field" style={{ animationDelay: '0.12s' }}>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-widest"
                style={{ fontFamily: "'DM Mono', monospace" }}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="field-input w-full rounded-xl px-4 py-3 text-sm"
                placeholder="john@example.com"
                autoComplete="email"
              />
            </div>

            <div className="form-field" style={{ animationDelay: '0.16s' }}>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-widest"
                style={{ fontFamily: "'DM Mono', monospace" }}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="field-input w-full rounded-xl px-4 py-3 text-sm"
                placeholder="Min. 6 characters"
                autoComplete="new-password"
              />
              {/* Strength indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex-1 h-0.5 rounded-full transition-all duration-300"
                        style={{ background: i <= strengthScore ? strengthColor : 'rgba(255,255,255,0.08)' }}></div>
                    ))}
                  </div>
                  <p className="text-xs transition-colors" style={{ color: strengthColor }}>
                    {strengthLabel}
                  </p>
                </div>
              )}
            </div>

            <div className="form-field" style={{ animationDelay: '0.2s' }}>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-widest"
                style={{ fontFamily: "'DM Mono', monospace" }}>Confirm Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="field-input w-full rounded-xl px-4 py-3 pr-10 text-sm"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
                {confirmPassword && password === confirmPassword && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 check-icon">✓</span>
                )}
              </div>
            </div>

            <div className="form-field pt-2" style={{ animationDelay: '0.24s' }}>
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
                    Creating account…
                  </>
                ) : (
                  <>Create account <span className="opacity-60">→</span></>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-xs text-slate-600 text-center leading-relaxed">
              By creating an account you agree to our{' '}
              <span className="text-slate-500 hover:text-slate-400 cursor-pointer transition-colors">Terms of Service</span>
              {' '}and{' '}
              <span className="text-slate-500 hover:text-slate-400 cursor-pointer transition-colors">Privacy Policy</span>
            </p>
          </div>
        </div>

        <div className="text-center mt-6 space-y-3">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in
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

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-slate-950 items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"></div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}