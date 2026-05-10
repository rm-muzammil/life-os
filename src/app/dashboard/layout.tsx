'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getCurrentPhase, getCurrentWeek, TOTAL_WEEKS } from '@/types'
import {
  LayoutDashboard, KanbanSquare, Flame, BarChart3,
  Bot, LogOut, Zap, ChevronRight, Settings,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'Today',     color: '#7c5cfc' },
  { href: '/board',       icon: KanbanSquare,    label: 'Task Board', color: '#3b82f6' },
  { href: '/streak',      icon: Flame,           label: 'Streak',     color: '#3ddc84' },
  { href: '/analytics',   icon: BarChart3,       label: 'Analytics',  color: '#f59e0b' },
  { href: '/agent',       icon: Bot,             label: 'AI Agent',   color: '#ec4899' },
  { href: '/settings',   icon: Settings,        label: 'Settings',   color: '#94a3b8' },
]

const TRACKS = [
  { label: 'ML / AI',      color: '#7c5cfc' },
  { label: 'Cloud',        color: '#3b82f6' },
  { label: 'Backend',      color: '#10b981' },
  { label: 'Data',         color: '#f59e0b' },
  { label: 'Projects',     color: '#ef4444' },
  { label: 'German',       color: '#ec4899' },
  { label: 'MERN Finance', color: '#14b8a6' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const week     = getCurrentWeek()
  const phase    = getCurrentPhase()
  const pct      = Math.min(100, Math.round(week / TOTAL_WEEKS * 100))

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>

        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.5 }}>RoadmapOS ⚡</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
            Germany 2028
          </div>
          {/* Progress bar */}
          <div style={{ marginTop: 10, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
              borderRadius: 2, transition: 'width 1s ease',
            }} />
          </div>
          <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
            Week {week} of {TOTAL_WEEKS} · {pct}%
          </div>
        </div>

        {/* Main nav */}
        <div style={{ padding: '12px 0 4px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 16px', marginBottom: 4 }}>
            Views
          </div>
          {NAV.map(({ href, icon: Icon, label, color }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 16px', fontSize: 13, fontWeight: 500,
                color: active ? 'var(--text)' : 'var(--text2)',
                background: active ? 'var(--bg3)' : 'transparent',
                borderLeft: `2px solid ${active ? color : 'transparent'}`,
                textDecoration: 'none', transition: 'all 0.15s',
              }}>
                <Icon size={14} style={{ color: active ? color : 'var(--text3)' }} />
                {label}
              </Link>
            )
          })}
        </div>

        {/* Track filters */}
        <div style={{ padding: '12px 0 4px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 16px', marginBottom: 4 }}>
            Tracks
          </div>
          {TRACKS.map(({ label, color }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', fontSize: 12, color: 'var(--text2)', cursor: 'pointer',
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
              {label}
            </div>
          ))}
        </div>

        {/* Phase card */}
        <div style={{ margin: '12px 10px', padding: '10px 12px', background: 'var(--bg3)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 9, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700, marginBottom: 2 }}>
            PHASE {phase.number}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{phase.name}</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, lineHeight: 1.4 }}>{phase.desc}</div>
        </div>

        {/* Spacer + Sign out */}
        <div style={{ marginTop: 'auto', padding: '12px 0', borderTop: '1px solid var(--border)' }}>
          <button onClick={signOut} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 16px', fontSize: 12, color: 'var(--text3)',
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-syne)',
          }}>
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
