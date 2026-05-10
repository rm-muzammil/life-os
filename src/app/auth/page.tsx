'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

export default function AuthPage() {
  const [mode, setMode]       = useState<'login' | 'signup'>('login')
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [name, setName]       = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } },
        })
        if (error) throw error
        toast.success('Check your email to confirm your account!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(124,92,252,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.04) 0%, transparent 50%)',
    }}>
      <div style={{
        width: '100%', maxWidth: 400, padding: '2rem',
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--r3)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: 'var(--text)' }}>
            RoadmapOS ⚡
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
            Germany 2028 · Top 0.1%
          </div>
        </div>

        {/* Tab */}
        <div style={{
          display: 'flex', gap: 4, background: 'var(--bg3)',
          borderRadius: 'var(--r)', padding: 4, marginBottom: '1.5rem',
          border: '1px solid var(--border)',
        }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '7px 0', borderRadius: 6,
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              fontFamily: 'var(--font-syne)',
              background: mode === m ? 'var(--bg4)' : 'transparent',
              color: mode === m ? 'var(--text)' : 'var(--text2)',
              transition: 'all 0.15s',
            }}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && (
            <div>
              <label style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 5 }}>
                Full Name
              </label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name" required
                style={inputStyle}
              />
            </div>
          )}
          <div>
            <label style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 5 }}>
              Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 5 }}>
              Password
            </label>
            <input
              type="password" value={password} onChange={e => setPass(e.target.value)}
              placeholder="••••••••" required minLength={8}
              style={inputStyle}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            padding: '11px 0', marginTop: 4,
            background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 'var(--r)',
            fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-syne)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.15s',
          }}>
            {loading ? 'Loading…' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>

        <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: '1.5rem', lineHeight: 1.6 }}>
          Your personal OS for the 2-year Germany tech roadmap.<br />
          Week 1 of 104 starts today.
        </p>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  background: 'var(--bg3)', border: '1px solid var(--border)',
  borderRadius: 'var(--r)', color: 'var(--text)',
  fontFamily: 'var(--font-syne)', fontSize: 13, outline: 'none',
}
