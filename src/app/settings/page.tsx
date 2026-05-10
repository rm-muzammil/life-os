'use client'
// src/app/settings/page.tsx

import { NotificationSettings } from '@/components/ui/NotificationSettings'
import { getCurrentWeek, getCurrentPhase, TOTAL_WEEKS } from '@/types'
import { Bell, User, Zap, ExternalLink } from 'lucide-react'

export default function SettingsPage() {
  const week  = getCurrentWeek()
  const phase = getCurrentPhase()

  return (
    <div>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>Settings</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
          Week {week} of {TOTAL_WEEKS} · Phase {phase.number}: {phase.name}
        </div>
      </div>

      <div style={{ padding: '20px 24px', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Notifications */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Bell size={15} style={{ color: 'var(--accent)' }} />
            <div style={{ fontSize: 14, fontWeight: 700 }}>Morning Notifications</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.6 }}>
            Get a daily push notification when your tasks are ready. Works on Android Chrome and iOS Safari (when installed as a home screen app).
          </div>
          <NotificationSettings />
        </section>

        <div style={{ height: 1, background: 'var(--border)' }} />

        {/* Roadmap status */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Zap size={15} style={{ color: 'var(--accent)' }} />
            <div style={{ fontSize: 14, fontWeight: 700 }}>Roadmap Status</div>
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Current week',  `${week} of ${TOTAL_WEEKS}`],
              ['Progress',      `${Math.round(week / TOTAL_WEEKS * 100)}% complete`],
              ['Current phase', `Phase ${phase.number}: ${phase.name}`],
              ['Target',        '10 May 2028 · Top 0.1% German ML Engineer'],
              ['Start date',    '10 May 2026'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{label}</span>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </section>

        <div style={{ height: 1, background: 'var(--border)' }} />

        {/* VAPID setup guide */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Push Setup Checklist</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { step: '1', text: 'Run: node scripts/generate-vapid-keys.js', done: true },
              { step: '2', text: 'Add NEXT_PUBLIC_VAPID_PUBLIC_KEY to .env.local', done: true },
              { step: '3', text: 'Add VAPID_PRIVATE_KEY to .env.local', done: true },
              { step: '4', text: 'Add VAPID_SUBJECT=mailto:you@email.com to .env.local', done: true },
              { step: '5', text: 'Add CRON_SECRET=any-random-string to .env.local', done: true },
              { step: '6', text: 'Add SUPABASE_SERVICE_ROLE_KEY to .env.local (from Supabase → Settings → API)', done: true },
              { step: '7', text: 'Run migration 002_push_subscriptions.sql in Supabase SQL Editor', done: true },
              { step: '8', text: 'Add all above vars to Vercel Environment Variables', done: false },
              { step: '9', text: 'Deploy to Vercel — vercel.json cron runs at 7am UTC daily', done: false },
            ].map(({ step, text, done }) => (
              <div key={step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: done ? 'rgba(61,220,132,0.15)' : 'var(--bg4)', border: `1px solid ${done ? 'var(--green)' : 'var(--border2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0, color: done ? 'var(--green)' : 'var(--text3)' }}>
                  {done ? '✓' : step}
                </div>
                <div style={{ fontSize: 12, color: done ? 'var(--text2)' : 'var(--text)', lineHeight: 1.4, fontFamily: text.startsWith('Run:') || text.startsWith('Add') ? 'var(--font-mono)' : 'var(--font-syne)', textDecoration: done ? 'none' : 'none' }}>
                  {text}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
