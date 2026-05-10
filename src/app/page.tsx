'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { TRACK_META, PHASES, getCurrentWeek, TOTAL_WEEKS, type TrackStats, type UserStats } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts'
import { format, subDays } from 'date-fns'
import { motion } from 'framer-motion'

export default function AnalyticsPage() {
  const supabase = createClient()
  const week     = getCurrentWeek()

  const [trackStats, setTrackStats] = useState<TrackStats[]>([])
  const [userStats,  setUserStats]  = useState<UserStats | null>(null)
  const [daily,      setDaily]      = useState<{ date: string; hours: number; done: number }[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Build last 14 days data
    const last14 = Array.from({ length: 14 }, (_, i) => format(subDays(new Date(), 13 - i), 'yyyy-MM-dd'))

    const [trackRes, statsRes, taskRes] = await Promise.all([
      supabase.from('track_stats').select('*').eq('user_id', user.id),
      supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
      supabase.from('tasks').select('due_date, hours, status').eq('user_id', user.id).in('due_date', last14),
    ])

    if (trackRes.data) setTrackStats(trackRes.data)
    if (statsRes.data) setUserStats(statsRes.data)

    if (taskRes.data) {
      const byDate: Record<string, { hours: number; done: number }> = {}
      last14.forEach(d => { byDate[d] = { hours: 0, done: 0 } })
      taskRes.data.forEach(t => {
        if (!byDate[t.due_date]) return
        if (t.status === 'done') {
          byDate[t.due_date].hours += t.hours ?? 0
          byDate[t.due_date].done++
        }
      })
      setDaily(last14.map(d => ({ date: format(new Date(d + 'T00:00'), 'dd MMM'), ...byDate[d] })))
    }

    setLoading(false)
  }

  const milestones = [
    { week: 8,  label: 'Project 1: GDPR RAG Chatbot live' },
    { week: 27, label: 'AWS Solutions Architect Associate' },
    { week: 34, label: 'CKA + Goethe B1' },
    { week: 45, label: 'AWS Professional Solutions Architect' },
    { week: 51, label: 'CISM + Goethe B2' },
    { week: 66, label: 'Arrive in Germany' },
    { week: 82, label: 'Senior / Staff Engineer' },
    { week: 104, label: 'TOP 0.1% — Goal Achieved' },
  ]

  const tooltipStyle = {
    backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 8, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text)',
  }

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>

  return (
    <div>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>Analytics</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>Week {week} of {TOTAL_WEEKS} · Progress intelligence</div>
      </div>

      <div style={{ padding: '20px 24px' }}>

        {/* KPI row */}
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { val: userStats?.total_done ?? 0,       label: 'TASKS DONE',      color: 'var(--ml)',    border: 'var(--ml)' },
            { val: userStats?.total_remaining ?? 0,  label: 'REMAINING',       color: 'var(--cloud)', border: 'var(--cloud)' },
            { val: `${(userStats?.total_hours ?? 0).toFixed(1)}h`, label: 'DEEP WORK TOTAL', color: 'var(--green)', border: 'var(--green)' },
            { val: `${Math.round(week / TOTAL_WEEKS * 100)}%`, label: 'ROADMAP DONE', color: 'var(--amber)', border: 'var(--data)' },
          ].map(({ val, label, color, border }) => (
            <motion.div key={label} className="animate-slide-up" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderTop: `2px solid ${border}`, borderRadius: 'var(--r2)', padding: 16 }}>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, color }}>{val}</div>
              <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>

          {/* Daily hours chart */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Daily Deep Work Hours (14 days)</div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={daily} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c5cfc" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c5cfc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text3)', fontFamily: 'var(--font-mono)' }} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text3)', fontFamily: 'var(--font-mono)' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="hours" stroke="#7c5cfc" strokeWidth={2} fill="url(#hoursGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Tasks by track */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Completed Tasks by Track</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={trackStats.map(t => ({ name: t.track, done: t.done_count, hours: t.hours_invested }))} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text3)', fontFamily: 'var(--font-mono)' }} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text3)', fontFamily: 'var(--font-mono)' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="done" fill="#7c5cfc" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Track balance */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Track Balance — Hours Invested</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(Object.entries(TRACK_META) as [string, { color: string; bg: string; label: string }][]).map(([track, meta]) => {
              const ts    = trackStats.find(t => t.track === track)
              const hours = ts?.hours_invested ?? 0
              const done  = ts?.done_count ?? 0
              const max   = Math.max(...trackStats.map(t => t.hours_invested), 1)
              return (
                <div key={track}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: meta.color }}>{meta.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{hours.toFixed(1)}h · {done} tasks</div>
                  </div>
                  <div style={{ height: 5, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${hours / max * 100}%` }} transition={{ duration: 0.9, ease: 'easeOut' }}
                      style={{ height: '100%', borderRadius: 3, background: meta.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Milestone tracker */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Milestone Tracker</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {milestones.map(m => {
              const achieved = week >= m.week
              const isCurrent = !achieved && milestones.find(x => !( week >= x.week)) === m
              return (
                <div key={m.week} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, background: achieved ? 'rgba(61,220,132,0.15)' : isCurrent ? 'rgba(124,92,252,0.15)' : 'var(--bg4)', border: `2px solid ${achieved ? 'var(--green)' : isCurrent ? 'var(--accent)' : 'var(--border2)'}` }}>
                    {achieved ? '✓' : isCurrent ? '▶' : '○'}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: achieved ? 'var(--green)' : isCurrent ? 'var(--text)' : 'var(--text2)' }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                      Week {m.week} · {achieved ? 'Achieved ✓' : isCurrent ? `${m.week - week} weeks away` : 'Upcoming'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
